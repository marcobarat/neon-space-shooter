// Nemici: tre tipi (dritto, zigzag, sparatore) con due VARIANTI di pattern
// ciascuno, più un boss a due fasi. Estetica neon con gradienti e glow a strati.
import { rand, TAU } from "./utils.js";
import { Bullet } from "./bullets.js";
import { sfx } from "./audio.js";
import { PALETTE } from "./palette.js";
import { drawStraight, drawZigzag, drawShooter, drawBoss } from "./creatures.js";

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
    // Delega il disegno alla "creatura" corrispondente al tipo.
    if (this.type === "straight") drawStraight(ctx, this);
    else if (this.type === "zigzag") drawZigzag(ctx, this);
    else drawShooter(ctx, this);
  }
}

export class Boss {
  constructor(w, level) {
    this.w = w;
    this.x = w / 2;
    this.y = -60;
    this.r = 46;
    this.maxHp = 32 + level * 9; // ridotto: più abbordabile
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
    return this.hp <= this.maxHp * 0.33; // 2ª fase solo sotto il 33% di vita
  }

  update(dt, enemyBullets, targetX) {
    this.t += dt;
    if (this.entering) {
      this.y += 60 * dt;
      if (this.y >= 90) this.entering = false;
      return;
    }
    // Fase 2: si muove un po' più veloce (ma non frenetico).
    const spd = this.enraged ? 1.05 : 0.8;
    this.x = this.w / 2 + Math.sin(this.t * spd) * (this.w / 2 - 80);
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      if (this.enraged) {
        // Fase 2: spirale rotante, ma RADA e lenta -> schivabile.
        this.fireTimer = 0.32;
        this.spiralAngle += 0.55;
        for (let k = 0; k < 2; k++) {
          const ang = this.spiralAngle + k * Math.PI;
          enemyBullets.push(
            new Bullet(this.x, this.y, Math.cos(ang) * 150, Math.abs(Math.sin(ang)) * 90 + 120, {
              color: PALETTE.boss,
              r: 6,
              friendly: false,
            })
          );
        }
      } else {
        // Fase 1: ventaglio più stretto e lento + colpo mirato.
        this.fireTimer = 1.5;
        const n = 5;
        for (let i = 0; i < n; i++) {
          const ang = Math.PI / 2 + (i - (n - 1) / 2) * 0.26;
          enemyBullets.push(
            new Bullet(this.x, this.y + 30, Math.cos(ang) * 190, Math.sin(ang) * 190, {
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
          new Bullet(this.x, this.y + 30, (dx / m) * 240, (dy / m) * 240, {
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
    // Corpo del kraken/cervello disegnato dal modulo creature.
    drawBoss(ctx, this, enraged);

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
