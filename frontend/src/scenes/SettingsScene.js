import { C, W, H, TEXT } from '../config/constants.js';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(C.BG);
    this.cameras.main.fadeIn(500);

    this._createHeader();
    this._createVoiceSettings();
    this._createAudioSettings();
    this._createGeneralSettings();
    this._createActionButtons();
  }

  _createHeader() {
    // Header background
    const headerBg = this.add.graphics();
    headerBg.fillStyle(C.PANEL, 0.9);
    headerBg.fillRect(0, 0, W, 80);
    headerBg.lineStyle(2, C.GREEN, 0.5);
    headerBg.lineBetween(0, 80, W, 80);

    // Settings icon and title
    this.add.text(40, 40, '⚙️', {
      fontSize: '32px',
    }).setOrigin(0, 0.5);

    this.add.text(90, 40, 'SETTINGS', {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: TEXT.GREEN,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Back button
    const backBtn = this.add.text(W - 40, 40, '[← BACK]', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    backBtn.setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setColor(TEXT.GREEN);
      this.tweens.add({
        targets: backBtn,
        scale: 1.1,
        duration: 150,
      });
    });

    backBtn.on('pointerout', () => {
      backBtn.setColor(TEXT.GRAY);
      this.tweens.add({
        targets: backBtn,
        scale: 1,
        duration: 150,
      });
    });

    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  _createVoiceSettings() {
    const sectionY = 110;

    // Section header
    this.add.text(40, sectionY, '🔊 Voice Settings', {
      fontSize: '22px',
      fontFamily: 'Courier New',
      color: TEXT.GREEN,
      fontStyle: 'bold',
    });

    // Settings panel
    const panelY = sectionY + 40;
    const panel = this.add.graphics();
    panel.fillStyle(C.PANEL2, 0.8);
    panel.fillRoundedRect(40, panelY, W - 80, 180, 10);
    panel.lineStyle(2, C.GRAY, 0.3);
    panel.strokeRoundedRect(40, panelY, W - 80, 180, 10);

    // Voice Model label
    this.add.text(60, panelY + 20, 'Voice Model:', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    });

    // Voice dropdown (placeholder)
    const dropdownBg = this.add.graphics();
    dropdownBg.fillStyle(C.PANEL, 0.9);
    dropdownBg.fillRoundedRect(60, panelY + 50, W - 140, 40, 5);
    dropdownBg.lineStyle(2, C.GRAY, 0.5);
    dropdownBg.strokeRoundedRect(60, panelY + 50, W - 140, 40, 5);

    this.add.text(80, panelY + 70, 'Rachel (Professional Female) ▼', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    }).setOrigin(0, 0.5);

    // Available voices list
    this.add.text(60, panelY + 110, 'Available Voices:\n• Rachel - Professional, clear (Default)\n• Adam - Authoritative male\n• Bella - Warm, friendly female\n• Josh - Technical expert male', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: TEXT.GRAY,
      lineSpacing: 6,
    });

    // Test Voice button
    this._createButton(W - 180, panelY + 155, '🔊 Test Voice');
  }

  _createAudioSettings() {
    const sectionY = 340;

    // Section header
    this.add.text(40, sectionY, '🎚️ Audio Settings', {
      fontSize: '22px',
      fontFamily: 'Courier New',
      color: TEXT.GREEN,
      fontStyle: 'bold',
    });

    // Settings panel
    const panelY = sectionY + 40;
    const panel = this.add.graphics();
    panel.fillStyle(C.PANEL2, 0.8);
    panel.fillRoundedRect(40, panelY, W - 80, 120, 10);
    panel.lineStyle(2, C.GRAY, 0.3);
    panel.strokeRoundedRect(40, panelY, W - 80, 120, 10);

    // Microphone Volume
    this.add.text(60, panelY + 20, 'Microphone Volume:', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    });

    this._createVolumeBar(60, panelY + 45, W - 140, 80);

    // Speaker Volume
    this.add.text(60, panelY + 60, 'Speaker Volume:', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    });

    this._createVolumeBar(60, panelY + 85, W - 140, 100);

    // Noise Cancellation toggle
    this.add.text(60, panelY + 105, 'Noise Cancellation:', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    });

    const toggleBtn = this.add.text(W - 120, panelY + 105, '[✓] Enabled', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.GREEN,
    }).setOrigin(1, 0);

    toggleBtn.setInteractive({ useHandCursor: true });

    toggleBtn.on('pointerover', () => {
      this.tweens.add({
        targets: toggleBtn,
        scale: 1.05,
        duration: 150,
      });
    });

    toggleBtn.on('pointerout', () => {
      this.tweens.add({
        targets: toggleBtn,
        scale: 1,
        duration: 150,
      });
    });

    toggleBtn.on('pointerdown', () => {
      console.log('Noise cancellation toggle - will be implemented in later tasks');
    });
  }

  _createVolumeBar(x, y, width, percentage) {
    // Background bar
    const bgBar = this.add.graphics();
    bgBar.fillStyle(C.PANEL, 0.9);
    bgBar.fillRoundedRect(x, y, width, 20, 5);
    bgBar.lineStyle(2, C.GRAY, 0.5);
    bgBar.strokeRoundedRect(x, y, width, 20, 5);

    // Volume fill
    const fillBar = this.add.graphics();
    fillBar.fillStyle(C.GREEN, 0.8);
    fillBar.fillRoundedRect(x + 2, y + 2, (width - 4) * (percentage / 100), 16, 4);

    // Percentage text
    const percentText = this.add.text(x + width + 15, y + 10, `${percentage}%`, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    }).setOrigin(0, 0.5);

    return { bgBar, fillBar, percentText };
  }

  _createGeneralSettings() {
    const sectionY = 510;

    // Section header
    this.add.text(40, sectionY, '📱 General Settings', {
      fontSize: '22px',
      fontFamily: 'Courier New',
      color: TEXT.GREEN,
      fontStyle: 'bold',
    });

    // Settings panel
    const panelY = sectionY + 40;
    const panel = this.add.graphics();
    panel.fillStyle(C.PANEL2, 0.8);
    panel.fillRoundedRect(40, panelY, W - 80, 100, 10);
    panel.lineStyle(2, C.GRAY, 0.3);
    panel.strokeRoundedRect(40, panelY, W - 80, 100, 10);

    // Auto-save transcripts
    this.add.text(60, panelY + 20, 'Auto-save transcripts:', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    });

    const autoSaveToggle = this.add.text(W - 120, panelY + 20, '[✓] Enabled', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.GREEN,
    }).setOrigin(1, 0);

    autoSaveToggle.setInteractive({ useHandCursor: true });

    autoSaveToggle.on('pointerover', () => {
      this.tweens.add({
        targets: autoSaveToggle,
        scale: 1.05,
        duration: 150,
      });
    });

    autoSaveToggle.on('pointerout', () => {
      this.tweens.add({
        targets: autoSaveToggle,
        scale: 1,
        duration: 150,
      });
    });

    autoSaveToggle.on('pointerdown', () => {
      console.log('Auto-save toggle - will be implemented in later tasks');
    });

    // Camera quality
    this.add.text(60, panelY + 50, 'Camera quality:', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    });

    const cameraDropdown = this.add.text(W - 120, panelY + 50, '[High ▼]', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    }).setOrigin(1, 0);

    cameraDropdown.setInteractive({ useHandCursor: true });

    cameraDropdown.on('pointerover', () => {
      cameraDropdown.setColor(TEXT.GREEN);
    });

    cameraDropdown.on('pointerout', () => {
      cameraDropdown.setColor(TEXT.WHITE);
    });

    cameraDropdown.on('pointerdown', () => {
      console.log('Camera quality dropdown - will be implemented in later tasks');
    });

    // Language
    this.add.text(60, panelY + 80, 'Language:', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    });

    const languageDropdown = this.add.text(W - 120, panelY + 80, '[English ▼]', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
    }).setOrigin(1, 0);

    languageDropdown.setInteractive({ useHandCursor: true });

    languageDropdown.on('pointerover', () => {
      languageDropdown.setColor(TEXT.GREEN);
    });

    languageDropdown.on('pointerout', () => {
      languageDropdown.setColor(TEXT.WHITE);
    });

    languageDropdown.on('pointerdown', () => {
      console.log('Language dropdown - will be implemented in later tasks');
    });
  }

  _createActionButtons() {
    const btnY = H - 60;

    // Save Settings button
    const saveBtn = this._createActionButton(W / 2 - 120, btnY, 'Save Settings', TEXT.GREEN);
    
    saveBtn.on('pointerdown', () => {
      this._showMessage('Settings saved successfully!', TEXT.GREEN);
    });

    // Reset to Defaults button
    const resetBtn = this._createActionButton(W / 2 + 120, btnY, 'Reset to Defaults', TEXT.GRAY);
    
    resetBtn.on('pointerdown', () => {
      this._showMessage('Settings reset to defaults', TEXT.ORANGE);
    });
  }

  _createButton(x, y, text) {
    const btn = this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: TEXT.WHITE,
      backgroundColor: C.PANEL,
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5);

    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setColor(TEXT.GREEN);
      btn.setBackgroundColor('#1a1a35');
      this.tweens.add({
        targets: btn,
        scale: 1.05,
        duration: 150,
      });
    });

    btn.on('pointerout', () => {
      btn.setColor(TEXT.WHITE);
      btn.setBackgroundColor('#12122a');
      this.tweens.add({
        targets: btn,
        scale: 1,
        duration: 150,
      });
    });

    return btn;
  }

  _createActionButton(x, y, text, color) {
    const btn = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: color,
      backgroundColor: C.PANEL,
      padding: { x: 20, y: 12 },
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setBackgroundColor('#1a1a35');
      this.tweens.add({
        targets: btn,
        scale: 1.08,
        duration: 150,
      });
    });

    btn.on('pointerout', () => {
      btn.setBackgroundColor('#12122a');
      this.tweens.add({
        targets: btn,
        scale: 1,
        duration: 150,
      });
    });

    return btn;
  }

  _showMessage(text, color) {
    // Create message overlay
    const message = this.add.text(W / 2, H / 2, text, {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: color,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 40, y: 20 },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: 300,
    });

    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: message,
        alpha: 0,
        duration: 300,
        onComplete: () => message.destroy(),
      });
    });
  }
}
