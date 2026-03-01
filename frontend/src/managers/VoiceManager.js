import { APIManager } from './APIManager.js';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/constants.js';

const audioEl = () => document.getElementById('noob-audio');

export const VoiceManager = {
  _recorder: null,
  _chunks: [],
  _stream: null,
  _socket: null,
  isRecording: false,

  /** Initialize WebSocket connection */
  initSocket() {
    if (this._socket) return;
    
    const socketUrl = API_BASE_URL.replace('/api', '');
    this._socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    this._socket.on('connect', () => {
      console.log('[VoiceManager] WebSocket connected');
    });

    this._socket.on('disconnect', () => {
      console.log('[VoiceManager] WebSocket disconnected');
    });

    this._socket.on('connected', (data) => {
      console.log('[VoiceManager] Server ready:', data);
    });
  },

  /** Play text via ElevenLabs TTS */
  async speak(text, emotion = 'neutral') {
    try {
      // Clean text: remove markdown formatting
      const cleanText = text
        .replace(/\*\*/g, '')  // Remove bold **
        .replace(/\*/g, '')    // Remove italic *
        .replace(/_/g, '')     // Remove underscores
        .replace(/`/g, '')     // Remove code backticks
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
        .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
        .trim();
      
      if (!cleanText) {
        console.warn('[VoiceManager] No text to speak after cleaning');
        return;
      }
      
      const blob = await APIManager.speak(cleanText, emotion);
      const url = URL.createObjectURL(blob);
      const el = audioEl();
      el.src = url;
      await el.play();
      return new Promise((resolve) => {
        el.onended = () => { URL.revokeObjectURL(url); resolve(); };
      });
    } catch (e) {
      console.warn('[VoiceManager] speak error:', e.message);
    }
  },

  /** Start recording microphone audio */
  async startRecording() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._chunks = [];
      this._recorder = new MediaRecorder(this._stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      this._recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this._chunks.push(e.data);
      };
      this._recorder.start();
      this.isRecording = true;
    } catch (e) {
      console.warn('[VoiceManager] mic access denied:', e.message);
      throw e;
    }
  },

  /** Stop recording and return transcribed text (WebSocket with HTTP fallback) */
  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this._recorder) { reject(new Error('Not recording')); return; }

      this._recorder.onstop = async () => {
        try {
          const blob = new Blob(this._chunks, { type: 'audio/webm' });
          this._stream.getTracks().forEach((t) => t.stop());
          this.isRecording = false;

          // Try WebSocket first, fallback to HTTP
          if (this._socket && this._socket.connected) {
            console.log('[VoiceManager] Using WebSocket for transcription');
            
            // Convert blob to base64 for WebSocket
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result.split(',')[1];
              
              // Set up listeners
              const onResult = (data) => {
                this._socket.off('transcription_result', onResult);
                this._socket.off('transcription_error', onError);
                resolve(data.text || '');
              };
              
              const onError = (data) => {
                this._socket.off('transcription_result', onResult);
                this._socket.off('transcription_error', onError);
                console.warn('[VoiceManager] WebSocket error, falling back to HTTP');
                // Fallback to HTTP
                this._httpTranscribe(blob).then(resolve).catch(reject);
              };
              
              this._socket.once('transcription_result', onResult);
              this._socket.once('transcription_error', onError);
              
              // Send audio
              this._socket.emit('audio_stream', { audio: base64Audio });
              
              // Timeout fallback
              setTimeout(() => {
                this._socket.off('transcription_result', onResult);
                this._socket.off('transcription_error', onError);
                console.warn('[VoiceManager] WebSocket timeout, falling back to HTTP');
                this._httpTranscribe(blob).then(resolve).catch(reject);
              }, 10000);
            };
            reader.readAsDataURL(blob);
          } else {
            // Use HTTP fallback
            console.log('[VoiceManager] Using HTTP for transcription');
            const text = await this._httpTranscribe(blob);
            resolve(text);
          }
        } catch (e) {
          reject(e);
        }
      };
      this._recorder.stop();
    });
  },

  /** HTTP fallback for transcription */
  async _httpTranscribe(blob) {
    const result = await APIManager.listen(blob);
    return result.text || '';
  },
};
