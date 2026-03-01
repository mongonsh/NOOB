import base64
import json
import re
from mistralai import Mistral
from utils.config import MISTRAL_API_KEY, MISTRAL_MODEL_LARGE, MISTRAL_MODEL_FAST, MISTRAL_MODEL_VOICE, MISTRAL_MODEL_VISION

import mistralai
print(f"[Mistral] Using SDK version: {getattr(mistralai, '__version__', 'unknown')}")
print(f"[Mistral] SDK file path: {getattr(mistralai, '__file__', 'unknown')}")

client = Mistral(api_key=MISTRAL_API_KEY)

# Verify if audio attribute exists
if not hasattr(client, 'audio'):
    print(f"[Mistral] CRITICAL: client has no 'audio' attribute! Available: {dir(client)}")
else:
    print("[Mistral] ✅ client.audio is available")

EXTRACTION_PROMPT = """You are a safety training game designer. Analyze this safety manual and create exciting, immersive game missions.

VISUAL CONTEXT (from document images — use this to match environments and hazards exactly):
{visual_context}

Extract exactly 5 safety training missions grounded in the actual content above.
Each mission places a player character inside a dangerous workplace scenario they must survive.

Return ONLY valid JSON:
{{
  "missions": [
    {{
      "id": "mission_001",
      "title": "Short dramatic title (max 5 words)",
      "level": 1,
      "type": "multiple_choice",
      "environment_type": "warehouse",
      "hazard_type": "spill",
      "player_role": "Safety Officer",
      "scenario": "You are a Safety Officer. Vivid 2-sentence description of the dangerous situation RIGHT NOW — what you see, smell, hear. Reference real equipment from the manual.",
      "question": "What do you do FIRST?",
      "choices": ["Concrete action A", "Concrete action B", "Concrete action C"],
      "correct_answer": "Concrete action A",
      "success_message": "HAZARD NEUTRALIZED! Why this action was correct per the manual.",
      "fail_message": "DANGER! Why this action made things worse.",
      "page_reference": 1,
      "xp_reward": 100,
      "risk_level": "HIGH"
    }}
  ]
}}

environment_type — pick the closest match to what you see in the document:
  warehouse | construction | lab | electrical | chemical | office

hazard_type — pick the most specific hazard shown or described:
  spill | fire | gas | electric | falling | chemical | machinery

player_role — match to the environment and workers shown in the document:
  Safety Officer | Lab Technician | Electrician | Construction Worker | Chemical Handler | Forklift Operator | Site Inspector

Risk levels: HIGH (life-threatening), MEDIUM (serious injury), LOW (minor injury/damage).

IMPORTANT: Base scenarios on REAL hazards and procedures from this specific manual. Write in second person ("You are…"). Make it feel like an action game — urgent and immersive.

Safety manual text:
{text}"""

ANSWER_CHECK_PROMPT = """You are a safety training expert evaluating an answer.

Mission: {mission_title}
Question: {question}
Correct answer: {correct_answer}
Player's answer: {player_answer}

Is the player's answer correct or essentially the same meaning as the correct answer?
Respond with ONLY valid JSON:
{{
  "correct": true or false,
  "feedback": "2-3 sentence encouraging/corrective NOOB-style feedback",
  "explanation": "1-2 sentence explanation referencing the safety manual"
}}"""


def analyze_document_vision(images_b64: list[str], manual_title: str) -> str:
    """
    Use Mistral Large (vision) to analyze document page images.
    Returns a concise visual context string used to ground mission generation.
    """
    if not images_b64:
        return "No images available — use text content only."
    try:
        content: list = [
            {
                "type": "text",
                "text": (
                    f"These are pages from a safety manual titled '{manual_title}'. "
                    "Analyze each image and answer:\n"
                    "1. What industry/workplace is this? (warehouse, lab, construction, electrical, chemical, office)\n"
                    "2. What specific machinery, vehicles, or equipment are visible?\n"
                    "3. What specific hazards, dangers, or warning signs are shown?\n"
                    "4. What PPE or safety equipment is depicted?\n"
                    "5. What type of workers or roles are shown?\n"
                    "6. Any specific colors, brands, or model names visible?\n"
                    "Be specific. Max 200 words total."
                ),
            }
        ]
        for b64 in images_b64[:4]:          # limit to 4 images to stay within token budget
            # Ensure proper data URL format (remove duplicate prefix if exists)
            clean_b64 = b64
            if b64.startswith('data:image'):
                # Already has data URL prefix, extract just the base64 part
                if ';base64,' in b64:
                    clean_b64 = b64.split(';base64,', 1)[1]
            
            image_url = f"data:image/jpeg;base64,{clean_b64}"
            
            content.append({
                "type": "image_url",
                "image_url": image_url,
            })

        response = client.chat.complete(
            model=MISTRAL_MODEL_LARGE,
            messages=[{"role": "user", "content": content}],
            temperature=0.2,
        )
        result = response.choices[0].message.content.strip()
        print(f"[vision] Analysis: {result[:200]}…")
        return result
    except Exception as e:
        print(f"[vision] analyze_document_vision skipped: {e}")
        return "No image analysis available — use text content only."


