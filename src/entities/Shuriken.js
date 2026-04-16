import * as Phaser from 'phaser';
import { COLORS, PHYSICS, WEAPONS } from '../utils/constants.js';

export default class Shuriken extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, facing) {
    super(scene, x, y, '__DEFAULT');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setSize(12, 12);
    this.damage = WEAPONS.SHURIKEN.damage;
    this.speed = PHYSICS.SHURIKEN_SPEED;
    this.facing = facing;

    this._drawBody();

    this.setVelocityX(this.speed * facing);

    // Auto-destroy after distance
    this.scene.time.delayedCall(1200, () => {
      if (this.active) this.kill();
    });
  }

  _drawBody() {
    if (!this.scene.textures.exists('shuriken')) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(COLORS.SHURIKEN, 1);
      // 4-point star shape
      const cx = 8, cy = 8, r = 7, ri = 2;
      gfx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i - Math.PI / 4;
        gfx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        const innerAngle = angle + Math.PI / 4;
        gfx.lineTo(cx + Math.cos(innerAngle) * ri, cy + Math.sin(innerAngle) * ri);
      }
      gfx.closePath();
      gfx.fillPath();
      gfx.generateTexture('shuriken', 16, 16);
      gfx.destroy();
    }
    this.setTexture('shuriken');
  }

  update(time, delta) {
    // Spin
    this.angle += this.facing * 15;

    // Destroy if off screen
    if (this.x < this.scene.cameras.main.scrollX - 50 ||
        this.x > this.scene.cameras.main.scrollX + this.scene.cameras.main.width + 50) {
      this.kill();
    }
  }

  kill() {
    // Impact particles
    this._spawnImpact();
    this.destroy();
  }

  _spawnImpact() {
    const particles = this.scene.add.graphics();
    for (let i = 0; i < 5; i++) {
      const px = this.x + Phaser.Math.Between(-8, 8);
      const py = this.y + Phaser.Math.Between(-8, 8);
      particles.fillStyle(COLORS.SHURIKEN, 0.8);
      particles.fillCircle(px, py, 2);
    }
    this.scene.tweens.add({
      targets: particles,
      alpha: 0,
      duration: 200,
      onComplete: () => particles.destroy(),
    });
  }
}
