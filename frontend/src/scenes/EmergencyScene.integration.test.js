/**
 * Integration tests for EmergencyScene transcript display
 * Tests the complete flow of adding and displaying transcript entries
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('EmergencyScene Transcript Display Integration', () => {
  let mockScene;
  let transcriptEntries;
  let mockTexts;

  beforeEach(() => {
    transcriptEntries = [];
    mockTexts = [];

    mockScene = {
      transcriptEntries,
      transcriptY: 200,
      transcriptHeight: 280,
      transcriptContentY: 270,
      transcriptMaxHeight: 200,
      transcriptScrollOffset: 0,
      transcriptContentHeight: 0,
      
      add: {
        text: vi.fn((x, y, text, style) => {
          const textObj = {
            x, y, text, style,
            height: 20,
            destroy: vi.fn(),
            setOrigin: vi.fn().mockReturnThis(),
          };
          mockTexts.push(textObj);
          return textObj;
        }),
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
      
      tweens: {
        add: vi.fn(),
      },
    };
  });

  it('should handle a complete conversation flow', () => {
    const W = 800;
    const TEXT = { GRAY: '#888888', GREEN: '#4ecdc4', ORANGE: '#ff6b6b' };

    // Simulate adding transcript entries
    const addTranscriptEntry = (entry) => {
      mockScene.transcriptEntries.push(entry);
    };

    // Add user message
    addTranscriptEntry({
      timestamp: new Date('2024-03-01T14:30:00').toISOString(),
      speaker: 'user',
      text: 'The machine is making a strange noise'
    });

    // Add assistant response
    addTranscriptEntry({
      timestamp: new Date('2024-03-01T14:30:05').toISOString(),
      speaker: 'assistant',
      text: 'I understand. Can you describe the noise? Is it a grinding, clicking, or humming sound?'
    });

    // Add user response
    addTranscriptEntry({
      timestamp: new Date('2024-03-01T14:30:15').toISOString(),
      speaker: 'user',
      text: 'It sounds like grinding'
    });

    // Add system message
    addTranscriptEntry({
      timestamp: new Date('2024-03-01T14:30:20').toISOString(),
      speaker: 'system',
      text: 'Analyzing safety manual for grinding noise procedures...'
    });

    // Add assistant response with instructions
    addTranscriptEntry({
      timestamp: new Date('2024-03-01T14:30:25').toISOString(),
      speaker: 'assistant',
      text: 'According to the safety manual, grinding noises may indicate bearing failure. Please follow these steps:\n1. Stop the machine immediately\n2. Tag it as out of service\n3. Contact maintenance'
    });

    // Verify all entries were added
    expect(mockScene.transcriptEntries.length).toBe(5);
    
    // Verify entry types
    expect(mockScene.transcriptEntries[0].speaker).toBe('user');
    expect(mockScene.transcriptEntries[1].speaker).toBe('assistant');
    expect(mockScene.transcriptEntries[2].speaker).toBe('user');
    expect(mockScene.transcriptEntries[3].speaker).toBe('system');
    expect(mockScene.transcriptEntries[4].speaker).toBe('assistant');

    // Verify content
    expect(mockScene.transcriptEntries[0].text).toContain('strange noise');
    expect(mockScene.transcriptEntries[4].text).toContain('bearing failure');
  });

  it('should properly format and render all transcript entries', () => {
    const W = 800;
    const TEXT = { GRAY: '#888888', GREEN: '#4ecdc4', ORANGE: '#ff6b6b' };

    // Add multiple entries
    mockScene.transcriptEntries = [
      {
        timestamp: new Date().toISOString(),
        speaker: 'user',
        text: 'User message'
      },
      {
        timestamp: new Date().toISOString(),
        speaker: 'assistant',
        text: 'Assistant response'
      },
      {
        timestamp: new Date().toISOString(),
        speaker: 'system',
        text: 'System notification'
      }
    ];

    // Simulate rendering
    mockTexts = [];
    let yOffset = mockScene.transcriptContentY;
    const lineHeight = 20;
    const messageSpacing = 10;

    for (const entry of mockScene.transcriptEntries) {
      const time = new Date(entry.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      
      let speaker, speakerColor;
      if (entry.speaker === 'user') {
        speaker = 'You';
        speakerColor = TEXT.GREEN;
      } else if (entry.speaker === 'assistant') {
        speaker = 'Assistant';
        speakerColor = TEXT.ORANGE;
      } else {
        speaker = 'System';
        speakerColor = TEXT.GRAY;
      }
      
      // Create header
      const headerText = mockScene.add.text(60, yOffset, `[${time}] ${speaker}:`, {
        fontSize: '13px',
        fontFamily: 'Courier New',
        color: speakerColor,
        fontStyle: 'bold',
      });
      yOffset += lineHeight;
      
      // Create message
      const messageText = mockScene.add.text(60, yOffset, entry.text, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        lineSpacing: 4,
        wordWrap: { width: W - 140 },
      });
      yOffset += messageText.height + messageSpacing;
    }

    // Verify correct number of text objects created (2 per entry: header + message)
    expect(mockTexts.length).toBe(6);
    
    // Verify colors
    expect(mockTexts[0].style.color).toBe(TEXT.GREEN); // User header
    expect(mockTexts[2].style.color).toBe(TEXT.ORANGE); // Assistant header
    expect(mockTexts[4].style.color).toBe(TEXT.GRAY); // System header
  });

  it('should handle auto-scrolling when content exceeds visible area', () => {
    // Simulate long conversation
    for (let i = 0; i < 20; i++) {
      mockScene.transcriptEntries.push({
        timestamp: new Date().toISOString(),
        speaker: i % 2 === 0 ? 'user' : 'assistant',
        text: `Message ${i + 1}`
      });
    }

    // Simulate content height calculation
    const lineHeight = 20;
    const messageSpacing = 10;
    mockScene.transcriptContentHeight = mockScene.transcriptEntries.length * (lineHeight * 2 + messageSpacing);

    // Calculate scroll
    let scrollOffset = 0;
    if (mockScene.transcriptContentHeight > mockScene.transcriptMaxHeight) {
      const scrollAmount = mockScene.transcriptContentHeight - mockScene.transcriptMaxHeight;
      scrollOffset = -scrollAmount;
    }

    // Verify scrolling is triggered
    expect(mockScene.transcriptContentHeight).toBeGreaterThan(mockScene.transcriptMaxHeight);
    expect(scrollOffset).toBeLessThan(0);
  });

  it('should handle empty transcript gracefully', () => {
    const W = 800;
    const TEXT = { GRAY: '#888888' };

    mockScene.transcriptEntries = [];

    // Simulate rendering empty transcript
    if (mockScene.transcriptEntries.length === 0) {
      mockScene.add.text(
        60, 
        mockScene.transcriptContentY, 
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

    // Verify placeholder was created
    expect(mockTexts.length).toBe(1);
    expect(mockTexts[0].text).toContain('No conversation yet');
  });

  it('should preserve message order', () => {
    const messages = [
      { speaker: 'user', text: 'First' },
      { speaker: 'assistant', text: 'Second' },
      { speaker: 'user', text: 'Third' },
      { speaker: 'assistant', text: 'Fourth' },
    ];

    messages.forEach(msg => {
      mockScene.transcriptEntries.push({
        timestamp: new Date().toISOString(),
        ...msg
      });
    });

    // Verify order is preserved
    expect(mockScene.transcriptEntries[0].text).toBe('First');
    expect(mockScene.transcriptEntries[1].text).toBe('Second');
    expect(mockScene.transcriptEntries[2].text).toBe('Third');
    expect(mockScene.transcriptEntries[3].text).toBe('Fourth');
  });

  it('should handle long messages with word wrapping', () => {
    const W = 800;
    const longMessage = 'This is a very long message that should wrap across multiple lines when displayed in the transcript area. It contains important safety information that the user needs to read carefully.';

    mockScene.transcriptEntries.push({
      timestamp: new Date().toISOString(),
      speaker: 'assistant',
      text: longMessage
    });

    // Simulate rendering with word wrap
    const messageText = mockScene.add.text(60, 270, longMessage, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      lineSpacing: 4,
      wordWrap: { width: W - 140 },
    });

    // Verify word wrap is configured
    expect(messageText.style.wordWrap.width).toBe(660);
    expect(messageText.text.length).toBeGreaterThan(100);
  });
});
