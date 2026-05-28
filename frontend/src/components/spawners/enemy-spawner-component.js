import Phaser from '../../lib/phaser.js';
import { CUSTOM_EVENTS, EventBusComponent } from '../events/event-bus-component.js';

export class EnemySpawnerComponent {
  #scene;
  #spawnInterval;
  #spawnAt;
  #group;
  #pool = [];
  #enemyClass;
  #eventBusComponent;
  #extraArg;
  #disableSpawning;
  #difficultyMultiplier;

  constructor(scene, enemyClass, spawnConfig, eventBusComponent, extraArg) {
    this.#scene = scene;
    this.#enemyClass = enemyClass;
    this.#eventBusComponent = eventBusComponent;
    this.#extraArg = extraArg;
    this.#spawnInterval = spawnConfig.interval;
    this.#spawnAt = spawnConfig.spawnAt;
    this.#disableSpawning = false;
    this.#difficultyMultiplier = 1.0;

    this.#group = this.#scene.add.group({
      name: `${this.constructor.name}-${Phaser.Math.RND.uuid()}`,
    });

    this.#scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.#scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.worldStep, this);
    const cleanup = () => {
      this.#scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
      this.#scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.worldStep, this);
    };
    this.#scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.#scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    eventBusComponent.on(CUSTOM_EVENTS.GAME_OVER, () => {
      this.#disableSpawning = true;
    });
  }

  get phaserGroup() {
    return this.#group;
  }

  get disableSpawning() {
    return this.#disableSpawning;
  }

  set disableSpawning(val) {
    this.#disableSpawning = val;
  }

  setDifficultyMultiplier(multiplier) {
    this.#difficultyMultiplier = multiplier;
  }

  update(ts, dt) {
    if (this.#disableSpawning || !this.#scene || !this.#scene.scale) {
      return;
    }
    this.#spawnAt -= dt;
    if (this.#spawnAt > 0) return;

    const x = Phaser.Math.RND.between(30, this.#scene.scale.width - 30);
    const enemy = this.#obtenirEnemic(x, -20);
    if (!enemy) return;
    enemy.reset();

    if (this.#difficultyMultiplier > 1.0) {
      if (enemy.body) {
        enemy.body.velocity.y *= this.#difficultyMultiplier;
        if (enemy.body.velocity.x !== undefined) {
          enemy.body.velocity.x *= this.#difficultyMultiplier;
        }
      }
    }
    this.#spawnAt = this.#spawnInterval / this.#difficultyMultiplier;
  }

  #obtenirEnemic(x, y) {
    let enemy = this.#pool.find(e => !e.active);
    if (enemy) {
      enemy.setPosition(x, y);
      enemy.setActive(true);
      enemy.setVisible(true);
      return enemy;
    }
    try {
      enemy = new this.#enemyClass(this.#scene, x, y);
      enemy.init(this.#eventBusComponent, this.#extraArg);
      this.#pool.push(enemy);
      this.#group.add(enemy);
      return enemy;
    } catch (e) {
      return null;
    }
  }

  worldStep() {
    for (const enemy of this.#pool) {
      if (!enemy.active) continue;
      if (enemy.y > this.#scene.scale.height + 50) {
        enemy.setActive(false);
        enemy.setVisible(false);
      }
    }
  }
}
