import Phaser from '../../lib/phaser.js';
import { InputComponent } from './input-component.js';
import * as CONFIG from '../../config.js';

export class BotScoutInputComponent extends InputComponent {
  #gameObject;
  #startX;
  #startY;
  #elapsed;

  constructor(gameObject) {
    super();
    this.#gameObject = gameObject;
    this.#startX = gameObject.x;
    this.#startY = gameObject.y;
    this.#elapsed = 0;
    this._down = true;
  }

  set startX(val) {
    this.#startX = val;
    this.#startY = this.#gameObject.y;
    this.#elapsed = 0;
  }

  update() {
    this.#elapsed += 0.05;
    this.#gameObject.x = this.#startX + Math.sin(this.#elapsed) * CONFIG.ENEMY_SCOUT_MOVEMENT_MAX_X;
  }
}
