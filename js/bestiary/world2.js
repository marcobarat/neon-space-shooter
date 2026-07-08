// Mondo 2 — CINTURA D'ASTEROIDI · robot di rottami: gunmetal, ruggine,
// asimmetrie, LED ambra. Macchine raffazzonate, non creature.
import { TAU } from "../utils.js";
import { shade, withAlpha } from "../palette.js";
import { body, spriteKey, midTone, lensEye, rockPath } from "./parts.js";

const HULL = "#242a20";      // lamiera scura
const RUST = "#5a3a22";      // ruggine
const LED = "#ffd23f";       // ambra
const STEEL = "rgba(232,238,245,0.75)";

// 5. STRAIGHT — "Bidone-7": drone-barile con gambe a pistone e faro scanner.
function bidone7(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);

  // Gambe a pistone vive (2 segmenti rigidi che sussultano).
  if (e.hitFlash <= 0) {
    ctx.strokeStyle = midTone(acc);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "butt";
    for (const s of [-1, 1]) {
      const kick = Math.abs(Math.sin(e.t * 6 + s * 2)) * 2;
      ctx.beginPath();
      ctx.moveTo(s * 6, 12);
      ctx.lineTo(s * 7, 16 + kick);
      ctx.lineTo(s * 5.5, 20 + kick);
      ctx.stroke();
      ctx.fillStyle = STEEL;
      ctx.beginPath();
      ctx.arc(s * 7, 16 + kick, 1.6, 0, TAU);
      ctx.fill();
    }
    // Sbuffo di scarico periodico sopra la testa.
    const ph = (e.t % 0.8) / 0.8;
    if (ph < 0.6) {
      ctx.fillStyle = `rgba(180,180,170,${0.35 * (1 - ph / 0.6)})`;
      ctx.beginPath();
      ctx.arc(6, -16 - ph * 10, 2 + ph * 3, 0, TAU);
      ctx.fill();
    }
  }

  body(ctx, e, spriteKey(e), 24, (c, flash) => {
    const barrel = () => {
      c.beginPath();
      if (c.roundRect) c.roundRect(-11, -13, 22, 26, 4);
      else c.rect(-11, -13, 22, 26);
    };
    if (flash) { c.fillStyle = "#ffffff"; barrel(); c.fill(); return; }
    c.fillStyle = HULL;
    barrel();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.7;
    c.stroke();
    // Fasce orizzontali del barile.
    c.strokeStyle = "rgba(15,20,14,0.7)";
    c.lineWidth = 1.4;
    for (const yy of [-5, 3]) {
      c.beginPath();
      c.moveTo(-11, yy);
      c.lineTo(11, yy);
      c.stroke();
    }
    // Rivetti.
    c.fillStyle = STEEL;
    for (const [rx, ry] of [[-8, -10], [8, -10], [-8, 0], [8, 0], [0, -13.5]]) {
      c.beginPath();
      c.arc(rx, ry, 1.1, 0, TAU);
      c.fill();
    }
    // Toppa di riparazione storta + macchia di ruggine.
    c.save();
    c.translate(5, 6);
    c.rotate(0.18);
    c.fillStyle = midTone(acc);
    c.fillRect(-4, -3, 8, 6);
    c.strokeStyle = "rgba(15,20,14,0.6)";
    c.lineWidth = 1;
    c.strokeRect(-4, -3, 8, 6);
    c.restore();
    c.fillStyle = withAlpha(RUST, 0.75);
    c.beginPath();
    c.ellipse(-6, 8, 3.4, 2.2, 0.4, 0, TAU);
    c.fill();
    // Striscia hazard giallo/nera in basso.
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? "#141410" : LED;
      c.fillRect(-10 + i * 4, 10, 4, 2.6);
    }
  });

  // Faro-lente che scansiona (vivo).
  if (e.hitFlash <= 0) {
    lensEye(ctx, 0, -7, 4.6, LED, { look: Math.sin(e.t * 1.7) });
  }
  ctx.restore();
}

