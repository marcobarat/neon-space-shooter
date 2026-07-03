// Sistema particelle + screen shake: il cuore del "game juice".
import { rand, TAU } from "./utils.js";

class Particle {
  constructor(x, y, color) {
    const a = rand(0, TAU);
    const speed = rand(40, 320);
    this.x = x;
    this.y = y;
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.life = rand(0.3, 0.8);
    this.maxLife = this.life;
    this.size = rand(1.5, 4);
    this.color = color;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.life -= dt;
  }
  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.shake = 0;
  }

  burst(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color));
  }

  // Onda d'urto: anello che si espande e svanisce. Pochi attivi alla volta,
  // costo trascurabile; ottimo "pop" per esplosioni grosse (boss/nova/bomba).
  shockwave(x, y, color, maxR = 90, life = 0.4) {
    this.rings.push({ x, y, color, r: 0, maxR, life, maxLife: life });
  }

  addShake(amount) {
    this.shake = Math.min(24, this.shake + amount);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const rg = this.rings[i];
      rg.life -= dt;
      const t = 1 - Math.max(0, rg.life) / rg.maxLife;
      rg.r = rg.maxR * (1 - (1 - t) * (1 - t)); // ease-out
      if (rg.life <= 0) this.rings.splice(i, 1);
    }
    this.shake *= 0.86;
    if (this.shake < 0.2) this.shake = 0;
  }

  // Applica lo shake: chiamare dentro un ctx.save()/restore().
  applyShake(ctx) {
    if (this.shake > 0) {
      ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));
    }
  }

  draw(ctx) {
    for (const rg of this.rings) {
      const a = Math.max(0, rg.life / rg.maxLife);
      ctx.globalAlpha = a * 0.8;
      ctx.strokeStyle = rg.color;
      ctx.shadowColor = rg.color;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3 * a + 1;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, rg.r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    for (const p of this.particles) p.draw(ctx);
  }
}
