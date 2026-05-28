import Phaser from "../../lib/phaser.js";

let _instance = null;

export class RadarCanvas {
  #canvas;
  #ctx;
  #angle;
  #size;
  #x;
  #y;

  constructor(scene, x, y, size = 120) {
    if (_instance) {
      _instance.destroy();
    }
    this.#x = x;
    this.#y = y;
    this.#size = size;
    this.#angle = 0;

    this.#canvas = document.createElement("canvas");
    this.#canvas.width = size;
    this.#canvas.height = size;
    this.#canvas.style.position = "absolute";
    this.#canvas.style.border = "2px solid #ff2f66";
    this.#canvas.style.borderRadius = "50%";
    this.#canvas.style.pointerEvents = "none";

    const gameCanvas = scene.game.canvas;
    const parent = gameCanvas.parentElement || gameCanvas;
    const rect = gameCanvas.getBoundingClientRect();
    const scaleX = rect.width / gameCanvas.width;
    const scaleY = rect.height / gameCanvas.height;

    this.#canvas.style.left = `${(x - size / 2) * scaleX + rect.left}px`;
    this.#canvas.style.top = `${(y - size / 2) * scaleY + rect.top}px`;

    parent.appendChild(this.#canvas);

    this.#ctx = this.#canvas.getContext("2d");
    _instance = this;
    this.#draw();
  }

  static show() {
    if (_instance) {
      _instance.#canvas.style.display = "block";
    }
  }

  static hide() {
    if (_instance) {
      _instance.#canvas.style.display = "none";
    }
  }

  destroy() {
    this.#canvas.remove();
    if (_instance === this) _instance = null;
  }

  #draw() {
    if (!this.#canvas || !this.#canvas.parentElement) return;

    const ctx = this.#ctx;
    const w = this.#canvas.width;
    const h = this.#canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2 - 4;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "#1a5a3e";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#0a3a2e";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();

    this.#angle += 0.02;
    const sweepX = cx + Math.cos(this.#angle) * r;
    const sweepY = cy + Math.sin(this.#angle) * r;

    ctx.fillStyle = "rgba(0, 255, 136, 0.15)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, this.#angle - 0.3, this.#angle + 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sweepX, sweepY);
    ctx.stroke();

    const dots = [
      { x: cx + 20, y: cy - 30, a: 0.8 },
      { x: cx - 15, y: cy + 10, a: 0.5 },
      { x: cx + 30, y: cy + 25, a: 0.3 },
    ];
    for (const dot of dots) {
      ctx.fillStyle = `rgba(255, 47, 102, ${dot.a})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(() => this.#draw());
  }
}
