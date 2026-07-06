// Test della Daily Challenge (logica pura, storage finto).
import { test } from "node:test";
import assert from "node:assert/strict";
import { todayKey, dailyRng, dailyLabel, loadDaily, beginDaily, recordDailyResult } from "../js/daily.js";

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  };
}

test("todayKey formatta YYYY-MM-DD", () => {
  assert.equal(todayKey(new Date(2026, 6, 6)), "2026-07-06");
  assert.equal(todayKey(new Date(2026, 0, 3)), "2026-01-03");
});

test("dailyLabel è leggibile (g/m)", () => {
  assert.equal(dailyLabel("2026-07-06"), "6/7");
});

test("dailyRng: stesso giorno → stessa sequenza, giorni diversi → diversa", () => {
  const a = dailyRng("2026-07-06");
  const b = dailyRng("2026-07-06");
  for (let i = 0; i < 30; i++) assert.equal(a(), b());
  const c = dailyRng("2026-07-07");
  const d = dailyRng("2026-07-06");
  let same = true;
  for (let i = 0; i < 10; i++) if (c() !== d()) same = false;
  assert.equal(same, false);
});

test("streak: sale se giochi in giorni consecutivi, si azzera se salti", () => {
  const st = fakeStorage();
  assert.equal(beginDaily("2026-07-04", st).streak, 1);
  assert.equal(beginDaily("2026-07-05", st).streak, 2);
  // rigiocare lo stesso giorno non incrementa
  assert.equal(beginDaily("2026-07-05", st).streak, 2);
  // saltando un giorno lo streak riparte
  assert.equal(beginDaily("2026-07-07", st).streak, 1);
});

test("recordDailyResult tiene il best del giorno", () => {
  const st = fakeStorage();
  beginDaily("2026-07-06", st);
  let r = recordDailyResult("2026-07-06", 1000, st);
  assert.equal(r.best, 1000);
  assert.equal(r.isNewBest, true);
  r = recordDailyResult("2026-07-06", 700, st);
  assert.equal(r.best, 1000);
  assert.equal(r.isNewBest, false);
  r = recordDailyResult("2026-07-06", 1500, st);
  assert.equal(r.best, 1500);
  assert.equal(r.isNewBest, true);
  assert.equal(loadDaily(st).best["2026-07-06"], 1500);
});
