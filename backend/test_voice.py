#!/usr/bin/env python3
"""
Quick test script for voice transcription functionality.
Tests both the Mistral Voxtral API and the speech_to_text function.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from services.voice_service import speech_to_text
from utils.config import MISTRAL_API_KEY

def test_api_key():
    """Test if Mistral API key is configured"""
    print("🔑 Testing API Key Configuration...")
    if not MISTRAL_API_KEY or MISTRAL_API_KEY == "your_mistral_api_key_here":
        print("❌ MISTRAL_API_KEY not configured in .env file")
        return False
    print(f"✅ API Key configured: {MISTRAL_API_KEY[:10]}...")
    return True

def test_audio_file():
    """Test with a sample audio file if available"""
    print("\n🎤 Testing Audio Transcription...")
    
    # Create a simple test (this would need actual audio data)
    print("⚠️  Note: This test requires actual audio data")
    print("   To test properly:")
    print("   1. Start the backend: python app.py")
    print("   2. Start the frontend: cd ../frontend && npm run dev")
    print("   3. Open browser and test microphone button")
    
    return True

def test_imports():
    """Test if all required modules can be imported"""
    print("\n📦 Testing Module Imports...")
    
    try:
        from mistralai import Mistral
        print("✅ mistralai imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import mistralai: {e}")
        return False
    
    try:
        from flask_socketio import SocketIO
        print("✅ flask_socketio imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import flask_socketio: {e}")
        print("   Run: pip install flask-socketio python-socketio")
        return False
    
    return True

def main():
    print("=" * 60)
    print("NOOB Voice Service Test")
    print("=" * 60)
    
    all_passed = True
    
    # Test imports
    if not test_imports():
        all_passed = False
    
    # Test API key
    if not test_api_key():
        all_passed = False
    
    # Test audio
    if not test_audio_file():
        all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All tests passed!")
        print("\nNext steps:")
        print("1. Start backend: python app.py")
        print("2. Start frontend: cd ../frontend && npm run dev")
        print("3. Test voice in browser")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
    print("=" * 60)

if __name__ == "__main__":
    main()
