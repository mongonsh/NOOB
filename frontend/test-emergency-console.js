/**
 * Emergency Assistant - Console Test Script
 * 
 * HOW TO USE:
 * 1. Open the game in your browser
 * 2. Navigate to the Emergency Scene
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire file into the console
 * 5. Run test functions like: testMachineBroken()
 */

// Helper function to simulate adding transcript entries
function simulateTranscriptEntry(speaker, text, delay = 0) {
    setTimeout(() => {
        // Find the Emergency Scene instance
        const scene = window.game?.scene?.scenes?.find(s => s.scene.key === 'EmergencyScene');
        
        if (!scene) {
            console.error('❌ Emergency Scene not found. Make sure you are on the Emergency Scene.');
            return;
        }
        
        if (!scene._addTranscriptEntry) {
            console.error('❌ _addTranscriptEntry method not found on scene.');
            return;
        }
        
        const entry = {
            timestamp: new Date().toISOString(),
            speaker: speaker,
            text: text
        };
        
        scene._addTranscriptEntry(entry);
        console.log(`✅ Added ${speaker} message:`, text.substring(0, 50) + '...');
    }, delay);
}

// Test Scenario 1: Machine Broken
function testMachineBroken() {
    console.log('🔧 Testing Scenario: Machine Broken');
    
    simulateTranscriptEntry('system', 'Connection established. Emergency assistant ready.', 0);
    simulateTranscriptEntry('assistant', 'Hello! I\'m your safety assistant. What\'s the emergency?', 500);
    simulateTranscriptEntry('user', 'The machine is broken and making a loud grinding noise', 1500);
    simulateTranscriptEntry('assistant', 'I understand. A grinding noise can indicate a serious mechanical issue. Can you tell me which machine is affected?', 2500);
    simulateTranscriptEntry('user', 'It\'s the main conveyor belt motor', 3500);
    simulateTranscriptEntry('system', 'Analyzing safety manual for conveyor belt procedures...', 4000);
    simulateTranscriptEntry('assistant', 'According to your safety manual (Section 4.2), grinding noises typically indicate bearing failure. Please:\n1. Press emergency stop\n2. Lock out power source\n3. Clear the area\n4. Contact maintenance', 5500);
    simulateTranscriptEntry('user', 'Done! Machine is stopped', 7000);
    simulateTranscriptEntry('assistant', 'Excellent! You handled that perfectly. Stay safe!', 8000);
    simulateTranscriptEntry('system', 'Session ended. Duration: 40 seconds', 8500);
}

// Test Scenario 2: Oil Leak
function testOilLeak() {
    console.log('⚠️ Testing Scenario: Oil Leak');
    
    simulateTranscriptEntry('system', 'Emergency session started', 0);
    simulateTranscriptEntry('user', 'There\'s oil leaking everywhere near the hydraulic press!', 500);
    simulateTranscriptEntry('assistant', 'That\'s a serious slip hazard! First, is anyone near the leak?', 1500);
    simulateTranscriptEntry('user', 'No, I cleared the area', 2500);
    simulateTranscriptEntry('assistant', 'Good! Now:\n1. Place warning cones\n2. Post caution signs\n3. Call spill response team (ext 3456)\n4. Shut down hydraulic press', 3500);
    simulateTranscriptEntry('user', 'Spill team is on the way', 5000);
    simulateTranscriptEntry('assistant', 'Perfect! You\'ve handled this very well. Stay in the area to brief the team.', 5500);
    simulateTranscriptEntry('system', 'Incident logged successfully', 6000);
}

// Test Scenario 3: Quick Color Test
function testColors() {
    console.log('🎨 Testing Colors');
    
    simulateTranscriptEntry('user', 'This message should be GREEN', 0);
    simulateTranscriptEntry('assistant', 'This message should be ORANGE', 1000);
    simulateTranscriptEntry('system', 'This message should be GRAY', 2000);
}

// Test Scenario 4: Long Conversation (tests scrolling)
function testScrolling() {
    console.log('📜 Testing Auto-Scroll');
    
    for (let i = 1; i <= 20; i++) {
        const speaker = i % 3 === 0 ? 'system' : (i % 2 === 0 ? 'assistant' : 'user');
        const text = `Test message ${i} - This is a longer message to test word wrapping and scrolling behavior in the transcript display area.`;
        simulateTranscriptEntry(speaker, text, i * 300);
    }
}

