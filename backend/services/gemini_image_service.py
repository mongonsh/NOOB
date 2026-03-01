"""
Gemini Image Generation Service (Nano Banana)
Uses Gemini's native image generation capabilities to create professional game assets
"""
import os
import base64
import io
from PIL import Image
import google.generativeai as genai

# Initialize Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Use Nano Banana 2 (fast, high-volume)
MODEL_NAME = 'gemini-2.5-flash-image'


def remove_gray_background(base64_image: str) -> str:
    """
    Remove gray/white background from image and make it transparent.
    Returns base64 encoded PNG with transparency.
    """
    try:
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_image)
        
        # Open image with PIL
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get image data
        data = img.getdata()
        
        # Create new image data with transparency
        new_data = []
        for item in data:
            # Check if pixel is gray/white (background)
            # Gray checkered pattern is usually RGB(192,192,192) or RGB(255,255,255)
            # Also check for light grays RGB(200-255, 200-255, 200-255)
            r, g, b, a = item
            
            # If pixel is light gray or white, make it transparent
            if r > 180 and g > 180 and b > 180:
                # Make transparent
                new_data.append((r, g, b, 0))
            else:
                # Keep original
                new_data.append(item)
        
        # Update image data
        img.putdata(new_data)
        
        # Save to bytes
        output = io.BytesIO()
        img.save(output, format='PNG')
        output.seek(0)
        
        # Encode back to base64
        return base64.b64encode(output.read()).decode('utf-8')
        
    except Exception as e:
        print(f"[gemini] Background removal failed: {e}")
        # Return original image if processing fails
        return base64_image


def generate_player_sprite(player_role: str, environment_type: str) -> str:
    """
    Generate a player character sprite by creating 4 separate frames and combining them.
    Returns base64 encoded PNG sprite sheet with 4 frames (idle, walk1, walk2, hold).
    """
    frames = []
    frame_descriptions = [
        ("Idle", "Standing still, arms at sides, relaxed pose"),
        ("Walk 1", "Walking pose with left leg forward, right arm forward"),
        ("Walk 2", "Walking pose with right leg forward, left arm forward"),
        ("Hold", "Holding safety equipment in front with both hands")
    ]
    
    print(f"[gemini] Generating 4 separate frames for {player_role}...")
    
    for frame_name, frame_desc in frame_descriptions:
        prompt = f"""Create a single professional pixel art sprite of a {player_role} worker character.

CRITICAL: The background MUST be completely transparent (alpha channel = 0). No gray, no white, no checkered pattern - pure transparency.

Style: Clean pixel art, 128x128 pixels, single character sprite
Character: {player_role} in {environment_type} setting
Pose: {frame_desc}

Requirements:
- TRANSPARENT BACKGROUND (this is critical!)
- Wearing appropriate safety equipment (hard hat, safety vest, boots)
- Facing right (side view)
- Clear, recognizable silhouette
- Professional safety training game aesthetic
- Bold outlines, simple colors
- Character centered in the 128x128 frame
- Leave space around character (not touching edges)

This is ONE character in ONE pose. Do NOT draw multiple characters or multiple poses.
Remember: TRANSPARENT BACKGROUND is essential!"""
        
        try:
            model = genai.GenerativeModel(MODEL_NAME)
            response = model.generate_content(prompt)
            
            if response.candidates and len(response.candidates) > 0:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            image_data = part.inline_data.data
                            if isinstance(image_data, bytes):
                                image_data = base64.b64encode(image_data).decode('utf-8')
                            
                            # Remove gray background
                            image_data = remove_gray_background(image_data)
                            
                            # Decode to PIL Image
                            img_bytes = base64.b64decode(image_data)
                            img = Image.open(io.BytesIO(img_bytes))
                            
                            # Resize to exactly 128x128
                            img = img.resize((128, 128), Image.Resampling.LANCZOS)
                            
                            frames.append(img)
                            print(f"[gemini] ✓ Generated {frame_name} frame")
                            break
        except Exception as e:
            print(f"[gemini] Failed to generate {frame_name}: {e}")
            # Create a blank frame as fallback
            blank = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
            frames.append(blank)
    
    # Combine frames into sprite sheet
    if len(frames) == 4:
        sprite_sheet = Image.new('RGBA', (512, 128), (0, 0, 0, 0))
        for i, frame in enumerate(frames):
            sprite_sheet.paste(frame, (i * 128, 0))
        
        # Convert to base64
        output = io.BytesIO()
        sprite_sheet.save(output, format='PNG')
        output.seek(0)
        result = base64.b64encode(output.read()).decode('utf-8')
        
        print(f"[gemini] ✓ Combined into 512x128 sprite sheet")
        return result
    else:
        print(f"[gemini] Failed to generate all frames")
        return None


