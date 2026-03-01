/**
 * EnvironmentBuilder - Dynamically creates game environments based on mission data
 */

export class EnvironmentBuilder {
  constructor(scene, mission) {
    this.scene = scene;
    this.mission = mission;
    this.W = scene.scale.width;
    this.H = scene.scale.height;
  }

  build() {
    const envType = (this.mission.environment_type || 'warehouse').toLowerCase();
    
    // Build environment based on type
    switch (envType) {
      case 'warehouse':
        return this.buildWarehouse();
      case 'construction':
        return this.buildConstruction();
      case 'lab':
      case 'laboratory':
        return this.buildLab();
      case 'electrical':
        return this.buildElectrical();
      case 'chemical':
        return this.buildChemical();
      case 'office':
        return this.buildOffice();
      default:
        return this.buildWarehouse();
    }
  }

  buildWarehouse() {
    const floorY = this.H - 200;
    
    // Floor
    for (let x = 0; x < this.W; x += 64) {
      this.scene.add.image(x, floorY, 'floor-tile').setOrigin(0, 0).setAlpha(0.8);
    }

    // Shelving units (right side)
    for (let i = 0; i < 3; i++) {
      const x = this.W - 300 + i * 80;
      this.scene.add.image(x, floorY - 100, 'wall-tile').setOrigin(0.5, 1).setScale(0.8, 1.5);
    }

    // Crates and boxes
    const crate1 = this.scene.add.image(200, floorY, 'crate').setOrigin(0.5, 1);
    const crate2 = this.scene.add.image(280, floorY, 'crate').setOrigin(0.5, 1);
    const crate3 = this.scene.add.image(240, floorY - 48, 'crate').setOrigin(0.5, 1).setScale(0.9);

    // Barrels
    this.scene.add.image(this.W - 150, floorY, 'barrel').setOrigin(0.5, 1);

    // Forklift (simple representation)
    const forklift = this.scene.add.graphics();
    forklift.fillStyle(0xff8800, 1);
    forklift.fillRect(100, floorY - 80, 60, 60);
    forklift.fillStyle(0x666666, 1);
    forklift.fillRect(120, floorY - 120, 20, 40);

    return { floorY, playerStartX: 400, playerStartY: floorY };
  }

  buildConstruction() {
    const floorY = this.H - 180;
    
    // Ground
    const ground = this.scene.add.graphics();
    ground.fillStyle(0x9b7a3d, 1);
    ground.fillRect(0, floorY, this.W, this.H - floorY);

    // Scaffolding
    const scaff = this.scene.add.graphics();
    scaff.lineStyle(6, 0x999999, 1);
    for (let x = this.W - 400; x < this.W - 100; x += 100) {
      scaff.lineBetween(x, floorY - 200, x, floorY);
      scaff.lineBetween(x, floorY - 200, x + 80, floorY - 200);
      scaff.lineBetween(x, floorY - 100, x + 80, floorY - 100);
    }

    // Safety cones
    for (let i = 0; i < 5; i++) {
      this.scene.add.image(300 + i * 60, floorY, 'cone').setOrigin(0.5, 1);
    }

    // Concrete barriers
    for (let i = 0; i < 3; i++) {
      const barrier = this.scene.add.graphics();
      barrier.fillStyle(0x888888, 1);
      barrier.fillRect(this.W - 350 + i * 100, floorY - 40, 80, 40);
    }

    return { floorY, playerStartX: 200, playerStartY: floorY };
  }

