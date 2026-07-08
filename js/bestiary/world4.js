// Mondo 4 — INFERNO STELLARE · demoni cartoon-dark: obsidiana crepata,
// fuoco vivo, sorrisi luminosi e occhi a fessura.
import { TAU } from "../utils.js";
import { withAlpha } from "../palette.js";
import { body, spriteKey, slitEye, fangs } from "./parts.js";

const OBSIDIAN = "#1e0c0a";   // roccia scura
const OBS_LIT = "#2e1410";    // faccia più calda
const EMBER = "#ff6a3f";      // crepe/fauci
const HOT = "#ffb03f";        // fuoco chiaro

// Crepe incandescenti pulsanti (vive, senza blur).
function cracks(ctx, e, paths, base = 0.45) {
  const glow = 0.5 + 0.5 * Math.sin(e.t * 5);
  ctx.strokeStyle = `rgba(255,${(120 + glow * 80) | 0},60,${base + 0.35 * glow})`;
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  for (const pts of paths) {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.stroke();
  }
}

// 14. STRAIGHT — "Bracino": imp di brace con sorriso luminoso a denti scuri.
function bracino(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y + Math.sin(e.t * 2.1) * 2);

  // Alette da pipistrello pigre (vive).
  if (e.hitFlash <= 0) {
    const flap = Math.sin(e.t * 6) * 0.5 + 0.5;
    ctx.fillStyle = OBSIDIAN;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 9, -4);
      ctx.quadraticCurveTo(s * (17 + flap * 4), -10 - flap * 4, s * (19 + flap * 3), -2);
      ctx.quadraticCurveTo(s * 15, 2, s * 10, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = withAlpha(EMBER, 0.8);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  body(ctx, e, spriteKey(e), 22, (c, flash) => {
    const ball = () => {
      c.beginPath();
      c.arc(0, 0, 12.5, 0, TAU);
    };
    if (flash) { c.fillStyle = "#ffffff"; ball(); c.fill(); return; }
    c.fillStyle = OBSIDIAN;
    ball();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.8;
    c.stroke();
    // Corna mozze.
    c.fillStyle = OBS_LIT;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 5, -11);
      c.lineTo(s * 8.5, -16);
      c.lineTo(s * 9.5, -12.5);
      c.closePath();
      c.fill();
    }
    // SORRISO luminoso con denti in silhouette scura (inversione).
    c.fillStyle = EMBER;
    c.beginPath();
    c.moveTo(-8, 3);
    c.quadraticCurveTo(0, 11.5, 8, 3);
    c.quadraticCurveTo(0, 6.5, -8, 3);
    c.closePath();
    c.fill();
    // denti scuri appesi al labbro dentro la bocca accesa
    fangs(c, 0, 3.8, 4, 12, 2.6, OBSIDIAN);
  });

  if (e.hitFlash <= 0) {
    // Crepe pulsanti + occhi a fessura che si stringono col sorriso.
    cracks(ctx, e, [[-8, -6, -4, -2, -7, 1], [6, -8, 3, -4, 7, -1]]);
    const squeeze = 0.5 + 0.5 * Math.sin(e.t * 2.1);
    slitEye(ctx, -4.5, -4, 2.6, EMBER, { squeeze });
    slitEye(ctx, 4.5, -4, 2.6, EMBER, { squeeze });
  }
  ctx.restore();
}

