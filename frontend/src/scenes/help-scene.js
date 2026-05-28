import Phaser from "../lib/phaser.js";
import { RadarCanvas } from "../objects/ui/radar-canvas.js";

export class HelpScene extends Phaser.Scene {
  constructor() {
    super({ key: "HelpScene" });
  }

  create() {
    RadarCanvas.hide();
    const data = this.scene.settings.data || {};
    this.cameras.main.setBackgroundColor("#0a0a2e");
    const cx = this.scale.width / 2;

    const lines = [
      "INFORMACIO DEL JOC",
      "",
      "--- ENEMICS ---",
      "SCOUT (Zig-Zag): 100pts. Moviment sinusoidal.",
      "  Apareixen al Nivell 2.",
      "FIGHTER (Kamikaze): 200pts. Baixen en linia recta i disparen.",
      "  Apareixen desde el principi.",
      "HUNTER (Cacador): 300pts. Segueixen la teva X i disparen.",
      "  Apareixen al Nivell 3.",
      "BOSS (Commandant): 5000pts. 3 fases (rafaga, carrega, teletransport).",
      "  Apareix al matar 8 enemics (Nivell 4).",
      "",
      "--- MILLORES (Botiga) ---",
      "VIDA EXTRA: 500cr. +1 vida al iniciar partida.",
      "ESCUT: 1000cr. Absorbeix 1 impacte per partida.",
      "",
      "--- POWER-UP ---",
      "TRIPLE SHOT (verd): 15% probabilitat al matar enemic.",
      "  Dispara 3 bales en ventall durant 8s.",
      "",
      "--- MODE INFINIT ---",
      "Al derrotar el Boss, la dificultat augmenta",
      "cada 10s (+10% velocitat i frequencia).",
      "",
      "--- EASTER EGG ---",
      "Codig Konami: Amunt, Amunt, Avall, Avall,",
      "Esquerra, Dreta, Esquerra, Dreta, B, A",
      "Invoqueu el Boss immediatament!",
      "",
      "--- GANYOTA ---",
      "Quan moris, escriu un missatge de comiat",
      "(max 40 caracters) i es mostrara al",
      "ranquing de punts.",
    ];

    const text = this.add.text(cx, 8, lines.join("\n"), {
      fontSize: "11px", color: "#ccccff", fontFamily: "monospace", align: "center",
    }).setOrigin(0.5, 0).setLineSpacing(3);

    const bg = this.add.rectangle(cx, this.scale.height - 25, 160, 30, 0x1a1a3e, 0.8)
      .setStrokeStyle(2, 0x8888cc).setInteractive({ useHandCursor: true });
    const label = this.add.text(cx, this.scale.height - 25, "TORNAR", {
      fontSize: "14px", color: "#8888cc", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(1);

    bg.on("pointerover", () => { bg.setFillStyle(0x2a2a5e, 1); label.setColor("#ffffff"); });
    bg.on("pointerout", () => { bg.setFillStyle(0x1a1a3e, 0.8); label.setColor("#8888cc"); });
    bg.on("pointerdown", () => {
      this.scene.start("MenuScene", data);
    });
  }
}
