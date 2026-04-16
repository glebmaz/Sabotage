import * as Phaser from 'phaser';
import { COLORS, PHYSICS, WEAPONS, PLAYER } from '../utils/constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, '__DEFAULT');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(20, 36);
    this.setOffset(10, 4);
    this.body.setMaxVelocity(PHYSICS.PLAYER_SPEED, 600);

    this.health = PLAYER.MAX_HEALTH;
    this.alive = true;
    this.facing = 1; // 1 = right, -1 = left

    // Stealth
    this.inShadow = false;
    this.crouching = false;
    this.visible_ = true; // whether guards can see us

    // Weapons
    this.currentWeapon = 'KATANA';
    this.ammo = 0;
    this.weaponCooldown = 0;

    // Wall slide
    this.touchingWall = 0; // -1 left, 0 none, 1 right
    this.wallSliding = false;

    // Invincibility frames
    this.invincible = false;
    this.invTimer = 0;

    // Draw ninja graphic
    this._drawBody();

    // Input
    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      shuriken: Phaser.Input.Keyboard.KeyCodes.K,
      switchWeapon: Phaser.Input.Keyboard.KeyCodes.Q,
    });

    this.arrowKeys = scene.input.keyboard.createCursorKeys();
  }

  _drawBody() {
    if (!this.scene.textures.exists('ninja')) {
      const gfx = this.scene.add.graphics();
      const w = 28, h = 40;

      // Legs
      gfx.fillStyle(0x1a1a1a, 1);
      gfx.fillRect(6, 30, 5, 10);
      gfx.fillRect(17, 30, 5, 10);

      // Body
      gfx.fillStyle(0x2a2a2a, 1);
      gfx.fillRoundedRect(5, 14, 18, 18, 3);

      // Arms
      gfx.fillStyle(0x1a1a1a, 1);
      gfx.fillRect(1, 16, 5, 12);
      gfx.fillRect(22, 16, 5, 12);

      // Head
      gfx.fillStyle(0x3a3a3a, 1);
      gfx.fillCircle(14, 8, 8);

      // Headband
      gfx.fillStyle(COLORS.PLAYER_ACCENT, 1);
      gfx.fillRect(6, 5, 16, 3);
      // Headband tail
      gfx.fillStyle(COLORS.PLAYER_ACCENT, 0.8);
      gfx.fillRect(22, 4, 6, 2);
      gfx.fillRect(24, 6, 4, 2);

      // Eyes
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(16, 7, 3, 2);

      // Katana on back (diagonal line)
      gfx.lineStyle(2, 0x888888, 0.6);
      gfx.beginPath();
      gfx.moveTo(8, 28);
      gfx.lineTo(18, 10);
      gfx.strokePath();

      gfx.generateTexture('ninja', w, h);
      gfx.destroy();
    }
    this.setTexture('ninja');
  }

  update(time, delta) {
    if (!this.alive) return;

    const dt = delta / 1000;
    this.weaponCooldown = Math.max(0, this.weaponCooldown - delta);

    if (this.invincible) {
      this.invTimer -= delta;
      this.setAlpha(Math.sin(time * 0.02) > 0 ? 1 : 0.3);
      if (this.invTimer <= 0) {
        this.invincible = false;
        this.setAlpha(1);
      }
    }

    const onFloor = this.body.blocked.down;
    const left = this.keys.left.isDown || this.arrowKeys.left.isDown;
    const right = this.keys.right.isDown || this.arrowKeys.right.isDown;
    const down = this.keys.down.isDown || this.arrowKeys.down.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
                        Phaser.Input.Keyboard.JustDown(this.arrowKeys.up);

    // Crouch
    this.crouching = down && onFloor;
    const speed = this.crouching ? PHYSICS.PLAYER_CROUCH_SPEED : PHYSICS.PLAYER_SPEED;

    // Horizontal movement
    if (left) {
      this.setVelocityX(-speed);
      this.facing = -1;
      this.setFlipX(true);
    } else if (right) {
      this.setVelocityX(speed);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Wall detection
    this.touchingWall = 0;
    if (this.body.blocked.left && !onFloor) this.touchingWall = -1;
    if (this.body.blocked.right && !onFloor) this.touchingWall = 1;

    // Wall slide
    this.wallSliding = this.touchingWall !== 0 && this.body.velocity.y > 0;
    if (this.wallSliding) {
      this.body.velocity.y = Math.min(this.body.velocity.y, PHYSICS.PLAYER_WALL_SLIDE);
    }

    // Jump / wall jump
    if (jumpPressed) {
      if (onFloor) {
        this.setVelocityY(PHYSICS.PLAYER_JUMP);
      } else if (this.touchingWall !== 0) {
        this.setVelocityY(PHYSICS.PLAYER_WALL_JUMP_Y);
        this.setVelocityX(-this.touchingWall * PHYSICS.PLAYER_WALL_JUMP_X);
        this.facing = -this.touchingWall;
        this.setFlipX(this.facing === -1);
      }
    }

    // Scale for crouch visual
    this.setScale(1, this.crouching ? 0.7 : 1);
    if (this.crouching) {
      this.setSize(20, 26);
    } else {
      this.setSize(20, 36);
    }

    // Visibility: hidden in shadow + crouching or just in shadow and still
    const isStill = Math.abs(this.body.velocity.x) < 10;
    this.visible_ = !(this.inShadow && (this.crouching || isStill));

    // Attack inputs
    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
      this.meleeAttack();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.shuriken)) {
      this.rangedAttack();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.switchWeapon)) {
      this.switchWeapon();
    }
  }

  meleeAttack() {
    if (this.weaponCooldown > 0) return;
    const weapon = this.currentWeapon === 'KATANA' ? WEAPONS.KATANA : WEAPONS.KNIFE;
    this.weaponCooldown = weapon.cooldown;
    this.scene.events.emit('player-melee', {
      x: this.x + this.facing * weapon.range,
      y: this.y,
      damage: weapon.damage,
      range: weapon.range,
      facing: this.facing,
    });
    this._showSlash(weapon);
  }

  rangedAttack() {
    if (this.weaponCooldown > 0 || this.ammo <= 0) return;
    this.ammo--;
    this.weaponCooldown = WEAPONS.SHURIKEN.cooldown;
    this.scene.events.emit('player-shuriken', {
      x: this.x + this.facing * 16,
      y: this.y - 4,
      facing: this.facing,
    });
  }

  switchWeapon() {
    this.currentWeapon = this.currentWeapon === 'KATANA' ? 'KNIFE' : 'KATANA';
    this.scene.events.emit('weapon-switched', this.currentWeapon);
  }

  _showSlash(weapon) {
    const slash = this.scene.add.graphics();
    const sx = this.x + this.facing * 20;
    const sy = this.y - 8;
    slash.lineStyle(3, weapon === WEAPONS.KATANA ? COLORS.KATANA : COLORS.KNIFE, 1);
    slash.beginPath();
    slash.arc(sx, sy, weapon.range, -0.8, 0.8, false);
    slash.strokePath();
    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 150,
      onComplete: () => slash.destroy(),
    });
  }

  takeDamage(amount) {
    if (this.invincible || !this.alive) return;
    this.health -= amount;
    this.invincible = true;
    this.invTimer = 800;
    this.scene.cameras.main.shake(100, 0.01);
    this.scene.events.emit('player-damaged', this.health);
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.alive = false;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: 90,
      duration: 500,
      onComplete: () => {
        this.scene.events.emit('player-died');
      },
    });
  }
}
