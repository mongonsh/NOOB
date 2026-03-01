# Emergency Assistant

A voice-enabled emergency assistance application with real-time AI conversation capabilities.

## Demo

[![Watch Demo](https://img.youtube.com/vi/EjvtVxgrmr8/0.jpg)](https://youtu.be/EjvtVxgrmr8)

[Watch the demo on YouTube](https://youtu.be/EjvtVxgrmr8)

## Architecture

![Architecture Diagram](architecture.png)

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

## AI Models

- **Google Gemini 1.5 Flash** - Main conversational AI for emergency assistance
- **Google Gemini 1.5 Pro** - Image analysis and document processing
- **Mistral AI** - Alternative text generation
- **ElevenLabs** - Voice synthesis and streaming
