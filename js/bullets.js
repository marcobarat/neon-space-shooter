// Proiettili del player e dei nemici, con scia luminosa (trail).
import { TAU } from "./utils.js";
import { PALETTE } from "./palette.js";

export class Bullet {
  constructor(x, y, vx, vy, { color = PALETTE.bullet, core = PALETTE.bulletCore, r = 4, friendly = true } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = r;
    this.color = color;
    this.core = core;
    this.friendly = friendly;
    this.dead = false;
    this.trail = []; // ultime posizioni per la scia
  }

  update(dt, w, h) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -20 || this.x > w + 20 || this.y < -20 || this.y > h + 20) {
      this.dead = true;
    }
  }

  draw(ctx) {
    // Scia: cerchietti sempre più piccoli e trasparenti dietro al proiettile.
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const f = (i + 1) / this.trail.length;
      ctx.globalAlpha = f * 0.45;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.r * f * 0.9, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Alone esterno.
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, TAU);
    ctx.fill();
    // Nucleo bianco brillante.
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.core;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 0.5, 0, TAU);
    ctx.fill();
  }
}
