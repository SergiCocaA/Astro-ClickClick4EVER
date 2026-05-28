import Phaser from '../lib/phaser.js';
import { CUSTOM_EVENTS, EventBusComponent } from '../components/events/event-bus-component.js';

export class AudioManager {
  #scene;
  #eventBusComponent;
  #bgMusic;

  constructor(scene, eventBusComponent) {
    this.#scene = scene;
    this.#eventBusComponent = eventBusComponent;

    if (this.#scene.sound.get('bg')) {
      this.#scene.sound.get('bg').stop();
    }
    this.#bgMusic = this.#scene.sound.add('bg', { volume: 0.6, loop: true });
    this.#bgMusic.play();

    this.#eventBusComponent.on(CUSTOM_EVENTS.ENEMY_DESTROYED, () => {
      this.#scene.sound.play('explosion', { volume: 0.6 });
    });
    this.#eventBusComponent.on(CUSTOM_EVENTS.PLAYER_DESTROYED, () => {
      this.#scene.sound.play('explosion', { volume: 0.6 });
    });
    this.#eventBusComponent.on(CUSTOM_EVENTS.SHIP_HIT, () => {
      this.#scene.sound.play('hit', { volume: 0.6 });
    });
    this.#eventBusComponent.on(CUSTOM_EVENTS.SHIP_SHOOT, () => {
      this.#scene.sound.play('shot1', { volume: 0.05 });
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.#bgMusic) this.#bgMusic.stop();
    });
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => {
      if (this.#bgMusic) this.#bgMusic.stop();
    });
  }
}
