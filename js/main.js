// Game loop principale e macchina a stati (menu / gioco / pausa / game over).
import { rand, randInt, circleHit, clamp, comboMultiplier, styleRank, STYLE_RANKS, TAU, seeded } from "./utils.js";
import { initInput, input, consumeStart, consumeBomb, consumeSuper, consumePause, consumeShare, consumeDaily, onFirstInteraction, onShare, touchButtons } from "./input.js";
import { todayKey, dailyRng, dailyLabel, loadDaily, beginDaily, recordDailyResult } from "./daily.js";
import { renderShareCard, shareCard } from "./sharecard.js";
import { unlockAudio, sfx } from "./audio.js";
import { Player, MAX_WEAPON } from "./player.js";
import { Enemy } from "./enemies.js";
import { createBoss } from "./bosses.js";
import { PowerUp } from "./powerups.js";
import { ParticleSystem } from "./particles.js";
import { Rocket, nearestEnemy } from "./rockets.js";
import { worldForLevel, worldIndexForLevel } from "./worlds.js";
import { initScene, updateScene, drawScene, drawGrain } from "./scene.js";
import { clearSprites } from "./spritecache.js";
import { SUPER_INFO, TIMESLOW_FACTOR, drawSuperIcon, Drone } from "./supers.js";
import { PALETTE, FONT, FONT_MONO } from "./palette.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Dimensione responsive: su mobile riempie lo schermo (portrait); su desktop
// una colonna verticale centrata. Impostata PRIMA di leggere W/H.
(function sizeCanvas() {
  const vw = window.innerWidth, vh = window.innerHeight;
  let cssW, cssH;
  if (vw < 760) { cssW = vw; cssH = vh; }
  else { cssH = Math.min(vh * 0.94, 940); cssW = Math.round(cssH * 0.5625); }
  canvas.width = Math.round(cssW);
  canvas.height = Math.round(cssH);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
})();
// Al cambio di orientamento ricarico (ridimensiona tutto in modo pulito).
window.addEventListener("orientationchange", () => setTimeout(() => location.reload(), 350));

const W = canvas.width;
const H = canvas.height;

initInput(canvas);
onFirstInteraction(unlockAudio);

const HS_KEY = "neon_space_shooter_highscore";
const State = { MENU: "menu", PLAY: "play", PAUSE: "pause", GAMEOVER: "gameover" };
// URL pubblico (GitHub Pages) stampato sulla Flex Card come invito a sfidare.
const SHARE_URL = "marcobarat.github.io/neon-space-shooter";

// Stelle su 3 layer con parallasse + twinkle.
const stars = Array.from({ length: 160 }, () => {
  const z = rand(0.2, 1);
  const tint = Math.random();
  return {
    x: rand(0, W), y: rand(0, H), z,
    size: z < 0.5 ? 1 : z < 0.8 ? 1.7 : 2.6,
    tw: rand(0, TAU), twSpeed: rand(1.5, 4),
    // tinta: fredda / neutra / calda per varietà di campo stellare
    col: tint < 0.22 ? PALETTE.starCool : tint > 0.86 ? PALETTE.starWarm : null,
  };
});

// Nebulosa di sfondo su canvas offscreen; ricostruita al cambio di mondo.
const bgCanvas = document.createElement("canvas");
bgCanvas.width = W;
bgCanvas.height = H;
// PRNG deterministico (ora in utils.js): seminato dal nome del mondo →
// pianeta/polvere stabili ma diversi per mondo (tutto cotto una volta).

const NEBULA_POS = [
  { x: W * 0.24, y: H * 0.20, rx: W * 0.70, ry: W * 0.48, rot: -0.5 },
  { x: W * 0.86, y: H * 0.34, rx: W * 0.55, ry: W * 0.8, rot: 0.7 },
  { x: W * 0.50, y: H * 0.72, rx: W * 0.85, ry: W * 0.55, rot: 0.2 },
  { x: W * 0.10, y: H * 0.90, rx: W * 0.5, ry: W * 0.55, rot: -0.3 },
];
// Tile di dither ordinato (Bayer 8×8) ingrandito ×2: grana retrò da CRT,
// cotto una volta e stampato come pattern sul gradiente (zero costo per-frame).
let ditherPattern = null;
function getDitherPattern(c2d) {
  if (ditherPattern) return ditherPattern;
  const B = [
    [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
  ];
  const t = document.createElement("canvas");
  t.width = t.height = 16;
  const tc = t.getContext("2d");
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const v = B[y][x] / 64;
      // celle chiare dove la soglia è bassa, scure dove è alta → banding testurizzato
      if (v < 0.22) tc.fillStyle = "rgba(255,255,255,0.045)";
      else if (v > 0.8) tc.fillStyle = "rgba(0,0,0,0.06)";
      else continue;
      tc.fillRect(x * 2, y * 2, 2, 2);
    }
  }
  ditherPattern = c2d.createPattern(t, "repeat");
  return ditherPattern;
}

