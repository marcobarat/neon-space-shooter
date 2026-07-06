// Scene di sfondo animate, una per mondo (decorative, non collidono).
// Disegnate dietro alle stelle. initScene() al cambio mondo, updateScene(dt) nel
// game loop, drawScene(ctx) nel render.
import { TAU, rand } from "./utils.js";

let cur = null; // { id, W, H, time, items, far }

// ---- Grana animata (film grain) ----
// Un tile di rumore monocromo cotto UNA volta; per-frame si stampa con un
// offset intero → l'occhio la percepisce viva ma costa un solo fill di pattern.
let noiseTile = null;
let noisePattern = null;
function getNoisePattern(ctx) {
  if (noisePattern) return noisePattern;
  noiseTile = document.createElement("canvas");
  noiseTile.width = noiseTile.height = 128;
  const nc = noiseTile.getContext("2d");
  const img = nc.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = Math.random() < 0.5 ? 10 : 0; // alpha ~4%
  }
  nc.putImageData(img, 0, 0);
  noisePattern = ctx.createPattern(noiseTile, "repeat");
  return noisePattern;
}

export function drawGrain(ctx, t, W, H) {
  const ox = ((t * 61) | 0) % 128;
  const oy = ((t * 37) | 0) % 128;
  ctx.save();
  ctx.translate(-ox, -oy);
  ctx.fillStyle = getNoisePattern(ctx);
  ctx.fillRect(0, 0, W + 128, H + 128);
  ctx.restore();
}

export function initScene(id, W, H, theme) {
  const s = { id, W, H, time: 0, theme, items: null, shoot: 0 };
  // Layer LONTANO (parallasse): grandi forme fioche che si muovono meno del
  // resto → profondità vera anche in portrait.
  s.far = Array.from({ length: 7 }, () => ({
    x: rand(0, W), y: rand(0, H), r: rand(26, 70),
    a: rand(0.05, 0.11), rot: rand(0, TAU), vy: rand(3, 8),
  }));
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
  // deriva lentissima del layer lontano
  for (const f of cur.far) {
    f.y += f.vy * dt;
    if (f.y - f.r > cur.H) { f.y = -f.r; f.x = rand(0, cur.W); }
  }
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

// Disegna il layer lontano nello "spirito" della scena: silhouette per gli
// asteroidi, foschia per l'aurora, colonne di bagliore per l'inferno,
// monoliti per il vuoto, ammassi stellari per la galassia.
function drawFar(ctx, px) {
  const th = cur.theme;
  ctx.save();
  ctx.translate(px * 0.45, 0);
  for (const f of cur.far) {
    ctx.globalAlpha = f.a;
    switch (cur.id) {
      case "asteroids": {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.fillStyle = "#9db3a6";
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          const rr = f.r * (0.7 + Math.sin(i * 2.4) * 0.22);
          i === 0 ? ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
      case "ember": {
        const g = ctx.createLinearGradient(f.x, f.y - f.r * 2, f.x, f.y + f.r * 2);
        g.addColorStop(0, "rgba(255,120,40,0)");
        g.addColorStop(0.5, "rgba(255,140,50,0.5)");
        g.addColorStop(1, "rgba(255,60,30,0)");
        ctx.fillStyle = g;
        ctx.fillRect(f.x - f.r * 0.3, f.y - f.r * 2, f.r * 0.6, f.r * 4);
        break;
      }
      case "void": {
        ctx.fillStyle = "#020a10";
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot * 0.2);
        ctx.fillRect(-f.r * 0.18, -f.r, f.r * 0.36, f.r * 2);
        ctx.restore();
        break;
      }
      default: { // galaxy / aurora: foschia tinta della nebulosa
        ctx.fillStyle = th.nebula[(f.r | 0) % th.nebula.length];
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, f.r * 1.6, f.r * 0.6, f.rot, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawScene(ctx, px = 0) {
  if (!cur) return;
  const t = cur.time;
  const th = cur.theme;
  drawFar(ctx, px);
  ctx.save();
  ctx.translate(px * 0.18, 0);
  switch (cur.id) {
    case "galaxy": {
      const { cx, cy, pts } = cur.items;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.05);
      // Alone della galassia (additivo, tinta della nebulosa).
      ctx.globalCompositeOperation = "lighter";
      const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 120);
      halo.addColorStop(0, "rgba(255,240,255,0.5)");
      halo.addColorStop(0.25, th.nebula[0]);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.save();
      ctx.scale(1, 0.5);
      ctx.beginPath(); ctx.arc(0, 0, 120, 0, TAU); ctx.fill();
      ctx.restore();
      // Bracci a spirale: stelle luminose che sfumano verso l'esterno.
      for (const p of pts) {
        const fall = Math.max(0.12, 1 - p.r / 210);
        ctx.globalAlpha = 0.55 * fall;
        ctx.fillStyle = p.r < 60 ? "#fff4ff" : th.star;
        ctx.beginPath();
        ctx.arc(Math.cos(p.a) * p.r, Math.sin(p.a) * p.r * 0.5, p.size, 0, TAU);
        ctx.fill();
      }
      // Nucleo brillante.
      ctx.globalAlpha = 1;
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
      core.addColorStop(0, "#ffffff");
      core.addColorStop(1, "rgba(255,220,255,0)");
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      break;
    }
    case "asteroids": {
      for (const a of cur.items) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        ctx.globalAlpha = 0.6;
        // Roccia ombreggiata: luce in alto a sinistra, ombra in basso a destra.
        const g = ctx.createRadialGradient(-a.r * 0.4, -a.r * 0.4, a.r * 0.15, 0, 0, a.r);
        g.addColorStop(0, "rgba(150,160,150,0.6)");
        g.addColorStop(1, "rgba(40,46,50,0.5)");
        ctx.fillStyle = g;
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
        ctx.strokeStyle = "rgba(190,210,200,0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "aurora": {
      ctx.save();
      for (let b = 0; b < 4; b++) {
        ctx.globalAlpha = b === 3 ? 0.07 : 0.12;
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
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const p of cur.items) {
        ctx.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(t * 3 + p.tw));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
        g.addColorStop(0, "#ffe08a");
        g.addColorStop(0.4, "#ff8a3f");
        g.addColorStop(1, "rgba(255,80,40,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.4, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      break;
    }
    case "void": {
      for (const g of cur.items) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.globalCompositeOperation = "lighter";
        // Nucleo luminoso della galassia lontana.
        const core = ctx.createRadialGradient(0, 0, 1, 0, 0, g.r * 1.1);
        core.addColorStop(0, "rgba(220,245,255,0.5)");
        core.addColorStop(0.3, th.nebula[0]);
        core.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = core;
        ctx.save(); ctx.scale(1, 0.4);
        ctx.beginPath(); ctx.arc(0, 0, g.r * 1.1, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.rotate(t * 0.03);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = th.star;
        for (let i = 0; i < 40; i++) {
          const a = (i / 40) * 4;
          const r = i * 1.3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.4, 1.3 * (1 - i / 60), 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    }
  }
  ctx.restore();
}
