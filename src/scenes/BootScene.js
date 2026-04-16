import * as Phaser from 'phaser';
import { COLORS } from '../utils/constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    this.scene.start('PreloadScene');
  }
}
