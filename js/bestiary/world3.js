// Mondo 3 — GHIACCIO COSMICO · costrutti cristallini: niente facce, geometrie
// dure nero-blu con spigoli e cuori cyan, fili speculari bianchi.
import { TAU } from "../utils.js";
import { withAlpha, shade } from "../palette.js";
import { body, spriteKey, glyphEye, sniperTelegraph } from "./parts.js";

const ICE_DARK = "#0c1626";   // corpo cristallo (faccia in ombra)
const ICE_LIT = "#16263e";    // faccia illuminata
const SPEC = "rgba(255,255,255,0.85)"; // filo speculare

// 10. ZIGZAG — "Vespa di Brina": dardo sfaccettato con 4 ali-lama a scatto.
function vespaDiBrina(ctx, e) {
  const acc = e.color;
  // Le lame scattano tra 2 pose (aperte/raccolte): snap, non fluido.
  const open = Math.sin(e.t * 12) > 0;
  ctx.save();
  ctx.translate(e.x, e.y);

  // Ali-lama vive (2 coppie di triangoli).
  if (e.hitFlash <= 0) {
    for (const s of [-1, 1]) {
      for (const [wy, len, tilt] of [[-4, 15, -0.5], [3, 12, 0.35]]) {
        const ext = open ? 1 : 0.55;
        const tipX = s * len * ext, tipY = wy + tilt * 10 * (open ? 1 : 0.4);
        ctx.fillStyle = ICE_DARK;
        ctx.beginPath();
        ctx.moveTo(s * 3, wy - 2.4);
        ctx.lineTo(s * 3 + tipX, tipY);
        ctx.lineTo(s * 3, wy + 2.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = withAlpha(acc, 0.9);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // filo speculare sul bordo d'attacco
        ctx.strokeStyle = SPEC;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(s * 3, wy - 2.4);
        ctx.lineTo(s * 3 + tipX, tipY);
        ctx.stroke();
      }
    }
    // Scintillio al cambio di posa.
    if (Math.abs(Math.sin(e.t * 12)) < 0.18) {
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 14, -6);
        ctx.lineTo(s * 17, -8);
        ctx.stroke();
      }
    }
  }

  body(ctx, e, spriteKey(e), 20, (c, flash) => {
    // Corpo a rombo affusolato con 2 facce (volume senza gradienti).
    const hullL = () => {
      c.beginPath();
      c.moveTo(0, -13);
      c.lineTo(-5.5, 0);
      c.lineTo(0, 15);
      c.lineTo(0, -13);
      c.closePath();
    };
    const hullR = () => {
      c.beginPath();
      c.moveTo(0, -13);
      c.lineTo(5.5, 0);
      c.lineTo(0, 15);
      c.lineTo(0, -13);
      c.closePath();
    };
    if (flash) {
      c.fillStyle = "#ffffff";
      hullL(); c.fill();
      hullR(); c.fill();
      return;
    }
    c.fillStyle = ICE_DARK;
    hullL();
    c.fill();
    c.fillStyle = ICE_LIT;
    hullR();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -13);
    c.lineTo(-5.5, 0);
    c.lineTo(0, 15);
    c.lineTo(5.5, 0);
    c.closePath();
    c.stroke();
    // Spigolo centrale speculare.
    c.strokeStyle = SPEC;
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(0, -13);
    c.lineTo(0, 15);
    c.stroke();
  });

  if (e.hitFlash <= 0) glyphEye(ctx, 0, -3, 3.2, acc);
  ctx.restore();
}

