import os
import re
import traceback
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
import io

from utils.config import UPLOAD_FOLDER, MAX_CONTENT_LENGTH
from services.game_generator import generate_game_from_pdf
from services.firebase_service import load_game, upload_pdf as fb_upload_pdf, delete_pdf as fb_delete_pdf
from services.mistral_service import check_answer
from services.voice_service import text_to_speech, speech_to_text
from services.emergency_assistant_service import get_emergency_service, register_socketio_handlers
from utils import wandb_logger

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

# Register emergency assistant socket handlers
register_socketio_handlers(socketio)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "NOOB Backend"})


# ---------------------------------------------------------------------------
# PDF Upload
# ---------------------------------------------------------------------------

@app.route("/api/upload-pdf", methods=["POST"])
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename or not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Invalid file type. Only PDFs allowed."}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)

    # Upload to Firebase Storage in background — keep local file for OCR step
    fb_upload_pdf(save_path, filename)  # returns None silently if Firebase unavailable

    return jsonify({
        "success": True,
        "filename": filename,
        "message": "PDF uploaded successfully",
    })


# ---------------------------------------------------------------------------
# Game Generation
# ---------------------------------------------------------------------------

@app.route("/api/generate-game", methods=["POST"])
def generate_game():
    data = request.get_json(force=True)
    filename = data.get("filename", "")
    if not filename:
        return jsonify({"success": False, "error": "filename required"}), 400

    pdf_path = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
    if not os.path.exists(pdf_path):
        return jsonify({"success": False, "error": "PDF not found. Upload it first."}), 404

    # game_id = filename without extension
    game_id = re.sub(r"[^a-zA-Z0-9_-]", "_", os.path.splitext(filename)[0])

    try:
        game_data = generate_game_from_pdf(pdf_path, game_id)
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[generate-game] ERROR:\n{tb}")
        return jsonify({"success": False, "error": str(e), "traceback": tb}), 500

    # Log to W&B (non-blocking)
    try:
        wandb_logger.log_game_generation(
            game_id=game_id,
            manual_title=game_data["manual_title"],
            page_count=game_data["page_count"],
            mission_count=game_data["total_missions"],
        )
    except Exception:
        pass

    return jsonify({
        "success": True,
        "game_id": game_id,
        "missions": game_data["missions"],
        "total_missions": game_data["total_missions"],
        "noob_intro": game_data["noob_intro"],
        "manual_title": game_data["manual_title"],
    })


# ---------------------------------------------------------------------------
# Get Game
# ---------------------------------------------------------------------------

@app.route("/api/get-game/<game_id>", methods=["GET"])
def get_game(game_id: str):
    game_data = load_game(game_id)
    if not game_data:
        return jsonify({"success": False, "error": "Game not found"}), 404
    return jsonify({"success": True, **game_data})


# ---------------------------------------------------------------------------
# Answer Checking
# ---------------------------------------------------------------------------

@app.route("/api/check-answer", methods=["POST"])
def check_answer_endpoint():
    data = request.get_json(force=True)
    game_id = data.get("game_id", "")
    mission_id = data.get("mission_id", "")
    player_choice = data.get("choice", "")

    if not all([game_id, mission_id, player_choice]):
        return jsonify({"success": False, "error": "game_id, mission_id and choice required"}), 400

    game_data = load_game(game_id)
    if not game_data:
        return jsonify({"success": False, "error": "Game not found"}), 404

    mission = next((m for m in game_data["missions"] if m["id"] == mission_id), None)
    if not mission:
        return jsonify({"success": False, "error": "Mission not found"}), 404

    try:
        result = check_answer(mission, player_choice)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    xp = game_data["scoring"]["correct_answer"] if result.get("correct") else 0
    return jsonify({
        "correct": result.get("correct", False),
        "feedback": result.get("feedback", ""),
        "explanation": result.get("explanation", ""),
        "xp": xp,
    })


# ---------------------------------------------------------------------------
# Voice - Text to Speech
# ---------------------------------------------------------------------------

@app.route("/api/voice/speak", methods=["POST"])
def speak():
    data = request.get_json(force=True)
    text = data.get("text", "")
    emotion = data.get("emotion", "neutral")

    if not text:
        return jsonify({"success": False, "error": "text required"}), 400

    try:
        audio_bytes = text_to_speech(text, emotion)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    return send_file(
        io.BytesIO(audio_bytes),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="speech.mp3",
    )


# ---------------------------------------------------------------------------
# Voice - Speech to Text (HTTP fallback)
# ---------------------------------------------------------------------------

@app.route("/api/voice/listen", methods=["POST"])
def listen():
    if "audio" not in request.files:
        return jsonify({"success": False, "error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()
    filename = audio_file.filename or "audio.webm"

    try:
        text = speech_to_text(audio_bytes, filename)
    except Exception as e:
        print(f"[listen] ERROR: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

    return jsonify({"success": True, "text": text})


# ---------------------------------------------------------------------------
# WebSocket - Real-time Speech to Text
# ---------------------------------------------------------------------------

@socketio.on('connect')
def handle_connect():
    print('[WebSocket] Client connected')
    emit('connected', {'status': 'ready'})


@socketio.on('disconnect')
def handle_disconnect():
    print('[WebSocket] Client disconnected')


@socketio.on('audio_stream')
def handle_audio_stream(data):
    """Handle real-time audio streaming for transcription"""
    try:
        audio_bytes = data.get('audio')
        if not audio_bytes:
            emit('transcription_error', {'error': 'No audio data'})
            return
        
        # Convert base64 to bytes if needed
        if isinstance(audio_bytes, str):
            import base64
            audio_bytes = base64.b64decode(audio_bytes)
        
        text = speech_to_text(audio_bytes, "stream.webm")
        emit('transcription_result', {'text': text, 'success': True})
    except Exception as e:
        print(f"[audio_stream] ERROR: {str(e)}")
        traceback.print_exc()
        emit('transcription_error', {'error': str(e), 'success': False})


# ---------------------------------------------------------------------------
# Emergency Assistant - REST Endpoints
# ---------------------------------------------------------------------------

@app.route("/api/emergency/voices", methods=["GET"])
def get_emergency_voices():
    """Get list of available voice models"""
    try:
        emergency_service = get_emergency_service()
        voices = emergency_service.get_available_voices()
        return jsonify({
            "success": True,
            "voices": voices
        })
    except Exception as e:
        print(f"[Emergency] Get voices error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/emergency/audio/<filename>", methods=["GET"])
def get_emergency_audio(filename: str):
    """Serve audio file for emergency session"""
    try:
        emergency_service = get_emergency_service()
        audio_path = os.path.join(emergency_service.session_storage_path, filename)
        
        if not os.path.exists(audio_path):
            return jsonify({
                "success": False,
                "error": "Audio file not found"
            }), 404
        
        return send_file(
            audio_path,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name=filename
        )
    except Exception as e:
        print(f"[Emergency] Get audio error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ---------------------------------------------------------------------------
# Emergency Assistant - WebSocket Handlers
# ---------------------------------------------------------------------------

# Emergency assistant handlers are now registered via register_socketio_handlers


# ---------------------------------------------------------------------------
# W&B - Log Completion
# ---------------------------------------------------------------------------

@app.route("/api/wandb/log-completion", methods=["POST"])
def log_completion():
    data = request.get_json(force=True)
    game_id = data.get("game_id", "")
    if not game_id:
        return jsonify({"success": False, "error": "game_id required"}), 400

    try:
        wandb_logger.log_completion(game_id, data)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    return jsonify({"success": True, "message": "Completion logged"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5001, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)
