// Flex Card condivisibile al Game Over.
// Disegna UNA VOLTA (alla condivisione) una "card" neon su un canvas OFFSCREEN
// riusando palette e font del gioco. Nessun asset esterno.
// La condivisione usa navigator.share({ files }) su mobile (foglio nativo
// iOS/Android) con fallback al download del PNG su desktop.
import { PALETTE, FONT, FONT_MONO } from "./palette.js";
import { STYLE_RANKS, TAU } from "./utils.js";

const CARD_W = 540;
const CARD_H = 760;

// Costruisce e disegna la card su un canvas offscreen. Ritorna il canvas.
// data: { score, level, bestCombo, rankIndex, url }
export function renderShareCard(data = {}) {
  const score = data.score || 0;
  const level = data.level || 1;
  const bestCombo = data.bestCombo || 0;
  const rankIndex = Math.max(0, Math.min(STYLE_RANKS.length - 1, data.rankIndex || 0));
  const url = data.url || "";
  const rank = STYLE_RANKS[rankIndex];

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");

  // Sfondo: gradiente + alone neon.
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, PALETTE.bgTop);
  bg.addColorStop(1, PALETTE.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const halo = ctx.createRadialGradient(CARD_W / 2, CARD_H * 0.32, 0, CARD_W / 2, CARD_H * 0.32, CARD_W * 0.8);
  halo.addColorStop(0, "rgba(0,229,255,0.16)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Cornice neon.
  ctx.strokeStyle = PALETTE.player;
  ctx.shadowColor = PALETTE.player;
  ctx.shadowBlur = 24;
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, CARD_W - 36, CARD_H - 36);
  ctx.shadowBlur = 0;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Titolo.
  ctx.fillStyle = PALETTE.player;
  ctx.shadowColor = PALETTE.player;
  ctx.shadowBlur = 22;
  ctx.font = `bold 46px ${FONT}`;
  ctx.fillText("NEON", CARD_W / 2, 92);
  ctx.fillStyle = PALETTE.life;
  ctx.shadowColor = PALETTE.life;
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText("SPACE SHOOTER", CARD_W / 2, 134);
  ctx.shadowBlur = 0;

  // Etichetta punteggio.
  ctx.fillStyle = PALETTE.uiDim;
  ctx.font = `16px ${FONT_MONO}`;
  ctx.fillText("PUNTEGGIO", CARD_W / 2, 214);

  // Punteggio grande.
  ctx.fillStyle = PALETTE.ui;
  ctx.shadowColor = PALETTE.combo;
  ctx.shadowBlur = 18;
  ctx.font = `bold 92px ${FONT_MONO}`;
  ctx.fillText(String(score), CARD_W / 2, 278);
  ctx.shadowBlur = 0;

  // Riga statistiche: mondo + miglior combo.
  ctx.font = `20px ${FONT_MONO}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText("MONDO", CARD_W * 0.30, 372);
  ctx.fillText("COMBO", CARD_W * 0.70, 372);
  ctx.fillStyle = PALETTE.ui;
  ctx.font = `bold 34px ${FONT_MONO}`;
  ctx.fillText(String(level), CARD_W * 0.30, 404);
  ctx.fillStyle = PALETTE.combo;
  ctx.fillText(`x${bestCombo}`, CARD_W * 0.70, 404);

  // Style rank finale: cerchio neon col grado.
  const cy = 520;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.font = `16px ${FONT_MONO}`;
  ctx.fillText("STYLE RANK", CARD_W / 2, 466);
  ctx.beginPath();
  ctx.arc(CARD_W / 2, cy, 56, 0, TAU);
  ctx.strokeStyle = rank.color;
  ctx.shadowColor = rank.color;
  ctx.shadowBlur = 26;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = rank.color;
  ctx.font = `bold ${rank.label.length > 1 ? 44 : 60}px ${FONT_MONO}`;
  ctx.fillText(rank.label, CARD_W / 2, cy + 4);
  ctx.shadowBlur = 0;

  // Invito a sfidare.
  ctx.fillStyle = PALETTE.ui;
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText("SFIDAMI!", CARD_W / 2, 636);
  if (url) {
    ctx.fillStyle = PALETTE.bullet;
    ctx.font = `16px ${FONT_MONO}`;
    ctx.fillText(url, CARD_W / 2, 668);
  }
  ctx.fillStyle = PALETTE.uiDim;
  ctx.font = `13px ${FONT}`;
  ctx.fillText("battimi al Neon Space Shooter", CARD_W / 2, 700);

  return canvas;
}

// Converte un dataURL in Blob in modo SINCRONO: così tra il gesto utente e
// navigator.share non ci sono await (mantiene la "user activation" su iOS).
function dataURLtoBlob(dataurl) {
  const [head, b64] = dataurl.split(",");
  const mime = (head.match(/:(.*?);/) || [])[1] || "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Condivide la card. Su mobile con Web Share (files) apre il foglio nativo;
// altrimenti scarica il PNG. Ritorna una stringa col metodo usato.
// Chiamare DENTRO al gesto utente (evento touch/click/keydown).
export function shareCard(canvas, meta = {}) {
  const filename = meta.filename || "neon-space-shooter.png";
  const blob = dataURLtoBlob(canvas.toDataURL("image/png"));
  const file = new File([blob], filename, { type: "image/png" });
  const shareData = { files: [file], title: "Neon Space Shooter", text: meta.text || "" };

  const canWebShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (typeof navigator.canShare !== "function" || navigator.canShare(shareData));

  if (canWebShare) {
    // navigator.share è sincrono rispetto al gesto; gli errori (incluso
    // l'annullamento dell'utente) non devono ricadere nel download.
    Promise.resolve(navigator.share(shareData)).catch(() => {});
    return "share";
  }

  // Fallback desktop / share non disponibile: download del PNG.
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  return "download";
}
