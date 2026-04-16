import * as Phaser from 'phaser';
import { COLORS } from '../utils/constants.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.levelIndex = data.level || 0;
  }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.cameras.main.setBackgroundColor(0x0a0008);

    // Title
    const title = this.add.text(cx, cy - 80, 'MISSION FAILED', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const sub = this.add.text(cx, cy - 30, 'The ninja has fallen...', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#7a5a6a',
    }).setOrigin(0.5).setAlpha(0);

    // Retry button
    const retryBg = this.add.rectangle(cx, cy + 50, 200, 50, COLORS.PLAYER_ACCENT, 0.8)
      .setStrokeStyle(2, COLORS.PLAYER_ACCENT)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const retryText = this.add.text(cx, cy + 50, 'RETRY', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    // Menu button
    const menuBg = this.add.rectangle(cx, cy + 115, 200, 40, 0x333355, 0.8)
      .setStrokeStyle(1, 0x555577)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const menuText = this.add.text(cx, cy + 115, 'MAIN MENU', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaaacc',
    }).setOrigin(0.5).setAlpha(0);

    // Animate in
    [title, sub, retryBg, retryText, menuBg, menuText].forEach((el, i) => {
      this.tweens.add({ targets: el, alpha: 1, duration: 300, delay: i * 100 });
    });

    retryBg.on('pointerover', () => retryBg.setFillStyle(COLORS.PLAYER_ACCENT, 1));
    retryBg.on('pointerout', () => retryBg.setFillStyle(COLORS.PLAYER_ACCENT, 0.8));
    retryBg.on('pointerdown', () => {
      this.scene.start('GameScene', { level: this.levelIndex });
    });

    menuBg.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Keyboard retry
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { level: this.levelIndex });
    });
  }
}
