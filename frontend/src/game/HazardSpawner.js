/**
 * HazardSpawner - Creates and animates hazards based on mission data
 */

export class HazardSpawner {
  constructor(scene, mission, floorY) {
    this.scene = scene;
    this.mission = mission;
    this.floorY = floorY;
    this.W = scene.scale.width;
  }

  spawn() {
    const hazardType = (this.mission.hazard_type || 'spill').toLowerCase();
    const x = this.W / 2 + 100;
    
    switch (hazardType) {
      case 'fire':
        return this.spawnFire(x);
      case 'spill':
      case 'chemical':
        return this.spawnSpill(x);
      case 'gas':
        return this.spawnGas(x);
      case 'electric':
      case 'electrical':
        return this.spawnElectrical(x);
      case 'falling':
        return this.spawnFalling(x);
      case 'machinery':
        return this.spawnMachinery(x);
      default:
        return this.spawnSpill(x);
    }
  }

  spawnFire(x) {
    const fire = this.scene.add.sprite(x, this.floorY, 'fire-1').setOrigin(0.5, 1);
    fire.play('fire-burn');
    fire.setScale(1.5);

    // Fire glow
    const glow = this.scene.add.graphics();
    glow.fillStyle(0xff4400, 0.3);
    glow.fillCircle(x, this.floorY - 50, 80);
    
    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.6 },
      scale: { from: 1, to: 1.2 },
      yoyo: true,
      repeat: -1,
      duration: 600,
    });

    // Fire particles
    const particles = this.scene.add.particles(x, this.floorY - 60, 'particle-spark', {
      speed: { min: 30, max: 80 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1200,
      frequency: 100,
      blendMode: 'ADD',
    });

    // Warning label
    const warning = this.scene.add.text(x, this.floorY - 150, 'FIRE HAZARD', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ff4400',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: warning,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    return { sprite: fire, glow, particles, warning };
  }

  spawnSpill(x) {
    const spill = this.scene.add.image(x, this.floorY, 'spill').setOrigin(0.5, 1);
    spill.setScale(1.5);
    spill.setAlpha(0.9);

    // Spill glow
    const glow = this.scene.add.graphics();
    glow.fillStyle(0x00ff88, 0.2);
    glow.fillEllipse(x, this.floorY - 20, 150, 60);

    // Warning label
    const warning = this.scene.add.text(x, this.floorY - 100, '☣️ CHEMICAL SPILL', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#00ff88',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: warning,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    return { sprite: spill, glow, warning };
  }

  spawnGas(x) {
    const gas = this.scene.add.image(x, this.floorY - 60, 'gas-cloud').setOrigin(0.5);
    gas.setScale(2);
    gas.setAlpha(0.7);

    this.scene.tweens.add({
      targets: gas,
      scaleX: { from: 2, to: 2.3 },
      scaleY: { from: 2, to: 2.3 },
      alpha: { from: 0.7, to: 0.4 },
      yoyo: true,
      repeat: -1,
      duration: 2000,
    });

    // Gas particles
    const particles = this.scene.add.particles(x, this.floorY - 60, 'particle-smoke', {
      speed: { min: 10, max: 30 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.8, end: 1.5 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 3000,
      frequency: 200,
    });

    const warning = this.scene.add.text(x, this.floorY - 150, '☁️ TOXIC GAS', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#88ff88',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: warning,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    return { sprite: gas, particles, warning };
  }

  spawnElectrical(x) {
    const spark = this.scene.add.image(x, this.floorY - 80, 'spark').setOrigin(0.5);
    spark.setScale(2);

    this.scene.tweens.add({
      targets: spark,
      alpha: { from: 1, to: 0.3 },
      yoyo: true,
      repeat: -1,
      duration: 200,
    });

    // Electrical particles
    const particles = this.scene.add.particles(x, this.floorY - 80, 'particle-spark', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      frequency: 100,
      blendMode: 'ADD',
    });

    const warning = this.scene.add.text(x, this.floorY - 150, '⚡ ELECTRICAL HAZARD', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffff00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: warning,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 300,
    });

    return { sprite: spark, particles, warning };
  }

  spawnFalling(x) {
    const crate = this.scene.add.image(x, this.floorY - 200, 'crate').setOrigin(0.5);
    crate.setScale(1.2);

    // Falling animation
    this.scene.tweens.add({
      targets: crate,
      y: this.floorY - 150,
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: 'Sine.inOut',
    });

    // Motion lines
    const lines = this.scene.add.graphics();
    lines.lineStyle(3, 0xffcc00, 0.6);
    for (let i = 0; i < 3; i++) {
      lines.lineBetween(x - 30 + i * 30, this.floorY - 250, x - 30 + i * 30, this.floorY - 220);
    }

    const warning = this.scene.add.text(x, this.floorY - 280, '⬇️ FALLING OBJECT', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffcc00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: warning,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    return { sprite: crate, lines, warning };
  }

  spawnMachinery(x) {
    // Rotating gear
    const gear = this.scene.add.graphics();
    gear.fillStyle(0x666666, 1);
    gear.fillCircle(x, this.floorY - 80, 40);
    gear.fillStyle(0x333333, 1);
    gear.fillCircle(x, this.floorY - 80, 20);

    // Gear teeth
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      gear.fillStyle(0x666666, 1);
      gear.fillRect(
        x + Math.cos(angle) * 35 - 8,
        this.floorY - 80 + Math.sin(angle) * 35 - 8,
        16, 16
      );
    }

    this.scene.tweens.add({
      targets: gear,
      angle: 360,
      repeat: -1,
      duration: 2000,
      ease: 'Linear',
    });

    const warning = this.scene.add.text(x, this.floorY - 150, '⚙️ MACHINERY HAZARD', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ff6b35',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: warning,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    return { sprite: gear, warning };
  }
}
