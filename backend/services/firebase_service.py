"""
Firebase integration:
  - Firebase Storage  → PDF files
  - Firestore         → game data

Falls back to local JSON storage when Firebase credentials are not available.
"""
import datetime
import json
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage

from utils.config import FIREBASE_CREDENTIALS_PATH, FIREBASE_STORAGE_BUCKET, FIREBASE_PROJECT_ID

LOCAL_GAMES_DIR = "generated"

# Initialise once; None = not yet tried, False = failed
_app = None
_firebase_ok = False


def _init() -> bool:
    """Try to initialise Firebase. Returns True if available."""
    global _app, _firebase_ok
    if _app is not None:
        return _firebase_ok
    try:
        if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        else:
            cred = credentials.ApplicationDefault()
        _app = firebase_admin.initialize_app(cred, {
            "projectId": FIREBASE_PROJECT_ID,
            "storageBucket": FIREBASE_STORAGE_BUCKET,
        })
        _firebase_ok = True
        print("[firebase] Connected to Firebase project:", FIREBASE_PROJECT_ID)
    except Exception as e:
        _app = False  # mark as attempted
        _firebase_ok = False
        print(f"[firebase] Not available — using local fallback. ({e})")
    return _firebase_ok


# ── Local fallback helpers ────────────────────────────────────────────────────

def _local_save(game_id: str, game_data: dict):
    os.makedirs(LOCAL_GAMES_DIR, exist_ok=True)
    with open(os.path.join(LOCAL_GAMES_DIR, f"{game_id}.json"), "w") as f:
        json.dump(game_data, f, indent=2)


def _local_load(game_id: str) -> dict | None:
    path = os.path.join(LOCAL_GAMES_DIR, f"{game_id}.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


# ── Storage helpers ───────────────────────────────────────────────────────────

def upload_pdf(local_path: str, filename: str) -> str | None:
    """Upload PDF to Firebase Storage. Returns signed URL or None on failure."""
    if not _init():
        return None
    try:
        bucket = storage.bucket()
        blob = bucket.blob(f"pdfs/{filename}")
        blob.upload_from_filename(local_path, content_type="application/pdf")
        return blob.generate_signed_url(
            expiration=datetime.timedelta(hours=1),
            method="GET",
        )
    except Exception as e:
        print(f"[firebase] Storage upload failed: {e}")
        return None


def delete_pdf(filename: str):
    if not _init():
        return
    try:
        storage.bucket().blob(f"pdfs/{filename}").delete()
    except Exception:
        pass


# ── Firestore helpers ─────────────────────────────────────────────────────────

def save_game(game_id: str, game_data: dict):
    """Save game to Firestore, or local JSON if Firebase unavailable."""
    if _init():
        try:
            firestore.client().collection("games").document(game_id).set(game_data)
            return
        except Exception as e:
            print(f"[firebase] Firestore save failed, using local: {e}")
    _local_save(game_id, game_data)


def load_game(game_id: str) -> dict | None:
    """Load game from Firestore, or local JSON if Firebase unavailable."""
    if _init():
        try:
            doc = firestore.client().collection("games").document(game_id).get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            print(f"[firebase] Firestore load failed, using local: {e}")
    return _local_load(game_id)
