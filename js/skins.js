// SHAPE KIT per mondo: non più "stesso scheletro ricolorato" ma un linguaggio
// di forme distinto per ciascuno dei 5 mondi. Ogni kit definisce:
//   hard    0→1: quanto lo scheletro si sfaccetta (0 = curve organiche,
//           1 = segmenti dritti/cristallini). Le drawX lo usano per morphare.
//   wobble  moltiplicatore delle ampiezze sin(t): il bio ondeggia, il ghiaccio
//           vibra appena, il rottame è rigido.
//   limb()  un'appendice (tentacolo/antenna/spuntone) nello stile del mondo.
//   edge()  geometria aggiunta sul perimetro (piastre, schegge, creste, archi).
//   pattern() dettaglio interno (sostituisce il vecchio applyMaterial).
//   accent() colore emissivo d'accento derivato dal colore base.
//   eyeStyle  variante di occhio usata da eyeFor() in creatures.js.
// Regola perf: NIENTE shadowBlur qui dentro — solo tratti e piccoli fill.
import { TAU } from "./utils.js";
import { shade, withAlpha } from "./palette.js";

// ---------- BIO — Nebulosa Viola: alieno organico, morbido, luminescente ----
const BIO = {
  id: "bio",
  hard: 0,
  wobble: 1,
  eyeStyle: "bio",
  accent: (base) => shade(base, 0.5),
  // Tentacolo carnoso: curva quadratica con punta luminosa.
  limb(ctx, e, o) {
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(o.x0, o.y0);
    const mx = (o.x0 + o.x1) / 2 + o.sway, my = (o.y0 + o.y1) / 2;
    ctx.quadraticCurveTo(mx, my, o.x1 + o.sway * 0.6, o.y1);
    ctx.stroke();
    // punta bioluminescente
    ctx.fillStyle = withAlpha(shade(o.color, 0.5), 0.85);
    ctx.beginPath();
    ctx.arc(o.x1 + o.sway * 0.6, o.y1, o.width * 0.55, 0, TAU);
    ctx.fill();
  },
  // Bozzi morbidi che respirano lungo il perimetro.
  edge(ctx, e, pts, r) {
    ctx.fillStyle = withAlpha(shade(e.color, 0.35), 0.5);
    for (let i = 0; i < pts.length; i += 3) {
      const p = pts[i];
      const b = 1 + Math.sin((e.t || 0) * 3 + i) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.09 * b, 0, TAU);
      ctx.fill();
    }
  },
  // Vene traslucide + micro-cellule (evoluzione del vecchio "bio").
  pattern(ctx, e, r) {
    const c = e.color || "#ffffff";
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = shade(c, -0.35);
    ctx.lineWidth = 1.2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.15, -r * 0.7);
      ctx.quadraticCurveTo(s * r * 0.7, 0, s * r * 0.2, r * 0.7);
      ctx.stroke();
    }
    // cellule pulsanti
    const pulse = 0.35 + 0.15 * Math.sin((e.t || 0) * 4);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = shade(c, 0.55);
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.2, r * 0.12, 0, TAU);
    ctx.arc(r * 0.35, -r * 0.1, r * 0.1, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  },
};

// ---------- SCRAP — Cintura d'Asteroidi: robo-rottame, piastre e cavi -------
const SCRAP = {
  id: "scrap",
  hard: 0.7,
  wobble: 0.35,
  eyeStyle: "lens",
  accent: (base) => "#ffd23f",
  // Cavo rigido a 2 segmenti con giunto e luce in punta.
  limb(ctx, e, o) {
    const jx = (o.x0 + o.x1) / 2 + o.sway * 0.4;
    const jy = (o.y0 + o.y1) / 2;
    ctx.strokeStyle = shade(o.color, -0.2);
    ctx.lineWidth = o.width;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(o.x0, o.y0);
    ctx.lineTo(jx, jy);
    ctx.lineTo(o.x1 + o.sway * 0.3, o.y1);
    ctx.stroke();
    // giunto
    ctx.fillStyle = "rgba(232,238,245,0.75)";
    ctx.beginPath();
    ctx.arc(jx, jy, o.width * 0.5, 0, TAU);
    ctx.fill();
    // luce in punta (ambra)
    ctx.fillStyle = "rgba(255,210,63,0.9)";
    ctx.beginPath();
    ctx.arc(o.x1 + o.sway * 0.3, o.y1, o.width * 0.45, 0, TAU);
    ctx.fill();
  },
  // 2-3 piastre metalliche sporgenti + bulloni.
  edge(ctx, e, pts, r) {
    if (!pts.length) return;
    ctx.fillStyle = withAlpha(shade(e.color, -0.15), 0.9);
    ctx.strokeStyle = "rgba(20,26,30,0.6)";
    ctx.lineWidth = 1;
    const step = Math.max(2, Math.floor(pts.length / 3));
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i];
      const a = Math.atan2(p.y, p.x);
      const s = r * 0.22;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.fillRect(-s * 0.3, -s * 0.55, s * 0.85, s * 1.1);
      ctx.strokeRect(-s * 0.3, -s * 0.55, s * 0.85, s * 1.1);
      // bullone sulla piastra
      ctx.fillStyle = "rgba(232,238,245,0.7)";
      ctx.beginPath();
      ctx.arc(s * 0.12, 0, s * 0.16, 0, TAU);
      ctx.fill();
      ctx.fillStyle = withAlpha(shade(e.color, -0.15), 0.9);
      ctx.restore();
    }
  },
  // Fessura metallica + bulloni + pannello riparato.
  pattern(ctx, e, r) {
    ctx.fillStyle = "rgba(232,238,245,0.6)";
    ctx.strokeStyle = "rgba(20,26,30,0.5)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66, r * 0.09, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    // giuntura saldata storta (carattere da rottame)
    ctx.strokeStyle = "rgba(15,20,24,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.1);
    ctx.lineTo(-r * 0.1, 0);
    ctx.lineTo(r * 0.15, -r * 0.12);
    ctx.lineTo(r * 0.6, 0.05 * r);
    ctx.stroke();
    // pannello di riparazione più chiaro
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(-r * 0.45, r * 0.15, r * 0.5, r * 0.34);
    ctx.strokeStyle = "rgba(20,26,30,0.4)";
    ctx.strokeRect(-r * 0.45, r * 0.15, r * 0.5, r * 0.34);
  },
};

