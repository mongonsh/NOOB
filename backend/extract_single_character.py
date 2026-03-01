#!/usr/bin/env python3
"""
Extract a single character from sprite images that contain multiple characters.
"""
import json
import base64
from PIL import Image
import io

def extract_single_character(base64_image: str) -> str:
    """
    Extract just one character from an image that contains multiple characters.
    Assumes characters are arranged horizontally.
    """
    try:
        # Decode base64
        image_bytes = base64.b64decode(base64_image)
        img = Image.open(io.BytesIO(image_bytes))
        
        print(f"  Original size: {img.size}")
        
        # If the image is square or nearly square, assume 4 characters are drawn in it
        # Extract the leftmost 1/4 of the image
        if img.width == img.height or abs(img.width - img.height) < 100:
            # Square image with 4 characters - extract left quarter
            char_width = img.width // 4
            single_char = img.crop((0, 0, char_width, img.height))
            print(f"  Extracted single character: {single_char.size}")
        elif img.width > img.height * 2:
            # Wide sprite sheet - extract first frame
            frame_width = img.width // 4
            single_char = img.crop((0, 0, frame_width, img.height))
            print(f"  Extracted first frame: {single_char.size}")
        else:
            # Already a single character
            single_char = img
            print(f"  Already single character")
        
        # Resize to reasonable size (128x128 or maintain aspect ratio)
        if single_char.width > 128:
            aspect_ratio = single_char.width / single_char.height
            if aspect_ratio > 0.8 and aspect_ratio < 1.2:
                # Nearly square - resize to 128x128
                single_char = single_char.resize((128, 128), Image.Resampling.LANCZOS)
            else:
                # Maintain aspect ratio
                if single_char.width > single_char.height:
                    new_width = 128
                    new_height = int(128 / aspect_ratio)
                else:
                    new_height = 128
                    new_width = int(128 * aspect_ratio)
                single_char = single_char.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"  Resized to: {single_char.size}")
        
        # Convert back to base64
        output = io.BytesIO()
        single_char.save(output, format='PNG')
        output.seek(0)
        return base64.b64encode(output.read()).decode('utf-8')
        
    except Exception as e:
        print(f"  Error: {e}")
        return base64_image


# Load and fix game data
print("Loading game data...")
with open('generated/delivered-with-care.json', 'r') as f:
    data = json.load(f)

print(f"Found {len(data['missions'])} missions\n")

for i, mission in enumerate(data['missions']):
    if 'custom_assets' not in mission:
        continue
    
    print(f"Mission {i+1}: {mission.get('title', 'Untitled')}")
    
    # Fix player sprite
    if 'player' in mission['custom_assets']:
        print("  Fixing player sprite...")
        mission['custom_assets']['player'] = extract_single_character(
            mission['custom_assets']['player']
        )
    
    # Fix hazard sprite
    if 'hazard' in mission['custom_assets']:
        print("  Fixing hazard sprite...")
        mission['custom_assets']['hazard'] = extract_single_character(
            mission['custom_assets']['hazard']
        )
    
    # Fix tool sprite
    if 'tool' in mission['custom_assets']:
        print("  Fixing tool sprite...")
        mission['custom_assets']['tool'] = extract_single_character(
            mission['custom_assets']['tool']
        )
    print()

# Save
print("Saving fixed game data...")
with open('generated/delivered-with-care.json', 'w') as f:
    json.dump(data, f, indent=2)

print("✓ Done! Game data updated.")
print("Refresh your browser to see the changes.")