// 6. ZIGZAG — "Sfarfaglio": aliante di lamiere ASIMMETRICO con flap a scatti.
function sfarfaglio(ctx, e) {
  const acc = e.color;
  // Flap meccanico: quantizzato a scatti, non fluido.
  const rawFlap = Math.sin(e.t * 12);
  const flap = Math.round(rawFlap * 2) / 2 * 0.4; // -0.4..0.4 a step
  ctx.save();
  ctx.translate(e.x, e.y);

  // Ali vive (una pulita, una rattoppata col morso mancante).
  if (e.hitFlash <= 0) {
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 3, -1);
      ctx.rotate(s * flap);
      ctx.fillStyle = HULL;
      ctx.beginPath();
      if (s > 0) {
        // ala destra: trapezio pulito
        ctx.moveTo(0, -3);
        ctx.lineTo(17, -7);
        ctx.lineTo(19, 2);
        ctx.lineTo(2, 4);
      } else {
        // ala sinistra: pannello con MORSO mancante
        ctx.moveTo(0, -3);
        ctx.lineTo(-12, -8);
        ctx.lineTo(-19, -3);
        ctx.lineTo(-15, -1);   // dente del morso
        ctx.lineTo(-18, 2);
        ctx.lineTo(-2, 4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = acc;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      if (s < 0) {
        // toppa sull'ala sinistra
        ctx.fillStyle = withAlpha(RUST, 0.85);
        ctx.fillRect(-11, -3.5, 5, 4);
        ctx.strokeStyle = "rgba(15,20,14,0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-11, -3.5, 5, 4);
      }
      // LED di estremità (rosso/verde, lampeggianti in controfase).
      const on = Math.sin(e.t * 6 + (s > 0 ? 0 : Math.PI)) > 0;
      ctx.fillStyle = on ? (s > 0 ? "#4dff7a" : "#ff5050") : "rgba(60,60,55,0.9)";
      ctx.beginPath();
      ctx.arc(s > 0 ? 18 : -18, -2.4, 1.7, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    // Antennina rigida con dot ambra.
    ctx.strokeStyle = midTone(acc);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, -14);
    ctx.stroke();
    ctx.fillStyle = LED;
    ctx.beginPath();
    ctx.arc(0, -15, 1.5, 0, TAU);
    ctx.fill();
  }

  body(ctx, e, spriteKey(e), 18, (c, flash) => {
    const box = () => {
      c.beginPath();
      if (c.roundRect) c.roundRect(-5.5, -8, 11, 17, 2.5);
      else c.rect(-5.5, -8, 11, 17);
    };
    if (flash) { c.fillStyle = "#ffffff"; box(); c.fill(); return; }
    c.fillStyle = HULL;
    box();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.5;
    c.stroke();
    // Oblò quadrato.
    c.fillStyle = "#10141c";
    c.fillRect(-3.4, -5.5, 6.8, 6);
    c.strokeStyle = withAlpha(acc, 0.7);
    c.lineWidth = 1;
    c.strokeRect(-3.4, -5.5, 6.8, 6);
    // Rivetti ventrali + ruggine.
    c.fillStyle = STEEL;
    for (const [rx, ry] of [[-3.5, 4], [3.5, 4]]) {
      c.beginPath();
      c.arc(rx, ry, 1, 0, TAU);
      c.fill();
    }
    c.fillStyle = withAlpha(RUST, 0.6);
    c.beginPath();
    c.ellipse(2.5, 6.5, 2.2, 1.4, 0.3, 0, TAU);
    c.fill();
  });

  // Due lenti piccole nell'oblò (vive).
  if (e.hitFlash <= 0) {
    lensEye(ctx, -1.7, -2.6, 1.8, LED);
    lensEye(ctx, 1.9, -2.6, 1.8, LED);
  }
  ctx.restore();
}

// 7. TANK — "Mastodonte": corazzato da demolizione con fornace e radar.
function mastodonte(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);

  body(ctx, e, spriteKey(e), 36, (c, flash) => {
    const hullPath = () => {
      c.beginPath();
      c.moveTo(-22, -10);
      c.lineTo(22, -10);
      c.lineTo(17, 14);
      c.lineTo(-17, 14);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; hullPath(); c.fill(); return; }
    // Cingoli laterali (dietro lo scafo).
    c.fillStyle = "#15180f";
    for (const s of [-1, 1]) {
      c.save();
      c.translate(s * 20, 2);
      c.rotate(s * 0.12);
      c.fillRect(-3, -10, 6, 22);
      c.strokeStyle = "rgba(120,126,110,0.5)";
      c.lineWidth = 1;
      for (let k = -8; k <= 10; k += 4) {
        c.beginPath();
        c.moveTo(-3, k);
        c.lineTo(3, k);
        c.stroke();
      }
      c.restore();
    }
    // Scafo trapezoidale.
    c.fillStyle = HULL;
    hullPath();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 2;
    c.stroke();
    // 3 piastre a scaglie sovrapposte con bulloni.
    c.fillStyle = midTone(acc);
    c.strokeStyle = "rgba(15,20,14,0.65)";
    c.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const y0 = -8 + i * 6;
      const w0 = 19 - i * 2;
      c.beginPath();
      if (c.roundRect) c.roundRect(-w0, y0, w0 * 2, 7, 2);
      else c.rect(-w0, y0, w0 * 2, 7);
      c.fill();
      c.stroke();
      c.fillStyle = STEEL;
      c.beginPath();
      c.arc(-w0 + 3, y0 + 3.5, 1.2, 0, TAU);
      c.arc(w0 - 3, y0 + 3.5, 1.2, 0, TAU);
      c.fill();
      c.fillStyle = midTone(acc);
    }
    // Vano fornace frontale (il glow dietro le barre è vivo).
    c.fillStyle = "#0c0e08";
    c.fillRect(-8, 8, 16, 5);
    // Ruggine.
    c.fillStyle = withAlpha(RUST, 0.7);
    c.beginPath();
    c.ellipse(14, -6, 4, 2.4, -0.4, 0, TAU);
    c.fill();
  });

  if (e.hitFlash <= 0) {
    // Glow della fornace (pulsante) + barre della griglia sopra.
    const glow = 0.5 + 0.5 * Math.sin(e.t * 3);
    ctx.fillStyle = `rgba(255,150,50,${0.25 + 0.45 * glow})`;
    ctx.fillRect(-7.4, 8.6, 14.8, 3.8);
    ctx.fillStyle = "#0c0e08";
    for (let k = -5; k <= 5; k += 3.4) ctx.fillRect(k, 8, 1.4, 5);
    // Torretta-radar rotante sul dorso.
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(e.t * 1.2);
    ctx.strokeStyle = STEEL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.stroke();
    ctx.fillStyle = LED;
    ctx.beginPath();
    ctx.arc(5, 0, 1.5, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Visore a lente.
    lensEye(ctx, 0, 0, 4.2, LED, { look: Math.sin(e.t * 1.1) * 0.7 });
  }
  ctx.restore();
}

