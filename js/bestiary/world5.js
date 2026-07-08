// Mondo 5 — VUOTO PROFONDO · entità digitali/void: quasi-nero, circuiti teal,
// glitch violetti, core bianchi. Geometrie che non dovrebbero esistere.
import { TAU } from "../utils.js";
import { withAlpha } from "../palette.js";
import { body, spriteKey, voidEye, sniperTelegraph, jitter } from "./parts.js";
import { macigno } from "./world2.js";

const VOID_BODY = "#070c14";
const TEAL = "#3fffe0";
const VIOLET = "#c56bff";
const WARN = "#ffd23f";

// 18. TANK — "Monolite": lastra corazzata con cubi d'angolo fluttuanti.
function monolite(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);

  body(ctx, e, spriteKey(e), 30, (c, flash) => {
    const slab = () => {
      c.beginPath();
      c.rect(-15, -20, 30, 40);
    };
    if (flash) { c.fillStyle = "#ffffff"; slab(); c.fill(); return; }
    c.fillStyle = VOID_BODY;
    slab();
    c.fill();
    // Doppio bordo (outline + inline).
    c.strokeStyle = acc;
    c.lineWidth = 1.8;
    c.stroke();
    c.strokeStyle = withAlpha(acc, 0.45);
    c.lineWidth = 1;
    c.strokeRect(-12, -17, 24, 34);
    // Tracce di circuito a L.
    c.strokeStyle = withAlpha(TEAL, 0.6);
    c.lineWidth = 1.1;
    for (const [x0, y0, x1, y1, x2, y2] of [
      [-12, -10, -4, -10, -4, -16],
      [12, 12, 4, 12, 4, 17],
      [-12, 8, -8, 8, -8, 14],
    ]) {
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.lineTo(x2, y2);
      c.stroke();
      c.fillStyle = TEAL;
      c.beginPath();
      c.arc(x2, y2, 1.1, 0, TAU);
      c.fill();
    }
    // Sigillo centrale: anello + barra.
    c.strokeStyle = withAlpha(acc, 0.8);
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(0, 0, 6.5, 0, TAU);
    c.stroke();
    c.beginPath();
    c.moveTo(-6.5, 0);
    c.lineTo(6.5, 0);
    c.stroke();
  });

  if (e.hitFlash <= 0) {
    // 4 cubi d'angolo staccati che fluttuano (la corazza "esplosa").
    ctx.fillStyle = VOID_BODY;
    ctx.strokeStyle = withAlpha(acc, 0.9);
    ctx.lineWidth = 1.2;
    const corners = [[-15, -20], [15, -20], [15, 20], [-15, 20]];
    corners.forEach(([cx, cy], i) => {
      const f = 2.5 + Math.sin(e.t * 2 + i * 1.7) * 2;
      const px = cx + Math.sign(cx) * f, py = cy + Math.sign(cy) * f;
      ctx.fillRect(px - 3, py - 3, 6, 6);
      ctx.strokeRect(px - 3, py - 3, 6, 6);
    });
    // Scanline che scorre sulla lastra.
    const sy = Math.sin(e.t * 1.5) * 17;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, sy);
    ctx.lineTo(14, sy);
    ctx.stroke();
    voidEye(ctx, 0, 0, 4.2, acc);
  }
  ctx.restore();
}

// 19. SNIPER — "Pupilla del Vuoto": anello con canna a rotaia di dati.
function pupillaDelVuoto(ctx, e) {
  const acc = e.color;
  sniperTelegraph(ctx, e);
  ctx.save();
  ctx.translate(e.x, e.y);

  // Anello esterno con tacche: ruota (veloce durante la mira) — vivo.
  if (e.hitFlash <= 0) {
    ctx.save();
    ctx.rotate(e.t * (e.aiming > 0 ? 8 : 0.9));
    ctx.strokeStyle = withAlpha(acc, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.r * 0.95, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * e.r * 0.95, Math.sin(a) * e.r * 0.95);
      ctx.lineTo(Math.cos(a) * (e.r * 0.95 + 3.4), Math.sin(a) * (e.r * 0.95 + 3.4));
      ctx.stroke();
    }
    ctx.restore();
  }

  body(ctx, e, spriteKey(e), 16, (c, flash) => {
    if (flash) {
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(0, 0, e.r * 0.62, 0, TAU);
      c.fill();
      return;
    }
    c.fillStyle = VOID_BODY;
    c.beginPath();
    c.arc(0, 0, e.r * 0.62, 0, TAU);
    c.fill();
    c.strokeStyle = withAlpha(TEAL, 0.8);
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(0, 0, e.r * 0.44, 0, TAU);
    c.stroke();
  });

  if (e.hitFlash <= 0) {
    // CANNA a rotaia: doppio binario tratteggiato, i dati scorrono verso la bocca.
    const dir = e.aiming > 0 ? e.aimDir : Math.PI / 2;
    const len = e.r * 1.75;
    ctx.save();
    ctx.rotate(dir);
    ctx.strokeStyle = withAlpha(acc, 0.9);
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 3]);
    ctx.lineDashOffset = -(e.t * 20);
    for (const off of [-2.2, 2.2]) {
      ctx.beginPath();
      ctx.moveTo(e.r * 0.5, off);
      ctx.lineTo(len, off);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // rombo terminale
    ctx.fillStyle = withAlpha(TEAL, 0.95);
    ctx.save();
    ctx.translate(len + 2, 0);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-2.4, -2.4, 4.8, 4.8);
    ctx.restore();
    ctx.restore();
    // Pupilla che guarda la mira.
    voidEye(ctx, 0, 0, 4, acc, { look: Math.cos(dir) * 0.9, lookY: Math.sin(dir) * 0.9 });
  }
  ctx.restore();
}

