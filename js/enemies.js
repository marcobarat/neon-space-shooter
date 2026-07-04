// Nemici: tipi base (dritto, zigzag, sparatore) con varianti + nuovi tipi con
// comportamenti veri (tank, kamikaze, splitter, sniper, mine). L'arte è in creatures.js.
import { rand, punchScale, TAU } from "./utils.js";
import { Bullet } from "./bullets.js";
import { sfx } from "./audio.js";
import { PALETTE } from "./palette.js";
import {
  drawStraight, drawZigzag, drawShooter,
  drawTank, drawKamikaze, drawSplitter, drawSniper, drawMine,
  applyMaterial,
} from "./creatures.js";

// Statistiche per tipo.
const STATS = {
  straight: { hp: 1, r: 15, speed: 110, score: 100 },
  zigzag: { hp: 1, r: 15, speed: 90, score: 150 },
  shooter: { hp: 2, r: 15, speed: 110, score: 200 },
  tank: { hp: 7, r: 22, speed: 52, score: 350 },
  kamikaze: { hp: 1, r: 14, speed: 90, score: 180 },
  splitter: { hp: 2, r: 16, speed: 95, score: 160 },
  splitling: { hp: 1, r: 9, speed: 150, score: 60 },
  sniper: { hp: 2, r: 15, speed: 70, score: 250 },
  mine: { hp: 1, r: 13, speed: 40, score: 200 },
};

export class Enemy {
  constructor(type, x, w, variant = 0, color = null, fireMul = 1, skin = 0) {
    const st = STATS[type] || STATS.straight;
    this.type = type;
    this.variant = variant;
    this.skin = skin; // indice del mondo → materiale (bio/bulloni/cristallo/magma/wire)
    this.x = x;
    this.y = -30;
    this.w = w;
    this.r = st.r;
    this.hp = st.hp;
    this.speed = st.speed;
    this.score = st.score;
    this.dead = false;
    this.hitFlash = 0;
    this.knock = 0;   // contraccolpo VISIVO (non tocca la hitbox) quando colpito
    this.t = rand(0, TAU);
    this.baseX = x;
    this.fireTimer = rand(1, 2.5);
    this.aiming = 0;   // sniper: fase di mira (telegrafo)
    this.aimDir = 0;
    this.color = color || PALETTE.straight;
    this.fireMul = fireMul;
  }

  update(dt, enemyBullets, px, py) {
    this.t += dt;

    switch (this.type) {
      case "zigzag": {
        if (this.variant === 1) this.speed += 45 * dt;
        const amp = this.variant === 1 ? 60 : 90;
        const freq = this.variant === 1 ? 3.4 : 2.5;
        this.x = this.baseX + Math.sin(this.t * freq) * amp;
        this.y += this.speed * dt;
        break;
      }
      case "straight": {
        if (this.variant === 1) this.x = this.baseX + Math.sin(this.t * 1.5) * 45;
        this.y += this.speed * dt;
        break;
      }
      case "shooter": {
        this.y += this.speed * dt;
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && this.y > 0 && this.y < this.w) {
          if (this.variant === 1) {
            this.fireTimer = rand(2.2, 3.2) / this.fireMul;
            for (let k = -1; k <= 1; k++) {
              enemyBullets.push(new Bullet(this.x, this.y + 12, k * 130, 240, { color: PALETTE.enemyBullet, r: 5, friendly: false }));
            }
          } else {
            this.fireTimer = rand(1.5, 3) / this.fireMul;
            const dx = px - this.x, dy = 300;
            const m = Math.hypot(dx, dy) || 1;
            enemyBullets.push(new Bullet(this.x, this.y + 12, (dx / m) * 260, (dy / m) * 260, { color: this.color, r: 5, friendly: false }));
          }
          sfx.enemyLaser();
        }
        break;
      }
      case "tank": {
        this.x = this.baseX + Math.sin(this.t * 0.8) * 24;
        this.y += this.speed * dt;
        break;
      }
      case "kamikaze": {
        // Si tuffa verso il player accelerando.
        const dx = px - this.x;
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), 190 * dt);
        this.speed = Math.min(340, this.speed + 150 * dt);
        this.y += this.speed * dt;
        break;
      }
      case "sniper": {
        if (this.y < 110) {
          this.y += this.speed * dt;
        } else if (this.aiming > 0) {
          this.aiming -= dt;
          if (this.aiming <= 0) {
            enemyBullets.push(new Bullet(this.x, this.y + 8, Math.cos(this.aimDir) * 440, Math.sin(this.aimDir) * 440, { color: this.color, r: 4, friendly: false }));
            this.fireTimer = rand(1.6, 2.6) / this.fireMul;
            sfx.enemyLaser();
          }
        } else {
          this.fireTimer -= dt;
          if (this.fireTimer <= 0) {
            this.aiming = 0.5;
            this.aimDir = Math.atan2(py - this.y, px - this.x);
          }
        }
        break;
      }
      case "splitter":
      case "splitling": {
        this.x = this.baseX + Math.sin(this.t * 2) * 30;
        this.y += this.speed * dt;
        break;
      }
      case "mine": {
        this.x = this.baseX + Math.sin(this.t * 1.2) * 40;
        this.y += this.speed * dt;
        const dx = px - this.x, dy = py - this.y;
        if (dx * dx + dy * dy < 72 * 72) {
          const n = 10;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU;
            enemyBullets.push(new Bullet(this.x, this.y, Math.cos(a) * 190, Math.sin(a) * 190, { color: this.color, r: 5, friendly: false }));
          }
          this.dead = true;
          this.exploded = true;
          sfx.enemyLaser();
        }
        break;
      }
      default:
        this.y += this.speed * dt;
    }

    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.knock = Math.max(0, this.knock - dt * 34);
    if (this.y > 660) this.dead = true;
  }

  hit(dmg = 1) {
    this.hp -= dmg;
    this.hitFlash = 0.1;
    this.knock = Math.min(6, this.knock + 4); // sobbalzo verso l'alto
    if (this.hp <= 0) this.dead = true;
    return this.hp <= 0;
  }

  draw(ctx) {
    // Scale-punch + contraccolpo visivo attorno al centro del nemico.
    if (this.hitFlash > 0 || this.knock > 0) {
      const s = punchScale(this.hitFlash);
      ctx.save();
      ctx.translate(this.x, this.y - this.knock);
      ctx.scale(s, s);
      ctx.translate(-this.x, -this.y);
      this._drawShape(ctx);
      ctx.restore();
      return;
    }
    this._drawShape(ctx);
  }

  _drawShape(ctx) {
    switch (this.type) {
      case "straight": drawStraight(ctx, this); break;
      case "zigzag": drawZigzag(ctx, this); break;
      case "shooter": drawShooter(ctx, this); break;
      case "tank": drawTank(ctx, this); break;
      case "kamikaze": drawKamikaze(ctx, this); break;
      case "splitter":
      case "splitling": drawSplitter(ctx, this); break;
      case "sniper": drawSniper(ctx, this); break;
      case "mine": drawMine(ctx, this); break;
      default: drawStraight(ctx, this);
    }
    // Materiale del mondo (skin) sopra la forma, centrato sull'entità.
    if (this.hitFlash <= 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      applyMaterial(ctx, this, this.r);
      ctx.restore();
    }
  }
}
