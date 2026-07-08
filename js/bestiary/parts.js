// Helper condivisi del bestiario: SOLO disegno, nessuna logica di gioco.
//
// Convenzione anti-"blob luminoso": corpi con base SCURA + outline/accento
// acceso; il corpo statico viene COTTO in sprite (bodySprite) — shadowBlur è
// permesso solo lì, su piccoli punti luce; le parti vive (arti, LED, occhi)
// si disegnano per-frame con fill/stroke piatti, mai blur né gradienti.
import { TAU } from "../utils.js";
import { shade, withAlpha } from "../palette.js";
import { bodySprite, blitSprite } from "../spritecache.js";

// Corpo cache-ato con flash bianco al colpo.
// paint(c, flash) disegna il corpo statico centrato su (0,0): quando
// flash=true riempie di bianco pieno e salta i dettagli.
export function body(ctx, e, key, half, paint) {
  if (e.hitFlash > 0) { paint(ctx, true); return; }
  blitSprite(ctx, bodySprite(key, half, (c) => paint(c, false)));
}

export const spriteKey = (e, tag = "") => `b${e.skin | 0}|${e.type}${tag}|${e.color}|${e.r | 0}`;

// Colori derivati standard del bestiario.
export const darkBase = (c) => shade(c, -0.68); // corpo
export const midTone = (c) => shade(c, -0.4);   // pannelli/parti secondarie

// Jitter deterministico da e.t (tremolii, glitch) — MAI su e.x/e.y reali.
export function jitter(e, amp, freq) {
  return Math.sin((e.t || 0) * freq) > 0.6 ? amp : 0;
}

// ---------- Occhi ----------

// Occhione cartoon: sclera bianca piatta, pupilla che guarda (look -1..1
// orizzontale, lookY per il verticale), blink 0..1. Niente gradienti.
export function cartoonEye(ctx, x, y, rad, { look = 0, lookY = 0.35, blink = 1, iris = "#0a0410" } = {}) {
  ctx.fillStyle = "#f4f7ff";
  ctx.beginPath();
  ctx.ellipse(x, y, rad, rad * blink, 0, 0, TAU);
  ctx.fill();
  if (blink > 0.25) {
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(x + look * rad * 0.35, y + lookY * rad * 0.4, rad * 0.45 * blink, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(x - rad * 0.2, y - rad * 0.25, rad * 0.16, 0, TAU);
    ctx.fill();
  }
}

// Lente robotica: anelli concentrici + LED. `look` sposta il LED.
export function lensEye(ctx, x, y, rad, color, { look = 0, lookY = 0 } = {}) {
  ctx.fillStyle = "#10141c";
  ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
  ctx.strokeStyle = withAlpha(color, 0.9);
  ctx.lineWidth = Math.max(1, rad * 0.18);
  ctx.beginPath(); ctx.arc(x, y, rad * 0.62, 0, TAU); ctx.stroke();
  ctx.fillStyle = shade(color, 0.45);
  ctx.beginPath(); ctx.arc(x + look * rad * 0.4, y + lookY * rad * 0.4, rad * 0.24, 0, TAU); ctx.fill();
}

// Glifo cristallino: rombo scuro con cuore chiaro.
export function glyphEye(ctx, x, y, rad, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  const s = rad * 1.15;
  ctx.fillStyle = "#0a1220";
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.strokeStyle = withAlpha(color, 0.85);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.fillStyle = "#eaffff";
  const c = s * 0.32;
  ctx.fillRect(-c / 2, -c / 2, c, c);
  ctx.restore();
}

// Fessura ardente (pupilla da rettile). squeeze 0..1 stringe l'occhio.
export function slitEye(ctx, x, y, rad, color, { squeeze = 0 } = {}) {
  const h = rad * (1 - squeeze * 0.5);
  ctx.fillStyle = "#160404";
  ctx.beginPath(); ctx.ellipse(x, y, rad, h, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = shade(color, 0.25);
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.8);
  ctx.quadraticCurveTo(x + rad * 0.32, y, x, y + h * 0.8);
  ctx.quadraticCurveTo(x - rad * 0.32, y, x, y - h * 0.8);
  ctx.fill();
  ctx.fillStyle = "rgba(255,240,180,0.95)";
  ctx.beginPath(); ctx.arc(x, y, rad * 0.14, 0, TAU); ctx.fill();
}

// Anello cavo digitale con dot centrale (spostabile con look/lookY).
export function voidEye(ctx, x, y, rad, color, { look = 0, lookY = 0 } = {}) {
  ctx.strokeStyle = withAlpha(color, 0.95);
  ctx.lineWidth = Math.max(1.2, rad * 0.2);
  ctx.beginPath(); ctx.arc(x, y, rad * 0.7, 0, TAU); ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(x + look * rad * 0.35, y + lookY * rad * 0.35, rad * 0.2, 0, TAU); ctx.fill();
}

// ---------- Dettagli ----------

// Fila di denti triangolari da (x-w/2) a (x+w/2) appesi alla quota y.
export function fangs(ctx, x, y, n, w, h, color = "#f4f7ff", dir = 1) {
  ctx.fillStyle = color;
  const step = w / n;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x0 = x - w / 2 + i * step;
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + step / 2, y + h * dir);
    ctx.lineTo(x0 + step, y);
  }
  ctx.fill();
}

// Telegrafo di mira dello sniper (raggio pulsante che si carica + nucleo).
// Portato da creatures.js: è già molto leggibile, lo riusano W3 e W5.
export function sniperTelegraph(ctx, e) {
  if (!(e.aiming > 0)) return;
  const charge = 1 - Math.max(0, e.aiming) / 0.5; // 0 → 1 mentre mira
  const pulse = 0.3 + 0.5 * Math.abs(Math.sin(e.aiming * 30));
  ctx.save();
  ctx.strokeStyle = `rgba(255,70,100,${(0.2 + 0.5 * charge) * pulse + 0.15})`;
  ctx.shadowColor = "rgba(255,60,90,0.9)";
  ctx.shadowBlur = 8 * charge;
  ctx.lineWidth = 1.5 + 2 * charge;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  ctx.lineTo(e.x + Math.cos(e.aimDir) * 800, e.y + Math.sin(e.aimDir) * 800);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,220,120,${0.4 + 0.6 * charge})`;
  ctx.beginPath();
  ctx.arc(e.x, e.y, 2 + 3 * charge, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

// Poligono irregolare deterministico (rocce): n lati, raggio r, seme intero.
export function rockPath(ctx, n, r, seed = 0) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const rr = r * (0.78 + Math.sin((i + seed) * 2.3) * 0.2);
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
