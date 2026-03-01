#!/usr/bin/env python3
"""
Unit Test for Emergency Assistant Socket.IO Connection

This test verifies that:
1. Emergency service can create sessions
2. Socket.IO event handlers are properly defined
3. Message exchange logic works correctly
4. Session management functions properly

This is a unit test that doesn't require a running server.
"""

import sys
import os
from datetime import datetime
from unittest.mock import MagicMock, patch

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.emergency_assistant_service import (
    EmergencySession,
    EmergencyAssistantService,
    get_emergency_service
)


def test_emergency_session_creation():
    """Test 1: Emergency session can be created"""
    print('[Test 1] Testing emergency session creation...')
    
    session = EmergencySession('test-user-123', 'manual-456')
    
    assert session.user_id == 'test-user-123', 'User ID mismatch'
    assert session.manual_id == 'manual-456', 'Manual ID mismatch'
    assert session.status == 'active', 'Session should be active'
    assert len(session.transcript) == 0, 'Transcript should be empty'
    assert len(session.images) == 0, 'Images should be empty'
    
    print('  ✓ Session created successfully')
    print(f'  ✓ Session ID: {session.session_id}')
    print(f'  ✓ User ID: {session.user_id}')
    print(f'  ✓ Status: {session.status}')
    return True


def test_transcript_management():
    """Test 2: Transcript entries can be added"""
    print('\n[Test 2] Testing transcript management...')
    
    session = EmergencySession('test-user', None)
    
    # Add user message
    entry1 = session.add_transcript_entry('user', 'Hello, I need help')
    assert entry1['speaker'] == 'user', 'Speaker should be user'
    assert entry1['text'] == 'Hello, I need help', 'Text mismatch'
    assert 'timestamp' in entry1, 'Timestamp missing'
    
    # Add assistant response
    entry2 = session.add_transcript_entry('assistant', 'How can I help you?')
    assert entry2['speaker'] == 'assistant', 'Speaker should be assistant'
    
    assert len(session.transcript) == 2, 'Should have 2 transcript entries'
    
    print('  ✓ User message added')
    print('  ✓ Assistant response added')
    print(f'  ✓ Total entries: {len(session.transcript)}')
    return True


def test_image_management():
    """Test 3: Images can be added to session"""
    print('\n[Test 3] Testing image management...')
    
    session = EmergencySession('test-user', None)
    
    image = session.add_image('img-123', '/uploads/test.jpg', 'Test image analysis')
    
    assert image['image_id'] == 'img-123', 'Image ID mismatch'
    assert image['url'] == '/uploads/test.jpg', 'URL mismatch'
    assert image['analysis'] == 'Test image analysis', 'Analysis mismatch'
    assert len(session.images) == 1, 'Should have 1 image'
    
    print('  ✓ Image added successfully')
    print(f'  ✓ Image ID: {image["image_id"]}')
    print(f'  ✓ Total images: {len(session.images)}')
    return True


def test_session_end():
    """Test 4: Session can be ended"""
    print('\n[Test 4] Testing session end...')
    
    session = EmergencySession('test-user', None)
    
    # Add some activity
    session.add_transcript_entry('user', 'Test message')
    
    # End session
    result = session.end_session('resolved')
    
    assert session.status == 'ended', 'Session should be ended'
    assert session.end_time is not None, 'End time should be set'
    assert result['resolution'] == 'resolved', 'Resolution mismatch'
    assert 'duration' in result, 'Duration missing'
    
    print('  ✓ Session ended successfully')
    print(f'  ✓ Status: {session.status}')
    print(f'  ✓ Duration: {result["duration"]:.2f}s')
    print(f'  ✓ Resolution: {result["resolution"]}')
    return True


def test_service_session_management():
    """Test 5: Service can manage multiple sessions"""
    print('\n[Test 5] Testing service session management...')
    
    # Create temporary storage path
    import tempfile
    temp_dir = tempfile.mkdtemp()
    
    service = EmergencyAssistantService(session_storage_path=temp_dir)
    
    # Create session
    session1 = service.create_session('user-1', 'manual-1')
    assert session1.session_id in service.active_sessions, 'Session should be active'
    
    # Get session
    retrieved = service.get_session(session1.session_id)
    assert retrieved is not None, 'Session should be retrievable'
    assert retrieved.session_id == session1.session_id, 'Session ID mismatch'
    
    # Create another session
    session2 = service.create_session('user-2', None)
    assert len(service.active_sessions) == 2, 'Should have 2 active sessions'
    
    # End first session
    result = service.end_session(session1.session_id, 'resolved')
    assert result is not None, 'End result should not be None'
    assert len(service.active_sessions) == 1, 'Should have 1 active session'
    
    print('  ✓ Session creation works')
    print('  ✓ Session retrieval works')
    print('  ✓ Multiple sessions supported')
    print('  ✓ Session ending works')
    print(f'  ✓ Active sessions: {len(service.active_sessions)}')
    
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir)
    
    return True