// 8. KAMIKAZE — "Ariete": missile riciclato che precipita, fiamma in coda.
function ariete(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);
  // Trema mentre accelera (solo visivo).
  const tremor = Math.max(0, (e.speed - 90) / 340) * 2;
  ctx.translate(Math.sin(e.t * 40) * tremor, 0);

  // Fiamma del razzo SOPRA (viva, 2 strati).
  if (e.hitFlash <= 0) {
    const flick = Math.abs(Math.sin(e.t * 23));
    ctx.fillStyle = withAlpha("#ff9a3f", 0.75);
    ctx.beginPath();
    ctx.moveTo(-4, -13);
    ctx.quadraticCurveTo(0, -20 - flick * 8, 4, -13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = withAlpha("#ffe9a0", 0.85);
    ctx.beginPath();
    ctx.moveTo(-2, -13);
    ctx.quadraticCurveTo(0, -17 - flick * 5, 2, -13);
    ctx.closePath();
    ctx.fill();
  }

  body(ctx, e, spriteKey(e), 24, (c, flash) => {
    const shell = () => {
      c.beginPath();
      c.moveTo(0, 16);          // punta in BASSO, verso il player
      c.lineTo(6.5, 6);
      c.lineTo(6.5, -12);
      c.lineTo(-6.5, -12);
      c.lineTo(-6.5, 6);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; shell(); c.fill(); return; }
    // Alette posteriori saldate storte.
    c.fillStyle = midTone(acc);
    c.strokeStyle = "rgba(15,20,14,0.6)";
    c.lineWidth = 1;
    for (const [s, tilt] of [[-1, 0.12], [1, -0.06]]) {
      c.save();
      c.translate(s * 6, -9);
      c.rotate(s * tilt);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(s * 6, -5);
      c.lineTo(s * 6, 1);
      c.lineTo(0, 3);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }
    // Corpo cilindrico.
    c.fillStyle = HULL;
    shell();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.7;
    c.stroke();
    // Punta in metallo chiaro.
    c.fillStyle = STEEL;
    c.beginPath();
    c.moveTo(0, 16);
    c.lineTo(5, 8.5);
    c.lineTo(-5, 8.5);
    c.closePath();
    c.fill();
    // Tacche-scritta sul corpo + crepa.
    c.strokeStyle = "rgba(232,238,245,0.5)";
    c.lineWidth = 1;
    for (const yy of [-8, -5, -2]) {
      c.beginPath();
      c.moveTo(-4, yy);
      c.lineTo(2 - (yy % 2), yy);
      c.stroke();
    }
    c.strokeStyle = "rgba(10,10,8,0.8)";
    c.beginPath();
    c.moveTo(4, 2);
    c.lineTo(6.5, 5);
    c.stroke();
  });

  // Visore-fessura rosso lampeggiante (vivo).
  if (e.hitFlash <= 0) {
    const on = Math.sin(e.t * 14) > -0.2;
    ctx.fillStyle = on ? "#ff4040" : "#401414";
    ctx.fillRect(-4, 4, 8, 2);
  }
  ctx.restore();
}

