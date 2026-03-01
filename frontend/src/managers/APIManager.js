import { API_BASE_URL } from '../config/constants.js';

async function post(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export const APIManager = {
  async uploadPDF(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE_URL}/upload-pdf`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  async generateGame(filename) {
    return post('/generate-game', { filename });
  },

  async getGame(gameId) {
    const res = await fetch(`${API_BASE_URL}/get-game/${gameId}`);
    if (!res.ok) throw new Error('Game not found');
    return res.json();
  },

  async checkAnswer(gameId, missionId, choice) {
    return post('/check-answer', { game_id: gameId, mission_id: missionId, choice });
  },

  /** Returns a Blob (audio/mpeg) */
  async speak(text, emotion = 'neutral') {
    const res = await fetch(`${API_BASE_URL}/voice/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, emotion }),
    });
    if (!res.ok) throw new Error('TTS failed');
    return res.blob();
  },

  async listen(audioBlob) {
    const form = new FormData();
    form.append('audio', audioBlob, 'recording.webm');
    const res = await fetch(`${API_BASE_URL}/voice/listen`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('STT failed');
    return res.json(); // { success, text }
  },

  async logCompletion(gameId, data) {
    return post('/wandb/log-completion', { game_id: gameId, ...data });
  },
};