// 20. SPLITTER — "Dittico": due celle esagonali gemelle con ponte-glitch.
function dittico(ctx, e) {
  const acc = e.color;
  const little = e.type === "splitling";
  const rr = little ? e.r : e.r * 0.62;
  ctx.save();
  ctx.translate(e.x, e.y);

  const cell = (c, flash) => {
    const hex = () => {
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + Math.PI / 6;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; hex(); c.fill(); return; }
    c.fillStyle = VOID_BODY;
    hex();
    c.fill();
    c.strokeStyle = withAlpha(acc, 0.95);
    c.lineWidth = 1.5;
    c.stroke();
    // nucleo bianco piccolo
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(0, 0, rr * 0.18, 0, TAU);
    c.fill();
  };

  if (little) {
    // Cella singola con ghosting dell'outline (instabile).
    body(ctx, e, spriteKey(e, "|cell"), rr + 5, cell);
    if (e.hitFlash <= 0 && Math.sin(e.t * 9) > 0.55) {
      ctx.strokeStyle = withAlpha(VIOLET, 0.4);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + Math.PI / 6;
        const px = Math.cos(a) * rr + 2, py = Math.sin(a) * rr - 1;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  } else {
    const dx = e.r * 0.58;
    const dy = Math.sin(e.t * 4) * 2; // sfasamento in controtempo
    // Ponte-glitch tra le celle (vivo).
    if (e.hitFlash <= 0) {
      ctx.strokeStyle = withAlpha(acc, 0.75);
      ctx.lineWidth = 1.2;
      const broken = Math.sin(e.t * 11) > 0.9;
      for (const [yy, j] of [[-3, 1], [0, -1], [3, 0.5]]) {
        const jx = jitter(e, 1.5 * j, 17 + j * 5);
        ctx.beginPath();
        ctx.moveTo(-dx * 0.5 + jx, yy + jx * 0.4);
        if (broken) {
          ctx.lineTo(-1, yy);
          ctx.moveTo(2, yy - 1);
        }
        ctx.lineTo(dx * 0.5 + jx, yy - jx * 0.4);
        ctx.stroke();
      }
    }
    ctx.save();
    ctx.translate(-dx, dy);
    body(ctx, e, spriteKey(e, "|cell"), rr + 5, cell);
    ctx.restore();
    ctx.save();
    ctx.translate(dx, -dy);
    body(ctx, e, spriteKey(e, "|cell"), rr + 5, cell);
    ctx.restore();
  }
  ctx.restore();
}

// 21. MINE — "Glitch Statico": rombo d'errore con chevron di pericolo.
function glitchStatico(ctx, e) {
  const acc = e.color;
  ctx.save();
  // Jitter di posizione a scatti (SOLO visivo, la hitbox non si muove).
  ctx.translate(e.x + jitter(e, 1.5, 23), e.y);

  body(ctx, e, spriteKey(e), 18, (c, flash) => {
    const diamond = () => {
      c.beginPath();
      c.moveTo(0, -e.r);
      c.lineTo(e.r, 0);
      c.lineTo(0, e.r);
      c.lineTo(-e.r, 0);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; diamond(); c.fill(); return; }
    c.fillStyle = VOID_BODY;
    diamond();
    c.fill();
    c.strokeStyle = VIOLET;
    c.lineWidth = 1.7;
    c.stroke();
    c.strokeStyle = withAlpha(VIOLET, 0.45);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, -e.r + 3.4);
    c.lineTo(e.r - 3.4, 0);
    c.lineTo(0, e.r - 3.4);
    c.lineTo(-e.r + 3.4, 0);
    c.closePath();
    c.stroke();
  });

  if (e.hitFlash <= 0) {
    // 4 chevron warning che orbitano lenti.
    ctx.strokeStyle = WARN;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + e.t * 0.7;
      const d = e.r + 5.5;
      ctx.save();
      ctx.translate(Math.cos(a) * d, Math.sin(a) * d);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-3, 1.6);
      ctx.lineTo(0, -1.6);
      ctx.lineTo(3, 1.6);
      ctx.stroke();
      ctx.restore();
    }
    // Core a duty-cycle corto (acceso 0.1s ogni 0.5s).
    if (e.t % 0.5 < 0.1) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, TAU);
      ctx.fill();
    }
    // Frame di corruzione: il rombo si sdoppia a fette ogni ~2s.
    if (e.t % 2 < 0.12) {
      ctx.fillStyle = withAlpha(VIOLET, 0.3);
      ctx.fillRect(-e.r, -2.5, e.r * 2, 2.5);
      ctx.fillRect(-e.r + 4, 1, e.r * 2 - 4, 2.5);
    }
  }
  ctx.restore();
}

