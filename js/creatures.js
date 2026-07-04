// Disegno delle "creature spaziali" (arte, non logica).
// Ogni funzione riceve l'entità (x, y, t, hitFlash, r) e la disegna al neon,
// animata. La logica di movimento/collisione resta in enemies.js.
import { TAU } from "./utils.js";
import { PALETTE, shade, withAlpha } from "./palette.js";

// Riempimento volumetrico: highlight in alto a sinistra, tinta satura al centro,
// bordo scurito → dà volume invece della tinta piatta "clip-art".
export function glowFill(ctx, base, r) {
  const g = ctx.createRadialGradient(-r * 0.34, -r * 0.44, r * 0.05, 0, 0, r * 1.06);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.26, shade(base, 0.42));
  g.addColorStop(0.68, base);
  g.addColorStop(1, shade(base, -0.5));
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
  if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 8);

  // Puntini luminescenti sulla campana.
  ctx.shadowBlur = 0;
  ctx.fillStyle = withAlpha(shade(e.color, 0.5), 0.7);
  for (const dx of [-8, 0, 8]) {
    ctx.beginPath();
    ctx.arc(dx, -2, 1.3, 0, TAU);
    ctx.fill();
  }

  // Due occhietti luminosi.
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
    if (e.hitFlash <= 0) rim(ctx, e.color, 1.3, 7);
  }
  // Corpo (segmentato con lucentezza centrale).
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, 9);
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
  if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 9);

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
  if (b.hitFlash <= 0) rim(ctx, b.color, 2.4, enraged ? 20 : 14);

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
    eye(ctx, 0, 0, 15 * pulse, enraged ? b.color : PALETTE.bossEye, 1, 1);
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}

// ---------- Nuovi mostri ----------

// TANK → asteroide corazzato roccioso con un occhio.
export function drawTank(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 16;
  ctx.save();
  ctx.rotate(e.t * 0.4);
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, e.r);
  ctx.beginPath();
  const sides = 9;
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * TAU;
    const rr = e.r * (0.82 + Math.sin(i * 2.3) * 0.16);
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  if (e.hitFlash <= 0) rim(ctx, e.color, 2, 8);
  // Crepe rocciose.
  ctx.strokeStyle = "rgba(10,4,16,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-e.r * 0.5, -e.r * 0.2);
  ctx.lineTo(0, e.r * 0.1);
  ctx.lineTo(e.r * 0.4, -e.r * 0.3);
  ctx.stroke();
  // Crateri.
  ctx.fillStyle = "rgba(10,4,16,0.22)";
  for (const c of [[-e.r * 0.45, e.r * 0.35, e.r * 0.16], [e.r * 0.5, e.r * 0.1, e.r * 0.12]]) {
    ctx.beginPath();
    ctx.arc(c[0], c[1], c[2], 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  if (e.hitFlash <= 0) eye(ctx, 0, 2, 6, e.color, 1, 1);
  ctx.restore();
  ctx.shadowBlur = 0;
}

// KAMIKAZE → cometa/dardo aggressivo con coda infuocata, punta in basso.
export function drawKamikaze(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(255,120,60,0.5)";
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(0, -18 - Math.random() * 8);
  ctx.lineTo(6, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, e.r);
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(11, -8);
  ctx.lineTo(4, -4);
  ctx.lineTo(0, -10);
  ctx.lineTo(-4, -4);
  ctx.lineTo(-11, -8);
  ctx.closePath();
  ctx.fill();
  if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 9);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-3, -2, 2, 0, TAU);
  ctx.arc(3, -2, 2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#0a0410";
  ctx.beginPath();
  ctx.arc(-3, -1, 1, 0, TAU);
  ctx.arc(3, -1, 1, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

// SPLITTER → blob gelatinoso con una linea di divisione (scala con e.r).
export function drawSplitter(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  const rr = e.r;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, rr);
  ctx.beginPath();
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const wob = 1 + Math.sin(a * 3 + e.t * 4) * 0.12;
    const px = Math.cos(a) * rr * wob;
    const py = Math.sin(a) * rr * wob;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 8);
  ctx.strokeStyle = "rgba(10,4,16,0.35)";
  ctx.lineWidth = Math.max(1, rr * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, -rr * 0.9);
  ctx.lineTo(0, rr * 0.9);
  ctx.stroke();
  if (e.hitFlash <= 0 && rr > 10) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0a0410";
    ctx.beginPath();
    ctx.arc(-rr * 0.3, -rr * 0.1, rr * 0.13, 0, TAU);
    ctx.arc(rr * 0.3, -rr * 0.1, rr * 0.13, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}

// SNIPER → torretta esagonale con occhio e mirino telegrafato.
export function drawSniper(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  if (e.aiming > 0) {
    // Telegrafo più leggibile: raggio pulsante che si "carica" (si assottiglia
    // e si accende avvicinandosi allo sparo) + nucleo di carica al muso.
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
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, e.r);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    const px = Math.cos(a) * e.r;
    const py = Math.sin(a) * e.r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  if (e.hitFlash <= 0) rim(ctx, e.color, 1.8, 8);
  const dir = e.aiming > 0 ? e.aimDir : Math.PI / 2;
  ctx.strokeStyle = base;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(dir) * e.r * 1.2, Math.sin(dir) * e.r * 1.2);
  ctx.stroke();
  if (e.hitFlash <= 0) eye(ctx, 0, 0, 6, e.color, 1, 1);
  ctx.restore();
  ctx.shadowBlur = 0;
}

// MINE → mina spinata con nucleo lampeggiante.
export function drawMine(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = base;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + e.t * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * e.r * 0.7, Math.sin(a) * e.r * 0.7);
    ctx.lineTo(Math.cos(a) * (e.r + 5), Math.sin(a) * (e.r + 5));
    ctx.stroke();
  }
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, e.r * 0.7);
  ctx.beginPath();
  ctx.arc(0, 0, e.r * 0.7, 0, TAU);
  ctx.fill();
  if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 8);
  ctx.shadowBlur = 0;
  const blink = 0.4 + 0.6 * Math.abs(Math.sin(e.t * 8));
  ctx.fillStyle = `rgba(255,60,90,${blink})`;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}