def generate_hazard_sprite(hazard_type: str, environment_type: str) -> str:
    """
    Generate a hazard sprite based on type and environment.
    Returns base64 encoded PNG image.
    """
    hazard_descriptions = {
        'fire': 'Animated fire flames with orange and yellow colors, dangerous workplace fire',
        'spill': 'Chemical spill puddle on floor, toxic liquid hazard with warning colors',
        'chemical': 'Chemical spill with hazardous material, green/yellow toxic liquid',
        'electric': 'Electrical hazard with lightning bolt, exposed wires, danger warning',
        'electrical': 'Electrical panel with sparks, high voltage warning, yellow lightning',
        'gas': 'Toxic gas cloud, green/yellow vapor, dangerous fumes spreading',
        'falling': 'Falling object hazard, crate or equipment falling with motion lines',
        'machinery': 'Dangerous machinery with rotating gears, industrial equipment hazard',
    }
    
    description = hazard_descriptions.get(hazard_type.lower(), 'Generic workplace hazard')
    
    prompt = f"""Create a professional pixel art game sprite of a workplace hazard: {description}

CRITICAL: The background MUST be completely transparent (alpha channel = 0). No gray, no white, no checkered pattern - pure transparency.

Style: Clean pixel art, 128x128 pixels, game-ready sprite
Environment: {environment_type}
Hazard: {hazard_type}
Requirements:
- TRANSPARENT BACKGROUND (this is critical!)
- Clear, recognizable hazard
- Animated appearance (suggest motion/danger)
- Warning colors (red, yellow, orange for danger)
- Bold outlines, high contrast
- Suitable for 2D safety training game
- Should look dangerous but not gory
- Centered in the image with space around it

The hazard should be immediately recognizable and appropriate for workplace safety training.
Remember: TRANSPARENT BACKGROUND is essential!"""
    
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        image_data = part.inline_data.data
                        if isinstance(image_data, bytes):
                            image_data = base64.b64encode(image_data).decode('utf-8')
                        
                        # Remove gray background
                        print(f"[gemini] Removing background from hazard sprite...")
                        image_data = remove_gray_background(image_data)
                        print(f"[gemini] ✓ Hazard sprite background removed")
                        
                        return image_data
        
        print(f"[gemini] No image data in response for hazard sprite")
        return None
    except Exception as e:
        print(f"[gemini] Hazard sprite generation failed: {e}")
        return None


def generate_tool_sprite(tool_name: str, tool_description: str) -> str:
    """
    Generate a safety tool/equipment sprite.
    Returns base64 encoded PNG image.
    """
    tool_prompts = {
        'extinguisher': 'Red fire extinguisher with black nozzle and yellow label, safety equipment',
        'cleanup_kit': 'Mop and bucket cleanup kit, blue bucket with cleaning supplies',
        'breaker': 'Electrical circuit breaker panel, gray metal box with red switch',
        'ventilation': 'Ventilation fan control, circular fan with blades, industrial equipment',
        'ppe': 'Personal protective equipment set, safety gear collection',
        'lockout': 'Lockout/tagout device, red safety lock with warning tag',
        'first_aid': 'First aid kit, white box with red cross symbol',
    }
    
    description = tool_prompts.get(tool_name, tool_description)
    
    prompt = f"""Create a professional pixel art game sprite of safety equipment: {description}

CRITICAL: The background MUST be completely transparent (alpha channel = 0). No gray, no white, no checkered pattern - pure transparency.

Style: Clean pixel art, 96x96 pixels, game-ready item sprite
Item: {tool_name}
Requirements:
- TRANSPARENT BACKGROUND (this is critical!)
- Clear, recognizable safety tool
- Professional appearance
- Appropriate colors (red for fire equipment, blue for cleaning, etc.)
- Bold outlines, simple shading
- Suitable for 2D game inventory
- Should look like real safety equipment
- Centered in the image with space around it

The tool should be immediately recognizable and appropriate for workplace safety training.
Remember: TRANSPARENT BACKGROUND is essential!"""
    
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        image_data = part.inline_data.data
                        if isinstance(image_data, bytes):
                            image_data = base64.b64encode(image_data).decode('utf-8')
                        
                        # Remove gray background
                        print(f"[gemini] Removing background from tool sprite...")
                        image_data = remove_gray_background(image_data)
                        print(f"[gemini] ✓ Tool sprite background removed")
                        
                        return image_data
        
        print(f"[gemini] No image data in response for tool sprite")
        return None
    except Exception as e:
        print(f"[gemini] Tool sprite generation failed: {e}")
        return None


