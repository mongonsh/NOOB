"""
Test script for ElevenLabs integration

Tests the basic functionality of the ElevenLabs service
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.elevenlabs_service import get_elevenlabs_service


def test_elevenlabs_service():
    """Test ElevenLabs service initialization and basic functionality"""
    
    print("=" * 60)
    print("Testing ElevenLabs Integration")
    print("=" * 60)
    
    # Test 1: Service initialization
    print("\n[Test 1] Initializing ElevenLabs service...")
    try:
        service = get_elevenlabs_service()
        print("✓ Service initialized successfully")
    except Exception as e:
        print(f"✗ Service initialization failed: {str(e)}")
        return False
    
    # Test 2: Get available voices
    print("\n[Test 2] Getting available voices...")
    try:
        voices = service.get_available_voices()
        print(f"✓ Found {len(voices)} voices:")
        for voice_name, voice_data in voices.items():
            print(f"  - {voice_data['name']} ({voice_name}): {voice_data['description']}")
    except Exception as e:
        print(f"✗ Failed to get voices: {str(e)}")
        return False
    
    # Test 3: Get voice ID by name
    print("\n[Test 3] Getting voice ID for 'rachel'...")
    try:
        voice_id = service.get_voice_id('rachel')
        if voice_id:
            print(f"✓ Rachel voice ID: {voice_id}")
        else:
            print("✗ Voice ID not found")
            return False
    except Exception as e:
        print(f"✗ Failed to get voice ID: {str(e)}")
        return False
    
    # Test 4: Text to speech
    print("\n[Test 4] Converting text to speech...")
    test_text = "Hello! I'm your safety assistant. How can I help you today?"
    try:
        audio_bytes = service.text_to_speech(
            text=test_text,
            stability=0.5,
            similarity_boost=0.75
        )
        
        if audio_bytes and len(audio_bytes) > 0:
            print(f"✓ Generated audio: {len(audio_bytes)} bytes")
            
            # Save test audio file
            test_audio_path = "test_audio.mp3"
            with open(test_audio_path, 'wb') as f:
                f.write(audio_bytes)
            print(f"✓ Saved test audio to: {test_audio_path}")
        else:
            print("✗ No audio generated")
            return False
    except Exception as e:
        print(f"✗ Text to speech failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = test_elevenlabs_service()
    sys.exit(0 if success else 1)