// 11. SHOOTER — "Prisma": obelisco con 3 schegge orbitanti che si ALLINEANO
// sotto l'apice prima dello sparo (telegrafo geometrico).
function prisma(ctx, e) {
  const acc = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);

  body(ctx, e, spriteKey(e), 22, (c, flash) => {
    const obelisk = () => {
      c.beginPath();
      c.moveTo(0, -16);
      c.lineTo(7, -9);
      c.lineTo(7, 9);
      c.lineTo(0, 16);
      c.lineTo(-7, 9);
      c.lineTo(-7, -9);
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; obelisk(); c.fill(); return; }
    c.fillStyle = ICE_DARK;
    obelisk();
    c.fill();
    // Mezza faccia illuminata.
    c.fillStyle = ICE_LIT;
    c.beginPath();
    c.moveTo(0, -16);
    c.lineTo(7, -9);
    c.lineTo(7, 9);
    c.lineTo(0, 16);
    c.closePath();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.5;
    obelisk();
    c.stroke();
    // Spigolo speculare.
    c.strokeStyle = SPEC;
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(0, -16);
    c.lineTo(0, 16);
    c.stroke();
  });

  if (e.hitFlash <= 0) {
    // Carica: 0 → 1 nell'ultimo secondo prima dello sparo.
    const charge = Math.max(0, Math.min(1, 1 - (e.fireTimer ?? 1)));
    // Fessura-core: si allarga e schiarisce caricando.
    ctx.fillStyle = withAlpha(shade(acc, 0.4), 0.5 + 0.5 * charge);
    ctx.fillRect(-(0.8 + charge * 1.4), -8, (0.8 + charge * 1.4) * 2, 16);
    // 3 schegge orbitanti → si allineano sotto l'apice quando carica.
    for (let i = 0; i < 3; i++) {
      const a = e.t * 1.4 + (i / 3) * TAU;
      const ox = Math.cos(a) * 20, oy = Math.sin(a) * 20;
      const tx = (i - 1) * 6, ty = 21; // posa allineata sotto l'apice
      const px = ox + (tx - ox) * charge;
      const py = oy + (ty - oy) * charge;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(charge > 0.5 ? Math.PI / 2 : a);
      ctx.fillStyle = ICE_LIT;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(2.4, 0);
      ctx.lineTo(0, 4);
      ctx.lineTo(-2.4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = withAlpha(acc, 0.5 + 0.5 * charge);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

// 12. SNIPER — "Ago del Gelo": base ancorata + lunga canna cristallina.
function agoDelGelo(ctx, e) {
  const acc = e.color;
  sniperTelegraph(ctx, e); // raggio di mira (prima del corpo)
  ctx.save();
  ctx.translate(e.x, e.y);

  body(ctx, e, spriteKey(e), 22, (c, flash) => {
    const base = () => {
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + Math.PI / 6;
        const px = Math.cos(a) * 11, py = Math.sin(a) * 8;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; base(); c.fill(); return; }
    // Zampe-punta di ancoraggio.
    c.strokeStyle = ICE_LIT;
    c.lineWidth = 2.4;
    for (const s of [-1, 0.0001, 1]) {
      c.beginPath();
      c.moveTo(s * 7, 5);
      c.lineTo(s * 11, 13);
      c.stroke();
    }
    // Base esagonale bassa a 2 facce.
    c.fillStyle = ICE_DARK;
    base();
    c.fill();
    c.fillStyle = withAlpha(ICE_LIT, 0.9);
    c.beginPath();
    c.moveTo(0, -8);
    c.lineTo(9.5, -4);
    c.lineTo(9.5, 4);
    c.lineTo(0, 8);
    c.closePath();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.5;
    base();
    c.stroke();
    // Anello di brina.
    c.strokeStyle = "rgba(230,245,255,0.35)";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(0, 2, 13, 6, 0, 0, TAU);
    c.stroke();
  });

  if (e.hitFlash <= 0) {
    // CANNA cristallina che punta la mira (viva).
    const dir = e.aiming > 0 ? e.aimDir : Math.PI / 2;
    const len = e.r * 1.7;
    ctx.save();
    ctx.rotate(dir);
    ctx.fillStyle = ICE_DARK;
    ctx.beginPath();
    ctx.moveTo(4, -2.6);
    ctx.lineTo(len, 0);
    ctx.lineTo(4, 2.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = withAlpha(acc, 0.9);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.strokeStyle = SPEC;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(4, -2.6);
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.restore();
    // Glifo al pivot: si sbianca durante la mira.
    glyphEye(ctx, 0, 0, 3.4, e.aiming > 0 ? "#ffffff" : acc);
  }
  ctx.restore();
}

// 13. SPLITTER — "Geode": sfera pre-crepata in due metà che respirano;
// lo splitling è una mezza geode con i cristalli esposti.
function geode(ctx, e) {
  const acc = e.color;
  const little = e.type === "splitling";
  const rr = e.r;
  ctx.save();
  ctx.translate(e.x, e.y);

  // Mezza geode (path parametrico, side = -1 sinistra / 1 destra).
  const half = (c, side, flash) => {
    const p = () => {
      c.beginPath();
      c.moveTo(0, -rr);
      for (let i = 1; i <= 4; i++) {
        const a = -Math.PI / 2 + side * (i / 4) * Math.PI;
        const wob = 1 + ((i * 37) % 3) * 0.05;
        c.lineTo(Math.cos(a) * rr * wob, Math.sin(a) * rr * wob);
      }
      c.closePath();
    };
    if (flash) { c.fillStyle = "#ffffff"; p(); c.fill(); return; }
    c.fillStyle = side < 0 ? ICE_DARK : ICE_LIT;
    p();
    c.fill();
    c.strokeStyle = acc;
    c.lineWidth = 1.4;
    p();
    c.stroke();
    // Cristalli interni lungo il taglio.
    c.fillStyle = shade(acc, 0.25);
    for (const [cy, ch] of [[-rr * 0.5, rr * 0.3], [0, rr * 0.42], [rr * 0.5, rr * 0.28]]) {
      c.beginPath();
      c.moveTo(0, cy - ch / 2);
      c.lineTo(side * ch * 0.45, cy);
      c.lineTo(0, cy + ch / 2);
      c.closePath();
      c.fill();
    }
  };

  if (little) {
    // Splitling: una sola metà che ruota lenta, taglio esposto.
    ctx.rotate(Math.sin(e.t * 1.2) * 0.5);
    body(ctx, e, spriteKey(e, "|half"), rr + 6, (c, flash) => half(c, 1, flash));
    if (e.hitFlash <= 0) {
      ctx.fillStyle = withAlpha("#ffffff", 0.5 + 0.4 * Math.sin(e.t * 6));
      ctx.beginPath();
      ctx.arc(1.5, 0, 1.6, 0, TAU);
      ctx.fill();
    }
  } else {
    // Le due metà respirano separandosi: si LEGGE che si dividerà.
    const gap = e.hitFlash > 0 ? 1.5 : 1.5 + Math.sin(e.t * 4) * 1.5;
    // Cucitura luminosa in mezzo (viva).
    if (e.hitFlash <= 0) {
      ctx.strokeStyle = withAlpha(acc, 0.85);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -rr * 0.85);
      ctx.lineTo(0, rr * 0.85);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      for (const cy of [-rr * 0.4, 0, rr * 0.4]) {
        ctx.beginPath();
        ctx.arc(0, cy, 1.2, 0, TAU);
        ctx.fill();
      }
    }
    ctx.save();
    ctx.translate(-gap / 2, 0);
    body(ctx, e, spriteKey(e, "|L"), rr + 6, (c, flash) => half(c, -1, flash));
    ctx.restore();
    ctx.save();
    ctx.translate(gap / 2, 0);
    body(ctx, e, spriteKey(e, "|R"), rr + 6, (c, flash) => half(c, 1, flash));
    ctx.restore();
  }
  ctx.restore();
}

export const W3 = {
  zigzag: vespaDiBrina,
  shooter: prisma,
  sniper: agoDelGelo,
  splitter: geode,
};
