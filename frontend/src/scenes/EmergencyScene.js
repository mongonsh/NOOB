import { C, W, H, TEXT } from '../config/constants.js';

export class EmergencyScene extends Phaser.Scene {
  constructor() {
    super('EmergencyScene');
    this.socket = null;
    this.sessionId = null;
    this.isConnected = false;
    this.transcriptEntries = [];
    this.socketIORetryCount = 0;
    this.maxSocketIORetries = 3;
    this.isCameraActive = false;
    this.videoElement = null;
  }

  create() {
    this.cameras.main.setBackgroundColor(C.BG);
    this.cameras.main.fadeIn(500);

    this._createHeader();
    this._createStatusIndicator();
    this._createTranscriptArea();
    this._createVoiceControls();
    this._createVisualControls();
    this._createComingSoonMessage();

    // Add Start Overlay to prevent early voice greeting
    this._createStartOverlay();
  }

  _createStartOverlay() {
    this.startOverlay = this.add.container(0, 0).setDepth(1000);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.95);
    bg.fillRect(0, 0, W, H);

    const btnW = 340;
    const btnH = 80;
    const btnX = W / 2 - btnW / 2;
    const btnY = H / 2 - btnH / 2;

    const startBtn = this.add.graphics();
    startBtn.fillStyle(C.ORANGE, 1);
    startBtn.fillRoundedRect(btnX, btnY, btnW, btnH, 12);

