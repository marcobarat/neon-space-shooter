// Test sulla nuova logica pura di gameplay (v0.2.0): armi, combo, mondi, razzi.
import { test } from "node:test";
import assert from "node:assert/strict";
import { comboMultiplier } from "../js/utils.js";
import { shotPattern, MAX_WEAPON } from "../js/player.js";
import { WORLDS, worldForLevel } from "../js/worlds.js";
import { nearestEnemy } from "../js/rockets.js";

test("shotPattern: numero di proiettili per livello arma", () => {
  assert.equal(shotPattern(0).length, 1);
  assert.equal(shotPattern(1).length, 2);
  assert.equal(shotPattern(2).length, 3);
  assert.equal(shotPattern(3).length, 5);
  assert.equal(shotPattern(MAX_WEAPON).length, 5);
});

test("shotPattern: ogni proiettile ha una velocità verso l'alto (vy<0)", () => {
  for (let lv = 0; lv <= MAX_WEAPON; lv++) {
    for (const s of shotPattern(lv)) {
      assert.ok(s.vy < 0, `livello ${lv}: vy dovrebbe essere negativo`);
      assert.equal(typeof s.vx, "number");
    }
  }
});

test("comboMultiplier: soglie x1 → x1.5 → x2 → x3 → x5", () => {
  assert.equal(comboMultiplier(0), 1);
  assert.equal(comboMultiplier(4), 1);
  assert.equal(comboMultiplier(5), 1.5);
  assert.equal(comboMultiplier(10), 2);
  assert.equal(comboMultiplier(20), 3);
  assert.equal(comboMultiplier(30), 5);
  assert.equal(comboMultiplier(100), 5);
});

test("worldForLevel: cicla sui mondi disponibili", () => {
  const n = WORLDS.length;
  assert.equal(worldForLevel(1), WORLDS[0]);
  assert.equal(worldForLevel(2), WORLDS[1]);
  assert.equal(worldForLevel(n), WORLDS[n - 1]);
  assert.equal(worldForLevel(n + 1), WORLDS[0]); // riparte dal primo
  assert.equal(worldForLevel(2 * n + 2), WORLDS[1]);
});

test("nearestEnemy: trova il nemico più vicino, considera il boss, null se vuoto", () => {
  const enemies = [
    { x: 100, y: 100, dead: false },
    { x: 10, y: 10, dead: false },
    { x: 5, y: 5, dead: true }, // morto: ignorato
  ];
  const near = nearestEnemy(0, 0, enemies, null);
  assert.equal(near, enemies[1]); // (10,10) è il più vicino tra i vivi

  const boss = { x: 1, y: 1, dead: false };
  assert.equal(nearestEnemy(0, 0, enemies, boss), boss); // il boss è più vicino

  assert.equal(nearestEnemy(0, 0, [], null), null);
});
