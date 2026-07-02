// Proiettili del player e dei nemici. Semplici entità con posizione e velocità.
import { TAU } from "./utils.js";

export class Bullet {
  constructor(x, y, vx, vy, { color = "#7df9ff", r = 4, friendly = true } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = r;
    this.color = color;
    this.friendly = friendly;
    this.dead = false;
  }

  update(dt, w, h) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -20 || this.x > w + 20 || this.y < -20 || this.y > h + 20) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
