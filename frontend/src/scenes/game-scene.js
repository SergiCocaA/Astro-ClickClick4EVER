import { EnemySpawnerComponent } from '../components/spawners/enemy-spawner-component.js';
import Phaser from '../lib/phaser.js';
import { FighterEnemy } from '../objects/enemies/fighter-enemy.js';
import { ScoutEnemy } from '../objects/enemies/scout-enemy.js';
import { HunterEnemy } from '../objects/enemies/hunter-enemy.js';
import { BossEnemy } from '../objects/enemies/boss-enemy.js';
import { Player } from '../objects/player.js';
import * as CONFIG from '../config.js';
import { CUSTOM_EVENTS, EventBusComponent } from '../components/events/event-bus-component.js';
import { EnemyDestroyedComponent } from '../components/spawners/enemy-destroyed-component.js';
import { Score } from '../objects/ui/score.js';
import { Lives } from '../objects/ui/lives.js';
import { AudioManager } from '../objects/audio-manager.js';
import { PowerUp } from '../objects/power-up.js';
import { RadarCanvas } from '../objects/ui/radar-canvas.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const sceneData = this.scene.settings.data || {};
    this.jugador = sceneData.jugador || null;
    this.partida = sceneData.partida || null;
    this.idToken = sceneData.idToken || null;
    this.localId = sceneData.localId || null;
    this.killCount = 0;
    this.bossSpawned = false;
    this.currentLevel = 1;
    this.currentScore = 0;
    this.infiniteMode = false;
    this.infiniteTimer = 0;
    this.difficultyMultiplier = 1.0;

    this.add.sprite(0, 0, 'bg1', 0).setOrigin(0, 1).setAlpha(0.7).play('bg1').setAngle(90).setScale(1, 1.25);
    this.add.sprite(0, 0, 'bg2', 0).setOrigin(0, 1).setAlpha(0.7).play('bg2').setAngle(90).setScale(1, 1.25);
    this.add.sprite(0, 0, 'bg3', 0).setOrigin(0, 1).setAlpha(0.7).play('bg3').setAngle(90).setScale(1, 1.25);

    RadarCanvas.show();

    const eventBusComponent = new EventBusComponent();

    const player = new Player(this, eventBusComponent);

    const extraLives = this.jugador?.videsExtra ?? 0;
    let shieldActive = this.jugador?.escut ?? false;

    if (shieldActive) {
      const shieldGfx = this.add.circle(player.x, player.y, 30, 0x00ff88, 0.2).setDepth(1);
      const updateShield = () => {
        if (!shieldGfx.scene) return;
        shieldGfx.setPosition(player.x, player.y);
        if (!shieldActive) {
          shieldGfx.destroy();
          this.events.off(Phaser.Scenes.Events.UPDATE, updateShield);
        }
      };
      this.events.on(Phaser.Scenes.Events.UPDATE, updateShield);
    }

    this.scoutSpawner = new EnemySpawnerComponent(
      this, ScoutEnemy,
      { interval: CONFIG.ENEMY_SCOUT_GROUP_SPAWN_INTERVAL, spawnAt: CONFIG.ENEMY_SCOUT_GROUP_SPAWN_START },
      eventBusComponent
    );
    this.fighterSpawner = new EnemySpawnerComponent(
      this, FighterEnemy,
      { interval: CONFIG.ENEMY_FIGHTER_GROUP_SPAWN_INTERVAL, spawnAt: CONFIG.ENEMY_FIGHTER_GROUP_SPAWN_START },
      eventBusComponent
    );
    this.hunterSpawner = new EnemySpawnerComponent(
      this, HunterEnemy,
      { interval: CONFIG.ENEMY_HUNTER_GROUP_SPAWN_INTERVAL, spawnAt: CONFIG.ENEMY_HUNTER_GROUP_SPAWN_START },
      eventBusComponent,
      player
    );
    new EnemyDestroyedComponent(this, eventBusComponent);

    // Inicialment només enemics Kamikaze (Fighter)
    this.scoutSpawner.disableSpawning = true;
    this.hunterSpawner.disableSpawning = true;

    this.boss = new BossEnemy(this, 0, 0);
    this.boss.init(eventBusComponent);
    this.bossActive = false;

    const xaparseg = (playerGo, enemyGo) => {
      if (!enemyGo.active || !playerGo.active) return;
      if (shieldActive) {
        shieldActive = false;
        eventBusComponent.emit(CUSTOM_EVENTS.SHIELD_CONSUMED);
        enemyGo.colliderComponent.collideWithEnemyShip();
        return;
      }
      playerGo.colliderComponent.collideWithEnemyShip();
      enemyGo.colliderComponent.collideWithEnemyShip();
    };

    this.physics.add.overlap(player, this.scoutSpawner.phaserGroup, xaparseg);
    this.physics.add.overlap(player, this.fighterSpawner.phaserGroup, xaparseg);
    this.physics.add.overlap(player, this.hunterSpawner.phaserGroup, xaparseg);

    eventBusComponent.on(CUSTOM_EVENTS.ENEMY_INIT, (gameObject) => {
      if (gameObject.constructor.name !== 'FighterEnemy' && gameObject.constructor.name !== 'HunterEnemy') return;
      this.physics.add.overlap(player, gameObject.weaponGameObjectGroup, (playerGo, projectileGo) => {
        if (!playerGo.active) return;
        gameObject.weaponComponent.destroyBullet(projectileGo);
        if (shieldActive) {
          shieldActive = false;
          eventBusComponent.emit(CUSTOM_EVENTS.SHIELD_CONSUMED);
          return;
        }
        playerGo.colliderComponent.collideWithEnemyProjectile();
      });
    });

    this.physics.add.overlap(player.weaponGameObjectGroup, this.scoutSpawner.phaserGroup, (enemyGo, projectileGo) => {
      if (!enemyGo.active) return;
      player.weaponComponent.destroyBullet(projectileGo);
      enemyGo.colliderComponent.collideWithEnemyProjectile();
    });

    this.physics.add.overlap(player.weaponGameObjectGroup, this.fighterSpawner.phaserGroup, (enemyGo, projectileGo) => {
      if (!enemyGo.active) return;
      player.weaponComponent.destroyBullet(projectileGo);
      enemyGo.colliderComponent.collideWithEnemyProjectile();
    });

    this.physics.add.overlap(player.weaponGameObjectGroup, this.hunterSpawner.phaserGroup, (enemyGo, projectileGo) => {
      if (!enemyGo.active) return;
      player.weaponComponent.destroyBullet(projectileGo);
      enemyGo.colliderComponent.collideWithEnemyProjectile();
    });

    this.physics.add.overlap(player, this.boss, (playerGo) => {
      if (!this.bossActive) return;
      playerGo.colliderComponent.collideWithEnemyShip();
    });

    this.physics.add.overlap(player.weaponGameObjectGroup, this.boss, (projectileGo) => {
      if (!this.bossActive) return;
      player.weaponComponent.destroyBullet(projectileGo);
      this.boss.healthComponent.hit();
    });

    eventBusComponent.on(CUSTOM_EVENTS.ENEMY_DESTROYED, (enemy) => {
      this.killCount++;
      if (Math.random() < CONFIG.POWERUP_DROP_CHANCE && enemy && enemy.x && enemy.y) {
        const powerUp = new PowerUp(this, enemy.x, enemy.y, "triple_shot");
        this.physics.add.overlap(player, powerUp, () => {
          if (!powerUp.active) return;
          powerUp.collect(player);
        });
      }
    });

    eventBusComponent.on(CUSTOM_EVENTS.BOSS_KILLED, () => {
      this.killCount += 20;
      this.bossActive = false;
      this.infiniteMode = true;
      this.add.text(this.scale.width / 2, this.scale.height / 2, "BOSS ELIMINAT! MODE INFINIT ACTIVAT", {
        fontSize: "20px", color: "#ffcc00", fontFamily: "monospace", backgroundColor: "#000000aa", padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setDepth(20);

      // Re-activar enemics amb dificultat augmentada
      this.time.delayedCall(3000, () => {
        this.scoutSpawner.disableSpawning = false;
        this.fighterSpawner.disableSpawning = false;
        this.hunterSpawner.disableSpawning = false;
        
        // Augmentar dificultat: més freqüència i més velocitat
        this.scoutSpawner.setDifficultyMultiplier(1.5);
        this.fighterSpawner.setDifficultyMultiplier(1.5);
        this.hunterSpawner.setDifficultyMultiplier(1.5);
      });
    });

    eventBusComponent.on(CUSTOM_EVENTS.SCORE_UPDATED, (score) => {
      this.currentScore = score;
      this.#comprovarNivell();
    });

    new Score(this, eventBusComponent);
    new Lives(this, eventBusComponent, this.jugador, this.partida, extraLives);

    new AudioManager(this, eventBusComponent);

    this.#activarEasterEgg(this);
  }

  #comprovarNivell() {
    if (this.currentLevel === 1 && this.currentScore >= 1000) {
      this.#pujarNivell(2);
    } else if (this.currentLevel === 2 && this.currentScore >= 2000) {
      this.#pujarNivell(3);
    } else if (this.currentLevel === 3 && this.currentScore >= 3000) {
      this.#pujarNivell(4);
    }
  }

  #pujarNivell(nouNivell) {
    this.currentLevel = nouNivell;
    const text = nouNivell === 4 ? "NIVELL FINAL: EL BOSS" : `NIVELL ${nouNivell}`;
    const levelText = this.add.text(this.scale.width / 2, this.scale.height / 2, text, {
      fontSize: "32px", color: "#ffffff", fontFamily: "monospace", backgroundColor: "#000000aa",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(30);

    this.time.delayedCall(2000, () => levelText.destroy());

    if (this.currentLevel === 2) {
      this.scoutSpawner.disableSpawning = false;
    } else if (this.currentLevel === 3) {
      this.hunterSpawner.disableSpawning = false;
    } else if (this.currentLevel === 4) {
      this.scoutSpawner.disableSpawning = true;
      this.fighterSpawner.disableSpawning = true;
      this.hunterSpawner.disableSpawning = true;
      this.bossSpawned = true;
      this.bossActive = true;
      this.boss.reset();
    }
  }

  #activarEasterEgg(scene) {
    const codi = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let idx = 0;
    scene.input.keyboard.on("keydown", (event) => {
      if (event.key === codi[idx]) {
        idx++;
        if (idx === codi.length) {
          idx = 0;
          scene.add.text(scene.scale.width / 2, scene.scale.height / 2, "MODE DÉU ACTIVAT!", {
            fontSize: "16px", color: "#ffcc00", fontFamily: "monospace", backgroundColor: "#000000",
            padding: { x: 8, y: 4 },
          }).setOrigin(0.5).setDepth(20);
          scene.bossSpawned = true;
          scene.bossActive = true;
          scene.boss.reset();
        }
      } else {
        idx = 0;
      }
    });
  }

  update(ts, dt) {
    if (this.infiniteMode) {
      this.infiniteTimer += dt;
      // Cada 10 segons augmentem la dificultat un 10%
      if (this.infiniteTimer >= 10000) {
        this.infiniteTimer = 0;
        this.difficultyMultiplier += 0.1;
        this.scoutSpawner.setDifficultyMultiplier(this.difficultyMultiplier * 1.5);
        this.fighterSpawner.setDifficultyMultiplier(this.difficultyMultiplier * 1.5);
        this.hunterSpawner.setDifficultyMultiplier(this.difficultyMultiplier * 1.5);
      }
    }
  }
}
