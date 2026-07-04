// Boss: una base comune + 5 archetipi, uno per mondo. La factory createBoss()
// istanzia l'archetipo giusto. L'attacco riceve (dt, enemyBullets, px, py, api),
// dove api.spawnMinion(x) permette alla Regina di generare sciami.
import { TAU, rand, punchScale } from "./utils.js";
import { Bullet } from "./bullets.js";
import { sfx } from "./audio.js";
import { PALETTE, shade, withAlpha } from "./palette.js";
import { drawBoss, glowFill, eye, rim } from "./creatures.js";

const MONO = "'Consolas', 'SF Mono', ui-monospace, monospace";

// Rettangolo arrotondato compatibile (path corrente pronto per fill/stroke).
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, rr); return; }
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

class BossBase {
  constructor(w, level, color, fireMul) {
    this.w = w;
    this.x = w / 2;
    this.y = -60;
    this.r = 46;
    this.maxHp = 34 + level * 10;
    this.hp = this.maxHp;
    this.dead = false;
    this.hitFlash = 0;
    this.t = 0;
    this.entering = true;
    this.score = 2200 + level * 500;
    this.isBoss = true;
    this.color = color;
    this.fireMul = fireMul;
    this.name = "BOSS";
  }
  get enraged() {
    return this.hp <= this.maxHp * 0.4;
  }
  entryY() {
    return 100;
  }
  hit(dmg = 1) {
    this.hp -= dmg;
    this.hitFlash = 0.08;
    if (this.hp <= 0) this.dead = true;
    return this.hp <= 0;
  }
  update(dt, enemyBullets, px, py, api) {
    this.t += dt;
    if (this.entering) {
      this.y += 60 * dt;
      if (this.y >= this.entryY()) this.entering = false;
      return;
    }
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attack(dt, enemyBullets, px, py, api);
  }
  attack() {}
  drawBody() {}
  drawHealth(ctx) {
    const bw = Math.min(this.w - 48, 360);
    const bx = this.w / 2 - bw / 2;
    const by = 40;
    const bh = 7;
    const frac = Math.max(0, this.hp / this.maxHp);
    const col = this.enraged ? PALETTE.combo : this.color;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    // Nome boss con leggero tracking e glow tenue.
    ctx.font = `bold 12px ${MONO}`;
    ctx.fillStyle = withAlpha(col, 0.92);
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.fillText(this.name.split("").join(" "), this.w / 2, by - 6);
    ctx.shadowBlur = 0;
    // Traccia (backing) arrotondata.
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fill();
    // Riempimento con gradiente + glow.
    if (frac > 0) {
      roundRect(ctx, bx, by, bw * frac, bh, bh / 2);
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, shade(col, -0.15));
      g.addColorStop(0.5, col);
      g.addColorStop(1, shade(col, 0.35));
      ctx.fillStyle = g;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.fill();
      // Riflesso superiore.
      ctx.shadowBlur = 0;
      roundRect(ctx, bx + 1, by + 0.5, Math.max(0, bw * frac - 2), bh * 0.42, bh * 0.2);
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fill();
    }
    // Cornice sottile.
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.strokeStyle = withAlpha(col, 0.5);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  draw(ctx) {
    // Scale-punch sul colpo: il boss "reagisce" fisicamente ai danni.
    if (this.hitFlash > 0) {
      const s = punchScale(this.hitFlash, 2);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(s, s);
      ctx.translate(-this.x, -this.y);
      this.drawBody(ctx);
      ctx.restore();
    } else {
      this.drawBody(ctx);
    }
    this.drawHealth(ctx);
  }
}

// 1) KRAKEN — spirale + ventaglio (l'originale).
class KrakenBoss extends BossBase {
  constructor(w, level, color, fireMul) {
    super(w, level, color, fireMul);
    this.name = "KRAKEN";
    this.spiralAngle = 0;
    this.fireTimer = 1.5;
  }
  get enraged() {
    return this.hp <= this.maxHp * 0.33;
  }
  attack(dt, eb, px) {
    const spd = this.enraged ? 1.05 : 0.8;
    this.x = this.w / 2 + Math.sin(this.t * spd) * (this.w / 2 - 80);
    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;
    if (this.enraged) {
      this.fireTimer = 0.32 / this.fireMul;
      this.spiralAngle += 0.55;
      for (let k = 0; k < 2; k++) {
        const a = this.spiralAngle + k * Math.PI;
        eb.push(new Bullet(this.x, this.y, Math.cos(a) * 150, Math.abs(Math.sin(a)) * 90 + 120, { color: this.color, r: 6, friendly: false }));
      }
    } else {
      this.fireTimer = 1.5 / this.fireMul;
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.26;
        eb.push(new Bullet(this.x, this.y + 30, Math.cos(a) * 190, Math.sin(a) * 190, { color: this.color, r: 6, friendly: false }));
      }
      const dx = px - this.x, dy = 320, m = Math.hypot(dx, dy) || 1;
      eb.push(new Bullet(this.x, this.y + 30, (dx / m) * 240, (dy / m) * 240, { color: PALETTE.combo, r: 6, friendly: false }));
      sfx.enemyLaser();
    }
  }
  drawBody(ctx) {
    drawBoss(ctx, this, this.enraged);
  }
}

