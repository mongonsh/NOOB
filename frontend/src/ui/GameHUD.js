/**
 * GameHUD - Professional game HUD with health, objectives, timer, etc.
 */

export class GameHUD {
  constructor(scene, mission) {
    this.scene = scene;
    this.mission = mission;
    this.container = scene.add.container(0, 0).setDepth(1000);
    this.createHUD();
  }

  createHUD() {
    this.createTopBar();
    this.createObjectivePanel();
    this.createHealthBar();
    this.createMissionInfo();
  }

  createTopBar() {
    const W = this.scene.scale.width;
    
    // Top bar background
    const bar = this.scene.add.graphics();
    bar.fillStyle(0x000000, 0.8);
    bar.fillRect(0, 0, W, 60);
    bar.lineStyle(2, 0x39ff14, 0.6);
    bar.lineBetween(0, 60, W, 60);
    this.container.add(bar);

    // Mission number
    const missionText = this.scene.add.text(20, 15, `MISSION ${this.mission.level || 1}`, {
      fontSize: '16px',
      fontFamily: 'Impact, Courier New',
      color: '#39ff14',
      fontStyle: 'bold',
    });
    this.container.add(missionText);

    // Mission title
    const titleText = this.scene.add.text(20, 35, this.mission.title || 'Safety Training', {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#ffffff',
    });
    this.container.add(titleText);

    // Risk level indicator
    const riskColor = this.getRiskColor(this.mission.risk_level);
    const riskBg = this.scene.add.graphics();
    riskBg.fillStyle(riskColor, 0.3);
    riskBg.fillRoundedRect(W - 150, 15, 130, 30, 5);
    riskBg.lineStyle(2, riskColor, 1);
    riskBg.strokeRoundedRect(W - 150, 15, 130, 30, 5);
    this.container.add(riskBg);

    const riskText = this.scene.add.text(W - 85, 30, `${this.mission.risk_level || 'MEDIUM'} RISK`, {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: `#${riskColor.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(riskText);
  }

  createObjectivePanel() {
    const W = this.scene.scale.width;
    
    // Objective panel (top right)
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x000000, 0.85);
    panel.fillRoundedRect(W - 320, 80, 300, 120, 8);
    panel.lineStyle(2, 0xff6b35, 0.8);
    panel.strokeRoundedRect(W - 320, 80, 300, 120, 8);
    this.container.add(panel);

    // Objective header
    const objHeader = this.scene.add.text(W - 310, 90, 'OBJECTIVE', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ff6b35',
      fontStyle: 'bold',
    });
    this.container.add(objHeader);

    // Objective text
    this.objectiveText = this.scene.add.text(W - 310, 115, 'Assess the situation\nIdentify hazards\nTake correct action', {
      fontSize: '11px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      lineSpacing: 5,
    });
    this.container.add(this.objectiveText);
  }

  createHealthBar() {
    // Health/Safety bar (top left under mission info)
    const healthBg = this.scene.add.graphics();
    healthBg.fillStyle(0x222233, 1);
    healthBg.fillRoundedRect(20, 70, 200, 20, 10);
    this.container.add(healthBg);

    this.healthBar = this.scene.add.graphics();
    this.updateHealth(100);
    this.container.add(this.healthBar);

    const healthText = this.scene.add.text(120, 80, 'SAFETY LEVEL', {
      fontSize: '10px',
      fontFamily: 'Courier New',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.container.add(healthText);
  }

  createMissionInfo() {
    const W = this.scene.scale.width;
    
    // Player role badge
    const roleBg = this.scene.add.graphics();
    roleBg.fillStyle(0x4ecdc4, 0.3);
    roleBg.fillRoundedRect(20, 100, 200, 30, 5);
    roleBg.lineStyle(2, 0x4ecdc4, 0.8);
    roleBg.strokeRoundedRect(20, 100, 200, 30, 5);
    this.container.add(roleBg);

    const roleText = this.scene.add.text(120, 115, `${this.mission.player_role || 'Worker'}`, {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#4ecdc4',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(roleText);
  }

  updateHealth(percent) {
    if (this.healthBar) {
      this.healthBar.clear();
      const color = percent > 60 ? 0x39ff14 : percent > 30 ? 0xffcc00 : 0xff4444;
      this.healthBar.fillStyle(color, 1);
      this.healthBar.fillRoundedRect(20, 70, (200 * percent) / 100, 20, 10);
    }
  }

  updateObjective(text) {
    if (this.objectiveText) {
      this.objectiveText.setText(text);
    }
  }

  getRiskColor(level) {
    switch (level) {
      case 'HIGH': return 0xff4444;
      case 'MEDIUM': return 0xff6b35;
      case 'LOW': return 0x39ff14;
      default: return 0xffcc00;
    }
  }

  destroy() {
    this.container.destroy();
  }
}
