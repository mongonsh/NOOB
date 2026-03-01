export const API_BASE_URL = 'http://localhost:5001/api';

// Environment color themes — keyed by environment_type from backend
export const ENV_THEMES = {
  warehouse: { sky: 0x0f0f1a, floor: 0x1a1a2e, accent: 0xff6b35 },
  construction: { sky: 0x1a1a2e, floor: 0x2e1a0a, accent: 0xff8c00 },
  lab: { sky: 0x1a1a2e, floor: 0x252545, accent: 0x00d2ff },
  electrical: { sky: 0x0a0a0a, floor: 0x161616, accent: 0xff6b35 },
  chemical: { sky: 0x0a150a, floor: 0x121a12, accent: 0xff8c00 },
  office: { sky: 0x1a1a2e, floor: 0x2a1f1a, accent: 0x00d2ff },
};

// Hazard render colors — keyed by hazard_type from backend
export const HAZARD_COLORS = {
  spill: { main: 0x8b4513, glow: 0xcc6633 },
  fire: { main: 0xff4400, glow: 0xff8800 },
  gas: { main: 0x88ff88, glow: 0x44ff44 },
  electric: { main: 0xffff00, glow: 0xffaa00 },
  falling: { main: 0xaaaaaa, glow: 0x777777 },
  chemical: { main: 0x00ff88, glow: 0x00cc66 },
  machinery: { main: 0xff6600, glow: 0xcc4400 },
  default: { main: 0xff4444, glow: 0xaa2222 },
};

export const W = 1280;
export const H = 720;

export const C = {
  BG: 0x05050a,
  PANEL: 0x0a0a1a,
  PANEL2: 0x121225,
  ACCENT: 0xff6b35,
  ORANGE: 0xff6b35,
  GOLD: 0xffd700,
  RED: 0xff4b2b,
  WHITE: 0xffffff,
  GRAY: 0x666688,
  YELLOW: 0xffcc00,
};

export const TEXT = {
  ACCENT: '#ff6b35',
  ORANGE: '#ff6b35',
  RED: '#ff4b2b',
  WHITE: '#ffffff',
  GRAY: '#a0a0c0',
  YELLOW: '#ffd700',
  BG: '#05050a',
};
