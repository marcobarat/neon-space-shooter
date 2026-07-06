// Daily Challenge: ogni giorno un seed condiviso da tutti (stile Wordle).
// Stessa data → stessa sequenza di ondate/nemici per chiunque, così il
// punteggio è confrontabile tra amici. Streak di giorni consecutivi giocati
// in localStorage. Nessun backend: il confronto viaggia con la Flex Card.
import { seeded } from "./utils.js";

const STORE_KEY = "nss_daily_v1";

// Chiave del giorno in ora LOCALE (YYYY-MM-DD): la sfida cambia a mezzanotte.
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
}

// PRNG del giorno: pilota SOLO le decisioni di spawn (composizione ondate,
// posizioni, varianti) — il resto del gioco resta vivo e reattivo.
export function dailyRng(key) {
  return seeded("nss-daily-" + key);
}

// Etichetta leggibile ("6/7") per HUD e card.
export function dailyLabel(key) {
  const [, m, g] = key.split("-");
  return `${Number(g)}/${Number(m)}`;
}

export function loadDaily(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage.getItem(STORE_KEY)) || { last: null, streak: 0, best: {} };
  } catch {
    return { last: null, streak: 0, best: {} };
  }
}

function isYesterday(prevKey, key) {
  if (!prevKey) return false;
  const prev = new Date(prevKey + "T12:00:00");
  prev.setDate(prev.getDate() + 1);
  return todayKey(prev) === key;
}

// Da chiamare quando una run daily INIZIA: aggiorna lo streak (conta i giorni
// GIOCATI consecutivi). Ritorna lo stato aggiornato.
export function beginDaily(key, storage = globalThis.localStorage) {
  const s = loadDaily(storage);
  if (s.last !== key) {
    s.streak = isYesterday(s.last, key) ? s.streak + 1 : 1;
    s.last = key;
    // tiene solo i best recenti (niente crescita infinita)
    const keys = Object.keys(s.best);
    if (keys.length > 30) for (const k of keys.slice(0, keys.length - 30)) delete s.best[k];
    try { storage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* best-effort */ }
  }
  return s;
}

// Da chiamare a fine run daily: registra il punteggio del giorno.
// Ritorna { best, isNewBest, streak }.
export function recordDailyResult(key, score, storage = globalThis.localStorage) {
  const s = loadDaily(storage);
  const prev = s.best[key] || 0;
  const isNewBest = score > prev;
  if (isNewBest) s.best[key] = score;
  try { storage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* best-effort */ }
  return { best: Math.max(prev, score), isNewBest, streak: s.streak };
}
