/**
 * AssetGenerator - Creates game sprites and textures procedurally
 * This allows us to have game-quality graphics without external image files
 */

export class AssetGenerator {
  static generateAllAssets(scene) {
    this.generatePlayerSprites(scene);
    this.generateEnvironmentTiles(scene);
    this.generateHazardSprites(scene);
    this.generateToolSprites(scene);
    this.generateUIElements(scene);
    this.generateParticles(scene);
  }

  static generatePlayerSprites(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Worker character - idle
    graphics.clear();
    // Hard hat
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillEllipse(32, 20, 28, 12);
    graphics.fillRect(18, 20, 28, 16);
    // Head
    graphics.fillStyle(0xf0c888, 1);
    graphics.fillCircle(32, 40, 14);
    // Body - hi-vis vest
    graphics.fillStyle(0xff8800, 1);
    graphics.fillRect(20, 50, 24, 28);
    // Reflective stripes
    graphics.fillStyle(0xffff44, 1);
    graphics.fillRect(20, 58, 24, 4);
    graphics.fillRect(20, 68, 24, 4);
    // Arms
    graphics.fillStyle(0xff8800, 1);
    graphics.fillRect(12, 52, 8, 20);
    graphics.fillRect(44, 52, 8, 20);
    // Legs
    graphics.fillStyle(0x1a3a6a, 1);
    graphics.fillRect(22, 78, 8, 18);
    graphics.fillRect(34, 78, 8, 18);
    // Boots
    graphics.fillStyle(0x2a1a08, 1);
    graphics.fillRect(20, 94, 10, 8);
    graphics.fillRect(32, 94, 10, 8);
    
    graphics.generateTexture('player-idle', 64, 110);
    
    // Worker character - walking frame 1
    graphics.clear();
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillEllipse(32, 20, 28, 12);
    graphics.fillRect(18, 20, 28, 16);
    graphics.fillStyle(0xf0c888, 1);
    graphics.fillCircle(32, 40, 14);
    graphics.fillStyle(0xff8800, 1);
    graphics.fillRect(20, 50, 24, 28);
    graphics.fillStyle(0xffff44, 1);
    graphics.fillRect(20, 58, 24, 4);
    graphics.fillRect(20, 68, 24, 4);
    // Arms - one forward, one back
    graphics.fillStyle(0xff8800, 1);
    graphics.fillRect(10, 54, 8, 20);
    graphics.fillRect(46, 50, 8, 20);
    // Legs - walking pose
    graphics.fillStyle(0x1a3a6a, 1);
    graphics.fillRect(20, 78, 8, 18);
    graphics.fillRect(36, 78, 8, 18);
    graphics.fillStyle(0x2a1a08, 1);
    graphics.fillRect(18, 94, 10, 8);
    graphics.fillRect(34, 94, 10, 8);
    
    graphics.generateTexture('player-walk1', 64, 110);
    
    // Worker character - walking frame 2
    graphics.clear();
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillEllipse(32, 20, 28, 12);
    graphics.fillRect(18, 20, 28, 16);
    graphics.fillStyle(0xf0c888, 1);
    graphics.fillCircle(32, 40, 14);
    graphics.fillStyle(0xff8800, 1);
    graphics.fillRect(20, 50, 24, 28);
    graphics.fillStyle(0xffff44, 1);
    graphics.fillRect(20, 58, 24, 4);
    graphics.fillRect(20, 68, 24, 4);
    // Arms - opposite
    graphics.fillStyle(0xff8800, 1);
    graphics.fillRect(14, 50, 8, 20);
    graphics.fillRect(42, 54, 8, 20);
    // Legs - opposite
    graphics.fillStyle(0x1a3a6a, 1);
    graphics.fillRect(24, 78, 8, 18);
    graphics.fillRect(32, 78, 8, 18);
    graphics.fillStyle(0x2a1a08, 1);
    graphics.fillRect(22, 94, 10, 8);
    graphics.fillRect(30, 94, 10, 8);
    
    graphics.generateTexture('player-walk2', 64, 110);
    
    graphics.destroy();
  }

