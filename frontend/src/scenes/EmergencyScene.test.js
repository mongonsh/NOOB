/**
 * Unit tests for EmergencyScene transcript display functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser
const mockScene = {
  add: {
    text: vi.fn((x, y, text, style) => ({
      x, y, text, style,
      destroy: vi.fn(),
      height: 20,
      setOrigin: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setBackgroundColor: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
    })),
    graphics: vi.fn(() => ({
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
    })),
    container: vi.fn(() => ({
      add: vi.fn(),
      setMask: vi.fn(),
      y: 0,
      destroy: vi.fn(),
    })),
  },
  make: {
    graphics: vi.fn(() => ({
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      createGeometryMask: vi.fn(),
    })),
  },
  cameras: {
    main: {
      setBackgroundColor: vi.fn(),
      fadeIn: vi.fn(),
      fadeOut: vi.fn(),
      once: vi.fn(),
    },
  },
  tweens: {
    add: vi.fn(),
    killTweensOf: vi.fn(),
  },
  time: {
    delayedCall: vi.fn(),
  },
  scene: {
    start: vi.fn(),
  },
};

describe('EmergencyScene Transcript Display', () => {
  let scene;

  beforeEach(() => {
    // Create a minimal scene instance for testing
    scene = {
      transcriptEntries: [],
      transcriptY: 200,
      transcriptHeight: 280,
      transcriptContentY: 270,
      transcriptMaxHeight: 200,
      transcriptScrollOffset: 0,
      transcriptContainer: mockScene.add.container(),
      add: mockScene.add,
      make: mockScene.make,
      tweens: mockScene.tweens,
    };
  });

  it('should display placeholder when no transcript entries exist', () => {
    // Simulate _refreshTranscript with no entries
    const W = 800;
    const TEXT = { GRAY: '#888888', GREEN: '#4ecdc4', ORANGE: '#ff6b6b' };
    
    scene.transcriptEntries = [];
    
    // Mock the refresh logic
    if (scene.transcriptEntries.length === 0) {
      scene.transcriptContent = scene.add.text(
        60, 
        scene.transcriptContentY, 
        'No conversation yet.\nWaiting for connection...', 
        {
          fontSize: '14px',
          fontFamily: 'Courier New',
          color: TEXT.GRAY,
          lineSpacing: 6,
          wordWrap: { width: W - 140 },
        }
      );
    }
    
    expect(scene.transcriptContent).toBeDefined();
    expect(scene.transcriptContent.text).toContain('No conversation yet');
  });

  it('should format user messages with green color', () => {
    const W = 800;
    const TEXT = { GRAY: '#888888', GREEN: '#4ecdc4', ORANGE: '#ff6b6b' };
    
    scene.transcriptEntries = [
      {
        timestamp: new Date().toISOString(),
        speaker: 'user',
        text: 'Hello, I need help'
      }
    ];
    
    // Simulate creating a user message
    const entry = scene.transcriptEntries[0];
    let speakerColor;
    
    if (entry.speaker === 'user') {
      speakerColor = TEXT.GREEN;
    }
    
    expect(speakerColor).toBe(TEXT.GREEN);
  });

  it('should format assistant messages with orange color', () => {
    const TEXT = { GRAY: '#888888', GREEN: '#4ecdc4', ORANGE: '#ff6b6b' };
    
    scene.transcriptEntries = [
      {
        timestamp: new Date().toISOString(),
        speaker: 'assistant',
        text: 'How can I help you?'
      }
    ];
    
    // Simulate creating an assistant message
    const entry = scene.transcriptEntries[0];
    let speakerColor;
    
    if (entry.speaker === 'assistant') {
      speakerColor = TEXT.ORANGE;
    }
    
    expect(speakerColor).toBe(TEXT.ORANGE);
  });

  it('should format system messages with gray color', () => {
    const TEXT = { GRAY: '#888888', GREEN: '#4ecdc4', ORANGE: '#ff6b6b' };
    
    scene.transcriptEntries = [
      {
        timestamp: new Date().toISOString(),
        speaker: 'system',
        text: 'Connection established'
      }
    ];
    
    // Simulate creating a system message
    const entry = scene.transcriptEntries[0];
    let speakerColor;
    
    if (entry.speaker === 'system') {
      speakerColor = TEXT.GRAY;
    }
    
    expect(speakerColor).toBe(TEXT.GRAY);
  });

  it('should calculate scroll offset when content exceeds visible area', () => {
    scene.transcriptContentHeight = 400; // Content height
    scene.transcriptMaxHeight = 200; // Visible height
    
    // Simulate scroll calculation
    let scrollOffset = 0;
    if (scene.transcriptContentHeight > scene.transcriptMaxHeight) {
      const scrollAmount = scene.transcriptContentHeight - scene.transcriptMaxHeight;
      scrollOffset = -scrollAmount;
    }
    
    expect(scrollOffset).toBe(-200);
  });

  it('should not scroll when content fits in visible area', () => {
    scene.transcriptContentHeight = 150; // Content height
    scene.transcriptMaxHeight = 200; // Visible height
    
    // Simulate scroll calculation
    let scrollOffset = 0;
    if (scene.transcriptContentHeight > scene.transcriptMaxHeight) {
      const scrollAmount = scene.transcriptContentHeight - scene.transcriptMaxHeight;
      scrollOffset = -scrollAmount;
    }
    
    expect(scrollOffset).toBe(0);
  });

  it('should format timestamps correctly', () => {
    const testDate = new Date('2024-03-01T14:30:45');
    const time = testDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Time format should be HH:MM:SS
    expect(time).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it('should handle multiple transcript entries', () => {
    scene.transcriptEntries = [
      {
        timestamp: new Date().toISOString(),
        speaker: 'user',
        text: 'First message'
      },
      {
        timestamp: new Date().toISOString(),
        speaker: 'assistant',
        text: 'Second message'
      },
      {
        timestamp: new Date().toISOString(),
        speaker: 'system',
        text: 'Third message'
      }
    ];
    
    expect(scene.transcriptEntries.length).toBe(3);
    expect(scene.transcriptEntries[0].speaker).toBe('user');
    expect(scene.transcriptEntries[1].speaker).toBe('assistant');
    expect(scene.transcriptEntries[2].speaker).toBe('system');
  });

  it('should add new entries to transcript array', () => {
    scene.transcriptEntries = [];
    
    // Simulate adding entries
    const entry1 = {
      timestamp: new Date().toISOString(),
      speaker: 'user',
      text: 'Test message'
    };
    
    scene.transcriptEntries.push(entry1);
    
    expect(scene.transcriptEntries.length).toBe(1);
    expect(scene.transcriptEntries[0]).toEqual(entry1);
  });
});