function buildBackground(theme) {
  const bg = bgCanvas.getContext("2d");
  const rnd = seeded(theme.name);
  // Fondo verticale duotone: cielo profondo in alto, banda intermedia satura,
  // quasi nero in basso — rampe più "grafiche", stile neo-retrò.
  const grad = bg.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.bgTop);
  grad.addColorStop(0.5, theme.bgMid || mix(theme.bgTop, theme.bgBottom, 0.6));
  grad.addColorStop(1, theme.bgBottom);
  bg.fillStyle = grad;
  bg.fillRect(0, 0, W, H);
  // Dither ordinato sopra la rampa: spezza il banding e dà grana retrò.
  bg.fillStyle = getDitherPattern(bg);
  bg.fillRect(0, 0, W, H);

  // Nebulose: blob ellittici sfumati, additivi (lighter) per glow ricco.
  bg.save();
  bg.globalCompositeOperation = "lighter";
  NEBULA_POS.forEach((pos, i) => {
    const c = theme.nebula[i % theme.nebula.length];
    bg.save();
    bg.translate(pos.x, pos.y);
    bg.rotate(pos.rot);
    bg.scale(1, pos.ry / pos.rx);
    const g = bg.createRadialGradient(0, 0, 0, 0, 0, pos.rx);
    g.addColorStop(0, c);
    g.addColorStop(0.5, fadeAlpha(c, 0.45));
    g.addColorStop(1, "rgba(0,0,0,0)");
    bg.fillStyle = g;
    bg.beginPath();
    bg.arc(0, 0, pos.rx, 0, TAU);
    bg.fill();
    bg.restore();
  });
  bg.restore();

  // Polvere stellare cotta: tanti puntini fiochi per densità di campo profondo.
  for (let i = 0; i < 220; i++) {
    const x = rnd() * W, y = rnd() * H, a = 0.05 + rnd() * 0.22;
    bg.fillStyle = `rgba(${200 + (rnd() * 55) | 0},${210 + (rnd() * 45) | 0},255,${a})`;
    bg.fillRect(x, y, 1, 1);
  }

  // Pianeta lontano: sfera con terminatore (lato illuminato/ombra) + rim light.
  const pr = W * (0.16 + rnd() * 0.12);
  const pxp = W * (0.12 + rnd() * 0.7);
  const pyp = H * (0.10 + rnd() * 0.22);
  const pc = theme.nebula[0];
  bg.save();
  // Alone atmosferico.
  const halo = bg.createRadialGradient(pxp, pyp, pr * 0.7, pxp, pyp, pr * 1.5);
  halo.addColorStop(0, fadeAlpha(pc, 0.35));
  halo.addColorStop(1, "rgba(0,0,0,0)");
  bg.fillStyle = halo;
  bg.beginPath(); bg.arc(pxp, pyp, pr * 1.5, 0, TAU); bg.fill();
  // Disco con luce da destra-alto.
  const disc = bg.createRadialGradient(pxp + pr * 0.4, pyp - pr * 0.4, pr * 0.1, pxp, pyp, pr);
  disc.addColorStop(0, fadeAlpha(pc, 0.9));
  disc.addColorStop(0.55, fadeAlpha(pc, 0.5));
  disc.addColorStop(1, "rgba(6,4,16,0.92)");
  bg.fillStyle = disc;
  bg.beginPath(); bg.arc(pxp, pyp, pr, 0, TAU); bg.fill();
  // Rim light sul bordo illuminato.
  bg.strokeStyle = fadeAlpha(theme.star, 0.5);
  bg.lineWidth = 1.4;
  bg.beginPath();
  bg.arc(pxp, pyp, pr - 0.7, -1.9, 0.5);
  bg.stroke();
  bg.restore();

  // Vignette: bordi più scuri per far risaltare l'azione al centro.
  const vg = bg.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.5)");
  bg.fillStyle = vg;
  bg.fillRect(0, 0, W, H);
}