  static generateEnvironmentTiles(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Floor tile
    graphics.clear();
    graphics.fillStyle(0x3a3a3a, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.fillStyle(0x2a2a2a, 1);
    graphics.fillRect(2, 2, 60, 60);
    graphics.lineStyle(1, 0x4a4a4a, 0.5);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('floor-tile', 64, 64);
    
    // Wall tile
    graphics.clear();
    graphics.fillStyle(0x4a4a4a, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.fillStyle(0x3a3a3a, 1);
    for (let i = 0; i < 4; i++) {
      graphics.fillRect(4, i * 16 + 2, 56, 12);
    }
    graphics.lineStyle(1, 0x5a5a5a, 0.5);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('wall-tile', 64, 64);
    
    // Crate/box
    graphics.clear();
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(0, 0, 48, 48);
    graphics.fillStyle(0x6a3410, 1);
    graphics.fillRect(4, 4, 40, 40);
    graphics.lineStyle(2, 0x4a2408, 1);
    graphics.strokeRect(0, 0, 48, 48);
    graphics.lineBetween(0, 24, 48, 24);
    graphics.lineBetween(24, 0, 24, 48);
    graphics.generateTexture('crate', 48, 48);
    
    // Barrel
    graphics.clear();
    graphics.fillStyle(0x666666, 1);
    graphics.fillEllipse(24, 12, 24, 12);
    graphics.fillRect(0, 12, 48, 36);
    graphics.fillEllipse(24, 48, 24, 12);
    graphics.lineStyle(2, 0x444444, 1);
    graphics.strokeEllipse(24, 12, 24, 12);
    graphics.strokeEllipse(24, 48, 24, 12);
    graphics.lineBetween(0, 12, 0, 48);
    graphics.lineBetween(48, 12, 48, 48);
    graphics.fillStyle(0x888888, 1);
    graphics.fillRect(2, 20, 44, 4);
    graphics.fillRect(2, 36, 44, 4);
    graphics.generateTexture('barrel', 48, 60);
    
    // Safety cone
    graphics.clear();
    graphics.fillStyle(0xff6600, 1);
    graphics.fillTriangle(16, 0, 0, 40, 32, 40);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(4, 12, 24, 6);
    graphics.fillRect(6, 24, 20, 6);
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(12, 40, 8, 4);
    graphics.generateTexture('cone', 32, 44);
    
    graphics.destroy();
  }

  static generateHazardSprites(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Fire sprite - frame 1
    graphics.clear();
    graphics.fillStyle(0xff4400, 1);
    graphics.fillTriangle(32, 10, 10, 64, 54, 64);
    graphics.fillStyle(0xff8800, 1);
    graphics.fillTriangle(32, 20, 16, 64, 48, 64);
    graphics.fillStyle(0xffcc00, 1);
    graphics.fillTriangle(32, 30, 22, 64, 42, 64);
    graphics.fillStyle(0xffff44, 1);
    graphics.fillTriangle(32, 40, 26, 64, 38, 64);
    graphics.generateTexture('fire-1', 64, 64);
    
    // Fire sprite - frame 2
    graphics.clear();
    graphics.fillStyle(0xff4400, 1);
    graphics.fillTriangle(32, 8, 8, 64, 56, 64);
    graphics.fillStyle(0xff8800, 1);
    graphics.fillTriangle(32, 18, 14, 64, 50, 64);
    graphics.fillStyle(0xffcc00, 1);
    graphics.fillTriangle(32, 28, 20, 64, 44, 64);
    graphics.fillStyle(0xffff44, 1);
    graphics.fillTriangle(32, 38, 24, 64, 40, 64);
    graphics.generateTexture('fire-2', 64, 64);
    
    // Spill/puddle
    graphics.clear();
    graphics.fillStyle(0x00ff88, 0.6);
    graphics.fillEllipse(48, 32, 96, 48);
    graphics.fillStyle(0x00ff88, 0.4);
    graphics.fillEllipse(40, 28, 80, 40);
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillEllipse(30, 24, 40, 20);
    graphics.generateTexture('spill', 96, 64);
    
    // Electrical spark
    graphics.clear();
    graphics.lineStyle(4, 0xffff00, 1);
    graphics.lineBetween(16, 0, 8, 24);
    graphics.lineBetween(8, 24, 20, 24);
    graphics.lineBetween(20, 24, 12, 48);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(16, 0, 6);
    graphics.fillCircle(12, 48, 6);
    graphics.generateTexture('spark', 32, 48);
    
    // Gas cloud
    graphics.clear();
    graphics.fillStyle(0x88ff88, 0.3);
    graphics.fillCircle(32, 32, 30);
    graphics.fillCircle(20, 28, 24);
    graphics.fillCircle(44, 28, 24);
    graphics.fillCircle(32, 20, 20);
    graphics.generateTexture('gas-cloud', 64, 64);
    
    graphics.destroy();
  }

  static generateToolSprites(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Fire Extinguisher
    graphics.clear();
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(12, 8, 24, 48);
    graphics.fillEllipse(24, 8, 24, 12);
    graphics.fillEllipse(24, 56, 24, 12);
    graphics.fillStyle(0xcc0000, 1);
    graphics.fillRect(14, 12, 20, 40);
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(20, 0, 8, 10);
    graphics.fillRect(18, 10, 12, 4);
    graphics.fillStyle(0xffff00, 1);
    graphics.fillRect(16, 24, 16, 8);
    graphics.lineStyle(2, 0x880000, 1);
    graphics.strokeRect(12, 8, 24, 48);
    graphics.generateTexture('tool-extinguisher', 48, 64);
    
    // Cleanup Kit (mop and bucket)
    graphics.clear();
    // Bucket
    graphics.fillStyle(0x4444aa, 1);
    graphics.fillRect(8, 32, 32, 24);
    graphics.fillEllipse(24, 32, 32, 12);
    graphics.fillEllipse(24, 56, 32, 12);
    graphics.lineStyle(2, 0x3333aa, 1);
    graphics.strokeRect(8, 32, 32, 24);
    // Mop handle
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(36, 0, 4, 48);
    // Mop head
    graphics.fillStyle(0xcccccc, 1);
    graphics.fillRect(30, 48, 16, 12);
    graphics.generateTexture('tool-cleanup', 48, 64);
    
    // Circuit Breaker Switch
    graphics.clear();
    graphics.fillStyle(0x2a2a2a, 1);
    graphics.fillRect(4, 4, 40, 56);
    graphics.lineStyle(3, 0xffff00, 1);
    graphics.strokeRect(4, 4, 40, 56);
    graphics.fillStyle(0x444444, 1);
    graphics.fillRect(12, 12, 24, 36);
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(24, 20, 4);
    graphics.fillStyle(0x666666, 1);
    graphics.fillRect(18, 28, 12, 16);
    graphics.fillStyle(0xffff00, 1);
    graphics.fillRect(10, 50, 28, 6);
    graphics.generateTexture('tool-breaker', 48, 64);
    
    // Ventilation Control (fan)
    graphics.clear();
    graphics.fillStyle(0x666666, 1);
    graphics.fillCircle(24, 32, 22);
    graphics.fillStyle(0x444444, 1);
    graphics.fillCircle(24, 32, 18);
    graphics.fillStyle(0x888888, 1);
    // Fan blades
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x1 = 24 + Math.cos(angle) * 6;
      const y1 = 32 + Math.sin(angle) * 6;
      const x2 = 24 + Math.cos(angle) * 16;
      const y2 = 32 + Math.sin(angle) * 16;
      graphics.fillTriangle(24, 32, x1 - 4, y1 - 4, x2, y2);
      graphics.fillTriangle(24, 32, x1 + 4, y1 + 4, x2, y2);
    }
    graphics.fillStyle(0x333333, 1);
    graphics.fillCircle(24, 32, 6);
    graphics.lineStyle(2, 0x4ecdc4, 1);
    graphics.strokeCircle(24, 32, 22);
    graphics.generateTexture('tool-ventilation', 48, 64);
    
    // Generic Safety Tool (wrench)
    graphics.clear();
    graphics.fillStyle(0x888888, 1);
    graphics.fillRect(16, 8, 8, 40);
    graphics.fillRect(12, 44, 16, 12);
    graphics.fillStyle(0x666666, 1);
    graphics.fillRect(18, 12, 4, 36);
    graphics.fillStyle(0xaaaaaa, 1);
    graphics.fillCircle(20, 10, 6);
    graphics.generateTexture('tool-generic', 48, 64);
    
    graphics.destroy();
  }

  static generateUIElements(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Button background
    graphics.clear();
    graphics.fillStyle(0x39ff14, 0.2);
    graphics.fillRoundedRect(0, 0, 200, 60, 12);
    graphics.lineStyle(3, 0x39ff14, 1);
    graphics.strokeRoundedRect(0, 0, 200, 60, 12);
    graphics.generateTexture('ui-button', 200, 60);
    
    // Panel background
    graphics.clear();
    graphics.fillStyle(0x1a1a2e, 0.95);
    graphics.fillRoundedRect(0, 0, 400, 200, 15);
    graphics.lineStyle(3, 0x39ff14, 0.6);
    graphics.strokeRoundedRect(0, 0, 400, 200, 15);
    graphics.generateTexture('ui-panel', 400, 200);
    
    // Health bar background
    graphics.clear();
    graphics.fillStyle(0x222233, 1);
    graphics.fillRoundedRect(0, 0, 200, 20, 10);
    graphics.generateTexture('health-bg', 200, 20);
    
    // Health bar fill
    graphics.clear();
    graphics.fillStyle(0x39ff14, 1);
    graphics.fillRoundedRect(0, 0, 200, 20, 10);
    graphics.generateTexture('health-fill', 200, 20);
    
    graphics.destroy();
  }

  static generateParticles(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Glow particle
    graphics.clear();
    graphics.fillStyle(0x39ff14, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.fillStyle(0x39ff14, 0.5);
    graphics.fillCircle(8, 8, 12);
    graphics.generateTexture('particle-glow', 16, 16);
    
    // Spark particle
    graphics.clear();
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 2);
    graphics.generateTexture('particle-spark', 8, 8);
    
    // Smoke particle
    graphics.clear();
    graphics.fillStyle(0x888888, 0.6);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('particle-smoke', 16, 16);
    
    graphics.destroy();
  }

  static createAnimations(scene) {
    // Player walk animation
    if (!scene.anims.exists('player-walk')) {
      scene.anims.create({
        key: 'player-walk',
        frames: [
          { key: 'player-walk1' },
          { key: 'player-idle' },
          { key: 'player-walk2' },
          { key: 'player-idle' },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }

    // Fire animation
    if (!scene.anims.exists('fire-burn')) {
      scene.anims.create({
        key: 'fire-burn',
        frames: [
          { key: 'fire-1' },
          { key: 'fire-2' },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }
  }
}
