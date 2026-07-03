// Power-up che cadono dai nemici: power (arma+), bomb, shield, life.
import { TAU } from "./utils.js";
import { PALETTE } from "./palette.js";

const TYPES = {
  power: { color: PALETTE.bullet },
  bomb: { color: "#ff9a3f" },
  shield: { color: PALETTE.shield },
  life: { color: PALETTE.life },
};

// Probabilità pesate: power comune, life raro.
const WEIGHTED = [
  ["power", 0.5],
  ["bomb", 0.2],
  ["shield", 0.2],
  ["life", 0.1],
];

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = 13;
    this.vy = 85;
    this.dead = false;
    this.t = 0;
  }

  static randomType() {
    let roll = Math.random();
    for (const [type, w] of WEIGHTED) {
      if (roll < w) return type;
      roll -= w;
    }
    return "power";
  }

  update(dt, h) {
    this.t += dt;
    this.y += this.vy * dt;
    if (this.y > h + 20) this.dead = true;
  }

  draw(ctx) {
    const info = TYPES[this.type];
    const pulse = 1 + Math.sin(this.t * 6) * 0.12;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);

    // Capsula.
    ctx.strokeStyle = info.color;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.shadowColor = info.color;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Icona per tipo.
    ctx.shadowBlur = 0;
    ctx.fillStyle = info.color;
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2;
    if (this.type === "power") {
      // freccia su
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 1);
      ctx.lineTo(2, 1);
      ctx.lineTo(2, 6);
      ctx.lineTo(-2, 6);
      ctx.lineTo(-2, 1);
      ctx.lineTo(-5, 1);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === "bomb") {
      // bomba con miccia
      ctx.beginPath();
      ctx.arc(0, 2, 5, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, -3);
      ctx.quadraticCurveTo(6, -6, 5, -8);
      ctx.stroke();
    } else if (this.type === "shield") {
      // scudo
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6, -3);
      ctx.lineTo(6, 2);
      ctx.quadraticCurveTo(0, 8, -6, 2);
      ctx.lineTo(-6, -3);
      ctx.closePath();
      ctx.fill();
    } else {
      // cuore (vita)
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.bezierCurveTo(-8, -1, -4, -8, 0, -3);
      ctx.bezierCurveTo(4, -8, 8, -1, 0, 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}
