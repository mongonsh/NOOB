import { C, W, H, TEXT } from '../config/constants.js';
import { APIManager } from '../managers/APIManager.js';
import { VoiceManager } from '../managers/VoiceManager.js';
import { state } from '../managers/StateManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  preload() {
    // Assets are already generated in BootScene
  }

  create() {
    state.reset();
    this.cameras.main.setBackgroundColor(C.BG);
    this.cameras.main.fadeIn(500);

    this._createGameEnvironment();
    this._createAnimatedBackground();
    this._createHeader();
    this._createFeatureCards();
    this._createRecentManuals();
    this._createFooter();
    this._setupUploadOverlay();
  }

  _createGameEnvironment() {
    // Create a mini game scene preview with actual sprites
    const envY = 480;

    // Floor tiles
    for (let x = 0; x < W; x += 64) {
      const tile = this.add.image(x, envY, 'floor-tile').setOrigin(0, 0).setAlpha(0.3);
    }

    // Add some environment objects
    const crate1 = this.add.image(200, envY - 48, 'crate').setOrigin(0.5, 1);
    const crate2 = this.add.image(280, envY - 48, 'crate').setOrigin(0.5, 1);
    const barrel = this.add.image(W - 200, envY - 60, 'barrel').setOrigin(0.5, 1);
    const cone1 = this.add.image(400, envY - 44, 'cone').setOrigin(0.5, 1);
    const cone2 = this.add.image(450, envY - 44, 'cone').setOrigin(0.5, 1);

    // Animated worker character
    const worker = this.add.sprite(W / 2, envY - 110, 'player-idle').setOrigin(0.5, 1);
    worker.play('player-walk');

    // Floating animation for worker
    this.tweens.add({
      targets: worker,
      y: '-=10',
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.inOut',
    });

    // Animated fire hazard
    const fire = this.add.sprite(W / 2 + 200, envY - 64, 'fire-1').setOrigin(0.5, 1);
    fire.play('fire-burn');
    fire.setScale(0.8);

    // Fire glow
    const fireGlow = this.add.graphics();
    fireGlow.fillStyle(0xff4400, 0.2);
    fireGlow.fillCircle(W / 2 + 200, envY - 32, 40);
    this.tweens.add({
      targets: fireGlow,
      alpha: { from: 0.2, to: 0.4 },
      scale: { from: 1, to: 1.2 },
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.inOut',
    });

    // Spill hazard
    const spill = this.add.image(W / 2 - 250, envY - 32, 'spill').setOrigin(0.5, 1).setAlpha(0.8);

    // Floating particles around hazards
    const hazardParticles = this.add.particles(W / 2 + 200, envY - 64, 'particle-spark', {
      speed: { min: 20, max: 60 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 1000,
      frequency: 150,
      blendMode: 'ADD',
    });

    // Make objects slightly transparent and add depth
    [crate1, crate2, barrel, cone1, cone2, spill].forEach((obj, i) => {
      obj.setAlpha(0.6);
      this.tweens.add({
        targets: obj,
        y: '-=5',
        yoyo: true,
        repeat: -1,
        duration: 2000 + i * 200,
        ease: 'Sine.inOut',
      });
    });
  }

  _createAnimatedBackground() {
    // Animated grid
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, C.ACCENT, 0.1);

    for (let x = 0; x < W; x += 40) {
      gridGraphics.lineBetween(x, 0, x, H);
    }
    for (let y = 0; y < H; y += 40) {
      gridGraphics.lineBetween(0, y, W, y);
    }

    this.tweens.add({
      targets: gridGraphics,
      alpha: { from: 0.1, to: 0.3 },
      yoyo: true,
      repeat: -1,
      duration: 3000,
      ease: 'Sine.inOut',
    });

    // Floating particles
    const particles = this.add.particles(0, 0, 'particle-glow', {
      x: { min: 0, max: W },
      y: { min: 0, max: H },
      lifespan: 6000,
      speedX: { min: -30, max: 30 },
      speedY: { min: -30, max: 30 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.4, end: 0 },
      frequency: 200,
      blendMode: 'ADD',
    });

    // Scanline effect
    const scanline = this.add.graphics();
    scanline.fillStyle(C.ACCENT, 0.05);
    scanline.fillRect(0, 0, W, 3);

    this.tweens.add({
      targets: scanline,
      y: { from: 0, to: H },
      duration: 3000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  _createHeader() {
    // Logo container with glow
    const logoGlow = this.add.graphics();
    logoGlow.fillStyle(C.ACCENT, 0.1);
    logoGlow.fillCircle(W / 2, 100, 120);

    this.tweens.add({
      targets: logoGlow,
      scale: { from: 1, to: 1.1 },
      alpha: { from: 0.1, to: 0.2 },
      yoyo: true,
      repeat: -1,
      duration: 3000,
      ease: 'Sine.inOut',
    });

    const titleShadow = this.add.text(W / 2 + 4, 134, 'SAFETY TRAINING HUB', {
      fontSize: '52px',
      fontFamily: 'Impact, sans-serif',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.6);

    const title = this.add.text(W / 2, 130, 'SAFETY TRAINING HUB', {
      fontSize: '52px',
      fontFamily: 'Impact, sans-serif',
      color: TEXT.ORANGE,
      fontStyle: 'bold',
      stroke: '#05050a',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const tagline = this.add.text(W / 2, 185, 'INTERACTIVE TRAINING  •  EXPERT AI ASSISTANCE', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#a0a0c0',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [title, titleShadow],
      y: '-=10',
      yoyo: true,
      repeat: -1,
      duration: 3000,
      ease: 'Sine.inOut',
    });
  }

  _createFeatureCards() {
    const features = [
      {
        title: 'TRAINING SIMULATION',
        desc: 'Master safety protocols through\nAI-generated interactive missions.',
        action: 'START TRAINING',
        color: 0xff6b35,
        callback: () => this._showUpload(),
      },
      {
        title: 'EMERGENCY ASSISTANT',
        desc: 'Get immediate guidance through\nlive AI-powered voice assistance.',
        action: 'CALL ASSISTANT',
        color: 0xffd700,
        callback: () => this._startEmergencyAssistant(),
      },
    ];

    const cardWidth = 380;
    const cardHeight = 320;
    const gap = 80;
    const totalWidth = features.length * cardWidth + (features.length - 1) * gap;
    const startX = W / 2 - totalWidth / 2;
    const cardY = 260;

    features.forEach((feature, i) => {
      const x = startX + i * (cardWidth + gap);

      const card = this.add.image(x + cardWidth / 2, cardY + cardHeight / 2, 'ui-panel')
        .setDisplaySize(cardWidth, cardHeight).setAlpha(0.8);

      // Create icon glow effect
      const iconGlow = this.add.graphics();
      iconGlow.fillStyle(feature.color, 0.2);
      iconGlow.fillCircle(x + cardWidth / 2, cardY + 60, 45);
      iconGlow.setAlpha(0.6);

      // Create icon
      const icon = this.add.text(x + cardWidth / 2, cardY + 60, feature.icon, {
        fontSize: '48px',
      }).setOrigin(0.5);

      const title = this.add.text(x + cardWidth / 2, cardY + 80, feature.title, {
        fontSize: '22px',
        fontFamily: 'Arial',
        color: `#${feature.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
        letterSpacing: 1
      }).setOrigin(0.5);

      const desc = this.add.text(x + cardWidth / 2, cardY + 150, feature.desc, {
        fontSize: '15px',
        fontFamily: 'Arial',
        color: '#a0a0c0',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5);

      const btnBg = this.add.image(x + cardWidth / 2, cardY + 250, 'ui-button')
        .setDisplaySize(280, 55);

      const btnText = this.add.text(x + cardWidth / 2, cardY + 250, feature.action, {
        fontSize: '15px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        letterSpacing: 1
      }).setOrigin(0.5);

      // Make card interactive
      card.setInteractive({ useHandCursor: true });
      btnBg.setInteractive({ useHandCursor: true });

      // Enhanced hover effect for card
      card.on('pointerover', () => {
        // Lift card with shadow effect
        this.tweens.add({
          targets: [card, icon, iconGlow, title, desc, btnBg, btnText],
          y: '-=15',
          duration: 300,
          ease: 'Power2',
        });

        // Scale up slightly for depth
        this.tweens.add({
          targets: card,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 300,
          ease: 'Power2',
        });

        // Brighten and enlarge icon glow
        iconGlow.clear();
        iconGlow.fillStyle(feature.color, 0.5);
        iconGlow.fillCircle(x + cardWidth / 2, cardY + 60, 50);

        this.tweens.add({
          targets: iconGlow,
          alpha: 1,
          duration: 300,
        });

        // Pulse icon
        this.tweens.add({
          targets: icon,
          scale: 1.15,
          duration: 300,
          ease: 'Back.out',
        });

        // Brighten title
        title.setColor('#ffffff');

        // Add shimmer effect to button
        this.tweens.add({
          targets: btnBg,
          alpha: 1,
          duration: 300,
        });
      });

      card.on('pointerout', () => {
        // Return card to original position
        this.tweens.add({
          targets: [card, icon, iconGlow, title, desc, btnBg, btnText],
          y: '+=15',
          duration: 300,
          ease: 'Power2',
        });

        // Return to original scale
        this.tweens.add({
          targets: card,
          scaleX: 1,
          scaleY: 1,
          duration: 300,
          ease: 'Power2',
        });

        // Dim icon glow
        iconGlow.clear();
        iconGlow.fillStyle(feature.color, 0.2);
        iconGlow.fillCircle(x + cardWidth / 2, cardY + 60, 45);

        this.tweens.add({
          targets: iconGlow,
          alpha: 0.6,
          duration: 300,
        });

        // Return icon to normal size
        this.tweens.add({
          targets: icon,
          scale: 1,
          duration: 300,
          ease: 'Back.in',
        });

        // Return title color
        title.setColor(`#${feature.color.toString(16).padStart(6, '0')}`);

        // Return button alpha
        this.tweens.add({
          targets: btnBg,
          alpha: 0.9,
          duration: 300,
        });
      });

      // Enhanced button hover effect
      btnBg.on('pointerover', () => {
        this.tweens.add({
          targets: btnBg,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 200,
          ease: 'Back.out',
        });

        this.tweens.add({
          targets: btnText,
          scale: 1.05,
          duration: 200,
          ease: 'Back.out',
        });

        // Add glow effect to button
        btnText.setColor(TEXT.ORANGE);
        btnText.setShadow(0, 0, TEXT.ORANGE, 8, false, true);
      });

      btnBg.on('pointerout', () => {
        this.tweens.add({
          targets: btnBg,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Back.in',
        });

        this.tweens.add({
          targets: btnText,
          scale: 1,
          duration: 200,
          ease: 'Back.in',
        });

        // Remove glow effect
        btnText.setColor('#ffffff');
        btnText.setShadow(0, 0, '#000000', 0, false, false);
      });

      // Enhanced click handlers with animations
      const handleClick = () => {
        // Punch effect on card
        this.tweens.add({
          targets: card,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 100,
          yoyo: true,
          ease: 'Power2',
        });

        // Burst particle effect
        const flash = this.add.particles(x + cardWidth / 2, cardY + cardHeight / 2, 'particle-spark', {
          speed: { min: 150, max: 400 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.8, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 800,
          quantity: 40,
          blendMode: 'ADD',
          tint: feature.color,
        });

        // Ripple effect
        const ripple = this.add.graphics();
        ripple.lineStyle(3, feature.color, 1);
        ripple.strokeCircle(x + cardWidth / 2, cardY + cardHeight / 2, 10);

        this.tweens.add({
          targets: ripple,
          alpha: 0,
          duration: 600,
          onUpdate: () => {
            ripple.clear();
            const radius = 10 + (1 - ripple.alpha) * 150;
            ripple.lineStyle(3, feature.color, ripple.alpha);
            ripple.strokeCircle(x + cardWidth / 2, cardY + cardHeight / 2, radius);
          },
          onComplete: () => ripple.destroy(),
        });

        this.time.delayedCall(800, () => flash.destroy());

        // Fade out effect before transition
        this.tweens.add({
          targets: [card, icon, iconGlow, title, desc, btnBg, btnText],
          alpha: 0.5,
          duration: 300,
          onComplete: () => {
            feature.callback();
          },
        });
      };

      card.on('pointerdown', handleClick);
      btnBg.on('pointerdown', handleClick);

      // Stagger animation on create with enhanced entrance
      card.setAlpha(0).setScale(0.5);
      icon.setAlpha(0).setScale(0);
      title.setAlpha(0);
      desc.setAlpha(0);
      btnBg.setAlpha(0).setScale(0.8);
      btnText.setAlpha(0);

      // Card entrance
      this.tweens.add({
        targets: card,
        alpha: 1,
        scale: 1,
        duration: 600,
        delay: i * 200,
        ease: 'Elastic.out',
      });

      // Icon pop-in
      this.tweens.add({
        targets: icon,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: i * 200 + 200,
        ease: 'Back.out',
      });

      // Icon glow fade-in
      this.tweens.add({
        targets: iconGlow,
        alpha: 0.6,
        duration: 500,
        delay: i * 200 + 200,
      });

      // Title slide-in
      this.tweens.add({
        targets: title,
        alpha: 1,
        y: title.y,
        duration: 400,
        delay: i * 200 + 300,
        ease: 'Power2',
      });

      // Description fade-in
      this.tweens.add({
        targets: desc,
        alpha: 1,
        duration: 400,
        delay: i * 200 + 400,
      });

      // Button entrance
      this.tweens.add({
        targets: [btnBg, btnText],
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: i * 200 + 500,
        ease: 'Back.out',
      });

      // Continuous floating animation
      this.tweens.add({
        targets: [card, icon, iconGlow, title, desc, btnBg, btnText],
        y: '-=8',
        yoyo: true,
        repeat: -1,
        duration: 2500 + i * 400,
        ease: 'Sine.inOut',
      });

      // Subtle rotation animation for icon
      this.tweens.add({
        targets: icon,
        angle: { from: -3, to: 3 },
        yoyo: true,
        repeat: -1,
        duration: 3000 + i * 500,
        ease: 'Sine.inOut',
      });

      // Pulsing glow animation
      this.time.addEvent({
        delay: 2000 + i * 500,
        callback: () => {
          this.tweens.add({
            targets: iconGlow,
            alpha: { from: 0.6, to: 0.9 },
            yoyo: true,
            duration: 1500,
            ease: 'Sine.inOut',
          });
        },
        loop: true,
      });
    });
  }

  _startEmergencyAssistant() {
    // Navigate to Emergency Assistant scene
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('EmergencyScene');
    });
  }

  _createRecentManuals() {
    const sectionY = 600;

    // Section background
    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x1a1a2e, 0.4);
    sectionBg.fillRoundedRect(W / 2 - 400, sectionY - 20, 800, 100, 12);
    sectionBg.lineStyle(2, C.ACCENT, 0.1);
    sectionBg.strokeRoundedRect(W / 2 - 400, sectionY - 20, 800, 100, 12);

    // Section title
    this.add.text(W / 2 - 380, sectionY, 'RECENT SAFETY MANUALS', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: TEXT.ORANGE,
      fontStyle: 'bold',
      letterSpacing: 1
    });

    // Placeholder
    this.add.text(W / 2 - 380, sectionY + 35, 'NO MANUALS INDEXED • UPLOAD A PDF TO GENERATE TRAINING', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#888899',
      letterSpacing: 1
    });

    // Upload hint
    const uploadHint = this.add.text(W / 2, sectionY + 85, 'CLICK "START TRAINING" TO UPLOAD YOUR PDF', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#666677',
      letterSpacing: 1
    }).setOrigin(0.5);

    this.tweens.add({
      targets: uploadHint,
      alpha: { from: 0.4, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 1500,
    });
  }

  _createFooter() {
    const statsY = H - 40;
    const stats = [
      { label: 'SETTINGS', callback: () => this._showSettings() },
      { label: 'UPLOAD PDF', callback: () => this._showUpload() },
      { label: 'ABOUT', callback: () => this._showAbout() },
    ];

    const statWidth = 160;
    const totalWidth = stats.length * statWidth;
    const startX = W / 2 - totalWidth / 2;

    stats.forEach((stat, i) => {
      const x = startX + i * statWidth + statWidth / 2;

      const text = this.add.text(x, statsY, stat.label, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#888899',
        letterSpacing: 1
      }).setOrigin(0.5);

      text.setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        text.setColor(TEXT.ORANGE);
        this.tweens.add({ targets: text, scale: 1.1, duration: 150 });
      });

      text.on('pointerout', () => {
        text.setColor('#888899');
        this.tweens.add({ targets: text, scale: 1, duration: 150 });
      });

      text.on('pointerdown', () => stat.callback());
    });

    this.add.text(W / 2, H - 15, 'POWERED BY MISTRAL AI  •  PHASER.JS', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#444455',
      letterSpacing: 1
    }).setOrigin(0.5);
  }

  _setupUploadOverlay() {
    const overlay = document.getElementById('upload-overlay');
    const input = document.getElementById('pdf-input');
    const status = document.getElementById('upload-status');

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._hideUpload();
    });

    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;

      status.className = 'loading';
      status.textContent = `UPLOADING ${file.name.toUpperCase()}...`;

      try {
        await APIManager.uploadPDF(file);
        status.textContent = 'ANALYZING SAFETY PROCEDURES...';

        const game = await APIManager.generateGame(file.name);
        if (!game.success) throw new Error(game.error || 'Generation failed');

        status.className = 'success';
        status.textContent = 'GENERATION COMPLETE. STARTING...';

        state.gameId = game.game_id;
        state.manualTitle = game.manual_title;
        state.missions = game.missions;
        state.noobIntro = game.noob_intro;
        state.startTime = Date.now();

        VoiceManager.speak(game.noob_intro, 'encouraging').catch(() => { });

        setTimeout(() => {
          this._hideUpload();
          this.cameras.main.fadeOut(500);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('ActionGameScene');
          });
        }, 1500);

      } catch (err) {
        status.className = 'error';
        status.textContent = `ERROR: ${err.message.toUpperCase()}`;
        input.value = '';
      }
    });
  }

  _showUpload() {
    document.getElementById('upload-overlay').classList.remove('hidden');
    document.getElementById('upload-status').textContent = '';
    document.getElementById('upload-status').className = '';
  }

  _hideUpload() {
    document.getElementById('upload-overlay').classList.add('hidden');
  }
}