    const title = this.add.text(W / 2, H / 2 - 100, 'EMERGENCY AI CONSULTANT', {
      fontSize: '32px',
      fontFamily: 'Courier New',
      color: TEXT.ORANGE,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const desc = this.add.text(W / 2, H / 2 - 50, 'Click button below to initiate secure voice link', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY
    }).setOrigin(0.5);

    const startText = this.add.text(W / 2, H / 2, 'START ASSISTANCE', {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    startBtn.setInteractive(new Phaser.Geom.Rectangle(btnX, btnY, btnW, btnH), Phaser.Geom.Rectangle.Contains);

    startBtn.on('pointerover', () => {
      startBtn.clear();
      startBtn.fillStyle(0xff8c00, 1);
      startBtn.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
      this.tweens.add({ targets: startText, scale: 1.05, duration: 200 });
    });

    startBtn.on('pointerout', () => {
      startBtn.clear();
      startBtn.fillStyle(C.ORANGE, 1);
      startBtn.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
      this.tweens.add({ targets: startText, scale: 1, duration: 200 });
    });

    startBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: this.startOverlay,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.startOverlay.destroy();
          this._initializeSocketIO();
        }
      });
    });

    this.startOverlay.add([bg, title, desc, startBtn, startText]);
  }

  _initializeSocketIO() {
    try {
      // Check if io is available (Socket.IO client library)
      if (typeof io === 'undefined') {
        this.socketIORetryCount++;
        console.error(`[Emergency] Socket.IO client library not loaded (attempt ${this.socketIORetryCount}/${this.maxSocketIORetries})`);

        if (this.socketIORetryCount < this.maxSocketIORetries) {
          console.log('[Emergency] Waiting for library to load...');
          // Try again after a delay
          this.time.delayedCall(500, () => {
            this._initializeSocketIO();
          });
          return;
        } else {
          console.error('[Emergency] Socket.IO library failed to load after multiple attempts');
          this._showError('Socket.IO library not available. Please check your internet connection and refresh the page.');
          this._updateConnectionStatus('error', 'Library not loaded');
          return;
        }
      }

      // Reset retry counter on success
      this.socketIORetryCount = 0;
      console.log('[Emergency] Socket.IO library detected, initializing connection...');

      // Connect to backend Socket.IO server
      const backendUrl = 'http://localhost:5001';
      this.socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 10000
      });

      // Set up event listeners
      this._setupSocketListeners();

      console.log('[Emergency] Socket.IO initialization complete');
    } catch (error) {
      console.error('[Emergency] Socket.IO initialization error:', error);
      this._showError('Failed to initialize connection: ' + error.message);
      this._updateConnectionStatus('error', 'Initialization failed');
    }
  }

  _setupSocketListeners() {
    // Connection established
    this.socket.on('connect', () => {
      console.log('[Emergency] Socket.IO connected');
      this._updateConnectionStatus('connecting', 'Connecting to assistant...');

      // Clear any previous error state
      this.connectionErrors = 0;

      // Request emergency session
      try {
        this.socket.emit('emergency:connect', {
          userId: 'user-' + Date.now(),
          manualId: null
        });
      } catch (error) {
        console.error('[Emergency] Failed to emit connect event:', error);
        this._showError('Failed to start session: ' + error.message);
        this._updateConnectionStatus('error', 'Session start failed');
      }
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[Emergency] Connection error:', error);
      this.connectionErrors = (this.connectionErrors || 0) + 1;

      let errorMessage = 'Connection failed';
      if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout - server not responding';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Server unavailable - please check if backend is running';
      } else {
        errorMessage = `Connection error: ${error.message}`;
      }

      this._showError(errorMessage);
      this._updateConnectionStatus('error', `Error (attempt ${this.connectionErrors})`);

      // After 3 failed attempts, suggest manual intervention
      if (this.connectionErrors >= 3) {
        this._showError('Multiple connection failures. Please check your network and refresh the page.');
      }
    });

    // Connection timeout
    this.socket.on('connect_timeout', () => {
      console.error('[Emergency] Connection timeout');
      this._showError('Connection timeout - server took too long to respond');
      this._updateConnectionStatus('error', 'Connection timeout');
    });

    // Session started
    this.socket.on('emergency:started', (data) => {
      console.log('[Emergency] Session started:', data);
      this.sessionId = data.sessionId;
      this.isConnected = true;
      this.connectionErrors = 0;
      this._updateConnectionStatus('connected', 'Connected');
      this._removeComingSoonMessage();

      // Show welcome message if provided
      if (data.message) {
        this._addSystemMessage(data.message);
      }
    });

    // Transcript update
    this.socket.on('emergency:transcript', (data) => {
      console.log('[Emergency] Transcript update:', data);
      if (data.entry) {
        this._addTranscriptEntry(data.entry);
      }
    });

    // Audio response (non-streaming)
    this.socket.on('emergency:audio', (data) => {
      console.log('[Emergency] Audio response:', data);
      if (data.audioUrl) {
        this._playAudioResponse(data.audioUrl);
      }
    });

    // Streaming audio chunk
    this.socket.on('emergency:audioStream', (data) => {
      console.log('[Emergency] Audio stream chunk:', data.chunkNumber);
      if (data.audioChunk) {
        this._handleAudioStreamChunk(data.audioChunk, data.chunkNumber);
      }
    });

    // Streaming audio complete
    this.socket.on('emergency:audioStreamComplete', (data) => {
      console.log('[Emergency] Audio stream complete:', data.totalChunks, 'chunks');
      this._finalizeAudioStream();
    });

    // Image analysis result
    this.socket.on('emergency:imageAnalysis', (data) => {
      console.log('[Emergency] Image analysis:', data);
      this._addSystemMessage('Image Analysis: ' + data.analysis);
    });

    // Error handling
    this.socket.on('emergency:error', (data) => {
      console.error('[Emergency] Server error:', data);
      const errorCode = data.code || 'UNKNOWN_ERROR';
      const errorMessage = data.message || 'An error occurred';

      // Handle specific error codes
      switch (errorCode) {
        case 'SESSION_NOT_FOUND':
          this._showError('Session expired. Please reconnect.');
          this._updateConnectionStatus('error', 'Session expired');
          break;
        case 'INVALID_DATA':
          this._showError('Invalid request. Please try again.');
          break;
        case 'CONNECTION_FAILED':
          this._showError('Connection failed: ' + errorMessage);
          this._updateConnectionStatus('error', 'Connection failed');
          break;
        case 'STREAMING_ERROR':
          this._showError('Audio streaming error: ' + errorMessage);
          // Clean up any partial audio stream
          this._cleanupAudioStream();
          break;
        default:
          this._showError(errorMessage);
      }
    });

    // Session ended
    this.socket.on('emergency:ended', (data) => {
      console.log('[Emergency] Session ended:', data);
      this.isConnected = false;
      this._updateConnectionStatus('disconnected', 'Session ended');
      this._addSystemMessage('Session ended. Duration: ' + Math.round(data.duration) + 's');
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('[Emergency] Socket.IO disconnected:', reason);
      this.isConnected = false;

      // Provide user-friendly disconnect messages
      let disconnectMessage = 'Disconnected';
      let shouldShowError = false;

      switch (reason) {
        case 'io server disconnect':
          disconnectMessage = 'Server disconnected';
          shouldShowError = true;
          this._addSystemMessage('Server disconnected the session. Attempting to reconnect...');
          // Server disconnected, try to reconnect
          this.socket.connect();
          break;
        case 'io client disconnect':
          disconnectMessage = 'Disconnected';
          this._addSystemMessage('Disconnected from server.');
          break;
        case 'ping timeout':
          disconnectMessage = 'Connection lost';
          shouldShowError = true;
          this._addSystemMessage('Connection lost due to timeout. Attempting to reconnect...');
          break;
        case 'transport close':
          disconnectMessage = 'Connection closed';
          shouldShowError = true;
          this._addSystemMessage('Connection closed unexpectedly. Attempting to reconnect...');
          break;
        case 'transport error':
          disconnectMessage = 'Connection error';
          shouldShowError = true;
          this._addSystemMessage('Connection error occurred. Attempting to reconnect...');
          break;
        default:
          disconnectMessage = `Disconnected: ${reason}`;
          shouldShowError = true;
          this._addSystemMessage(`Disconnected: ${reason}. Attempting to reconnect...`);
      }

      this._updateConnectionStatus('disconnected', disconnectMessage);

      if (shouldShowError) {
        this._showError(disconnectMessage);
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Emergency] Reconnection attempt:', attemptNumber);
      this._updateConnectionStatus('connecting', `Reconnecting (${attemptNumber}/5)...`);
      this._addSystemMessage(`Reconnection attempt ${attemptNumber} of 5...`);
    });

    // Reconnection successful
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[Emergency] Reconnected after', attemptNumber, 'attempts');
      this._addSystemMessage('Reconnected successfully!');
      this._updateConnectionStatus('connecting', 'Reconnected, resuming session...');

      // Try to resume the session if we have a session ID
      if (this.sessionId) {
        try {
          this.socket.emit('emergency:connect', {
            userId: 'user-' + Date.now(),
            manualId: null,
            resumeSessionId: this.sessionId
          });
        } catch (error) {
          console.error('[Emergency] Failed to resume session:', error);
          this._showError('Failed to resume session. Starting new session...');
        }
      }
    });

    // Reconnection error
    this.socket.on('reconnect_error', (error) => {
      console.error('[Emergency] Reconnection error:', error);
      this._showError('Reconnection error: ' + error.message);
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      console.error('[Emergency] Reconnection failed after all attempts');
      this._showError('Failed to reconnect after multiple attempts. Please refresh the page.');
      this._updateConnectionStatus('error', 'Reconnection failed');
      this._addSystemMessage('Unable to reconnect. Please refresh the page to try again.');
    });
  }

  _handleAudioStreamChunk(audioChunkB64, chunkNumber) {
    try {
      // Initialize audio stream context if this is the first chunk
      if (!this.audioStreamContext) {
        this.audioStreamContext = {
          chunks: [],
          audioContext: null,
          sourceNode: null,
          startTime: 0
        };

        // Create Web Audio API context for low-latency playback
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioStreamContext.audioContext = new AudioContext();
        this.audioStreamContext.startTime = this.audioStreamContext.audioContext.currentTime;

        console.log('[Emergency] Audio stream initialized');
      }

      // Decode base64 to binary
      const binaryString = atob(audioChunkB64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Store chunk
      this.audioStreamContext.chunks.push(bytes);

      // Decode and play audio chunk
      this.audioStreamContext.audioContext.decodeAudioData(
        bytes.buffer,
        (audioBuffer) => {
          // Create source node
          const source = this.audioStreamContext.audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.audioStreamContext.audioContext.destination);

          // Calculate when to start this chunk (for seamless playback)
          const now = this.audioStreamContext.audioContext.currentTime;
          const startTime = Math.max(now, this.audioStreamContext.startTime);

          // Play the chunk
          source.start(startTime);

          // Update start time for next chunk
          this.audioStreamContext.startTime = startTime + audioBuffer.duration;

          console.log(`[Emergency] Playing audio chunk ${chunkNumber} at ${startTime}`);
        },
        (error) => {
          console.error('[Emergency] Error decoding audio chunk:', error);
          // Try fallback method with audio element
          this._playAudioChunkFallback(bytes);
        }
      );

    } catch (error) {
      console.error('[Emergency] Error handling audio stream chunk:', error);
      this._addSystemMessage('System Error: Audio streaming failed.');
    }
  }

  _playAudioChunkFallback(audioBytes) {
    try {
      // Fallback: use audio element (higher latency but more compatible)
      const blob = new Blob([audioBytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.play().catch(error => {
        console.error('[Emergency] Fallback audio playback error:', error);
      });

      // Clean up URL after playback
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(url);
      });

    } catch (error) {
      console.error('[Emergency] Fallback audio playback error:', error);
    }
  }

  _finalizeAudioStream() {
    try {
      console.log('[Emergency] Audio stream finalized');

      // Optional: combine all chunks into a single audio file for replay
      if (this.audioStreamContext && this.audioStreamContext.chunks.length > 0) {
        // Create blob from all chunks
        const totalLength = this.audioStreamContext.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of this.audioStreamContext.chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        // Store combined audio for potential replay
        this.lastStreamedAudio = new Blob([combined], { type: 'audio/mpeg' });

        console.log('[Emergency] Combined audio stream saved for replay');
      }

    } catch (error) {
      console.error('[Emergency] Error finalizing audio stream:', error);
    } finally {
      // Clean up stream context (but keep the combined audio)
      if (this.audioStreamContext) {
        // Don't close audio context immediately - it might still be playing
        setTimeout(() => {
          if (this.audioStreamContext && this.audioStreamContext.audioContext) {
            this.audioStreamContext.audioContext.close();
          }
          this.audioStreamContext = null;
        }, 1000);
      }
    }
  }

  _cleanupAudioStream() {
    try {
      if (this.audioStreamContext) {
        if (this.audioStreamContext.audioContext) {
          this.audioStreamContext.audioContext.close();
        }
        this.audioStreamContext = null;
      }
      this.lastStreamedAudio = null;
      console.log('[Emergency] Audio stream cleaned up');
    } catch (error) {
      console.error('[Emergency] Error cleaning up audio stream:', error);
    }
  }

  _updateConnectionStatus(status, message) {
    // Update status indicator color and text
    if (this.statusDot) {
      let color;
      switch (status) {
        case 'connected':
          color = 0x4ecdc4; // Green
          break;
        case 'connecting':
          color = 0xffa500; // Orange
          break;
        case 'error':
          color = 0xff4444; // Red
          break;
        case 'disconnected':
        default:
          color = 0x888888; // Gray
          break;
      }
      this.statusDot.clear();
      this.statusDot.fillStyle(color, 1);
      this.statusDot.fillCircle(70, 140, 8);
    }

    if (this.statusText) {
      let textColor;
      switch (status) {
        case 'connected':
          textColor = TEXT.GREEN;
          break;
        case 'error':
          textColor = TEXT.ORANGE; // Use orange for errors (red might be too alarming)
          break;
        case 'connecting':
        case 'disconnected':
        default:
          textColor = TEXT.GRAY;
          break;
      }
      this.statusText.setText('Status: ' + message);
      this.statusText.setColor(textColor);
    }
  }

  _addTranscriptEntry(entry) {
    this.transcriptEntries.push(entry);
    this._refreshTranscript();
  }

  _addSystemMessage(message) {
    const entry = {
      timestamp: new Date().toISOString(),
      speaker: 'system',
      text: message
    };
    this._addTranscriptEntry(entry);
  }

  _playAudioResponse(audioUrl) {
    try {
      // Create audio element and play
      const audio = new Audio('http://localhost:5001' + audioUrl);

      audio.addEventListener('loadeddata', () => {
        console.log('[Emergency] Audio loaded, playing...');
        audio.play().catch(error => {
          console.error('[Emergency] Audio playback error:', error);
          this._addSystemMessage('System Error: Audio playback failed.');
        });
      });

      audio.addEventListener('error', (error) => {
        console.error('[Emergency] Audio loading error:', error);
        this._addSystemMessage('System Error: Failed to load audio response.');
      });

      audio.addEventListener('ended', () => {
        console.log('[Emergency] Audio playback completed');
      });

      // Store reference to current audio
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      this.currentAudio = audio;

    } catch (error) {
      console.error('[Emergency] Error playing audio:', error);
      this._addSystemMessage('System Error: Audio playback issue.');
    }
  }

  _refreshTranscript() {
    // Clear existing transcript content
    if (this.transcriptContainer) {
      this.transcriptContainer.removeAll(true);
    }

    // Build transcript with rich text formatting
    let yOffset = this.transcriptContentY;
    const lineHeight = 20;
    const messageSpacing = 10;

    // Create a container for all transcript entries
    const transcriptTexts = [];

    if (this.transcriptEntries.length === 0) {
      // Show placeholder
      this.transcriptContent = this.add.text(60, yOffset, 'No conversation yet.\nWaiting for connection...', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: TEXT.GRAY,
        lineSpacing: 6,
        wordWrap: { width: W - 140 },
      });
      this.transcriptContainer.add(this.transcriptContent);
      return;
    }

    // Display all entries (we'll handle scrolling separately)
    for (let i = 0; i < this.transcriptEntries.length; i++) {
      const entry = this.transcriptEntries[i];
      const time = new Date(entry.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Determine speaker label and color
      let speaker, speakerColor, textColor;
      if (entry.speaker === 'user') {
        speaker = 'You';
        speakerColor = TEXT.GREEN;
        textColor = '#ffffff';
      } else if (entry.speaker === 'assistant') {
        speaker = 'Assistant';
        speakerColor = TEXT.ORANGE;
        textColor = '#e0e0e0';
      } else {
        speaker = 'System';
        speakerColor = TEXT.GRAY;
        textColor = TEXT.GRAY;
      }

      // Create timestamp and speaker label
      const headerText = this.add.text(60, yOffset, `[${time}] ${speaker}:`, {
        fontSize: '13px',
        fontFamily: 'Courier New',
        color: speakerColor,
        fontStyle: 'bold',
      });
      transcriptTexts.push(headerText);
      yOffset += lineHeight;

      // Create message text
      const messageText = this.add.text(60, yOffset, entry.text, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: textColor,
        lineSpacing: 4,
        wordWrap: { width: W - 140 },
      });
      transcriptTexts.push(messageText);

      // Calculate actual height of wrapped text
      const textHeight = messageText.height;
      yOffset += textHeight + messageSpacing;
    }

    // Add all texts to container
    transcriptTexts.forEach(text => {
      // Make sure y is relative to container (which is at 0, 0)
      this.transcriptContainer.add(text);
    });

    // Store the total content height
    this.transcriptContentHeight = yOffset - this.transcriptContentY;

    // Auto-scroll to bottom if content exceeds visible area
    if (this.transcriptContentHeight > this.transcriptMaxHeight) {
      const scrollAmount = this.transcriptContentHeight - this.transcriptMaxHeight;
      this.transcriptScrollOffset = -scrollAmount;

      // Animate scroll to bottom
      this.tweens.add({
        targets: this.transcriptContainer,
        y: this.transcriptScrollOffset,
        duration: 300,
        ease: 'Cubic.easeOut'
      });
    } else {
      // Reset scroll if content fits
      this.transcriptScrollOffset = 0;
      this.transcriptContainer.y = 0;
    }
  }

  _showError(message) {
    console.error('[Emergency] Error:', message);
    this._addSystemMessage('ERROR: ' + message);
  }

  _removeComingSoonMessage() {
    // Remove the "Coming Soon" overlay when connected
    if (this.comingSoonOverlay) {
      this.tweens.add({
        targets: this.comingSoonOverlay,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.comingSoonOverlay.forEach(obj => obj.destroy());
          this.comingSoonOverlay = null;
        }
      });
    }
  }

  shutdown() {
    // Stop any voice recording
    if (this.isRecording) {
      this._stopVoiceRecording();
    }

    // Stop any playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Clean up audio streaming
    this._cleanupAudioStream();

    // Clean up transcript container
    if (this.transcriptContainer) {
      this.transcriptContainer.destroy();
      this.transcriptContainer = null;
    }

    // Clean up Socket.IO connection when scene is destroyed
    if (this.socket) {
      if (this.sessionId && this.isConnected) {
        this.socket.emit('emergency:end', {
          sessionId: this.sessionId,
          resolution: 'incomplete'
        });
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }

  _createHeader() {
    // Header background
    const headerBg = this.add.graphics();
    headerBg.fillStyle(C.PANEL, 0.9);
    headerBg.fillRect(0, 0, W, 80);
    headerBg.lineStyle(2, C.ORANGE, 0.5);
    headerBg.lineBetween(0, 80, W, 80);

    // Emergency title (no emoji)
    const title = this.add.text(40, 40, 'EMERGENCY ASSISTANT', {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: TEXT.ORANGE,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Back button
    const backBtn = this.add.text(W - 40, 40, '[BACK]', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    backBtn.setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setColor(TEXT.GREEN);
      this.tweens.add({
        targets: backBtn,
        scale: 1.1,
        duration: 150,
      });
    });

    backBtn.on('pointerout', () => {
      backBtn.setColor(TEXT.GRAY);
      this.tweens.add({
        targets: backBtn,
        scale: 1,
        duration: 150,
      });
    });

    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    // Settings button
    const settingsBtn = this.add.text(W - 140, 40, '[SETTINGS]', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    settingsBtn.setInteractive({ useHandCursor: true });

    settingsBtn.on('pointerover', () => {
      settingsBtn.setColor(TEXT.GREEN);
      this.tweens.add({
        targets: settingsBtn,
        scale: 1.1,
        duration: 150,
      });
    });

    settingsBtn.on('pointerout', () => {
      settingsBtn.setColor(TEXT.GRAY);
      this.tweens.add({
        targets: settingsBtn,
        scale: 1,
        duration: 150,
      });
    });

    settingsBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('SettingsScene');
      });
    });
  }

  _createStatusIndicator() {
    const statusY = 110;

    // Status panel
    const statusPanel = this.add.graphics();
    statusPanel.fillStyle(C.PANEL2, 0.8);
    statusPanel.fillRoundedRect(40, statusY, W - 80, 60, 10);
    statusPanel.lineStyle(2, C.GRAY, 0.3);
    statusPanel.strokeRoundedRect(40, statusY, W - 80, 60, 10);

    // Status indicator (disconnected by default)
    this.statusDot = this.add.graphics();
    this.statusDot.fillStyle(0x888888, 1);
    this.statusDot.fillCircle(70, statusY + 30, 8);

    this.statusText = this.add.text(90, statusY + 30, 'Status: Disconnected', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Duration (placeholder)
    this.durationText = this.add.text(W - 70, statusY + 30, 'Duration: 00:00', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
    }).setOrigin(1, 0.5);
  }

  _createTranscriptArea() {
    const transcriptY = 200;
    const transcriptHeight = 280;

    // Store transcript dimensions for scrolling
    this.transcriptY = transcriptY;
    this.transcriptHeight = transcriptHeight;
    this.transcriptContentY = transcriptY + 70;
    this.transcriptMaxHeight = transcriptHeight - 80;

    // Transcript panel
    const transcriptPanel = this.add.graphics();
    transcriptPanel.fillStyle(C.PANEL2, 0.6);
    transcriptPanel.fillRoundedRect(40, transcriptY, W - 80, transcriptHeight, 10);
    transcriptPanel.lineStyle(2, C.GRAY, 0.3);
    transcriptPanel.strokeRoundedRect(40, transcriptY, W - 80, transcriptHeight, 10);

    // Transcript header
    const transcriptHeader = this.add.text(60, transcriptY + 20, 'System Transcript', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: TEXT.ORANGE,
      fontStyle: 'bold',
    });

    // Separator line
    const separator = this.add.graphics();
    separator.lineStyle(1, C.GRAY, 0.3);
    separator.lineBetween(60, transcriptY + 50, W - 60, transcriptY + 50);

    // Create a container for transcript content (for scrolling)
    this.transcriptContainer = this.add.container(0, 0);

    // Create mask for transcript area to hide overflow
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(40, this.transcriptContentY, W - 80, this.transcriptMaxHeight);
    const mask = maskShape.createGeometryMask();
    this.transcriptContainer.setMask(mask);

    // Initial placeholder transcript content
    this.transcriptContent = this.add.text(60, this.transcriptContentY, 'No conversation yet.\nWaiting for connection...', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
      lineSpacing: 6,
      wordWrap: { width: W - 140 },
    });

    this.transcriptContainer.add(this.transcriptContent);

    // Track scroll offset
    this.transcriptScrollOffset = 0;
  }

  _createVoiceControls() {
    const voiceY = 510;

    // Voice panel
    const voicePanel = this.add.graphics();
    voicePanel.fillStyle(C.PANEL2, 0.8);
    voicePanel.fillRoundedRect(40, voiceY, W - 80, 120, 10);
    voicePanel.lineStyle(2, C.GRAY, 0.3);
    voicePanel.strokeRoundedRect(40, voiceY, W - 80, 120, 10);

    // Voice header
    const voiceHeader = this.add.text(60, voiceY + 20, 'Voice Input', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: TEXT.ORANGE,
      fontStyle: 'bold',
    });

    // Voice recording status
    this.voiceStatusText = this.add.text(W / 2, voiceY + 55, 'Press and hold to speak', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
      align: 'center',
    }).setOrigin(0.5);

    // Large microphone button
    const micBtnSize = 70;
    this.micButton = this.add.graphics();
    this.micButton.fillStyle(C.PANEL, 1);
    this.micButton.fillCircle(W / 2, voiceY + 90, micBtnSize / 2);
    this.micButton.lineStyle(3, TEXT.GREEN, 1);
    this.micButton.strokeCircle(W / 2, voiceY + 90, micBtnSize / 2);

    // Subtle mic design instead of emoji
    this.micIcon = this.add.graphics();
    this.micIcon.lineStyle(3, TEXT.ORANGE, 1);
    this.micIcon.strokeRoundedRect(W / 2 - 10, voiceY + 80, 20, 20, 5);

    // Make button interactive
    this.micButton.setInteractive(
      new Phaser.Geom.Circle(W / 2, voiceY + 90, micBtnSize / 2),
      Phaser.Geom.Circle.Contains
    );
    this.micButton.on('pointerdown', () => this._startVoiceRecording());
    this.micButton.on('pointerup', () => this._stopVoiceRecording());
    this.micButton.on('pointerout', () => this._stopVoiceRecording());

    // Hover effect
    this.micButton.on('pointerover', () => {
      if (!this.isRecording) {
        this.tweens.add({
          targets: [this.micButton, this.micIcon],
          scale: 1.1,
          duration: 200,
          ease: 'Back.out',
        });
      }
    });

    this.micButton.on('pointerout', () => {
      if (!this.isRecording) {
        this.tweens.add({
          targets: [this.micButton, this.micIcon],
          scale: 1,
          duration: 200,
          ease: 'Back.in',
        });
      }
    });

    // Initialize recording state
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  async _startVoiceRecording() {
    if (this.isRecording) return;

    if (!this.isConnected || !this.sessionId) {
      this._showError('Not connected. Please wait for connection.');
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.isRecording = true;
      this.audioChunks = [];

      // Update UI: Use orange border instead of red circle
      this.micButton.clear();
      this.micButton.fillStyle(C.PANEL, 1);
      this.micButton.fillCircle(W / 2, 600, 35);
      this.micButton.lineStyle(4, TEXT.ORANGE, 1);
      this.micButton.strokeCircle(W / 2, 600, 35);

      this.voiceStatusText.setText('Recording... Release to send');
      this.voiceStatusText.setColor(TEXT.ORANGE);

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        // Send audio to backend
        this._sendVoiceMessage();

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      console.log('[Emergency] Voice recording started');

    } catch (error) {
      console.error('[Emergency] Microphone access error:', error);
      this._showError('Microphone access denied. Please allow microphone access.');
      this.isRecording = false;
    }
  }

  _stopVoiceRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;

    this.isRecording = false;

    // Stop recording
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Reset UI
    this.micButton.clear();
    this.micButton.fillStyle(C.PANEL, 1);
    this.micButton.fillCircle(W / 2, 600, 35);
    this.micButton.lineStyle(3, TEXT.GREEN, 1);
    this.micButton.strokeCircle(W / 2, 600, 35);

    this.voiceStatusText.setText('Press and hold to speak');
    this.voiceStatusText.setColor(TEXT.GRAY);

    // Stop pulse animation
    this.tweens.killTweensOf([this.micButton, this.micIcon]);
    this.micButton.setScale(1);
    this.micIcon.setScale(1);

    console.log('[Emergency] Voice recording stopped');
  }

  async _sendVoiceMessage() {
    if (this.audioChunks.length === 0) {
      console.log('[Emergency] No audio data to send');
      return;
    }

    try {
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];

        // Send to backend
        this.socket.emit('emergency:audio', {
          sessionId: this.sessionId,
          audioData: base64Audio
        });

        console.log('[Emergency] Voice message sent:', audioBlob.size, 'bytes');

        // Show processing indicator
        this.voiceStatusText.setText('Processing voice...');
        this.voiceStatusText.setColor(TEXT.ORANGE);

        // Reset after a delay
        this.time.delayedCall(2000, () => {
          if (this.voiceStatusText) {
            this.voiceStatusText.setText('Press and hold to speak');
            this.voiceStatusText.setColor(TEXT.GRAY);
          }
        });
      };

      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('[Emergency] Error sending voice message:', error);
      this._showError('Failed to send voice message: ' + error.message);
    }
  }

  _createVisualControls() {
    const visualY = 660;

    // Visual panel
    const visualPanel = this.add.graphics();
    visualPanel.fillStyle(C.PANEL2, 0.8);
    visualPanel.fillRoundedRect(40, visualY, W - 80, 70, 10);
    visualPanel.lineStyle(2, C.GRAY, 0.3);
    visualPanel.strokeRoundedRect(40, visualY, W - 80, 70, 10);

    // Visual header
    const visualHeader = this.add.text(60, visualY + 20, 'Visual Input', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: TEXT.ORANGE,
      fontStyle: 'bold',
    });

    // Button positions
    const btnY = visualY + 45;
    const btnSpacing = 200;
    const startX = 200;

    // Take Photo button
    const photoBtn = this._createButton(startX, btnY, 'TAKE PHOTO', () => this._handleTakePhoto());

    // Upload Image button
    const uploadBtn = this._createButton(startX + btnSpacing, btnY, 'UPLOAD IMAGE', () => this._handleImageUpload());

    // Camera button
    const cameraBtn = this._createButton(startX + btnSpacing * 2, btnY, 'CAMERA', () => this._handleCameraToggle());
  }

  _createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
      backgroundColor: C.PANEL,
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5);

    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setColor(TEXT.GREEN);
      btn.setBackgroundColor('#1a1a35');
      this.tweens.add({
        targets: btn,
        scale: 1.05,
        duration: 150,
      });
    });

    btn.on('pointerout', () => {
      btn.setColor(TEXT.GRAY);
      btn.setBackgroundColor('#12122a');
      this.tweens.add({
        targets: btn,
        scale: 1,
        duration: 150,
      });
    });

    btn.on('pointerdown', () => {
      if (callback) callback();
    });

    return btn;
  }

  async _handleCameraToggle() {
    if (this.isCameraActive) {
      this._stopCamera();
    } else {
      await this._startCamera();
    }
  }

  async _startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = stream;
      this.videoElement.play();
      this.isCameraActive = true;
      this._addSystemMessage('Camera activated.');
    } catch (err) {
      console.error('Camera access denied:', err);
      this._showError('Camera access denied.');
    }
  }

  _stopCamera() {
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement = null;
    }
    this.isCameraActive = false;
    this._addSystemMessage('Camera deactivated.');
  }

  _handleTakePhoto() {
    if (!this.isCameraActive || !this.videoElement) {
      this._showError('Please activate CAMERA first.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.videoElement, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    this._sendImageToAssistant(imageData);
  }

  _handleImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        this._sendImageToAssistant(event.target.result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  _sendImageToAssistant(imageData) {
    if (!this.isConnected || !this.sessionId) {
      this._showError('Not connected to assistant.');
      return;
    }

    this._addSystemMessage('Analyzing image...');

    this.socket.emit('emergency:image', {
      sessionId: this.sessionId,
      imageData: imageData,
      mimeType: 'image/jpeg'
    });
  }

  _createComingSoonMessage() {
    // Coming soon overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, W, H);

    const message = this.add.text(W / 2, H / 2 - 50, 'EMERGENCY ASSISTANT', {
      fontSize: '36px',
      fontFamily: 'Courier New',
      color: TEXT.ORANGE,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const comingSoon = this.add.text(W / 2, H / 2 + 20, 'Connecting...', {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: TEXT.GREEN,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const description = this.add.text(W / 2, H / 2 + 70, 'Establishing connection to emergency assistant.\nPlease wait...', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Store references for later removal
    this.comingSoonOverlay = [overlay, message, comingSoon, description];

    // Pulsing animation
    this.tweens.add({
      targets: comingSoon,
      alpha: { from: 0.6, to: 1 },
      scale: { from: 0.95, to: 1.05 },
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: 'Sine.inOut',
    });
  }
}
