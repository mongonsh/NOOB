import os
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
WANDB_API_KEY = os.getenv("WANDB_API_KEY", "")

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))

# Firebase
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "amibuddy-5fbc2")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "amibuddy-5fbc2.firebasestorage.app")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")

ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")

# Mistral Large 3 — game generation (complex JSON, long context)
MISTRAL_MODEL_LARGE = "mistral-large-latest"
# Ministral 8B — answer checking (fast, cheap, sufficient)
MISTRAL_MODEL_FAST = "ministral-8b-latest"
# Voxtral — speech-to-text
MISTRAL_MODEL_VOICE = "voxtral-transcribe-2"
# Pixtral — vision analysis
MISTRAL_MODEL_VISION = "pixtral-12b-2409"
# Mistral OCR — PDF text extraction
MISTRAL_MODEL_OCR = "mistral-ocr-latest"