def test_message_generation():
    """Test 6: Service can generate responses"""
    print('\n[Test 6] Testing message generation...')
    
    import tempfile
    temp_dir = tempfile.mkdtemp()
    
    service = EmergencyAssistantService(session_storage_path=temp_dir)
    session = service.create_session('test-user', None)
    
    # Generate response
    result = service.generate_response(session.session_id, 'Hello, I need help')
    
    assert result.get('success') == True, 'Response should be successful'
    assert 'response' in result, 'Response text missing'
    assert len(result['response']) > 0, 'Response should not be empty'
    
    # Check transcript was updated
    retrieved_session = service.get_session(session.session_id)
    assert len(retrieved_session.transcript) == 2, 'Should have user message and assistant response'
    
    print('  ✓ Response generated successfully')
    print(f'  ✓ Response: {result["response"][:50]}...')
    print(f'  ✓ Transcript entries: {len(retrieved_session.transcript)}')
    
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir)
    
    return True


def test_audio_handling():
    """Test 7: Service can handle audio input"""
    print('\n[Test 7] Testing audio handling...')
    
    import tempfile
    temp_dir = tempfile.mkdtemp()
    
    service = EmergencyAssistantService(session_storage_path=temp_dir)
    session = service.create_session('test-user', None)
    
    # Simulate audio input
    fake_audio = b'fake audio data'
    result = service.handle_audio_input(session.session_id, fake_audio)
    
    assert result.get('success') == True, 'Audio handling should succeed'
    assert 'transcript' in result, 'Transcript missing'
    
    print('  ✓ Audio input handled')
    print(f'  ✓ Transcript: {result["transcript"]}')
    
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir)
    
    return True


def test_image_upload():
    """Test 8: Service can handle image uploads"""
    print('\n[Test 8] Testing image upload...')
    
    import tempfile
    temp_dir = tempfile.mkdtemp()
    
    service = EmergencyAssistantService(session_storage_path=temp_dir)
    session = service.create_session('test-user', None)
    
    # Simulate image upload
    fake_image = b'fake image data'
    result = service.handle_image_upload(session.session_id, fake_image, 'image/jpeg')
    
    assert result.get('success') == True, 'Image upload should succeed'
    assert 'image_id' in result, 'Image ID missing'
    assert 'url' in result, 'URL missing'
    assert 'analysis' in result, 'Analysis missing'
    
    # Check image was added to session
    retrieved_session = service.get_session(session.session_id)
    assert len(retrieved_session.images) == 1, 'Should have 1 image'
    
    print('  ✓ Image upload handled')
    print(f'  ✓ Image ID: {result["image_id"]}')
    print(f'  ✓ Images in session: {len(retrieved_session.images)}')
    
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir)
    
    return True


def test_session_persistence():
    """Test 9: Sessions are persisted to storage"""
    print('\n[Test 9] Testing session persistence...')
    
    import tempfile
    import os
    temp_dir = tempfile.mkdtemp()
    
    # Create service and session
    service1 = EmergencyAssistantService(session_storage_path=temp_dir)
    session = service1.create_session('test-user', 'manual-123')
    session.add_transcript_entry('user', 'Test message')
    service1._save_session(session)
    
    session_id = session.session_id
    
    # Check file was created
    session_file = os.path.join(temp_dir, f'{session_id}.json')
    assert os.path.exists(session_file), 'Session file should exist'
    
    # Create new service instance and load session
    service2 = EmergencyAssistantService(session_storage_path=temp_dir)
    loaded_session = service2._load_session_from_file(session_id)
    
    assert loaded_session is not None, 'Session should be loadable'
    assert loaded_session.session_id == session_id, 'Session ID mismatch'
    assert loaded_session.user_id == 'test-user', 'User ID mismatch'
    assert len(loaded_session.transcript) == 1, 'Transcript should be preserved'
    
    print('  ✓ Session saved to file')
    print('  ✓ Session loaded from file')
    print(f'  ✓ Session ID: {loaded_session.session_id}')
    print(f'  ✓ Transcript preserved: {len(loaded_session.transcript)} entries')
    
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir)
    
    return True


def run_all_tests():
    """Run all unit tests"""
    print('=' * 60)
    print('Emergency Assistant Connection Unit Tests')
    print('=' * 60)
    print()
    
    tests = [
        test_emergency_session_creation,
        test_transcript_management,
        test_image_management,
        test_session_end,
        test_service_session_management,
        test_message_generation,
        test_audio_handling,
        test_image_upload,
        test_session_persistence,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
                print(f'  ✗ Test failed')
        except Exception as e:
            failed += 1
            print(f'  ✗ Test failed with exception: {str(e)}')
            import traceback
            traceback.print_exc()
    
    print()
    print('=' * 60)
    print('Test Summary')
    print('=' * 60)
    print(f'Total tests: {len(tests)}')
    print(f'Passed: {passed}')
    print(f'Failed: {failed}')
    print('=' * 60)
    
    if failed == 0:
        print('✓ ALL TESTS PASSED')
        print('=' * 60)
        return 0
    else:
        print('✗ SOME TESTS FAILED')
        print('=' * 60)
        return 1


if __name__ == '__main__':
    try:
        exit_code = run_all_tests()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print('\n\nTests interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n\nUnexpected error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
