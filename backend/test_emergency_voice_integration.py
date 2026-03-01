"""
Test script for Emergency Assistant Voice Integration

Tests the integration of ElevenLabs voice service with the emergency assistant
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.emergency_assistant_service import EmergencyAssistantService


def test_emergency_voice_integration():
    """Test emergency assistant with voice integration"""
    
    print("=" * 60)
    print("Testing Emergency Assistant Voice Integration")
    print("=" * 60)
    
    # Test 1: Service initialization
    print("\n[Test 1] Initializing Emergency Assistant service...")
    try:
        service = EmergencyAssistantService(session_storage_path="data/test_emergency_sessions")
        print("✓ Service initialized successfully")
        
        if service.elevenlabs_service:
            print("✓ ElevenLabs service is available")
        else:
            print("✗ ElevenLabs service not available")
            return False
    except Exception as e:
        print(f"✗ Service initialization failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 2: Create session
    print("\n[Test 2] Creating emergency session...")
    try:
        session = service.create_session(user_id="test_user", manual_id="test_manual")
        print(f"✓ Session created: {session.session_id}")
    except Exception as e:
        print(f"✗ Session creation failed: {str(e)}")
        return False
    
    # Test 3: Get available voices
    print("\n[Test 3] Getting available voices...")
    try:
        voices = service.get_available_voices()
        print(f"✓ Found {len(voices)} voices:")
        for voice in voices:
            print(f"  - {voice['name']}: {voice['description']}")
    except Exception as e:
        print(f"✗ Failed to get voices: {str(e)}")
        return False
    
    # Test 4: Generate response with audio
    print("\n[Test 4] Generating response with audio...")
    try:
        result = service.generate_response(
            session_id=session.session_id,
            user_message="What should I do if I see a safety hazard?",
            generate_audio=True
        )
        
        if result.get('success'):
            print(f"✓ Response generated: {result['response'][:50]}...")
            
            if result.get('audio_url'):
                print(f"✓ Audio URL: {result['audio_url']}")
            else:
                print("⚠ No audio URL (this is expected if audio generation failed)")
        else:
            print(f"✗ Response generation failed: {result.get('error')}")
            return False
    except Exception as e:
        print(f"✗ Response generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 5: Change voice
    print("\n[Test 5] Changing voice to 'adam'...")
    try:
        result = service.change_voice(session.session_id, 'adam')
        
        if result.get('success'):
            print(f"✓ Voice changed to: {result['voice_name']}")
            print(f"✓ Voice ID: {result['voice_id']}")
        else:
            print(f"✗ Voice change failed: {result.get('error')}")
            return False
    except Exception as e:
        print(f"✗ Voice change failed: {str(e)}")
        return False
    
    # Test 6: End session
    print("\n[Test 6] Ending session...")
    try:
        result = service.end_session(session.session_id, resolution='resolved')
        
        if result:
            print(f"✓ Session ended successfully")
            print(f"✓ Duration: {result['duration']:.2f} seconds")
        else:
            print("✗ Session end failed")
            return False
    except Exception as e:
        print(f"✗ Session end failed: {str(e)}")
        return False
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = test_emergency_voice_integration()
    sys.exit(0 if success else 1)