// 9. ASTEROID/SHARD/PEBBLE — "Macigno Filoniano": roccia con vene di
// minerale che ne disegnano le linee di frattura (si capisce che si spezza).
// Esportata anche come base per il "Relitto Corrotto" del Vuoto (style).
export function macigno(ctx, e, style = {}) {
  const veinCol = style.vein || LED;
  const rockFill = style.fill || "#2a2c1e";
  const lod = e.type === "asteroid" ? 2 : e.type === "shard" ? 1 : 0;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.rot || 0);

  body(ctx, e, spriteKey(e), e.r + 8, (c, flash) => {
    const sides = lod === 2 ? 10 : lod === 1 ? 6 : 4;
    if (flash) { c.fillStyle = "#ffffff"; rockPath(c, sides, e.r, lod); c.fill(); return; }
    c.fillStyle = rockFill;
    rockPath(c, sides, e.r, lod);
    c.fill();
    c.strokeStyle = withAlpha(e.color, 0.9);
    c.lineWidth = 1.8;
    c.stroke();
    // Crateri (solo sul macigno grande).
    if (lod === 2) {
      c.fillStyle = "rgba(10,12,6,0.5)";
      for (const [cx, cy, cr] of [[-e.r * 0.4, e.r * 0.25, e.r * 0.16], [e.r * 0.35, -e.r * 0.3, e.r * 0.12], [e.r * 0.1, e.r * 0.45, e.r * 0.1]]) {
        c.beginPath();
        c.arc(cx, cy, cr, 0, TAU);
        c.fill();
      }
    }
    // VENE di minerale (le linee di frattura): shadowBlur solo qui, nel bake.
    c.save();
    c.strokeStyle = veinCol;
    c.shadowColor = veinCol;
    c.shadowBlur = 6;
    c.lineWidth = 2;
    c.lineCap = "round";
    if (lod >= 1) {
      c.beginPath();
      c.moveTo(-e.r * 0.7, -e.r * 0.15);
      c.lineTo(-e.r * 0.2, e.r * 0.1);
      c.lineTo(e.r * 0.15, -e.r * 0.2);
      c.lineTo(e.r * 0.65, e.r * 0.05);
      c.stroke();
    }
    if (lod === 2) {
      c.beginPath();
      c.moveTo(-e.r * 0.1, -e.r * 0.75);
      c.lineTo(e.r * 0.1, -e.r * 0.25);
      c.lineTo(-e.r * 0.15, e.r * 0.3);
      c.lineTo(e.r * 0.05, e.r * 0.7);
      c.stroke();
    }
    if (lod === 0) {
      c.fillStyle = veinCol;
      c.shadowBlur = 5;
      c.beginPath();
      c.arc(0, 0, e.r * 0.22, 0, TAU);
      c.fill();
    }
    c.restore();
  });

  // Glint del minerale pulsante (vivo, senza blur).
  if (e.hitFlash <= 0 && lod >= 1) {
    ctx.strokeStyle = withAlpha("#fff2c0", 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(e.t * 4)));
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-e.r * 0.2, e.r * 0.1);
    ctx.lineTo(e.r * 0.15, -e.r * 0.2);
    ctx.stroke();
  }
  ctx.restore();
}

export const W2 = {
  straight: bidone7,
  zigzag: sfarfaglio,
  tank: mastodonte,
  kamikaze: ariete,
  asteroid: macigno,
};
