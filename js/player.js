// La navicella del giocatore: movimento (tastiera+mouse), sparo a livelli
// persistenti, scudo, bombe. Le armi si potenziano raccogliendo "Power" e
// scendono di un livello quando si viene colpiti (niente timer).
import { clamp, TAU } from "./utils.js";
import { input } from "./input.js";
import { Bullet } from "./bullets.js";
import { sfx } from "./audio.js";
import { PALETTE } from "./palette.js";

const SPEED = 340;
const BASE_COOLDOWN = 0.16;
export const MAX_WEAPON = 4;

// Schema di sparo (puro, testabile): velocità dei proiettili per livello arma.
// dx = offset orizzontale rispetto al muso; vx/vy = velocità.
export function shotPattern(level) {
  if (level <= 0) return [{ dx: 0, vx: 0, vy: -640 }];
  if (level === 1)
    return [
      { dx: -8, vx: 0, vy: -640 },
      { dx: 8, vx: 0, vy: -640 },
    ];
  if (level === 2)
    return [
      { dx: 0, vx: 0, vy: -660 },
      { dx: 0, vx: -170, vy: -600 },
      { dx: 0, vx: 170, vy: -600 },
    ];
  // Livelli 3 e 4: spread a 5 vie.
  return [
    { dx: 0, vx: 0, vy: -660 },
    { dx: 0, vx: -140, vy: -620 },
    { dx: 0, vx: 140, vy: -620 },
    { dx: 0, vx: -300, vy: -540 },
    { dx: 0, vx: 300, vy: -540 },
  ];
}

export class Player {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.x = w / 2;
    this.y = h - 70;
    this.r = 14;
    this.lives = 3;
    this.cooldown = 0;
    this.shieldTime = 0;
    this.weaponLevel = 0; // 0..MAX_WEAPON, persistente
    this.bombs = 2;
    this.rocketCd = 0; // cadenza dei razzi (gestita da main a L4)
    this.invuln = 0;   // brevi frame di invulnerabilità dopo un colpo
    this.muzzle = 0;   // lampo alla bocca del cannone quando spara
    this.recoil = 0;   // rinculo visivo
  }

  get hasShield() {
    return this.shieldTime > 0;
  }

  addPowerup(type) {
    if (type === "power") this.weaponLevel = Math.min(MAX_WEAPON, this.weaponLevel + 1);
    else if (type === "bomb") this.bombs = Math.min(5, this.bombs + 1);
    else if (type === "shield") this.shieldTime = 6;
    else if (type === "life") this.lives = Math.min(5, this.lives + 1);
  }

  // Esito del colpo subìto, per dare feedback in main.
  // Ritorna "shield" | "weapon" | "life" | "dead".
  takeHit() {
    if (this.invuln > 0) return "shield"; // già invulnerabile: nessun effetto
    if (this.hasShield) {
      this.shieldTime = 0;
      this.invuln = 0.9;
      return "shield";
    }
    if (this.weaponLevel > 0) {
      this.weaponLevel -= 1; // l'arma fa da scudo: scendi di livello
      this.invuln = 1.0;
      return "weapon";
    }
    this.lives -= 1;
    this.invuln = 1.2;
    return this.lives > 0 ? "life" : "dead";
  }

  update(dt, bullets) {
    // Movimento: il mouse ha priorità se usato di recente, altrimenti tastiera.
    if (input.mouseActive) {
      this.x += (input.mouseX - this.x) * Math.min(1, dt * 12);
      this.y += (input.mouseY - this.y) * Math.min(1, dt * 12);
    }
    this.x += input.dx * SPEED * dt;
    this.y += input.dy * SPEED * dt;
    this.x = clamp(this.x, this.r, this.w - this.r);
    this.y = clamp(this.y, this.r, this.h - this.r);

    this.cooldown -= dt;
    this.shieldTime = Math.max(0, this.shieldTime - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.rocketCd = Math.max(0, this.rocketCd - dt);
    this.muzzle = Math.max(0, this.muzzle - dt * 6);
    this.recoil = Math.max(0, this.recoil - dt * 8);

    if (input.firing && this.cooldown <= 0) {
      this.shoot(bullets);
      this.cooldown = Math.max(0.1, BASE_COOLDOWN - this.weaponLevel * 0.008);
    }
  }

  shoot(bullets) {
    const opt = { color: PALETTE.bullet, core: PALETTE.bulletCore, r: 4, friendly: true };
    for (const s of shotPattern(this.weaponLevel)) {
      bullets.push(new Bullet(this.x + s.dx, this.y - 16, s.vx, s.vy, opt));
    }
    this.muzzle = 1;
    this.recoil = 5;
    sfx.laser();
  }

  draw(ctx) {
    // Lampeggio quando invulnerabile.
    if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y + this.recoil);

    // Muzzle flash.
    if (this.muzzle > 0) {
      ctx.globalAlpha = this.muzzle;
      const mg = ctx.createRadialGradient(0, -22, 0, 0, -22, 22);
      mg.addColorStop(0, PALETTE.bulletCore);
      mg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(0, -22, 22, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Fiamma del motore.
    ctx.fillStyle = PALETTE.flame;
    ctx.shadowColor = PALETTE.flame;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(-5, 10);
    ctx.lineTo(0, 10 + 8 + Math.random() * 10);
    ctx.lineTo(5, 10);
    ctx.closePath();
    ctx.fill();

    // Pod laterali che compaiono salendo di livello arma.
    if (this.weaponLevel >= 1) {
      ctx.fillStyle = PALETTE.player;
      ctx.shadowColor = PALETTE.player;
      ctx.shadowBlur = 12;
      const spread = 11 + this.weaponLevel;
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx * spread, 2);
        ctx.lineTo(sx * (spread + 5), 12);
        ctx.lineTo(sx * (spread - 2), 12);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Scafo con gradiente + alone.
    const g = ctx.createLinearGradient(0, -18, 0, 14);
    g.addColorStop(0, PALETTE.playerCore);
    g.addColorStop(1, PALETTE.player);
    ctx.fillStyle = g;
    ctx.shadowColor = PALETTE.player;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(13, 14);
    ctx.lineTo(0, 7);
    ctx.lineTo(-13, 14);
    ctx.closePath();
    ctx.fill();

    // Cabina.
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.bulletCore;
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (this.hasShield) {
      const pulse = 0.7 + Math.sin(performance.now() / 120) * 0.2;
      ctx.strokeStyle = `rgba(120,255,190,${pulse})`;
      ctx.shadowColor = PALETTE.shield;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r + 12, 0, TAU);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}
