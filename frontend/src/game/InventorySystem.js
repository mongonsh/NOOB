/**
 * InventorySystem - Manages player inventory and item usage
 */

export class InventorySystem {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.maxItems = 4;
    this.selectedIndex = 0;
    
    this.createUI();
  }

  createUI() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    
    // Inventory panel (bottom-left)
    this.container = this.scene.add.container(20, H - 100).setDepth(1000);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(0, 0, 280, 80, 8);
    bg.lineStyle(2, 0x4ecdc4, 0.8);
    bg.strokeRoundedRect(0, 0, 280, 80, 8);
    
    const title = this.scene.add.text(10, 8, 'INVENTORY', {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#4ecdc4',
      fontStyle: 'bold',
    });
    
    this.container.add([bg, title]);
    
    // Item slots
    this.slots = [];
    this.slotSprites = [];
    for (let i = 0; i < this.maxItems; i++) {
      const x = 10 + i * 65;
      const y = 30;
      
      const slotBg = this.scene.add.graphics();
      slotBg.fillStyle(0x1a1a2a, 1);
      slotBg.fillRoundedRect(x, y, 60, 40, 4);
      slotBg.lineStyle(1, 0x333344, 1);
      slotBg.strokeRoundedRect(x, y, 60, 40, 4);
      
      const keyHint = this.scene.add.text(x + 5, y + 35, `${i + 1}`, {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#666677',
      }).setOrigin(0, 1);
      
      this.container.add([slotBg, keyHint]);
      this.slots.push({ bg: slotBg, x, y });
      this.slotSprites.push(null);
    }
    
    this.updateUI();
  }

  addItem(item) {
    if (this.items.length >= this.maxItems) {
      return false; // Inventory full
    }
    
    this.items.push(item);
    this.updateUI();
    return true;
  }

  removeItem(itemName) {
    const index = this.items.findIndex(i => i.name === itemName);
    if (index >= 0) {
      this.items.splice(index, 1);
      if (this.selectedIndex >= this.items.length) {
        this.selectedIndex = Math.max(0, this.items.length - 1);
      }
      this.updateUI();
      return true;
    }
    return false;
  }

  hasItem(itemName) {
    return this.items.some(i => i.name === itemName);
  }

  getSelectedItem() {
    return this.items[this.selectedIndex] || null;
  }

  selectSlot(index) {
    if (index >= 0 && index < this.items.length) {
      this.selectedIndex = index;
      this.updateUI();
    }
  }

  updateUI() {
    this.slots.forEach((slot, i) => {
      const item = this.items[i];
      
      // Clear previous sprite
      if (this.slotSprites[i]) {
        this.slotSprites[i].destroy();
        this.slotSprites[i] = null;
      }
      
      // Clear previous styling
      slot.bg.clear();
      
      if (item) {
        // Has item
        const isSelected = i === this.selectedIndex;
        slot.bg.fillStyle(isSelected ? 0x2a3a4a : 0x1a1a2a, 1);
        slot.bg.fillRoundedRect(slot.x, slot.y, 60, 40, 4);
        slot.bg.lineStyle(2, isSelected ? 0x4ecdc4 : 0x333344, 1);
        slot.bg.strokeRoundedRect(slot.x, slot.y, 60, 40, 4);
        
        // Add sprite
        const sprite = this.scene.add.image(slot.x + 30, slot.y + 20, item.sprite).setOrigin(0.5);
        sprite.setScale(0.5);
        this.container.add(sprite);
        this.slotSprites[i] = sprite;
      } else {
        // Empty slot
        slot.bg.fillStyle(0x1a1a2a, 1);
        slot.bg.fillRoundedRect(slot.x, slot.y, 60, 40, 4);
        slot.bg.lineStyle(1, 0x333344, 1);
        slot.bg.strokeRoundedRect(slot.x, slot.y, 60, 40, 4);
      }
    });
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
    }
  }
}
