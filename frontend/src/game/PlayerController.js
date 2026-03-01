/**
 * PlayerController - Handles player movement and interactions
 */

export class PlayerController {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, 'player-idle').setOrigin(0.5, 1);
    this.sprite.setScale(1.2);
    this.sprite.play('player-walk');
    
    this.speed = 200;
    this.isMoving = false;
    this.targetX = x;
    
    // Add physics if needed
    if (scene.physics) {
      scene.physics.add.existing(this.sprite);
    }

    // Role badge
    this.createRoleBadge();
  }

  createRoleBadge() {
    const role = this.scene.mission?.player_role || 'Worker';
    
    this.badge = this.scene.add.container(this.sprite.x, this.sprite.y - 120);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-60, -15, 120, 30, 5);
    bg.lineStyle(2, 0x4ecdc4, 0.8);
    bg.strokeRoundedRect(-60, -15, 120, 30, 5);
    
    const text = this.scene.add.text(0, 0, `${role}`, {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#4ecdc4',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.badge.add([bg, text]);
    this.badge.setDepth(100);
  }

  update() {
    // Update badge position
    if (this.badge) {
      this.badge.x = this.sprite.x;
      this.badge.y = this.sprite.y - 120;
    }

    // Auto-walk animation
    if (!this.isMoving) {
      this.sprite.play('player-walk', true);
    }
  }

  moveTo(x) {
    this.targetX = x;
    this.isMoving = true;

    const distance = Math.abs(x - this.sprite.x);
    const duration = (distance / this.speed) * 1000;

    // Flip sprite based on direction
    if (x < this.sprite.x) {
      this.sprite.setFlipX(true);
    } else {
      this.sprite.setFlipX(false);
    }

    this.scene.tweens.add({
      targets: this.sprite,
      x: x,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      },
    });
  }

  playAction(action) {
    // Play action animation (e.g., "inspect", "fix", "evacuate")
    const originalY = this.sprite.y;
    
    // Jump action
    this.scene.tweens.add({
      targets: this.sprite,
      y: originalY - 30,
      duration: 200,
      yoyo: true,
      ease: 'Quad.out',
    });

    // Show action text
    const actionText = this.scene.add.text(this.sprite.x, this.sprite.y - 150, action.toUpperCase(), {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#39ff14',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: actionText,
      y: actionText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => actionText.destroy(),
    });
  }

  destroy() {
    if (this.badge) this.badge.destroy();
    if (this.sprite) this.sprite.destroy();
  }
}
