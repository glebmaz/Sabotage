import * as Phaser from 'phaser';
import { COLORS, PHYSICS, GUARD } from '../utils/constants.js';

const STATE = { IDLE: 'idle', PATROL: 'patrol', SUSPICIOUS: 'suspicious', ALERT: 'alert', DEAD: 'dead' };

export default class Guard extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, facingRight = true) {
    super(scene, x, y, '__DEFAULT');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(20, 36);
    this.setOffset(6, 4);
    this.body.setMaxVelocity(PHYSICS.GUARD_CHASE_SPEED, 600);

    this.health = 50;
    this.facing = facingRight ? 1 : -1;
    this.setFlipX(!facingRight);

    this.state = STATE.PATROL;
    this.stateTimer = 0;
    this.detection = 0; // 0-100
    this.patrolOriginX = x;
    this.patrolRange = 120;
    this.patrolDir = this.facing;
    this.alertTarget = null;
    this.lastKnownPlayerPos = null;

    // Vision cone graphics
    this.visionGfx = scene.add.graphics();
    this.visionGfx.setDepth(5);

    this._drawBody();
  }

  _drawBody() {
    if (!this.scene.textures.exists('guard')) {
      const gfx = this.scene.add.graphics();
      const w = 28, h = 40;

      // Legs
      gfx.fillStyle(0x2a4a6a, 1);
      gfx.fillRect(7, 30, 5, 10);
      gfx.fillRect(16, 30, 5, 10);

      // Body (armored vest)
      gfx.fillStyle(0x3a5a8a, 1);
      gfx.fillRoundedRect(5, 14, 18, 18, 3);
      // Vest detail
      gfx.fillStyle(0x4a6a9a, 1);
      gfx.fillRect(9, 16, 10, 3);
      gfx.fillRect(9, 22, 10, 3);

      // Arms
      gfx.fillStyle(0x2a4a6a, 1);
      gfx.fillRect(1, 16, 5, 14);
      gfx.fillRect(22, 16, 5, 14);

      // Hands (holding weapon)
      gfx.fillStyle(0xd4a574, 1);
      gfx.fillCircle(3, 30, 2);
      gfx.fillCircle(25, 30, 2);

      // Head
      gfx.fillStyle(0xd4a574, 1);
      gfx.fillCircle(14, 8, 7);

      // Helmet
      gfx.fillStyle(0x2a3a5a, 1);
      gfx.fillRoundedRect(6, 0, 16, 10, 4);
      // Visor
      gfx.fillStyle(0x88ccff, 0.6);
      gfx.fillRect(8, 5, 12, 4);

      // Baton in hand
      gfx.lineStyle(2, 0x666666, 0.8);
      gfx.beginPath();
      gfx.moveTo(24, 24);
      gfx.lineTo(28, 34);
      gfx.strokePath();

      gfx.generateTexture('guard', w, h);
      gfx.destroy();
    }
    this.setTexture('guard');
  }

  update(time, delta, player) {
    if (this.state === STATE.DEAD) return;

    const dt = delta / 1000;
    this.stateTimer -= delta;

    const canSeePlayer = this._canSeePlayer(player);

    // Update detection meter
    if (canSeePlayer && player.visible_) {
      this.detection = Math.min(100, this.detection + GUARD.DETECTION_RATE * delta / 16);
    } else {
      this.detection = Math.max(0, this.detection - GUARD.DETECTION_DECAY * delta / 16);
    }

    // State transitions based on detection
    if (this.detection >= 100 && this.state !== STATE.ALERT) {
      this.setState(STATE.ALERT);
      this.alertTarget = player;
    } else if (this.detection >= 40 && this.state === STATE.PATROL) {
      this.setState(STATE.SUSPICIOUS);
    } else if (this.detection < 10 && this.state === STATE.SUSPICIOUS) {
      this.setState(STATE.PATROL);
    }

    // Behavior per state
    switch (this.state) {
      case STATE.PATROL:
        this._doPatrol(dt);
        break;
      case STATE.SUSPICIOUS:
        this._doSuspicious(player, dt);
        break;
      case STATE.ALERT:
        this._doAlert(player, dt);
        break;
    }

    this._drawVisionCone();
  }

  setState(newState) {
    this.state = newState;
    switch (newState) {
      case STATE.SUSPICIOUS:
        this.stateTimer = GUARD.SUSPICIOUS_TIME;
        this.setVelocityX(0);
        break;
      case STATE.ALERT:
        this.stateTimer = GUARD.ALERT_TIME;
        break;
      case STATE.PATROL:
        this.stateTimer = 0;
        break;
    }
  }

  _doPatrol(dt) {
    const speed = PHYSICS.GUARD_SPEED;
    this.setVelocityX(this.patrolDir * speed);

    if (Math.abs(this.x - this.patrolOriginX) > this.patrolRange) {
      this.patrolDir *= -1;
      this.facing = this.patrolDir;
      this.setFlipX(this.facing === -1);
    }
  }

  _doSuspicious(player, dt) {
    // Turn toward player
    this.facing = player.x > this.x ? 1 : -1;
    this.setFlipX(this.facing === -1);
    this.setVelocityX(0);

    // Slowly approach
    if (this.stateTimer <= 0) {
      if (this.detection >= 40) {
        this.setState(STATE.ALERT);
        this.alertTarget = player;
      } else {
        this.setState(STATE.PATROL);
      }
    }
  }

  _doAlert(player, dt) {
    this.alertTarget = player;
    const dir = player.x > this.x ? 1 : -1;
    this.facing = dir;
    this.setFlipX(this.facing === -1);
    this.setVelocityX(dir * PHYSICS.GUARD_CHASE_SPEED);
    this.lastKnownPlayerPos = { x: player.x, y: player.y };

    // Attack if close
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist < 40) {
      this.scene.events.emit('guard-attack-player', this);
    }

    // Calm down timer
    if (!this._canSeePlayer(player) || !player.visible_) {
      if (this.stateTimer <= 0) {
        this.detection = 30;
        this.setState(STATE.SUSPICIOUS);
      }
    } else {
      this.stateTimer = GUARD.ALERT_TIME;
    }
  }

  _canSeePlayer(player) {
    if (!player || !player.alive) return false;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist > GUARD.SIGHT_RANGE) return false;

    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const facingAngle = this.facing === 1 ? 0 : Math.PI;
    let diff = Math.abs(angle - facingAngle);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;

    return diff < GUARD.SIGHT_ANGLE;
  }

  _drawVisionCone() {
    this.visionGfx.clear();
    if (this.state === STATE.DEAD) return;

    let color, alpha;
    switch (this.state) {
      case STATE.ALERT:
        color = COLORS.GUARD_ALERT; alpha = 0.25; break;
      case STATE.SUSPICIOUS:
        color = COLORS.GUARD_SUSPICIOUS; alpha = 0.2; break;
      default:
        color = COLORS.GUARD_IDLE; alpha = 0.12; break;
    }

    const range = GUARD.SIGHT_RANGE;
    const halfAngle = GUARD.SIGHT_ANGLE;
    const baseAngle = this.facing === 1 ? 0 : Math.PI;

    this.visionGfx.fillStyle(color, alpha);
    this.visionGfx.beginPath();
    this.visionGfx.moveTo(this.x, this.y);

    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const a = baseAngle - halfAngle + (2 * halfAngle * i / steps);
      this.visionGfx.lineTo(
        this.x + Math.cos(a) * range,
        this.y + Math.sin(a) * range
      );
    }

    this.visionGfx.closePath();
    this.visionGfx.fillPath();
  }

  takeDamage(amount) {
    if (this.state === STATE.DEAD) return;
    this.health -= amount;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.state !== STATE.DEAD) this.clearTint();
    });

    if (this.health <= 0) {
      this.die();
    } else {
      this.setState(STATE.ALERT);
      this.detection = 100;
    }
  }

  silentKill() {
    this.health = 0;
    this.die(true);
  }

  die(silent = false) {
    this.state = STATE.DEAD;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.visionGfx.clear();

    if (!silent) {
      this.scene.cameras.main.shake(60, 0.005);
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      angle: 90,
      y: this.y + 10,
      duration: 300,
    });

    // Emit particles
    this.scene.events.emit('guard-killed', { x: this.x, y: this.y, silent });
  }

  isBehind(player) {
    // Check if player is behind this guard
    const dx = player.x - this.x;
    return (this.facing === 1 && dx < 0) || (this.facing === -1 && dx > 0);
  }

  destroy() {
    if (this.visionGfx) this.visionGfx.destroy();
    super.destroy();
  }
}