// 22. KAMIKAZE — "Frammento Ostile": chevron con aberrazione cromatica.
function frammentoOstile(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);

  const paint = (c, flash) => {
    const chevron = () => {
      c.beginPath();
      c.moveTo(0, 14);       // punta in basso
      c.lineTo(11, -8);
      c.lineTo(5.5, -8);
      c.lineTo(0, 3);
      c.lineTo(-5.5, -8);
      c.lineTo(-11, -8);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; chevron(); c.fill(); return; }
    // Aberrazione cromatica: outline rosso e teal sfalsati di 1px.
    c.save();
    c.translate(-1.2, 0);
    c.strokeStyle = withAlpha("#ff4d6d", 0.8);
    c.lineWidth = 1.4;
    chevron();
    c.stroke();
    c.restore();
    c.save();
    c.translate(1.2, 0);
    c.strokeStyle = withAlpha(TEAL, 0.8);
    c.lineWidth = 1.4;
    chevron();
    c.stroke();
    c.restore();
    c.fillStyle = VOID_BODY;
    chevron();
    c.fill();
    c.strokeStyle = withAlpha("#f4f7ff", 0.7);
    c.lineWidth = 1;
    c.stroke();
  };

  if (e.hitFlash <= 0) {
    // 2 afterimage sopra (velocità leggibile).
    for (const [dy, a] of [[-20, 0.13], [-10, 0.26]]) {
      ctx.globalAlpha = a;
      ctx.save();
      ctx.translate(0, dy);
      body(ctx, e, spriteKey(e), 20, paint);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }
  body(ctx, e, spriteKey(e), 20, paint);

  if (e.hitFlash <= 0) {
    // Barra-lampo che scorre giù lungo il corpo in loop veloce.
    const ph = (e.t % 0.3) / 0.3;
    ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`;
    ctx.fillRect(-8 * (1 - ph * 0.6), -8 + ph * 20, 16 * (1 - ph * 0.6), 1.6);
    // Dot lock-on: raddoppia quando in picchiata piena.
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.arc(0, -3, e.speed > 250 ? 2.6 : 1.4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// 23. ASTEROID — "Relitto Corrotto": roccia void con wireframe sfalsato.
function relittoCorrotto(ctx, e) {
  // Base roccia (riusa il Macigno con stile void: vene = circuiti teal).
  macigno(ctx, e, { vein: TEAL, fill: "#0a141c" });
  if (e.hitFlash > 0) return;
  const lod = e.type === "asteroid" ? 2 : e.type === "shard" ? 1 : 0;
  if (lod === 0) return;
  // Wireframe che ruota a velocità LEGGERMENTE diversa (interferenza ipnotica).
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate((e.rot || 0) * 1.08 + 0.15);
  ctx.strokeStyle = withAlpha(TEAL, 0.4);
  ctx.lineWidth = 1;
  const sides = lod === 2 ? 10 : 6;
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * TAU;
    const rr = e.r * (0.78 + Math.sin((i + lod) * 2.3) * 0.2) + 2;
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  // Patch di corruzione violetta + glitch-slice periodico.
  ctx.fillStyle = withAlpha(VIOLET, 0.35);
  ctx.fillRect(e.r * 0.15, -e.r * 0.4, e.r * 0.4, e.r * 0.25);
  if (e.t % 1.5 < 0.1) {
    ctx.fillStyle = withAlpha(VIOLET, 0.3);
    ctx.fillRect(-e.r, -2, e.r * 2, 3);
  }
  ctx.restore();
}

export const W5 = {
  tank: monolite,
  sniper: pupillaDelVuoto,
  splitter: dittico,
  mine: glitchStatico,
  kamikaze: frammentoOstile,
  asteroid: relittoCorrotto,
};
