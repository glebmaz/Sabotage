import * as Phaser from 'phaser';
import { COLORS, TILE, TILE_TYPES, LEVELS } from '../utils/constants.js';
import Guard from '../entities/Guard.js';

export default class LevelManager {
  constructor(scene) {
    this.scene = scene;
    this.currentLevel = 0;
    this.walls = null;
    this.platforms = null;
    this.oneWayPlatforms = null;
    this.shadowZones = [];
    this.guards = [];
    this.playerSpawn = { x: 0, y: 0 };
    this.targetDoor = null;
    this.shadowOverlays = [];
  }

  loadLevel(levelIndex) {
    this.currentLevel = levelIndex;
    const level = LEVELS[levelIndex];
    if (!level) return null;

    this.cleanup();

    this.walls = this.scene.physics.add.staticGroup();
    this.platforms = this.scene.physics.add.staticGroup();
    this.oneWayPlatforms = this.scene.physics.add.staticGroup();
    this.shadowZones = [];
    this.guards = [];
    this.shadowOverlays = [];

    const map = level.map;

    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const tile = map[row][col];
        const x = col * TILE.SIZE + TILE.SIZE / 2;
        const y = row * TILE.SIZE + TILE.SIZE / 2;

        switch (tile) {
          case TILE_TYPES.WALL:
            this._createWall(x, y);
            break;
          case TILE_TYPES.PLATFORM:
            this._createPlatform(x, y);
            break;
          case TILE_TYPES.SHADOW:
            this._createShadowZone(x, y);
            this._createPlatform(x, y);
            break;
          case TILE_TYPES.GUARD_R:
            this._createPlatform(x, y + TILE.SIZE);
            this.guards.push(new Guard(this.scene, x, y - 4, true));
            break;
          case TILE_TYPES.GUARD_L:
            this._createPlatform(x, y + TILE.SIZE);
            this.guards.push(new Guard(this.scene, x, y - 4, false));
            break;
          case TILE_TYPES.SPAWN:
            this.playerSpawn = { x, y: y - 4 };
            break;
          case TILE_TYPES.TARGET:
            this._createTargetDoor(x, y);
            break;
          case TILE_TYPES.DOOR:
            this._createDoor(x, y);
            break;
          case TILE_TYPES.ONE_WAY:
            this._createOneWay(x, y);
            break;
        }
      }
    }

    // World bounds
    const worldW = map[0].length * TILE.SIZE;
    const worldH = map.length * TILE.SIZE;
    this.scene.physics.world.setBounds(0, 0, worldW, worldH);

    return {
      playerSpawn: this.playerSpawn,
      guards: this.guards,
      walls: this.walls,
      platforms: this.platforms,
      oneWayPlatforms: this.oneWayPlatforms,
      shadowZones: this.shadowZones,
      targetDoor: this.targetDoor,
      worldWidth: worldW,
      worldHeight: worldH,
      levelData: level,
    };
  }

  _createWall(x, y) {
    const wall = this.scene.add.rectangle(x, y, TILE.SIZE, TILE.SIZE, COLORS.WALL);
    wall.setStrokeStyle(1, COLORS.WALL_HIGHLIGHT, 0.3);
    this.walls.add(wall);
    wall.body.setSize(TILE.SIZE, TILE.SIZE);
    wall.body.setOffset(0, 0);
  }

  _createPlatform(x, y) {
    const plat = this.scene.add.rectangle(x, y, TILE.SIZE, TILE.SIZE / 4, COLORS.FLOOR);
    plat.setStrokeStyle(1, COLORS.FLOOR_HIGHLIGHT, 0.5);
    this.platforms.add(plat);
    plat.body.setSize(TILE.SIZE, TILE.SIZE / 4);
    plat.body.setOffset(0, 0);
  }

  _createOneWay(x, y) {
    const plat = this.scene.add.rectangle(x, y, TILE.SIZE, 8, COLORS.FLOOR_HIGHLIGHT);
    this.oneWayPlatforms.add(plat);
    plat.body.setSize(TILE.SIZE, 8);
    plat.body.setOffset(0, 0);
    plat.body.checkCollision.down = false;
    plat.body.checkCollision.left = false;
    plat.body.checkCollision.right = false;
  }

  _createShadowZone(x, y) {
    const zone = new Phaser.Geom.Rectangle(
      x - TILE.SIZE / 2, y - TILE.SIZE * 2,
      TILE.SIZE, TILE.SIZE * 2
    );
    this.shadowZones.push(zone);

    // Dark overlay visual
    const overlay = this.scene.add.rectangle(
      x, y - TILE.SIZE,
      TILE.SIZE, TILE.SIZE * 2,
      COLORS.SHADOW_OVERLAY, 0.35
    );
    overlay.setDepth(2);
    this.shadowOverlays.push(overlay);
  }

  _createTargetDoor(x, y) {
    this.targetDoor = this.scene.add.rectangle(x, y - 4, 30, TILE.SIZE - 4, COLORS.TARGET_DOOR, 0.6);
    this.targetDoor.setStrokeStyle(2, COLORS.TARGET_DOOR, 1);
    this.targetDoor.setDepth(1);
    this.scene.physics.add.existing(this.targetDoor, true);

    // Pulsing glow
    this.scene.tweens.add({
      targets: this.targetDoor,
      alpha: { from: 0.4, to: 0.9 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  _createDoor(x, y) {
    const door = this.scene.add.rectangle(x, y - 4, 24, TILE.SIZE - 4, COLORS.DOOR, 0.7);
    door.setStrokeStyle(1, 0x1a5a8a, 1);
    door.setDepth(1);
  }

  isInShadow(x, y) {
    for (const zone of this.shadowZones) {
      if (zone.contains(x, y)) return true;
    }
    return false;
  }

  cleanup() {
    if (this.walls) this.walls.clear(true, true);
    if (this.platforms) this.platforms.clear(true, true);
    if (this.oneWayPlatforms) this.oneWayPlatforms.clear(true, true);
    this.guards.forEach(g => g.destroy());
    this.guards = [];
    this.shadowOverlays.forEach(o => o.destroy());
    this.shadowOverlays = [];
    this.shadowZones = [];
    if (this.targetDoor) {
      this.targetDoor.destroy();
      this.targetDoor = null;
    }
  }
}
