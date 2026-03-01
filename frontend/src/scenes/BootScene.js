import { C, W, H } from '../config/constants.js';
import { VoiceManager } from '../managers/VoiceManager.js';
import { AssetGenerator } from '../utils/AssetGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Generate all game assets
    AssetGenerator.generateAllAssets(this);
    
    // Create animations
    AssetGenerator.createAnimations(this);
    
    // Show loading progress
    this._createLoadingBar();
  }

  create() {
    this.cameras.main.setBackgroundColor(C.BG);

    // Initialize WebSocket for voice
    VoiceManager.initSocket();

    // Animated background particles
    this._createParticles();

    // Animated logo with glow
    this._createLogo();
  }

  _createLoadingBar() {
    const barWidth = 400;
    const barHeight = 10;
    const barX = W / 2 - barWidth / 2;
    const barY = H - 80;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x222233, 1);
    bg.fillRoundedRect(barX, barY, barWidth, barHeight, 5);

    // Progress bar
    const bar = this.add.graphics();
    
    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0x39ff14, 1);
      bar.fillRoundedRect(barX, barY, barWidth * value, barHeight, 5);
    });

    this.load.on('complete', () => {
      bg.destroy();
      bar.destroy();
    });

    // Loading text
    const loadingText = this.add.text(W / 2, barY + 30, 'Generating Game Assets...', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#888899',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: loadingText,
      alpha: { from: 0.5, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 600,
    });

    this.load.on('complete', () => {
      loadingText.destroy();
    });
  }

  _createParticles() {
    const particles = this.add.particles(0, 0, 'particle-glow', {
      x: { min: 0, max: W },
      y: { min: -50, max: -10 },
      lifespan: 4000,
      speedY: { min: 50, max: 150 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      frequency: 100,
      blendMode: 'ADD',
    });
  }

  _createLogo() {
    // Glow effect
    const glow = this.add.graphics();
    glow.fillStyle(0x39ff14, 0.2);
    glow.fillCircle(W / 2, H / 2 - 40, 180);
    
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.2, to: 0.5 },
      scale: { from: 1, to: 1.2 },
      yoyo: true,
      repeat: -1,
      duration: 1500,
      ease: 'Sine.inOut',
    });

    // Main title with shadow
    const shadow = this.add.text(W / 2 + 4, H / 2 - 36, 'NOOB', {
      fontSize: '120px',
      fontFamily: 'Impact, Courier New',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(W / 2, H / 2 - 40, 'NOOB', {
      fontSize: '120px',
      fontFamily: 'Impact, Courier New',
      color: '#39ff14',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(W / 2, H / 2 + 60, 'New Operator Onboarding & Basics', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#888899',
    }).setOrigin(0.5);

    // Powered by
    const powered = this.add.text(W / 2, H / 2 + 100, 'Powered by Mistral AI & Phaser 3', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#555577',
    }).setOrigin(0.5);

    // Animate in
    this.tweens.add({
      targets: [title, shadow, subtitle, powered],
      alpha: { from: 0, to: 1 },
      y: '-=20',
      duration: 800,
      ease: 'Back.out',
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.cameras.main.fadeOut(500);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
          });
        });
      },
    });

    // Floating animation
    this.tweens.add({
      targets: title,
      y: '-=10',
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.inOut',
    });
  }
}
