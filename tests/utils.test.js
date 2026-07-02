// Test unitari sulla logica pura (nessun DOM necessario).
// Eseguibili con: npm test  (usa il runner integrato di Node).
import { test } from "node:test";
import assert from "node:assert/strict";
import { clamp, rand, randInt, circleHit, choose } from "../js/utils.js";

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