// 2) SERPENTE — testa che serpeggia con coda a segmenti.
class SerpentBoss extends BossBase {
  constructor(w, level, color, fireMul) {
    super(w, level, color, fireMul);
    this.name = "SERPENTE";
    this.r = 26;
    this.segs = [];
    this.fireTimer = 1.2;
  }
  entryY() {
    return 120;
  }
  attack(dt, eb, px, py) {
    this.x = this.w / 2 + Math.sin(this.t * 1.1) * (this.w / 2 - 60);
    this.y = 120 + Math.sin(this.t * 0.7) * 50;
    this.segs.unshift({ x: this.x, y: this.y });
    if (this.segs.length > 26) this.segs.pop();
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = (this.enraged ? 0.7 : 1.1) / this.fireMul;
      const base = Math.atan2(py - this.y, px - this.x);
      for (let s = -1; s <= 1; s++) {
        const ang = base + s * 0.2;
        eb.push(new Bullet(this.x, this.y, Math.cos(ang) * 230, Math.sin(ang) * 230, { color: this.color, r: 5, friendly: false }));
      }
      sfx.enemyLaser();
    }
  }
  drawBody(ctx) {
    for (let i = this.segs.length - 1; i >= 0; i--) {
      const s = this.segs[i];
      const f = 1 - i / this.segs.length;
      ctx.globalAlpha = 0.4 + 0.5 * f;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6 + f * 12, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.hitFlash > 0 ? "#ffffff" : glowFill(ctx, this.color, this.r);
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, TAU);
    ctx.fill();
    if (this.hitFlash <= 0) rim(ctx, this.color, 2.2, 14);
    if (this.hitFlash <= 0) eye(ctx, 0, 0, 10, PALETTE.bossEye, 1, 1);
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

// 3) FORTEZZA — cannoni che si "distruggono" (vanno offline) col calare della vita.
class FortressBoss extends BossBase {
  constructor(w, level, color, fireMul) {
    super(w, level, color, fireMul);
    this.name = "FORTEZZA";
    this.r = 54;
    this.fireTimer = 1.2;
  }
  entryY() {
    return 96;
  }
  cannons() {
    if (this.hp <= this.maxHp * 0.33) return 0;
    if (this.hp <= this.maxHp * 0.66) return 1;
    return 2;
  }
  attack(dt, eb, px) {
    this.x = this.w / 2 + Math.sin(this.t * 0.5) * (this.w / 2 - 100);
    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;
    const c = this.cannons();
    if (c > 0) {
      this.fireTimer = 1.0 / this.fireMul;
      const ports = c === 2 ? [-30, 30] : [0];
      for (const ox of ports) {
        const dx = px - (this.x + ox), dy = 300, m = Math.hypot(dx, dy) || 1;
        for (let s = -1; s <= 1; s++) {
          eb.push(new Bullet(this.x + ox, this.y + 20, (dx / m) * 220 + s * 40, (dy / m) * 220, { color: this.color, r: 5, friendly: false }));
        }
      }
    } else {
      this.fireTimer = 0.9 / this.fireMul;
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + this.t;
        eb.push(new Bullet(this.x, this.y, Math.cos(a) * 180, Math.sin(a) * 180, { color: PALETTE.combo, r: 5, friendly: false }));
      }
      sfx.enemyLaser();
    }
  }
  drawBody(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 26;
    ctx.fillStyle = this.hitFlash > 0 ? "#ffffff" : glowFill(ctx, this.color, this.r);
    ctx.beginPath();
    ctx.moveTo(-this.r, -14);
    ctx.lineTo(this.r, -14);
    ctx.lineTo(this.r * 0.7, 22);
    ctx.lineTo(-this.r * 0.7, 22);
    ctx.closePath();
    ctx.fill();
    if (this.hitFlash <= 0) rim(ctx, this.color, 2.4, 16);
    const c = this.cannons();
    const ports = c === 2 ? [-30, 30] : c === 1 ? [0] : [];
    ctx.fillStyle = this.color;
    for (const ox of ports) ctx.fillRect(ox - 6, 18, 12, 14);
    ctx.shadowBlur = 0;
    if (this.hitFlash <= 0) eye(ctx, 0, 0, c === 0 ? 14 : 9, c === 0 ? this.color : PALETTE.bossEye, 1, 1);
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

// 4) REGINA ALVEARE — genera sciami di minion + spore radiali.
class HiveBoss extends BossBase {
  constructor(w, level, color, fireMul) {
    super(w, level, color, fireMul);
    this.name = "REGINA ALVEARE";
    this.r = 44;
    this.fireTimer = 1.5;
    this.spawnTimer = 3;
  }
  attack(dt, eb, px, py, api) {
    this.x = this.w / 2 + Math.sin(this.t * 0.6) * (this.w / 2 - 90);
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = (this.enraged ? 1.4 : 2.0) / this.fireMul;
      const n = 10;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + rand(0, 0.3);
        eb.push(new Bullet(this.x, this.y, Math.cos(a) * 150, Math.abs(Math.sin(a)) * 80 + 90, { color: this.color, r: 5, friendly: false }));
      }
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && api && api.spawnMinion) {
      this.spawnTimer = this.enraged ? 2.6 : 3.8;
      const cnt = this.enraged ? 3 : 2;
      for (let i = 0; i < cnt; i++) api.spawnMinion(this.x + rand(-40, 40));
      sfx.boss();
    }
  }
  drawBody(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 26;
    ctx.fillStyle = this.hitFlash > 0 ? "#ffffff" : glowFill(ctx, this.color, this.r);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + Math.PI / 6;
      const px = Math.cos(a) * this.r;
      const py = Math.sin(a) * this.r * 0.9;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    if (this.hitFlash <= 0) rim(ctx, this.color, 2.4, 16);
    ctx.strokeStyle = "rgba(10,4,16,0.3)";
    ctx.lineWidth = 2;
    for (const cell of [[-14, -6], [14, -6], [0, 10]]) {
      ctx.beginPath();
      ctx.arc(cell[0], cell[1], 7, 0, TAU);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    if (this.hitFlash <= 0) eye(ctx, 0, -2, 8, PALETTE.bossEye, 1, 1);
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

// 5) NUCLEO LASER — carica e spazza un fascio (stream di proiettili rotante).
class LaserBoss extends BossBase {
  constructor(w, level, color, fireMul) {
    super(w, level, color, fireMul);
    this.name = "NUCLEO LASER";
    this.r = 40;
    this.phase = "idle";
    this.timer = 2;
    this.angle = Math.PI / 2;
    this.sweepDir = 1;
  }
  entryY() {
    return 110;
  }
  attack(dt, eb, px, py) {
    this.x = this.w / 2 + Math.sin(this.t * 0.4) * (this.w / 2 - 120);
    this.timer -= dt;
    if (this.phase === "idle") {
      if (this.timer <= 0) {
        this.phase = "charge";
        this.timer = 1.1;
        this.angle = Math.atan2(py - this.y, px - this.x);
        this.sweepDir = px < this.x ? 1 : -1;
      }
    } else if (this.phase === "charge") {
      if (this.timer <= 0) {
        this.phase = "fire";
        this.timer = 1.4;
      }
    } else {
      this.angle += this.sweepDir * 1.1 * dt;
      for (let s = 0; s < 2; s++) {
        eb.push(new Bullet(this.x, this.y, Math.cos(this.angle) * 460, Math.sin(this.angle) * 460, { color: PALETTE.combo, r: 5, friendly: false }));
      }
      if (this.timer <= 0) {
        this.phase = "idle";
        this.timer = this.enraged ? 1.6 : 2.6;
      }
    }
  }
  drawBody(ctx) {
    if (this.phase === "charge") {
      // Telegrafo che "cresce" col progredire della carica: linea più spessa e
      // luminosa quando manca poco allo sweep, così è chiaro da dove arriva.
      const charge = 1 - Math.max(0, this.timer) / 1.1; // 0 → 1
      ctx.save();
      ctx.strokeStyle = `rgba(255,60,90,${0.25 + 0.55 * charge * (0.6 + 0.4 * Math.abs(Math.sin(this.t * 20)))})`;
      ctx.shadowColor = "rgba(255,60,90,0.9)";
      ctx.shadowBlur = 10 * charge;
      ctx.lineWidth = 2 + 4 * charge;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + Math.cos(this.angle) * 900, this.y + Math.sin(this.angle) * 900);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 30;
    ctx.fillStyle = this.hitFlash > 0 ? "#ffffff" : glowFill(ctx, this.color, this.r);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + this.t * 0.6;
      const rr = i % 2 ? this.r * 0.55 : this.r;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    if (this.hitFlash <= 0) rim(ctx, this.color, 2.2, 16);
    ctx.shadowBlur = 0;
    if (this.hitFlash <= 0) eye(ctx, 0, 0, 12, this.phase === "fire" ? PALETTE.combo : this.color, 1, 1);
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

const TYPES = {
  kraken: KrakenBoss,
  serpent: SerpentBoss,
  fortress: FortressBoss,
  hive: HiveBoss,
  laser: LaserBoss,
};

export function createBoss(bossType, w, level, color, fireMul) {
  const C = TYPES[bossType] || KrakenBoss;
  return new C(w, level, color, fireMul);
}
