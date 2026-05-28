import { InputComponent } from './input-component.js';
import * as CONFIG from '../../config.js';

export class BotHunterInputComponent extends InputComponent {
  #gameObject;
  #playerRef;

  constructor(gameObject, playerRef) {
    super();
    this.#gameObject = gameObject;
    this.#playerRef = playerRef;
    this._down = true;
    this._shoot = true;
  }

  set playerRef(ref) {
    this.#playerRef = ref;
  }

  update() {
    if (!this.#playerRef || !this.#playerRef.active) return;
    const diff = this.#playerRef.x - this.#gameObject.x;
    if (Math.abs(diff) > 5) {
      this.#gameObject.x += Math.sign(diff) * CONFIG.ENEMY_HUNTER_HORIZONTAL_SPEED;
    }
  }
}
