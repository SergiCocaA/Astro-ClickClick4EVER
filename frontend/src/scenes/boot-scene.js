import Phaser from '../lib/phaser.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.json('animations_json', 'assets/data/animations.json');
    this.load.video('aviso', 'assets/video/aviso.mp4');
  }

  create(data) {
    this.scene.start('MenuScene', data);
  }
}
