// Power-up che cadono dai nemici distrutti: triplo colpo, scudo, vita extra.
import { choose, TAU } from "./utils.js";

const TYPES = {
  triple: { color: "#7df9ff", label: "3" },
  shield: { color: "#4dffa6", label: "S" },
  life: { color: "#ff5bd0", label: "+" },
};

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = 12;
    this.vy = 90;
    this.dead = false;
    this.t = 0;
  }

  static randomType() {
    return choose(["triple", "shield", "life"]);
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
    ctx.strokeStyle = info.color;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.shadowColor = info.color;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = info.color;
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(info.label, 0, 1);
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}
