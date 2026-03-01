#!/usr/bin/env python3
"""
Fix sprites that have multiple characters drawn in them.
Only processes images that actually need fixing.
"""
import json
import base64
from PIL import Image, ImageDraw
import io

def has_multiple_characters(img):
    """
    Detect if an image has multiple characters by checking if there are
    distinct vertical sections with content.
    """
    # Convert to grayscale for analysis
    gray = img.convert('L')
    width, height = gray.size
    
    # Check vertical slices for content
    quarter_width = width // 4
    slices_with_content = 0
    
    for i in range(4):
        x_start = i * quarter_width
        x_end = (i + 1) * quarter_width
        slice_img = gray.crop((x_start, 0, x_end, height))
        
        # Check if this slice has significant content
        pixels = list(slice_img.getdata())
        non_white = sum(1 for p in pixels if p < 250)
        
        if non_white > 100:  # Has content
            slices_with_content += 1
    
    return slices_with_content >= 3  # If 3+ slices have content, likely multiple chars


def extract_first_character(base64_image: str) -> tuple:
    """
    Extract first character if image has multiple characters.
    Returns (new_base64, was_modified)
    """
    try:
        # Decode
        image_bytes = base64.b64decode(base64_image)
        img = Image.open(io.BytesIO(image_bytes))
        
        print(f"    Original: {img.size}")
        
        # Check if it has multiple characters
        if not has_multiple_characters(img):
            print(f"    ✓ Already single character, skipping")
            return (base64_image, False)
        
        print(f"    ⚠ Multiple characters detected!")
        
        # Extract leftmost quarter
        char_width = img.width // 4
        single_char = img.crop((0, 0, char_width, img.height))
        print(f"    Extracted: {single_char.size}")
        
        # Resize to 128x128 maintaining aspect ratio
        single_char.thumbnail((128, 128), Image.Resampling.LANCZOS)
        print(f"    Resized: {single_char.size}")
        
        # Convert back to base64
        output = io.BytesIO()
        single_char.save(output, format='PNG')
        output.seek(0)
        new_base64 = base64.b64encode(output.read()).decode('utf-8')
        
        return (new_base64, True)
        
    except Exception as e:
        print(f"    Error: {e}")
        return (base64_image, False)


# Load game data
print("Loading game data...")
with open('generated/delivered-with-care.json', 'r') as f:
    data = json.load(f)

print(f"Found {len(data['missions'])} missions\n")

total_fixed = 0

for i, mission in enumerate(data['missions']):
    if 'custom_assets' not in mission:
        continue
    
    print(f"Mission {i+1}: {mission.get('title', 'Untitled')}")
    mission_fixed = False
    
    # Fix player sprite
    if 'player' in mission['custom_assets']:
        print("  Player sprite:")
        new_data, modified = extract_first_character(mission['custom_assets']['player'])
        if modified:
            mission['custom_assets']['player'] = new_data
            mission_fixed = True
    
    # Fix hazard sprite
    if 'hazard' in mission['custom_assets']:
        print("  Hazard sprite:")
        new_data, modified = extract_first_character(mission['custom_assets']['hazard'])
        if modified:
            mission['custom_assets']['hazard'] = new_data
            mission_fixed = True
    
    # Fix tool sprite
    if 'tool' in mission['custom_assets']:
        print("  Tool sprite:")
        new_data, modified = extract_first_character(mission['custom_assets']['tool'])
        if modified:
            mission['custom_assets']['tool'] = new_data
            mission_fixed = True
    
    if mission_fixed:
        total_fixed += 1
    print()

if total_fixed > 0:
    print(f"Saving changes ({total_fixed} missions fixed)...")
    with open('generated/delivered-with-care.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("✓ Done! Refresh your browser.")
else:
    print("✓ No changes needed - all sprites are already single characters!")
