import Phaser from '../lib/phaser.js';

export class VideoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VideoScene' });
  }

  create(data) {
    this.cameras.main.setBackgroundColor('#000000');
    
    const video = this.add.video(this.scale.width / 2, this.scale.height / 2, 'aviso');
    
    // Scale the video to fit the screen
    const updateScale = () => {
      const scaleX = this.scale.width / video.width;
      const scaleY = this.scale.height / video.height;
      const scale = Math.min(scaleX, scaleY);
      video.setScale(scale);
    };

    video.on('play', updateScale);
    
    // Play the video
    video.play();

    // When the video ends, transition to the BriefingScene
    video.on('complete', () => {
      this.scene.start('BriefingScene', data);
    });

    // Also allow skipping with a click
    this.input.on('pointerdown', () => {
      video.stop();
      this.scene.start('BriefingScene', data);
    });
  }
}
