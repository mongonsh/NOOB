#!/usr/bin/env python3
"""
Test Gemini image generation
"""
import os
from dotenv import load_dotenv
load_dotenv()

from services.gemini_image_service import generate_player_sprite

print("Testing Gemini image generation...")
print(f"GEMINI_API_KEY set: {bool(os.getenv('GEMINI_API_KEY'))}")

# Test player sprite generation
result = generate_player_sprite("Safety Officer", "warehouse")

if result:
    print(f"✓ Player sprite generated successfully! ({len(result)} bytes)")
else:
    print("✗ Player sprite generation failed")
