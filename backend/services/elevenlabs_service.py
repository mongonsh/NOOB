"""
ElevenLabs Conversational AI Service

Provides real-time voice conversation capabilities using ElevenLabs
Conversational AI API for the Emergency Assistant feature.
"""

import os
from typing import Optional, Dict, AsyncIterator
from elevenlabs.client import ElevenLabs
from elevenlabs import Voice, VoiceSettings


class ElevenLabsService:
    """Service for managing ElevenLabs voice interactions"""
    
    # Available voice models with their IDs
    VOICES = {
        'rachel': {
            'id': '21m00Tcm4TlvDq8ikWAM',
            'name': 'Rachel',
            'description': 'Professional female, clear'
        },
        'adam': {
            'id': 'pNInz6obpgDQGcFmaJgB',
            'name': 'Adam',
            'description': 'Authoritative male'
        },
        'bella': {
            'id': 'EXAVITQu4vr4xnSDxMaL',
            'name': 'Bella',
            'description': 'Warm, friendly female'
        },
        'josh': {
            'id': 'TxGEqnHWrfWFTfGW9XjX',
            'name': 'Josh',
            'description': 'Technical expert male'
        }
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize ElevenLabs service
        
        Args:
            api_key: ElevenLabs API key (defaults to env var)
        """
        self.api_key = api_key or os.getenv('ELEVENLABS_API_KEY')
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment")
        
        self.client = ElevenLabs(api_key=self.api_key)
        self.default_voice_id = self.VOICES['rachel']['id']
    
    def get_available_voices(self) -> Dict[str, Dict]:
        """Get list of available voice models"""
        return self.VOICES
    
    def get_voice_id(self, voice_name: str) -> Optional[str]:
        """
        Get voice ID by name
        
        Args:
            voice_name: Name of the voice (e.g., 'rachel', 'adam')
        
        Returns:
            Voice ID or None if not found
        """
        voice = self.VOICES.get(voice_name.lower())
        return voice['id'] if voice else None
    
    def text_to_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.0,
        use_speaker_boost: bool = True
    ) -> bytes:
        """
        Convert text to speech using ElevenLabs
        
        Args:
            text: Text to convert to speech
            voice_id: Voice model ID (defaults to Rachel)
            stability: Voice stability (0-1)
            similarity_boost: Voice similarity boost (0-1)
            style: Voice style intensity (0-1)
            use_speaker_boost: Enable speaker boost
        
        Returns:
            Audio bytes (MP3 format)
        """
        voice_id = voice_id or self.default_voice_id
        
        # Generate audio
        audio = self.client.generate(
            text=text,
            voice=Voice(
                voice_id=voice_id,
                settings=VoiceSettings(
                    stability=stability,
                    similarity_boost=similarity_boost,
                    style=style,
                    use_speaker_boost=use_speaker_boost
                )
            ),
            model="eleven_monolingual_v1"
        )
        
        # Convert generator to bytes
        audio_bytes = b''.join(audio)
        return audio_bytes
    
    def text_to_speech_stream(
        self,
        text: str,
        voice_id: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.0
    ):
        """
        Convert text to speech with streaming
        
        Args:
            text: Text to convert to speech
            voice_id: Voice model ID (defaults to Rachel)
            stability: Voice stability (0-1)
            similarity_boost: Voice similarity boost (0-1)
            style: Voice style intensity (0-1)
        
        Returns:
            Generator of audio chunks
        """
        voice_id = voice_id or self.default_voice_id
        
        # Generate audio stream
        audio_stream = self.client.generate(
            text=text,
            voice=Voice(
                voice_id=voice_id,
                settings=VoiceSettings(
                    stability=stability,
                    similarity_boost=similarity_boost,
                    style=style,
                    use_speaker_boost=True
                )
            ),
            model="eleven_monolingual_v1",
            stream=True
        )
        
        # Yield chunks from the stream
        for chunk in audio_stream:
            if chunk:
                yield chunk


# Global service instance
_elevenlabs_service: Optional[ElevenLabsService] = None


def get_elevenlabs_service() -> ElevenLabsService:
    """Get or create the global ElevenLabs service instance"""
    global _elevenlabs_service
    if _elevenlabs_service is None:
        _elevenlabs_service = ElevenLabsService()
    return _elevenlabs_service
