/**
 * GameScene — full-screen immersive safety training game.
 *
 * Layout:
 *   - Environment background fills the entire 1280×720 canvas
 *   - HUD strip: semi-transparent overlay at top (0–55 px)
 *   - Bottom panel: semi-transparent overlay at bottom (520–720 px)
 *   - Player (left), Hazard (center), Environment props (right)
 *
 * Input:
 *   - Click choice buttons
 *   - Keyboard  A / B / C / D  (or  1 / 2 / 3 / 4)
 *   - Hold mic button to speak  ("B", "select B", "second option", …)
 */

import { C, W, H, TEXT, ENV_THEMES, HAZARD_COLORS } from '../config/constants.js';
import { state } from '../managers/StateManager.js';
import { APIManager } from '../managers/APIManager.js';
import { VoiceManager } from '../managers/VoiceManager.js';

// ── Layout constants ──────────────────────────────────────────────────────────
const HUD_H = 55;          // top HUD overlay height
const FLOOR_Y = 420;         // y position of the floor line
const PANEL_Y = 522;         // bottom choice-panel top
const PANEL_H = H - PANEL_Y; // 198 px

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];
const RISK_COLOR = { HIGH: TEXT.RED, MEDIUM: TEXT.ORANGE, LOW: TEXT.GREEN };
const RISK_HEX = { HIGH: C.RED, MEDIUM: C.ORANGE, LOW: C.GREEN };

