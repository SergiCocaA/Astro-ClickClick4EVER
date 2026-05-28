import Phaser from "../lib/phaser.js";
import { obtenirClassificacio } from "../lib/graphql.js";
import { RadarCanvas } from "../objects/ui/radar-canvas.js";

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: "LeaderboardScene" });
  }

  create() {
    RadarCanvas.hide();
    const { jugador } = this.scene.settings.data || {};

    this.cameras.main.setBackgroundColor("#0a0a2e");
    const cx = this.scale.width / 2;

    this.add.text(cx, 30, "CLASSIFICACIO", {
      fontSize: "20px", color: "#ff2f66", fontFamily: "monospace",
    }).setOrigin(0.5);

    const listText = this.add.text(cx, 70, "Carregant...", {
      fontSize: "13px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5, 0);

    const backBg = this.add.rectangle(cx, 600, 180, 36, 0x1a1a3e, 0.8).setStrokeStyle(2, 0xff2f66).setInteractive({ useHandCursor: true });
    const backLabel = this.add.text(cx, 600, "ENRERE", { fontSize: "16px", color: "#ff2f66", fontFamily: "monospace" }).setOrigin(0.5).setDepth(1);
    backBg.on("pointerover", () => { backBg.setFillStyle(0x2a2a5e, 1); backLabel.setColor("#ffffff"); });
    backBg.on("pointerout", () => { backBg.setFillStyle(0x1a1a3e, 0.8); backLabel.setColor("#ff2f66"); });
    backBg.on("pointerdown", () => {
      this.scene.start("MenuScene", { jugador });
    });

    this._carregar(listText, cx);
  }

  async _carregar(listText) {
    try {
      const entries = await obtenirClassificacio(10);
      if (!entries.length) {
        listText.setText("Encara no hi ha puntuacions!");
        return;
      }
      const header = `${"NICK".padEnd(14)} ${"PUNTS".padStart(7)}\n${"-".repeat(25)}`;
      const lines = entries.map((e, i) => {
        const nick = (e.jugador && e.jugador.nickname) ? e.jugador.nickname : "???";
        const ganyota = e.ganyota ? ` - ${e.ganyota}` : "";
        return `${i + 1}. ${nick.padEnd(14)} ${String(e.punts).padStart(7)} pts${ganyota}`;
      }).join("\n");
      listText.setText(header + "\n" + lines);
    } catch (e) {
      listText.setText("Error al carregar: " + e.message);
    }
  }
}
