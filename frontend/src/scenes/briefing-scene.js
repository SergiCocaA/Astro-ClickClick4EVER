import Phaser from "../lib/phaser.js";
import { RadarCanvas } from "../objects/ui/radar-canvas.js";

export class BriefingScene extends Phaser.Scene {
  constructor() {
    super({ key: "BriefingScene" });
  }

  create() {
    RadarCanvas.hide();
    const data = this.scene.settings.data || {};
    this.cameras.main.setBackgroundColor("#000000");
    const cx = this.scale.width / 2;

    const lines = [
      "BRIEFING DE MISSIÓ",
      "",
      "Sector: Espai Profund",
      "Amenaça: Naus nodrissa enemic",
      "Objectiu: Eliminar 8 naus per",
      "desbloquejar el Commandant Enemic.",
      "",
      "Derrota el Commandant per",
      "assegurar el sector.",
      "",
      "RECORDA: Les millores de l'hangar",
      "estan actives per a aquesta missió.",
      "",
      "Molta sort, pilot!",
    ];

    this.add.text(cx, 40, lines.join("\n"), {
      fontSize: "13px", color: "#00ff88", fontFamily: "monospace", align: "center",
    }).setOrigin(0.5, 0).setLineSpacing(6);

    const bg = this.add.rectangle(cx, this.scale.height - 50, 200, 36, 0x1a1a3e, 0.8)
      .setStrokeStyle(2, 0xff2f66).setInteractive({ useHandCursor: true });
    const label = this.add.text(cx, this.scale.height - 50, "VOLAR", {
      fontSize: "16px", color: "#ff2f66", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(1);

    bg.on("pointerover", () => { bg.setFillStyle(0x2a2a5e, 1); label.setColor("#ffffff"); });
    bg.on("pointerout", () => { bg.setFillStyle(0x1a1a3e, 0.8); label.setColor("#ff2f66"); });
    bg.on("pointerdown", () => {
      this.scene.start("PreloadScene", data);
    });
  }
}
