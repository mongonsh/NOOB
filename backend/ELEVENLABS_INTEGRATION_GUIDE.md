# ElevenLabs Integration Guide

## Overview

This document describes the ElevenLabs voice integration for the Emergency Assistant feature. The integration provides text-to-speech capabilities with multiple voice options.

## Architecture

### Backend Components

1. **elevenlabs_service.py** - Core ElevenLabs service
   - Manages ElevenLabs API client
   - Provides text-to-speech conversion
   - Supports multiple voice models
   - Handles voice streaming

2. **emergency_assistant_service.py** - Emergency session management
   - Integrates ElevenLabs for voice responses
   - Generates audio for assistant messages
   - Manages voice preferences per session
   - Stores audio files for playback

3. **app.py** - REST endpoints
   - `/api/emergency/voices` - Get available voices
   - `/api/emergency/audio/<filename>` - Serve audio files

### Frontend Components

1. **EmergencyScene.js** - Emergency UI
   - Displays transcript with audio support
   - Plays audio responses automatically
   - Provides text input for testing
   - Handles audio playback errors

## Available Voices

The integration supports 4 voice models from ElevenLabs:

| Voice Name | ID | Description |
|------------|-----|-------------|
| Rachel | 21m00Tcm4TlvDq8ikWAM | Professional female, clear (default) |
| Adam | pNInz6obpgDQGcFmaJgB | Authoritative male |
| Bella | EXAVITQu4vr4xnSDxMaL | Warm, friendly female |
| Josh | TxGEqnHWrfWFTfGW9XjX | Technical expert male |

## API Usage

### Get Available Voices

```bash
GET http://localhost:5001/api/emergency/voices
```

Response:
```json
{
  "success": true,
  "voices": [
    {
      "id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "description": "Professional female, clear"
    },
    ...
  ]
}
```

### Change Voice (WebSocket)

```javascript
socket.emit('emergency:changeVoice', {
  sessionId: 'session-id',
  voiceName: 'adam'
});
```

Response:
```javascript
socket.on('emergency:voiceChanged', (data) => {
  // data.voiceId, data.voiceName
});
```

### Send Message with Audio Response

```javascript
socket.emit('emergency:message', {
  sessionId: 'session-id',
  message: 'What should I do?'
});
```

Responses:
```javascript
// Transcript entry
socket.on('emergency:transcript', (data) => {
  // data.entry.text, data.entry.audio_url
});

// Audio URL
socket.on('emergency:audio', (data) => {
  // data.audioUrl - play this audio
});
```

## Testing

### Unit Tests

Run the ElevenLabs service test:
```bash
cd noob/backend
python test_elevenlabs_integration.py
```

Run the emergency voice integration test:
```bash
cd noob/backend
python test_emergency_voice_integration.py
```

### Manual Testing

1. Start the backend:
```bash
cd noob/backend
python app.py
```

2. Open the frontend:
```bash
cd noob/frontend
# Open index.html in browser
```

3. Navigate to Emergency Assistant
4. Wait for connection
5. Type a message and press Send
6. Listen for audio response

## Configuration

### Environment Variables

Required in `.env`:
```bash
ELEVENLABS_API_KEY=your_api_key_here
```

### Voice Settings

Default voice settings (can be customized):
- Stability: 0.5 (0-1, higher = more consistent)
- Similarity Boost: 0.75 (0-1, higher = more similar to original)
- Style: 0.0 (0-1, higher = more expressive)
- Speaker Boost: true (enhances clarity)

## Audio Storage

Audio files are stored in:
```
noob/backend/data/emergency_sessions/<session_id>_<uuid>.mp3
```

Files are served via:
```
http://localhost:5001/api/emergency/audio/<filename>
```

## Error Handling

### Service Initialization Errors

If ElevenLabs service fails to initialize:
- Service logs warning but continues
- Audio generation is skipped
- Text responses still work

### Audio Generation Errors

If audio generation fails:
- Error is logged
- Text response is still sent
- No audio_url in response

### Audio Playback Errors

If audio playback fails in frontend:
- Error message shown in transcript
- User can still read text response

## Performance Considerations

### Audio Generation Time

- Typical: 1-2 seconds for short responses
- Depends on text length and API latency
- Generated asynchronously

### Audio File Size

- ~50KB for short responses (10-20 words)
- ~200KB for longer responses (50-100 words)
- MP3 format, 24kbps

### Caching

Currently no caching implemented. Future improvements:
- Cache common responses
- Pre-generate frequent messages
- Use CDN for audio delivery

## Future Enhancements

### Phase 2: Real-time Voice Streaming

- Implement WebRTC for bidirectional audio
- Use ElevenLabs Conversational AI API
- Support voice interruptions
- Add voice activity detection

### Phase 3: Voice Input

- Transcribe user voice with Mistral Voxtral
- Support continuous conversation
- Add noise cancellation

### Phase 4: Advanced Features

- Voice cloning for personalization
- Emotion detection and response
- Multi-language support
- Voice analytics

## Troubleshooting

### "ElevenLabs service not available"

Check:
1. ELEVENLABS_API_KEY is set in .env
2. API key is valid
3. Internet connection is working

### "Audio playback failed"

Check:
1. Browser supports HTML5 audio
2. Audio file exists on server
3. CORS is configured correctly
4. Audio URL is accessible

### "Voice change failed"

Check:
1. Voice name is valid (rachel, adam, bella, josh)
2. Session exists and is active
3. ElevenLabs service is initialized

## API Rate Limits

ElevenLabs free tier:
- 10,000 characters/month
- ~200 short responses

Paid tiers:
- Starter: 30,000 characters/month
- Creator: 100,000 characters/month
- Pro: 500,000 characters/month

Monitor usage in ElevenLabs dashboard.

## Security Considerations

### API Key Protection

- Never commit API keys to git
- Use environment variables
- Rotate keys regularly

### Audio File Access

- Audio files are publicly accessible via URL
- Consider adding authentication
- Implement file cleanup after 24 hours

### Rate Limiting

- Implement per-user rate limits
- Monitor API usage
- Add request throttling

## Support

For issues or questions:
1. Check logs in backend console
2. Review test results
3. Verify API key and configuration
4. Check ElevenLabs API status

## References

- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [ElevenLabs Python SDK](https://github.com/elevenlabs/elevenlabs-python)
- [Voice Models](https://elevenlabs.io/voice-library)
