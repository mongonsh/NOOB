/**
 * AssetLoader - Loads custom Gemini-generated images into Phaser
 */

export class AssetLoader {
  /**
   * Load custom assets from mission data (async)
   * @param {Phaser.Scene} scene - Phaser scene
   * @param {Object} mission - Mission data with custom_assets
   * @returns {Promise<boolean>} - True if assets were loaded
   */
  static async loadCustomAssets(scene, mission) {
    if (!mission.custom_assets) {
      console.log('[AssetLoader] No custom assets found, using procedural graphics');
      return false;
    }

    const assets = mission.custom_assets;
    const promises = [];

    // Load player sprite sheet (512x128 with 4 frames)
    if (assets.player) {
      const promise = new Promise((resolve, reject) => {
        try {
          const playerImg = `data:image/png;base64,${assets.player}`;
          
          // First, load the texture
          const img = new Image();
          img.onload = () => {
            // Robust sprite sheet detection: check aspect ratio
            // Gemini produces 4 frames side-by-side (approx 4:1 width-to-height)
            const aspectRatio = img.width / img.height;
            console.log(`[AssetLoader] Player image loaded: ${img.width}x${img.height}, aspect ratio: ${aspectRatio.toFixed(2)}`);

            if (aspectRatio > 3.5 && aspectRatio < 4.5) {
              // It's a sprite sheet - divide width by 4 to get frame width
              const frameWidth = Math.floor(img.width / 4);
              scene.textures.addSpriteSheet('custom-player', img, {
                frameWidth: frameWidth,
                frameHeight: img.height
              });
              console.log(`[AssetLoader] ✓ Custom player sprite sheet loaded (${frameWidth}x${img.height} per frame)`);
              
              // Create animations from sprite sheet
              this.createPlayerAnimations(scene);
            } else {
              // Single frame or wrong dimensions - add as regular texture
              scene.textures.addImage('custom-player', img);
              console.log(`[AssetLoader] ✓ Custom player sprite loaded (single frame, ${img.width}x${img.height})`);
            }
            resolve();
          };
          img.onerror = () => {
            reject(new Error('Failed to load player image'));
          };
          img.src = playerImg;
          
        } catch (e) {
          console.error('[AssetLoader] Failed to load player sprite:', e);
          reject(e);
        }
      });
      promises.push(promise);
    }

    // Load hazard sprite
    if (assets.hazard) {
      const promise = new Promise((resolve, reject) => {
        try {
          const hazardImg = `data:image/png;base64,${assets.hazard}`;
          scene.textures.once('addtexture', (key) => {
            if (key === 'custom-hazard') {
              console.log('[AssetLoader] ✓ Custom hazard sprite loaded');
              resolve();
            }
          });
          scene.textures.addBase64('custom-hazard', hazardImg);
        } catch (e) {
          console.error('[AssetLoader] Failed to load hazard sprite:', e);
          reject(e);
        }
      });
      promises.push(promise);
    }

    // Load tool sprite
    if (assets.tool) {
      const promise = new Promise((resolve, reject) => {
        try {
          const toolImg = `data:image/png;base64,${assets.tool}`;
          scene.textures.once('addtexture', (key) => {
            if (key === 'custom-tool') {
              console.log('[AssetLoader] ✓ Custom tool sprite loaded');
              resolve();
            }
          });
          scene.textures.addBase64('custom-tool', toolImg);
        } catch (e) {
          console.error('[AssetLoader] Failed to load tool sprite:', e);
          reject(e);
        }
      });
      promises.push(promise);
    }

    // Load environment background
    if (assets.environment) {
      const promise = new Promise((resolve, reject) => {
        try {
          const envImg = `data:image/png;base64,${assets.environment}`;
          scene.textures.once('addtexture', (key) => {
            if (key === 'custom-environment') {
              console.log('[AssetLoader] ✓ Custom environment loaded');
              resolve();
            }
          });
          scene.textures.addBase64('custom-environment', envImg);
        } catch (e) {
          console.error('[AssetLoader] Failed to load environment:', e);
          reject(e);
        }
      });
      promises.push(promise);
    }

    // Wait for all assets to load
    try {
      await Promise.all(promises);
      console.log('[AssetLoader] All custom assets loaded successfully!');
      return true;
    } catch (e) {
      console.error('[AssetLoader] Some assets failed to load:', e);
      return promises.length > 0; // Return true if we tried to load something
    }
  }

  /**
   * Create animations from custom player sprite sheet
   */
  static createPlayerAnimations(scene) {
    if (!scene.textures.exists('custom-player')) return;
    
    // Create idle animation (frame 0)
    if (!scene.anims.exists('custom-player-idle')) {
      scene.anims.create({
        key: 'custom-player-idle',
        frames: scene.anims.generateFrameNumbers('custom-player', { start: 0, end: 0 }),
        frameRate: 1,
        repeat: -1
      });
    }
    
    // Create walk animation (frames 1-2)
    if (!scene.anims.exists('custom-player-walk')) {
      scene.anims.create({
        key: 'custom-player-walk',
        frames: scene.anims.generateFrameNumbers('custom-player', { start: 1, end: 2 }),
        frameRate: 8,
        repeat: -1
      });
    }
    
    // Create hold animation (frame 3)
    if (!scene.anims.exists('custom-player-hold')) {
      scene.anims.create({
        key: 'custom-player-hold',
        frames: scene.anims.generateFrameNumbers('custom-player', { start: 3, end: 3 }),
        frameRate: 1,
        repeat: -1
      });
    }
    
    console.log('[AssetLoader] ✓ Player animations created (idle, walk, hold)');
  }

  /**
   * Check if custom assets are available
   */
  static hasCustomAssets(mission) {
    return mission && mission.custom_assets && Object.keys(mission.custom_assets).length > 0;
  }

  /**
   * Get texture key for player
   */
  static getPlayerTexture(scene, mission) {
    if (this.hasCustomAssets(mission) && scene.textures.exists('custom-player')) {
      return 'custom-player';
    }
    return 'player-idle'; // Fallback to procedural
  }

  /**
   * Get texture key for hazard
   */
  static getHazardTexture(scene, mission) {
    if (this.hasCustomAssets(mission) && scene.textures.exists('custom-hazard')) {
      return 'custom-hazard';
    }
    // Fallback to procedural based on hazard type
    const hazardType = mission.hazard_type || 'fire';
    return `${hazardType}-1`;
  }

  /**
   * Get texture key for tool
   */
  static getToolTexture(scene, mission) {
    if (this.hasCustomAssets(mission) && scene.textures.exists('custom-tool')) {
      return 'custom-tool';
    }
    // Fallback to procedural based on tool name
    const toolName = mission.custom_assets?.tool_name || 'extinguisher';
    return `tool-${toolName}`;
  }

  /**
   * Get texture key for environment
   */
  static getEnvironmentTexture(scene, mission) {
    if (this.hasCustomAssets(mission) && scene.textures.exists('custom-environment')) {
      return 'custom-environment';
    }
    return null; // Use procedural environment
  }
}
