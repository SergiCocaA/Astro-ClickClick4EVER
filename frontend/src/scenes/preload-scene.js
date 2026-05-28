import Phaser from '../lib/phaser.js';
import { RadarCanvas } from '../objects/ui/radar-canvas.js';

/**
 * Responsible for loading all additional assets that are required in the `GameScene`
 * state of our game. This class will also construct all of the animations that are
 * used in the game.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  /**
   * @returns {void}
   */
  preload() {
    this.load.pack('asset_pack', 'assets/data/assets.json');
  }

  /**
   * @returns {void}
   */
  create() {
    RadarCanvas.hide();
    this.#createAnimations();
    const data = this.scene.settings.data || {};
    this.scene.start('GameScene', data);
  }

  /**
   * @returns {void}
   */
  #createAnimations() {
    /** @type {import("../types/typedef").AssetJson} */
    const data = this.cache.json.get('animations_json');
    data.forEach((animation) => {
      if (this.anims.exists(animation.key)) return;
      const frames = animation.frames
        ? this.anims.generateFrameNumbers(animation.assetKey, { frames: animation.frames })
        : this.anims.generateFrameNumbers(animation.assetKey);
      this.anims.create({
        key: animation.key,
        frames: frames,
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      });
    });
  }
}
