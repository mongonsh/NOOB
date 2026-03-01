/**
 * ActionGameScene - Real action-based safety training game
 * Player moves, interacts with objects, completes tasks through actions
 * NOT a quiz - actual gameplay!
 */

import { C, W, H, TEXT } from '../config/constants.js';
import { state } from '../managers/StateManager.js';
import { APIManager } from '../managers/APIManager.js';
import { VoiceManager } from '../managers/VoiceManager.js';
import { soundManager } from '../managers/SoundManager.js';
import { InventorySystem } from '../game/InventorySystem.js';
import { AssetLoader } from '../managers/AssetLoader.js';

const FLOOR_Y = 520;

export class ActionGameScene extends Phaser.Scene {
  constructor() {
    super('ActionGameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(C.BG);
    this.cameras.main.fadeIn(500);

    const mission = state.currentMission;
    if (!mission) {
      this.scene.start('ResultScene');
      return;
    }

    this.mission = mission;
    this.taskCompleted = false;
    this.interactables = [];
    this.sceneBuilt = false; // Reset scene built flag for scene restart

    // Initialize sound
    soundManager.init();

    // Try to load custom Gemini-generated assets
    if (mission.custom_assets) {
      console.log('[ActionGameScene] Loading custom Gemini assets via AssetLoader...');

      // Set a timeout fallback in case loading hangs
      const loadTimeout = setTimeout(() => {
        console.warn('[ActionGameScene] Asset loading timeout, using procedural graphics');
        if (!this.sceneBuilt) {
          this.buildSceneContent();
        }
      }, 3000); // 3 second timeout

      AssetLoader.loadCustomAssets(this, mission)
        .then(() => {
          clearTimeout(loadTimeout);
          console.log('[ActionGameScene] Custom assets loaded successfully');
          if (!this.sceneBuilt) {
            this.buildSceneContent();
          }
        })
        .catch((error) => {
          clearTimeout(loadTimeout);
          console.error('[ActionGameScene] Failed to load custom assets:', error);
          console.log('[ActionGameScene] Falling back to procedural graphics');
          if (!this.sceneBuilt) {
            this.buildSceneContent();
          }
        });
    } else {
      console.log('[ActionGameScene] No custom assets, using procedural graphics');
      this.buildSceneContent();
    }
  }

  buildSceneContent() {
    // Prevent building scene multiple times
    if (this.sceneBuilt) {
      console.log('[ActionGameScene] Scene already built, skipping');
      return;
    }
    this.sceneBuilt = true;

    // Build environment
    this.buildEnvironment();

    // Create player
    this.createPlayer();

    // Create inventory
    this.inventory = new InventorySystem(this);

    // Spawn objects based on mission
    this.spawnMissionObjects();

    // Create HUD
    this.createHUD();

    // Setup controls
    this.setupControls();

    // Start footstep timer
    this.footstepTimer = 0;
  }

  buildEnvironment() {
    const envType = (this.mission.environment_type || 'warehouse').toLowerCase();

    // Check if custom environment background is available
    const customEnvTexture = AssetLoader.getEnvironmentTexture(this, this.mission);

    if (customEnvTexture) {
      // Use custom Gemini-generated background
      const bg = this.add.image(W / 2, FLOOR_Y / 2, customEnvTexture);
      bg.setDisplaySize(W, FLOOR_Y);
      console.log('[ActionGameScene] Using custom environment background');
    } else {
      // Use procedural graphics
      // Sky/background
      const bg = this.add.graphics();
      bg.fillStyle(0x2a3a4a, 1);
      bg.fillRect(0, 0, W, FLOOR_Y);

      // Floor
      const floor = this.add.graphics();
      floor.fillStyle(0x3a3a3a, 1);
      floor.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

      // Floor line
      floor.lineStyle(2, 0x4a4a5a, 1);
      floor.lineBetween(0, FLOOR_Y, W, FLOOR_Y);

      // Environment-specific decorations
      this.addEnvironmentProps(envType);
    }
  }

  addEnvironmentProps(envType) {
    const props = this.add.graphics();

    switch (envType) {
      case 'warehouse':
        // Shelves
        props.fillStyle(0x4a4a4a, 1);
        props.fillRect(W - 200, FLOOR_Y - 150, 150, 150);
        props.fillRect(100, FLOOR_Y - 100, 100, 100);
        break;

      case 'construction':
        // Scaffolding
        props.lineStyle(6, 0x888888, 1);
        props.lineBetween(W - 150, FLOOR_Y - 200, W - 150, FLOOR_Y);
        props.lineBetween(W - 150, FLOOR_Y - 200, W - 50, FLOOR_Y - 200);
        break;

      case 'lab':
        // Lab bench
        props.fillStyle(0xb8b8b8, 1);
        props.fillRect(W - 300, FLOOR_Y - 80, 250, 80);
        break;

      case 'electrical':
        // Electrical panel
        props.fillStyle(0x2a2a2a, 1);
        props.fillRect(W - 200, FLOOR_Y - 200, 150, 180);
        props.lineStyle(3, 0xffff00, 0.8);
        props.strokeRect(W - 200, FLOOR_Y - 200, 150, 180);
        break;
    }
  }

  createPlayer() {
    this.player = {
      x: 200,
      y: FLOOR_Y,
      speed: 200,
      isMoving: false,
      direction: 1, // 1 = right, -1 = left
    };

    // Check if custom player sprite is available
    const customPlayerTexture = AssetLoader.getPlayerTexture(this, this.mission);
    let useCustomSprite = false;

    if (this.textures.exists(customPlayerTexture) && customPlayerTexture.startsWith('custom-')) {
      // Get texture to check size
      const texture = this.textures.get(customPlayerTexture);
      const source = texture.getSourceImage();

      // If image is too small (corrupted/extracted wrong), use procedural instead
      if (source.width >= 20 && source.height >= 20) {
        useCustomSprite = true;

        // Check if animations exist (sprite sheet) or use static image (single frame)
        if (this.anims.exists('custom-player-idle')) {
          // Use custom Gemini-generated sprite with animations (sprite sheet)
          this.playerSprite = this.add.sprite(this.player.x, this.player.y, customPlayerTexture);
          this.playerSprite.setOrigin(0.5, 1);

          // Scale based on frame size (usually 128x128)
          const frameWidth = this.textures.get(customPlayerTexture).get(0).width;
          if (frameWidth > 200) {
            this.playerSprite.setScale(0.4);
          } else if (frameWidth > 100) {
            this.playerSprite.setScale(0.8);
          } else {
            this.playerSprite.setScale(2.5);
          }

          this.playerSprite.play('custom-player-idle');
          this.playerHasAnimations = true;
          console.log(`[ActionGameScene] Using custom animated player sprite (frame width: ${frameWidth})`);
        } else {
          // Use custom Gemini-generated sprite without animations (single frame)
          this.playerSprite = this.add.image(this.player.x, this.player.y, customPlayerTexture);
          this.playerSprite.setOrigin(0.5, 1);

          // Scale based on size
          if (source.width > 512) {
            this.playerSprite.setScale(0.15);
          } else if (source.width > 200) {
            this.playerSprite.setScale(0.4);
          } else if (source.width > 100) {
            this.playerSprite.setScale(0.8);
          } else {
            this.playerSprite.setScale(2.5);
          }

          this.playerHasAnimations = false;
          console.log(`[ActionGameScene] Using custom static player sprite (${source.width}x${source.height}, scale ${this.playerSprite.scale})`);
        }
      } else {
        console.warn(`[ActionGameScene] Custom sprite too small (${source.width}x${source.height}), using procedural`);
      }
    }

    // Use procedural sprite if custom wasn't used
    if (!useCustomSprite) {
      if (this.textures.exists('player-idle')) {
        this.playerSprite = this.add.sprite(this.player.x, this.player.y, 'player-idle');
        this.playerSprite.setOrigin(0.5, 1);
        this.playerSprite.setScale(1.2);
        this.playerSprite.play('player-walk');
        this.playerHasAnimations = true;
        console.log('[ActionGameScene] Using procedural player sprite');
      } else {
        // Final fallback to graphics
        this.playerSprite = this.add.graphics();
        this.drawPlayer();
        this.playerHasAnimations = false;
        console.warn('[ActionGameScene] Using fallback graphics for player');
      }
    }

    // Player role badge - more subtle
    const role = this.mission.player_role || 'Worker';
    this.playerBadge = this.add.text(this.player.x, this.player.y - 100, role.toUpperCase(), {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(255, 107, 53, 0.8)',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
  }

  drawPlayer() {
    const g = this.playerSprite;
    g.clear();

    const px = this.player.x;
    const py = this.player.y;

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(px, py + 2, 30, 10);

    // Boots
    g.fillStyle(0x2a1a08, 1);
    g.fillRect(px - 12, py - 8, 10, 8);
    g.fillRect(px + 2, py - 8, 10, 8);

    // Legs
    g.fillStyle(0x1a3a6a, 1);
    g.fillRect(px - 10, py - 30, 8, 22);
    g.fillRect(px + 2, py - 30, 8, 22);

    // Body (hi-vis vest)
    g.fillStyle(0xff8800, 1);
    g.fillRect(px - 14, py - 60, 28, 30);

    // Reflective stripe
    g.fillStyle(0xffff44, 0.9);
    g.fillRect(px - 14, py - 50, 28, 4);

    // Arms
    g.fillStyle(0xff8800, 1);
    g.fillRect(px - 24, py - 58, 10, 20);
    g.fillRect(px + 14, py - 58, 10, 20);

    // Head
    g.fillStyle(0xf0c888, 1);
    g.fillCircle(px, py - 72, 12);

    // Hard hat
    g.fillStyle(0xffcc00, 1);
    g.fillEllipse(px, py - 84, 28, 10);
    g.fillRect(px - 12, py - 90, 24, 12);

    // Eyes
    g.fillStyle(0x222222, 1);
    g.fillCircle(px - 4, py - 74, 2);
    g.fillCircle(px + 4, py - 74, 2);
  }

  spawnMissionObjects() {
    const hazardType = (this.mission.hazard_type || 'fire').toLowerCase();

    // Spawn hazard
    this.spawnHazard(hazardType);

    // Spawn tools/items needed to complete mission
    this.spawnTools(hazardType);
  }

  spawnHazard(type) {
    const hx = W / 2 + 150;
    const hy = FLOOR_Y;

    this.hazard = {
      x: hx,
      y: hy,
      type: type,
      active: true,
    };

    // Check if custom hazard sprite is available
    const customHazardTexture = AssetLoader.getHazardTexture(this, this.mission);

    if (this.textures.exists(customHazardTexture) && customHazardTexture.startsWith('custom-')) {
      // Use custom Gemini-generated hazard sprite
      this.hazardSprite = this.add.image(hx, hy, customHazardTexture);
      this.hazardSprite.setOrigin(0.5, 1);

      // Get texture to check size
      const texture = this.textures.get(customHazardTexture);
      const source = texture.getSourceImage();

      // Scale based on image size
      if (source.width > 512) {
        this.hazardSprite.setScale(0.15); // Very large images (1024x1024)
      } else if (source.width > 200) {
        this.hazardSprite.setScale(0.5); // Medium images (256x256)
      } else if (source.width > 100) {
        this.hazardSprite.setScale(0.7); // Small images (128x128)
      } else {
        this.hazardSprite.setScale(2.0); // Tiny images (32x128)
      }

      console.log(`[ActionGameScene] Using custom hazard sprite (${source.width}x${source.height}, scale ${this.hazardSprite.scale})`);
    } else {
      // Use graphics fallback
      this.hazardGraphics = this.add.graphics();
      this.drawHazard();
      console.log('[ActionGameScene] Using procedural hazard graphics');
    }

    // Hazard label
    this.hazardLabel = this.add.text(hx, hy - 100, `${type.toUpperCase()} HAZARD`, {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#ff4444',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);

    // Animate hazard
    this.tweens.add({
      targets: this.hazardLabel,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    // Play hazard sound
    if (type === 'fire') {
      this.time.addEvent({
        delay: 2000,
        callback: () => soundManager.playFire(),
        loop: true,
      });
    } else if (type === 'electric' || type === 'electrical') {
      this.time.addEvent({
        delay: 1500,
        callback: () => soundManager.playSpark(),
        loop: true,
      });
    }
  }

  drawHazard() {
    if (!this.hazardGraphics) return; // Skip if using custom sprite

    const g = this.hazardGraphics;
    g.clear();

    if (!this.hazard.active) return;

    const hx = this.hazard.x;
    const hy = this.hazard.y;

    switch (this.hazard.type) {
      case 'fire':
        // Flames
        g.fillStyle(0xff4400, 0.9);
        g.fillTriangle(hx, hy - 80, hx - 40, hy, hx + 40, hy);
        g.fillStyle(0xffaa00, 0.8);
        g.fillTriangle(hx, hy - 60, hx - 25, hy, hx + 25, hy);
        g.fillStyle(0xffff44, 0.7);
        g.fillTriangle(hx, hy - 40, hx - 15, hy, hx + 15, hy);
        break;

      case 'spill':
      case 'chemical':
        // Puddle
        g.fillStyle(0x00ff88, 0.7);
        g.fillEllipse(hx, hy - 10, 100, 40);
        g.fillStyle(0x00ff88, 0.4);
        g.fillEllipse(hx, hy - 10, 120, 50);
        break;

      case 'electric':
      case 'electrical':
        // Lightning bolt
        g.lineStyle(6, 0xffff00, 1);
        g.lineBetween(hx, hy - 80, hx - 15, hy - 40);
        g.lineBetween(hx - 15, hy - 40, hx + 10, hy - 40);
        g.lineBetween(hx + 10, hy - 40, hx - 10, hy);
        break;

      case 'gas':
        // Cloud
        g.fillStyle(0x88ff88, 0.5);
        g.fillCircle(hx, hy - 50, 40);
        g.fillCircle(hx - 25, hy - 35, 30);
        g.fillCircle(hx + 25, hy - 35, 30);
        break;
    }
  }

  spawnTools(hazardType) {
    // Spawn appropriate tool for the hazard
    let tool = null;

    switch (hazardType) {
      case 'fire':
        tool = {
          name: 'extinguisher',
          sprite: 'tool-extinguisher',
          x: 400,
          y: FLOOR_Y,
          label: 'Fire Extinguisher',
        };
        break;

      case 'spill':
      case 'chemical':
        tool = {
          name: 'cleanup_kit',
          sprite: 'tool-cleanup',
          x: 350,
          y: FLOOR_Y,
          label: 'Cleanup Kit',
        };
        break;

      case 'electric':
      case 'electrical':
        tool = {
          name: 'breaker',
          sprite: 'tool-breaker',
          x: W - 180,
          y: FLOOR_Y - 100,
          label: 'Circuit Breaker',
        };
        break;

      case 'gas':
        tool = {
          name: 'ventilation',
          sprite: 'tool-ventilation',
          x: 300,
          y: FLOOR_Y,
          label: 'Ventilation Control',
        };
        break;

      default:
        tool = {
          name: 'tool',
          sprite: 'tool-generic',
          x: 350,
          y: FLOOR_Y,
          label: 'Safety Tool',
        };
    }

    if (tool) {
      this.createInteractable(tool);
    }
  }

  createInteractable(obj) {
    // Check if custom tool sprite is available
    const customToolTexture = AssetLoader.getToolTexture(this, this.mission);
    const spriteKey = (this.textures.exists(customToolTexture) && customToolTexture.startsWith('custom-'))
      ? customToolTexture
      : obj.sprite;

    const sprite = this.add.image(obj.x, obj.y - 30, spriteKey).setOrigin(0.5);

    if (spriteKey.startsWith('custom-')) {
      // Get texture to check size
      const texture = this.textures.get(spriteKey);
      const source = texture.getSourceImage();

      // Scale based on image size
      if (source.width > 512) {
        sprite.setScale(0.1); // Very large images (1024x1024)
      } else if (source.width > 200) {
        sprite.setScale(0.35); // Medium images (256x256)
      } else if (source.width > 100) {
        sprite.setScale(0.5); // Small images (96x96)
      } else {
        sprite.setScale(1.5); // Tiny images (32x128)
      }

      console.log(`[ActionGameScene] Using custom tool sprite (${source.width}x${source.height}, scale ${sprite.scale})`);
    } else {
      sprite.setScale(0.8); // Normal scale for procedural sprites
    }

    const label = this.add.text(obj.x, obj.y - 80, obj.label, {
      fontSize: '11px',
      fontFamily: 'Courier New',
      color: '#4ecdc4',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setAlpha(0);

    // Glow effect
    const glow = this.add.graphics();
    glow.fillStyle(0x4ecdc4, 0.3);
    glow.fillCircle(obj.x, obj.y - 30, 35);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.6 },
      scale: { from: 1, to: 1.2 },
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    this.interactables.push({
      ...obj,
      sprite,
      label,
      glow,
      pickedUp: false,
    });
  }

  setupControls() {
    // WASD + Arrow keys
    this.keys = {
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      interact: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      use: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    // Number keys for inventory
    for (let i = 1; i <= 4; i++) {
      this.input.keyboard.on(`keydown-${i}`, () => {
        this.inventory.selectSlot(i - 1);
      });
    }

    // Click to move
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < FLOOR_Y + 50) {
        this.movePlayerTo(pointer.x);
      }
    });
  }

  createHUD() {
    const hud = this.add.container(0, 0).setDepth(1000);

    // Top bar - larger for more info
    const topBg = this.add.graphics();
    topBg.fillStyle(0x000000, 0.85);
    topBg.fillRect(0, 0, W, 100);
    topBg.lineStyle(3, 0x4ecdc4, 0.8);
    topBg.lineBetween(0, 100, W, 100);

    // Mission title - larger and more prominent
    const missionText = this.add.text(20, 15, `${this.mission.title || 'Safety Mission'}`, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold',
    });

    // Player role and environment
    const roleText = this.add.text(20, 45, `ROLE: ${this.mission.player_role || 'Safety Officer'}   |   LOCATION: ${this.mission.environment_type || 'Warehouse'}`, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#a0a0c0',
      letterSpacing: 1
    });

    // Scenario description
    const scenario = this.mission.scenario || 'Complete the safety task';
    const scenarioText = this.add.text(20, 68, scenario.substring(0, 100) + (scenario.length > 100 ? '...' : ''), {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      wordWrap: { width: W - 40 }
    });

    // Controls hint - subtle bottom bar
    const controls = this.add.text(W / 2, H - 20, 'WASD / ARROWS: MOVE  •  E: INTERACT  •  1-4: USE ITEM', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#ffffff',
      alpha: 0.7,
      letterSpacing: 1
    }).setOrigin(0.5);

    hud.add([topBg, missionText, roleText, scenarioText, controls]);
  }

  getObjectiveText() {
    const hazardType = this.hazard.type;

    switch (hazardType) {
      case 'fire':
        return 'OBJECTIVE: Find fire extinguisher → Approach fire → Use extinguisher';
      case 'spill':
      case 'chemical':
        return 'OBJECTIVE: Find cleanup kit → Approach spill → Clean up hazard';
      case 'electric':
      case 'electrical':
        return 'OBJECTIVE: Find circuit breaker → Turn off power → Secure area';
      case 'gas':
        return 'OBJECTIVE: Find ventilation control → Activate ventilation → Clear gas';
      default:
        return 'OBJECTIVE: Find safety tool → Approach hazard → Neutralize danger';
    }
  }

  update(time, delta) {
    if (this.taskCompleted) return;
    if (!this.keys) return; // Wait for scene to be fully built

    this.handleMovement(delta);
    this.checkInteractions();
    this.updatePlayerGraphics();
  }

  handleMovement(delta) {
    if (!this.keys) return; // Safety check

    const left = this.keys.left.isDown || this.keys.left2.isDown;
    const right = this.keys.right.isDown || this.keys.right2.isDown;
    const up = this.keys.up.isDown || this.keys.up2.isDown;
    const down = this.keys.down.isDown || this.keys.down2.isDown;

    const isMoving = left || right || up || down;

    // Calculate movement direction
    let moveX = 0;
    let moveY = 0;

    if (left) moveX -= 1;
    if (right) moveX += 1;
    if (up) moveY -= 1;
    if (down) moveY += 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= length;
      moveY /= length;
    }

    // Update animation based on movement
    if (this.playerHasAnimations && this.playerSprite.anims) {
      if (isMoving) {
        // Play walk animation if not already playing
        if (this.anims.exists('custom-player-walk')) {
          if (this.playerSprite.anims.currentAnim?.key !== 'custom-player-walk') {
            this.playerSprite.play('custom-player-walk', true);
          }
        } else if (this.playerSprite.anims.currentAnim?.key !== 'player-walk') {
          this.playerSprite.play('player-walk', true);
        }
      } else {
        // Play idle animation if not already playing
        if (this.anims.exists('custom-player-idle')) {
          if (this.playerSprite.anims.currentAnim?.key !== 'custom-player-idle') {
            this.playerSprite.play('custom-player-idle', true);
          }
        } else if (this.anims.exists('player-idle') &&
          this.playerSprite.anims.currentAnim?.key !== 'player-idle') {
          this.playerSprite.play('player-idle', true);
        }
      }
    }

    // Apply movement
    if (isMoving && !this.player.isMoving) {
      // Update direction for sprite flipping (only horizontal)
      if (moveX !== 0) {
        this.player.direction = moveX > 0 ? 1 : -1;
      }

      // Move player
      this.player.x += moveX * this.player.speed * (delta / 1000);
      this.player.y += moveY * this.player.speed * (delta / 1000);

      // Keep player in bounds
      this.player.x = Math.max(50, Math.min(W - 50, this.player.x));
      this.player.y = Math.max(150, Math.min(FLOOR_Y, this.player.y));

      // Footstep sound
      this.footstepTimer += delta;
      if (this.footstepTimer > 300) {
        soundManager.playFootstep();
        this.footstepTimer = 0;
      }
    }
  }

  movePlayerTo(targetX) {
    if (this.player.isMoving) return;

    this.player.isMoving = true;
    const distance = Math.abs(targetX - this.player.x);
    const duration = (distance / this.player.speed) * 1000;

    this.player.direction = targetX > this.player.x ? 1 : -1;

    this.tweens.add({
      targets: this.player,
      x: targetX,
      duration: duration,
      ease: 'Linear',
      onUpdate: () => {
        this.footstepTimer += 16;
        if (this.footstepTimer > 300) {
          soundManager.playFootstep();
          this.footstepTimer = 0;
        }
      },
      onComplete: () => {
        this.player.isMoving = false;
      },
    });
  }

  checkInteractions() {
    if (!this.interactables) return; // Wait for scene to be fully built

    // Check if player is near any interactable
    this.interactables.forEach(obj => {
      const distance = Math.abs(this.player.x - obj.x);

      if (distance < 60 && !obj.pickedUp) {
        // Show label
        obj.label.setAlpha(1);

        // E key to interact
        if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
          this.pickupItem(obj);
        }
      } else {
        obj.label.setAlpha(0);
      }
    });

    // Check if player is near hazard with correct item
    const hazardDistance = Math.abs(this.player.x - this.hazard.x);
    if (hazardDistance < 80 && this.hazard.active) {
      // Space to use item
      if (Phaser.Input.Keyboard.JustDown(this.keys.use)) {
        this.useItemOnHazard();
      }
    }
  }

  pickupItem(obj) {
    const added = this.inventory.addItem({
      name: obj.name,
      sprite: obj.sprite,
      label: obj.label,
    });

    if (added) {
      obj.pickedUp = true;
      obj.sprite.destroy();
      obj.label.destroy();
      obj.glow.destroy();

      soundManager.playPickup();

      // Play hold animation if available
      if (this.playerHasAnimations && this.anims.exists('custom-player-hold')) {
        this.playerSprite.play('custom-player-hold');
        // Return to idle after 1 second
        this.time.delayedCall(1000, () => {
          if (this.playerSprite && this.playerSprite.anims) {
            this.playerSprite.play('custom-player-idle');
          }
        });
      }

      // Show pickup message
      const msg = this.add.text(obj.x, obj.y - 100, `+ ${obj.label.text.toUpperCase()}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ff6b35',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: msg,
        y: msg.y - 40,
        alpha: 0,
        duration: 1000,
        onComplete: () => msg.destroy(),
      });
    }
  }

  useItemOnHazard() {
    const item = this.inventory.getSelectedItem();
    if (!item) return;

    // Check if correct item for hazard
    const correct = this.isCorrectItem(item.name, this.hazard.type);

    if (correct) {
      this.completeTask(true);
    } else {
      this.showWrongItemMessage();
    }
  }

  isCorrectItem(itemName, hazardType) {
    const matches = {
      'extinguisher': 'fire',
      'cleanup_kit': ['spill', 'chemical'],
      'breaker': ['electric', 'electrical'],
      'ventilation': 'gas',
    };

    const validTypes = matches[itemName];
    if (Array.isArray(validTypes)) {
      return validTypes.includes(hazardType);
    }
    return validTypes === hazardType;
  }

  showWrongItemMessage() {
    soundManager.playFailure();

    const msg = this.add.text(this.hazard.x, this.hazard.y - 150, 'Wrong tool!', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ff4444',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(2000);

    this.tweens.add({
      targets: msg,
      y: msg.y - 30,
      alpha: 0,
      duration: 1500,
      onComplete: () => msg.destroy(),
    });
  }

  async completeTask(success) {
    this.taskCompleted = true;

    if (success) {
      // Neutralize hazard
      this.hazard.active = false;

      // Clear hazard graphics (handle both custom sprite and procedural graphics)
      if (this.hazardGraphics) {
        this.hazardGraphics.clear();
      }
      if (this.hazardSprite) {
        this.hazardSprite.destroy();
      }
      if (this.hazardLabel) {
        this.hazardLabel.destroy();
      }

      // Play success sound
      soundManager.playSuccess();

      // Play tool sound
      const item = this.inventory.getSelectedItem();
      if (item.name === 'extinguisher') {
        soundManager.playExtinguisher();
      } else {
        soundManager.playUse();
      }

      // Remove used item
      this.inventory.removeItem(item.name);

      // Update score
      state.score += this.mission.xp_reward || 100;
      state.correctCount += 1;

      // Show success message
      this.showCompletionMessage(true);

      // Speak feedback
      VoiceManager.speak(
        this.mission.success_message || 'Mission complete! Great work!',
        'celebrating'
      ).catch(() => { });

    } else {
      soundManager.playFailure();
      this.showCompletionMessage(false);
    }

    // Continue to next mission
    this.time.delayedCall(3000, () => {
      state.currentIndex += 1;

      if (state.isComplete) {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('ResultScene');
        });
      } else {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.restart();
        });
      }
    });
  }

  showCompletionMessage(success) {
    const overlay = this.add.graphics().setDepth(3000);
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, W, H);

    const color = success ? 0x39ff14 : 0xff4444;
    const icon = success ? '[SUCCESS]' : '[FAILED]';
    const title = success ? 'MISSION COMPLETE!' : 'MISSION FAILED!';
    const message = success ? this.mission.success_message : this.mission.fail_message;

    const titleText = this.add.text(W / 2, H / 2 - 80, title, {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5).setDepth(3001);

    const msgText = this.add.text(W / 2, H / 2, message || '', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      wordWrap: { width: 700 },
      align: 'center',
    }).setOrigin(0.5).setDepth(3001);

    const xpText = this.add.text(W / 2, H / 2 + 80, success ? `+${this.mission.xp_reward || 100} XP` : '', {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#ffcc00',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3001);

    // Animate in
    [titleText, msgText, xpText].forEach((text, i) => {
      text.setAlpha(0).setScale(0.8);
      this.tweens.add({
        targets: text,
        alpha: 1,
        scale: 1,
        duration: 400,
        delay: i * 150,
        ease: 'Back.out',
      });
    });
  }

  updatePlayerGraphics() {
    if (!this.playerSprite) return; // Wait for scene to be fully built

    if (this.playerSprite.type === 'Graphics') {
      // Fallback graphics - redraw
      this.drawPlayer();
    } else if (this.playerSprite.type === 'Sprite') {
      // Procedural sprite - just update position
      this.playerSprite.setPosition(this.player.x, this.player.y);
      this.playerSprite.setFlipX(this.player.direction < 0);
    } else {
      // Custom image sprite - update position
      this.playerSprite.setPosition(this.player.x, this.player.y);
      this.playerSprite.setFlipX(this.player.direction < 0);
    }
    this.playerBadge.setPosition(this.player.x, this.player.y - 100);
  }

  refreshSpritesWithCustomAssets() {
    // This is called after custom assets finish loading
    // For now, just log - full sprite replacement would require rebuilding the scene
    console.log('[ActionGameScene] Custom assets loaded - restart mission to see them');
    // TODO: Could implement hot-swapping sprites here if needed
  }

  loadCustomAssetsSync(customAssets) {
    // Deprecated in favor of AssetLoader.js
    console.warn('[ActionGameScene] loadCustomAssetsSync is deprecated, use AssetLoader instead');
  }
}