// Test Scenario 5: Emergency Stop
function testEmergencyStop() {
    console.log('🔥 Testing Scenario: Emergency Stop');
    
    simulateTranscriptEntry('user', 'HELP! The machine won\'t stop!', 0);
    simulateTranscriptEntry('assistant', 'Stay calm! Which machine?', 500);
    simulateTranscriptEntry('user', 'The packaging line - emergency stop isn\'t working!', 1000);
    simulateTranscriptEntry('assistant', 'IMMEDIATE ACTION:\n1. Find main power disconnect (red switch)\n2. PULL IT DOWN NOW\n3. CLEAR THE AREA', 1500);
    simulateTranscriptEntry('user', 'Found it! Pulling now!', 2500);
    simulateTranscriptEntry('system', 'Critical safety procedure in progress...', 2700);
    simulateTranscriptEntry('user', 'It\'s off! Machine stopped!', 3500);
    simulateTranscriptEntry('assistant', 'EXCELLENT! Keep power OFF, lock it, post "DO NOT OPERATE" sign, call supervisor.', 4000);
    simulateTranscriptEntry('user', 'Everyone is safe, no injuries', 5000);
    simulateTranscriptEntry('assistant', 'Great! Your quick thinking prevented an accident!', 5500);
    simulateTranscriptEntry('system', 'Incident logged. Maintenance notified.', 6000);
}

// Test Scenario 6: Forklift Overload
function testForkliftOverload() {
    console.log('🚜 Testing Scenario: Forklift Overload');
    
    simulateTranscriptEntry('user', 'The forklift is beeping continuously', 0);
    simulateTranscriptEntry('assistant', 'Continuous beeping indicates a warning. Check the display panel. What does it show?', 1000);
    simulateTranscriptEntry('user', 'It says "OVERLOAD"', 2000);
    simulateTranscriptEntry('assistant', 'The forklift is overloaded! Stop immediately:\n1. Lower the load\n2. Remove excess weight\n3. Check capacity plate\n\nWhat\'s the rated capacity?', 3000);
    simulateTranscriptEntry('user', 'It says 5000 lbs, but my load is about 6000 lbs', 4500);
    simulateTranscriptEntry('assistant', 'That\'s 1000 lbs over! Very dangerous. Split the load into two trips. Never exceed capacity!', 5500);
    simulateTranscriptEntry('user', 'Got it, splitting the load now', 6500);
    simulateTranscriptEntry('system', 'Safety reminder: Always check load weight before lifting', 7000);
}

// Clear transcript
function clearTranscript() {
    const scene = window.game?.scene?.scenes?.find(s => s.scene.key === 'EmergencyScene');
    
    if (!scene) {
        console.error('❌ Emergency Scene not found');
        return;
    }
    
    if (scene.transcriptEntries) {
        scene.transcriptEntries = [];
        if (scene._refreshTranscript) {
            scene._refreshTranscript();
        }
        console.log('✅ Transcript cleared');
    }
}

// Display help
function showTestHelp() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         EMERGENCY ASSISTANT - CONSOLE TEST COMMANDS           ║
╚═══════════════════════════════════════════════════════════════╝

Available Test Functions:
─────────────────────────────────────────────────────────────────
  testMachineBroken()      - Test machine breakdown scenario
  testOilLeak()            - Test oil leak hazard scenario
  testEmergencyStop()      - Test emergency stop scenario
  testForkliftOverload()   - Test forklift overload scenario
  testColors()             - Test color coding (quick)
  testScrolling()          - Test auto-scroll with many messages
  clearTranscript()        - Clear all messages
  showTestHelp()           - Show this help message

Usage Example:
─────────────────────────────────────────────────────────────────
  1. Navigate to Emergency Scene in the game
  2. Open browser console (F12)
  3. Run: testMachineBroken()
  4. Watch the transcript populate with test messages

Color Coding:
─────────────────────────────────────────────────────────────────
  🟢 User messages      - GREEN (#4ecdc4)
  🟠 Assistant messages - ORANGE (#ff6b6b)
  ⚪ System messages    - GRAY (#888888)

Tips:
─────────────────────────────────────────────────────────────────
  • Messages appear with realistic delays
  • Auto-scroll should activate with many messages
  • Use clearTranscript() between tests
  • Check browser console for any errors

    `);
}

// Auto-run help on load
console.log('✅ Emergency Assistant test functions loaded!');
console.log('📖 Run showTestHelp() for available commands');
console.log('🚀 Quick start: testMachineBroken()');
