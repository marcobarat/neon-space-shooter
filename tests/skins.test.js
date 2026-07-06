// Test del sistema di shape kit per mondo (logica pura, nessun canvas).
import { test } from "node:test";
import assert from "node:assert/strict";
import { SKINS, skinFor, hardLerp } from "../js/skins.js";
import { WORLDS } from "../js/worlds.js";
import { seeded } from "../js/utils.js";

test("c'è esattamente un kit per ogni mondo", () => {
  assert.equal(SKINS.length, WORLDS.length);
});

test("ogni kit espone tutti gli hook richiesti", () => {
  for (const kit of SKINS) {
    assert.equal(typeof kit.id, "string");
    assert.ok(kit.hard >= 0 && kit.hard <= 1, `${kit.id}: hard fuori range`);
    assert.ok(kit.wobble > 0, `${kit.id}: wobble non positivo`);
    assert.equal(typeof kit.limb, "function", `${kit.id}: limb mancante`);
    assert.equal(typeof kit.edge, "function", `${kit.id}: edge mancante`);
    assert.equal(typeof kit.pattern, "function", `${kit.id}: pattern mancante`);
    assert.equal(typeof kit.accent, "function", `${kit.id}: accent mancante`);
    assert.equal(typeof kit.eyeStyle, "string", `${kit.id}: eyeStyle mancante`);
  }
});

test("gli id dei kit sono unici", () => {
  const ids = SKINS.map((k) => k.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("skinFor mappa l'indice del mondo (con wrap) e tollera entità nude", () => {
  assert.equal(skinFor({ skin: 0 }).id, "bio");
  assert.equal(skinFor({ skin: 2 }).id, "crystal");
  assert.equal(skinFor({ skin: 7 }).id, "crystal"); // wrap 7 % 5
  assert.equal(skinFor({}).id, "bio");
  assert.equal(skinFor(null).id, "bio");
});

test("hardLerp interpola tra curva e retta", () => {
  assert.equal(hardLerp(10, 20, 0), 10);
  assert.equal(hardLerp(10, 20, 1), 20);
  assert.equal(hardLerp(10, 20, 0.5), 15);
});

test("seeded è deterministico: stessa stringa → stessa sequenza", () => {
  const a = seeded("2026-07-06");
  const b = seeded("2026-07-06");
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
  const c = seeded("2026-07-07");
  const d = seeded("2026-07-06");
  let same = true;
  for (let i = 0; i < 10; i++) if (c() !== d()) same = false;
  assert.equal(same, false, "seed diversi non devono produrre la stessa sequenza");
  // i valori restano in [0,1)
  const r = seeded("x");
  for (let i = 0; i < 100; i++) { const v = r(); assert.ok(v >= 0 && v < 1); }
});
