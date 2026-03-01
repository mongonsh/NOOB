#!/usr/bin/env python3
"""
Fix sprite sheets in existing game data by extracting only the first frame.
This fixes the issue where 4 player sprites show at once.
"""
import json
import base64
from PIL import Image
import io
import sys

def extract_first_frame(base64_image: str) -> str:
    """
    Extract the first frame from a sprite sheet.
    If the image has 4 characters side-by-side, extract just the first one.
    """
    try:
        # Decode base64
        image_bytes = base64.b64decode(base64_image)
        img = Image.open(io.BytesIO(image_bytes))
        
        print(f"  Original size: {img.size}")
        
        # Check if image looks like a horizontal sprite sheet
        # (4 frames side by side would be 4:1 aspect ratio)
        aspect_ratio = img.width / img.height
        
        if aspect_ratio > 2.5:  # Likely a sprite sheet
            # Extract first quarter (first frame)
            frame_width = img.width // 4
            first_frame = img.crop((0, 0, frame_width, img.height))
            print(f"  Extracted first frame: {first_frame.size}")
        elif img.width == img.height and img.width > 512:
            # Large square image - might have 4 characters in a 2x2 grid
            # Or might be a single large character
            # For now, just resize it
            first_frame = img.resize((256, 256), Image.Resampling.LANCZOS)
            print(f"  Resized to: {first_frame.size}")
        else:
            # Already a single frame
            first_frame = img
            print(f"  Already single frame: {first_frame.size}")
        
        # Convert back to base64
        output = io.BytesIO()
        first_frame.save(output, format='PNG')
        output.seek(0)
        return base64.b64encode(output.read()).decode('utf-8')
        
    except Exception as e:
        print(f"  Error processing image: {e}")
        return base64_image  # Return original if processing fails


def fix_game_data(game_file: str):
    """Fix all sprite sheets in a game data file."""
    print(f"Loading {game_file}...")
    
    with open(game_file, 'r') as f:
        data = json.load(f)
    
    missions_fixed = 0
    
    for i, mission in enumerate(data.get('missions', [])):
        if 'custom_assets' not in mission:
            continue
        
        print(f"\nMission {i+1}: {mission.get('title', 'Untitled')}")
        
        # Fix player sprite
        if 'player' in mission['custom_assets']:
            print("  Fixing player sprite...")
            mission['custom_assets']['player'] = extract_first_frame(
                mission['custom_assets']['player']
            )
            missions_fixed += 1
        
        # Fix hazard sprite
        if 'hazard' in mission['custom_assets']:
            print("  Fixing hazard sprite...")
            mission['custom_assets']['hazard'] = extract_first_frame(
                mission['custom_assets']['hazard']
            )
        
        # Fix tool sprite
        if 'tool' in mission['custom_assets']:
            print("  Fixing tool sprite...")
            mission['custom_assets']['tool'] = extract_first_frame(
                mission['custom_assets']['tool']
            )
    
    # Save fixed data
    output_file = game_file.replace('.json', '_fixed.json')
    print(f"\nSaving fixed data to {output_file}...")
    
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\n✓ Fixed {missions_fixed} missions")
    print(f"✓ Saved to {output_file}")
    print(f"\nTo use the fixed version:")
    print(f"  mv {output_file} {game_file}")


if __name__ == '__main__':
    if len(sys.argv) > 1:
        game_file = sys.argv[1]
    else:
        game_file = 'generated/delivered-with-care.json'
    
    fix_game_data(game_file)
