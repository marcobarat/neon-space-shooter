// Nemici: tre tipi base (dritto, zigzag, sparatore) + un boss.
import { rand, TAU } from "./utils.js";
import { Bullet } from "./bullets.js";
import { sfx } from "./audio.js";

const COLORS = {
  straight: "#ff5bd0",
  zigzag: "#ffd23f",
  shooter: "#8b5bff",
};

export class Enemy {
  constructor(type, x, w) {
    this.type = type;
    this.x = x;
    this.y = -30;
    this.w = w;
    this.r = 15;
    this.hp = type === "shooter" ? 2 : 1;
    this.dead = false;
    this.hitFlash = 0;
    this.t = rand(0, TAU);
    this.baseX = x;
    this.fireTimer = rand(1, 2.5);
    this.speed = type === "zigzag" ? 90 : 110;
    this.score = { straight: 100, zigzag: 150, shooter: 200 }[type];
  }

  update(dt, enemyBullets, targetX) {
    this.t += dt;
    this.y += this.speed * dt;
    if (this.type === "zigzag") {
      this.x = this.baseX + Math.sin(this.t * 2.5) * 90;
    } else if (this.type === "shooter") {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && this.y > 0 && this.y < this.w) {
        this.fireTimer = rand(1.5, 3);
        const ang = Math.atan2(1, (targetX - this.x) / 260);
        enemyBullets.push(
          new Bullet(this.x, this.y + 12, Math.cos(ang) * 220 * Math.sign(targetX - this.x || 1), 240, {
            color: COLORS.shooter,
            r: 5,
            friendly: false,
          })
        );
        sfx.enemyLaser();
      }
    }
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.y > 660) this.dead = true; // uscito dallo schermo
  }

  hit(dmg = 1) {
    this.hp -= dmg;
    this.hitFlash = 0.1;
    if (this.hp <= 0) this.dead = true;
    return this.hp <= 0;
  }

  draw(ctx) {
    const c = this.hitFlash > 0 ? "#ffffff" : COLORS[this.type];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = c;
    ctx.shadowColor = COLORS[this.type];
    ctx.shadowBlur = 16;
    ctx.beginPath();
    if (this.type === "straight") {
      // rombo
      ctx.moveTo(0, 15);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, -15);
      ctx.lineTo(-14, 0);
    } else if (this.type === "zigzag") {
      // triangolo rovesciato
      ctx.moveTo(0, 14);
      ctx.lineTo(15, -12);
      ctx.lineTo(-15, -12);
    } else {
      // esagono per lo sparatore
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        const px = Math.cos(a) * 15;
        const py = Math.sin(a) * 15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

export class Boss {
  constructor(w, level) {
    this.w = w;
    this.x = w / 2;
    this.y = -60;
    this.r = 46;
    this.maxHp = 40 + level * 12;
    this.hp = this.maxHp;
    this.dead = false;
    this.hitFlash = 0;
    this.t = 0;
    this.phase = 0;
    this.fireTimer = 1.5;
    this.entering = true;
    this.score = 2000 + level * 500;
    this.isBoss = true;
  }

  update(dt, enemyBullets, targetX) {
    this.t += dt;
    if (this.entering) {
      this.y += 60 * dt;
      if (this.y >= 90) this.entering = false;
      return;
    }
    // Movimento a onda sinusoidale orizzontale.
    this.x = this.w / 2 + Math.sin(this.t * 0.8) * (this.w / 2 - 80);
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = 1.1;
      // Spara un ventaglio di proiettili.
      const n = 7;
      for (let i = 0; i < n; i++) {
        const ang = Math.PI / 2 + (i - (n - 1) / 2) * 0.28;
        enemyBullets.push(
          new Bullet(this.x, this.y + 30, Math.cos(ang) * 240, Math.sin(ang) * 240, {
            color: "#ff3860",
            r: 6,
            friendly: false,
          })
        );
      }
      // E un colpo mirato al player.
      const ax = Math.atan2(1, (targetX - this.x) / 300);
      enemyBullets.push(
        new Bullet(this.x, this.y + 30, Math.sign(targetX - this.x || 1) * Math.cos(ax) * 260, 300, {
          color: "#ffd23f",
          r: 6,
          friendly: false,
        })
      );
      sfx.enemyLaser();
    }
  }

  hit(dmg = 1) {
    this.hp -= dmg;
    this.hitFlash = 0.08;
    if (this.hp <= 0) this.dead = true;
    return this.hp <= 0;
  }

  draw(ctx) {
    const c = this.hitFlash > 0 ? "#ffffff" : "#ff3860";
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = c;
    ctx.shadowColor = "#ff3860";
    ctx.shadowBlur = 30;
    ctx.beginPath();
    // Corpo a otto lati, minaccioso.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const rad = i % 2 === 0 ? this.r : this.r * 0.7;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad * 0.7;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    // occhio centrale
    ctx.fillStyle = "#ffd23f";
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    // Barra vita in alto.
    const bw = 400;
    const bx = this.w / 2 - bw / 2;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(bx, 16, bw, 10);
    ctx.fillStyle = "#ff3860";
    ctx.shadowColor = "#ff3860";
    ctx.shadowBlur = 10;
    ctx.fillRect(bx, 16, bw * Math.max(0, this.hp / this.maxHp), 10);
    ctx.shadowBlur = 0;
  }
}
