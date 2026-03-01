"""
Test script for Emergency Assistant Socket.IO setup

This script verifies that the Socket.IO handlers are properly configured
and can handle basic emergency session operations.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.emergency_assistant_service import (
    EmergencyAssistantService,
    get_emergency_service,
    register_socketio_handlers
)


def test_service_creation():
    """Test that the service can be created and accessed"""
    print("\n=== Test 1: Service Creation ===")
    service = get_emergency_service()
    assert service is not None, "Service should not be None"
    assert isinstance(service, EmergencyAssistantService), "Service should be EmergencyAssistantService instance"
    print("✅ Service created successfully")


def test_session_management():
    """Test session creation and management"""
    print("\n=== Test 2: Session Management ===")
    service = get_emergency_service()
    
    # Create session
    session = service.create_session("test_user_123", "manual_456")
    assert session is not None, "Session should not be None"
    assert session.user_id == "test_user_123", "User ID should match"
    assert session.manual_id == "manual_456", "Manual ID should match"
    assert session.status == "active", "Session should be active"
    print(f"✅ Session created: {session.session_id}")
    
    # Get session
    retrieved = service.get_session(session.session_id)
    assert retrieved is not None, "Should retrieve session"
    assert retrieved.session_id == session.session_id, "Session IDs should match"
    print(f"✅ Session retrieved: {retrieved.session_id}")
    
    # End session
    result = service.end_session(session.session_id, "resolved")
    assert result is not None, "End session should return result"
    assert result['resolution'] == "resolved", "Resolution should match"
    assert result['duration'] >= 0, "Duration should be non-negative"
    print(f"✅ Session ended: duration={result['duration']}s")
    
    # Verify session is removed from active sessions
    retrieved_after_end = service.get_session(session.session_id)
    assert retrieved_after_end is None, "Session should be removed after ending"
    print("✅ Session properly removed from active sessions")


def test_transcript_management():
    """Test transcript entry management"""
    print("\n=== Test 3: Transcript Management ===")
    service = get_emergency_service()
    
    session = service.create_session("test_user_456")
    
    # Add user message
    entry1 = session.add_transcript_entry("user", "The machine is broken")
    assert entry1['speaker'] == "user", "Speaker should be user"
    assert entry1['text'] == "The machine is broken", "Text should match"
    assert 'timestamp' in entry1, "Entry should have timestamp"
    print(f"✅ User message added: {entry1['text']}")
    
    # Add assistant response
    entry2 = session.add_transcript_entry("assistant", "I can help with that")
    assert entry2['speaker'] == "assistant", "Speaker should be assistant"
    print(f"✅ Assistant response added: {entry2['text']}")
    
    # Verify transcript
    assert len(session.transcript) == 2, "Should have 2 transcript entries"
    print(f"✅ Transcript has {len(session.transcript)} entries")
    
    # Clean up
    service.end_session(session.session_id)


def test_image_management():
    """Test image upload management"""
    print("\n=== Test 4: Image Management ===")
    service = get_emergency_service()
    
    session = service.create_session("test_user_789")
    
    # Add image
    image_data = session.add_image("img_123", "/uploads/test.jpg", "Test analysis")
    assert image_data['image_id'] == "img_123", "Image ID should match"
    assert image_data['url'] == "/uploads/test.jpg", "URL should match"
    assert image_data['analysis'] == "Test analysis", "Analysis should match"
    assert 'timestamp' in image_data, "Image should have timestamp"
    print(f"✅ Image added: {image_data['image_id']}")
    
    # Verify images
    assert len(session.images) == 1, "Should have 1 image"
    print(f"✅ Session has {len(session.images)} image(s)")
    
    # Clean up
    service.end_session(session.session_id)


def test_placeholder_handlers():
    """Test placeholder handler methods"""
    print("\n=== Test 5: Placeholder Handlers ===")
    service = get_emergency_service()
    
    session = service.create_session("test_user_999")
    
    # Test audio input handler
    audio_result = service.handle_audio_input(session.session_id, b"fake_audio_data")
    assert audio_result['success'] == True, "Audio handler should succeed"
    assert 'transcript' in audio_result, "Should return transcript"
    print(f"✅ Audio handler: {audio_result['message']}")
    
    # Test image upload handler
    image_result = service.handle_image_upload(session.session_id, b"fake_image_data", "image/jpeg")
    assert image_result['success'] == True, "Image handler should succeed"
    assert 'image_id' in image_result, "Should return image ID"
    print(f"✅ Image handler: {image_result['analysis']}")
    
    # Test response generation
    response_result = service.generate_response(session.session_id, "Help me!")
    assert response_result['success'] == True, "Response generation should succeed"
    assert 'response' in response_result, "Should return response"
    print(f"✅ Response generation: {response_result['response'][:50]}...")
    
    # Clean up
    service.end_session(session.session_id)


def test_socketio_handler_registration():
    """Test that Socket.IO handlers can be registered"""
    print("\n=== Test 6: Socket.IO Handler Registration ===")
    
    # Create a mock socketio object
    class MockSocketIO:
        def __init__(self):
            self.handlers = {}
        
        def on(self, event):
            def decorator(func):
                self.handlers[event] = func
                return func
            return decorator
    
    mock_socketio = MockSocketIO()
    
    # Register handlers
    register_socketio_handlers(mock_socketio)
    
    # Verify all handlers are registered
    expected_events = [
        'emergency:connect',
        'emergency:audio',
        'emergency:image',
        'emergency:message',
        'emergency:end',
        'emergency:changeVoice'
    ]
    
    for event in expected_events:
        assert event in mock_socketio.handlers, f"Handler for {event} should be registered"
        print(f"✅ Handler registered: {event}")
    
    print(f"✅ All {len(expected_events)} Socket.IO handlers registered successfully")


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("Emergency Assistant Socket.IO Setup Tests")
    print("=" * 60)
    
    try:
        test_service_creation()
        test_session_management()
        test_transcript_management()
        test_image_management()
        test_placeholder_handlers()
        test_socketio_handler_registration()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        return True
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
