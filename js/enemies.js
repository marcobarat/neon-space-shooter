// Nemici: tre tipi (dritto, zigzag, sparatore) con due VARIANTI di pattern
// ciascuno, più un boss a due fasi. Estetica neon con gradienti e glow a strati.
import { rand, TAU } from "./utils.js";
import { Bullet } from "./bullets.js";
import { sfx } from "./audio.js";
import { PALETTE } from "./palette.js";

const COLORS = {
  straight: PALETTE.straight,
  zigzag: PALETTE.zigzag,
  shooter: PALETTE.shooter,
};

export class Enemy {
  constructor(type, x, w, variant = 0) {
    this.type = type;
    this.variant = variant;
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

    // Movimento orizzontale in base a tipo/variante.
    if (this.type === "zigzag") {
      if (this.variant === 1) this.speed += 45 * dt; // variante: accelera scendendo
      const amp = this.variant === 1 ? 60 : 90;
      const freq = this.variant === 1 ? 3.4 : 2.5;
      this.x = this.baseX + Math.sin(this.t * freq) * amp;
    } else if (this.type === "straight" && this.variant === 1) {
      // variante: deriva lentamente di lato invece che dritto.
      this.x = this.baseX + Math.sin(this.t * 1.5) * 45;
    }

    this.y += this.speed * dt;

    if (this.type === "shooter") {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && this.y > 0 && this.y < this.w) {
        if (this.variant === 1) {
          // variante: raffica a ventaglio di 3 colpi.
          this.fireTimer = rand(2.2, 3.2);
          for (let k = -1; k <= 1; k++) {
            enemyBullets.push(
              new Bullet(this.x, this.y + 12, k * 130, 240, {
                color: PALETTE.enemyBullet,
                r: 5,
                friendly: false,
              })
            );
          }
        } else {
          // base: singolo colpo mirato al player.
          this.fireTimer = rand(1.5, 3);
          const dx = targetX - this.x;
          const dy = 300;
          const m = Math.hypot(dx, dy) || 1;
          enemyBullets.push(
            new Bullet(this.x, this.y + 12, (dx / m) * 260, (dy / m) * 260, {
              color: PALETTE.shooter,
              r: 5,
              friendly: false,
            })
          );
        }
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
    const base = COLORS[this.type];
    ctx.save();
    ctx.translate(this.x, this.y);

    // Alone luminoso a strati.
    ctx.shadowColor = base;
    ctx.shadowBlur = 18;

    // Riempimento a gradiente radiale (nucleo chiaro → colore).
    const g = ctx.createRadialGradient(0, -4, 1, 0, 0, this.r + 4);
    g.addColorStop(0, this.hitFlash > 0 ? "#ffffff" : "#ffffff");
    g.addColorStop(0.35, this.hitFlash > 0 ? "#ffffff" : base);
    g.addColorStop(1, base);
    ctx.fillStyle = this.hitFlash > 0 ? "#ffffff" : g;

    ctx.beginPath();
    if (this.type === "straight") {
      ctx.moveTo(0, 15);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, -15);
      ctx.lineTo(-14, 0);
    } else if (this.type === "zigzag") {
      ctx.moveTo(0, 14);
      ctx.lineTo(15, -12);
      ctx.lineTo(-15, -12);
    } else {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + this.t; // esagono rotante
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
    this.fireTimer = 1.5;
    this.spiralAngle = 0;
    this.entering = true;
    this.score = 2000 + level * 500;
    this.isBoss = true;
  }

  get enraged() {
    return this.hp <= this.maxHp * 0.4; // 2ª fase sotto il 40% di vita
  }

  update(dt, enemyBullets, targetX) {
    this.t += dt;
    if (this.entering) {
      this.y += 60 * dt;
      if (this.y >= 90) this.entering = false;
      return;
    }
    // Fase 2: si muove più veloce.
    const spd = this.enraged ? 1.4 : 0.8;
    this.x = this.w / 2 + Math.sin(this.t * spd) * (this.w / 2 - 80);
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      if (this.enraged) {
        // Fase 2: spirale rotante di proiettili.
        this.fireTimer = 0.14;
        this.spiralAngle += 0.42;
        for (let k = 0; k < 3; k++) {
          const ang = this.spiralAngle + k * (TAU / 3);
          enemyBullets.push(
            new Bullet(this.x, this.y, Math.cos(ang) * 230, Math.abs(Math.sin(ang)) * 120 + 140, {
              color: PALETTE.boss,
              r: 6,
              friendly: false,
            })
          );
        }
      } else {
        // Fase 1: ventaglio + colpo mirato.
        this.fireTimer = 1.1;
        const n = 7;
        for (let i = 0; i < n; i++) {
          const ang = Math.PI / 2 + (i - (n - 1) / 2) * 0.28;
          enemyBullets.push(
            new Bullet(this.x, this.y + 30, Math.cos(ang) * 240, Math.sin(ang) * 240, {
              color: PALETTE.boss,
              r: 6,
              friendly: false,
            })
          );
        }
        const dx = targetX - this.x;
        const dy = 320;
        const m = Math.hypot(dx, dy) || 1;
        enemyBullets.push(
          new Bullet(this.x, this.y + 30, (dx / m) * 300, (dy / m) * 300, {
            color: PALETTE.combo,
            r: 6,
            friendly: false,
          })
        );
        sfx.enemyLaser();
      }
    }
  }

  hit(dmg = 1) {
    this.hp -= dmg;
    this.hitFlash = 0.08;
    if (this.hp <= 0) this.dead = true;
    return this.hp <= 0;
  }

  draw(ctx) {
    const enraged = this.enraged;
    const base = this.hitFlash > 0 ? "#ffffff" : PALETTE.boss;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = PALETTE.boss;
    ctx.shadowBlur = enraged ? 40 : 30;

    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, this.r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.4, base);
    g.addColorStop(1, PALETTE.boss);
    ctx.fillStyle = this.hitFlash > 0 ? "#ffffff" : g;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + this.t * (enraged ? 1.2 : 0.4);
      const rad = i % 2 === 0 ? this.r : this.r * 0.7;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad * 0.7;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Occhio centrale pulsante.
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.bossEye;
    const eye = 12 + (enraged ? Math.sin(this.t * 12) * 3 : 0);
    ctx.beginPath();
    ctx.arc(0, 0, eye, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    // Barra vita in alto.
    const bw = 400;
    const bx = this.w / 2 - bw / 2;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(bx, 16, bw, 10);
    ctx.fillStyle = enraged ? PALETTE.combo : PALETTE.boss;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.fillRect(bx, 16, bw * Math.max(0, this.hp / this.maxHp), 10);
    ctx.shadowBlur = 0;
  }
}
