// Super-armi (ultimate): definizioni, icone uniche e droni orbitali.
// Gli effetti veri (laser/nova/timeslow/missili) sono orchestrati da main.js;
// qui stanno metadati, icone e la classe Drone.
import { TAU } from "./utils.js";
import { Bullet } from "./bullets.js";
import { sfx } from "./audio.js";
import { PALETTE } from "./palette.js";

export const SUPER_TYPES = ["laser", "timeslow", "drones", "nova", "missiles"];

export const SUPER_INFO = {
  laser: { name: "LASER", color: "#7df9ff", duration: 3.5 },
  timeslow: { name: "RALLENTA", color: "#4dffa6", duration: 4.0 },
  drones: { name: "DRONI", color: "#ffd23f", duration: 6.0 },
  nova: { name: "NOVA", color: "#ff9a3f", duration: 3.0 },
  missiles: { name: "MISSILI", color: "#ff5bd0", duration: 3.0 },
};

export function randomSuperType() {
  return SUPER_TYPES[Math.floor(Math.random() * SUPER_TYPES.length)];
}

// Fattore di rallentamento del tempo per nemici/proiettili durante "timeslow".
export const TIMESLOW_FACTOR = 0.35;

// Icona unica per ogni super (disegnata centrata in (x,y), raggio ~s).
export function drawSuperIcon(ctx, type, x, y, s) {
  const info = SUPER_INFO[type];
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = info.color;
  ctx.strokeStyle = info.color;
  ctx.shadowColor = info.color;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  if (type === "laser") {
    ctx.fillRect(-s * 0.18, -s, s * 0.36, s * 2);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-s * 0.4, -s, s * 0.14, s * 2);
    ctx.fillRect(s * 0.26, -s, s * 0.14, s * 2);
    ctx.globalAlpha = 1;
  } else if (type === "timeslow") {
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -s * 0.7);
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.5, s * 0.2);
    ctx.stroke();
  } else if (type === "drones") {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, TAU);
    ctx.fill();
    for (const a of [0, TAU / 3, (2 * TAU) / 3]) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s, Math.sin(a) * s, s * 0.28, 0, TAU);
      ctx.fill();
    }
  } else if (type === "nova") {
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const rr = i % 2 ? s * 0.45 : s;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    // missiles: due piccoli razzi
    for (const ox of [-s * 0.4, s * 0.4]) {
      ctx.beginPath();
      ctx.moveTo(ox, -s);
      ctx.lineTo(ox + s * 0.32, s * 0.6);
      ctx.lineTo(ox - s * 0.32, s * 0.6);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}

// Drone orbitante che spara verso l'alto (super "drones").
export class Drone {
  constructor(offset) {
    this.offset = offset; // fase angolare
    this.angle = offset;
    this.x = 0;
    this.y = 0;
    this.r = 9; // raggio di contatto: i droni BLOCCANO i proiettili nemici
    this.cd = 0;
  }
  update(dt, player, bullets) {
    this.angle += dt * 3;
    this.x = player.x + Math.cos(this.angle) * 42;
    this.y = player.y + Math.sin(this.angle) * 42;
    this.cd -= dt;
    if (this.cd <= 0) {
      this.cd = 0.22;
      bullets.push(new Bullet(this.x, this.y - 6, 0, -600, { color: PALETTE.combo, core: "#ffffff", r: 3, friendly: true }));
      sfx.laser();
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = PALETTE.combo;
    ctx.shadowColor = PALETTE.combo;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}
