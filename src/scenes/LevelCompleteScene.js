import * as Phaser from 'phaser';
import { COLORS, LEVELS } from '../utils/constants.js';

export default class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  init(data) {
    this.levelIndex = data.level || 0;
    this.guardsKilled = data.guardsKilled || 0;
    this.silentKills = data.silentKills || 0;
    this.timeTaken = data.timeTaken || 0;
  }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    const level = LEVELS[this.levelIndex];
    const isLastLevel = this.levelIndex >= LEVELS.length - 1;

    // Title
    this.add.text(cx, cy - 140, isLastLevel ? 'MISSION COMPLETE' : 'FLOOR CLEARED', {
      fontSize: '42px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(cx, cy - 90, level ? level.name : '', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#eaeaea',
    }).setOrigin(0.5).setAlpha(0);

    // Stats
    const statsText = [
      `Guards eliminated: ${this.guardsKilled}`,
      `Silent kills: ${this.silentKills}`,
      `Time: ${Math.floor(this.timeTaken / 1000)}s`,
    ].join('\n');

    this.add.text(cx, cy - 10, statsText, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaaacc',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    // Next button
    const btnLabel = isLastLevel ? 'BACK TO MENU' : 'NEXT FLOOR';
    const btnBg = this.add.rectangle(cx, cy + 80, 220, 50, COLORS.TARGET_DOOR, 0.8)
      .setStrokeStyle(2, COLORS.TARGET_DOOR)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const btnText = this.add.text(cx, cy + 80, btnLabel, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    // Animate
    const allElements = this.children.list;
    allElements.forEach((el, i) => {
      this.tweens.add({
        targets: el,
        alpha: 1,
        duration: 400,
        delay: i * 100,
      });
    });

    btnBg.on('pointerover', () => btnBg.setFillStyle(COLORS.TARGET_DOOR, 1));
    btnBg.on('pointerout', () => btnBg.setFillStyle(COLORS.TARGET_DOOR, 0.8));
    btnBg.on('pointerdown', () => {
      if (isLastLevel) {
        this.scene.start('MenuScene');
      } else {
        this.scene.start('GameScene', { level: this.levelIndex + 1 });
      }
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      if (isLastLevel) {
        this.scene.start('MenuScene');
      } else {
        this.scene.start('GameScene', { level: this.levelIndex + 1 });
      }
    });
  }
}
