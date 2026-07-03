// Disegno delle "creature spaziali" (arte, non logica).
// Ogni funzione riceve l'entità (x, y, t, hitFlash, r) e la disegna al neon,
// animata. La logica di movimento/collisione resta in enemies.js.
import { TAU } from "./utils.js";
import { PALETTE } from "./palette.js";

function glowFill(ctx, base, r) {
  const g = ctx.createRadialGradient(0, -r * 0.3, 1, 0, 0, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.45, base);
  g.addColorStop(1, base);
  return g;
}

// Occhio riutilizzabile: sclera bianca, iride colorata, pupilla, riflesso.
function eye(ctx, x, y, rad, iris, look = 0.35, blink = 1) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f7fbff";
  ctx.beginPath();
  ctx.ellipse(x, y, rad, rad * blink, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(x, y + rad * look * 0.3, rad * 0.55 * blink, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#0a0410";
  ctx.beginPath();
  ctx.arc(x, y + rad * look * 0.3, rad * 0.28 * blink, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(x - rad * 0.25, y - rad * 0.25, rad * 0.14, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// STRAIGHT → medusa aliena: cupola a campana + tentacoli ondeggianti.
export function drawStraight(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 18;

  // Tentacoli.
  ctx.strokeStyle = base;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  for (let i = -2; i <= 2; i++) {
    const sway = Math.sin(e.t * 5 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(i * 4, 4);
    ctx.quadraticCurveTo(i * 5 + sway, 14, i * 4 + sway, 22);
    ctx.stroke();
  }

  // Campana.
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, 16);
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.quadraticCurveTo(-16, -16, 0, -16);
  ctx.quadraticCurveTo(16, -16, 14, 4);
  // bordo ondulato inferiore
  ctx.quadraticCurveTo(9, 9, 4, 4);
  ctx.quadraticCurveTo(0, 9, -4, 4);
  ctx.quadraticCurveTo(-9, 9, -14, 4);
  ctx.closePath();
  ctx.fill();

  // Due occhietti luminosi.
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0a0410";
  ctx.beginPath();
  ctx.arc(-5, -6, 2.6, 0, TAU);
  ctx.arc(5, -6, 2.6, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

// ZIGZAG → falena/pipistrello spaziale: corpo + ali che sbattono.
export function drawZigzag(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  const flap = Math.sin(e.t * 12) * 0.5 + 0.5; // 0..1
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, 16);

  // Ali (specchiate), l'apertura varia col flap.
  const wing = 6 + flap * 8;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(s * 18, -wing, s * 16, 2);
    ctx.quadraticCurveTo(s * 12, wing, 0, 6);
    ctx.closePath();
    ctx.fill();
  }
  // Corpo.
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.5, 9, 0, 0, TAU);
  ctx.fill();
  // Antenne.
  ctx.strokeStyle = base;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-2, -7); ctx.lineTo(-5, -13);
  ctx.moveTo(2, -7); ctx.lineTo(5, -13);
  ctx.stroke();
  // Occhietti.
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0a0410";
  ctx.beginPath();
  ctx.arc(-1.5, -4, 1.4, 0, TAU);
  ctx.arc(1.5, -4, 1.4, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

// SHOOTER → occhio fluttuante alieno con tentacoli; sbatte le palpebre.
export function drawShooter(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  // Blink ogni ~3s.
  const cycle = (e.t % 3);
  const blink = cycle > 2.85 ? Math.abs(Math.sin((cycle - 2.85) / 0.15 * Math.PI)) * 0.9 + 0.1 : 1;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 18;

  // Tentacoli attorno.
  ctx.strokeStyle = base;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + e.t * 0.6;
    const sway = Math.sin(e.t * 4 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9);
    ctx.lineTo(Math.cos(a) * (16 + sway), Math.sin(a) * (16 + sway));
    ctx.stroke();
  }

  // Corpo carnoso.
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, 13);
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, TAU);
  ctx.fill();

  // Grande occhio centrale che guarda in basso.
  if (e.hitFlash <= 0) eye(ctx, 0, 0, 7, e.color, 1, blink);
  ctx.restore();
  ctx.shadowBlur = 0;
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

  // Solchi del cervello.
  ctx.strokeStyle = "rgba(10,4,16,0.35)";
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 12, -b.r * 0.6);
    ctx.quadraticCurveTo(i * 12 + 6, 0, i * 12, b.r * 0.6);
    ctx.stroke();
  }

  // Grande occhio centrale (rosso in furia).
  if (b.hitFlash <= 0) {
    const pulse = enraged ? 1 + Math.sin(b.t * 12) * 0.12 : 1;
    eye(ctx, 0, 0, 15 * pulse, enraged ? b.color : b.colorEye, 1, 1);
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}
