import Phaser from "../lib/phaser.js";
import { comprarMillora } from "../lib/graphql.js";
import { RadarCanvas } from "../objects/ui/radar-canvas.js";

function crearBoto(scene, x, y, text, color, onClick) {
  const bg = scene.add.rectangle(x, y, 220, 36, 0x1a1a3e, 0.8).setStrokeStyle(2, color).setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, y, text, { fontSize: "15px", color: color, fontFamily: "monospace" }).setOrigin(0.5).setDepth(1);
  bg.on("pointerover", () => { bg.setFillStyle(0x2a2a5e, 1); label.setColor("#ffffff"); });
  bg.on("pointerout", () => { bg.setFillStyle(0x1a1a3e, 0.8); label.setColor(color); });
  bg.on("pointerdown", onClick);
  return { bg, label };
}

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: "ShopScene" });
  }

  create() {
    RadarCanvas.hide();
    const { jugador: j, idToken, localId } = this.scene.settings.data || {};
    let jugador = j;

    this.cameras.main.setBackgroundColor("#0a0a2e");
    const cx = this.scale.width / 2;

    this.add.text(cx, 30, "BOTIGA", {
      fontSize: "22px", color: "#ff2f66", fontFamily: "monospace",
    }).setOrigin(0.5);

    const creditsText = this.add.text(cx, 65, `Credits: ${jugador?.credits ?? 0}`, {
      fontSize: "14px", color: "#ffcc00", fontFamily: "monospace",
    }).setOrigin(0.5);

    const statusText = this.add.text(cx, 95, "", {
      fontSize: "12px", color: "#ffcc00", fontFamily: "monospace",
    }).setOrigin(0.5);

    this.add.text(cx, 130, "VIDA EXTRA", {
      fontSize: "16px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5);
    this.add.text(cx, 152, "+1 vida permanent  500 credits", {
      fontSize: "12px", color: "#8888cc", fontFamily: "monospace",
    }).setOrigin(0.5);

    const invText = this.add.text(cx, 330, "", {
      fontSize: "13px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5, 0);

    crearBoto(this, cx, 195, "COMPRAR 500cr", "#ff2f66", async () => {
      if (!jugador) return;
      statusText.setText("Comprant...");
      try {
        const res = await comprarMillora(jugador.id, "vida_extra");
        if (res.nickname) {
          jugador = res;
          creditsText.setText(`Credits: ${res.credits}`);
          statusText.setText(`+1 Vida Extra! Total: ${res.videsExtra}`);
          this._refresh(jugador, invText);
        } else {
          statusText.setText(res.mensaje || "Error");
        }
      } catch (e) {
        statusText.setText(e.message);
      }
    });

    this.add.text(cx, 250, "ESCUT", {
      fontSize: "16px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5);
    this.add.text(cx, 272, "Absorbeix 1 hit per partida  1000 credits", {
      fontSize: "12px", color: "#8888cc", fontFamily: "monospace",
    }).setOrigin(0.5);

    crearBoto(this, cx, 315, "COMPRAR 1000cr", "#ff2f66", async () => {
      if (!jugador) return;
      statusText.setText("Comprant...");
      try {
        const res = await comprarMillora(jugador.id, "escut");
        if (res.nickname) {
          jugador = res;
          creditsText.setText(`Credits: ${res.credits}`);
          statusText.setText("Escut adquirit!");
          this._refresh(jugador, invText);
        } else {
          statusText.setText(res.mensaje || "Error");
        }
      } catch (e) {
        statusText.setText(e.message);
      }
    });

    this._refresh(jugador, invText);

    const backBg = this.add.rectangle(cx, 580, 180, 36, 0x1a1a3e, 0.8).setStrokeStyle(2, 0x8888cc).setInteractive({ useHandCursor: true });
    const backLabel = this.add.text(cx, 580, "ENRERE", { fontSize: "16px", color: "#8888cc", fontFamily: "monospace" }).setOrigin(0.5).setDepth(1);
    backBg.on("pointerover", () => { backBg.setFillStyle(0x2a2a5e, 1); backLabel.setColor("#ffffff"); });
    backBg.on("pointerout", () => { backBg.setFillStyle(0x1a1a3e, 0.8); backLabel.setColor("#8888cc"); });
    backBg.on("pointerdown", () => {
      this.scene.start("MenuScene", { jugador, idToken, localId });
    });
  }

  _refresh(jugador, invText) {
    if (!jugador) return;
    const parts = [`Vides Extra: ${jugador.videsExtra ?? 0}`];
    if (jugador.escut) parts.push("Escut: SI");
    invText.setText(parts.join("  |  "));
  }
}
