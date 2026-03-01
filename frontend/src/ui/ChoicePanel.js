/**
 * ChoicePanel - Game-style choice selection UI
 */

export class ChoicePanel {
  constructor(scene, mission, onChoiceSelected) {
    this.scene = scene;
    this.mission = mission;
    this.onChoiceSelected = onChoiceSelected;
    this.W = scene.scale.width;
    this.H = scene.scale.height;
    this.container = scene.add.container(0, 0).setDepth(900);
    this.locked = false;
    
    this.create();
  }

  create() {
    // Semi-transparent overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, this.H - 280, this.W, 280);
    this.container.add(overlay);

    // Top border glow
    const glow = this.scene.add.graphics();
    glow.lineStyle(3, 0x39ff14, 0.8);
    glow.lineBetween(0, this.H - 280, this.W, this.H - 280);
    this.container.add(glow);

    // Scenario panel
    this.createScenarioPanel();

    // Question
    this.createQuestion();

    // Choice buttons
    this.createChoiceButtons();

    // Mic button
    this.createMicButton();

    // Keyboard hint
    this.createKeyboardHint();
  }

  createScenarioPanel() {
    const panelY = this.H - 270;
    
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(20, panelY, this.W / 2 - 40, 100, 8);
    panel.lineStyle(2, 0xff6b35, 0.6);
    panel.strokeRoundedRect(20, panelY, this.W / 2 - 40, 100, 8);
    this.container.add(panel);

    const header = this.scene.add.text(30, panelY + 10, 'SITUATION', {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#ff6b35',
      fontStyle: 'bold',
    });
    this.container.add(header);

    const scenario = this.scene.add.text(30, panelY + 30, this.mission.scenario || '', {
      fontSize: '11px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      wordWrap: { width: this.W / 2 - 70 },
      lineSpacing: 3,
    });
    this.container.add(scenario);
  }

  createQuestion() {
    const questionY = this.H - 160;
    
    const question = this.scene.add.text(20, questionY, `❓ ${this.mission.question || 'What do you do?'}`, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ffcc00',
      fontStyle: 'bold',
      wordWrap: { width: this.W / 2 - 40 },
    });
    this.container.add(question);

    // Pulsing effect
    this.scene.tweens.add({
      targets: question,
      alpha: { from: 0.8, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 1000,
    });
  }

  createChoiceButtons() {
    const choices = this.mission.choices || [];
    const startX = this.W / 2 + 20;
    const startY = this.H - 260;
    const buttonHeight = 50;
    const gap = 10;

    this.choiceButtons = [];

    choices.forEach((choice, i) => {
      const y = startY + i * (buttonHeight + gap);
      const button = this.createButton(startX, y, choice, i);
      this.choiceButtons.push(button);
    });
  }

  createButton(x, y, text, index) {
    const buttonWidth = this.W / 2 - 100;
    const buttonHeight = 50;
    const label = ['A', 'B', 'C', 'D'][index];

    // Button background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(x, y, buttonWidth, buttonHeight, 8);
    bg.lineStyle(2, 0x39ff14, 0.6);
    bg.strokeRoundedRect(x, y, buttonWidth, buttonHeight, 8);
    this.container.add(bg);

    // Label badge
    const labelBg = this.scene.add.graphics();
    labelBg.fillStyle(0x39ff14, 1);
    labelBg.fillCircle(x + 25, y + buttonHeight / 2, 18);
    this.container.add(labelBg);

    const labelText = this.scene.add.text(x + 25, y + buttonHeight / 2, label, {
      fontSize: '18px',
      fontFamily: 'Impact, Courier New',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(labelText);

    // Choice text
    const choiceText = this.scene.add.text(x + 50, y + buttonHeight / 2, text, {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      wordWrap: { width: buttonWidth - 70 },
    }).setOrigin(0, 0.5);
    this.container.add(choiceText);

    // Interactive area
    const hitArea = this.scene.add.rectangle(
      x + buttonWidth / 2,
      y + buttonHeight / 2,
      buttonWidth,
      buttonHeight
    ).setInteractive({ useHandCursor: true });
    this.container.add(hitArea);

    // Hover effects
    hitArea.on('pointerover', () => {
      if (this.locked) return;
      bg.clear();
      bg.fillStyle(0x2a2a3e, 0.95);
      bg.fillRoundedRect(x, y, buttonWidth, buttonHeight, 8);
      bg.lineStyle(3, 0x39ff14, 1);
      bg.strokeRoundedRect(x, y, buttonWidth, buttonHeight, 8);
      
      labelBg.clear();
      labelBg.fillStyle(0x44ff22, 1);
      labelBg.fillCircle(x + 25, y + buttonHeight / 2, 20);
    });

    hitArea.on('pointerout', () => {
      if (this.locked) return;
      bg.clear();
      bg.fillStyle(0x1a1a2e, 0.95);
      bg.fillRoundedRect(x, y, buttonWidth, buttonHeight, 8);
      bg.lineStyle(2, 0x39ff14, 0.6);
      bg.strokeRoundedRect(x, y, buttonWidth, buttonHeight, 8);
      
      labelBg.clear();
      labelBg.fillStyle(0x39ff14, 1);
      labelBg.fillCircle(x + 25, y + buttonHeight / 2, 18);
    });

    hitArea.on('pointerdown', () => {
      if (this.locked) return;
      this.selectChoice(text);
      
      // Flash effect
      const flash = this.scene.add.graphics();
      flash.fillStyle(0x39ff14, 0.5);
      flash.fillRoundedRect(x, y, buttonWidth, buttonHeight, 8);
      this.container.add(flash);
      
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 300,
        onComplete: () => flash.destroy(),
      });
    });

    return { bg, labelBg, labelText, choiceText, hitArea };
  }

  createMicButton() {
    const x = this.W - 60;
    const y = this.H - 60;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0xff4444, 0.3);
    bg.fillCircle(x, y, 30);
    bg.lineStyle(3, 0xff4444, 0.8);
    bg.strokeCircle(x, y, 30);
    this.container.add(bg);

    const icon = this.scene.add.text(x, y, '[MIC]', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(icon);

    const hitArea = this.scene.add.circle(x, y, 30).setInteractive({ useHandCursor: true });
    this.container.add(hitArea);

    // Pulse animation
    this.scene.tweens.add({
      targets: bg,
      scale: { from: 1, to: 1.1 },
      alpha: { from: 0.3, to: 0.5 },
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    // TODO: Add voice recording functionality
    hitArea.on('pointerdown', () => {
      console.log('Voice recording started');
    });
  }

  createKeyboardHint() {
    const hint = this.scene.add.text(this.W / 2, this.H - 15, 'Press A, B, C, or D  |  Click to select  |  Hold [MIC] to speak', {
      fontSize: '10px',
      fontFamily: 'Courier New',
      color: '#666677',
    }).setOrigin(0.5);
    this.container.add(hint);

    this.scene.tweens.add({
      targets: hint,
      alpha: { from: 0.5, to: 0.8 },
      yoyo: true,
      repeat: -1,
      duration: 1500,
    });
  }

  selectChoice(choice) {
    if (this.locked) return;
    this.locked = true;
    
    // Disable all buttons
    this.choiceButtons.forEach(btn => {
      btn.hitArea.disableInteractive();
    });

    // Call callback
    if (this.onChoiceSelected) {
      this.onChoiceSelected(choice);
    }
  }

  destroy() {
    this.container.destroy();
  }
}
