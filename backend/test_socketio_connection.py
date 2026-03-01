#!/usr/bin/env python3
"""
Test Socket.IO Connection and Basic Message Exchange

This test verifies that:
1. Frontend can connect to backend via Socket.IO
2. Emergency session can be created
3. Messages can be exchanged between client and server
4. Session can be ended properly
"""

import socketio
import time
import sys
from datetime import datetime

# Create a Socket.IO client
sio = socketio.Client()

# Test state
test_results = {
    'connection': False,
    'session_started': False,
    'transcript_received': False,
    'message_sent': False,
    'message_response': False,
    'session_ended': False,
    'errors': []
}

session_id = None


# Event handlers
@sio.on('connect')
def on_connect():
    print('[Test] ✓ Connected to server')
    test_results['connection'] = True


@sio.on('disconnect')
def on_disconnect():
    print('[Test] Disconnected from server')


@sio.on('emergency:started')
def on_emergency_started(data):
    global session_id
    print(f'[Test] ✓ Emergency session started: {data}')
    session_id = data.get('sessionId')
    test_results['session_started'] = True
    
    if not session_id:
        test_results['errors'].append('No session ID received')


@sio.on('*')
def catch_all(event, data):
    print(f'[Test] Received event: {event} with data: {data}')


@sio.on('emergency:transcript')
def on_emergency_transcript(data):
    print(f'[Test] ✓ Transcript received: {data}')
    test_results['transcript_received'] = True
    
    entry = data.get('entry', {})
    speaker = entry.get('speaker')
    text = entry.get('text')
    
    print(f'  [{speaker}]: {text}')
    
    # Check if this is a response to our message
    if speaker == 'assistant' and 'placeholder' in text.lower():
        test_results['message_response'] = True


@sio.on('emergency:ended')
def on_emergency_ended(data):
    print(f'[Test] ✓ Session ended: {data}')
    test_results['session_ended'] = True


@sio.on('emergency:error')
def on_emergency_error(data):
    print(f'[Test] ✗ Error: {data}')
    test_results['errors'].append(data.get('message', 'Unknown error'))


def run_tests():
    """Run the Socket.IO connection tests"""
    print('=' * 60)
    print('Socket.IO Connection and Message Exchange Test')
    print('=' * 60)
    print()
    
    # Test 1: Connect to server
    print('[Test 1] Connecting to server...')
    try:
        sio.connect('http://localhost:5001', transports=['websocket', 'polling'])
        time.sleep(1)  # Wait for connection to establish
        
        if not test_results['connection']:
            print('[Test 1] ✗ Failed to connect')
            return False
        
        print('[Test 1] ✓ Connection successful')
    except Exception as e:
        print(f'[Test 1] ✗ Connection failed: {str(e)}')
        test_results['errors'].append(f'Connection error: {str(e)}')
        return False
    
    print()
    
    # Test 2: Start emergency session
    print('[Test 2] Starting emergency session...')
    try:
        sio.emit('emergency:connect', {
            'userId': 'test-user-' + str(int(time.time())),
            'manualId': None
        })
        time.sleep(2)  # Wait for session to start and initial transcript
        
        if not test_results['session_started']:
            print('[Test 2] ✗ Session failed to start')
            return False
        
        if not session_id:
            print('[Test 2] ✗ No session ID received')
            return False
        
        print(f'[Test 2] ✓ Session started with ID: {session_id}')
    except Exception as e:
        print(f'[Test 2] ✗ Session start failed: {str(e)}')
        test_results['errors'].append(f'Session start error: {str(e)}')
        return False
    
    print()
    
    # Test 3: Check initial transcript
    print('[Test 3] Checking initial transcript...')
    if not test_results['transcript_received']:
        print('[Test 3] ✗ No transcript received')
        return False
    
    print('[Test 3] ✓ Initial transcript received')
    print()
    
    # Test 4: Send a test message
    print('[Test 4] Sending test message...')
    try:
        test_message = 'Hello, this is a test message from the automated test suite.'
        sio.emit('emergency:message', {
            'sessionId': session_id,
            'message': test_message
        })
        test_results['message_sent'] = True
        time.sleep(2)  # Wait for response
        
        if not test_results['message_response']:
            print('[Test 4] ✗ No response received')
            return False
        
        print('[Test 4] ✓ Message sent and response received')
    except Exception as e:
        print(f'[Test 4] ✗ Message exchange failed: {str(e)}')
        test_results['errors'].append(f'Message error: {str(e)}')
        return False
    
    print()
    
    # Test 5: End session
    print('[Test 5] Ending session...')
    try:
        sio.emit('emergency:end', {
            'sessionId': session_id,
            'resolution': 'test_completed'
        })
        time.sleep(1)  # Wait for session end confirmation
        
        if not test_results['session_ended']:
            print('[Test 5] ✗ Session failed to end properly')
            return False
        
        print('[Test 5] ✓ Session ended successfully')
    except Exception as e:
        print(f'[Test 5] ✗ Session end failed: {str(e)}')
        test_results['errors'].append(f'Session end error: {str(e)}')
        return False
    
    print()
    
    # Disconnect
    print('[Test 6] Disconnecting...')
    sio.disconnect()
    time.sleep(0.5)
    print('[Test 6] ✓ Disconnected')
    
    return True


def print_summary():
    """Print test summary"""
    print()
    print('=' * 60)
    print('Test Summary')
    print('=' * 60)
    print()
    
    all_passed = all([
        test_results['connection'],
        test_results['session_started'],
        test_results['transcript_received'],
        test_results['message_sent'],
        test_results['message_response'],
        test_results['session_ended']
    ]) and len(test_results['errors']) == 0
    
    print(f"Connection:          {'✓ PASS' if test_results['connection'] else '✗ FAIL'}")
    print(f"Session Started:     {'✓ PASS' if test_results['session_started'] else '✗ FAIL'}")
    print(f"Transcript Received: {'✓ PASS' if test_results['transcript_received'] else '✗ FAIL'}")
    print(f"Message Sent:        {'✓ PASS' if test_results['message_sent'] else '✗ FAIL'}")
    print(f"Message Response:    {'✓ PASS' if test_results['message_response'] else '✗ FAIL'}")
    print(f"Session Ended:       {'✓ PASS' if test_results['session_ended'] else '✗ FAIL'}")
    print()
    
    if test_results['errors']:
        print('Errors:')
        for error in test_results['errors']:
            print(f'  - {error}')
        print()
    
    print('=' * 60)
    if all_passed:
        print('✓ ALL TESTS PASSED')
        print('=' * 60)
        return 0
    else:
        print('✗ SOME TESTS FAILED')
        print('=' * 60)
        return 1


if __name__ == '__main__':
    print()
    print('Starting Socket.IO Connection Test...')
    print('Make sure the backend server is running on http://localhost:5001')
    print()
    
    try:
        success = run_tests()
        exit_code = print_summary()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print('\n\nTest interrupted by user')
        sio.disconnect()
        sys.exit(1)
    except Exception as e:
        print(f'\n\nUnexpected error: {str(e)}')
        import traceback
        traceback.print_exc()
        sio.disconnect()
        sys.exit(1)