// ---------- CRYSTAL — Ghiaccio Cosmico: cristalli taglienti, freddi --------
const CRYSTAL = {
  id: "crystal",
  hard: 1,
  wobble: 0.15,
  eyeStyle: "glyph",
  accent: (base) => "#dff6ff",
  // Spuntone di ghiaccio: triangolo affusolato pieno con filo di luce.
  limb(ctx, e, o) {
    const dx = o.x1 - o.x0 + o.sway * 0.3, dy = o.y1 - o.y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len; // normale
    const w = o.width * 0.9;
    ctx.fillStyle = withAlpha(shade(o.color, 0.15), 0.95);
    ctx.beginPath();
    ctx.moveTo(o.x0 + nx * w, o.y0 + ny * w);
    ctx.lineTo(o.x0 - nx * w, o.y0 - ny * w);
    ctx.lineTo(o.x0 + dx, o.y0 + dy);
    ctx.closePath();
    ctx.fill();
    // filo speculare sul lato illuminato
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(o.x0 + nx * w * 0.6, o.y0 + ny * w * 0.6);
    ctx.lineTo(o.x0 + dx, o.y0 + dy);
    ctx.stroke();
  },
  // Schegge di cristallo che spuntano dal perimetro.
  edge(ctx, e, pts, r) {
    if (!pts.length) return;
    ctx.fillStyle = withAlpha(shade(e.color, 0.3), 0.9);
    const step = Math.max(2, Math.floor(pts.length / 4));
    for (let i = 1; i < pts.length; i += step) {
      const p = pts[i];
      const a = Math.atan2(p.y, p.x);
      const len = r * (0.28 + ((i * 7919) % 5) * 0.05); // lunghezze varie, stabili
      const w = r * 0.09;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -w);
      ctx.lineTo(len, 0);
      ctx.lineTo(0, w);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },
  // Sfaccettature interne + glint che scorre.
  pattern(ctx, e, r) {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.35;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      ctx.stroke();
    }
    // glint speculare che ruota piano (vivo, ma senza blur)
    const ga = ((e.t || 0) * 0.7) % TAU;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(Math.cos(ga) * r * 0.35, Math.sin(ga) * r * 0.35 - r * 0.1, r * 0.1, 0, TAU);
    ctx.fill();
  },
};

