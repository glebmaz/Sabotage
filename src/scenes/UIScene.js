import * as Phaser from 'phaser';
import { COLORS } from '../utils/constants.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.healthBar = null;
    this.healthBg = null;
    this.ammoText = null;
    this.weaponText = null;
    this.detectionBar = null;
    this.detectionBg = null;
    this.levelText = null;

    this._createHUD();

    // Listen for events from GameScene — store refs for cleanup
    const gameScene = this.scene.get('GameScene');
    this._gameScene = gameScene;

    this._onDamaged = (health) => this._updateHealth(health);
    this._onAmmo = (ammo) => {
      if (this.ammoText && this.ammoText.active) this.ammoText.setText(`★ ${ammo}`);
    };
    this._onWeapon = (weapon) => {
      if (this.weaponText && this.weaponText.active) this.weaponText.setText(weapon);
    };
    this._onDetection = (level) => this._updateDetection(level);
    this._onLevelInfo = (data) => {
      if (this.levelText && this.levelText.active) this.levelText.setText(`${data.name}`);
      this._updateHealth(data.health);
      if (this.ammoText && this.ammoText.active) this.ammoText.setText(`★ ${data.ammo}`);
    };

    gameScene.events.on('player-damaged', this._onDamaged);
    gameScene.events.on('update-ammo', this._onAmmo);
    gameScene.events.on('weapon-switched', this._onWeapon);
    gameScene.events.on('update-detection', this._onDetection);
    gameScene.events.on('set-level-info', this._onLevelInfo);

    // Clean up listeners when UIScene shuts down
    this.events.once('shutdown', this._cleanupListeners, this);
  }

  _cleanupListeners() {
    if (this._gameScene) {
      this._gameScene.events.off('player-damaged', this._onDamaged);
      this._gameScene.events.off('update-ammo', this._onAmmo);
      this._gameScene.events.off('weapon-switched', this._onWeapon);
      this._gameScene.events.off('update-detection', this._onDetection);
      this._gameScene.events.off('set-level-info', this._onLevelInfo);
      this._gameScene = null;
    }
  }

  _createHUD() {
    const pad = 16;

    // Health
    this.add.text(pad, pad, 'HP', {
      fontSize: '14px', fontFamily: 'monospace', color: '#e94560',
    });
    this.healthBg = this.add.rectangle(pad + 30, pad + 7, 120, 12, COLORS.HEALTH_BG)
      .setOrigin(0, 0.5).setStrokeStyle(1, 0x333355);
    this.healthBar = this.add.rectangle(pad + 30, pad + 7, 120, 12, COLORS.HEALTH_BAR)
      .setOrigin(0, 0.5);

    // Ammo
    this.ammoText = this.add.text(pad + 170, pad, '★ 0', {
      fontSize: '16px', fontFamily: 'monospace', color: '#c0c0c0',
    });

    // Weapon
    this.weaponText = this.add.text(pad + 230, pad, 'KATANA', {
      fontSize: '14px', fontFamily: 'monospace', color: '#7a7aaa',
    });

    // Detection bar
    this.add.text(pad, pad + 26, 'DET', {
      fontSize: '12px', fontFamily: 'monospace', color: '#4a6fa5',
    });
    this.detectionBg = this.add.rectangle(pad + 30, pad + 33, 120, 8, COLORS.HEALTH_BG)
      .setOrigin(0, 0.5).setStrokeStyle(1, 0x333355);
    this.detectionBar = this.add.rectangle(pad + 30, pad + 33, 0, 8, COLORS.DETECTION_LOW)
      .setOrigin(0, 0.5);

    // Level name
    this.levelText = this.add.text(1280 - pad, pad, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#eaeaea',
    }).setOrigin(1, 0);
  }

  _updateHealth(health) {
    const w = Math.max(0, (health / 100) * 120);
    this.healthBar.width = w;
    if (health < 30) {
      this.healthBar.setFillStyle(0xff2222);
    } else {
      this.healthBar.setFillStyle(COLORS.HEALTH_BAR);
    }
  }

  _updateDetection(level) {
    const w = Math.max(0, (level / 100) * 120);
    this.detectionBar.width = w;
    if (level > 70) {
      this.detectionBar.setFillStyle(COLORS.DETECTION_HIGH);
    } else if (level > 35) {
      this.detectionBar.setFillStyle(COLORS.DETECTION_MED);
    } else {
      this.detectionBar.setFillStyle(COLORS.DETECTION_LOW);
    }
  }
}
