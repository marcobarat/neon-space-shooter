// Disegno delle "creature spaziali" (arte, non logica).
// Ogni funzione riceve l'entità (x, y, t, hitFlash, r) e la disegna al neon,
// animata. La logica di movimento/collisione resta in enemies.js.
import { TAU } from "./utils.js";
import { PALETTE, shade, withAlpha } from "./palette.js";
import { skinFor } from "./skins.js";
import { bodySprite, blitSprite } from "./spritecache.js";

// Flag di rollback: false = torna al rendering per-frame puro (niente sprite).
export const USE_SPRITES = true;

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

// Occhio nello stile del mondo: bio (organico, quello storico) oppure le
// varianti cheap senza gradienti — lens (robotico), glyph (cristallo),
// slit (fessura ardente), void (anello digitale).
export function eyeFor(ctx, kit, x, y, rad, iris, look = 0.35, blink = 1) {
  const style = kit ? kit.eyeStyle : "bio";
  if (style === "bio" || !style) { eye(ctx, x, y, rad, iris, look, blink); return; }
  ctx.save();
  ctx.shadowBlur = 0;
  if (style === "lens") {
    // Lente robotica: anelli concentrici + LED centrale.
    ctx.fillStyle = "#10141c";
    ctx.beginPath(); ctx.ellipse(x, y, rad, rad * blink, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = withAlpha(iris, 0.9);
    ctx.lineWidth = Math.max(1, rad * 0.16);
    ctx.beginPath(); ctx.arc(x, y, rad * 0.62 * blink, 0, TAU); ctx.stroke();
    ctx.fillStyle = shade(iris, 0.5);
    ctx.beginPath(); ctx.arc(x, y, rad * 0.26 * blink, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.12, 0, TAU); ctx.fill();
  } else if (style === "glyph") {
    // Glifo cristallino: rombo scuro con cuore luminoso.
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, blink);
    ctx.rotate(Math.PI / 4);
    const s = rad * 1.15;
    ctx.fillStyle = "#0a1220";
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.strokeStyle = withAlpha(iris, 0.85);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = "#eaffff";
    const c = s * 0.32;
    ctx.fillRect(-c / 2, -c / 2, c, c);
    ctx.restore();
  } else if (style === "slit") {
    // Fessura ardente verticale (pupilla da rettile di fuoco).
    ctx.fillStyle = "#160404";
    ctx.beginPath(); ctx.ellipse(x, y, rad, rad * blink, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(iris, 0.25);
    ctx.beginPath();
    ctx.moveTo(x, y - rad * 0.8 * blink);
    ctx.quadraticCurveTo(x + rad * 0.34, y, x, y + rad * 0.8 * blink);
    ctx.quadraticCurveTo(x - rad * 0.34, y, x, y - rad * 0.8 * blink);
    ctx.fill();
    ctx.fillStyle = "rgba(255,240,180,0.95)";
    ctx.beginPath(); ctx.arc(x, y, rad * 0.14, 0, TAU); ctx.fill();
  } else {
    // "void": anello cavo con punto al centro — sguardo alieno-digitale.
    ctx.strokeStyle = withAlpha(iris, 0.95);
    ctx.lineWidth = Math.max(1.2, rad * 0.2);
    ctx.beginPath(); ctx.arc(x, y, rad * 0.7 * blink, 0, TAU); ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(x, y, rad * 0.2, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// STRAIGHT → medusa aliena: cupola a campana + tentacoli ondeggianti.
export function drawStraight(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  const kit = skinFor(e);
  const hard = kit.hard;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 18;

  // Tentacoli/appendici nello stile del mondo.
  ctx.shadowBlur = 10;
  for (let i = -2; i <= 2; i++) {
    const sway = Math.sin(e.t * 5 + i) * 4 * kit.wobble;
    kit.limb(ctx, e, { x0: i * 4, y0: 4, x1: i * 4, y1: 22, i: i + 2, sway, width: 2.5, color: base });
  }
  ctx.shadowBlur = 18;

  // Campana: organica (curve) → sfaccettata (segmenti) secondo il kit.
  const bellPath = (c) => {
    c.beginPath();
    if (hard < 0.5) {
      c.moveTo(-14, 4);
      c.quadraticCurveTo(-16, -16, 0, -16);
      c.quadraticCurveTo(16, -16, 14, 4);
      // bordo ondulato inferiore
      c.quadraticCurveTo(9, 9, 4, 4);
      c.quadraticCurveTo(0, 9, -4, 4);
      c.quadraticCurveTo(-9, 9, -14, 4);
    } else {
      // cupola a faccette (cristallo/void/scrap)
      c.moveTo(-14, 4);
      c.lineTo(-15, -7);
      c.lineTo(-7, -16);
      c.lineTo(7, -16);
      c.lineTo(15, -7);
      c.lineTo(14, 4);
      c.lineTo(7, 7);
      c.lineTo(0, 4);
      c.lineTo(-7, 7);
    }
    c.closePath();
  };
  if (USE_SPRITES && e.hitFlash <= 0) {
    blitSprite(ctx, bodySprite(`straight|${kit.id}|${e.color}`, 26, (c) => {
      c.shadowColor = e.color;
      c.shadowBlur = 18;
      c.fillStyle = glowFill(c, e.color, 16);
      bellPath(c);
      c.fill();
      rim(c, e.color, 1.6, 8);
    }));
  } else {
    ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, 16);
    bellPath(ctx);
    ctx.fill();
    if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 8);
  }

  // Geometria di mondo sul perimetro della campana.
  if (e.hitFlash <= 0) {
    ctx.shadowBlur = 0;
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      pts.push({ x: Math.cos(a) * 14, y: -6 + Math.sin(a) * 11 });
    }
    kit.edge(ctx, e, pts, 15);
  }

  // Puntini luminescenti sulla campana.
  ctx.shadowBlur = 0;
  ctx.fillStyle = withAlpha(kit.accent(e.color), 0.7);
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
  const kit = skinFor(e);
  // Il flap resta vivo anche nei mondi rigidi (è l'identità del tipo),
  // ma i kit duri "scattano" invece di ondeggiare.
  const flap = Math.sin(e.t * 12) * 0.5 + 0.5; // 0..1
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, 16);

  // Ali (specchiate), l'apertura varia col flap.
  // Kit morbidi: membrane curve. Kit duri: pannelli angolari a 3 segmenti.
  const wing = 6 + flap * 8;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    if (kit.hard < 0.5) {
      ctx.moveTo(0, -2);
      ctx.quadraticCurveTo(s * 18, -wing, s * 16, 2);
      ctx.quadraticCurveTo(s * 12, wing, 0, 6);
    } else {
      ctx.moveTo(0, -2);
      ctx.lineTo(s * 10, -wing);
      ctx.lineTo(s * 18, -wing * 0.35);
      ctx.lineTo(s * 15, 3);
      ctx.lineTo(s * 9, wing * 0.8);
      ctx.lineTo(0, 6);
    }
    ctx.closePath();
    ctx.fill();
    if (e.hitFlash <= 0) rim(ctx, e.color, 1.3, 7);
  }
  // Dettaglio di mondo sulle ali (nervature/piastre/faccette).
  if (e.hitFlash <= 0) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = withAlpha(kit.accent(e.color), 0.5);
    ctx.lineWidth = 1;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 4, 0);
      ctx.lineTo(s * 14, -wing * 0.45);
      if (kit.hard >= 0.5) { ctx.moveTo(s * 5, 2); ctx.lineTo(s * 13, 1); }
      ctx.stroke();
    }
    ctx.shadowBlur = 16;
  }
  // Corpo (segmentato con lucentezza centrale).
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, 9);
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.5, 9, 0, 0, TAU);
  ctx.fill();
  // Antenne nello stile del mondo.
  ctx.shadowBlur = 8;
  for (const s of [-1, 1]) {
    const sway = Math.sin(e.t * 6 + s) * 1.5 * kit.wobble;
    kit.limb(ctx, e, { x0: s * 2, y0: -7, x1: s * 5, y1: -13, i: s + 1, sway, width: 1.5, color: base });
  }
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

  // Tentacoli attorno, nello stile del mondo (ruotano sempre: identità del tipo).
  const kit = skinFor(e);
  ctx.shadowBlur = 10;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + e.t * 0.6;
    const sway = Math.sin(e.t * 4 + i) * 3 * kit.wobble;
    kit.limb(ctx, e, {
      x0: Math.cos(a) * 9, y0: Math.sin(a) * 9,
      x1: Math.cos(a) * (16 + sway), y1: Math.sin(a) * (16 + sway),
      i, sway: sway * 0.6, width: 2.5, color: base,
    });
  }
  ctx.shadowBlur = 18;

  // Corpo carnoso (tondo) → guscio sfaccettato nei mondi duri.
  const pts = [];
  const bodyPath = (c) => {
    c.beginPath();
    if (kit.hard < 0.5) {
      c.arc(0, 0, 12, 0, TAU);
    } else {
      const n = 8;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * TAU + Math.PI / n;
        const rr = 12 * (i % 2 ? 1 : 0.94);
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath();
    }
  };
  if (kit.hard < 0.5) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      pts.push({ x: Math.cos(a) * 12, y: Math.sin(a) * 12 });
    }
  } else {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + Math.PI / 8;
      const rr = 12 * (i % 2 ? 1 : 0.94);
      pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
    }
  }
  if (USE_SPRITES && e.hitFlash <= 0) {
    blitSprite(ctx, bodySprite(`shooter|${kit.id}|${e.color}`, 24, (c) => {
      c.shadowColor = e.color;
      c.shadowBlur = 18;
      c.fillStyle = glowFill(c, e.color, 13);
      bodyPath(c);
      c.fill();
      rim(c, e.color, 1.6, 9);
    }));
  } else {
    ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, 13);
    bodyPath(ctx);
    ctx.fill();
    if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 9);
  }
  if (e.hitFlash <= 0) { ctx.shadowBlur = 0; kit.edge(ctx, e, pts, 12); ctx.shadowBlur = 18; }

  // Grande occhio centrale che guarda in basso.
  if (e.hitFlash <= 0) eyeFor(ctx, kit, 0, 0, 7, e.color, 1, blink);
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

