// Mondo 1 — NEBULOSA VIOLA · bestiario cartoon-dark: creature con faccia,
// denti e personalità. Corpi prugna scuro, accento = colore del mondo.
import { TAU } from "../utils.js";
import { shade, withAlpha } from "../palette.js";
import { body, spriteKey, darkBase, midTone, cartoonEye, fangs } from "./parts.js";

// Blink ciclico condiviso (ogni ~3s, sfasato da e.t iniziale casuale).
function blinkOf(e, period = 3) {
  const cy = e.t % period;
  return cy > period - 0.15 ? Math.abs(Math.sin(((cy - (period - 0.15)) / 0.15) * Math.PI)) * 0.9 + 0.1 : 1;
}

// 1. STRAIGHT — "Ombra Golosa": imp fluttuante a goccia, bocca enorme.
function ombraGolosa(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y + Math.sin(e.t * 2.4) * 2); // bob visivo
  const acc = e.color;

  // Braccine tozze che penzolano (vive).
  if (e.hitFlash <= 0) {
    ctx.strokeStyle = darkBase(acc);
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    for (const s of [-1, 1]) {
      const sw = Math.sin(e.t * 3 + s) * 3;
      ctx.beginPath();
      ctx.moveTo(s * 12, 2);
      ctx.quadraticCurveTo(s * 16 + sw, 8, s * 14 + sw, 13);
      ctx.stroke();
    }
  }

  body(ctx, e, spriteKey(e), 24, (c, flash) => {
    // Corpo a goccia rovesciata: punta in alto, pancia larga.
    const drop = () => {
      c.beginPath();
      c.moveTo(0, -17);
      c.quadraticCurveTo(12, -11, 13, 1);
      c.quadraticCurveTo(13, 12, 0, 14);
      c.quadraticCurveTo(-13, 12, -13, 1);
      c.quadraticCurveTo(-12, -11, 0, -17);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; drop(); c.fill(); return; }
    c.fillStyle = darkBase(acc);
    drop();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.8;
    c.stroke();
    // Cornetti.
    c.fillStyle = midTone(acc);
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 4, -14);
      c.quadraticCurveTo(s * 9, -20, s * 10, -23);
      c.quadraticCurveTo(s * 6, -20, s * 3, -16);
      c.closePath();
      c.fill();
    }
    // Pancia leggermente più chiara.
    c.fillStyle = withAlpha(midTone(acc), 0.5);
    c.beginPath();
    c.ellipse(0, 7, 8, 5.5, 0, 0, TAU);
    c.fill();
    // BOCCA enorme: fauci scure con dentoni bianchi appesi al labbro.
    c.fillStyle = "#12081a";
    c.beginPath();
    c.moveTo(-9, 1);
    c.quadraticCurveTo(0, 12, 9, 1);
    c.quadraticCurveTo(0, 5.5, -9, 1);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(acc, 0.8);
    c.lineWidth = 1.2;
    c.stroke();
    fangs(c, 0, 2.2, 4, 14, 3.4);
  });

  // Occhioni vivi che guardano il player (in basso) + blink.
  if (e.hitFlash <= 0) {
    const blink = blinkOf(e);
    cartoonEye(ctx, -5, -6, 3.4, { blink, lookY: 0.5 });
    cartoonEye(ctx, 5, -6, 3.4, { blink, lookY: 0.5 });
  }
  ctx.restore();
}