// 15. SHOOTER — "Bocca di Vulcano": cono vulcanico col cratere-mortaio.
function boccaDiVulcano(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);

  body(ctx, e, spriteKey(e), 24, (c, flash) => {
    const cone = () => {
      c.beginPath();
      c.moveTo(-15, 10);
      c.lineTo(-6, -10);
      c.lineTo(6, -10);
      c.lineTo(15, 10);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; cone(); c.fill(); return; }
    c.fillStyle = OBSIDIAN;
    cone();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.8;
    c.stroke();
    // Strati di roccia.
    c.strokeStyle = "rgba(90,40,26,0.8)";
    c.lineWidth = 1.2;
    for (const [y0, w0] of [[2, 12], [6, 13.5]]) {
      c.beginPath();
      c.moveTo(-w0, y0);
      c.lineTo(w0, y0);
      c.stroke();
    }
    // Colate solidificate sui fianchi.
    c.strokeStyle = OBS_LIT;
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(-8, -6);
    c.quadraticCurveTo(-10, 0, -12, 8);
    c.moveTo(9, -4);
    c.quadraticCurveTo(11, 2, 12.5, 9);
    c.stroke();
    // CRATERE-bocca rivolto in basso con labbro acceso.
    c.fillStyle = "#120404";
    c.beginPath();
    c.ellipse(0, -10, 6.5, 3.4, 0, 0, TAU);
    c.fill();
    c.strokeStyle = EMBER;
    c.lineWidth = 1.6;
    c.stroke();
    // Sopracciglia pesanti di roccia.
    c.strokeStyle = OBS_LIT;
    c.lineWidth = 2.6;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 2.5, 0.5);
      c.lineTo(s * 8, -1.5);
      c.stroke();
    }
  });

  if (e.hitFlash <= 0) {
    // Carica del mortaio: il cratere si accende prima dello sparo.
    const charge = Math.max(0, Math.min(1, 1 - (e.fireTimer ?? 1)));
    ctx.fillStyle = `rgba(255,${(150 + charge * 80) | 0},70,${0.2 + 0.7 * charge})`;
    ctx.beginPath();
    ctx.ellipse(0, -10, 4.6 * (0.5 + charge * 0.5), 2.2 * (0.5 + charge * 0.5), 0, 0, TAU);
    ctx.fill();
    // Scintille che salgono dal cratere quando carico.
    if (charge > 0.4) {
      for (let i = 0; i < 3; i++) {
        const ph = ((e.t * 2 + i * 0.33) % 1);
        ctx.fillStyle = withAlpha(HOT, (1 - ph) * 0.8 * charge);
        ctx.beginPath();
        ctx.arc((i - 1) * 3 + Math.sin(e.t * 7 + i) * 2, -12 - ph * 9, 1.1, 0, TAU);
        ctx.fill();
      }
    }
    // Fumetto periodico.
    const ph = (e.t % 1.1) / 1.1;
    if (ph < 0.55) {
      ctx.fillStyle = `rgba(120,100,90,${0.3 * (1 - ph / 0.55)})`;
      ctx.beginPath();
      ctx.arc(3, -15 - ph * 8, 2 + ph * 3, 0, TAU);
      ctx.fill();
    }
    // Occhi a fessura che si accendono col charge.
    slitEye(ctx, -5.5, 3.5, 2.4 + charge * 0.6, EMBER);
    slitEye(ctx, 5.5, 3.5, 2.4 + charge * 0.6, EMBER);
  }
  ctx.restore();
}

// 16. KAMIKAZE — "Diavolo Tuffatore": testa demoniaca aerodinamica in picchiata.
function diavoloTuffatore(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);
  // Si allunga con la velocità (stretch verticale, solo visivo).
  const stretch = 1 + Math.min(0.25, Math.max(0, (e.speed - 90) / 600));
  ctx.scale(1 / Math.sqrt(stretch), stretch);

  body(ctx, e, spriteKey(e), 24, (c, flash) => {
    const head = () => {
      c.beginPath();
      c.moveTo(0, 15);                       // mento a punta verso il player
      c.quadraticCurveTo(9, 6, 8.5, -4);
      c.quadraticCurveTo(8, -11, 0, -12);
      c.quadraticCurveTo(-8, -11, -8.5, -4);
      c.quadraticCurveTo(-9, 6, 0, 15);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; head(); c.fill(); return; }
    // Corna lunghe all'indietro (integrate nella freccia della silhouette).
    c.fillStyle = OBS_LIT;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 5, -9);
      c.quadraticCurveTo(s * 12, -14, s * 14, -21);
      c.quadraticCurveTo(s * 8, -16, s * 3.5, -11.5);
      c.closePath();
      c.fill();
      c.strokeStyle = withAlpha(EMBER, 0.6);
      c.lineWidth = 1;
      c.stroke();
    }
    c.fillStyle = OBSIDIAN;
    head();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.8;
    c.stroke();
    // Bocca-urlo sul mento: ellisse accesa con zanne scure.
    c.fillStyle = EMBER;
    c.beginPath();
    c.ellipse(0, 7, 4.6, 3.6, 0, 0, TAU);
    c.fill();
    fangs(c, 0, 4.6, 2, 6, 2.2, OBSIDIAN);
    fangs(c, 0, 9.6, 2, 5, 2, OBSIDIAN, -1);
    // Sopracciglia a V furiose.
    c.strokeStyle = OBS_LIT;
    c.lineWidth = 2.2;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 1.5, -5.5);
      c.lineTo(s * 7, -3);
      c.stroke();
    }
  });

  if (e.hitFlash <= 0) {
    // Criniera di fuoco (flicker a 2 strati).
    const flick = Math.abs(Math.sin(e.t * 21));
    for (const [fx, fh] of [[-4, 8], [0, 12], [4, 7]]) {
      ctx.fillStyle = withAlpha(EMBER, 0.55 + flick * 0.3);
      ctx.beginPath();
      ctx.moveTo(fx - 2.4, -11);
      ctx.quadraticCurveTo(fx + (flick - 0.5) * 4, -11 - fh - flick * 5, fx + 2.4, -11);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = withAlpha(HOT, 0.5 + flick * 0.4);
    ctx.beginPath();
    ctx.moveTo(-1.6, -11);
    ctx.quadraticCurveTo(0, -18 - flick * 4, 1.6, -11);
    ctx.closePath();
    ctx.fill();
    // Lacrime di fuoco che risalgono.
    const ph = (e.t % 0.5) / 0.5;
    ctx.fillStyle = withAlpha(HOT, (1 - ph) * 0.7);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(s * 5, -2 - ph * 10, 1.2, 0, TAU);
      ctx.fill();
    }
    // Occhi a fessura furiosi.
    slitEye(ctx, -4.2, -3, 2.4, HOT);
    slitEye(ctx, 4.2, -3, 2.4, HOT);
  }
  ctx.restore();
}

