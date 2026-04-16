import * as Phaser from 'phaser';
import { COLORS, PHYSICS, PLAYER, WEAPONS, LEVELS } from '../utils/constants.js';
import Player from '../entities/Player.js';
import Shuriken from '../entities/Shuriken.js';
import LevelManager from '../managers/LevelManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.currentLevel = data.level || 0;
    this.guardsKilled = 0;
    this.silentKills = 0;
    this.levelStartTime = 0;
    this._completing = false;
    this._transitioned = false;
  }

  create() {
    try {
      // Clean up any leftover state from previous runs
      this._cleanup();

      this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
      this.cameras.main.fadeIn(400);

      this.levelManager = new LevelManager(this);
      this.shurikens = [];

    const levelData = this.levelManager.loadLevel(this.currentLevel);
    if (!levelData) {
      this.scene.start('MenuScene');
      return;
    }

    // Create player
    this.player = new Player(this, levelData.playerSpawn.x, levelData.playerSpawn.y);
    this.player.ammo = levelData.levelData.startAmmo;

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, levelData.worldWidth, levelData.worldHeight);

    // Collisions
    this.physics.add.collider(this.player, levelData.walls);
    this.physics.add.collider(this.player, levelData.platforms);
    this.physics.add.collider(this.player, levelData.oneWayPlatforms);

    levelData.guards.forEach(guard => {
      this.physics.add.collider(guard, levelData.walls);
      this.physics.add.collider(guard, levelData.platforms);
      this.physics.add.collider(guard, levelData.oneWayPlatforms);
    });

    // Target door overlap
    if (levelData.targetDoor) {
      this.physics.add.overlap(this.player, levelData.targetDoor, () => {
        if (!this._completing) {
          console.log('Door touched! Transitioning...');
          this._completing = true;
          this.physics.pause();
        }
      });
    }

    // Event listeners — bind with named refs so we can remove them
    this._onMelee = (data) => this._handleMelee(data);
    this._onShuriken = (data) => this._handleShuriken(data);
    this._onGuardAttack = (guard) => this._guardAttackPlayer(guard);
    this._onPlayerDied = () => this._playerDied();
    this._onGuardKilled = (data) => {
      this.guardsKilled++;
      if (data.silent) this.silentKills++;
      this._spawnKillParticles(data.x, data.y);
    };

    this.events.on('player-melee', this._onMelee);
    this.events.on('player-shuriken', this._onShuriken);
    this.events.on('guard-attack-player', this._onGuardAttack);
    this.events.on('player-died', this._onPlayerDied);
    this.events.on('guard-killed', this._onGuardKilled);

    // Register shutdown cleanup via Phaser's event system
    this.events.once('shutdown', this._cleanup, this);

    // Launch UI (stop first to ensure clean state)
    this.scene.stop('UIScene');
    this.time.delayedCall(50, () => {
      this.scene.launch('UIScene');
      this.events.emit('set-level-info', {
        name: levelData.levelData.name,
        health: this.player.health,
        ammo: this.player.ammo,
      });
    });

    // Level subtitle flash
    this._showSubtitle(levelData.levelData.subtitle);

    this.levelStartTime = this.time.now;
    console.log('GameScene create() completed for level', this.currentLevel);
    } catch (err) {
      console.error('GameScene create() ERROR:', err);
      // Show error on screen
      this.add.text(640, 360, 'ERROR: ' + err.message, {
        fontSize: '20px', fontFamily: 'monospace', color: '#ff0000',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(999);
    }
  }

  _cleanup() {
    // Remove custom event listeners
    this.events.off('player-melee', this._onMelee);
    this.events.off('player-shuriken', this._onShuriken);
    this.events.off('guard-attack-player', this._onGuardAttack);
    this.events.off('player-died', this._onPlayerDied);
    this.events.off('guard-killed', this._onGuardKilled);
    this.events.off('shutdown', this._cleanup, this);

    // Only clean level manager state (not physics objects — Phaser handles those on shutdown)
    if (this.levelManager) {
      this.levelManager.guards = [];
      this.levelManager.shadowZones = [];
      this.levelManager.shadowOverlays = [];
      this.levelManager = null;
    }
    this.shurikens = [];
  }

  update(time, delta) {
    if (!this.player || !this.player.alive) return;

    // Handle level complete transition outside physics step
    if (this._completing) {
      if (!this._transitioned) {
        this._transitioned = true;
        this._levelComplete();
      }
      return;
    }

    this.player.update(time, delta);

    // Shadow detection
    this.player.inShadow = this.levelManager.isInShadow(this.player.x, this.player.y);

    // Update guards
    let maxDetection = 0;
    this.levelManager.guards.forEach(guard => {
      guard.update(time, delta, this.player);
      if (guard.detection > maxDetection) maxDetection = guard.detection;
    });

    // Update shurikens
    for (let i = this.shurikens.length - 1; i >= 0; i--) {
      const s = this.shurikens[i];
      if (!s.active) {
        this.shurikens.splice(i, 1);
        continue;
      }
      s.update(time, delta);
    }

    // Emit UI updates
    this.events.emit('update-ammo', this.player.ammo);
    this.events.emit('update-detection', maxDetection);

    // Silent kill check
    if (Phaser.Input.Keyboard.JustDown(this.player.keys.attack)) {
      this._checkSilentKill();
    }
  }

  _handleMelee(data) {
    if (!this.levelManager) return;
    this.levelManager.guards.forEach(guard => {
      if (guard.state === 'dead') return;
      const dist = Phaser.Math.Distance.Between(data.x, data.y, guard.x, guard.y);
      if (dist < data.range + 16) {
        guard.takeDamage(data.damage);
      }
    });
  }

  _handleShuriken(data) {
    if (!this.levelManager) return;
    const shuriken = new Shuriken(this, data.x, data.y, data.facing);
    this.shurikens.push(shuriken);

    this.physics.add.collider(shuriken, this.levelManager.walls, (s) => {
      if (s.active) s.kill();
    });

    this.levelManager.guards.forEach(guard => {
      this.physics.add.overlap(shuriken, guard, (s, g) => {
        if (g.state !== 'dead' && s.active) {
          g.takeDamage(s.damage);
          s.kill();
        }
      });
    });
  }

  _checkSilentKill() {
    if (!this.player.inShadow && this.player.visible_) return;

    this.levelManager.guards.forEach(guard => {
      if (guard.state === 'dead') return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, guard.x, guard.y);
      if (dist < PLAYER.SILENT_KILL_RANGE && guard.isBehind(this.player)) {
        guard.silentKill();
      }
    });
  }

  _guardAttackPlayer(guard) {
    if (!this.player || !this.player.alive) return;
    if (guard._lastAttack && this.time.now - guard._lastAttack < 1000) return;
    guard._lastAttack = this.time.now;
    this.player.takeDamage(15);
  }

  _levelComplete() {
    console.log('_levelComplete called, starting LevelCompleteScene');
    try {
      this.scene.stop('UIScene');
      this.scene.start('LevelCompleteScene', {
        level: this.currentLevel,
        guardsKilled: this.guardsKilled,
        silentKills: this.silentKills,
        timeTaken: this.time.now - this.levelStartTime,
      });
    } catch (err) {
      console.error('_levelComplete ERROR:', err);
    }
  }

  _playerDied() {
    if (this._completing) return;
    this._completing = true;
    this.physics.pause();

    this.time.delayedCall(500, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { level: this.currentLevel });
    });
  }

  _showSubtitle(text) {
    if (!text) return;
    const sub = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 80,
      text,
      { fontSize: '24px', fontFamily: 'monospace', color: '#7a7a9a' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.tweens.add({
      targets: sub,
      alpha: 0,
      y: sub.y - 30,
      duration: 2000,
      delay: 1000,
      onComplete: () => sub.destroy(),
    });
  }

  _spawnKillParticles(x, y) {
    const gfx = this.add.graphics();
    for (let i = 0; i < 8; i++) {
      const px = x + Phaser.Math.Between(-12, 12);
      const py = y + Phaser.Math.Between(-12, 12);
      gfx.fillStyle(COLORS.PARTICLE, 0.7);
      gfx.fillCircle(px, py, Phaser.Math.Between(2, 4));
    }
    this.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 500,
      onComplete: () => gfx.destroy(),
    });
  }
}
