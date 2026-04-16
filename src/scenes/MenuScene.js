import * as Phaser from 'phaser';
import { COLORS, LEVELS } from '../utils/constants.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    // Ambient particles
    this._createAmbientParticles();

    // Title
    const title = this.add.text(cx, cy - 120, 'SABOTAGE', {
      fontSize: '64px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const subtitle = this.add.text(cx, cy - 60, 'A Ninja Infiltration', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#eaeaea',
    }).setOrigin(0.5).setAlpha(0);

    // Start button
    const btnBg = this.add.rectangle(cx, cy + 40, 220, 50, COLORS.PLAYER_ACCENT, 0.8)
      .setStrokeStyle(2, COLORS.PLAYER_ACCENT)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const btnText = this.add.text(cx, cy + 40, 'START MISSION', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    // Controls info
    const controls = this.add.text(cx, cy + 130, [
      'WASD / Arrows — Move & Jump',
      'SPACE — Jump',
      'J — Melee Attack    K — Throw Shuriken',
      'Q — Switch Weapon    S — Crouch (hide in shadows)',
    ].join('\n'), {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#7a7a9a',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    // Animate in
    this.tweens.add({ targets: title, alpha: 1, y: cy - 130, duration: 600, ease: 'Back.easeOut' });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 600, delay: 200 });
    this.tweens.add({ targets: [btnBg, btnText], alpha: 1, duration: 400, delay: 500 });
    this.tweens.add({ targets: controls, alpha: 1, duration: 400, delay: 700 });

    // Button hover
    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(COLORS.PLAYER_ACCENT, 1);
      this.tweens.add({ targets: btnBg, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(COLORS.PLAYER_ACCENT, 0.8);
      this.tweens.add({ targets: btnBg, scaleX: 1, scaleY: 1, duration: 100 });
    });
    btnBg.on('pointerdown', () => {
      this.scene.start('GameScene', { level: 0 });
    });

    // Keyboard start
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { level: 0 });
    });
  }

  _createAmbientParticles() {
    const gfx = this.add.graphics();
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, 1280);
      const y = Phaser.Math.Between(0, 720);
      const r = Phaser.Math.FloatBetween(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.05, 0.15);
      gfx.fillStyle(COLORS.PARTICLE, alpha);
      gfx.fillCircle(x, y, r);
    }
    this.tweens.add({
      targets: gfx,
      alpha: { from: 0.5, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });
  }
}
