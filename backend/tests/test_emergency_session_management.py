"""
Tests for Emergency Assistant Session Management

Tests basic session management functionality including:
- Session creation
- Session persistence
- Session resumption
- Session disconnection
- Auto-save functionality

Note: These tests mock Flask-SocketIO dependencies to run without Flask
"""

import os
import sys
import json
import tempfile
from datetime import datetime
from unittest.mock import MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock flask_socketio before importing the service
sys.modules['flask_socketio'] = MagicMock()

from services.emergency_assistant_service import (
    EmergencySession,
    EmergencyAssistantService
)


def test_session_creation():
    """Test creating a new emergency session"""
    with tempfile.TemporaryDirectory() as tmpdir:
        service = EmergencyAssistantService(session_storage_path=tmpdir)
        
        session = service.create_session(user_id="test_user", manual_id="manual_123")
        
        assert session is not None
        assert session.user_id == "test_user"
        assert session.manual_id == "manual_123"
        assert session.status == "active"
        assert len(session.transcript) == 0
        assert len(session.images) == 0
        
        # Verify session is in active sessions
        assert session.session_id in service.active_sessions
        
        # Verify session was saved to file
        session_file = os.path.join(tmpdir, f"{session.session_id}.json")
        assert os.path.exists(session_file)
        
        print("✓ Session creation test passed")


def test_session_persistence():
    """Test that sessions are saved to disk"""
    with tempfile.TemporaryDirectory() as tmpdir:
        service = EmergencyAssistantService(session_storage_path=tmpdir)
        
        # Create session and add some data
        session = service.create_session(user_id="test_user")
        session.add_transcript_entry("user", "Help! The machine is broken")
        session.add_transcript_entry("assistant", "I'm here to help. Can you describe the issue?")
        service._save_session(session)
        
        # Load session from file
        with open(os.path.join(tmpdir, f"{session.session_id}.json"), 'r') as f:
            saved_data = json.load(f)
        
        assert saved_data['session_id'] == session.session_id
        assert saved_data['user_id'] == "test_user"
        assert len(saved_data['transcript']) == 2
        assert saved_data['transcript'][0]['speaker'] == "user"
        assert saved_data['transcript'][1]['speaker'] == "assistant"
        
        print("✓ Session persistence test passed")


def test_session_resumption():
    """Test resuming a disconnected session"""
    with tempfile.TemporaryDirectory() as tmpdir:
        service = EmergencyAssistantService(session_storage_path=tmpdir)
        
        # Create and disconnect a session
        session = service.create_session(user_id="test_user")
        session_id = session.session_id
        session.add_transcript_entry("user", "I need help")
        service._save_session(session)
        
        # Disconnect the session
        service.disconnect_session(session_id)
        assert session.status == "disconnected"
        
        # Resume the session
        resumed_session = service.resume_session(session_id)
        
        assert resumed_session is not None
        assert resumed_session.session_id == session_id
        assert resumed_session.status == "active"
        assert len(resumed_session.transcript) == 1
        assert resumed_session.transcript[0]['text'] == "I need help"
        
        print("✓ Session resumption test passed")


def test_session_resumption_from_file():
    """Test resuming a session after service restart"""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create service and session
        service1 = EmergencyAssistantService(session_storage_path=tmpdir)
        session = service1.create_session(user_id="test_user")
        session_id = session.session_id
        session.add_transcript_entry("user", "Emergency!")
        service1._save_session(session)
        service1.disconnect_session(session_id)
        
        # Simulate service restart by creating new service instance
        service2 = EmergencyAssistantService(session_storage_path=tmpdir)
        
        # Resume session with new service instance
        resumed_session = service2.resume_session(session_id)
        
        assert resumed_session is not None
        assert resumed_session.session_id == session_id
        assert resumed_session.status == "active"
        assert len(resumed_session.transcript) == 1
        
        print("✓ Session resumption from file test passed")


def test_session_end():
    """Test ending a session"""
    with tempfile.TemporaryDirectory() as tmpdir:
        service = EmergencyAssistantService(session_storage_path=tmpdir)
        
        session = service.create_session(user_id="test_user")
        session_id = session.session_id
        
        # End the session
        result = service.end_session(session_id, resolution="resolved")
        
        assert result is not None
        assert result['session_id'] == session_id
        assert result['resolution'] == "resolved"
        assert 'duration' in result
        
        # Verify session is no longer active
        assert session_id not in service.active_sessions
        
        # Verify session is in history
        assert len(service.session_history) == 1
        
        # Verify session file still exists
        session_file = os.path.join(tmpdir, f"{session_id}.json")
        assert os.path.exists(session_file)
        
        print("✓ Session end test passed")


def test_auto_save_on_transcript_update():
    """Test that sessions are auto-saved when transcript is updated"""
    with tempfile.TemporaryDirectory() as tmpdir:
        service = EmergencyAssistantService(session_storage_path=tmpdir)
        
        session = service.create_session(user_id="test_user")
        session_id = session.session_id
        
        # Add message through service method (should trigger auto-save)
        service.generate_response(session_id, "Help me!")
        
        # Load session from file
        with open(os.path.join(tmpdir, f"{session_id}.json"), 'r') as f:
            saved_data = json.load(f)
        
        # Should have user message and assistant response
        assert len(saved_data['transcript']) >= 2
        
        print("✓ Auto-save on transcript update test passed")


def test_session_history():
    """Test retrieving session history"""
    with tempfile.TemporaryDirectory() as tmpdir:
        service = EmergencyAssistantService(session_storage_path=tmpdir)
        
        # Create and end multiple sessions
        session1 = service.create_session(user_id="user1")
        service.end_session(session1.session_id, resolution="resolved")
        
        session2 = service.create_session(user_id="user2")
        service.end_session(session2.session_id, resolution="escalated")
        
        session3 = service.create_session(user_id="user1")
        service.end_session(session3.session_id, resolution="incomplete")
        
        # Get all history
        all_history = service.get_session_history()
        assert len(all_history) == 3
        
        # Get history for specific user
        user1_history = service.get_session_history(user_id="user1")
        assert len(user1_history) == 2
        
        user2_history = service.get_session_history(user_id="user2")
        assert len(user2_history) == 1
        
        print("✓ Session history test passed")


def run_all_tests():
    """Run all session management tests"""
    print("\n=== Running Emergency Session Management Tests ===\n")
    
    test_session_creation()
    test_session_persistence()
    test_session_resumption()
    test_session_resumption_from_file()
    test_session_end()
    test_auto_save_on_transcript_update()
    test_session_history()
    
    print("\n=== All tests passed! ===\n")


if __name__ == "__main__":
    run_all_tests()
