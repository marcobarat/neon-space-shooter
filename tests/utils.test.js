// Test unitari sulla logica pura (nessun DOM necessario).
// Eseguibili con: npm test  (usa il runner integrato di Node).
import { test } from "node:test";
import assert from "node:assert/strict";
import { clamp, rand, randInt, circleHit, choose, styleRank, STYLE_RANKS } from "../js/utils.js";

test("clamp mantiene il valore nei limiti", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(42, 0, 10), 10);
});

test("rand resta nell'intervallo [min, max)", () => {
  for (let i = 0; i < 1000; i++) {
    const v = rand(2, 5);
    assert.ok(v >= 2 && v < 5, `valore fuori range: ${v}`);
  }
});

test("randInt resta nell'intervallo intero [min, max]", () => {
  const seen = new Set();
  for (let i = 0; i < 1000; i++) {
    const v = randInt(1, 3);
    assert.ok(Number.isInteger(v));
    assert.ok(v >= 1 && v <= 3, `valore fuori range: ${v}`);
    seen.add(v);
  }
  assert.deepEqual([...seen].sort(), [1, 2, 3]);
});

test("choose ritorna sempre un elemento dell'array", () => {
  const arr = ["a", "b", "c"];
  for (let i = 0; i < 100; i++) assert.ok(arr.includes(choose(arr)));
});

test("circleHit rileva la sovrapposizione tra cerchi", () => {
  const a = { x: 0, y: 0, r: 10 };
  const b = { x: 5, y: 0, r: 10 }; // distanza 5 < 20 => collisione
  const c = { x: 100, y: 0, r: 10 }; // distanza 100 > 20 => niente
  assert.equal(circleHit(a, b), true);
  assert.equal(circleHit(a, c), false);
});

test("circleHit gestisce il contatto esatto sul bordo", () => {
  const a = { x: 0, y: 0, r: 10 };
  const b = { x: 20, y: 0, r: 10 }; // distanza 20 == somma raggi => tocca
  assert.equal(circleHit(a, b), true);
});

test("styleRank: parte da D (0) senza combo né tempo", () => {
  assert.equal(styleRank(0, 0), 0);
  assert.equal(styleRank(100, 0), 0); // appena colpito (0s): crolla a D anche con combo alta
  assert.equal(styleRank(0, 100), 0); // sopravvivi ma senza combo: resta D
});

test("styleRank: sale con combo alte E tempo senza danni", () => {
  assert.equal(styleRank(3, 1), 1);   // C
  assert.equal(styleRank(6, 3), 2);   // B
  assert.equal(styleRank(10, 6), 3);  // A
  assert.equal(styleRank(16, 9), 4);  // S
  assert.equal(styleRank(26, 13), 5); // SSS
});

test("styleRank: serve SIA la combo SIA il tempo (il tier più basso limita)", () => {
  // Combo altissima ma poco tempo dall'ultimo danno => resta basso.
  assert.equal(styleRank(26, 1), 1);
  // Tanto tempo ma combo bassa => limitato dalla combo.
  assert.equal(styleRank(3, 100), 1);
});

test("styleRank: monotòna e satura a SSS, robusta a input invalidi", () => {
  assert.equal(styleRank(1000, 1000), STYLE_RANKS.length - 1); // non supera SSS
  assert.equal(styleRank(-5, -5), 0); // negativi trattati come 0
  assert.equal(styleRank(undefined, undefined), 0);
  // Non decresce mai aumentando combo o tempo.
  let prev = 0;
  for (let c = 0; c <= 40; c += 2) {
    const r = styleRank(c, c);
    assert.ok(r >= prev, `rank non deve calare: combo=${c}`);
    prev = r;
  }
});

test("STYLE_RANKS: sei gradi etichettati D..SSS con colore", () => {
  assert.deepEqual(STYLE_RANKS.map((r) => r.label), ["D", "C", "B", "A", "S", "SSS"]);
  for (const r of STYLE_RANKS) assert.match(r.color, /^#/);
});

test("seeded è deterministico e resta in [0,1)", async () => {
  const { seeded } = await import("../js/utils.js");
  const a = seeded("stessa-stringa");
  const b = seeded("stessa-stringa");
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
  const c = seeded("altra-stringa");
  let same = true;
  const d = seeded("stessa-stringa");
  for (let i = 0; i < 10; i++) if (c() !== d()) same = false;
  assert.equal(same, false);
  const r = seeded("x");
  for (let i = 0; i < 100; i++) { const v = r(); assert.ok(v >= 0 && v < 1); }
});
