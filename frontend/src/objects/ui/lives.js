import Phaser from "../../lib/phaser.js";
import { CUSTOM_EVENTS, EventBusComponent } from "../../components/events/event-bus-component.js";
import * as CONFIG from "../../config.js";
import { registrarPuntuacio, finalitzarPartida, obtenirJugador, consumirMillores } from "../../lib/graphql.js";

export class Lives extends Phaser.GameObjects.Container {
  #lives;
  #maxLives;
  #eventBusComponent;
  #score;
  #kills;
  #jugador;
  #partida;
  #ganyota;
  #bossKilled;
  #extraLivesConsumed;
  #shieldConsumed;

  constructor(scene, eventBusComponent, jugador, partida, extraLives = 0) {
    super(scene, 5, scene.scale.height - 30, []);
    this.#eventBusComponent = eventBusComponent;
    this.#maxLives = CONFIG.PLAYER_LIVES + extraLives;
    this.#lives = this.#maxLives;
    this.#score = 0;
    this.#kills = 0;
    this.#jugador = jugador;
    this.#partida = partida;
    this.#ganyota = "";
    this.#bossKilled = false;
    this.#extraLivesConsumed = 0;
    this.#shieldConsumed = false;
    this.scene.add.existing(this);

    for (let i = 0; i < this.#maxLives; i += 1) {
      const tint = i >= CONFIG.PLAYER_LIVES ? 0x00ff88 : 0xffffff;
      const ship = scene.add
        .image(i * 20, 0, "ship")
        .setScale(0.6)
        .setOrigin(0)
        .setTint(tint);
      this.add(ship);
    }

    this.#eventBusComponent.on(CUSTOM_EVENTS.SCORE_UPDATED, (score) => {
      this.#score = score;
    });

    this.#eventBusComponent.on(CUSTOM_EVENTS.ENEMY_DESTROYED, () => {
      this.#kills += 1;
    });

    this.#eventBusComponent.on(CUSTOM_EVENTS.BOSS_KILLED, () => {
      this.#kills += 20;
      this.#bossKilled = true;
    });

    this.#eventBusComponent.on(CUSTOM_EVENTS.PLAYER_DESTROYED, () => {
      this.#lives -= 1;
      const totalDeath = this.#maxLives - this.#lives;
      if (totalDeath > CONFIG.PLAYER_LIVES) {
        this.#extraLivesConsumed += 1;
      }
      if (this.#lives >= 0 && this.#lives < this.length) {
        this.getAt(this.#lives).destroy();
      }
      this.scene.cameras.main.shake(500, 0.01);

      if (this.#lives > 0) {
        scene.time.delayedCall(1500, () => {
          this.#eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_SPAWN);
        });
        return;
      }

      this.scene.add
        .text(this.scene.scale.width / 2, this.scene.scale.height / 2 - 40, "GAME OVER", {
          fontSize: "24px", color: "#ff2f66",
        })
        .setOrigin(0.5);

      this.#mostrarGanyotaInput();
    });

    this.#eventBusComponent.on(CUSTOM_EVENTS.SHIELD_CONSUMED, () => {
      this.#shieldConsumed = true;
    });

    this.#eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_SPAWN);
  }

  #mostrarGanyotaInput() {
    const scene = this.scene;
    const cx = scene.scale.width / 2;

    scene.add.text(cx, scene.scale.height / 2 + 10, "Missatge de comiat:", {
      fontSize: "12px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5);

    const inputText = scene.add.text(cx - 100, scene.scale.height / 2 + 35, "", {
      fontSize: "14px", color: "#ffcc00", fontFamily: "monospace",
    }).setOrigin(0, 0.5);

    const cursor = scene.add.text(cx - 100, scene.scale.height / 2 + 35, "_", {
      fontSize: "14px", color: "#ffcc00", fontFamily: "monospace",
    }).setOrigin(0, 0.5);

    scene.input.keyboard.on("keydown", async (event) => {
      if (event.key === "Enter") {
        await this.#guardarPuntuacio();
        let jugadorActualitzat = this.#jugador;
        try {
          jugadorActualitzat = await obtenirJugador(this.#jugador.id);
        } catch (e) {
          console.warn("No s'ha pogut actualitzar el jugador:", e.message);
        }

        scene.time.delayedCall(500, () => {
          scene.scene.start("LeaderboardScene", { jugador: jugadorActualitzat });
        });
        return;
      }
      if (event.key === "Backspace") {
        this.#ganyota = this.#ganyota.slice(0, -1);
      } else if (event.key.length === 1 && this.#ganyota.length < 40) {
        this.#ganyota += event.key;
      }
      inputText.setText(this.#ganyota);
    });

    scene.events.on("update", () => {
      const active = Math.floor(Date.now() / 530) % 2 === 0;
      cursor.setVisible(active);
    });
  }

  async #guardarPuntuacio() {
    if (!this.#jugador || !this.#partida) return;
    try {
      await registrarPuntuacio(
        this.#partida.id,
        this.#jugador.id,
        this.#score,
        this.#kills,
        this.#ganyota || null,
        this.#bossKilled
      );
      await finalitzarPartida(this.#partida.id);
      if (this.#extraLivesConsumed > 0 || this.#shieldConsumed) {
        try {
          await consumirMillores(this.#jugador.id, this.#extraLivesConsumed, this.#shieldConsumed);
        } catch (e) {
          console.warn("No s'han pogut consumir les millores:", e.message);
        }
      }
    } catch (e) {
      console.warn("No s'ha pogut guardar la puntuacio:", e.message);
    }
  }
}
