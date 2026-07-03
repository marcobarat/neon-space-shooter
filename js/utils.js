// Piccole utility condivise: random, clamp, collisioni.

export const rand = (min, max) => Math.random() * (max - min) + min;
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const TAU = Math.PI * 2;

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
