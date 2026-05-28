import Phaser from "../lib/phaser.js";
import { registre, iniciSessio } from "../lib/graphql.js";

export class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoginScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor("#0a0a2e");
    const cx = this.scale.width / 2;

    this.add.text(cx, 30, "OPERATION NEXUS", {
      fontSize: "22px", color: "#ff2f66", fontFamily: "monospace",
    }).setOrigin(0.5);

    this.add.text(cx, 65, "Clica al camp i escriu amb el teclat", {
      fontSize: "11px", color: "#666688", fontFamily: "monospace",
    }).setOrigin(0.5);

    // ---- EMAIL ----
    this.add.text(cx, 95, "Email:", {
      fontSize: "13px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5);

    const emailBox = this.add.rectangle(cx, 122, 310, 36, 0x1a1a4e).setStrokeStyle(2, 0xff2f66).setInteractive({ useHandCursor: true });
    const emailPlaceholder = this.add.text(cx, 122, "email@exemple.com", {
      fontSize: "14px", color: "#555577", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(1);
    const emailText = this.add.text(cx - 145, 112, "", {
      fontSize: "14px", color: "#ffffff", fontFamily: "monospace",
    }).setDepth(2);
    const emailCursor = this.add.text(cx - 145, 112, "_", {
      fontSize: "14px", color: "#ff2f66", fontFamily: "monospace",
    }).setDepth(2).setVisible(false);

    // ---- PASSWORD ----
    this.add.text(cx, 163, "Password:", {
      fontSize: "13px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5);

    const passBox = this.add.rectangle(cx, 190, 310, 36, 0x1a1a4e).setStrokeStyle(2, 0x444488).setInteractive({ useHandCursor: true });
    const passPlaceholder = this.add.text(cx, 190, "contrassenya", {
      fontSize: "14px", color: "#555577", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(1);
    const passText = this.add.text(cx - 145, 180, "", {
      fontSize: "14px", color: "#ffffff", fontFamily: "monospace",
    }).setDepth(2);
    const passCursor = this.add.text(cx - 145, 180, "_", {
      fontSize: "14px", color: "#ff2f66", fontFamily: "monospace",
    }).setDepth(2).setVisible(false);

    let email = "", password = "", mode = "login";
    this._field = "email";

    const setField = (f) => {
      this._field = f;
      emailBox.setStrokeStyle(2, f === "email" ? 0xff2f66 : 0x444488);
      passBox.setStrokeStyle(2, f === "password" ? 0xff2f66 : 0x444488);
      emailCursor.setVisible(f === "email");
      passCursor.setVisible(f === "password");
      emailPlaceholder.setVisible(f !== "email" || !email);
      passPlaceholder.setVisible(f !== "password" || !password);
    };

    emailBox.on("pointerdown", () => setField("email"));
    passBox.on("pointerdown", () => setField("password"));

    // ---- BOTONS ----
    const btnAuthBg = this.add.rectangle(cx, 250, 240, 40, 0x1a1a3e, 0.8).setStrokeStyle(2, 0xff2f66).setInteractive({ useHandCursor: true });
    const btnAuthLabel = this.add.text(cx, 250, "INICIAR SESSIO", { fontSize: "15px", color: "#ff2f66", fontFamily: "monospace" }).setOrigin(0.5).setDepth(1);
    btnAuthBg.on("pointerover", () => { btnAuthBg.setFillStyle(0x2a2a5e, 1); btnAuthLabel.setColor("#ffffff"); });
    btnAuthBg.on("pointerout", () => { btnAuthBg.setFillStyle(0x1a1a3e, 0.8); btnAuthLabel.setColor("#ff2f66"); });

    const btnModeBg = this.add.rectangle(cx, 305, 170, 32, 0x0a0a2e, 0).setStrokeStyle(1, 0x666688).setInteractive({ useHandCursor: true });
    const btnModeLabel = this.add.text(cx, 305, "Registrar-se", { fontSize: "13px", color: "#8888cc", fontFamily: "monospace" }).setOrigin(0.5).setDepth(1);
    btnModeBg.on("pointerover", () => btnModeLabel.setColor("#ffffff"));
    btnModeBg.on("pointerout", () => btnModeLabel.setColor("#8888cc"));

    const statusText = this.add.text(cx, 350, "", {
      fontSize: "12px", color: "#ffcc00", fontFamily: "monospace",
    }).setOrigin(0.5);

    const attempt = () => this._auth(mode, email, password, statusText);

    btnAuthBg.on("pointerdown", attempt);
    btnModeBg.on("pointerdown", () => {
      mode = mode === "login" ? "register" : "login";
      btnAuthLabel.setText(mode === "login" ? "INICIAR SESSIO" : "REGISTRAR-SE");
      btnModeLabel.setText(mode === "login" ? "Registrar-se" : "Iniciar sessio");
      statusText.setText("");
    });

    // ---- TECLAT ----
    this.input.keyboard.on("keydown", (event) => {
      if (!this._field) { setField("email"); return; }

      if (event.key === "Tab") {
        event.preventDefault();
        setField(this._field === "email" ? "password" : "email");
        return;
      }
      if (event.key === "Enter") {
        attempt();
        return;
      }
      if (event.key === "Backspace") {
        if (this._field === "email") email = email.slice(0, -1);
        else password = password.slice(0, -1);
      } else if (event.key.length === 1) {
        if (this._field === "email" && email.length < 50) email += event.key;
        else if (this._field === "password" && password.length < 40) password += event.key;
      }
      emailText.setText(email);
      passText.setText("*".repeat(password.length));
      emailPlaceholder.setVisible(!email);
      passPlaceholder.setVisible(!password);
    });

    this.events.on("update", () => {
      if (!this._field) return;
      const active = Math.floor(Date.now() / 530) % 2 === 0;
      if (this._field === "email") emailCursor.setVisible(active);
      else passCursor.setVisible(active);
    });

    // Forçar focus al canvas
    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();
    this.input.keyboard.addCapture("TAB");
  }

  async _auth(mode, email, password, statusText) {
    if (!email || !password) { statusText.setText("Omple email i password"); return; }
    this._field = "";
    statusText.setText("Connectant...");
    try {
      let res;
      if (mode === "register") {
        const nick = email.split("@")[0];
        res = await registre(email, password, nick);
      } else {
        res = await iniciSessio(email, password);
      }

      if (res.mensaje) {
        statusText.setText(res.mensaje);
        return;
      }

      statusText.setText("Carregant perfil...");
      this.scene.start("MenuScene", { jugador: res.jugador, idToken: res.token, localId: res.jugador.id });
    } catch (e) {
      statusText.setText(e.message);
    }
  }
}