// ─────────────────────────────────────────────────────────────────────────────
export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  create() {
    this._locked = false;
    this._micActive = false;
    this._flameTweens = [];

    const m = state.currentMission;
    if (!m) { this.scene.start('ResultScene'); return; }

    const envKey = (m.environment_type ?? 'warehouse').toLowerCase();
    const theme = ENV_THEMES[envKey] ?? ENV_THEMES.warehouse;
    const hazKey = (m.hazard_type ?? 'default').toLowerCase();
    const hazColors = HAZARD_COLORS[hazKey] ?? HAZARD_COLORS.default;

    // Draw order: background → props → hazard → player → overlays
    this._drawEnvironment(envKey, theme);
    this._drawHazard(hazKey, hazColors);
    this._drawPlayer(theme);
    this._drawHUD(m, theme);
    this._drawBottomPanel(m);
    this._addKeyboardInput(m);

    this.cameras.main.fadeIn(350);
  }

  // ── ENVIRONMENT (full-screen, 1280×720) ─────────────────────────────────────
  _drawEnvironment(envKey, theme) {
    const g = this.add.graphics();

    // Sky
    g.fillStyle(theme.sky, 1);
    g.fillRect(0, 0, W, FLOOR_Y);

    // Floor
    g.fillStyle(theme.floor, 1);
    g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

    // Floor edge line
    g.lineStyle(2, theme.accent, 0.35);
    g.lineBetween(0, FLOOR_Y, W, FLOOR_Y);

    // Env-specific background layer
    switch (envKey) {
      case 'warehouse': this._bgWarehouse(g, theme); break;
      case 'construction': this._bgConstruction(g, theme); break;
      case 'lab': this._bgLab(g, theme); break;
      case 'electrical': this._bgElectrical(g, theme); break;
      case 'chemical': this._bgChemical(g, theme); break;
      case 'office': this._bgOffice(g, theme); break;
      default: this._bgWarehouse(g, theme); break;
    }

    // Environment badge (top-right corner, below HUD)
    this.add.text(W - 16, HUD_H + 10, `[ ${envKey.toUpperCase()} ]`, {
      fontSize: '11px', fontFamily: 'Courier New', color: TEXT.GRAY,
    }).setOrigin(1, 0).setAlpha(0.7);
  }

  _bgWarehouse(g, theme) {
    // Back wall (top stripe)
    g.fillStyle(0x252525, 1);
    g.fillRect(0, 0, W, 60);

    // Ceiling lights with cone beams
    for (let lx = 160; lx < W; lx += 220) {
      g.fillStyle(theme.accent, 1); g.fillRect(lx - 32, 0, 64, 8);
      g.fillStyle(0xffffcc, 0.07);
      g.fillTriangle(lx, 8, lx - 110, FLOOR_Y - 20, lx + 110, FLOOR_Y - 20);
    }

    // Shelving units (right 40% of screen)
    for (let sx = 760; sx < 1240; sx += 155) {
      // Uprights
      g.fillStyle(0x4a4a4a, 1);
      g.fillRect(sx, 110, 10, FLOOR_Y - 110);
      g.fillRect(sx + 130, 110, 10, FLOOR_Y - 110);
      // Shelves & boxes
      for (let row = 0; row < 4; row++) {
        const shelfY = FLOOR_Y - 60 - row * 82;
        g.fillStyle(0x3a3a3a, 1); g.fillRect(sx, shelfY, 140, 8);
        const boxColors = [0x8b4513, 0x5a6e2a, 0x2a4a8b, 0x8b3a3a];
        for (let b = 0; b < 3; b++) {
          g.fillStyle(boxColors[(row + b) % 4], 1);
          g.fillRect(sx + 6 + b * 44, shelfY - 50, 38, 50);
          // Box label stripe
          g.fillStyle(0xffffff, 0.12); g.fillRect(sx + 6 + b * 44, shelfY - 38, 38, 6);
        }
      }
    }

    // Forklift silhouette (far left background, behind player)
    g.fillStyle(0x2a2a3a, 1);
    g.fillRect(30, FLOOR_Y - 95, 100, 95);   // body
    g.fillRect(65, FLOOR_Y - 155, 22, 60);   // mast
    g.fillRect(42, FLOOR_Y - 70, 56, 8);     // forks
    g.fillRect(42, FLOOR_Y - 62, 56, 8);
    g.fillStyle(0x1a1a2a, 1);
    g.fillCircle(55, FLOOR_Y + 2, 18); g.fillCircle(115, FLOOR_Y + 2, 18);

    // Floor stripes
    g.lineStyle(2, 0xffcc00, 0.2);
    for (let fx = 0; fx < W; fx += 90) g.lineBetween(fx, FLOOR_Y, fx, H);

    // Shadow on floor under shelves
    g.fillStyle(0x000000, 0.3);
    g.fillRect(750, FLOOR_Y, W - 750, 40);
  }

  _bgConstruction(g, theme) {
    // Sky gradient bands
    g.fillStyle(0xa0d4f0, 1); g.fillRect(0, 0, W, 160);
    g.fillStyle(0x87ceeb, 1); g.fillRect(0, 160, W, 160);
    g.fillStyle(0x6ab8d8, 1); g.fillRect(0, 320, W, FLOOR_Y - 320);

    // Clouds
    [[180, 80], [540, 50], [900, 90], [1150, 60]].forEach(([cx, cy]) => {
      g.fillStyle(0xffffff, 0.75);
      g.fillEllipse(cx, cy, 140, 50);
      g.fillEllipse(cx + 50, cy - 15, 110, 42);
      g.fillEllipse(cx - 40, cy - 10, 90, 38);
    });

    // Ground texture
    g.fillStyle(0x9b7a3d, 1); g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0x7a6030, 0.5);
      g.fillRect(i * 46 + (i % 5) * 8, FLOOR_Y + 6, 32, 8);
    }

    // Scaffolding (right background)
    g.lineStyle(6, 0x999999, 1);
    for (let sx = 730; sx < 1150; sx += 140) {
      g.lineBetween(sx, 40, sx, FLOOR_Y);
      for (let sy = 0; sy < 4; sy++) g.lineBetween(sx, 80 + sy * 88, sx + 120, 80 + sy * 88);
    }
    g.lineStyle(3, 0x888888, 0.7);
    g.lineBetween(730, 40, 1140, 40); // top rail

    // Concrete barrier
    g.fillStyle(0x888888, 1);
    for (let bx = 700; bx < W; bx += 80) {
      g.fillRect(bx, FLOOR_Y - 42, 68, 42);
      g.fillStyle(0x777777, 1); g.fillRect(bx + 8, FLOOR_Y - 36, 52, 4);
      g.fillStyle(0x888888, 1);
    }

    // Safety cones
    [[430, FLOOR_Y], [490, FLOOR_Y], [550, FLOOR_Y]].forEach(([cx, cy]) => {
      g.fillStyle(0xff6600, 1); g.fillTriangle(cx, cy, cx - 16, cy - 50, cx + 16, cy - 50);
      g.fillStyle(0xffffff, 1); g.fillRect(cx - 13, cy - 38, 26, 7);
    });

    // Caution tape
    g.lineStyle(7, 0xffcc00, 1);
    g.lineBetween(400, FLOOR_Y - 55, 700, FLOOR_Y - 55);
    g.lineStyle(7, 0x000000, 0.5);
    g.lineBetween(400, FLOOR_Y - 62, 700, FLOOR_Y - 62);
  }

  _bgLab(g, _theme) {
    // White walls
    g.fillStyle(0xf4f4f0, 1); g.fillRect(0, 0, W, FLOOR_Y);
    // Tile floor
    g.fillStyle(0xe8ece8, 1); g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    for (let tx = 0; tx < W; tx += 64) { g.lineStyle(1, 0xcccccc, 0.8); g.lineBetween(tx, FLOOR_Y, tx, H); }
    for (let ty = 0; ty < H - FLOOR_Y; ty += 64) { g.lineStyle(1, 0xcccccc, 0.8); g.lineBetween(0, FLOOR_Y + ty, W, FLOOR_Y + ty); }

    // Lab window (right wall)
    g.fillStyle(0xc8e8f8, 0.4); g.fillRect(720, 40, 460, 280);
    g.lineStyle(3, 0xdddddd, 1); g.strokeRect(720, 40, 460, 280);
    g.lineStyle(2, 0xcccccc, 0.5); g.lineBetween(950, 40, 950, 320);
    g.lineBetween(720, 180, 1180, 180);

    // Lab bench (right side)
    g.fillStyle(0xb8b8b8, 1); g.fillRect(700, FLOOR_Y - 100, W - 700, 100);
    g.fillStyle(0xa8a8a8, 1); g.fillRect(700, FLOOR_Y - 106, W - 700, 12);
    g.fillStyle(0x777777, 0.4); g.fillRect(700, FLOOR_Y - 94, W - 700, 8);

    // Equipment on bench
    // Microscope
    g.fillStyle(0x666688, 1); g.fillRect(770, FLOOR_Y - 190, 14, 90);
    g.fillStyle(0x888899, 1); g.fillRect(750, FLOOR_Y - 200, 54, 18);
    g.fillStyle(0x9999aa, 1); g.fillCircle(790, FLOOR_Y - 208, 22);
    // Flask
    g.fillStyle(0x7799cc, 1); g.fillCircle(870, FLOOR_Y - 115, 26);
    g.fillStyle(0x7799cc, 1); g.fillRect(862, FLOOR_Y - 165, 16, 52);
    // Test tubes
    for (let t = 0; t < 4; t++) {
      g.fillStyle([0xff6666, 0x66ff88, 0x6688ff, 0xffcc44][t], 0.8);
      g.fillRect(930 + t * 22, FLOOR_Y - 155, 12, 55);
      g.fillCircle(936 + t * 22, FLOOR_Y - 100, 6);
    }
    // Fume hood
    g.fillStyle(0xcccccc, 1); g.fillRect(1050, FLOOR_Y - 260, 180, 160);
    g.fillStyle(0xaaccee, 0.5); g.fillRect(1058, FLOOR_Y - 250, 164, 100);
    g.lineStyle(2, 0xaaaaaa, 1); g.strokeRect(1050, FLOOR_Y - 260, 180, 160);

    // Biohazard sign
    g.fillStyle(0xffcc00, 1); g.fillCircle(580, 200, 28);
    this.add.text(580, 200, '☣', { fontSize: '28px' }).setOrigin(0.5).setDepth(1);
    this.add.text(580, 240, 'BIOHAZARD', { fontSize: '10px', fontFamily: 'Courier New', color: '#cc8800' }).setOrigin(0.5).setDepth(1);
  }

  _bgElectrical(g, _theme) {
    // Dark concrete walls
    g.fillStyle(0x0e0e0e, 1); g.fillRect(0, 0, W, FLOOR_Y);
    g.fillStyle(0x161616, 1); g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

    // Concrete texture — subtle blocks
    for (let cy = 0; cy < FLOOR_Y; cy += 60) {
      g.lineStyle(1, 0x1e1e1e, 1);
      g.lineBetween(0, cy, W, cy);
      for (let cx = (cy / 60 % 2) * 80; cx < W; cx += 160) {
        g.lineBetween(cx, cy, cx, cy + 60);
      }
    }

    // Main electrical panel (right wall)
    g.fillStyle(0x2a2a2a, 1); g.fillRect(W - 250, 60, 200, 310);
    g.lineStyle(3, 0xffff00, 0.9); g.strokeRect(W - 250, 60, 200, 310);
    // Panel label
    this.add.text(W - 150, 85, 'MAIN PANEL\nHIGH VOLTAGE', {
      fontSize: '10px', fontFamily: 'Courier New', color: '#ffff00', align: 'center',
    }).setOrigin(0.5).setDepth(1);
    // Breakers
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
      g.fillStyle(0x333333, 1); g.fillRect(W - 235 + c * 88, 116 + r * 66, 72, 52);
      g.lineStyle(1, 0x555555, 1); g.strokeRect(W - 235 + c * 88, 116 + r * 66, 72, 52);
      const on = (r * 2 + c) % 3 !== 0;
      g.fillStyle(on ? 0x00ee00 : 0xee0000, 1);
      g.fillCircle(W - 235 + c * 88 + 10, 116 + r * 66 + 10, 6);
      // Switch bar
      g.fillStyle(on ? 0x888888 : 0x666666, 1);
      g.fillRect(W - 225 + c * 88, 135 + r * 66, 52, 8);
    }

    // Conduit pipes on ceiling
    for (let cx = 0; cx < W - 260; cx += 3) {
      if (cx % 60 < 6) { g.fillStyle(0x555555, 1); g.fillRect(cx, 18, 6, 24); }
    }
    g.fillStyle(0x444444, 1); g.fillRect(0, 18, W - 260, 24);
    g.fillStyle(0x3a3a3a, 1); g.fillRect(0, 42, W - 260, 16);

    // Secondary box on left
    g.fillStyle(0x222222, 1); g.fillRect(60, 200, 120, 160);
    g.lineStyle(2, 0xffff00, 0.5); g.strokeRect(60, 200, 120, 160);
    for (let r = 0; r < 3; r++) {
      g.fillStyle(0x333333, 1); g.fillRect(76, 220 + r * 44, 88, 32);
    }

    // Warning triangles
    [[160, FLOOR_Y], [280, FLOOR_Y], [400, FLOOR_Y]].forEach(([wx, wy]) => {
      g.fillStyle(0xffff00, 1); g.fillTriangle(wx, wy, wx - 28, wy - 52, wx + 28, wy - 52);
      g.fillStyle(0x000000, 1);
      this.add.text(wx, wy - 32, '⚡', { fontSize: '18px' }).setOrigin(0.5).setDepth(1);
    });

    // Floor hazard stripes
    g.lineStyle(4, 0xffff00, 0.45);
    for (let i = 0; i < 12; i++) g.lineBetween(i * 50, FLOOR_Y, i * 50 + 35, H);

    // Sparks on floor
    [[195, FLOOR_Y + 5], [215, FLOOR_Y + 18], [188, FLOOR_Y + 12]].forEach(([sx, sy]) => {
      g.fillStyle(0xffffff, 0.9); g.fillCircle(sx, sy, 3);
      g.fillStyle(0xffff00, 0.5); g.fillCircle(sx, sy, 6);
    });
  }

  _bgChemical(g, _theme) {
    g.fillStyle(0x080f08, 1); g.fillRect(0, 0, W, FLOOR_Y);
    g.fillStyle(0x0f170f, 1); g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

    // Containment berm (floor)
    g.lineStyle(5, 0x00ff88, 0.5); g.strokeRect(40, FLOOR_Y - 12, W - 80, H - FLOOR_Y + 8);
    // Berm inside fill
    g.fillStyle(0x00ff88, 0.04); g.fillRect(42, FLOOR_Y - 10, W - 84, H - FLOOR_Y + 6);

    // Ceiling ventilation
    g.fillStyle(0x1e2e1e, 1); g.fillRect(0, 0, W, 30);
    g.fillStyle(0x2a3a2a, 1);
    for (let vx = 0; vx < W; vx += 48) g.fillRect(vx, 0, 36, 30);
    g.lineStyle(1, 0x00ff88, 0.15);
    for (let vx = 0; vx < W; vx += 48) g.lineBetween(vx, 0, vx, 30);

    // Chemical drums (right half)
    for (let dx = 720; dx < 1200; dx += 110) {
      // Drum
      g.fillStyle(0x1a4a1a, 1); g.fillEllipse(dx, FLOOR_Y - 35, 72, 24);
      g.fillStyle(0x226622, 1); g.fillRect(dx - 36, FLOOR_Y - 130, 72, 96);
      g.fillStyle(0x1a4a1a, 1); g.fillEllipse(dx, FLOOR_Y - 132, 72, 24);
      // Hazard label
      g.fillStyle(0xffaa00, 1); g.fillRect(dx - 18, FLOOR_Y - 116, 36, 50);
      g.fillStyle(0xff3300, 1); g.fillTriangle(dx, FLOOR_Y - 108, dx - 12, FLOOR_Y - 76, dx + 12, FLOOR_Y - 76);
      g.fillStyle(0x000000, 1); g.fillRect(dx - 10, FLOOR_Y - 72, 20, 5);
      // Pipe connection
      g.lineStyle(4, 0x336633, 1);
      if (dx < 1100) g.lineBetween(dx + 36, FLOOR_Y - 80, dx + 110 - 36, FLOOR_Y - 80);
    }

    // Mist overlay
    g.fillStyle(0x00ff88, 0.035); g.fillRect(0, 0, W, FLOOR_Y);
    g.fillStyle(0x00ff88, 0.025); g.fillRect(0, FLOOR_Y, W, 60);

    // Spill puddle (left of scene, different from hazard)
    g.fillStyle(0x00bb55, 0.3); g.fillEllipse(140, FLOOR_Y + 30, 180, 40);
  }

  _bgOffice(g, _theme) {
    // Walls
    g.fillStyle(0x2c2c3c, 1); g.fillRect(0, 0, W, FLOOR_Y);
    // Wall trim
    g.fillStyle(0x3a3a4a, 1); g.fillRect(0, FLOOR_Y - 14, W, 14);

    // Window (right)
    g.fillStyle(0xc0d8f0, 0.35); g.fillRect(720, 50, 440, 260);
    g.lineStyle(4, 0x8899aa, 1); g.strokeRect(720, 50, 440, 260);
    g.lineStyle(2, 0x7788aa, 0.5); g.lineBetween(940, 50, 940, 310); g.lineBetween(720, 180, 1160, 180);
    // Window blinds
    for (let bl = 0; bl < 6; bl++) { g.lineStyle(3, 0xaabbc0, 0.4); g.lineBetween(720, 68 + bl * 22, 1160, 68 + bl * 22); }

    // Carpet
    g.fillStyle(0x3a2e24, 1); g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    for (let cx = 0; cx < W; cx += 80) for (let cy = 0; cy < H - FLOOR_Y; cy += 80) {
      g.fillStyle(cx % 160 === 0 ? 0x2e2418 : 0x342a1e, 1);
      g.fillRect(cx, FLOOR_Y + cy, 80, 80);
    }

    // Desks (right area)
    for (let dx = 710; dx < 1200; dx += 195) {
      g.fillStyle(0x5c4a38, 1); g.fillRect(dx, FLOOR_Y - 90, 160, 90);
      g.fillStyle(0x4a3828, 1); g.fillRect(dx, FLOOR_Y - 94, 160, 10);
      // Monitor
      g.fillStyle(0x181828, 1); g.fillRect(dx + 30, FLOOR_Y - 195, 100, 72);
      g.fillRect(dx + 66, FLOOR_Y - 123, 28, 33);
      g.fillStyle(0x28386a, 0.8); g.fillRect(dx + 34, FLOOR_Y - 191, 92, 64);
      g.lineStyle(1, 0x3a4a7a, 1); g.strokeRect(dx + 34, FLOOR_Y - 191, 92, 64);
      // Keyboard
      g.fillStyle(0x2a2a2a, 1); g.fillRect(dx + 18, FLOOR_Y - 42, 100, 20);
    }

    // Fluorescent lights
    for (let lx = 140; lx < W; lx += 240) {
      g.fillStyle(0xffffee, 0.8); g.fillRect(lx - 50, 4, 100, 10);
      g.fillStyle(0xffffcc, 0.06); g.fillRect(lx - 100, 12, 200, FLOOR_Y - 12);
    }

    // Fire exit sign
    g.fillStyle(0x00aa00, 1); g.fillRect(60, 40, 100, 34);
    this.add.text(110, 57, 'EXIT', { fontSize: '12px', fontFamily: 'Courier New', color: '#ffffff' }).setOrigin(0.5).setDepth(1);

    // Smoke detector on ceiling
    g.fillStyle(0xeeeeee, 1); g.fillCircle(500, 10, 14);
    g.fillStyle(0xff4444, 1); g.fillCircle(500, 10, 5);
  }

  // ── ANIMATED HAZARD ──────────────────────────────────────────────────────────
  _drawHazard(hazKey, colors) {
    const hx = 580, hy = FLOOR_Y;

    // Label above hazard
    const titleText = this.add.text(W / 2, H / 2 - 80, `${title}`, {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5).setDepth(3001);

    // Pulse the label
    this.tweens.add({
      targets: this._hazardLabel,
      alpha: 0.3, yoyo: true, repeat: -1, duration: 900,
    });

    this._hazardGfx = this.add.graphics().setDepth(5);
    this._renderHazard(this._hazardGfx, hazKey, colors, hx, hy);
    this._animateHazard(hazKey, colors, hx, hy);
  }

  _renderHazard(g, type, colors, hx, hy) {
    g.clear();
    switch (type) {
      case 'spill':
      case 'chemical': {
        // Base pool
        g.fillStyle(colors.main, 0.85); g.fillEllipse(hx, hy + 16, 160, 48);
        g.fillStyle(colors.glow, 0.5); g.fillEllipse(hx - 12, hy + 10, 90, 26);
        // Drips
        for (let i = -2; i <= 2; i++) {
          g.fillStyle(colors.main, 0.7); g.fillEllipse(hx + i * 32, hy - 18, 18, 36);
        }
        // Sheen
        g.fillStyle(0xffffff, 0.12); g.fillEllipse(hx - 20, hy + 8, 50, 16);
        break;
      }
      case 'fire': {
        // Back flame (wide)
        g.fillStyle(colors.glow, 0.9);
        g.fillTriangle(hx, hy - 105, hx - 52, hy, hx + 52, hy);
        // Side flames
        g.fillStyle(colors.main, 1);
        g.fillTriangle(hx - 28, hy - 78, hx - 70, hy, hx + 8, hy);
        g.fillTriangle(hx + 28, hy - 72, hx - 8, hy, hx + 70, hy);
        // Core flames
        g.fillStyle(0xffff44, 0.85);
        g.fillTriangle(hx, hy - 62, hx - 22, hy, hx + 22, hy);
        g.fillStyle(0xffffff, 0.45);
        g.fillTriangle(hx, hy - 38, hx - 11, hy, hx + 11, hy);
        // Ember sparks
        [[hx - 38, hy - 112], [hx + 44, hy - 96], [hx + 8, hy - 128], [hx - 16, hy - 85]].forEach(([x, y]) => {
          g.fillStyle(colors.glow, 0.9); g.fillCircle(x, y, 5);
          g.fillStyle(0xffffff, 0.7); g.fillCircle(x, y, 2);
        });
        break;
      }
      case 'gas': {
        // Layered cloud billow
        const puffs = [[hx, hy - 60, 70], [hx - 40, hy - 40, 55], [hx + 40, hy - 40, 55],
        [hx - 20, hy - 90, 48], [hx + 20, hy - 90, 48], [hx, hy - 20, 60]];
        puffs.forEach(([cx, cy, r], i) => {
          g.fillStyle(colors.main, 0.22 - i * 0.02); g.fillCircle(cx, cy, r);
        });
        g.fillStyle(colors.glow, 0.1); g.fillCircle(hx, hy - 55, 80);
        // Drip streaks
        g.lineStyle(2, colors.glow, 0.3);
        for (let d = -2; d <= 2; d++) g.lineBetween(hx + d * 20, hy - 20, hx + d * 20, hy + 10);
        break;
      }
      case 'electric': {
        // Glow aura
        g.lineStyle(18, colors.glow, 0.2); g.lineBetween(hx + 14, hy - 100, hx - 16, hy + 14);
        g.lineStyle(10, colors.glow, 0.3); g.lineBetween(hx + 14, hy - 100, hx - 16, hy + 14);
        // Bolt
        g.lineStyle(7, colors.main, 1);
        g.lineBetween(hx + 14, hy - 100, hx - 20, hy - 44);
        g.lineBetween(hx - 20, hy - 44, hx + 16, hy - 44);
        g.lineBetween(hx + 16, hy - 44, hx - 16, hy + 14);
        // Arc sparks
        [[hx - 36, hy - 22], [hx + 32, hy - 18], [hx, hy - 56], [hx + 24, hy - 80]].forEach(([sx, sy]) => {
          g.fillStyle(0xffffff, 0.95); g.fillCircle(sx, sy, 4);
          g.fillStyle(colors.main, 0.6); g.fillCircle(sx, sy, 8);
        });
        break;
      }
      case 'falling': {
        // Motion blur trail
        for (let i = 5; i >= 1; i--) {
          g.fillStyle(colors.glow, 0.06 * i);
          g.fillRect(hx - 36, hy - 68 - i * 24, 72, 60);
        }
        // Object
        g.fillStyle(colors.main, 1); g.fillRect(hx - 36, hy - 68, 72, 60);
        g.lineStyle(2, colors.glow, 0.7); g.strokeRect(hx - 36, hy - 68, 72, 60);
        // Motion lines
        g.lineStyle(3, colors.glow, 0.5);
        for (let i = -2; i <= 2; i++) g.lineBetween(hx + i * 14, hy - 90, hx + i * 14 + 4, hy - 115);
        // Impact shadow
        g.fillStyle(0x000000, 0.2); g.fillEllipse(hx, hy + 5, 80, 18);
        break;
      }
      case 'machinery': {
        // Gear body
        g.fillStyle(colors.main, 1); g.fillCircle(hx, hy - 46, 42);
        g.fillStyle(0x0a0a1a, 1); g.fillCircle(hx, hy - 46, 18);
        // Gear teeth
        for (let a = 0; a < 10; a++) {
          const angle = (a / 10) * Math.PI * 2;
          g.fillStyle(colors.main, 1);
          g.fillRect(hx + Math.cos(angle) * 36 - 10, hy - 46 + Math.sin(angle) * 36 - 10, 20, 20);
        }
        // Danger zone ring
        g.lineStyle(4, 0xff4400, 0.7); g.strokeCircle(hx, hy - 46, 65);
        // Guard rail opening (hazard area)
        g.lineStyle(3, 0xffcc00, 0.9);
        g.strokeRect(hx - 55, hy - 16, 110, 18);
        // Crossing lines
        g.lineBetween(hx - 55, hy - 16, hx + 55, hy + 2);
        g.lineBetween(hx + 55, hy - 16, hx - 55, hy + 2);
        break;
      }
      default: {
        // Warning triangle
        g.fillStyle(colors.main, 0.9);
        g.fillTriangle(hx, hy - 100, hx - 68, hy, hx + 68, hy);
        g.fillStyle(0x0a0a1a, 1);
        g.fillTriangle(hx, hy - 82, hx - 47, hy - 8, hx + 47, hy - 8);
        this.add.text(hx, hy - 52, '!', {
          fontSize: '42px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#ffdd00',
        }).setOrigin(0.5).setDepth(8);
      }
    }
  }

  _animateHazard(type, colors, hx, hy) {
    // Every hazard gets a slow alpha pulse
    this.tweens.add({
      targets: this._hazardGfx, alpha: 0.6,
      yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut',
    });

    // Fire gets additional vertical flicker via child graphics
    if (type === 'fire') {
      const flicker = this.add.graphics().setDepth(6);
      const drawFlicker = () => {
        flicker.clear();
        const jitter = Phaser.Math.Between(-8, 8);
        flicker.fillStyle(0xffffff, 0.15);
        flicker.fillTriangle(hx + jitter, hy - 40, hx - 10, hy, hx + 10, hy);
      };
      this.time.addEvent({ delay: 80, callback: drawFlicker, loop: true });
      this._flameTweens.push(flicker);
    }

    // Gas gets a slow scale breathe
    if (type === 'gas') {
      this.tweens.add({
        targets: this._hazardGfx,
        scaleX: 1.08, scaleY: 1.06,
        yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.inOut',
      });
    }
  }

  // ── PLAYER CHARACTER ─────────────────────────────────────────────────────────
  _drawPlayer(theme) {
    const px = 245, py = FLOOR_Y;
    this._playerGfx = this.add.graphics().setDepth(8);
    this._drawWorker(this._playerGfx, px, py, theme.accent);

    // Idle bob
    this._playerTween = this.tweens.add({
      targets: this._playerGfx, y: -5,
      yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.inOut',
    });

    // Role tag
    const m = state.currentMission;
    if (m?.player_role) {
      const tagG = this.add.graphics().setDepth(9);
      const tagW = m.player_role.length * 7 + 24;
      tagG.fillStyle(0x000000, 0.65); tagG.fillRoundedRect(px - tagW / 2, py + 6, tagW, 22, 4);
      this.add.text(px, py + 17, m.player_role.toUpperCase(), {
        fontSize: '9px', fontFamily: 'Courier New', color: TEXT.YELLOW,
      }).setOrigin(0.5).setDepth(10);
    }
  }

  _drawWorker(g, px, py, hatColor) {
    g.clear();
    // Shadow
    g.fillStyle(0x000000, 0.22); g.fillEllipse(px, py + 4, 58, 14);
    // Boots
    g.fillStyle(0x2a1a08, 1);
    g.fillRect(px - 22, py - 10, 20, 12); g.fillRect(px + 2, py - 10, 20, 12);
    // Legs (work trousers)
    g.fillStyle(0x1a3a6a, 1);
    g.fillRect(px - 20, py - 50, 16, 42); g.fillRect(px + 4, py - 50, 16, 42);
    // Knee pads
    g.fillStyle(0x0a2a5a, 1); g.fillRect(px - 20, py - 34, 16, 10); g.fillRect(px + 4, py - 34, 16, 10);
    // Body — hi-vis vest
    g.fillStyle(0xff8800, 1); g.fillRect(px - 24, py - 98, 48, 50);
    // Vest reflective stripes
    g.fillStyle(0xffff44, 0.9);
    g.fillRect(px - 24, py - 84, 48, 7);
    g.fillRect(px - 24, py - 66, 48, 7);
    // Vest collar / zipper
    g.fillStyle(0xcc6600, 1); g.fillRect(px - 4, py - 98, 8, 50);
    // Arms
    g.fillStyle(0xff8800, 1);
    g.fillRect(px - 44, py - 96, 20, 40); g.fillRect(px + 24, py - 96, 20, 40);
    // Gloves
    g.fillStyle(0x1e2e1e, 1);
    g.fillRect(px - 46, py - 58, 22, 14); g.fillRect(px + 24, py - 58, 22, 14);
    // Neck
    g.fillStyle(0xf0c888, 1); g.fillRect(px - 8, py - 108, 16, 14);
    // Head
    g.fillStyle(0xf0c888, 1); g.fillCircle(px, py - 126, 28);
    // Face shadow (jaw)
    g.fillStyle(0xe0a866, 0.3); g.fillEllipse(px, py - 112, 40, 18);
    // Hard hat
    g.fillStyle(hatColor, 1);
    g.fillEllipse(px, py - 150, 70, 24);
    g.fillRect(px - 27, py - 158, 54, 24);
    // Hat brim darker strip
    g.fillStyle(0x000000, 0.15); g.fillRect(px - 35, py - 152, 70, 4);
    // Hat vent detail
    g.fillStyle(0x000000, 0.2); g.fillRect(px - 10, py - 158, 20, 4);
    // Eyes
    g.fillStyle(0x222222, 1);
    g.fillCircle(px - 10, py - 128, 4); g.fillCircle(px + 10, py - 128, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(px - 8, py - 130, 1.5); g.fillCircle(px + 12, py - 130, 1.5);
    // Eyebrows (alert/focused)
    g.lineStyle(2.5, 0x553322, 1);
    g.lineBetween(px - 14, py - 136, px - 4, py - 133);
    g.lineBetween(px + 14, py - 136, px + 4, py - 133);
    // Mouth
    g.lineStyle(2, 0x885533, 1);
    g.lineBetween(px - 9, py - 116, px + 9, py - 116);
  }

  // ── HUD OVERLAY (top 55 px) ──────────────────────────────────────────────────
  _drawHUD(m, theme) {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x000000, 0.78); g.fillRect(0, 0, W, HUD_H);
    g.lineStyle(2, theme.accent, 0.5); g.lineBetween(0, HUD_H, W, HUD_H);

    // Left: mission counter
    this.add.text(18, HUD_H / 2, `MISSION ${state.currentIndex + 1} OF ${state.missions.length}`, {
      fontSize: '12px', fontFamily: 'Arial', color: TEXT.ORANGE, fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0, 0.5).setDepth(21);

    // Progress bar (center-left)
    const barW = 240, barH = 8;
    const barX = 200, barY = HUD_H / 2 - barH / 2;
    const pct = state.currentIndex / state.missions.length;
    const pg = this.add.graphics().setDepth(21);
    pg.fillStyle(0x1a1a2e, 1); pg.fillRoundedRect(barX, barY, barW, barH, 4);
    if (pct > 0) { pg.fillStyle(C.ACCENT, 1); pg.fillRoundedRect(barX, barY, barW * pct, barH, 4); }

    // Center: player role
    const role = m.player_role ?? '';
    this.add.text(W / 2, HUD_H / 2, `${role}`, {
      fontSize: '13px', fontFamily: 'Courier New', color: TEXT.YELLOW,
    }).setOrigin(0.5).setDepth(21);

    // Right: risk + XP
    const riskCol = RISK_COLOR[m.risk_level] ?? TEXT.GRAY;
    const riskHex = RISK_HEX[m.risk_level] ?? C.GRAY;
    const rg = this.add.graphics().setDepth(21);
    rg.lineStyle(1, riskHex, 0.8); rg.strokeRoundedRect(W - 220, 12, 90, 22, 4);
    this.add.text(W - 175, HUD_H / 2 - 3, `${m.risk_level} RISK`, {
      fontSize: '11px', fontFamily: 'Courier New', color: riskCol, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(22);

    this._xpText = this.add.text(W - 16, HUD_H / 2, `⚡ ${state.score} XP`, {
      fontSize: '14px', fontFamily: 'Courier New', color: TEXT.YELLOW, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(21);

    // Keyboard hint
    this.add.text(W - 16, HUD_H - 10, 'Press  A  B  C  D  to choose', {
      fontSize: '9px', fontFamily: 'Courier New', color: TEXT.GRAY,
    }).setOrigin(1, 1).setDepth(21);
  }

  // ── BOTTOM PANEL OVERLAY ─────────────────────────────────────────────────────
  _drawBottomPanel(m) {
    const PY = PANEL_Y, PH = PANEL_H;

    // Semi-transparent panel background
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x0a0a1a, 0.95); g.fillRect(0, PY, W, PH);
    g.lineStyle(2, C.ACCENT, 0.2); g.lineBetween(0, PY, W, PY);

    const SPLIT = 560; // left column width

    // Situation card
    const scG = this.add.graphics().setDepth(21);
    scG.fillStyle(0x0c0c22, 1); scG.fillRoundedRect(12, PY + 10, SPLIT - 12, 86, 6);
    scG.lineStyle(1, C.GRAY, 0.3); scG.strokeRoundedRect(12, PY + 10, SPLIT - 12, 86, 6);

    this.add.text(24, PY + 17, 'SITUATION', {
      fontSize: '9px', fontFamily: 'Courier New', color: TEXT.GRAY,
    }).setDepth(22);
    this.add.text(24, PY + 33, m.scenario ?? '', {
      fontSize: '13px', fontFamily: 'Courier New',
      color: TEXT.WHITE, wordWrap: { width: SPLIT - 32 },
    }).setDepth(22);

    // Question
    this.add.text(12, PY + 110, '▶ ' + (m.question ?? ''), {
      fontSize: '15px', fontFamily: 'Courier New',
      color: TEXT.YELLOW, fontStyle: 'bold',
      wordWrap: { width: SPLIT },
    }).setDepth(22);

    // Choices (right column)
    this._drawChoices(m, SPLIT + 16);

    // Mic button
    this._drawMicBtn(PY, PH);
  }

  _drawChoices(m, startX) {
    const PY = PANEL_Y;
    const choices = m.choices ?? [];
    this._choiceBtns = [];

    const btnW = W - startX - 60;
    const btnH = Math.min(44, Math.floor((PANEL_H - 16) / Math.max(choices.length, 1)) - 8);
    const gap = 8;

    choices.forEach((text, i) => {
      const label = CHOICE_LABELS[i] ?? String(i + 1);
      const y = PY + 10 + i * (btnH + gap);
      this._makeChoiceBtn(label, text, startX, y, btnW, btnH);
    });
  }

  _makeChoiceBtn(label, text, bx, y, bw, bh) {
    const fill = this.add.graphics().setDepth(21);
    fill.fillStyle(0x0d0d25, 1); fill.fillRoundedRect(bx, y, bw, bh, 5);

    const border = this.add.graphics().setDepth(21);
    border.lineStyle(1.5, C.GRAY, 0.45); border.strokeRoundedRect(bx, y, bw, bh, 5);

    this.add.text(bx + 13, y + bh / 2, label, {
      fontSize: '14px', fontFamily: 'Arial',
      color: TEXT.ORANGE, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(22);

    this.add.text(bx + 42, y + bh / 2, text, {
      fontSize: '12px', fontFamily: 'Courier New',
      color: TEXT.WHITE, wordWrap: { width: bw - 56 },
    }).setOrigin(0, 0.5).setDepth(22);

    const hit = this.add.rectangle(bx + bw / 2, y + bh / 2, bw, bh)
      .setInteractive({ useHandCursor: true }).setDepth(23);

    hit.on('pointerover', () => {
      if (this._locked) return;
      fill.clear(); fill.fillStyle(C.ACCENT, 0.15); fill.fillRoundedRect(bx, y, bw, bh, 5);
      border.clear(); border.lineStyle(2, C.ACCENT, 0.6); border.strokeRoundedRect(bx, y, bw, bh, 5);
    });
    hit.on('pointerout', () => {
      if (this._locked) return;
      fill.clear(); fill.fillStyle(0x0d0d25, 1); fill.fillRoundedRect(bx, y, bw, bh, 5);
      border.clear(); border.lineStyle(1.5, C.GRAY, 0.45); border.strokeRoundedRect(bx, y, bw, bh, 5);
    });
    hit.on('pointerdown', () => this._submitAnswer(text));
    this._choiceBtns.push({ fill, border, hit });
  }

  _drawMicBtn(PY, PH) {
    const mx = W - 30, my = PY + PH / 2;
    const g = this.add.graphics().setDepth(22);
    const draw = (active) => {
      g.clear();
      g.fillStyle(active ? C.RED : 0x1a1a3a, 1); g.fillCircle(mx, my, 22);
      g.lineStyle(2, active ? C.RED : C.GRAY, 0.8); g.strokeCircle(mx, my, 22);
    };
    draw(false);
    const icon = this.add.text(mx, my, '[MIC]', { fontSize: '11px', fontFamily: 'Courier New', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(23);
    const hit = this.add.circle(mx, my, 22).setInteractive({ useHandCursor: true }).setDepth(24);

    hit.on('pointerdown', async () => {
      if (this._locked || this._micActive) return;
      this._micActive = true; draw(true); icon.setText('[REC]');
      try { await VoiceManager.startRecording(); }
      catch { this._micActive = false; draw(false); icon.setText('[MIC]'); }
    });
    hit.on('pointerup', async () => {
      if (!this._micActive) return;
      draw(false); icon.setText('⏳');
      try {
        const raw = await VoiceManager.stopRecording();
        this._micActive = false; icon.setText('[MIC]');
        if (raw) {
          const resolved = this._resolveVoice(raw);
          this._submitAnswer(resolved);
        }
      } catch { this._micActive = false; icon.setText('[MIC]'); }
    });
  }

  // ── KEYBOARD INPUT ───────────────────────────────────────────────────────────
  _addKeyboardInput(m) {
    this.input.keyboard.on('keydown', (event) => {
      if (this._locked) return;
      const key = event.key.toLowerCase();
      const choices = m.choices ?? [];
      // A/B/C/D
      const letterIdx = ['a', 'b', 'c', 'd'].indexOf(key);
      if (letterIdx >= 0 && choices[letterIdx]) { this._submitAnswer(choices[letterIdx]); return; }
      // 1/2/3/4
      const numIdx = ['1', '2', '3', '4'].indexOf(key);
      if (numIdx >= 0 && choices[numIdx]) { this._submitAnswer(choices[numIdx]); return; }
    });
  }

  // ── VOICE RESOLUTION ─────────────────────────────────────────────────────────
  /** Map a voice transcript → actual choice text (or return transcript for semantic check). */
  _resolveVoice(transcript) {
    const t = transcript.toLowerCase().trim();
    const choices = state.currentMission?.choices ?? [];

    // "a", "b", "c", "d" — also "select b", "answer is c", "option a"
    const letterMatch = t.match(/\b([abcd])\b/);
    if (letterMatch) {
      const idx = letterMatch[1].charCodeAt(0) - 97;
      if (choices[idx]) return choices[idx];
    }

    // "1", "2", "3", "4"
    const numMatch = t.match(/\b([1-4])\b/);
    if (numMatch) {
      const idx = parseInt(numMatch[1]) - 1;
      if (choices[idx]) return choices[idx];
    }

    // "first/one", "second/two", "third/three", "fourth/four"
    const ordinals = [['first', 'one'], ['second', 'two'], ['third', 'three'], ['fourth', 'four']];
    for (let i = 0; i < ordinals.length; i++) {
      if (ordinals[i].some(o => t.includes(o)) && choices[i]) return choices[i];
    }

    // Fuzzy word match against choice text (≥2 keyword matches)
    let best = null, bestScore = 0;
    for (const choice of choices) {
      const words = choice.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const score = words.filter(w => t.includes(w)).length;
      if (score > bestScore) { bestScore = score; best = choice; }
    }
    if (bestScore >= 2) return best;

    return transcript; // fall back to raw for semantic check
  }

  // ── ANSWER SUBMISSION ────────────────────────────────────────────────────────
  async _submitAnswer(playerAnswer) {
    if (this._locked) return;
    this._locked = true;
    this._choiceBtns.forEach(({ hit }) => hit.disableInteractive());
    this.input.keyboard.removeAllListeners('keydown');

    const m = state.currentMission;
    try {
      const result = await APIManager.checkAnswer(state.gameId, m.id, playerAnswer);
      const correct = result.correct;
      if (correct) { state.score += result.xp ?? 100; state.correctCount += 1; }
      this._animateResult(correct);
      this._showFeedback(correct, result.feedback, result.explanation);
      VoiceManager.speak(result.feedback, correct ? 'celebrating' : 'sympathetic').catch(() => { });
    } catch {
      const correct = playerAnswer.toLowerCase().includes(
        (m.correct_answer ?? '').toLowerCase().slice(0, 15)
      );
      if (correct) { state.score += 100; state.correctCount += 1; }
      this._animateResult(correct);
      this._showFeedback(correct, correct ? m.success_message : m.fail_message, '');
    }
  }

  // ── RESULT ANIMATIONS ────────────────────────────────────────────────────────
  _animateResult(correct) {
    if (this._playerTween) this._playerTween.stop();

    if (correct) {
      // Player jumps
      this.tweens.add({
        targets: this._playerGfx, y: '-=80',
        yoyo: true, duration: 450, ease: 'Cubic.out',
      });
      // Hazard dissolves + shrinks
      this.tweens.add({
        targets: [this._hazardGfx, this._hazardLabel],
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: 800, ease: 'Power3',
      });
      this._flameTweens.forEach(f => this.tweens.add({ targets: f, alpha: 0, duration: 600 }));
      this._worldFlash(C.GREEN, 0.2);
    } else {
      // Player shakes
      this.tweens.add({
        targets: this._playerGfx, x: Phaser.Math.Between(-12, 12),
        yoyo: true, repeat: 6, duration: 55,
      });
      // Hazard surges
      this.tweens.add({
        targets: this._hazardGfx, scaleX: 1.6, scaleY: 1.6,
        yoyo: true, duration: 400, ease: 'Bounce',
      });
      this._worldFlash(C.RED, 0.25);
    }
  }

  _worldFlash(color, alpha) {
    const f = this.add.graphics().setDepth(30);
    f.fillStyle(color, alpha); f.fillRect(0, 0, W, H);
    this.tweens.add({ targets: f, alpha: 0, duration: 550, onComplete: () => f.destroy() });
  }

  // ── FEEDBACK OVERLAY ─────────────────────────────────────────────────────────
  _showFeedback(correct, feedback, explanation) {
    const color = correct ? C.GREEN : C.RED;
    const textCol = correct ? TEXT.GREEN : TEXT.RED;
    const icon = correct ? '✅' : '❌';
    const headline = correct ? 'HAZARD NEUTRALIZED!' : 'DANGER! NOOB MISTAKE!';

    const ov = this.add.graphics().setDepth(40);
    ov.fillStyle(0x000000, 0.88); ov.fillRect(0, 0, W, H);

    const pw = 740, ph = 300;
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    ov.fillStyle(0x07071a, 1); ov.fillRoundedRect(px, py, pw, ph, 14);
    ov.lineStyle(3, color, 1); ov.strokeRoundedRect(px, py, pw, ph, 14);

    const t1 = this.add.text(W / 2, py + 55, `${icon} ${headline}`, {
      fontSize: '30px', fontFamily: 'Courier New', color: textCol, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41);

    const t2 = this.add.text(W / 2, py + 120, feedback ?? '', {
      fontSize: '16px', fontFamily: 'Courier New', color: TEXT.WHITE,
      wordWrap: { width: pw - 60 }, align: 'center',
    }).setOrigin(0.5).setDepth(41);

    const t3 = explanation ? this.add.text(W / 2, py + 182, explanation, {
      fontSize: '12px', fontFamily: 'Courier New', color: TEXT.GRAY,
      wordWrap: { width: pw - 60 }, align: 'center',
    }).setOrigin(0.5).setDepth(41) : null;

    const xpLine = correct
      ? `+100 XP  ·  Total: ${state.score} XP  ·  Mission ${state.currentIndex + 1} / ${state.missions.length}`
      : `Mission ${state.currentIndex + 1} / ${state.missions.length}`;
    const t4 = this.add.text(W / 2, py + 246, xpLine, {
      fontSize: '17px', fontFamily: 'Courier New',
      color: correct ? TEXT.YELLOW : TEXT.GRAY, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41);

    this._xpText?.setText(`⚡ ${state.score} XP`);

    this.time.delayedCall(2900, () => {
      [ov, t1, t2, t3, t4].filter(Boolean).forEach(o => o.destroy());
      state.currentIndex += 1;
      if (state.isComplete) {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ResultScene'));
      } else {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
      }
    });
  }
}