  buildLab() {
    const floorY = this.H - 180;
    
    // Clean floor
    const floor = this.scene.add.graphics();
    floor.fillStyle(0xe8ece8, 1);
    floor.fillRect(0, floorY, this.W, this.H - floorY);
    
    // Tile lines
    floor.lineStyle(1, 0xcccccc, 0.5);
    for (let x = 0; x < this.W; x += 64) {
      floor.lineBetween(x, floorY, x, this.H);
    }

    // Lab benches
    for (let i = 0; i < 2; i++) {
      const bench = this.scene.add.graphics();
      bench.fillStyle(0xb8b8b8, 1);
      bench.fillRect(this.W - 400 + i * 200, floorY - 80, 150, 80);
      
      // Equipment on bench
      const beaker = this.scene.add.graphics();
      beaker.fillStyle(0x7799cc, 0.8);
      beaker.fillCircle(this.W - 350 + i * 200, floorY - 60, 15);
    }

    // Biohazard sign
    this.scene.add.text(200, floorY - 100, '☣', {
      fontSize: '48px',
      color: '#ffcc00',
    }).setOrigin(0.5);

    return { floorY, playerStartX: 300, playerStartY: floorY };
  }

  buildElectrical() {
    const floorY = this.H - 180;
    
    // Dark floor
    const floor = this.scene.add.graphics();
    floor.fillStyle(0x161616, 1);
    floor.fillRect(0, floorY, this.W, this.H - floorY);

    // Electrical panels
    for (let i = 0; i < 2; i++) {
      const panel = this.scene.add.graphics();
      panel.fillStyle(0x2a2a2a, 1);
      panel.fillRect(this.W - 300 + i * 150, floorY - 200, 120, 180);
      panel.lineStyle(3, 0xffff00, 0.8);
      panel.strokeRect(this.W - 300 + i * 150, floorY - 200, 120, 180);
      
      // Warning label
      this.scene.add.text(this.W - 240 + i * 150, floorY - 180, '⚡ HIGH\nVOLTAGE', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#ffff00',
        align: 'center',
      }).setOrigin(0.5, 0);
    }

    // Conduit pipes
    const pipes = this.scene.add.graphics();
    pipes.fillStyle(0x444444, 1);
    pipes.fillRect(0, floorY - 250, this.W - 350, 20);

    return { floorY, playerStartX: 250, playerStartY: floorY };
  }

  buildChemical() {
    const floorY = this.H - 180;
    
    // Floor with containment
    const floor = this.scene.add.graphics();
    floor.fillStyle(0x0f170f, 1);
    floor.fillRect(0, floorY, this.W, this.H - floorY);
    
    // Containment berm
    floor.lineStyle(4, 0x00ff88, 0.6);
    floor.strokeRect(50, floorY, this.W - 100, this.H - floorY - 20);

    // Chemical drums
    for (let i = 0; i < 4; i++) {
      const drum = this.scene.add.graphics();
      drum.fillStyle(0x226622, 1);
      drum.fillEllipse(this.W - 400 + i * 90, floorY - 30, 40, 20);
      drum.fillRect(this.W - 420 + i * 90, floorY - 90, 40, 60);
      
      // Hazard label
      drum.fillStyle(0xffaa00, 1);
      drum.fillRect(this.W - 415 + i * 90, floorY - 80, 30, 40);
    }

    return { floorY, playerStartX: 200, playerStartY: floorY };
  }

  buildOffice() {
    const floorY = this.H - 180;
    
    // Carpet
    const floor = this.scene.add.graphics();
    floor.fillStyle(0x3a2e24, 1);
    floor.fillRect(0, floorY, this.W, this.H - floorY);

    // Desks
    for (let i = 0; i < 3; i++) {
      const desk = this.scene.add.graphics();
      desk.fillStyle(0x5c4a38, 1);
      desk.fillRect(this.W - 500 + i * 150, floorY - 70, 120, 70);
      
      // Monitor
      desk.fillStyle(0x181828, 1);
      desk.fillRect(this.W - 470 + i * 150, floorY - 130, 60, 50);
    }

    // Filing cabinets
    for (let i = 0; i < 2; i++) {
      const cabinet = this.scene.add.graphics();
      cabinet.fillStyle(0x666666, 1);
      cabinet.fillRect(150 + i * 80, floorY - 100, 60, 100);
    }

    return { floorY, playerStartX: 300, playerStartY: floorY };
  }
}
