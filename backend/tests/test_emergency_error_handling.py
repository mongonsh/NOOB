"""
Unit tests for Emergency Assistant error handling

Tests connection failures, invalid data, and error recovery scenarios.
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.emergency_assistant_service import EmergencyAssistantService, EmergencySession


class TestEmergencyErrorHandling:
    """Test error handling in emergency assistant service"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.service = EmergencyAssistantService(session_storage_path="data/test_emergency_sessions")
        
    def teardown_method(self):
        """Clean up after tests"""
        # Clear active sessions
        self.service.active_sessions.clear()
        self.service.session_history.clear()
    
    def test_get_nonexistent_session(self):
        """Test getting a session that doesn't exist"""
        result = self.service.get_session('nonexistent-session-id')
        assert result is None
    
    def test_end_nonexistent_session(self):
        """Test ending a session that doesn't exist"""
        result = self.service.end_session('nonexistent-session-id')
        assert result is None
    
    def test_disconnect_nonexistent_session(self):
        """Test disconnecting a session that doesn't exist"""
        result = self.service.disconnect_session('nonexistent-session-id')
        assert result is None
    
    def test_resume_nonexistent_session(self):
        """Test resuming a session that doesn't exist"""
        result = self.service.resume_session('nonexistent-session-id')
        assert result is None
    
    def test_handle_audio_with_invalid_session(self):
        """Test audio handling with invalid session ID"""
        result = self.service.handle_audio_input('invalid-session', b'audio-data')
        assert 'error' in result
        assert result['error'] == 'Session not found'
    
    def test_handle_image_with_invalid_session(self):
        """Test image handling with invalid session ID"""
        result = self.service.handle_image_upload('invalid-session', b'image-data', 'image/jpeg')
        assert 'error' in result
        assert result['error'] == 'Session not found'
    
    def test_generate_response_with_invalid_session(self):
        """Test response generation with invalid session ID"""
        result = self.service.generate_response('invalid-session', 'test message')
        assert 'error' in result
        assert result['error'] == 'Session not found'
    
    def test_session_creation_and_retrieval(self):
        """Test creating and retrieving a session"""
        session = self.service.create_session('test-user', 'test-manual')
        assert session is not None
        assert session.user_id == 'test-user'
        assert session.manual_id == 'test-manual'
        assert session.status == 'active'
        
        # Retrieve the session
        retrieved = self.service.get_session(session.session_id)
        assert retrieved is not None
        assert retrieved.session_id == session.session_id
    
    def test_session_disconnect_and_resume(self):
        """Test disconnecting and resuming a session"""
        # Create session
        session = self.service.create_session('test-user')
        session_id = session.session_id
        
        # Disconnect session
        result = self.service.disconnect_session(session_id)
        assert result is not None
        assert result['status'] == 'disconnected'
        assert result['can_resume'] is True
        
        # Verify session is disconnected
        session = self.service.get_session(session_id)
        assert session.status == 'disconnected'
        
        # Resume session
        resumed = self.service.resume_session(session_id)
        assert resumed is not None
        assert resumed.session_id == session_id
        assert resumed.status == 'active'
    
    def test_session_end_prevents_resume(self):
        """Test that ended sessions cannot be resumed"""
        # Create and end session
        session = self.service.create_session('test-user')
        session_id = session.session_id
        self.service.end_session(session_id, 'resolved')
        
        # Try to resume - should fail
        resumed = self.service.resume_session(session_id)
        assert resumed is None
    
    def test_multiple_sessions_isolation(self):
        """Test that multiple sessions are isolated"""
        session1 = self.service.create_session('user1')
        session2 = self.service.create_session('user2')
        
        assert session1.session_id != session2.session_id
        assert session1.user_id == 'user1'
        assert session2.user_id == 'user2'
        
        # End session1
        self.service.end_session(session1.session_id)
        
        # Session2 should still be active
        retrieved = self.service.get_session(session2.session_id)
        assert retrieved is not None
        assert retrieved.status == 'active'
    
    def test_transcript_entry_validation(self):
        """Test transcript entry creation"""
        session = self.service.create_session('test-user')
        
        entry = session.add_transcript_entry('user', 'Test message')
        assert entry is not None
        assert entry['speaker'] == 'user'
        assert entry['text'] == 'Test message'
        assert 'timestamp' in entry
        
        assert len(session.transcript) == 1
    
    def test_image_entry_validation(self):
        """Test image entry creation"""
        session = self.service.create_session('test-user')
        
        image = session.add_image('img-123', '/path/to/image.jpg', 'Analysis result')
        assert image is not None
        assert image['image_id'] == 'img-123'
        assert image['url'] == '/path/to/image.jpg'
        assert image['analysis'] == 'Analysis result'
        assert 'timestamp' in image
        
        assert len(session.images) == 1
    
    def test_session_to_dict_serialization(self):
        """Test session serialization to dictionary"""
        session = self.service.create_session('test-user', 'test-manual')
        session.add_transcript_entry('user', 'Hello')
        session.add_image('img-1', '/image.jpg', 'Test')
        
        data = session.to_dict()
        assert data['session_id'] == session.session_id
        assert data['user_id'] == 'test-user'
        assert data['manual_id'] == 'test-manual'
        assert data['status'] == 'active'
        assert len(data['transcript']) == 1
        assert len(data['images']) == 1
    
    def test_session_duration_calculation(self):
        """Test session duration calculation"""
        session = self.service.create_session('test-user')
        session_id = session.session_id
        
        result = self.service.end_session(session_id)
        assert result is not None
        assert 'duration' in result
        assert result['duration'] >= 0
    
    def test_empty_user_id_defaults_to_anonymous(self):
        """Test that empty user ID defaults to anonymous"""
        session = self.service.create_session('')
        assert session.user_id == ''  # Service accepts empty string
        
        session2 = self.service.create_session(None)
        assert session2.user_id is None  # Service accepts None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
