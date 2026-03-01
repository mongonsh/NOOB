import { C, W, H, TEXT } from '../config/constants.js';
import { state } from '../managers/StateManager.js';
import { APIManager } from '../managers/APIManager.js';
import { VoiceManager } from '../managers/VoiceManager.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  create() {
    this.cameras.main.setBackgroundColor(C.BG);
    this.cameras.main.fadeIn(500);
    
    this._logCompletion();
    this._createAnimatedBackground();
    this._createVictoryEffect();
    this._createCertificate();
    this._createStatsDisplay();
    this._createButtons();
    this._speakResult();
  }

  _logCompletion() {
    const elapsed = state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : 0;
    APIManager.logCompletion(state.gameId, {
      score: state.score,
      missions_completed: state.currentIndex,
      total_missions: state.missions.length,
      correct_answers: state.correctCount,
      time_seconds: elapsed,
    }).catch(() => {});
  }

  _createAnimatedBackground() {
    // Animated grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x39ff14, 0.08);
    for (let x = 0; x < W; x += 40) grid.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) grid.lineBetween(0, y, W, y);

    // Floating particles
    const particles = this.add.particles(0, 0, 'particle-glow', {
      x: { min: 0, max: W },
      y: { min: 0, max: H },
      lifespan: 4000,
      speedX: { min: -50, max: 50 },
      speedY: { min: -50, max: 50 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      frequency: 100,
      blendMode: 'ADD',
    });
  }

  _createVictoryEffect() {
    const pct = state.missions.length
      ? Math.round((state.correctCount / state.missions.length) * 100)
      : 0;

    // Fireworks for high scores
    if (pct >= 80) {
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * 300, () => {
          const x = Phaser.Math.Between(200, W - 200);
          const y = Phaser.Math.Between(100, 300);
          
          const firework = this.add.particles(x, y, 'particle-spark', {
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            quantity: 30,
          });

          this.time.delayedCall(1000, () => firework.destroy());
        });
      }
    }

    // Victory flash
    const flash = this.add.graphics();
    flash.fillStyle(0x39ff14, 0.3);
    flash.fillRect(0, 0, W, H);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 800,
      onComplete: () => flash.destroy(),
    });
  }

  _createCertificate() {
    const cx = W / 2;
    const cy = 180;

    // Certificate glow
    const glow = this.add.graphics();
    glow.fillStyle(0x39ff14, 0.1);
    glow.fillRoundedRect(cx - 460, cy - 120, 920, 240, 20);
    
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.2 },
      scale: { from: 1, to: 1.02 },
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.inOut',
    });

    // Certificate background
    const cert = this.add.graphics();
    cert.fillStyle(0x1a1a2e, 0.95);
    cert.fillRoundedRect(cx - 450, cy - 110, 900, 220, 15);
    cert.lineStyle(4, 0x39ff14, 0.8);
    cert.strokeRoundedRect(cx - 450, cy - 110, 900, 220, 15);
    
    // Inner border
    cert.lineStyle(2, 0x39ff14, 0.4);
    cert.strokeRoundedRect(cx - 440, cy - 100, 880, 200, 12);

    // Corner decorations
    const corners = [
      [cx - 440, cy - 100],
      [cx + 440, cy - 100],
      [cx - 440, cy + 100],
      [cx + 440, cy + 100],
    ];
    
    corners.forEach(([x, y]) => {
      const corner = this.add.graphics();
      corner.lineStyle(3, 0x39ff14, 1);
      corner.lineBetween(x - 20, y, x + 20, y);
      corner.lineBetween(x, y - 20, x, y + 20);
    });

    // Trophy icon - use text instead of emoji
    const trophy = this.add.text(cx, cy - 70, '[TROPHY]', {
      fontSize: '32px',
      fontFamily: 'Courier New',
      color: '#ffcc00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: trophy,
      scale: { from: 1, to: 1.1 },
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: 'Sine.inOut',
    });

    // Title
    const title = this.add.text(cx, cy - 20, 'TRAINING COMPLETE', {
      fontSize: '36px',
      fontFamily: 'Impact, Courier New',
      color: '#39ff14',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Manual name
    const manual = this.add.text(cx, cy + 20, state.manualTitle.toUpperCase(), {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Grade
    const pct = state.missions.length
      ? Math.round((state.correctCount / state.missions.length) * 100)
      : 0;
    const grade = pct >= 90 ? 'SAFETY NINJA' : pct >= 70 ? 'PRO' : pct >= 50 ? 'NOOB+' : 'ULTRA-NOOB';
    const gradeColor = pct >= 90 ? '#39ff14' : pct >= 70 ? '#4ecdc4' : pct >= 50 ? '#ff6b35' : '#ff4444';

    const gradeText = this.add.text(cx, cy + 60, `Rank: ${grade}`, {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: gradeColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Date
    const date = this.add.text(cx, cy + 95, new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }), {
      fontSize: '13px',
      fontFamily: 'Courier New',
      color: '#888899',
    }).setOrigin(0.5);

    // Animate in
    [cert, glow, trophy, title, manual, gradeText, date].forEach((obj, i) => {
      obj.setAlpha(0).setScale(0.8);
      this.tweens.add({
        targets: obj,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: i * 100,
        ease: 'Back.out',
      });
    });
  }

  _createStatsDisplay() {
    const pct = state.missions.length
      ? Math.round((state.correctCount / state.missions.length) * 100)
      : 0;

    const stats = [
      { icon: '[XP]', label: 'Total XP', value: state.score, color: '#ffcc00' },
      { icon: '[#]', label: 'Missions', value: `${state.currentIndex}/${state.missions.length}`, color: '#ffffff' },
      { icon: '[+]', label: 'Correct', value: state.correctCount, color: '#39ff14' },
      { icon: '[%]', label: 'Accuracy', value: `${pct}%`, color: '#4ecdc4' },
    ];

    const cardW = 200;
    const cardH = 120;
    const gap = 30;
    const totalW = stats.length * cardW + (stats.length - 1) * gap;
    const startX = W / 2 - totalW / 2;
    const cardY = 420;

    stats.forEach((stat, i) => {
      const x = startX + i * (cardW + gap);

      // Card background
      const card = this.add.graphics();
      card.fillStyle(0x1a1a2e, 0.9);
      card.fillRoundedRect(x, cardY, cardW, cardH, 10);
      card.lineStyle(2, parseInt(stat.color.replace('#', '0x')), 0.6);
      card.strokeRoundedRect(x, cardY, cardW, cardH, 10);

      // Icon
      const icon = this.add.text(x + cardW / 2, cardY + 25, stat.icon, {
        fontSize: '32px',
      }).setOrigin(0.5);

      // Value
      const value = this.add.text(x + cardW / 2, cardY + 60, String(stat.value), {
        fontSize: '32px',
        fontFamily: 'Impact, Courier New',
        color: stat.color,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Label
      const label = this.add.text(x + cardW / 2, cardY + 95, stat.label, {
        fontSize: '13px',
        fontFamily: 'Courier New',
        color: '#888899',
      }).setOrigin(0.5);

      // Animate in
      [card, icon, value, label].forEach((obj) => {
        obj.setAlpha(0).setScale(0.8);
        this.tweens.add({
          targets: obj,
          alpha: 1,
          scale: 1,
          duration: 400,
          delay: 800 + i * 100,
          ease: 'Back.out',
        });
      });

      // Floating animation
      this.tweens.add({
        targets: [card, icon, value, label],
        y: '-=5',
        yoyo: true,
        repeat: -1,
        duration: 2000 + i * 200,
        ease: 'Sine.inOut',
      });

      // Number count-up animation
      if (typeof stat.value === 'number') {
        let current = 0;
        const target = stat.value;
        const duration = 1000;
        const steps = 30;
        const increment = target / steps;
        
        this.time.addEvent({
          delay: duration / steps,
          repeat: steps - 1,
          startAt: 800 + i * 100,
          callback: () => {
            current += increment;
            value.setText(Math.round(current).toString());
          },
        });
      }
    });

    // Comparison text
    const comparison = this.add.text(W / 2, 570, 'Traditional: 12% retention  |  NOOB: 94% retention', {
      fontSize: '15px',
      fontFamily: 'Courier New',
      color: '#666677',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: comparison,
      alpha: 1,
      duration: 500,
      delay: 1500,
    });
  }

  _createButtons() {
    const buttons = [
      {
        x: W / 2 - 180,
        y: 640,
        icon: '[>]',
        label: 'PLAY AGAIN',
        color: 0x39ff14,
        callback: () => {
          this.cameras.main.fadeOut(500);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
          });
        },
      },
      {
        x: W / 2 + 180,
        y: 640,
        icon: '[^]',
        label: 'SHARE SCORE',
        color: 0xff6b35,
        callback: () => {
          const pct = state.missions.length
            ? Math.round((state.correctCount / state.missions.length) * 100)
            : 0;
          const txt = `I just completed NOOB safety training with ${pct}% accuracy and ${state.score} XP! #NOOBTraining`;
          navigator.clipboard?.writeText(txt).catch(() => {});
          
          // Show copied message
          const copied = this.add.text(W / 2 + 180, 690, 'Copied to clipboard!', {
            fontSize: '13px',
            fontFamily: 'Courier New',
            color: '#39ff14',
          }).setOrigin(0.5).setAlpha(0);
          
          this.tweens.add({
            targets: copied,
            alpha: 1,
            duration: 300,
          });
          
          this.time.delayedCall(2000, () => {
            this.tweens.add({
              targets: copied,
              alpha: 0,
              duration: 300,
              onComplete: () => copied.destroy(),
            });
          });
        },
      },
    ];

    buttons.forEach((btn, i) => {
      // Button background
      const bg = this.add.graphics();
      bg.fillStyle(btn.color, 0.15);
      bg.fillRoundedRect(btn.x - 140, btn.y - 30, 280, 60, 10);
      bg.lineStyle(3, btn.color, 0.8);
      bg.strokeRoundedRect(btn.x - 140, btn.y - 30, 280, 60, 10);

      // Button text
      const text = this.add.text(btn.x, btn.y, `${btn.icon}  ${btn.label}`, {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: `#${btn.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Make interactive
      const hitArea = this.add.rectangle(btn.x, btn.y, 280, 60)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => {
        this.tweens.add({
          targets: [bg, text],
          scale: 1.1,
          duration: 200,
          ease: 'Back.out',
        });
        bg.clear();
        bg.fillStyle(btn.color, 0.25);
        bg.fillRoundedRect(btn.x - 140, btn.y - 30, 280, 60, 10);
        bg.lineStyle(3, btn.color, 1);
        bg.strokeRoundedRect(btn.x - 140, btn.y - 30, 280, 60, 10);
      });

      hitArea.on('pointerout', () => {
        this.tweens.add({
          targets: [bg, text],
          scale: 1,
          duration: 200,
          ease: 'Back.in',
        });
        bg.clear();
        bg.fillStyle(btn.color, 0.15);
        bg.fillRoundedRect(btn.x - 140, btn.y - 30, 280, 60, 10);
        bg.lineStyle(3, btn.color, 0.8);
        bg.strokeRoundedRect(btn.x - 140, btn.y - 30, 280, 60, 10);
      });

      hitArea.on('pointerdown', () => {
        // Flash effect
        const flash = this.add.graphics();
        flash.fillStyle(btn.color, 0.4);
        flash.fillCircle(btn.x, btn.y, 150);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 2,
          duration: 500,
          onComplete: () => flash.destroy(),
        });
        
        btn.callback();
      });

      // Animate in
      [bg, text].forEach((obj) => {
        obj.setAlpha(0).setScale(0.8);
        this.tweens.add({
          targets: obj,
          alpha: 1,
          scale: 1,
          duration: 400,
          delay: 1800 + i * 150,
          ease: 'Back.out',
        });
      });
    });
  }

  _speakResult() {
    const pct = state.missions.length
      ? Math.round((state.correctCount / state.missions.length) * 100)
      : 0;
    const msg = pct >= 80
      ? `Congratulations! You scored ${state.score} XP with ${pct}% accuracy. You're becoming a safety professional!`
      : `Training complete! You scored ${state.score} XP. Keep practicing — safety saves lives!`;
    VoiceManager.speak(msg, 'celebrating').catch(() => {});
  }
}
