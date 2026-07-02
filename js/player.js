// La navicella del giocatore: movimento (tastiera+mouse), sparo, scudo, tri-shot.
import { clamp, TAU } from "./utils.js";
import { input } from "./input.js";
import { Bullet } from "./bullets.js";
import { sfx } from "./audio.js";
import { PALETTE } from "./palette.js";

const SPEED = 340;
const FIRE_COOLDOWN = 0.16;

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
    this.tripleTime = 0;
    this.invuln = 0;  // brevi frame di invulnerabilità dopo un colpo
    this.muzzle = 0;  // lampo alla bocca del cannone quando spara
    this.recoil = 0;  // rinculo visivo
  }

  get hasShield() {
    return this.shieldTime > 0;
  }

  addPowerup(type) {
    if (type === "triple") this.tripleTime = 8;
    else if (type === "shield") this.shieldTime = 6;
    else if (type === "life") this.lives = Math.min(5, this.lives + 1);
  }

  // Ritorna true se il player sopravvive, false se ha perso l'ultima vita.
  takeHit() {
    if (this.invuln > 0) return true;
    if (this.hasShield) {
      this.shieldTime = 0;
      this.invuln = 0.8;
      return true;
    }
    this.lives -= 1;
    this.invuln = 1.2;
    return this.lives > 0;
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
    this.tripleTime = Math.max(0, this.tripleTime - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.muzzle = Math.max(0, this.muzzle - dt * 6);
    this.recoil = Math.max(0, this.recoil - dt * 8);

    if (input.firing && this.cooldown <= 0) {
      this.shoot(bullets);
      this.cooldown = FIRE_COOLDOWN;
    }
  }

  shoot(bullets) {
    const opt = { color: PALETTE.bullet, core: PALETTE.bulletCore, r: 4, friendly: true };
    if (this.tripleTime > 0) {
      bullets.push(new Bullet(this.x, this.y - 16, 0, -620, opt));
      bullets.push(new Bullet(this.x, this.y - 16, -180, -580, opt));
      bullets.push(new Bullet(this.x, this.y - 16, 180, -580, opt));
    } else {
      bullets.push(new Bullet(this.x, this.y - 16, 0, -640, opt));
    }
    this.muzzle = 1;   // innesca il lampo
    this.recoil = 5;   // e il rinculo
    sfx.laser();
  }

  draw(ctx) {
    // Lampeggio quando invulnerabile.
    if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y + this.recoil); // rinculo verso il basso

    // Muzzle flash: bagliore luminoso davanti al muso quando spara.
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

    // Fiamma del motore (dietro, pulsante).
    ctx.fillStyle = PALETTE.flame;
    ctx.shadowColor = PALETTE.flame;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(-5, 10);
    ctx.lineTo(0, 10 + 8 + Math.random() * 10);
    ctx.lineTo(5, 10);
    ctx.closePath();
    ctx.fill();

    // Scafo: gradiente dal nucleo chiaro al neon, con alone.
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

    // Cabina: piccolo nucleo luminoso.
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
