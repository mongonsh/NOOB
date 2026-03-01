#!/usr/bin/env node

/**
 * Responsive Layout Verification Script
 * 
 * This script verifies that the MenuScene responsive layout configuration
 * is properly set up and will work across different viewport sizes.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
  try {
    const content = readFileSync(join(__dirname, filePath), 'utf-8');
    let passed = 0;
    let failed = 0;

    log(`\n📄 Checking ${filePath}...`, 'cyan');

    checks.forEach(check => {
      const result = check.test(content);
      if (result) {
        log(`  ✓ ${check.name}`, 'green');
        passed++;
      } else {
        log(`  ✗ ${check.name}`, 'red');
        if (check.hint) {
          log(`    Hint: ${check.hint}`, 'yellow');
        }
        failed++;
      }
    });

    return { passed, failed };
  } catch (error) {
    log(`  ✗ Error reading file: ${error.message}`, 'red');
    return { passed: 0, failed: checks.length };
  }
}

// Test configurations
const tests = [
  {
    file: 'src/main.js',
    checks: [
      {
        name: 'Phaser.Scale.FIT mode is configured',
        test: (content) => /mode:\s*Phaser\.Scale\.FIT/.test(content),
        hint: 'Add "mode: Phaser.Scale.FIT" to scale configuration',
      },
      {
        name: 'Phaser.Scale.CENTER_BOTH is configured',
        test: (content) => /autoCenter:\s*Phaser\.Scale\.CENTER_BOTH/.test(content),
        hint: 'Add "autoCenter: Phaser.Scale.CENTER_BOTH" to scale configuration',
      },
      {
        name: 'Game dimensions are set (1280x720)',
        test: (content) => /width:\s*1280/.test(content) && /height:\s*720/.test(content),
        hint: 'Ensure width: 1280 and height: 720 are set',
      },
      {
        name: 'Parent container is specified',
        test: (content) => /parent:\s*['"]game-container['"]/.test(content),
        hint: 'Add "parent: \'game-container\'" to game config',
      },
    ],
  },
  {
    file: 'src/scenes/MenuScene.js',
    checks: [
      {
        name: 'MenuScene class exists',
        test: (content) => /export\s+class\s+MenuScene/.test(content),
        hint: 'MenuScene should be exported as a class',
      },
      {
        name: 'Feature cards are created',
        test: (content) => /_createFeatureCards/.test(content),
        hint: 'MenuScene should have _createFeatureCards method',
      },
      {
        name: 'Cards use responsive positioning',
        test: (content) => /W\s*\/\s*2/.test(content) && /cardWidth/.test(content),
        hint: 'Cards should be positioned relative to canvas width (W)',
      },
      {
        name: 'Interactive elements are set up',
        test: (content) => /setInteractive/.test(content),
        hint: 'Interactive elements should call setInteractive()',
      },
      {
        name: 'Hover effects are implemented',
        test: (content) => /pointerover/.test(content) && /pointerout/.test(content),
        hint: 'Hover effects should use pointerover and pointerout events',
      },
    ],
  },
  {
    file: 'src/config/constants.js',
    checks: [
      {
        name: 'Canvas width constant (W) is defined',
        test: (content) => /export\s+const\s+W\s*=\s*1280/.test(content),
        hint: 'Define "export const W = 1280"',
      },
      {
        name: 'Canvas height constant (H) is defined',
        test: (content) => /export\s+const\s+H\s*=\s*720/.test(content),
        hint: 'Define "export const H = 720"',
      },
      {
        name: 'Color constants are defined',
        test: (content) => /export\s+const\s+C\s*=/.test(content),
        hint: 'Define color constants object',
      },
    ],
  },
  {
    file: 'index.html',
    checks: [
      {
        name: 'Viewport meta tag is present',
        test: (content) => /<meta\s+name="viewport"/.test(content),
        hint: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      },
      {
        name: 'Game container div exists',
        test: (content) => /<div\s+id="game-container"/.test(content),
        hint: 'Add <div id="game-container"></div> to body',
      },
      {
        name: 'Main script is loaded as module',
        test: (content) => /<script\s+type="module"/.test(content),
        hint: 'Load main.js with type="module"',
      },
    ],
  },
];

// Viewport size tests
const viewportTests = [
  { name: 'Desktop HD', width: 1920, height: 1080, aspectRatio: 16/9 },
  { name: 'Laptop', width: 1280, height: 720, aspectRatio: 16/9 },
  { name: 'Tablet Landscape', width: 1024, height: 768, aspectRatio: 4/3 },
  { name: 'Tablet Portrait', width: 768, height: 1024, aspectRatio: 3/4 },
  { name: 'Mobile Landscape', width: 812, height: 375, aspectRatio: 2.16 },
  { name: 'Mobile Portrait', width: 375, height: 812, aspectRatio: 0.46 },
];

function calculateScaling(viewport) {
  const gameWidth = 1280;
  const gameHeight = 720;
  const gameAspect = gameWidth / gameHeight;
  const viewportAspect = viewport.width / viewport.height;

  let scale, displayWidth, displayHeight;

  if (viewportAspect > gameAspect) {
    // Viewport is wider - fit to height
    scale = viewport.height / gameHeight;
    displayHeight = viewport.height;
    displayWidth = gameWidth * scale;
  } else {
    // Viewport is taller - fit to width
    scale = viewport.width / gameWidth;
    displayWidth = viewport.width;
    displayHeight = gameHeight * scale;
  }

  return {
    scale: scale.toFixed(3),
    displayWidth: Math.round(displayWidth),
    displayHeight: Math.round(displayHeight),
    fits: displayWidth <= viewport.width && displayHeight <= viewport.height,
  };
}

// Run tests
log('\n🛡️  RESPONSIVE LAYOUT VERIFICATION', 'blue');
log('=' .repeat(60), 'blue');

let totalPassed = 0;
let totalFailed = 0;

tests.forEach(test => {
  const result = checkFile(test.file, test.checks);
  totalPassed += result.passed;
  totalFailed += result.failed;
});

// Viewport scaling tests
log('\n📐 Viewport Scaling Analysis...', 'cyan');
viewportTests.forEach(viewport => {
  const scaling = calculateScaling(viewport);
  const status = scaling.fits ? '✓' : '✗';
  const color = scaling.fits ? 'green' : 'red';
  
  log(`  ${status} ${viewport.name} (${viewport.width}×${viewport.height})`, color);
  log(`    Scale: ${scaling.scale}x | Display: ${scaling.displayWidth}×${scaling.displayHeight}`, 'reset');
});

// Summary
log('\n' + '='.repeat(60), 'blue');
log('📊 SUMMARY', 'blue');
log('='.repeat(60), 'blue');
log(`Total Checks: ${totalPassed + totalFailed}`, 'cyan');
log(`Passed: ${totalPassed}`, 'green');
log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');

if (totalFailed === 0) {
  log('\n✅ All responsive layout checks passed!', 'green');
  log('The MenuScene is properly configured for responsive behavior.', 'green');
  process.exit(0);
} else {
  log('\n❌ Some checks failed. Please review the hints above.', 'red');
  process.exit(1);
}
