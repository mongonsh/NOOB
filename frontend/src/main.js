import Phaser from 'phaser';
import { BootScene }   from './scenes/BootScene.js';
import { MenuScene }   from './scenes/MenuScene.js';
import { ActionGameScene } from './scenes/ActionGameScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { EmergencyScene } from './scenes/EmergencyScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  scene: [BootScene, MenuScene, ActionGameScene, ResultScene, EmergencyScene, SettingsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
});
