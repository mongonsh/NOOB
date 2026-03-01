"""
Emergency Assistant Service

Manages real-time emergency assistance sessions with voice interaction,
image analysis, and document-based guidance.

This is the MVP stub - full integration with ElevenLabs, Mistral RAG,
and image analysis will be added in future phases.
"""

import uuid
import json
import os
import base64
from datetime import datetime
from typing import Dict, List, Optional
from flask_socketio import emit
from services.elevenlabs_service import get_elevenlabs_service
from services.voice_service import speech_to_text
from services.mistral_service import transcribe_audio


class EmergencySession:
    """Represents an active emergency assistance session"""
    
    def __init__(self, user_id: str, manual_id: Optional[str] = None):
        self.session_id = str(uuid.uuid4())
        self.user_id = user_id
        self.manual_id = manual_id
        self.start_time = datetime.now()
        self.end_time: Optional[datetime] = None
        self.status = 'active'  # active, ended, disconnected
        self.transcript: List[Dict] = []
        self.images: List[Dict] = []
        self.documents_referenced: List[str] = []
        
    def add_transcript_entry(self, speaker: str, text: str, audio_url: Optional[str] = None):
        """Add an entry to the conversation transcript"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'speaker': speaker,  # 'user' or 'assistant'
            'text': text,
            'audio_url': audio_url
        }
        self.transcript.append(entry)
        return entry
    
    def add_image(self, image_id: str, url: str, analysis: str = ""):
        """Add an image to the session"""
        image_data = {
            'image_id': image_id,
            'timestamp': datetime.now().isoformat(),
            'url': url,
            'analysis': analysis,
            'thumbnail_url': url  # TODO: Generate thumbnail
        }
        self.images.append(image_data)
        return image_data
    
    def end_session(self, resolution: str = 'incomplete'):
        """End the emergency session"""
        self.end_time = datetime.now()
        self.status = 'ended'
        return {
            'session_id': self.session_id,
            'duration': (self.end_time - self.start_time).total_seconds(),
            'resolution': resolution
        }
    
    def to_dict(self) -> Dict:
        """Convert session to dictionary for JSON serialization"""
        return {
            'session_id': self.session_id,
            'user_id': self.user_id,
            'manual_id': self.manual_id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status,
            'transcript': self.transcript,
            'images': self.images,
            'documents_referenced': self.documents_referenced
        }


class EmergencyAssistantService:
    """Service for managing emergency assistance sessions"""
    
    def __init__(self, session_storage_path: str = "data/emergency_sessions"):
        self.active_sessions: Dict[str, EmergencySession] = {}
        self.session_history: List[EmergencySession] = []
        self.session_storage_path = session_storage_path
        
        # Initialize ElevenLabs service
        try:
            self.elevenlabs_service = get_elevenlabs_service()
            print("[Emergency] ElevenLabs service initialized")
        except Exception as e:
            print(f"[Emergency] Warning: ElevenLabs service not available: {str(e)}")
            self.elevenlabs_service = None
        
        # Create storage directory if it doesn't exist
        os.makedirs(session_storage_path, exist_ok=True)
        
        # Load any existing sessions on startup
        self._load_sessions()
    
    def _load_sessions(self):
        """Load saved sessions from storage"""
        try:
            history_file = os.path.join(self.session_storage_path, "session_history.json")
            if os.path.exists(history_file):
                with open(history_file, 'r') as f:
                    sessions_data = json.load(f)
                    print(f"[Emergency] Loaded {len(sessions_data)} sessions from history")
        except Exception as e:
            print(f"[Emergency] Error loading sessions: {str(e)}")
    
    def _save_session(self, session: EmergencySession):
        """Save session to persistent storage"""
        try:
            # Save individual session file
            session_file = os.path.join(self.session_storage_path, f"{session.session_id}.json")
            with open(session_file, 'w') as f:
                json.dump(session.to_dict(), f, indent=2)
            
            # Update session history file
            history_file = os.path.join(self.session_storage_path, "session_history.json")
            history = []
            if os.path.exists(history_file):
                with open(history_file, 'r') as f:
                    history = json.load(f)
            
            # Add or update session in history
            session_dict = session.to_dict()
            history = [s for s in history if s['session_id'] != session.session_id]
            history.append(session_dict)
            
            with open(history_file, 'w') as f:
                json.dump(history, f, indent=2)
            
            print(f"[Emergency] Saved session {session.session_id}")
        except Exception as e:
            print(f"[Emergency] Error saving session: {str(e)}")
    
    def _load_session_from_file(self, session_id: str) -> Optional[EmergencySession]:
        """Load a specific session from storage"""
        try:
            session_file = os.path.join(self.session_storage_path, f"{session_id}.json")
            if not os.path.exists(session_file):
                return None
            
            with open(session_file, 'r') as f:
                data = json.load(f)
            
            # Reconstruct session object
            session = EmergencySession(data['user_id'], data.get('manual_id'))
            session.session_id = data['session_id']
            session.start_time = datetime.fromisoformat(data['start_time'])
            session.end_time = datetime.fromisoformat(data['end_time']) if data.get('end_time') else None
            session.status = data['status']
            session.transcript = data['transcript']
            session.images = data['images']
            session.documents_referenced = data['documents_referenced']
            
            return session
        except Exception as e:
            print(f"[Emergency] Error loading session {session_id}: {str(e)}")
            return None
    
    def create_session(self, user_id: str, manual_id: Optional[str] = None) -> EmergencySession:
        """Create a new emergency session"""
        session = EmergencySession(user_id, manual_id)
        self.active_sessions[session.session_id] = session
        self._save_session(session)  # Auto-save on creation
        print(f"[Emergency] Created session {session.session_id} for user {user_id}")
        return session
    
    def get_session(self, session_id: str) -> Optional[EmergencySession]:
        """Get an active session by ID"""
        return self.active_sessions.get(session_id)
    
    def resume_session(self, session_id: str) -> Optional[EmergencySession]:
        """Resume a disconnected session"""
        # Check if already active
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            if session.status == 'disconnected':
                session.status = 'active'
                self._save_session(session)
                print(f"[Emergency] Resumed session {session_id}")
            return session
        
        # Try to load from storage
        session = self._load_session_from_file(session_id)
        if session and session.status in ['active', 'disconnected']:
            session.status = 'active'
            self.active_sessions[session_id] = session
            self._save_session(session)
            print(f"[Emergency] Resumed session {session_id} from storage")
            return session
        
        return None
    
    def disconnect_session(self, session_id: str) -> Optional[Dict]:
        """Mark session as disconnected (can be resumed)"""
        session = self.active_sessions.get(session_id)
        if not session:
            return None
        
        session.status = 'disconnected'
        self._save_session(session)
        print(f"[Emergency] Session {session_id} disconnected")
        
        return {
            'session_id': session_id,
            'status': 'disconnected',
            'can_resume': True
        }
    
    def end_session(self, session_id: str, resolution: str = 'incomplete') -> Optional[Dict]:
        """End an emergency session"""
        session = self.active_sessions.get(session_id)
        if not session:
            return None
        
        result = session.end_session(resolution)
        self.session_history.append(session)
        self._save_session(session)  # Save final state
        del self.active_sessions[session_id]
        
        print(f"[Emergency] Ended session {session_id} - Duration: {result['duration']}s")
        return result
    
    def get_session_history(self, user_id: Optional[str] = None) -> List[Dict]:
        """Get session history, optionally filtered by user"""
        try:
            history_file = os.path.join(self.session_storage_path, "session_history.json")
            if not os.path.exists(history_file):
                return []
            
            with open(history_file, 'r') as f:
                history = json.load(f)
            
            if user_id:
                history = [s for s in history if s.get('user_id') == user_id]
            
            return history
        except Exception as e:
            print(f"[Emergency] Error getting session history: {str(e)}")
            return []
    
    def get_available_voices(self) -> List[Dict]:
        """Get list of available voice models"""
        if not self.elevenlabs_service:
            return []
        
        voices = self.elevenlabs_service.get_available_voices()
        return [
            {
                'id': voice_data['id'],
                'name': voice_data['name'],
                'description': voice_data['description']
            }
            for voice_data in voices.values()
        ]
    
    def change_voice(self, session_id: str, voice_name: str) -> Dict:
        """
        Change the voice for a session
        
        Args:
            session_id: Session ID
            voice_name: Name of the voice (e.g., 'rachel', 'adam')
        
        Returns:
            Dict with success status and voice info
        """
        session = self.get_session(session_id)
        if not session:
            return {'error': 'Session not found'}
        
        if not self.elevenlabs_service:
            return {'error': 'Voice service not available'}
        
        voice_id = self.elevenlabs_service.get_voice_id(voice_name)
        if not voice_id:
            return {'error': f'Voice "{voice_name}" not found'}
        
        # Store voice preference in session (we'll add this to the session model)
        # For now, just return success
        return {
            'success': True,
            'voice_id': voice_id,
            'voice_name': voice_name
        }
    
    def handle_audio_input(self, session_id: str, audio_data: bytes) -> Dict:
        """
        Handle incoming audio from user using real transcription
        """
        session = self.get_session(session_id)
        if not session:
            return {'error': 'Session not found'}
        
        try:
            # Transcribe audio using Mistral Voxtral
            from services.mistral_service import transcribe_audio
            transcript_text = transcribe_audio(audio_data)
            
            if not transcript_text:
                transcript_text = "[No speech detected]"
            
            session.add_transcript_entry('user', transcript_text)
            self._save_session(session)
            
            return {
                'success': True,
                'transcript': transcript_text
            }
        except Exception as e:
            print(f"[Emergency] Transcription error: {str(e)}")
            return {'error': f'Transcription failed: {str(e)}'}
    
    def handle_image_upload(self, session_id: str, image_data: bytes, mime_type: str) -> Dict:
        """
        Handle image upload and analyze with Mistral Vision (Pixtral)
        """
        session = self.get_session(session_id)
        if not session:
            return {'error': 'Session not found'}
        
        try:
            # Convert to base64 for Mistral API
            image_b64 = base64.b64encode(image_data).decode('utf-8')
            
            # Analyze image using Mistral Vision
            from services.mistral_service import analyze_emergency_image
            analysis = analyze_emergency_image(image_b64)
            
            image_id = str(uuid.uuid4())
            # Note: In a real app we'd save the image to disk/cloud storage
            # For this hackathon, we'll just process the buffer and keep the analysis
            image_url = f"/uploads/emergency/{session_id}/{image_id}.jpg"
            
            # Update session with image info
            # We add it as a system entry to the transcript so the assistant "sees" it
            session.add_transcript_entry('system', f"[Visual Analysis]: {analysis}")
            
            # Record the image in session metadata
            if not hasattr(session, 'images'):
                session.images = []
            session.images.append({
                'id': image_id,
                'url': image_url,
                'analysis': analysis,
                'timestamp': datetime.now().isoformat()
            })
            
            self._save_session(session)
            
            return {
                'success': True,
                'image_id': image_id,
                'url': image_url,
                'analysis': analysis
            }
        except Exception as e:
            print(f"[Emergency] Image analysis error: {str(e)}")
            return {'error': f'Image analysis failed: {str(e)}'}
    
    def generate_response(self, session_id: str, user_message: str, generate_audio: bool = True) -> Dict:
        """
        Generate AI response to user message
        
        MVP: Returns placeholder response
        TODO: Implement RAG with safety documents
        TODO: Integrate internet research capability
        
        Args:
            session_id: Session ID
            user_message: User's message
            generate_audio: Whether to generate audio response
        
        Returns:
            Dict with response text and optional audio
        """
        session = self.get_session(session_id)
        if not session:
            return {'error': 'Session not found'}
        
        # Add user message to transcript
        session.add_transcript_entry('user', user_message)
        
        # TODO: Search relevant documents using RAG
        # For now, generate a more helpful response based on the message
        assistant_response = f"I've analyzed your request: '{user_message}'. Based on the safety protocols, I recommend following the standard emergency procedures. I am currently operating in high-priority assistance mode to ensure your safety."
        
        # Generate audio if ElevenLabs is available and requested
        audio_url = None
        if generate_audio and self.elevenlabs_service:
            try:
                audio_bytes = self.elevenlabs_service.text_to_speech(
                    text=assistant_response,
                    stability=0.5,
                    similarity_boost=0.75
                )
                
                # Save audio to file (in production, upload to S3/CDN)
                audio_filename = f"{session_id}_{uuid.uuid4()}.mp3"
                audio_path = os.path.join(self.session_storage_path, audio_filename)
                with open(audio_path, 'wb') as f:
                    f.write(audio_bytes)
                
                audio_url = f"/api/emergency/audio/{audio_filename}"
                print(f"[Emergency] Generated audio response: {audio_filename}")
            except Exception as e:
                print(f"[Emergency] Error generating audio: {str(e)}")
        
        session.add_transcript_entry('assistant', assistant_response, audio_url)
        self._save_session(session)  # Auto-save after message exchange
        
        return {
            'success': True,
            'response': assistant_response,
            'audio_url': audio_url,
            'sources': []
        }
    
    def generate_response_stream(self, session_id: str, user_message: str):
        """
        Generate AI response with streaming audio
        
        This method yields audio chunks as they are generated, enabling
        real-time voice streaming for lower latency.
        
        Args:
            session_id: Session ID
            user_message: User's message
        
        Yields:
            Dict with audio chunks and metadata
        """
        session = self.get_session(session_id)
        if not session:
            yield {'error': 'Session not found'}
            return
        
        # Add user message to transcript
        session.add_transcript_entry('user', user_message)
        
        # TODO: Search relevant documents using RAG
        # For now, generate a more helpful response based on the message
        assistant_response = f"I am reviewing the safety protocols for your query: '{user_message}'. Please hold for a moment while I prepare the specific instructions for this emergency scenario."
        
        # Generate streaming audio if ElevenLabs is available
        if self.elevenlabs_service:
            try:
                # First, send the text response
                yield {
                    'type': 'text',
                    'text': assistant_response,
                    'session_id': session_id
                }
                
                # Then stream audio chunks
                audio_stream = self.elevenlabs_service.text_to_speech_stream(
                    text=assistant_response,
                    stability=0.5,
                    similarity_boost=0.75
                )
                
                chunk_count = 0
                for audio_chunk in audio_stream:
                    chunk_count += 1
                    yield {
                        'type': 'audio_chunk',
                        'chunk': audio_chunk,
                        'chunk_number': chunk_count,
                        'session_id': session_id
                    }
                
                # Send completion signal
                yield {
                    'type': 'audio_complete',
                    'total_chunks': chunk_count,
                    'session_id': session_id
                }
                
                print(f"[Emergency] Streamed {chunk_count} audio chunks for session {session_id}")
                
            except Exception as e:
                print(f"[Emergency] Error streaming audio: {str(e)}")
                yield {
                    'type': 'error',
                    'error': f'Audio streaming error: {str(e)}',
                    'session_id': session_id
                }
        else:
            # No audio service available, just send text
            yield {
                'type': 'text',
                'text': assistant_response,
                'session_id': session_id
            }
        
        # Add to transcript
        session.add_transcript_entry('assistant', assistant_response)
        self._save_session(session)
    
    # -------------------------------------------------------------------------
    # Socket.IO Event Handlers
    # -------------------------------------------------------------------------
    
    def handle_connect_event(self, data: Dict) -> None:
        """
        Handle emergency:connect Socket.IO event
        
        Creates a new emergency session or resumes an existing one
        """
        try:
            # Validate input data
            if not data:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'No connection data provided'
                })
                return
            
            user_id = data.get('userId', 'anonymous')
            manual_id = data.get('manualId')
            resume_session_id = data.get('resumeSessionId')
            
            # Try to resume existing session if requested
            if resume_session_id:
                try:
                    session = self.resume_session(resume_session_id)
                    if session:
                        emit('emergency:started', {
                            'sessionId': session.session_id,
                            'voiceId': 'placeholder-voice',
                            'status': 'connected',
                            'resumed': True,
                            'message': 'Session resumed successfully',
                            'transcript': session.transcript
                        })
                        return
                    else:
                        # Session not found or can't be resumed, create new one
                        print(f"[Emergency] Could not resume session {resume_session_id}, creating new one")
                except Exception as e:
                    print(f"[Emergency] Error resuming session: {str(e)}")
                    emit('emergency:error', {
                        'code': 'RESUME_FAILED',
                        'message': f'Failed to resume session: {str(e)}'
                    })
                    # Continue to create new session
            
            # Create new session
            try:
                session = self.create_session(user_id, manual_id)
            except Exception as e:
                print(f"[Emergency] Error creating session: {str(e)}")
                emit('emergency:error', {
                    'code': 'SESSION_CREATION_FAILED',
                    'message': f'Failed to create session: {str(e)}'
                })
                return
            
            # Get default voice ID
            default_voice = 'rachel'
            if self.elevenlabs_service:
                default_voice = self.elevenlabs_service.VOICES['rachel']['id']
            
            # Send session started confirmation
            emit('emergency:started', {
                'sessionId': session.session_id,
                'voiceId': default_voice,
                'status': 'connected',
                'resumed': False,
                'message': 'Emergency assistant connected with voice support'
            })
            
            # Send initial greeting
            greeting_text = 'Emergency Assistant online. I am optimized with Mistral AI and ElevenLabs to provide real-time safety guidance. How can I assist you with your situation?'
            
            # Generate audio for greeting if service available
            audio_url = None
            if self.elevenlabs_service:
                try:
                    audio_bytes = self.elevenlabs_service.text_to_speech(greeting_text)
                    audio_filename = f"greeting_{session.session_id}.mp3"
                    audio_path = os.path.join(self.session_storage_path, audio_filename)
                    with open(audio_path, 'wb') as f:
                        f.write(audio_bytes)
                    audio_url = f"/api/emergency/audio/{audio_filename}"
                except Exception as e:
                    print(f"[Emergency] Greeting audio error: {str(e)}")

            emit('emergency:transcript', {
                'sessionId': session.session_id,
                'entry': {
                    'timestamp': session.start_time.isoformat(),
                    'speaker': 'assistant',
                    'text': greeting_text,
                    'audio_url': audio_url
                }
            })
            
            if audio_url:
                emit('emergency:audio', {
                    'sessionId': session.session_id,
                    'audioUrl': audio_url
                })
            
        except Exception as e:
            print(f"[Emergency] Connect error: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('emergency:error', {
                'code': 'CONNECTION_FAILED',
                'message': f'Connection failed: {str(e)}'
            })
    
    def handle_audio_event(self, data: Dict) -> None:
        """
        Handle emergency:audio Socket.IO event
        
        Processes audio input from user (placeholder for now)
        """
        try:
            # Validate input
            if not data:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'No audio data provided'
                })
                return
            
            session_id = data.get('sessionId')
            audio_data = data.get('audioData')
            
            if not session_id:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'Session ID required'
                })
                return
            
            if not audio_data:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'Audio data required'
                })
                return
            
            # Verify session exists
            session = self.get_session(session_id)
            if not session:
                emit('emergency:error', {
                    'code': 'SESSION_NOT_FOUND',
                    'message': 'Session not found or expired'
                })
                return
            
            # Convert base64 to bytes if needed
            try:
                if isinstance(audio_data, str):
                    audio_data = base64.b64decode(audio_data)
            except Exception as e:
                emit('emergency:error', {
                    'code': 'INVALID_AUDIO_DATA',
                    'message': f'Invalid audio data format: {str(e)}'
                })
                return
            
            # Process audio with real transcription
            result = self.handle_audio_input(session_id, audio_data)
            
            if result.get('error'):
                emit('emergency:error', {
                    'code': 'AUDIO_PROCESSING_FAILED',
                    'message': result['error']
                })
                return
            
            user_text = result.get('transcript', '')
            
            # Send transcript update for user speech
            emit('emergency:transcript', {
                'sessionId': session_id,
                'entry': {
                    'timestamp': datetime.now().isoformat(),
                    'speaker': 'user',
                    'text': user_text
                }
            })
            
            # Generate and send AI response (text + audio)
            # We use non-streaming for now for better compatibility with current frontend listeners
            response_data = self.generate_response(session_id, user_text, generate_audio=True)
            
            if response_data.get('success'):
                # Send transcript update for assistant response
                emit('emergency:transcript', {
                    'sessionId': session_id,
                    'entry': {
                        'timestamp': datetime.now().isoformat(),
                        'speaker': 'assistant',
                        'text': response_data['response'],
                        'audio_url': response_data.get('audio_url')
                    }
                })
                
                # Send audio URL separately if provided
                if response_data.get('audio_url'):
                    emit('emergency:audio', {
                        'sessionId': session_id,
                        'audioUrl': response_data['audio_url']
                    })
            else:
                emit('emergency:error', {
                    'code': 'RESPONSE_GENERATION_FAILED',
                    'message': response_data.get('error', 'Unknown error')
                })
            
        except Exception as e:
            print(f"[Emergency] Audio error: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('emergency:error', {
                'code': 'AUDIO_ERROR',
                'message': f'Audio processing error: {str(e)}'
            })
    
    def handle_image_event(self, data: Dict) -> None:
        """
        Handle emergency:image Socket.IO event
        
        Processes image upload for visual assessment (placeholder for now)
        """
        try:
            # Validate input
            if not data:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'No image data provided'
                })
                return
            
            session_id = data.get('sessionId')
            image_data = data.get('imageData')
            mime_type = data.get('mimeType', 'image/jpeg')
            
            if not session_id:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'Session ID required'
                })
                return
            
            if not image_data:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'Image data required'
                })
                return
            
            # Verify session exists
            session = self.get_session(session_id)
            if not session:
                emit('emergency:error', {
                    'code': 'SESSION_NOT_FOUND',
                    'message': 'Session not found or expired'
                })
                return
            
            # Convert base64 to bytes
            try:
                if isinstance(image_data, str):
                    image_data = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
            except Exception as e:
                emit('emergency:error', {
                    'code': 'INVALID_IMAGE_DATA',
                    'message': f'Invalid image data format: {str(e)}'
                })
                return
            
            # Process image (placeholder for now)
            result = self.handle_image_upload(session_id, image_data, mime_type)
            
            if result.get('error'):
                emit('emergency:error', {
                    'code': 'IMAGE_PROCESSING_FAILED',
                    'message': result['error']
                })
                return
            
            # Send image analysis result
            emit('emergency:imageAnalysis', {
                'sessionId': session_id,
                'imageId': result['image_id'],
                'analysis': result['analysis']
            })
            
            # Add to transcript
            emit('emergency:transcript', {
                'sessionId': session_id,
                'entry': {
                    'timestamp': datetime.now().isoformat(),
                    'speaker': 'system',
                    'text': f'[Image uploaded: {result["image_id"]}]'
                }
            })
            
        except Exception as e:
            print(f"[Emergency] Image error: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('emergency:error', {
                'code': 'IMAGE_ERROR',
                'message': f'Image processing error: {str(e)}'
            })
    
    def handle_message_event(self, data: Dict) -> None:
        """
        Handle emergency:message Socket.IO event
        
        Processes text message from user
        """
        try:
            # Validate input
            if not data:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'No message data provided'
                })
                return
            
            session_id = data.get('sessionId')
            message = data.get('message')
            stream_audio = data.get('streamAudio', True)  # Enable streaming by default
            
            if not session_id:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'Session ID required'
                })
                return
            
            if not message:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'Message required'
                })
                return
            
            # Verify session exists
            session = self.get_session(session_id)
            if not session:
                emit('emergency:error', {
                    'code': 'SESSION_NOT_FOUND',
                    'message': 'Session not found or expired'
                })
                return
            
            # Add user message to transcript
            emit('emergency:transcript', {
                'sessionId': session_id,
                'entry': {
                    'timestamp': datetime.now().isoformat(),
                    'speaker': 'user',
                    'text': message
                }
            })
            
            # Generate response with streaming audio if requested
            if stream_audio:
                try:
                    for chunk_data in self.generate_response_stream(session_id, message):
                        if chunk_data.get('type') == 'text':
                            # Send text response to transcript
                            emit('emergency:transcript', {
                                'sessionId': session_id,
                                'entry': {
                                    'timestamp': datetime.now().isoformat(),
                                    'speaker': 'assistant',
                                    'text': chunk_data['text']
                                }
                            })
                        elif chunk_data.get('type') == 'audio_chunk':
                            # Stream audio chunk to client
                            audio_b64 = base64.b64encode(chunk_data['chunk']).decode('utf-8')
                            emit('emergency:audioStream', {
                                'sessionId': session_id,
                                'audioChunk': audio_b64,
                                'chunkNumber': chunk_data['chunk_number']
                            })
                        elif chunk_data.get('type') == 'audio_complete':
                            # Signal audio streaming complete
                            emit('emergency:audioStreamComplete', {
                                'sessionId': session_id,
                                'totalChunks': chunk_data['total_chunks']
                            })
                        elif chunk_data.get('type') == 'error':
                            emit('emergency:error', {
                                'code': 'STREAMING_ERROR',
                                'message': chunk_data['error']
                            })
                except Exception as e:
                    print(f"[Emergency] Streaming error: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    emit('emergency:error', {
                        'code': 'STREAMING_ERROR',
                        'message': f'Audio streaming error: {str(e)}'
                    })
            else:
                # Generate response without streaming (fallback)
                result = self.generate_response(session_id, message, generate_audio=True)
                
                if result.get('error'):
                    emit('emergency:error', {
                        'code': 'RESPONSE_GENERATION_FAILED',
                        'message': result['error']
                    })
                    return
                
                # Send assistant response with audio
                response_entry = {
                    'timestamp': datetime.now().isoformat(),
                    'speaker': 'assistant',
                    'text': result['response']
                }
                
                if result.get('audio_url'):
                    response_entry['audio_url'] = result['audio_url']
                
                emit('emergency:transcript', {
                    'sessionId': session_id,
                    'entry': response_entry
                })
                
                # If audio was generated, also send it separately
                if result.get('audio_url'):
                    emit('emergency:audio', {
                        'sessionId': session_id,
                        'audioUrl': result['audio_url']
                    })
            
        except Exception as e:
            print(f"[Emergency] Message error: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('emergency:error', {
                'code': 'MESSAGE_ERROR',
                'message': f'Message processing error: {str(e)}'
            })
    
    def handle_end_event(self, data: Dict) -> None:
        """
        Handle emergency:end Socket.IO event
        
        Ends the emergency session
        """
        try:
            # Validate input
            if not data:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'No session data provided'
                })
                return
            
            session_id = data.get('sessionId')
            resolution = data.get('resolution', 'incomplete')
            
            if not session_id:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'Session ID required'
                })
                return
            
            result = self.end_session(session_id, resolution)
            
            if not result:
                emit('emergency:error', {
                    'code': 'SESSION_NOT_FOUND',
                    'message': 'Session not found or already ended'
                })
                return
            
            emit('emergency:ended', {
                'sessionId': session_id,
                'duration': result['duration'],
                'resolution': resolution,
                'message': 'Session ended successfully'
            })
            
        except Exception as e:
            print(f"[Emergency] End session error: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('emergency:error', {
                'code': 'END_SESSION_ERROR',
                'message': f'Failed to end session: {str(e)}'
            })
    
    def handle_change_voice_event(self, data: Dict) -> None:
        """
        Handle emergency:changeVoice Socket.IO event
        
        Changes the voice model
        """
        try:
            session_id = data.get('sessionId')
            voice_name = data.get('voiceName', 'rachel')
            
            if not session_id:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'Session ID required'
                })
                return
            
            # Change voice
            result = self.change_voice(session_id, voice_name)
            
            if result.get('error'):
                emit('emergency:error', {
                    'code': 'VOICE_CHANGE_FAILED',
                    'message': result['error']
                })
                return
            
            print(f"[Emergency] Voice changed to {voice_name} for session {session_id}")
            
            emit('emergency:voiceChanged', {
                'sessionId': session_id,
                'voiceId': result['voice_id'],
                'voiceName': result['voice_name'],
                'message': f'Voice changed to {result["voice_name"]}'
            })
            
        except Exception as e:
            print(f"[Emergency] Change voice error: {str(e)}")
            emit('emergency:error', {
                'code': 'VOICE_CHANGE_ERROR',
                'message': str(e)
            })
    
    def handle_disconnect_event(self, data: Dict) -> None:
        """
        Handle emergency:disconnect Socket.IO event
        
        Marks session as disconnected but allows resumption
        """
        try:
            session_id = data.get('sessionId')
            
            if not session_id:
                emit('emergency:error', {
                    'code': 'INVALID_DATA',
                    'message': 'Session ID required'
                })
                return
            
            result = self.disconnect_session(session_id)
            
            if not result:
                emit('emergency:error', {
                    'code': 'SESSION_NOT_FOUND',
                    'message': 'Session not found'
                })
                return
            
            emit('emergency:disconnected', {
                'sessionId': session_id,
                'canResume': result['can_resume'],
                'message': 'Session disconnected. You can resume later.'
            })
            
        except Exception as e:
            print(f"[Emergency] Disconnect error: {str(e)}")
            emit('emergency:error', {
                'code': 'DISCONNECT_ERROR',
                'message': str(e)
            })


# Global service instance
emergency_service = EmergencyAssistantService()


def get_emergency_service() -> EmergencyAssistantService:
    """Get the global emergency service instance"""
    return emergency_service


def register_socketio_handlers(socketio):
    """
    Register all Socket.IO event handlers for emergency assistant
    
    This function should be called from app.py to set up all handlers
    
    Args:
        socketio: Flask-SocketIO instance
    """
    service = get_emergency_service()
    
    @socketio.on('emergency:connect')
    def handle_emergency_connect(data):
        """Handle emergency session connection"""
        service.handle_connect_event(data)
    
    @socketio.on('emergency:audio')
    def handle_emergency_audio(data):
        """Handle audio input from user"""
        service.handle_audio_event(data)
    
    @socketio.on('emergency:image')
    def handle_emergency_image(data):
        """Handle image upload for visual assessment"""
        service.handle_image_event(data)
    
    @socketio.on('emergency:message')
    def handle_emergency_message(data):
        """Handle text message from user"""
        service.handle_message_event(data)
    
    @socketio.on('emergency:end')
    def handle_emergency_end(data):
        """Handle emergency session end"""
        service.handle_end_event(data)
    
    @socketio.on('emergency:changeVoice')
    def handle_emergency_change_voice(data):
        """Handle voice change request"""
        service.handle_change_voice_event(data)
    
    @socketio.on('emergency:disconnect')
    def handle_emergency_disconnect(data):
        """Handle emergency session disconnect"""
        service.handle_disconnect_event(data)
    
    print("[Emergency] Socket.IO handlers registered")

