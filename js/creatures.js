// Helper di disegno dei BOSS (glowFill/rim/eye + drawBoss del Kraken).
// I nemici comuni vivono nel bestiario per mondo: js/bestiary/.
import { TAU } from "./utils.js";
import { PALETTE, shade, withAlpha } from "./palette.js";

// Riempimento volumetrico: highlight in alto a sinistra, tinta satura al centro,
// bordo scurito → dà volume invece della tinta piatta "clip-art".
// I gradienti sono MEMOIZZATI per (colore, raggio): crearli ogni frame per ogni
// entità era uno dei costi principali del frame su mobile.
const gradCache = new Map();
export function glowFill(ctx, base, r) {
  const key = base + "|" + r;
  let g = gradCache.get(key);
  if (!g) {
    g = ctx.createRadialGradient(-r * 0.34, -r * 0.44, r * 0.05, 0, 0, r * 1.06);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.26, shade(base, 0.42));
    g.addColorStop(0.68, base);
    g.addColorStop(1, shade(base, -0.5));
    gradCache.set(key, g);
  }
  return g;
}

// Rim-light neon: ripassa il contorno CORRENTE con un bordo luminoso.
// Da chiamare subito dopo un fill (il path resta attivo).
export function rim(ctx, base, w = 1.6, blur = 9) {
  ctx.save();
  ctx.strokeStyle = shade(base, 0.55);
  ctx.shadowColor = base;
  ctx.shadowBlur = blur;
  ctx.lineWidth = w;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

// Occhio riutilizzabile: sclera lucida, iride sfumata, pupilla, riflessi.
export function eye(ctx, x, y, rad, iris, look = 0.35, blink = 1) {
  ctx.save();
  ctx.shadowBlur = 0;
  // sclera con leggera ombra interna per profondità
  const sg = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, rad * 0.1, x, y, rad);
  sg.addColorStop(0, "#ffffff");
  sg.addColorStop(1, "#c7d4ec");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(x, y, rad, rad * blink, 0, 0, TAU);
  ctx.fill();
  const py = y + rad * look * 0.3;
  // iride sfumata + alone
  const ig = ctx.createRadialGradient(x, py, rad * 0.1, x, py, rad * 0.6 * blink);
  ig.addColorStop(0, shade(iris, 0.4));
  ig.addColorStop(1, iris);
  ctx.fillStyle = ig;
  ctx.shadowColor = iris;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(x, py, rad * 0.58 * blink, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#080310";
  ctx.beginPath();
  ctx.arc(x, py, rad * 0.28 * blink, 0, TAU);
  ctx.fill();
  // riflesso grande + scintilla piccola
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.arc(x - rad * 0.26, y - rad * 0.28, rad * 0.16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(x + rad * 0.2, y + rad * 0.05, rad * 0.07, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// BOSS → kraken/cervello spaziale: corpo lobato, grande occhio, tentacoli.
export function drawBoss(ctx, b, enraged) {
  const base = b.hitFlash > 0 ? "#ffffff" : b.color;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.shadowColor = b.color;
  ctx.shadowBlur = enraged ? 42 : 30;

  // Tentacoli lunghi che ondeggiano.
  ctx.strokeStyle = base;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  const tent = 8;
  for (let i = 0; i < tent; i++) {
    const a = (i / tent) * TAU;
    const baseR = b.r * 0.8;
    const sway = Math.sin(b.t * (enraged ? 6 : 3) + i) * 10;
    const ex = Math.cos(a) * (baseR + 26) + Math.cos(a + 1) * sway * 0.3;
    const ey = Math.sin(a) * (baseR + 26) + sway;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * baseR, Math.sin(a) * baseR);
    ctx.quadraticCurveTo(Math.cos(a) * (baseR + 14) + sway, Math.sin(a) * (baseR + 14), ex, ey);
    ctx.stroke();
  }

  // Corpo lobato (cervello/kraken).
  ctx.fillStyle = b.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, b.r);
  ctx.beginPath();
  const lobes = 9;
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * TAU;
    const bump = 1 + Math.sin(a * 3 + b.t) * 0.08;
    const rr = b.r * bump;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * 0.85;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  if (b.hitFlash <= 0) rim(ctx, b.color, 2.4, enraged ? 20 : 14);

  // Membrana traslucida: seconda passata leggermente sfalsata → profondità
  // gelatinosa (costa un fill, niente blur).
  if (b.hitFlash <= 0) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = withAlpha(shade(b.color, 0.35), 0.16);
    ctx.beginPath();
    for (let i = 0; i <= lobes; i++) {
      const a = (i / lobes) * TAU;
      const bump = 1 + Math.sin(a * 3 + b.t + 0.9) * 0.08;
      const rr = b.r * 0.86 * bump;
      const px = Math.cos(a) * rr - b.r * 0.06;
      const py = Math.sin(a) * rr * 0.85 - b.r * 0.05;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Solchi del cervello: pulsano di energia (più veloci in furia).
  const brainGlow = 0.5 + 0.5 * Math.sin(b.t * (enraged ? 9 : 4));
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(10,4,16,0.35)";
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 12, -b.r * 0.6);
    ctx.quadraticCurveTo(i * 12 + 6, 0, i * 12, b.r * 0.6);
    ctx.stroke();
  }
  ctx.strokeStyle = withAlpha(shade(b.color, 0.5), 0.25 + 0.35 * brainGlow);
  ctx.lineWidth = 0.9;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 12, -b.r * 0.6);
    ctx.quadraticCurveTo(i * 12 + 6, 0, i * 12, b.r * 0.6);
    ctx.stroke();
  }

  // Occhi minori: chiusi da calmo, si APRONO in furia (leggibilità di fase).
  if (b.hitFlash <= 0 && enraged) {
    const open = Math.min(1, (b.t % 1) * 4 + 0.4);
    eye(ctx, -b.r * 0.5, -b.r * 0.28, 6, b.color, 0.6, open);
    eye(ctx, b.r * 0.5, -b.r * 0.28, 6, b.color, 0.6, open);
  }

  // Grande occhio centrale (rosso in furia).
  if (b.hitFlash <= 0) {
    const pulse = enraged ? 1 + Math.sin(b.t * 12) * 0.12 : 1;
    eye(ctx, 0, 0, 15 * pulse, enraged ? b.color : PALETTE.bossEye, 1, 1);
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}
