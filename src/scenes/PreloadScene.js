import * as Phaser from 'phaser';
import { COLORS } from '../utils/constants.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    // Simple loading text with animation
    const text = this.add.text(cx, cy, 'SABOTAGE', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#e94560',
    }).setOrigin(0.5);

    const sub = this.add.text(cx, cy + 50, 'Loading...', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#eaeaea',
    }).setOrigin(0.5);

    // Simulate a brief load then go to menu
    this.tweens.add({
      targets: [text, sub],
      alpha: { from: 0, to: 1 },
      duration: 600,
      onComplete: () => {
        this.time.delayedCall(400, () => {
          this.scene.start('MenuScene');
        });
      },
    });
  }
}
