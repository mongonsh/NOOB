"""
Integration test for real-time voice streaming

This test verifies the complete streaming flow from message input
to audio chunk delivery.
"""

import os
import sys
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.emergency_assistant_service import get_emergency_service


def test_streaming_integration():
    """Test complete streaming integration"""
    print("\n" + "="*70)
    print("STREAMING INTEGRATION TEST")
    print("="*70)
    
    try:
        # Initialize service
        service = get_emergency_service()
        print("✓ Emergency service initialized")
        
        # Create session
        session = service.create_session("integration-test-user")
        session_id = session.session_id
        print(f"✓ Session created: {session_id}")
        
        # Test messages with different lengths
        test_messages = [
            "Help!",
            "What should I do in an emergency?",
            "I need detailed instructions on how to handle a safety incident with multiple steps and considerations."
        ]
        
        for i, message in enumerate(test_messages, 1):
            print(f"\n--- Test Message {i} ---")
            print(f"Message: '{message}'")
            print(f"Length: {len(message)} characters")
            
            start_time = time.time()
            
            # Track streaming metrics
            text_received = False
            audio_chunks = 0
            total_bytes = 0
            first_chunk_time = None
            
            # Stream response
            for chunk_data in service.generate_response_stream(session_id, message):
                chunk_type = chunk_data.get('type')
                
                if chunk_type == 'text':
                    text_received = True
                    text_time = time.time() - start_time
                    print(f"  ✓ Text received in {text_time:.3f}s")
                    print(f"    Response: {chunk_data['text'][:60]}...")
                
                elif chunk_type == 'audio_chunk':
                    audio_chunks += 1
                    chunk_size = len(chunk_data['chunk'])
                    total_bytes += chunk_size
                    
                    if first_chunk_time is None:
                        first_chunk_time = time.time() - start_time
                        print(f"  ✓ First audio chunk in {first_chunk_time:.3f}s")
                
                elif chunk_type == 'audio_complete':
                    total_time = time.time() - start_time
                    print(f"  ✓ Streaming complete in {total_time:.3f}s")
                    print(f"    Total chunks: {chunk_data['total_chunks']}")
                    print(f"    Total bytes: {total_bytes}")
                    print(f"    Avg chunk size: {total_bytes // audio_chunks if audio_chunks > 0 else 0} bytes")
                
                elif chunk_type == 'error':
                    print(f"  ✗ Error: {chunk_data['error']}")
                    return False
            
            # Verify metrics
            if not text_received:
                print("  ✗ No text received")
                return False
            
            if audio_chunks == 0:
                print("  ✗ No audio chunks received")
                return False
            
            print(f"  ✓ Test {i} passed")
        
        # Verify session state
        session = service.get_session(session_id)
        if not session:
            print("\n✗ Session not found after streaming")
            return False
        
        print(f"\n✓ Session state verified")
        print(f"  Transcript entries: {len(session.transcript)}")
        
        # Clean up
        service.end_session(session_id)
        print(f"✓ Session ended")
        
        print("\n" + "="*70)
        print("✅ INTEGRATION TEST PASSED")
        print("="*70)
        
        return True
        
    except Exception as e:
        print(f"\n✗ Integration test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_streaming_performance():
    """Test streaming performance metrics"""
    print("\n" + "="*70)
    print("STREAMING PERFORMANCE TEST")
    print("="*70)
    
    try:
        service = get_emergency_service()
        session = service.create_session("performance-test-user")
        session_id = session.session_id
        
        print(f"Session: {session_id}")
        
        # Test with standard message
        message = "What are the safety procedures?"
        print(f"\nTesting with: '{message}'")
        
        start_time = time.time()
        first_chunk_time = None
        last_chunk_time = None
        chunk_times = []
        
        for chunk_data in service.generate_response_stream(session_id, message):
            current_time = time.time() - start_time
            
            if chunk_data.get('type') == 'audio_chunk':
                if first_chunk_time is None:
                    first_chunk_time = current_time
                last_chunk_time = current_time
                chunk_times.append(current_time)
        
        total_time = time.time() - start_time
        
        # Calculate metrics
        print(f"\nPerformance Metrics:")
        print(f"  First chunk latency: {first_chunk_time:.3f}s")
        print(f"  Last chunk time: {last_chunk_time:.3f}s")
        print(f"  Total time: {total_time:.3f}s")
        print(f"  Total chunks: {len(chunk_times)}")
        
        if len(chunk_times) > 1:
            avg_interval = (last_chunk_time - first_chunk_time) / (len(chunk_times) - 1)
            print(f"  Avg chunk interval: {avg_interval:.3f}s")
        
        # Performance assertions
        if first_chunk_time > 2.0:
            print(f"  ⚠️  Warning: First chunk latency high ({first_chunk_time:.3f}s > 2.0s)")
        else:
            print(f"  ✓ First chunk latency acceptable")
        
        if len(chunk_times) == 0:
            print(f"  ✗ No chunks received")
            return False
        
        service.end_session(session_id)
        
        print("\n✅ PERFORMANCE TEST PASSED")
        return True
        
    except Exception as e:
        print(f"\n✗ Performance test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all integration tests"""
    print("\n" + "="*70)
    print("REAL-TIME VOICE STREAMING - INTEGRATION TESTS")
    print("="*70)
    
    # Check for API key
    if not os.getenv('ELEVENLABS_API_KEY'):
        print("\n⚠️  WARNING: ELEVENLABS_API_KEY not found")
        print("   Tests may fail without a valid API key")
    
    results = []
    
    # Run tests
    results.append(("Streaming Integration", test_streaming_integration()))
    results.append(("Streaming Performance", test_streaming_performance()))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All integration tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit(main())
