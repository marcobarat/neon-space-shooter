// Palette neon centrale: un'unica fonte di verità per i colori del gioco.
// Usare queste costanti invece di hex sparsi nei moduli.
export const PALETTE = {
  bgTop: "#140a30",
  bgBottom: "#03020a",
  nebulaA: "rgba(120, 40, 200, 0.20)",
  nebulaB: "rgba(0, 160, 220, 0.16)",
  nebulaC: "rgba(255, 60, 160, 0.14)",

  star: "#bcd4ff",
  starBright: "#e8f2ff",
  starWarm: "#ffe9c4",
  starCool: "#9fe6ff",

  player: "#19e6ff",
  playerCore: "#eafdff",
  playerDeep: "#0a6fb8",
  rim: "#dffbff",
  flame: "#ff5bd0",
  flameHot: "#ffe27a",
  bullet: "#7df9ff",
  bulletCore: "#f2feff",

  straight: "#ff5bd0",
  zigzag: "#ffd23f",
  shooter: "#8b5bff",
  boss: "#ff3860",
  bossEye: "#ffd23f",
  enemyBullet: "#ff7ac0",

  triple: "#7df9ff",
  shield: "#4dffa6",
  life: "#ff5bd0",

  ui: "#e6eeff",
  uiDim: "#8493bd",
  panel: "rgba(10, 14, 34, 0.55)",
  combo: "#ffd23f",
  hit: "#ffffff",
};

// Font a tema (monospace tecnico) usato nell'HUD e nelle scritte.
export const FONT = "'Segoe UI', system-ui, sans-serif";
export const FONT_MONO = "'Consolas', 'SF Mono', ui-monospace, monospace";

// --- Helper colore (procedurali, nessun asset) ---
// Schiarisce/scurisce un colore #rrggbb di una quantità amt in [-1, 1].
// Ritorna una stringa rgb(). Se il colore non è #rrggbb, lo ritorna invariato.
export function shade(hex, amt) {
  if (typeof hex !== "string" || hex[0] !== "#" || hex.length < 7) return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  const f = amt < 0 ? 1 + amt : 1;
  const t = amt < 0 ? 0 : 255 * amt;
  r = Math.round(r * f + t);
  g = Math.round(g * f + t);
  b = Math.round(b * f + t);
  return `rgb(${r},${g},${b})`;
}

// Converte #rrggbb (o passa attraverso) in rgba() con alpha dato.
export function withAlpha(hex, a) {
  if (typeof hex !== "string" || hex[0] !== "#" || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
