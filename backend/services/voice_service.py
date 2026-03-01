import requests
from utils.config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

EMOTION_SETTINGS = {
    "encouraging": {"stability": 0.4, "similarity_boost": 0.75, "style": 0.5},
    "celebrating": {"stability": 0.3, "similarity_boost": 0.8, "style": 0.8},
    "sympathetic": {"stability": 0.6, "similarity_boost": 0.7, "style": 0.3},
    "neutral": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0},
}


def text_to_speech(text: str, emotion: str = "neutral") -> bytes:
    """Convert text to speech using ElevenLabs. Returns MP3 bytes."""
    settings = EMOTION_SETTINGS.get(emotion, EMOTION_SETTINGS["neutral"])
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": settings,
    }
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
    return response.content


def speech_to_text(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe audio using Voxtral (Mistral's voice model)."""
    from services.mistral_service import transcribe_audio
    return transcribe_audio(audio_bytes)