// 17. MINE — "Cuore Ustionante": riccio di magma col teschietto inciso.
function cuoreUstionante(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);

  // Spine coniche che RESPIRANO in lunghezza (vive) e ruotano lente.
  if (e.hitFlash <= 0) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + e.t * 0.5;
      const len = e.r * 0.5 + e.r * 0.38 * (0.5 + 0.5 * Math.sin(e.t * 3 + i));
      const bx = Math.cos(a) * e.r * 0.62, by = Math.sin(a) * e.r * 0.62;
      const tx = Math.cos(a) * (e.r * 0.62 + len), ty = Math.sin(a) * (e.r * 0.62 + len);
      const nx = -Math.sin(a) * 2.6, ny = Math.cos(a) * 2.6;
      ctx.fillStyle = OBSIDIAN;
      ctx.beginPath();
      ctx.moveTo(bx + nx, by + ny);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx - nx, by - ny);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = withAlpha(EMBER, 0.7);
      ctx.lineWidth = 1;
      ctx.stroke();
      // punta chiara
      ctx.fillStyle = HOT;
      ctx.beginPath();
      ctx.arc(tx, ty, 1.1, 0, TAU);
      ctx.fill();
    }
  }

  body(ctx, e, spriteKey(e), 18, (c, flash) => {
    const core = () => {
      c.beginPath();
      c.arc(0, 0, e.r * 0.68, 0, TAU);
    };
    if (flash) { c.fillStyle = "#ffffff"; core(); c.fill(); return; }
    c.fillStyle = OBSIDIAN;
    core();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.6;
    c.stroke();
    // Crepe a ragnatela radiali (statiche nel bake, scure).
    c.strokeStyle = "rgba(120,50,30,0.9)";
    c.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.3;
      c.beginPath();
      c.moveTo(Math.cos(a) * e.r * 0.2, Math.sin(a) * e.r * 0.2);
      c.lineTo(Math.cos(a + 0.25) * e.r * 0.64, Math.sin(a + 0.25) * e.r * 0.64);
      c.stroke();
    }
  });

  if (e.hitFlash <= 0) {
    // TESCHIETTO inciso che lampeggia sempre più veloce (instabile).
    const freq = 3 + Math.min(9, e.t * 1.2);
    const on = 0.35 + 0.65 * Math.abs(Math.sin(e.t * freq));
    ctx.fillStyle = withAlpha(EMBER, on);
    // cranio
    ctx.beginPath();
    ctx.arc(0, -1, 3.2, Math.PI, 0);
    ctx.lineTo(3.2, 1.5);
    ctx.lineTo(-3.2, 1.5);
    ctx.closePath();
    ctx.fill();
    // occhi + naso scavati
    ctx.fillStyle = OBSIDIAN;
    ctx.beginPath();
    ctx.arc(-1.4, -0.6, 0.9, 0, TAU);
    ctx.arc(1.4, -0.6, 0.9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = withAlpha(EMBER, on);
    ctx.fillRect(-2.4, 2.2, 1.4, 1.6);
    ctx.fillRect(-0.7, 2.2, 1.4, 1.6);
    ctx.fillRect(1, 2.2, 1.4, 1.6);
  }
  ctx.restore();
}

export const W4 = {
  straight: bracino,
  shooter: boccaDiVulcano,
  kamikaze: diavoloTuffatore,
  mine: cuoreUstionante,
};