// Mescola due colori (hex o rgb/rgba) in modo grezzo → rgb string.
function parseCol(c) {
  if (c[0] === "#") return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 1];
  const m = c.match(/[\d.]+/g).map(Number);
  return [m[0], m[1], m[2], m[3] === undefined ? 1 : m[3]];
}
function mix(a, b, t) {
  const A = parseCol(a), B = parseCol(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}
function fadeAlpha(c, mul) {
  const A = parseCol(c);
  return `rgba(${A[0]},${A[1]},${A[2]},${(A[3] * mul).toFixed(3)})`;
}

let bgTime = 0;
let game;

function newGame() {
  const theme = worldForLevel(1);
  return {
    state: State.MENU,
    player: new Player(W, H),
    enemies: [],
    playerBullets: [],
    enemyBullets: [],
    rockets: [],
    drones: [],
    powerups: [],
    particles: new ParticleSystem(),
    score: 0,
    wave: 0,
    level: 1,
    theme,
    waveCooldown: 1.2,
    boss: null,
    banner: null,
    activeSuper: null,
    bestCombo: 0,
    gameoverLock: 0,
    highScore: Number(localStorage.getItem(HS_KEY) || 0),
    flash: 0,
    combo: 0,
    comboTimer: 0,
    hitStop: 0,
    popups: [],
    styleRank: 0,
    bestRank: 0,
    noHitTime: 0,
    daily: null, // { key, rng, streak } quando la run è la Sfida del giorno
    dailyResult: null,
  };
}

function addPopup(x, y, text, color) {
  game.popups.push({ x, y, text, color, life: 0.9, vy: -46 });
}

game = newGame();
buildBackground(game.theme);
initScene(game.theme.scene, W, H, game.theme);

// ---- Flex Card / condivisione ----
const shareBtn = touchButtons.find((b) => b.id === "share");
const dailyBtn = touchButtons.find((b) => b.id === "daily");
let sharing = false;
function doShare() {
  // Solo al Game Over; evita doppioni se un'altra condivisione è in corso.
  if (game.state !== State.GAMEOVER || sharing) return;
  sharing = true;
  try {
    const card = renderShareCard({
      score: game.score,
      level: game.level,
      bestCombo: game.bestCombo,
      rankIndex: game.bestRank,
      url: SHARE_URL,
      daily: game.daily ? { label: dailyLabel(game.daily.key), streak: game.daily.streak } : null,
    });
    shareCard(card, {
      text: game.daily
        ? `Sfida del ${dailyLabel(game.daily.key)}: ${game.score} punti (streak 🔥${game.daily.streak}) a Neon Space Shooter. Stesso seed per tutti, battimi: https://${SHARE_URL}`
        : `Ho fatto ${game.score} punti (rank ${STYLE_RANKS[game.bestRank].label}) a Neon Space Shooter. Sfidami: https://${SHARE_URL}`,
    });
  } catch (e) { /* condivisione best-effort: non deve mai rompere il gioco */ }
  // Sblocca al frame dopo così un secondo tap/gesto può riprovare.
  setTimeout(() => { sharing = false; }, 400);
}
// Callback SINCRONO (dentro al gesto) per preservare la user-activation di share().
onShare(doShare);

function startPlaying() {
  const hs = game.highScore;
  game = newGame();
  game.highScore = hs;
  game.state = State.PLAY;
  buildBackground(game.theme);
  initScene(game.theme.scene, W, H, game.theme);
  clearSprites();
  window.__galaxySetWorld?.(worldIndexForLevel(game.level));
}

// Sfida del giorno: stessa sequenza di ondate per tutti (seed dalla data).
function startDaily() {
  startPlaying();
  const key = todayKey();
  const st = beginDaily(key);
  game.daily = { key, rng: dailyRng(key), streak: st.streak };
  game.banner = { text: "SFIDA DEL GIORNO", sub: `${dailyLabel(key)} · streak 🔥${st.streak}`, life: 3.0, color: PALETTE.combo };
}

// Random di spawn: nella daily arriva dal PRNG del giorno (deterministico),
// altrimenti da Math.random. SOLO per le decisioni di spawn.
function spawnRnd() {
  return game.daily ? game.daily.rng() : Math.random();
}
const spawnRange = (min, max) => spawnRnd() * (max - min) + min;

function difficulty() {
  return Math.min(2.6, 1 + (game.wave - 1) * 0.05 + (game.level - 1) * 0.15);
}

const bossApi = {
  spawnMinion(x) {
    const diff = difficulty();
    game.enemies.push(new Enemy("kamikaze", clamp(x, 20, W - 20), W, 0, game.theme.enemy.kamikaze, diff, worldIndexForLevel(game.level)));
  },
};

function spawnWave() {
  game.wave += 1;
  const diff = difficulty();
  if (game.wave % 5 === 0) {
    game.boss = createBoss(game.theme.bossType, W, game.level, game.theme.boss, diff, worldIndexForLevel(game.level));
    sfx.boss();
    return;
  }
  const basics = ["straight", "zigzag", "shooter"];
  let types = game.theme.pool.slice();
  if (game.wave < 2) {
    const b = types.filter((t) => basics.includes(t));
    if (b.length) types = b;
  }
  const count = Math.min(4 + game.wave, 16);
  const speedMul = 1 + (diff - 1) * 0.5;
  for (let i = 0; i < count; i++) {
    // Nella Daily Challenge queste scelte vengono dal seed del giorno.
    const type = types[Math.floor(spawnRnd() * types.length)];
    const x = spawnRange(40, W - 40);
    const variant = game.wave >= 3 && basics.includes(type) && spawnRnd() < 0.4 ? 1 : 0;
    const e = new Enemy(type, x, W, variant, game.theme.enemy[type], diff, worldIndexForLevel(game.level));
    if (type !== "tank" && type !== "sniper") e.speed *= speedMul;
    e.y = -30 - spawnRange(0, 300);
    game.enemies.push(e);
  }
}

function advanceLevel() {
  game.level += 1;
  game.theme = worldForLevel(game.level);
  buildBackground(game.theme);
  initScene(game.theme.scene, W, H, game.theme);
  clearSprites();
  window.__galaxySetWorld?.(worldIndexForLevel(game.level));
  game.banner = { text: `MONDO ${game.level}`, sub: game.theme.name, life: 3.0, color: game.theme.enemy.straight };
}

function addScore(base, x, y) {
  const mult = comboMultiplier(game.combo);
  const gained = Math.round(base * mult);
  game.score += gained;
  if (game.score > game.highScore) {
    game.highScore = game.score;
    localStorage.setItem(HS_KEY, String(game.highScore));
  }
  if (x !== undefined) {
    const txt = mult > 1 ? `+${gained} x${mult}` : `+${gained}`;
    addPopup(x, y, txt, mult > 1 ? PALETTE.combo : PALETTE.ui);
  }
}

function updateStars(dt) {
  for (const s of stars) {
    s.y += 40 * s.z * dt;
    if (s.y > H) { s.y = 0; s.x = rand(0, W); }
  }
}

function update(dt) {
  bgTime += dt;
  // Il pulsante CONDIVIDI è attivo/toccabile solo al Game Over.
  if (shareBtn) shareBtn.hidden = game.state !== State.GAMEOVER;
  updateStars(dt);
  updateScene(dt);
  game.particles.update(dt);
  game.flash = Math.max(0, game.flash - dt * 3);

  for (const pu of game.popups) { pu.y += pu.vy * dt; pu.vy *= 0.9; pu.life -= dt; }
  game.popups = game.popups.filter((p) => p.life > 0);
  if (game.banner) { game.banner.life -= dt; if (game.banner.life <= 0) game.banner = null; }

  // Pulsante SFIDA DEL GIORNO: attivo/toccabile solo nel menu.
  if (dailyBtn) dailyBtn.hidden = game.state !== State.MENU;

  // Stati non giocanti: menu / game over.
  if (game.state === State.MENU || game.state === State.GAMEOVER) {
    const shared = consumeShare(); // condivisione già eseguita nel gesto (onShare)
    const daily = consumeDaily();
    const pressed = consumeStart();
    consumeBomb(); consumeSuper(); consumePause();
    if (game.state === State.GAMEOVER) game.gameoverLock = Math.max(0, game.gameoverLock - dt);
    if (daily && (game.state === State.MENU || game.gameoverLock <= 0)) { startDaily(); return; }
    // La condivisione NON deve contare come "premi per riprovare" (anti-restart).
    if (pressed && !shared && (game.state === State.MENU || game.gameoverLock <= 0)) startPlaying();
    return;
  }
  consumeDaily();

  // Pausa (toggle).
  if (consumePause()) game.state = game.state === State.PLAY ? State.PAUSE : State.PLAY;
  if (game.state === State.PAUSE) { consumeBomb(); consumeSuper(); return; }

  // Attivazione super.
  if (consumeSuper() && game.player.superReady) activateSuper();
  updateSuper(dt);

  if (consumeBomb() && game.player.bombs > 0) detonateBomb();

  if (game.hitStop > 0) { game.hitStop = Math.max(0, game.hitStop - dt); return; }

  if (game.combo > 0) { game.comboTimer -= dt; if (game.comboTimer <= 0) game.combo = 0; }

  const p = game.player;
  p.update(dt, game.playerBullets);

  // Razzi automatici a livello arma massimo.
  if (p.weaponLevel >= MAX_WEAPON && p.rocketCd <= 0) {
    const tgt = nearestEnemy(p.x, p.y, game.enemies, game.boss);
    if (tgt) { game.rockets.push(new Rocket(p.x, p.y - 10)); p.rocketCd = 0.55; }
  }

  // Rallenta-tempo: fattore applicato a nemici/proiettili nemici/boss.
  const ts = game.activeSuper && game.activeSuper.type === "timeslow" ? TIMESLOW_FACTOR : 1;

  for (const b of game.playerBullets) b.update(dt, W, H);
  for (const b of game.enemyBullets) b.update(dt * ts, W, H);
  for (const r of game.rockets) r.update(dt, nearestEnemy(r.x, r.y, game.enemies, game.boss), W, H);
  for (const e of game.enemies) e.update(dt * ts, game.enemyBullets, p.x, p.y);
  if (game.boss) game.boss.update(dt * ts, game.enemyBullets, p.x, p.y, bossApi);
  for (const pu of game.powerups) pu.update(dt, H);

  handleCollisions();

  game.playerBullets = game.playerBullets.filter((b) => !b.dead);
  game.enemyBullets = game.enemyBullets.filter((b) => !b.dead);
  game.rockets = game.rockets.filter((r) => !r.dead);
  game.enemies = game.enemies.filter((e) => !e.dead);
  game.powerups = game.powerups.filter((pu) => !pu.dead);
  if (game.boss && game.boss.dead) game.boss = null;

  if (game.enemies.length === 0 && !game.boss) {
    game.waveCooldown -= dt;
    if (game.waveCooldown <= 0) { spawnWave(); game.waveCooldown = 2.0; }
  }

  updateStyleRank(dt);
}

// Aggiorna lo STYLE RANK (D→SSS): sale con combo alte e nessun danno, crolla
// quando vieni colpito (noHitTime azzerato in damagePlayer). Logica pura in
// utils.js (styleRank); qui solo stato + feedback al cambio di grado.
function updateStyleRank(dt) {
  game.noHitTime += dt;
  const idx = styleRank(game.combo, game.noHitTime);
  if (idx !== game.styleRank) {
    // Feedback quando SALE, marcato su S/SSS. Niente flash a schermo intero.
    if (idx > game.styleRank && idx >= 4) {
      const r = STYLE_RANKS[idx];
      addPopup(game.player.x, game.player.y - 70, `RANK ${r.label}!`, r.color);
      game.particles.addShake(idx >= 5 ? 6 : 4);
      sfx.combo();
    }
    game.styleRank = idx;
    if (idx > game.bestRank) game.bestRank = idx;
  }
}

// ---------- SUPER-ARMI ----------

function activateSuper() {
  const type = game.player.superType;
  if (!type) return;
  game.activeSuper = { type, time: SUPER_INFO[type].duration, sub: 0 };
  game.player.consumeSuper();
  addPopup(game.player.x, game.player.y - 30, `SUPER: ${SUPER_INFO[type].name}`, SUPER_INFO[type].color);
  sfx.powerup();
  if (type === "drones") game.drones = [new Drone(0), new Drone(TAU / 3), new Drone((2 * TAU) / 3)];
}

function updateSuper(dt) {
  const as = game.activeSuper;
  if (!as) return;
  as.time -= dt;
  const p = game.player;
  if (as.type === "laser") {
    as.sub -= dt;
    if (as.sub <= 0) { as.sub = 0.06; laserDamage(); }
  } else if (as.type === "nova") {
    as.sub -= dt;
    if (as.sub <= 0) { as.sub = 0.7; novaBlast(); }
  } else if (as.type === "missiles") {
    as.sub -= dt;
    if (as.sub <= 0) {
      as.sub = 0.18;
      const tgt = nearestEnemy(p.x, p.y, game.enemies, game.boss);
      if (tgt) game.rockets.push(new Rocket(p.x + rand(-14, 14), p.y - 10));
    }
  } else if (as.type === "drones") {
    for (const d of game.drones) d.update(dt, p, game.playerBullets);
  }
  if (as.time <= 0) { game.activeSuper = null; game.drones = []; }
}

function laserDamage() {
  const p = game.player;
  const hw = 22;
  for (const e of game.enemies) {
    if (!e.dead && Math.abs(e.x - p.x) < hw + e.r && e.y < p.y && e.hit(2)) killEnemy(e);
  }
  if (game.boss && !game.boss.dead && Math.abs(game.boss.x - p.x) < hw + game.boss.r && game.boss.y < p.y && game.boss.hit(2)) killEnemy(game.boss);
  game.particles.burst(p.x, rand(0, p.y), PALETTE.bullet, 2);
}

function novaBlast() {
  for (const b of game.enemyBullets) b.dead = true;
  for (const e of game.enemies) { if (!e.dead) { killEnemy(e); e.dead = true; } }
  if (game.boss && !game.boss.dead && game.boss.hit(5)) killEnemy(game.boss);
  game.particles.burst(W / 2, H / 2, PALETTE.combo, 42);
  game.particles.shockwave(W / 2, H / 2, "#ffffff", Math.max(W, H), 0.5);
  game.particles.addShake(20);
  game.flash = 0.4;
  sfx.explosion();
}

// ---------- KILL / BOMBA / COLLISIONI ----------

function killEnemy(e) {
  const col = e.color || PALETTE.zigzag;
  game.particles.burst(e.x, e.y, col, e.isBoss ? 70 : 22);
  game.particles.addShake(e.isBoss ? 22 : 7);
  game.hitStop = Math.max(game.hitStop, e.isBoss ? 0.11 : 0.045);
  // Onda d'urto: grande e doppia sui boss, minima sui nemici comuni.
  if (e.isBoss) {
    game.particles.shockwave(e.x, e.y, "#ffffff", 230, 0.55);
    game.particles.shockwave(e.x, e.y, col, 150, 0.42);
  } else {
    game.particles.shockwave(e.x, e.y, col, 30 + e.r, 0.26);
  }
  sfx.explosion();
  // Salita di combo: quando il moltiplicatore cresce, premia con pop/suono/shake.
  const prevMult = comboMultiplier(game.combo);
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.comboTimer = 2.2;
  const newMult = comboMultiplier(game.combo);
  if (newMult > prevMult) {
    addPopup(game.player.x, game.player.y - 42, `COMBO x${newMult}!`, PALETTE.combo);
    game.particles.addShake(6);
    game.hitStop = Math.max(game.hitStop, 0.05);
    sfx.combo();
  }
  // Feedback quando la super si carica del tutto.
  const becameReady = game.player.addCharge(e.isBoss ? 0.5 : 0.06);
  if (becameReady) {
    const sc = SUPER_INFO[game.player.superType].color;
    addPopup(game.player.x, game.player.y - 58, "SUPER PRONTA!", sc);
    game.particles.shockwave(game.player.x, game.player.y, sc, 60, 0.45);
    game.particles.addShake(5);
    sfx.ready();
  }
  addScore(e.score, e.x, e.y);
  const chance = e.isBoss ? 1 : 0.13;
  if (Math.random() < chance) game.powerups.push(new PowerUp(e.x, e.y, PowerUp.randomType()));
  if (e.type === "splitter") {
    for (const s of [-1, 1]) {
      const sp = new Enemy("splitling", e.x + s * 10, W, 0, e.color, 1, e.skin);
      sp.y = e.y;
      game.enemies.push(sp);
    }
  }
  if (e.isBoss) advanceLevel();
}

function explodeRocket(r) {
  game.particles.burst(r.x, r.y, PALETTE.flame, 24);
  game.particles.addShake(8);
  sfx.explosion();
  for (const e of game.enemies) {
    if (e.dead) continue;
    const dx = e.x - r.x, dy = e.y - r.y;
    if (dx * dx + dy * dy < 55 * 55 && e.hit(2)) killEnemy(e);
  }
  if (game.boss && !game.boss.dead) {
    const dx = game.boss.x - r.x, dy = game.boss.y - r.y;
    if (dx * dx + dy * dy < 70 * 70 && game.boss.hit(2)) killEnemy(game.boss);
  }
}

function detonateBomb() {
  const p = game.player;
  p.bombs -= 1;
  for (const b of game.enemyBullets) b.dead = true;
  for (const e of game.enemies) { if (!e.dead) { killEnemy(e); e.dead = true; } }
  if (game.boss && !game.boss.dead && game.boss.hit(8)) killEnemy(game.boss);
  game.particles.burst(p.x, p.y, "#ffffff", 40);
  game.particles.burst(W / 2, H / 2, PALETTE.combo, 46);
  game.particles.shockwave(p.x, p.y, "#ffffff", Math.max(W, H) * 0.9, 0.5);
  game.particles.addShake(26);
  game.flash = 0.5;
  p.invuln = Math.max(p.invuln, 1.0);
  addPopup(p.x, p.y - 24, "BOMBA!", "#ff9a3f");
  sfx.explosion();
}

function handleCollisions() {
  const p = game.player;

  for (const b of game.playerBullets) {
    if (b.dead) continue;
    for (const e of game.enemies) {
      if (!e.dead && circleHit(b, e)) {
        b.dead = true;
        game.particles.burst(b.x, b.y, PALETTE.bullet, 5);
        if (e.hit(1)) killEnemy(e);
        break;
      }
    }
    if (b.dead) continue;
    if (game.boss && !game.boss.dead && circleHit(b, game.boss)) {
      b.dead = true;
      game.particles.burst(b.x, b.y, "#ffffff", 6);
      if (game.boss.hit(1)) killEnemy(game.boss);
    }
  }

  for (const r of game.rockets) {
    if (r.dead) continue;
    let hit = false;
    for (const e of game.enemies) { if (!e.dead && circleHit(r, e)) { hit = true; break; } }
    if (!hit && game.boss && !game.boss.dead && circleHit(r, game.boss)) hit = true;
    if (hit) { explodeRocket(r); r.dead = true; }
  }

  for (const b of game.enemyBullets) {
    if (!b.dead && circleHit(b, p)) { b.dead = true; damagePlayer(); }
  }

  for (const e of game.enemies) {
    if (!e.dead && circleHit(e, p)) {
      e.dead = true;
      game.particles.burst(e.x, e.y, e.color, 16);
      damagePlayer();
    }
  }

  for (const pu of game.powerups) {
    if (!pu.dead && circleHit(pu, p)) {
      pu.dead = true;
      if (pu.type === "super") {
        p.armSuper(pu.superType);
        addPopup(pu.x, pu.y - 20, `SUPER: ${SUPER_INFO[pu.superType].name}`, pu.color);
      } else {
        const beforeLv = p.weaponLevel;
        p.addPowerup(pu.type);
        const label = { power: "ARMA +1", bomb: "BOMBA +1", shield: "SCUDO", life: "VITA +1" }[pu.type];
        addPopup(pu.x, pu.y - 20, label, PALETTE.ui);
        // Upgrade arma effettivo: anello + shake per marcarlo (non a livello max).
        if (pu.type === "power" && p.weaponLevel > beforeLv) {
          game.particles.shockwave(p.x, p.y, PALETTE.bullet, 66, 0.4);
          game.particles.addShake(5);
        }
      }
      game.particles.burst(pu.x, pu.y, pu.color, 14);
      sfx.powerup();
    }
  }
}

function damagePlayer() {
  const p = game.player;
  if (p.invuln > 0) return;
  game.noHitTime = 0; // azzera lo style rank: sei stato colpito
  const result = p.takeHit();
  game.particles.burst(p.x, p.y, PALETTE.player, 22);
  game.particles.addShake(14);
  game.flash = 0.6;
  sfx.hit();
  if (result === "weapon") addPopup(p.x, p.y - 24, "ARMA -1", PALETTE.combo);
  else if (result === "shield") addPopup(p.x, p.y - 24, "SCUDO ROTTO", PALETTE.shield);
  if (result === "dead") {
    game.state = State.GAMEOVER;
    game.gameoverLock = 1.2;
    // Registra il punteggio della Sfida del giorno (best + streak).
    if (game.daily) game.dailyResult = recordDailyResult(game.daily.key, game.score);
  }
}

// ---------- RENDER ----------

function drawStars() {
  const base = game.theme.star;
  for (const s of stars) {
    const tw = 0.55 + 0.45 * Math.sin(bgTime * s.twSpeed + s.tw);
    ctx.globalAlpha = Math.min(1, s.z * tw);
    const col = s.col || base;
    if (s.size > 2) {
      // Stelle vicine: nucleo luminoso + alone + croce di scintillio.
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = col;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 0.5, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = Math.min(1, s.z * tw) * 0.5;
      ctx.strokeStyle = col;
      ctx.lineWidth = 0.7;
      const r = s.size * 1.9 * tw;
      ctx.beginPath();
      ctx.moveTo(s.x - r, s.y); ctx.lineTo(s.x + r, s.y);
      ctx.moveTo(s.x, s.y - r); ctx.lineTo(s.x, s.y + r);
      ctx.stroke();
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 0.6, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawLaserBeam() {
  const p = game.player;
  const grad = ctx.createLinearGradient(p.x - 22, 0, p.x + 22, 0);
  grad.addColorStop(0, "rgba(125,249,255,0)");
  grad.addColorStop(0.5, "rgba(125,249,255,0.85)");
  grad.addColorStop(1, "rgba(125,249,255,0)");
  ctx.fillStyle = grad;
  ctx.shadowColor = PALETTE.bullet;
  ctx.shadowBlur = 24;
  ctx.fillRect(p.x - 22, 0, 44, p.y);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(p.x - 5, 0, 10, p.y);
  ctx.shadowBlur = 0;
}

function drawPopups() {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold 16px ${FONT_MONO}`;
  for (const p of game.popups) {
    // Pop-in: parte ingrandito e si assesta nei primi ~120ms.
    const age = 0.9 - p.life;
    const pop = age < 0.12 ? 1 + ((0.12 - age) / 0.12) * 0.6 : 1;
    ctx.globalAlpha = Math.min(1, p.life / 0.6);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(pop, pop);
    ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawHUD() {
  const pl = game.player;
  // Scrim in alto: velo scuro sfumato per leggibilità su sfondi luminosi.
  const scrim = ctx.createLinearGradient(0, 0, 0, 104);
  scrim.addColorStop(0, "rgba(4,3,12,0.55)");
  scrim.addColorStop(1, "rgba(4,3,12,0)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, 104);

  ctx.textBaseline = "top";
  ctx.shadowBlur = 0;

  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.ui;
  ctx.font = `bold 22px ${FONT_MONO}`;
  ctx.shadowColor = PALETTE.player;
  ctx.shadowBlur = 6;
  ctx.fillText(String(game.score).padStart(6, "0"), 14, 11);
  ctx.shadowBlur = 0;
  ctx.font = `10px ${FONT_MONO}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText(`ONDATA ${game.wave} · MONDO ${game.level}${game.daily ? ` · 🔥${dailyLabel(game.daily.key)}` : ""}`, 14, 37);

  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText("ARMA", 14, 52);
  for (let i = 0; i < MAX_WEAPON; i++) {
    ctx.fillStyle = i < pl.weaponLevel ? PALETTE.bullet : "rgba(255,255,255,0.18)";
    ctx.fillRect(48 + i * 11, 53, 7, 7);
  }

  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText("BOMBE", 14, 66);
  for (let i = 0; i < pl.bombs; i++) {
    ctx.fillStyle = "#ff9a3f";
    ctx.beginPath();
    ctx.arc(56 + i * 12, 71, 3.5, 0, TAU);
    ctx.fill();
  }

  // Barra super (o icona "PRONTA").
  const sy = 82;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText("SUPER", 14, sy);
  if (game.activeSuper) {
    const info = SUPER_INFO[game.activeSuper.type];
    ctx.fillStyle = info.color;
    ctx.fillText(`${info.name} ${game.activeSuper.time.toFixed(1)}s`, 48, sy);
  } else if (pl.superReady) {
    drawSuperIcon(ctx, pl.superType, 56, sy + 5, 6);
    const blink = 0.5 + 0.5 * Math.sin(bgTime * 8);
    ctx.globalAlpha = blink;
    ctx.fillStyle = SUPER_INFO[pl.superType].color;
    ctx.fillText(input.isTouch ? "PRONTA" : "PRONTA E", 68, sy);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(48, sy + 2, 60, 6);
    ctx.fillStyle = PALETTE.combo;
    ctx.fillRect(48, sy + 2, 60 * pl.superCharge, 6);
  }

  // Record + vite a destra.
  ctx.textAlign = "right";
  ctx.fillStyle = PALETTE.uiDim;
  ctx.font = `10px ${FONT_MONO}`;
  ctx.fillText(`REC ${String(game.highScore).padStart(6, "0")}`, W - 14, 12);
  for (let i = 0; i < pl.lives; i++) {
    const x = W - 20 - i * 22;
    const y = 40;
    ctx.fillStyle = PALETTE.player;
    ctx.shadowColor = PALETTE.player;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x, y - 8); ctx.lineTo(x + 6, y + 6); ctx.lineTo(x - 6, y + 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // STYLE RANK (top-right, sotto le vite). Pulsa e vira di colore salendo.
  {
    const r = STYLE_RANKS[game.styleRank];
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.font = `9px ${FONT_MONO}`;
    ctx.fillStyle = PALETTE.uiDim;
    ctx.fillText("STYLE", W - 14, 56);
    // Pulsazione: più marcata ai gradi alti; nessun flash a schermo intero.
    const amp = 0.05 + 0.03 * game.styleRank;
    const pulse = game.styleRank >= 1 ? 1 + Math.sin(bgTime * (5 + game.styleRank)) * amp : 1;
    ctx.save();
    ctx.translate(W - 14, 82);
    ctx.scale(pulse, pulse);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = r.color;
    ctx.shadowColor = r.color;
    ctx.shadowBlur = game.styleRank >= 3 ? 12 : 4;
    ctx.font = `bold ${16 + game.styleRank * 2}px ${FONT_MONO}`;
    ctx.fillText(r.label, 0, 0);
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  if (game.combo >= 2) {
    const mult = comboMultiplier(game.combo);
    const t = Math.max(0, Math.min(1, game.comboTimer / 2.2));
    ctx.textAlign = "center";
    ctx.fillStyle = PALETTE.combo;
    ctx.shadowColor = PALETTE.combo;
    ctx.shadowBlur = 12;
    const size = mult > 1 ? 20 + Math.sin(bgTime * 10) * 2 : 16;
    ctx.font = `bold ${size}px ${FONT_MONO}`;
    ctx.fillText(`COMBO ${game.combo} x${mult}`, W / 2, 12);
    ctx.shadowBlur = 0;
    const bw = 150;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(W / 2 - bw / 2, 36, bw, 4);
    ctx.fillStyle = PALETTE.combo;
    ctx.fillRect(W / 2 - bw / 2, 36, bw * t, 4);
  }
}

function drawTouchButtons() {
  if (!input.isTouch) return;
  const pl = game.player;
  for (const b of touchButtons) {
    if (b.hidden) continue; // es. "share": disegnato solo al Game Over
    let col = PALETTE.uiDim;
    let active = true;
    if (b.id === "bomb") { col = "#ff9a3f"; active = pl.bombs > 0; }
    else if (b.id === "super") { col = pl.superReady ? SUPER_INFO[pl.superType].color : PALETTE.uiDim; active = pl.superReady; }
    ctx.globalAlpha = active ? 0.9 : 0.35;
    ctx.strokeStyle = col;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = col;
    ctx.shadowBlur = active ? 12 : 0;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (b.id === "super" && pl.superReady) {
      drawSuperIcon(ctx, pl.superType, b.x, b.y, b.r * 0.5);
    } else {
      ctx.fillStyle = col;
      ctx.font = `bold ${b.id === "pause" ? 14 : 18}px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.label, b.x, b.y + 1);
    }
  }
  ctx.globalAlpha = 1;
}

// Pulsante SFIDA DEL GIORNO nel menu (solo touch: su desktop c'è il tasto G).
function drawDailyControl() {
  if (!input.isTouch || !dailyBtn) return;
  const b = dailyBtn;
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = PALETTE.combo;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = PALETTE.combo;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `26px ${FONT_MONO}`;
  ctx.fillText(b.label, b.x, b.y + 1);
  ctx.globalAlpha = 1;
}

// Controllo CONDIVIDI al Game Over: pulsante toccabile su mobile, hint tasto su desktop.
function drawShareControl() {
  if (!input.isTouch || !shareBtn) {
    drawLines([{ text: "C per condividere il risultato", y: H * 0.32 + 172, font: `13px ${FONT}`, color: PALETTE.bullet }]);
    return;
  }
  const b = shareBtn;
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = PALETTE.bullet;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = PALETTE.bullet;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.bullet;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold 22px ${FONT_MONO}`;
  ctx.fillText(b.label, b.x, b.y + 1);
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText("CONDIVIDI", b.x, b.y + b.r + 14);
  ctx.globalAlpha = 1;
}

function drawBanner() {
  if (!game.banner) return;
  const b = game.banner;
  ctx.globalAlpha = Math.min(1, b.life / 0.8);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = b.color;
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 24;
  ctx.font = `bold 32px ${FONT}`;
  ctx.fillText(b.text, W / 2, H * 0.32);
  ctx.font = `18px ${FONT}`;
  ctx.fillText(b.sub, W / 2, H * 0.32 + 34);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawTitle(y) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = PALETTE.player;
  ctx.shadowColor = PALETTE.player;
  ctx.shadowBlur = 28;
  ctx.font = `bold 40px ${FONT}`;
  ctx.fillText("NEON", W / 2, y);
  ctx.fillStyle = PALETTE.life;
  ctx.shadowColor = PALETTE.life;
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText("SPACE SHOOTER", W / 2, y + 40);
  ctx.shadowBlur = 0;
}

function drawLines(lines) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const l of lines) {
    ctx.fillStyle = l.color || PALETTE.ui;
    ctx.shadowColor = l.color || PALETTE.player;
    ctx.shadowBlur = l.glow ? 20 : 0;
    ctx.font = l.font || `16px ${FONT}`;
    ctx.fillText(l.text, W / 2, l.y);
  }
  ctx.shadowBlur = 0;
}

function render() {
  // Sfondo = galassia 3D (canvas WebGL dietro). In 2D puliamo trasparente;
  // se il 3D non è disponibile, ripieghiamo sulla nebulosa 2D.
  if (window.__galaxyFailed) {
    ctx.drawImage(bgCanvas, 0, 0);
  } else {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(3,2,10,0.32)"; // velo per leggibilità sopra la galassia
    ctx.fillRect(0, 0, W, H);
  }

  ctx.save();
  game.particles.applyShake(ctx);
  // Parallasse orizzontale legata al player: lo sfondo "risponde" al movimento.
  drawScene(ctx, (game.player.x - W / 2) * -0.06);
  drawStars();
  // Grana filmica sopra lo sfondo (sotto l'azione): amalgama 3D e 2D.
  drawGrain(ctx, bgTime, W, H);

  const playing = game.state === State.PLAY || game.state === State.PAUSE || game.state === State.GAMEOVER;
  if (playing) {
    for (const b of game.playerBullets) b.draw(ctx);
    for (const b of game.enemyBullets) b.draw(ctx);
    for (const r of game.rockets) r.draw(ctx);
    for (const e of game.enemies) e.draw(ctx);
    if (game.boss) game.boss.draw(ctx);
    for (const pu of game.powerups) pu.draw(ctx);
    for (const d of game.drones) d.draw(ctx);
    game.particles.draw(ctx);
    if (game.activeSuper && game.activeSuper.type === "laser") drawLaserBeam();
    if (game.state !== State.GAMEOVER) game.player.draw(ctx);
  }
  drawPopups();
  ctx.restore();

  // Tinta rallenta-tempo.
  if (game.activeSuper && game.activeSuper.type === "timeslow") {
    ctx.fillStyle = "rgba(80,180,255,0.10)";
    ctx.fillRect(0, 0, W, H);
  }

  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (game.state === State.PLAY || game.state === State.PAUSE) {
    drawHUD();
    drawBanner();
    drawTouchButtons();
  }

  if (game.state === State.PAUSE) {
    ctx.fillStyle = "rgba(4,3,10,0.6)";
    ctx.fillRect(0, 0, W, H);
    drawLines([
      { text: "PAUSA", y: H / 2 - 20, font: `bold 44px ${FONT}`, color: PALETTE.player, glow: true },
      { text: input.isTouch ? "Tocca ⏸ per riprendere" : "Premi P o Esc per riprendere", y: H / 2 + 30, color: PALETTE.uiDim },
    ]);
  } else if (game.state === State.MENU) {
    drawTitle(H * 0.26);
    const ds = loadDaily();
    const todayBest = ds.best[todayKey()] || 0;
    drawLines([
      { text: input.isTouch ? "Tocca per iniziare" : "Premi un tasto o clicca per iniziare", y: H * 0.5, color: PALETTE.ui },
      { text: `Record: ${game.highScore}`, y: H * 0.5 + 30, color: PALETTE.combo },
      { text: input.isTouch ? "Trascina per muoverti · fuoco automatico" : "Muoviti: frecce/WASD o mouse · Spara: Spazio/click", y: H * 0.5 + 66, font: `13px ${FONT}`, color: PALETTE.uiDim },
      { text: input.isTouch ? "Pulsanti: B bomba · S super · II pausa" : "Bomba: B · Super: E · Pausa: P", y: H * 0.5 + 88, font: `13px ${FONT}`, color: PALETTE.uiDim },
      { text: "Sali di MONDO battendo i boss. Potenzia l'arma, usa bombe e super!", y: H * 0.5 + 120, font: `12px ${FONT}`, color: PALETTE.uiDim },
      { text: input.isTouch ? "🔥 SFIDA DEL GIORNO — tocca il pulsante" : "🔥 SFIDA DEL GIORNO — premi G", y: H * 0.5 + 156, font: `bold 14px ${FONT}`, color: PALETTE.combo, glow: true },
      { text: `${dailyLabel(todayKey())}: stesso seed per tutti${todayBest ? ` · oggi ${todayBest}` : ""}${ds.streak ? ` · streak 🔥${ds.streak}` : ""}`, y: H * 0.5 + 176, font: `12px ${FONT}`, color: PALETTE.uiDim },
    ]);
    drawDailyControl();
  } else if (game.state === State.GAMEOVER) {
    const rk = STYLE_RANKS[game.bestRank];
    const lines = [
      { text: "GAME OVER", y: H * 0.32, font: `bold 44px ${FONT}`, color: PALETTE.boss, glow: true },
      { text: `Punteggio ${game.score}`, y: H * 0.32 + 46, font: `22px ${FONT}`, color: PALETTE.ui },
      { text: `Mondo ${game.level} · Combo ${game.bestCombo} · Rank ${rk.label}`, y: H * 0.32 + 78, font: `15px ${FONT}`, color: PALETTE.uiDim },
      { text: `Record ${game.highScore}`, y: H * 0.32 + 102, color: PALETTE.combo },
      { text: game.gameoverLock > 0 ? "..." : (input.isTouch ? "Tocca per riprovare" : "Premi per riprovare"), y: H * 0.32 + 148, color: PALETTE.uiDim },
    ];
    if (game.daily && game.dailyResult) {
      const dr = game.dailyResult;
      lines.splice(4, 0, {
        text: `SFIDA ${dailyLabel(game.daily.key)} · ${dr.isNewBest ? "NUOVO BEST!" : `best ${dr.best}`} · streak 🔥${dr.streak}`,
        y: H * 0.32 + 124, font: `bold 13px ${FONT}`, color: PALETTE.combo,
      });
    }
    drawLines(lines);
    drawShareControl();
  }
}

// ---------- LOOP + hook di sviluppo ----------

const params = new URLSearchParams(location.search);

if (params.get("autostart") === "1") { startPlaying(); spawnWave(); }

const lvl = parseInt(params.get("level"), 10);
if (params.get("showcase") === "1" || lvl >= 1) {
  startPlaying();
  if (lvl >= 1) {
    game.level = lvl;
    game.theme = worldForLevel(lvl);
    buildBackground(game.theme);
    initScene(game.theme.scene, W, H, game.theme);
    clearSprites();
    window.__galaxySetWorld?.(worldIndexForLevel(lvl));
  }
  const th = game.theme;
  const wi = worldIndexForLevel(game.level);
  const mk = (type, x, y) => {
    const e = new Enemy(type, x, W, 0, th.enemy[type], 1, wi);
    e.y = y; e.speed = 0;
    return e;
  };
  const pool = th.pool;
  pool.forEach((type, i) => game.enemies.push(mk(type, 80 + i * 110, 200)));
  game.boss = createBoss(th.bossType, W, game.level, th.boss, 1, wi);
  game.boss.entering = false;
  game.boss.y = H * 0.55;
}

const sup = params.get("super");
if (sup && SUPER_INFO[sup]) { if (game.state !== State.PLAY) startPlaying(); game.player.armSuper(sup); }

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
