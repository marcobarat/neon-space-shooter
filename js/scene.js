// Scene di sfondo animate, una per mondo (decorative, non collidono).
// Disegnate dietro alle stelle. initScene() al cambio mondo, updateScene(dt) nel
// game loop, drawScene(ctx) nel render.
import { TAU, rand } from "./utils.js";

let cur = null; // { id, W, H, time, items }

export function initScene(id, W, H, theme) {
  const s = { id, W, H, time: 0, theme, items: null, shoot: 0 };
  if (id === "galaxy") {
    // Punti lungo due bracci a spirale.
    const pts = [];
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 90; i++) {
        const a = (i / 90) * 6 + arm * Math.PI;
        const r = 6 + i * 2.2;
        pts.push({ a, r, size: rand(0.6, 2) });
      }
    }
    s.items = { cx: W * 0.72, cy: H * 0.26, pts };
  } else if (id === "asteroids") {
    s.items = Array.from({ length: 14 }, () => ({
      x: rand(0, W), y: rand(0, H), r: rand(8, 26), rot: rand(0, TAU),
      vr: rand(-0.4, 0.4), vy: rand(14, 34), vx: rand(-6, 6),
    }));
  } else if (id === "ember") {
    s.items = Array.from({ length: 46 }, () => ({
      x: rand(0, W), y: rand(0, H), r: rand(1, 3), vy: rand(20, 55), tw: rand(0, TAU),
    }));
  } else if (id === "void") {
    s.items = [
      { x: W * 0.2, y: H * 0.3, r: 46 },
      { x: W * 0.82, y: H * 0.7, r: 60 },
    ];
  }
  // "aurora" non ha items: bande sinusoidali procedurali.
  cur = s;
}

export function updateScene(dt) {
  if (!cur) return;
  cur.time += dt;
  cur.shoot -= dt;
  if (cur.id === "asteroids") {
    for (const a of cur.items) {
      a.y += a.vy * dt;
      a.x += a.vx * dt;
      a.rot += a.vr * dt;
      if (a.y - a.r > cur.H) {
        a.y = -a.r;
        a.x = rand(0, cur.W);
      }
    }
  } else if (cur.id === "ember") {
    for (const p of cur.items) {
      p.y -= p.vy * dt;
      if (p.y < -4) {
        p.y = cur.H + 4;
        p.x = rand(0, cur.W);
      }
    }
  }
}

export function drawScene(ctx) {
  if (!cur) return;
  const t = cur.time;
  const th = cur.theme;
  switch (cur.id) {
    case "galaxy": {
      const { cx, cy, pts } = cur.items;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.05);
      ctx.fillStyle = th.star;
      for (const p of pts) {
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(Math.cos(p.a) * p.r, Math.sin(p.a) * p.r * 0.5, p.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = th.nebula[0];
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      break;
    }
    case "asteroids": {
      for (const a of cur.items) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "rgba(120,130,120,0.5)";
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
          const ang = (i / 7) * TAU;
          const rr = a.r * (0.75 + Math.sin(i * 2.1) * 0.2);
          const px = Math.cos(ang) * rr;
          const py = Math.sin(ang) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "aurora": {
      ctx.save();
      for (let b = 0; b < 3; b++) {
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = th.nebula[b % th.nebula.length];
        ctx.beginPath();
        const y0 = cur.H * (0.2 + b * 0.12);
        ctx.moveTo(0, y0);
        for (let x = 0; x <= cur.W; x += 40) {
          ctx.lineTo(x, y0 + Math.sin(x * 0.01 + t * (0.6 + b * 0.2)) * 26);
        }
        ctx.lineTo(cur.W, y0 + 40);
        ctx.lineTo(0, y0 + 40);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      break;
    }
    case "ember": {
      for (const p of cur.items) {
        ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(t * 3 + p.tw));
        ctx.fillStyle = "#ff8a3f";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "void": {
      for (const g of cur.items) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(t * 0.03);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = th.star;
        for (let i = 0; i < 40; i++) {
          const a = (i / 40) * 4;
          const r = i * 1.3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.4, 1.3, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    }
  }
}
