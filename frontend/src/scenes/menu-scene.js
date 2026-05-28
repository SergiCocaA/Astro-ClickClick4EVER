import Phaser from "../lib/phaser.js";
import { crearPartida } from "../lib/graphql.js";
import { RadarCanvas } from "../objects/ui/radar-canvas.js";

function crearBoto(scene, x, y, text, color, onClick) {
  const bg = scene.add.rectangle(x, y, 260, 40, 0x1a1a3e, 0.8).setStrokeStyle(2, color).setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, y, text, { fontSize: "18px", color: color, fontFamily: "monospace" }).setOrigin(0.5).setDepth(1);
  bg.on("pointerover", () => { bg.setFillStyle(0x2a2a5e, 1); label.setColor("#ffffff"); });
  bg.on("pointerout", () => { bg.setFillStyle(0x1a1a3e, 0.8); label.setColor(color); });
  bg.on("pointerdown", onClick);
  return { bg, label };
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    const { jugador, idToken, localId } = this.scene.settings.data || {};

    this.cameras.main.setBackgroundColor("#0a0a2e");
    const cx = this.scale.width / 2;

    this.add.text(cx, 15, "OPERATION NEXUS", {
      fontSize: "22px", color: "#ff2f66", fontFamily: "monospace",
    }).setOrigin(0.5);

    this.add.text(cx, 45, `Benvingut, ${jugador?.nickname || "desconegut"}`, {
      fontSize: "14px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5);

    this.add.text(cx, 65, `Credits: ${jugador?.credits ?? 0}  |  Vides Extra: ${jugador?.videsExtra ?? 0}` + (jugador?.escut ? "  [ESCUT]" : ""), {
      fontSize: "12px", color: "#8888cc", fontFamily: "monospace",
    }).setOrigin(0.5);

    new RadarCanvas(this, cx, 115, 90);

    const statusText = this.add.text(cx, 410, "", {
      fontSize: "12px", color: "#ffcc00", fontFamily: "monospace",
    }).setOrigin(0.5);

    crearBoto(this, cx, 200, "JUGAR", "#ff2f66", async () => {
      statusText.setText("Creant partida...");
      try {
        const partida = await crearPartida("Espai Profund");
        this.scene.start("VideoScene", { jugador, partida, idToken, localId });
      } catch (e) {
        statusText.setText("Error: " + e.message);
      }
    });

    crearBoto(this, cx, 255, "BOTIGA", "#ffcc00", () => {
      this.scene.start("ShopScene", { jugador, idToken, localId });
    });

    crearBoto(this, cx, 310, "CLASSIFICACIO", "#8888cc", () => {
      this.scene.start("LeaderboardScene", { jugador, idToken, localId });
    });

    crearBoto(this, cx, 365, "INFORMACIO", "#66aaff", () => {
      this.scene.start("HelpScene", { jugador, idToken, localId });
    });
  }
}

