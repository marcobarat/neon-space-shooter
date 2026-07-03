// Test sulla logica pura dell'update "Epico" (v0.3.0): super, boss, nemici.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Player } from "../js/player.js";
import { Enemy } from "../js/enemies.js";
import { createBoss } from "../js/bosses.js";
import { SUPER_TYPES, SUPER_INFO, TIMESLOW_FACTOR } from "../js/supers.js";
import { WORLDS } from "../js/worlds.js";

test("super: la carica coi kill arma una super a pieno", () => {
  const p = new Player(540, 960);
  assert.equal(p.superReady, false);
  p.addCharge(0.5);
  assert.equal(p.superReady, false);
  p.addCharge(0.6); // supera 1
  assert.equal(p.superReady, true);
  assert.ok(SUPER_TYPES.includes(p.superType));
});

test("super: un nuovo pickup SOVRASCRIVE quello non usato", () => {
  const p = new Player(540, 960);
  p.armSuper("laser");
  assert.equal(p.superType, "laser");
  p.armSuper("nova"); // sovrascrive
  assert.equal(p.superType, "nova");
  assert.equal(p.superReady, true);
});

test("super: consumeSuper azzera slot e carica", () => {
  const p = new Player(540, 960);
  p.armSuper("drones");
  p.superCharge = 1;
  p.consumeSuper();
  assert.equal(p.superReady, false);
  assert.equal(p.superType, null);
  assert.equal(p.superCharge, 0);
});

test("createBoss: archetipo giusto per ogni bossType dei mondi", () => {
  const names = {
    kraken: "KRAKEN", serpent: "SERPENTE", fortress: "FORTEZZA",
    hive: "REGINA ALVEARE", laser: "NUCLEO LASER",
  };
  for (const w of WORLDS) {
    const b = createBoss(w.bossType, 540, 1, w.boss, 1);
    assert.equal(b.name, names[w.bossType]);
    assert.equal(b.isBoss, true);
    assert.ok(b.maxHp > 0);
  }
  assert.equal(createBoss("sconosciuto", 540, 1, "#f00", 1).name, "KRAKEN");
});

test("nemici: statistiche per tipo (tank robusto, splitling piccolo)", () => {
  const tank = new Enemy("tank", 100, 540);
  assert.equal(tank.hp, 7);
  assert.ok(tank.r > 15);
  const spl = new Enemy("splitling", 100, 540);
  assert.equal(spl.r, 9);
  assert.equal(spl.hp, 1);
});

test("supers: 5 tipi definiti e fattore timeslow valido", () => {
  assert.equal(SUPER_TYPES.length, 5);
  for (const t of SUPER_TYPES) assert.ok(SUPER_INFO[t].duration > 0);
  assert.ok(TIMESLOW_FACTOR > 0 && TIMESLOW_FACTOR < 1);
});