def extract_missions_from_chunk(text: str, visual_context: str = "") -> list[dict]:
    """Use Mistral Large to extract game missions from a text chunk + visual context."""
    prompt = EXTRACTION_PROMPT.format(
        text=text[:30000],
        visual_context=visual_context or "No image analysis available — use text content only.",
    )
    response = client.chat.complete(
        model=MISTRAL_MODEL_LARGE,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    content = response.choices[0].message.content.strip()
    json_match = re.search(r"\{[\s\S]*\}", content)
    if not json_match:
        return []
    data = json.loads(json_match.group())
    return data.get("missions", [])


def check_answer(mission: dict, player_answer: str) -> dict:
    """Use Ministral 8B to evaluate a player's answer (fast + cheap)."""
    prompt = ANSWER_CHECK_PROMPT.format(
        mission_title=mission.get("title", ""),
        question=mission.get("question", ""),
        correct_answer=mission.get("correct_answer", ""),
        player_answer=player_answer,
    )
    response = client.chat.complete(
        model=MISTRAL_MODEL_FAST,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    content = response.choices[0].message.content.strip()
    json_match = re.search(r"\{[\s\S]*\}", content)
    if not json_match:
        # Fallback: simple string comparison
        is_correct = player_answer.strip().lower() == mission.get("correct_answer", "").strip().lower()
        return {
            "correct": is_correct,
            "feedback": "CORRECT! Great safety thinking!" if is_correct else "NOOB MISTAKE! Try again.",
            "explanation": f"The correct answer is: {mission.get('correct_answer', '')}",
        }
    return json.loads(json_match.group())


def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio using Voxtral (Mistral's voice model)."""
    try:
        # Use the dedicated transcription endpoint
        # The user reported "Mistral has no object audio error", which means 
        # client.audio is missing or inaccessible. Ensuring we use the right client structure.
        print(f"[transcribe] Attempting transcription with model: {MISTRAL_MODEL_VOICE}")
        
        # Check if the client has the audio attribute at runtime to avoid crash
        if not hasattr(client, 'audio'):
            raise AttributeError("Mistral client has no 'audio' attribute. Check SDK version.")

        response = client.audio.transcriptions.complete(
            model=MISTRAL_MODEL_VOICE,
            file={
                "file_name": "audio.webm",
                "content": audio_bytes
            }
        )
        return response.text.strip()
    except Exception as e:
        print(f"[transcribe] Mistral transcription failed: {e}")
        import traceback
        traceback.print_exc()
        raise e


def analyze_emergency_image(image_b64: str) -> str:
    """
    Use Mistral Vision (Pixtral) to analyze an emergency situation image.
    Provides immediate safety advice.
    """
    try:
        # Ensure proper data URL format
        if image_b64.startswith('data:image'):
            if ';base64,' in image_b64:
                image_b64 = image_b64.split(';base64,', 1)[1]
        
        image_url = f"data:image/jpeg;base64,{image_b64}"
        
        response = client.chat.complete(
            model=MISTRAL_MODEL_VISION,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Identify any immediate hazards or dangers in this image. Provide 2-3 specific, life-saving safety instructions for someone at the scene."
                        },
                        {
                            "type": "image_url",
                            "image_url": image_url,
                        },
                    ],
                }
            ],
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[vision] analyze_emergency_image failed: {e}")
        return "System Error: Unable to analyze image. Please proceed with extreme caution."


def generate_noob_intro(manual_title: str, page_count: int, mission_count: int) -> str:
    """Generate a NOOB AI welcome message using Ministral 8B."""
    response = client.chat.complete(
        model=MISTRAL_MODEL_FAST,
        messages=[
            {
                "role": "user",
                "content": (
                    f"You are NOOB AI, a funny safety training game character. "
                    f"Write a 2-sentence welcome message for '{manual_title}' ({page_count} pages). "
                    f"Mention you've created {mission_count} training missions. Be energetic and fun!"
                ),
            }
        ],
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