// ---------- Nuovi mostri ----------

// TANK → asteroide corazzato roccioso con un occhio.
export function drawTank(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 16;
  const kit = skinFor(e);
  ctx.save();
  ctx.rotate(e.t * 0.4);
  // Nei mondi duri il profilo è più tagliente (varianza maggiore, spigoli netti).
  const sides = 9;
  const jag = 0.16 + kit.hard * 0.1;
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * TAU;
    const rr = e.r * (0.82 + Math.sin(i * 2.3) * jag);
    pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
  }
  const rockPath = (c) => {
    c.beginPath();
    pts.forEach((p, i) => (i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)));
    c.closePath();
  };
  const detail = (c) => {
    // Crepe rocciose.
    c.strokeStyle = "rgba(10,4,16,0.4)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-e.r * 0.5, -e.r * 0.2);
    c.lineTo(0, e.r * 0.1);
    c.lineTo(e.r * 0.4, -e.r * 0.3);
    c.stroke();
    // Crateri.
    c.fillStyle = "rgba(10,4,16,0.22)";
    for (const k of [[-e.r * 0.45, e.r * 0.35, e.r * 0.16], [e.r * 0.5, e.r * 0.1, e.r * 0.12]]) {
      c.beginPath();
      c.arc(k[0], k[1], k[2], 0, TAU);
      c.fill();
    }
  };
  if (USE_SPRITES && e.hitFlash <= 0) {
    blitSprite(ctx, bodySprite(`tank|${kit.id}|${e.color}|${e.r | 0}`, e.r + 12, (c) => {
      c.shadowColor = e.color;
      c.shadowBlur = 16;
      c.fillStyle = glowFill(c, e.color, e.r);
      rockPath(c);
      c.fill();
      rim(c, e.color, 2, 8);
      c.shadowBlur = 0;
      detail(c);
    }));
  } else {
    ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, e.r);
    rockPath(ctx);
    ctx.fill();
    if (e.hitFlash <= 0) rim(ctx, e.color, 2, 8);
    detail(ctx);
  }
  if (e.hitFlash <= 0) { ctx.shadowBlur = 0; kit.edge(ctx, e, pts, e.r); ctx.shadowBlur = 16; }
  ctx.restore();
  if (e.hitFlash <= 0) eyeFor(ctx, kit, 0, 2, 6, e.color, 1, 1);
  ctx.restore();
  ctx.shadowBlur = 0;
}

