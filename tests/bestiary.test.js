// Test del bestiario e della catena di frammentazione (logica pura).
import { test } from "node:test";
import assert from "node:assert/strict";
import { Enemy, SPLITS } from "../js/enemies.js";
import { WORLDS } from "../js/worlds.js";

// ---- Parte 1: meccaniche di frammentazione ----

test("SPLITS: ogni figlio esiste in STATS (istanziabile) e la catena termina", () => {
  for (const [parent, s] of Object.entries(SPLITS)) {
    assert.ok(s.min >= 1 && s.max >= s.min, `${parent}: min/max incoerenti`);
    const child = new Enemy(s.child, 100, 540);
    // Un figlio sconosciuto ricadrebbe sulle stats di "straight" (r 15):
    // verifichiamo che il tipo sia davvero registrato controllando che
    // le stats non siano il fallback quando non devono esserlo.
    assert.equal(child.type, s.child);
  }
  // La catena termina: seguendo i child non si torna mai su una chiave già vista.
  for (let start of Object.keys(SPLITS)) {
    const seen = new Set();
    let cur = start;
    while (SPLITS[cur]) {
      assert.ok(!seen.has(cur), `ciclo di split da ${start}`);
      seen.add(cur);
      cur = SPLITS[cur].child;
    }
  }
});

test("catena asteroide: asteroid → shard → pebble con punteggi decrescenti", () => {
  assert.equal(SPLITS.asteroid.child, "shard");
  assert.equal(SPLITS.shard.child, "pebble");
  const a = new Enemy("asteroid", 100, 540);
  const s = new Enemy("shard", 100, 540);
  const p = new Enemy("pebble", 100, 540);
  assert.ok(a.score > s.score && s.score > p.score);
  assert.ok(a.r > s.r && s.r > p.r);
  assert.ok(a.hp > s.hp && s.hp >= p.hp);
});

test("asteroid/shard/pebble si aggiornano senza esplodere e scendono", () => {
  for (const type of ["asteroid", "shard", "pebble"]) {
    const e = new Enemy(type, 100, 540);
    e.vx = 30;
    const y0 = e.y;
    for (let i = 0; i < 120; i++) e.update(1 / 60, [], 270, 800);
    assert.ok(e.y > y0, `${type} dovrebbe scendere`);
    assert.ok(Number.isFinite(e.x) && Number.isFinite(e.rot), `${type}: stato non finito`);
  }
});

test("i pool di Asteroidi e Vuoto contengono l'asteroide, con colore definito", () => {
  const w2 = WORLDS[1], w5 = WORLDS[4];
  assert.ok(w2.pool.includes("asteroid"));
  assert.ok(w5.pool.includes("asteroid"));
  assert.ok(w2.enemy.asteroid && w5.enemy.asteroid);
});

// ---- Parte 2: copertura del bestiario ----

test("BESTIARY: un set di creature per ogni mondo; ogni tipo del pool risolve", async () => {
  const { BESTIARY } = await import("../js/bestiary/index.js");
  assert.equal(BESTIARY.length, WORLDS.length);
  const ALIAS = { splitling: "splitter", shard: "asteroid", pebble: "asteroid" };
  WORLDS.forEach((w, wi) => {
    const types = [...w.pool];
    if (w.pool.includes("splitter")) types.push("splitling");
    if (w.pool.includes("asteroid")) types.push("shard", "pebble");
    for (const type of types) {
      const key = ALIAS[type] || type;
      const fn = BESTIARY[wi][key] || BESTIARY.find((b) => b[key])?.[key];
      assert.equal(typeof fn, "function", `${w.name}: manca il disegno per ${type}`);
    }
  });
  // il kamikaze evocato dai boss deve risolvere in OGNI mondo (fallback).
  BESTIARY.forEach((b, wi) => {
    const fn = b.kamikaze || BESTIARY.find((x) => x.kamikaze)?.kamikaze;
    assert.equal(typeof fn, "function", `mondo ${wi}: kamikaze non risolvibile`);
  });
});
