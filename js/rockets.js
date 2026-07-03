// Razzi a ricerca (homing missiles): acquisiscono il nemico più vicino e curvano
// verso di esso. Esplodono a contatto con danno ad area.
import { TAU } from "./utils.js";
import { PALETTE } from "./palette.js";

// Trova il bersaglio più vicino tra nemici e boss. Ritorna l'entità o null.
export function nearestEnemy(x, y, enemies, boss) {
  let best = null;
  let bestD = Infinity;
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  if (boss && !boss.dead) {
    const dx = boss.x - x;
    const dy = boss.y - y;
    const d = dx * dx + dy * dy;
    if (d < bestD) best = boss;
  }
  return best;
}

const SPEED = 380;
const TURN = 5.0; // rad/s max di virata

export class Rocket {
  constructor(x, y, dir = -Math.PI / 2) {
    this.x = x;
    this.y = y;
    this.angle = dir;
    this.r = 5;
    this.dead = false;
    this.life = 3;
    this.trail = [];
  }

  update(dt, target, w, h) {
    // Sterza verso il bersaglio con virata limitata.
    if (target) {
      const desired = Math.atan2(target.y - this.y, target.x - this.x);
      let diff = ((desired - this.angle + Math.PI) % TAU) - Math.PI;
      if (diff < -Math.PI) diff += TAU;
      const max = TURN * dt;
      this.angle += Math.max(-max, Math.min(max, diff));
    }
    this.x += Math.cos(this.angle) * SPEED * dt;
    this.y += Math.sin(this.angle) * SPEED * dt;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 8) this.trail.shift();

    this.life -= dt;
    if (this.life <= 0 || this.x < -30 || this.x > w + 30 || this.y < -30 || this.y > h + 30) {
      this.dead = true;
    }
  }

  draw(ctx) {
    // Scia infuocata.
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const f = (i + 1) / this.trail.length;
      ctx.globalAlpha = f * 0.5;
      ctx.fillStyle = i % 2 ? PALETTE.flame : "#ffd23f";
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.r * f, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Corpo del razzo.
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.shadowColor = PALETTE.flame;
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, 4);
    ctx.lineTo(-5, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}