// KAMIKAZE → cometa/dardo aggressivo con coda infuocata, punta in basso.
export function drawKamikaze(ctx, e) {
  const base = e.hitFlash > 0 ? "#ffffff" : e.color;
  const kit = skinFor(e);
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 18;
  // Scia: fiamma deterministica (niente Math.random per-frame) tinta dal mondo.
  const flick = Math.abs(Math.sin(e.t * 21)) * 8;
  ctx.fillStyle = withAlpha(kit.accent(e.color), 0.55);
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(0, -18 - flick);
  ctx.lineTo(6, -6);
  ctx.closePath();
  ctx.fill();
  const dartPath = (c) => {
    c.beginPath();
    c.moveTo(0, 16);
    c.lineTo(11, -8);
    c.lineTo(4, -4);
    c.lineTo(0, -10);
    c.lineTo(-4, -4);
    c.lineTo(-11, -8);
    c.closePath();
  };
  if (USE_SPRITES && e.hitFlash <= 0) {
    blitSprite(ctx, bodySprite(`kamikaze|${skinFor(e).id}|${e.color}`, 28, (c) => {
      c.shadowColor = e.color;
      c.shadowBlur = 18;
      c.fillStyle = glowFill(c, e.color, e.r);
      dartPath(c);
      c.fill();
      rim(c, e.color, 1.6, 9);
    }));
  } else {
    ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, e.r);
    dartPath(ctx);
    ctx.fill();
    if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 9);
  }
  // Alette laterali nello stile del mondo.
  if (e.hitFlash <= 0) {
    ctx.shadowBlur = 0;
    kit.edge(ctx, e, [{ x: -9, y: -6 }, { x: 0, y: 14 }, { x: 9, y: -6 }], e.r * 0.9);
    ctx.shadowBlur = 18;
  }
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
  const kit = skinFor(e);
  ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, rr);
  ctx.beginPath();
  // Il wobble è l'identità dello splitter, ma i mondi rigidi lo smorzano.
  const n = 12;
  const wobAmp = 0.12 * Math.max(kit.wobble, 0.45);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const wob = 1 + Math.sin(a * 3 + e.t * 4) * wobAmp;
    const px = Math.cos(a) * rr * wob;
    const py = Math.sin(a) * rr * wob;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
    if (i < n) pts.push({ x: px, y: py });
  }
  ctx.closePath();
  ctx.fill();
  if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 8);
  if (e.hitFlash <= 0) { ctx.shadowBlur = 0; kit.edge(ctx, e, pts, rr); ctx.shadowBlur = 16; }
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
  const kit = skinFor(e);
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    pts.push({ x: Math.cos(a) * e.r, y: Math.sin(a) * e.r });
  }
  const hexPath = (c) => {
    c.beginPath();
    pts.forEach((p, i) => (i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)));
    c.closePath();
  };
  if (USE_SPRITES && e.hitFlash <= 0) {
    blitSprite(ctx, bodySprite(`sniper|${kit.id}|${e.color}|${e.r | 0}`, e.r + 11, (c) => {
      c.shadowColor = e.color;
      c.shadowBlur = 16;
      c.fillStyle = glowFill(c, e.color, e.r);
      hexPath(c);
      c.fill();
      rim(c, e.color, 1.8, 8);
    }));
  } else {
    ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, e.r);
    hexPath(ctx);
    ctx.fill();
    if (e.hitFlash <= 0) rim(ctx, e.color, 1.8, 8);
  }
  if (e.hitFlash <= 0) { ctx.shadowBlur = 0; kit.edge(ctx, e, pts, e.r); ctx.shadowBlur = 16; }
  const dir = e.aiming > 0 ? e.aimDir : Math.PI / 2;
  ctx.strokeStyle = base;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(dir) * e.r * 1.2, Math.sin(dir) * e.r * 1.2);
  ctx.stroke();
  if (e.hitFlash <= 0) eyeFor(ctx, kit, 0, 0, 6, e.color, 1, 1);
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
  const kit = skinFor(e);
  // Spine nello stile del mondo (ruotano sempre: identità della mina).
  ctx.shadowBlur = 10;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + e.t * 0.5;
    kit.limb(ctx, e, {
      x0: Math.cos(a) * e.r * 0.7, y0: Math.sin(a) * e.r * 0.7,
      x1: Math.cos(a) * (e.r + 5), y1: Math.sin(a) * (e.r + 5),
      i, sway: 0, width: 3, color: base,
    });
  }
  ctx.shadowBlur = 16;
  if (USE_SPRITES && e.hitFlash <= 0) {
    blitSprite(ctx, bodySprite(`mine|${kit.id}|${e.color}|${e.r | 0}`, e.r * 0.7 + 10, (c) => {
      c.shadowColor = e.color;
      c.shadowBlur = 16;
      c.fillStyle = glowFill(c, e.color, e.r * 0.7);
      c.beginPath();
      c.arc(0, 0, e.r * 0.7, 0, TAU);
      c.fill();
      rim(c, e.color, 1.6, 8);
    }));
  } else {
    ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : glowFill(ctx, base, e.r * 0.7);
    ctx.beginPath();
    ctx.arc(0, 0, e.r * 0.7, 0, TAU);
    ctx.fill();
    if (e.hitFlash <= 0) rim(ctx, e.color, 1.6, 8);
  }
  ctx.shadowBlur = 0;
  const blink = 0.4 + 0.6 * Math.abs(Math.sin(e.t * 8));
  ctx.fillStyle = `rgba(255,60,90,${blink})`;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

// ---------- Materiale per MONDO ("skin") ----------
// Delega al pattern() del kit del mondo (js/skins.js). Va chiamato con
// l'origine sul centro dell'entità (ctx già traslato) e un raggio r.
// Niente shadowBlur (costo) — solo tratti leggeri.
export function applyMaterial(ctx, ent, r) {
  ctx.save();
  ctx.shadowBlur = 0;
  skinFor(ent).pattern(ctx, ent, r);
  ctx.restore();
}
