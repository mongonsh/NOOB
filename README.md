# Emergency Assistant

A voice-enabled emergency assistance application with real-time AI conversation capabilities.

## Features

- Real-time voice streaming with ElevenLabs
- AI-powered emergency assistance using Gemini
- WebSocket-based communication
- Session management and history tracking
- PDF document processing for safety guides

## Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
cp backend/.env.example backend/.env
# Add your API keys to .env
```

3. Run the application:
```bash
cd backend
python app.py
```

## Tech Stack

- Flask + SocketIO
- ElevenLabs (voice synthesis)
- Google Gemini (AI)
- Firebase (storage)
