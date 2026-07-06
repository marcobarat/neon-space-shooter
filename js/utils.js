// Piccole utility condivise: random, clamp, collisioni.

export const rand = (min, max) => Math.random() * (max - min) + min;
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const TAU = Math.PI * 2;

// PRNG deterministico seminato da una stringa (FNV-1a + mulberry32-like).
// Stessa stringa → stessa sequenza: usato per sfondi stabili per mondo e
// per la Daily Challenge (stesso seed del giorno per tutti).
export function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Collisione cerchio-cerchio: ogni entità espone x, y, r.
export function circleHit(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const rr = a.r + b.r;
  return dx * dx + dy * dy <= rr * rr;
}

// Moltiplicatore di punteggio in base alla combo (x1 → x1.5 → x2 → x3 → x5).
export function comboMultiplier(combo) {
  if (combo >= 30) return 5;
  if (combo >= 20) return 3;
  if (combo >= 10) return 2;
  if (combo >= 5) return 1.5;
  return 1;
}

// Scale-punch: dato un valore di "flash" residuo (>=0) che decade verso 0,
// ritorna il fattore di scala (1 = riposo, >1 = colpito). Puro/testabile:
// usato per far "sobbalzare" nemici e boss quando vengono colpiti.
export function punchScale(flash, amount = 3.2) {
  return 1 + Math.max(0, flash) * amount;
}

// ---------- STYLE RANK (D → SSS) ----------
// Metadati dei gradi di stile, dal più basso al più alto. index 0..5.
// I colori virano dal "freddo/neutro" (D) al "caldo/acceso" (SSS).
export const STYLE_RANKS = [
  { label: "D", color: "#8090b8" },
  { label: "C", color: "#7df9ff" },
  { label: "B", color: "#4dffa6" },
  { label: "A", color: "#ffd23f" },
  { label: "S", color: "#ff9a3f" },
  { label: "SSS", color: "#ff5bd0" },
];

// Soglie per salire di grado: servono SIA combo alta SIA tempo senza danni.
// Ogni tier richiede combo >= combo e secondi-senza-danni >= time.
const STYLE_TIERS = [
  { combo: 3, time: 1 },   // → C
  { combo: 6, time: 3 },   // → B
  { combo: 10, time: 6 },  // → A
  { combo: 16, time: 9 },  // → S
  { combo: 26, time: 13 }, // → SSS
];

// Funzione PURA: calcola l'indice del grado di stile (0=D … 5=SSS) da
// combo corrente e tempo trascorso dall'ultimo danno (secondi).
// Poiché il tempo-senza-danni si azzera quando vieni colpito, un colpo fa
// crollare il grado; combo alte + nessun danno lo fanno salire.
export function styleRank(combo, timeSinceDamage) {
  const c = Math.max(0, combo || 0);
  const safe = Math.max(0, timeSinceDamage || 0);
  let idx = 0;
  for (const t of STYLE_TIERS) {
    if (c >= t.combo && safe >= t.time) idx++;
    else break;
  }
  return idx;
}