def generate_environment_background(environment_type: str, width: int = 1280, height: int = 400) -> str:
    """
    Generate an environment background image.
    Returns base64 encoded PNG image.
    """
    environment_descriptions = {
        'warehouse': 'Industrial warehouse interior with shelving, crates, forklift, concrete floor',
        'construction': 'Construction site with scaffolding, safety cones, building materials, outdoor',
        'lab': 'Laboratory interior with lab benches, equipment, clean white walls, scientific',
        'laboratory': 'Laboratory interior with lab benches, equipment, clean white walls, scientific',
        'electrical': 'Electrical room with panels, conduits, warning signs, industrial lighting',
        'chemical': 'Chemical processing area with drums, pipes, containment, industrial',
        'office': 'Office interior with desks, computers, filing cabinets, professional',
        'factory': 'Factory floor with machinery, assembly lines, industrial equipment',
        'manufacturing': 'Manufacturing facility with production equipment, industrial setting',
    }
    
    description = environment_descriptions.get(environment_type.lower(), 'Generic workplace environment')
    
    prompt = f"""Create a professional 2D game background for a workplace safety training game: {description}

Style: Clean 2D game background, {width}x{height} pixels
Environment: {environment_type}
Requirements:
- Side-scrolling game perspective
- Clear floor line for character placement
- Professional workplace setting
- Appropriate lighting and atmosphere
- Realistic but game-friendly art style
- No characters or hazards (just environment)
- Suitable for safety training context
- Clean, organized appearance

The environment should look professional and appropriate for workplace safety training."""
    
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        image_data = part.inline_data.data
                        if isinstance(image_data, bytes):
                            return base64.b64encode(image_data).decode('utf-8')
                        return image_data
        
        print(f"[gemini] No image data in response for environment")
        return None
    except Exception as e:
        print(f"[gemini] Environment generation failed: {e}")
        return None


def generate_mission_assets(mission: dict) -> dict:
    """
    Generate all assets needed for a mission using Nano Banana.
    Returns dict with base64 encoded images.
    """
    assets = {}
    
    # Generate player sprite
    player_role = mission.get('player_role', 'Worker')
    environment_type = mission.get('environment_type', 'warehouse')
    
    print(f"[gemini] Generating player sprite: {player_role}")
    player_sprite = generate_player_sprite(player_role, environment_type)
    if player_sprite:
        assets['player'] = player_sprite
    
    # Generate hazard sprite
    hazard_type = mission.get('hazard_type', 'fire')
    print(f"[gemini] Generating hazard sprite: {hazard_type}")
    hazard_sprite = generate_hazard_sprite(hazard_type, environment_type)
    if hazard_sprite:
        assets['hazard'] = hazard_sprite
    
    # Generate environment background
    print(f"[gemini] Generating environment: {environment_type}")
    environment_bg = generate_environment_background(environment_type)
    if environment_bg:
        assets['environment'] = environment_bg
    
    # Determine tool needed based on hazard
    tool_map = {
        'fire': ('extinguisher', 'Fire extinguisher'),
        'spill': ('cleanup_kit', 'Cleanup kit with mop and bucket'),
        'chemical': ('cleanup_kit', 'Chemical cleanup kit'),
        'electric': ('breaker', 'Circuit breaker switch'),
        'electrical': ('breaker', 'Circuit breaker switch'),
        'gas': ('ventilation', 'Ventilation fan control'),
        'falling': ('ppe', 'Hard hat and safety equipment'),
        'machinery': ('lockout', 'Lockout/tagout device'),
    }
    
    tool_name, tool_desc = tool_map.get(hazard_type.lower(), ('ppe', 'Safety equipment'))
    print(f"[gemini] Generating tool sprite: {tool_name}")
    tool_sprite = generate_tool_sprite(tool_name, tool_desc)
    if tool_sprite:
        assets['tool'] = tool_sprite
        assets['tool_name'] = tool_name
    
    return assets
