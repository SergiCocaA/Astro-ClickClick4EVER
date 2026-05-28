import Phaser from "../lib/phaser.js";
import { CUSTOM_EVENTS } from "../components/events/event-bus-component.js";
import * as CONFIG from "../config.js";

export const POWERUP_TYPES = {
  TRIPLE_SHOT: "triple_shot",
};

export class PowerUp extends Phaser.GameObjects.Container {
  #type;
  #sprite;

  constructor(scene, x, y, type) {
    super(scene, x, y, []);
    this.#type = type;
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.body.setSize(20, 20);
    this.body.setOffset(-10, -10);

    const colors = { triple_shot: 0x00ffcc };
    const labels = { triple_shot: "T" };
    const color = colors[type] || 0xffffff;

    this.#sprite = scene.add.rectangle(0, 0, 18, 18, color);
    const label = scene.add.text(0, 0, labels[type] || "?", {
      fontSize: "11px", color: "#000000", fontFamily: "monospace",
    }).setOrigin(0.5);
    this.add([this.#sprite, label]);
    this.setDepth(3);

    scene.tweens.add({
      targets: this,
      y: y + 200,
      duration: 4000,
      onComplete: () => this.destroy(),
    });
  }

  get type() { return this.#type; }

  collect(player) {
    if (this.#type === POWERUP_TYPES.TRIPLE_SHOT) {
      player.activateTripleShot(CONFIG.POWERUP_TRIPLE_SHOT_DURATION);
    }
    this.destroy();
  }
}