// 2. ZIGZAG — "Falenotte": falena-pipistrello con ali smerlate a doppio lobo.
function falenotte(ctx, e) {
  const acc = e.color;
  const flap = Math.sin(e.t * 12) * 0.5 + 0.5; // 0..1
  ctx.save();
  ctx.translate(e.x, e.y);

  // Ali vive (l'apertura segue il flap) — membrana scura, bordo acceso.
  if (e.hitFlash <= 0) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = darkBase(acc);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.quadraticCurveTo(s * 20, -13 - flap * 7, s * 22, -2);
      ctx.quadraticCurveTo(s * 19, 2, s * 11, 2);   // smerlo tra i lobi
      ctx.quadraticCurveTo(s * 16, 7 + flap * 5, s * 8, 9);
      ctx.quadraticCurveTo(s * 3, 6, 0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = acc;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      // "Occhio d'ala" che si accende col flap.
      ctx.fillStyle = withAlpha("#ff5bd0", 0.35 + flap * 0.55);
      ctx.beginPath();
      ctx.arc(s * 14, -4 - flap * 3, 2.6, 0, TAU);
      ctx.fill();
    }
    // Antenne piumate.
    ctx.strokeStyle = midTone(acc);
    ctx.lineWidth = 1.3;
    for (const s of [-1, 1]) {
      const sw = Math.sin(e.t * 5 + s) * 1.5;
      ctx.beginPath();
      ctx.moveTo(s * 2, -9);
      ctx.quadraticCurveTo(s * 5 + sw, -14, s * 7 + sw, -17);
      ctx.stroke();
      for (let k = 1; k <= 3; k++) {
        const px = s * (2 + k * 1.6) + sw * (k / 3), py = -9 - k * 2.6;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + s * 2.4, py - 0.8);
        ctx.stroke();
      }
    }
  }

  body(ctx, e, spriteKey(e), 20, (c, flash) => {
    // Torace segmentato + testa con orecchie a punta.
    const silhouette = () => {
      c.beginPath();
      c.ellipse(0, 2, 4.5, 9.5, 0, 0, TAU);
      c.moveTo(0, -14);
      c.arc(0, -9, 5, 0, TAU);
    };
    if (flash) { c.fillStyle = "#ffffff"; silhouette(); c.fill(); return; }
    c.fillStyle = darkBase(acc);
    silhouette();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.5;
    c.stroke();
    // Orecchie a punta.
    c.fillStyle = darkBase(acc);
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 2.5, -12.5);
      c.lineTo(s * 6, -18);
      c.lineTo(s * 5, -11.5);
      c.closePath();
      c.fill();
    }
    // Segmenti del torace.
    c.strokeStyle = withAlpha(acc, 0.55);
    c.lineWidth = 1;
    for (const yy of [0, 4, 8]) {
      c.beginPath();
      c.moveTo(-4, yy);
      c.lineTo(4, yy);
      c.stroke();
    }
    // Zanne minuscole.
    fangs(c, 0, -6.2, 2, 5, 2.2);
  });

  // Occhietti gialli luminosi (vivi, senza blur).
  if (e.hitFlash <= 0) {
    ctx.fillStyle = shade(acc, 0.5);
    ctx.beginPath();
    ctx.arc(-2, -9.5, 1.4, 0, TAU);
    ctx.arc(2, -9.5, 1.4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// 3. SHOOTER — "Sputafuoco": rospo con bocca-imbuto cannone; la gola si
// carica prima dello sparo (telegrafo).
function sputafuoco(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);

  body(ctx, e, spriteKey(e), 26, (c, flash) => {
    const bean = () => {
      c.beginPath();
      c.moveTo(-14, -2);
      c.quadraticCurveTo(-13, -12, 0, -12);
      c.quadraticCurveTo(13, -12, 14, -2);
      c.quadraticCurveTo(14, 6, 0, 7);
      c.quadraticCurveTo(-14, 6, -14, -2);
      c.closePath();
    };
    const funnel = () => {
      c.beginPath();
      c.moveTo(-5, 5);
      c.lineTo(-7.5, 13);
      c.lineTo(7.5, 13);
      c.lineTo(5, 5);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; bean(); c.fill(); funnel(); c.fill(); return; }
    // Zampette laterali statiche.
    c.strokeStyle = midTone(acc);
    c.lineWidth = 3;
    c.lineCap = "round";
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 12, 2);
      c.lineTo(s * 16, 8);
      c.stroke();
    }
    // Corpo a fagiolo.
    c.fillStyle = darkBase(acc);
    bean();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.8;
    c.stroke();
    // Verruche.
    c.fillStyle = withAlpha(midTone(acc), 0.8);
    for (const [wx, wy, wr] of [[-8, -7, 1.6], [7, -8, 1.3], [1, -10, 1.1], [-3, -4, 1]]) {
      c.beginPath();
      c.arc(wx, wy, wr, 0, TAU);
      c.fill();
    }
    // Imbuto boccale (il cannone) con labbro acceso.
    c.fillStyle = "#12081a";
    funnel();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.6;
    c.stroke();
  });

  if (e.hitFlash <= 0) {
    // Gola che si CARICA prima dello sparo (telegrafo leggibile).
    const charge = Math.max(0, Math.min(1, 1 - (e.fireTimer ?? 1)));
    ctx.fillStyle = `rgba(255,190,120,${0.15 + 0.75 * charge})`;
    ctx.beginPath();
    ctx.arc(0, 11, 2 + 3.2 * charge, 0, TAU);
    ctx.fill();
    // Occhi su peduncoli che dondolano.
    const blink = blinkOf(e, 2.6);
    ctx.strokeStyle = midTone(acc);
    ctx.lineWidth = 2.2;
    for (const s of [-1, 1]) {
      const sw = Math.sin(e.t * 2.2 + s * 1.7) * 1.6;
      ctx.beginPath();
      ctx.moveTo(s * 6, -11);
      ctx.quadraticCurveTo(s * 7 + sw, -15, s * 8 + sw, -17);
      ctx.stroke();
      cartoonEye(ctx, s * 8 + sw, -18, 3.2, { blink: s < 0 ? blink : 1, lookY: 0.55 });
    }
  }
  ctx.restore();
}