// ---------- MAGMA — Inferno Stellare: obsidiana crepata, fuoco vivo --------
const MAGMA = {
  id: "magma",
  hard: 0.5,
  wobble: 0.6,
  eyeStyle: "slit",
  accent: (base) => "#ffb03f",
  // Filamento di fuoco: tratto caldo con nucleo chiaro.
  limb(ctx, e, o) {
    const glow = 0.6 + 0.4 * Math.sin((e.t || 0) * 7 + o.i);
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(255,${(110 + glow * 80) | 0},40,0.85)`;
    ctx.lineWidth = o.width;
    ctx.beginPath();
    ctx.moveTo(o.x0, o.y0);
    const mx = (o.x0 + o.x1) / 2 + o.sway * 1.2, my = (o.y0 + o.y1) / 2;
    ctx.quadraticCurveTo(mx, my, o.x1 + o.sway, o.y1);
    ctx.stroke();
    // anima incandescente più sottile
    ctx.strokeStyle = `rgba(255,235,160,${0.5 + 0.4 * glow})`;
    ctx.lineWidth = o.width * 0.4;
    ctx.beginPath();
    ctx.moveTo(o.x0, o.y0);
    ctx.quadraticCurveTo(mx, my, o.x1 + o.sway, o.y1);
    ctx.stroke();
  },
  // Creste ardenti: piccoli triangoli caldi sul perimetro.
  edge(ctx, e, pts, r) {
    if (!pts.length) return;
    const glow = 0.5 + 0.5 * Math.sin((e.t || 0) * 5);
    ctx.fillStyle = `rgba(255,${(140 + glow * 70) | 0},50,0.8)`;
    const step = Math.max(2, Math.floor(pts.length / 4));
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i];
      const a = Math.atan2(p.y, p.x);
      const len = r * 0.22 * (0.8 + glow * 0.35);
      const w = r * 0.1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -w);
      ctx.lineTo(len, 0);
      ctx.lineTo(0, w);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },
  // Crepe incandescenti pulsanti su crosta scura.
  pattern(ctx, e, r) {
    const t = e.t || 0;
    // crosta: chiazze scure di obsidiana (tenui, solo texture)
    ctx.fillStyle = "rgba(10,4,8,0.18)";
    ctx.beginPath();
    ctx.arc(-r * 0.42, -r * 0.3, r * 0.15, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.38, r * 0.35, r * 0.12, 0, TAU);
    ctx.fill();
    const glow = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.strokeStyle = `rgba(255,${(120 + glow * 90) | 0},50,${0.5 + 0.4 * glow})`;
    ctx.lineWidth = 1.6;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(s * r * 0.25, -r * 0.1);
      ctx.lineTo(0, r * 0.15);
      ctx.lineTo(s * r * 0.3, r * 0.6);
      ctx.stroke();
    }
    // anima chiara al centro delle crepe
    ctx.strokeStyle = `rgba(255,235,160,${0.35 + 0.3 * glow})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.2, -r * 0.1);
    ctx.stroke();
  },
};

// ---------- VOID — Vuoto Profondo: entità digitale/olografica ---------------
const VOID = {
  id: "void",
  hard: 0.85,
  wobble: 0.4,
  eyeStyle: "void",
  accent: (base) => shade(base, 0.4),
  // Linea-dati tratteggiata con nodo terminale (glitch geometrico).
  limb(ctx, e, o) {
    ctx.save();
    ctx.strokeStyle = withAlpha(o.color, 0.9);
    ctx.lineWidth = Math.max(1, o.width * 0.6);
    ctx.setLineDash([3, 3]);
    ctx.lineDashOffset = -((e.t || 0) * 14 + o.i * 3); // i dati "scorrono"
    ctx.beginPath();
    ctx.moveTo(o.x0, o.y0);
    ctx.lineTo(o.x1 + o.sway * 0.5, o.y1);
    ctx.stroke();
    ctx.restore();
    // nodo terminale: rombo
    const s = o.width * 0.7;
    ctx.fillStyle = withAlpha(shade(o.color, 0.4), 0.95);
    ctx.save();
    ctx.translate(o.x1 + o.sway * 0.5, o.y1);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  },
  // Archi staccati che fluttuano oltre il perimetro (silhouette "esplosa").
  edge(ctx, e, pts, r) {
    const t = e.t || 0;
    ctx.strokeStyle = withAlpha(e.color, 0.75);
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 3; k++) {
      const a0 = (k / 3) * TAU + t * 0.5;
      const rr = r * (1.22 + 0.06 * Math.sin(t * 2 + k * 2));
      ctx.beginPath();
      ctx.arc(0, 0, rr, a0, a0 + 0.9);
      ctx.stroke();
    }
  },
  // Wireframe olografico + scanline (evoluzione del vecchio "wire").
  pattern(ctx, e, r) {
    const c = e.color || "#ffffff";
    const t = e.t || 0;
    ctx.strokeStyle = withAlpha(c, 0.85);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * TAU;
      const px = Math.cos(a) * r * 0.8;
      const py = Math.sin(a) * r * 0.8;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    const sy = Math.sin(t * 3) * r * 0.7;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, sy);
    ctx.lineTo(r * 0.8, sy);
    ctx.stroke();
    // glitch: ogni tanto una fetta si sposta di lato
    const g = Math.sin(t * 11);
    if (g > 0.93) {
      ctx.fillStyle = withAlpha(c, 0.28);
      ctx.fillRect(-r * 0.7 + r * 0.2, -r * 0.15, r * 1.2, r * 0.22);
    }
  },
};

export const SKINS = [BIO, SCRAP, CRYSTAL, MAGMA, VOID];

export function skinFor(ent) {
  return SKINS[(ent && ent.skin ? ent.skin : 0) % SKINS.length];
}

// Interpolazione "hard": dato un punto di controllo curvo e i suoi estremi,
// lo tira verso la retta quando il kit è sfaccettato. Puro/testabile.
export function hardLerp(curveVal, straightVal, hard) {
  return curveVal + (straightVal - curveVal) * hard;
}
