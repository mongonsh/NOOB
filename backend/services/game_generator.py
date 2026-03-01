import os
from services.pdf_processor import process_pdf
from services.mistral_service import extract_missions_from_chunk, generate_noob_intro, analyze_document_vision
from services.gemini_image_service import generate_mission_assets
from services.firebase_service import save_game


def generate_game_from_pdf(pdf_path: str, game_id: str) -> dict:
    """
    Full pipeline: PDF → OCR (text + images) → vision analysis → Mistral → Gemini images → game data → Firestore.
    Returns the complete game data dict.
    """
    # Step 1: Process PDF via Mistral OCR (extracts text AND page images)
    pdf_data = process_pdf(pdf_path)
    page_count = pdf_data["page_count"]
    chunks = pdf_data["chunks"]
    page_images = pdf_data.get("page_images", [])

    manual_title = os.path.splitext(os.path.basename(pdf_path))[0].replace("_", " ").title()

    # Step 2: Vision analysis — let Mistral Large look at actual document images
    # This grounds the game scenarios in real equipment, hazards, and roles from the manual.
    visual_context = ""
    if page_images:
        print(f"[game_generator] Analyzing {len(page_images)} document images with vision model…")
        try:
            visual_context = analyze_document_vision(page_images, manual_title)
        except Exception as e:
            print(f"[game_generator] Vision analysis failed (continuing without): {e}")

    # Step 3: Extract missions from each chunk, enriched with visual context
    all_missions = []
    for i, chunk in enumerate(chunks[:3]):
        try:
            missions = extract_missions_from_chunk(chunk, visual_context)
            for j, m in enumerate(missions):
                m["id"] = f"mission_{i * 5 + j + 1:03d}"
                m["level"] = i * 5 + j + 1
            all_missions.extend(missions)
        except Exception as e:
            print(f"[game_generator] chunk {i} failed: {e}")

    if not all_missions:
        raise RuntimeError("Could not extract any missions from PDF.")

    # Step 3.5: Generate custom game assets using Gemini for first mission
    # This creates professional, context-aware sprites and backgrounds
    if all_missions:
        print(f"[game_generator] Generating custom game assets with Gemini...")
        try:
            first_mission = all_missions[0]
            assets = generate_mission_assets(first_mission)
            # Store assets in mission data
            first_mission['custom_assets'] = assets
            print(f"[game_generator] Generated {len(assets)} custom assets")
        except Exception as e:
            print(f"[game_generator] Asset generation failed (continuing without): {e}")

    # Step 4: Generate NOOB intro
    try:
        noob_intro = generate_noob_intro(manual_title, page_count, len(all_missions))
    except Exception:
        noob_intro = f"Welcome, NOOB! I've read all {page_count} pages so you don't have to. Ready to level up?"

    # Step 4: Build game data
    game_data = {
        "game_id": game_id,
        "manual_title": manual_title,
        "page_count": page_count,
        "total_missions": len(all_missions),
        "noob_intro": noob_intro,
        "missions": all_missions,
        "scoring": {
            "correct_answer": 100,
            "hint_penalty": -20,
            "mission_completion": 500,
            "perfect_run": 1000,
        },
    }

    # Step 5: Persist to Firestore
    save_game(game_id, game_data)

    return game_data