// 4. KAMIKAZE — "Urlo Cadente": teschio-cometa che precipita urlando.
function urloCadente(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);

  const paint = (c, flash) => {
    const skull = () => {
      c.beginPath();
      c.arc(0, -3, 10.5, Math.PI * 0.95, Math.PI * 0.05); // cranio
      c.quadraticCurveTo(10, 4, 6, 6);   // guancia dx
      c.lineTo(-6, 6);
      c.quadraticCurveTo(-10, 4, -10.4, -1.5);
      c.closePath();
    };
    const jaw = () => {
      c.beginPath();
      c.moveTo(-5.5, 8);
      c.quadraticCurveTo(0, 16, 5.5, 8);
      c.quadraticCurveTo(0, 10.5, -5.5, 8);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; skull(); c.fill(); jaw(); c.fill(); return; }
    c.fillStyle = "#1c0d24";
    skull();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.8;
    c.stroke();
    // Occhi arrabbiati: mezzelune con sopracciglia a V.
    c.fillStyle = shade(acc, 0.3);
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 2, -5);
      c.quadraticCurveTo(s * 6, -8.5, s * 8, -4.5);
      c.quadraticCurveTo(s * 5, -3, s * 2, -5);
      c.closePath();
      c.fill();
      c.strokeStyle = "#0c0512";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(s * 1.5, -7.5);
      c.lineTo(s * 8, -6);
      c.stroke();
      c.strokeStyle = acc;
      c.lineWidth = 1.8;
    }
    // Naso a cuore rovesciato.
    c.fillStyle = "#0c0512";
    c.beginPath();
    c.moveTo(0, 2.5);
    c.lineTo(-2, -0.5);
    c.lineTo(2, -0.5);
    c.closePath();
    c.fill();
    // Mascella spalancata (urlo) con denti.
    c.fillStyle = "#12081a";
    jaw();
    c.fill();
    c.strokeStyle = withAlpha(acc, 0.8);
    c.lineWidth = 1.2;
    c.stroke();
    fangs(c, 0, 8.6, 3, 9, 2.6);
  };

  // Afterimage del cranio sopra (velocità leggibile): riusa lo sprite cotto.
  if (e.hitFlash <= 0) {
    for (const [dy, a] of [[-16, 0.14], [-8, 0.28]]) {
      ctx.globalAlpha = a;
      ctx.save();
      ctx.translate(0, dy);
      body(ctx, e, spriteKey(e), 24, paint);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    // Capigliatura di fiamme rosa (flicker).
    const flick = Math.abs(Math.sin(e.t * 21));
    for (const [fx, fh, fw] of [[-5, 9, 4], [0, 13, 5], [5, 8, 4]]) {
      ctx.fillStyle = withAlpha(shade(acc, 0.35), 0.5 + flick * 0.35);
      ctx.beginPath();
      ctx.moveTo(fx - fw / 2, -11);
      ctx.quadraticCurveTo(fx + (flick - 0.5) * 3, -11 - fh - flick * 4, fx + fw / 2, -11);
      ctx.closePath();
      ctx.fill();
    }
  }
  body(ctx, e, spriteKey(e), 24, paint);
  ctx.restore();
}

export const W1 = {
  straight: ombraGolosa,
  zigzag: falenotte,
  shooter: sputafuoco,
  kamikaze: urloCadente,
};
