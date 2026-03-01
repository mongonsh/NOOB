"""
Test script for real-time voice streaming functionality

This script tests the ElevenLabs streaming integration and emergency
assistant service streaming capabilities.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.elevenlabs_service import get_elevenlabs_service
from services.emergency_assistant_service import get_emergency_service


def test_elevenlabs_streaming():
    """Test ElevenLabs text-to-speech streaming"""
    print("\n" + "="*60)
    print("TEST 1: ElevenLabs Streaming")
    print("="*60)
    
    try:
        service = get_elevenlabs_service()
        print("✓ ElevenLabs service initialized")
        
        # Test streaming
        test_text = "This is a test of real-time voice streaming."
        print(f"\nStreaming text: '{test_text}'")
        
        chunk_count = 0
        total_bytes = 0
        
        for chunk in service.text_to_speech_stream(test_text):
            chunk_count += 1
            chunk_size = len(chunk)
            total_bytes += chunk_size
            print(f"  Chunk {chunk_count}: {chunk_size} bytes")
        
        print(f"\n✓ Streaming complete!")
        print(f"  Total chunks: {chunk_count}")
        print(f"  Total bytes: {total_bytes}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_emergency_service_streaming():
    """Test emergency assistant service streaming"""
    print("\n" + "="*60)
    print("TEST 2: Emergency Service Streaming")
    print("="*60)
    
    try:
        service = get_emergency_service()
        print("✓ Emergency service initialized")
        
        # Create test session
        session = service.create_session("test-user-streaming")
        print(f"✓ Session created: {session.session_id}")
        
        # Test streaming response
        test_message = "What should I do in an emergency?"
        print(f"\nGenerating streaming response for: '{test_message}'")
        
        chunk_count = 0
        text_received = False
        audio_chunks = 0
        
        for chunk_data in service.generate_response_stream(session.session_id, test_message):
            chunk_count += 1
            chunk_type = chunk_data.get('type')
            
            if chunk_type == 'text':
                text_received = True
                print(f"\n  Text response: {chunk_data['text'][:50]}...")
            elif chunk_type == 'audio_chunk':
                audio_chunks += 1
                chunk_size = len(chunk_data['chunk'])
                print(f"  Audio chunk {chunk_data['chunk_number']}: {chunk_size} bytes")
            elif chunk_type == 'audio_complete':
                print(f"\n✓ Audio streaming complete!")
                print(f"  Total audio chunks: {chunk_data['total_chunks']}")
            elif chunk_type == 'error':
                print(f"\n✗ Streaming error: {chunk_data['error']}")
        
        print(f"\n✓ Streaming test complete!")
        print(f"  Total events: {chunk_count}")
        print(f"  Text received: {text_received}")
        print(f"  Audio chunks: {audio_chunks}")
        
        # Clean up
        service.end_session(session.session_id)
        print(f"✓ Session ended")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_available_voices():
    """Test available voices listing"""
    print("\n" + "="*60)
    print("TEST 3: Available Voices")
    print("="*60)
    
    try:
        service = get_elevenlabs_service()
        voices = service.get_available_voices()
        
        print(f"\nAvailable voices: {len(voices)}")
        for voice_key, voice_data in voices.items():
            print(f"  • {voice_data['name']} ({voice_key})")
            print(f"    ID: {voice_data['id']}")
            print(f"    Description: {voice_data['description']}")
        
        print("\n✓ Voice listing complete!")
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all streaming tests"""
    print("\n" + "="*60)
    print("REAL-TIME VOICE STREAMING TESTS")
    print("="*60)
    
    # Check for API key
    if not os.getenv('ELEVENLABS_API_KEY'):
        print("\n⚠️  WARNING: ELEVENLABS_API_KEY not found in environment")
        print("   Some tests may fail without a valid API key")
        print("   Set it in backend/.env file")
    
    results = []
    
    # Run tests
    results.append(("Available Voices", test_available_voices()))
    results.append(("ElevenLabs Streaming", test_elevenlabs_streaming()))
    results.append(("Emergency Service Streaming", test_emergency_service_streaming()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit(main())
