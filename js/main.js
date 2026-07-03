// Game loop principale e macchina a stati (menu / gioco / game over).
import { rand, randInt, circleHit, comboMultiplier, TAU } from "./utils.js";
import { initInput, input, consumeStart, consumeBomb, onFirstInteraction } from "./input.js";
import { unlockAudio, sfx } from "./audio.js";
import { Player, MAX_WEAPON } from "./player.js";
import { Enemy, Boss } from "./enemies.js";
import { PowerUp } from "./powerups.js";
import { ParticleSystem } from "./particles.js";
import { Rocket, nearestEnemy } from "./rockets.js";
import { worldForLevel } from "./worlds.js";
import { PALETTE, FONT, FONT_MONO } from "./palette.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

initInput(canvas);
onFirstInteraction(unlockAudio);

const HS_KEY = "neon_space_shooter_highscore";
const State = { MENU: "menu", PLAY: "play", GAMEOVER: "gameover" };

// Stelle di sfondo su 3 layer con parallasse + twinkle (persistono tra gli stati).
const stars = Array.from({ length: 150 }, () => {
  const z = rand(0.2, 1);
  return {
    x: rand(0, W),
    y: rand(0, H),
    z,
    size: z < 0.5 ? 1 : z < 0.8 ? 1.6 : 2.4,
    tw: rand(0, TAU),
    twSpeed: rand(1.5, 4),
  };
});

// Nebulosa di sfondo su canvas offscreen; ricostruita al cambio di mondo.
const bgCanvas = document.createElement("canvas");
bgCanvas.width = W;
bgCanvas.height = H;
const NEBULA_POS = [
  { x: W * 0.25, y: H * 0.3, r: 320 },
  { x: W * 0.8, y: H * 0.2, r: 280 },
  { x: W * 0.6, y: H * 0.75, r: 360 },
  { x: W * 0.1, y: H * 0.85, r: 240 },
];
function buildBackground(theme) {
  const bg = bgCanvas.getContext("2d");
  const grad = bg.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.bgTop);
  grad.addColorStop(1, theme.bgBottom);
  bg.fillStyle = grad;
  bg.fillRect(0, 0, W, H);
  NEBULA_POS.forEach((pos, i) => {
    const c = theme.nebula[i % theme.nebula.length];
    const g = bg.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, pos.r);
    g.addColorStop(0, c);
    g.addColorStop(1, "rgba(0,0,0,0)");
    bg.fillStyle = g;
    bg.beginPath();
    bg.arc(pos.x, pos.y, pos.r, 0, TAU);
    bg.fill();
  });
}

let bgTime = 0; // tempo globale per il twinkle
let game;

function newGame() {
  return {
    state: State.MENU,
    player: new Player(W, H),
    enemies: [],
    playerBullets: [],
    enemyBullets: [],
    rockets: [],
    powerups: [],
    particles: new ParticleSystem(),
    score: 0,
    wave: 0,
    level: 1,
    theme: worldForLevel(1),
    waveCooldown: 1.2,
    boss: null,
    banner: null, // messaggio "MONDO X"
    highScore: Number(localStorage.getItem(HS_KEY) || 0),
    flash: 0,
    combo: 0,
    comboTimer: 0,
    hitStop: 0,
    popups: [],
  };
}

function addPopup(x, y, text, color) {
  game.popups.push({ x, y, text, color, life: 0.9, vy: -46 });
}

game = newGame();
buildBackground(game.theme);

function startPlaying() {
  const hs = game.highScore;
  game = newGame();
  game.highScore = hs;
  game.state = State.PLAY;
  buildBackground(game.theme);
}

// Fattore di difficoltà crescente con ondate e livelli (con cap).
function difficulty() {
  return Math.min(2.3, 1 + (game.wave - 1) * 0.03 + (game.level - 1) * 0.12);
}

function spawnWave() {
  game.wave += 1;
  const diff = difficulty();
  // Ogni 5 ondate: boss (del mondo corrente).
  if (game.wave % 5 === 0) {
    game.boss = new Boss(W, game.level, game.theme.boss, diff);
    sfx.boss();
    return;
  }
  const count = Math.min(4 + game.wave, 16);
  const types = ["straight"];
  if (game.wave >= 2) types.push("zigzag");
  if (game.wave >= 3) types.push("shooter");
  const speedMul = 1 + (diff - 1) * 0.5;
  for (let i = 0; i < count; i++) {
    const type = types[randInt(0, types.length - 1)];
    const x = rand(50, W - 50);
    const variant = game.wave >= 3 && Math.random() < 0.4 ? 1 : 0;
    const e = new Enemy(type, x, W, variant, game.theme.enemy[type], diff);
    e.speed *= speedMul;
    e.y = -30 - rand(0, 300);
    game.enemies.push(e);
  }
}

// Sale di mondo dopo aver battuto il boss: cambia scenario e colori.
function advanceLevel() {
  game.level += 1;
  game.theme = worldForLevel(game.level);
  buildBackground(game.theme);
  game.banner = { text: `MONDO ${game.level} — ${game.theme.name}`, life: 2.8, color: game.theme.enemy.straight };
}

// Aggiunge punteggio applicando il moltiplicatore combo; mostra uno score-pop.
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
    if (s.y > H) {
      s.y = 0;
      s.x = rand(0, W);
    }
  }
}

function update(dt) {
  bgTime += dt;
  updateStars(dt);
  game.particles.update(dt);
  game.flash = Math.max(0, game.flash - dt * 3);

  for (const pu of game.popups) {
    pu.y += pu.vy * dt;
    pu.vy *= 0.9;
    pu.life -= dt;
  }
  game.popups = game.popups.filter((p) => p.life > 0);

  if (game.banner) {
    game.banner.life -= dt;
    if (game.banner.life <= 0) game.banner = null;
  }

  if (game.state !== State.PLAY) {
    if (consumeStart()) startPlaying();
    consumeBomb(); // scarta l'input bomba fuori dal gioco
    return;
  }

  // Bomba (bottone del panico).
  if (consumeBomb() && game.player.bombs > 0) detonateBomb();

  // Hit-stop: congela brevemente il gameplay per dare peso ai colpi/kill.
  if (game.hitStop > 0) {
    game.hitStop = Math.max(0, game.hitStop - dt);
    return;
  }

  if (game.combo > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;
  }

  const p = game.player;
  p.update(dt, game.playerBullets);

  // Razzi a ricerca al livello arma massimo.
  if (p.weaponLevel >= MAX_WEAPON && p.rocketCd <= 0) {
    const tgt = nearestEnemy(p.x, p.y, game.enemies, game.boss);
    if (tgt) {
      game.rockets.push(new Rocket(p.x, p.y - 10));
      p.rocketCd = 0.55;
    }
  }

  for (const b of game.playerBullets) b.update(dt, W, H);
  for (const b of game.enemyBullets) b.update(dt, W, H);
  for (const r of game.rockets) r.update(dt, nearestEnemy(r.x, r.y, game.enemies, game.boss), W, H);
  for (const e of game.enemies) e.update(dt, game.enemyBullets, p.x);
  if (game.boss) game.boss.update(dt, game.enemyBullets, p.x);
  for (const pu of game.powerups) pu.update(dt, H);

  handleCollisions();

  game.playerBullets = game.playerBullets.filter((b) => !b.dead);
  game.enemyBullets = game.enemyBullets.filter((b) => !b.dead);
  game.rockets = game.rockets.filter((r) => !r.dead);
  game.enemies = game.enemies.filter((e) => !e.dead);
  game.powerups = game.powerups.filter((pu) => !pu.dead);
  if (game.boss && game.boss.dead) game.boss = null;

  // Ondate: quando è tutto pulito, prossima ondata dopo un cooldown.
  if (game.enemies.length === 0 && !game.boss) {
    game.waveCooldown -= dt;
    if (game.waveCooldown <= 0) {
      spawnWave();
      game.waveCooldown = 2.0;
    }
  }
}

function killEnemy(e) {
  const col = e.color || PALETTE.zigzag;
  game.particles.burst(e.x, e.y, e.isBoss ? col : col, e.isBoss ? 70 : 22);
  game.particles.addShake(e.isBoss ? 22 : 7);
  game.hitStop = Math.max(game.hitStop, e.isBoss ? 0.11 : 0.045);
  sfx.explosion();
  game.combo += 1;
  game.comboTimer = 2.2;
  addScore(e.score, e.x, e.y);
  const chance = e.isBoss ? 1 : 0.13;
  if (Math.random() < chance) {
    game.powerups.push(new PowerUp(e.x, e.y, PowerUp.randomType()));
  }
  if (e.isBoss) advanceLevel();
}

function explodeRocket(r) {
  game.particles.burst(r.x, r.y, PALETTE.flame, 24);
  game.particles.addShake(8);
  sfx.explosion();
  for (const e of game.enemies) {
    if (e.dead) continue;
    const dx = e.x - r.x;
    const dy = e.y - r.y;
    if (dx * dx + dy * dy < 55 * 55 && e.hit(2)) killEnemy(e);
  }
  if (game.boss && !game.boss.dead) {
    const dx = game.boss.x - r.x;
    const dy = game.boss.y - r.y;
    if (dx * dx + dy * dy < 70 * 70 && game.boss.hit(2)) killEnemy(game.boss);
  }
}

function detonateBomb() {
  const p = game.player;
  p.bombs -= 1;
  for (const b of game.enemyBullets) b.dead = true;
  for (const e of game.enemies) {
    if (!e.dead) {
      killEnemy(e);
      e.dead = true;
    }
  }
  if (game.boss && !game.boss.dead && game.boss.hit(8)) killEnemy(game.boss);
  game.particles.burst(p.x, p.y, "#ffffff", 40);
  game.particles.burst(W / 2, H / 2, PALETTE.combo, 46);
  game.particles.addShake(26);
  game.flash = 0.5;
  p.invuln = Math.max(p.invuln, 1.0);
  addPopup(p.x, p.y - 24, "BOMBA!", "#ff9a3f");
  sfx.explosion();
}

function handleCollisions() {
  const p = game.player;

  // Proiettili player vs nemici + boss.
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

  // Razzi vs nemici/boss (esplosione ad area).
  for (const r of game.rockets) {
    if (r.dead) continue;
    let hit = false;
    for (const e of game.enemies) {
      if (!e.dead && circleHit(r, e)) {
        hit = true;
        break;
      }
    }
    if (!hit && game.boss && !game.boss.dead && circleHit(r, game.boss)) hit = true;
    if (hit) {
      explodeRocket(r);
      r.dead = true;
    }
  }

  // Proiettili nemici vs player.
  for (const b of game.enemyBullets) {
    if (!b.dead && circleHit(b, p)) {
      b.dead = true;
      damagePlayer();
    }
  }

  // Nemici che toccano il player.
  for (const e of game.enemies) {
    if (!e.dead && circleHit(e, p)) {
      e.dead = true;
      game.particles.burst(e.x, e.y, e.color, 16);
      damagePlayer();
    }
  }

  // Power-up raccolti.
  for (const pu of game.powerups) {
    if (!pu.dead && circleHit(pu, p)) {
      pu.dead = true;
      p.addPowerup(pu.type);
      game.particles.burst(pu.x, pu.y, PALETTE.shield, 14);
      const label = { power: "ARMA +1", bomb: "BOMBA +1", shield: "SCUDO", life: "VITA +1" }[pu.type];
      addPopup(pu.x, pu.y - 20, label, PALETTE.ui);
      sfx.powerup();
    }
  }
}

function damagePlayer() {
  const p = game.player;
  if (p.invuln > 0) return;
  const result = p.takeHit();
  game.particles.burst(p.x, p.y, PALETTE.player, 22);
  game.particles.addShake(14);
  game.flash = 0.6;
  sfx.hit();
  if (result === "weapon") addPopup(p.x, p.y - 24, "ARMA -1", PALETTE.combo);
  else if (result === "shield") addPopup(p.x, p.y - 24, "SCUDO ROTTO", PALETTE.shield);
  if (result === "dead") game.state = State.GAMEOVER;
}

// ---------- RENDER ----------

function drawStars() {
  const col = game.theme.star;
  for (const s of stars) {
    const tw = 0.6 + 0.4 * Math.sin(bgTime * s.twSpeed + s.tw);
    ctx.globalAlpha = Math.min(1, s.z * tw);
    if (s.size > 2) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = col;
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = col;
      ctx.shadowBlur = 0;
    }
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawPopups() {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold 16px ${FONT_MONO}`;
  for (const p of game.popups) {
    ctx.globalAlpha = Math.min(1, p.life / 0.6);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawHUD() {
  const pl = game.player;
  ctx.textBaseline = "top";
  ctx.shadowBlur = 0;

  // Punteggio + ondata/mondo.
  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.ui;
  ctx.font = `bold 22px ${FONT_MONO}`;
  ctx.fillText(String(game.score).padStart(6, "0"), 16, 12);
  ctx.font = `11px ${FONT_MONO}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText(`ONDATA ${game.wave}  ·  MONDO ${game.level}`, 16, 40);

  // Livello arma (pips).
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText("ARMA", 16, 56);
  for (let i = 0; i < MAX_WEAPON; i++) {
    ctx.fillStyle = i < pl.weaponLevel ? PALETTE.bullet : "rgba(255,255,255,0.18)";
    ctx.fillRect(52 + i * 12, 57, 8, 8);
  }

  // Bombe.
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText("BOMBE", 16, 72);
  for (let i = 0; i < pl.bombs; i++) {
    ctx.fillStyle = "#ff9a3f";
    ctx.shadowColor = "#ff9a3f";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(58 + i * 14, 77, 4, 0, TAU);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  if (pl.shieldTime > 0) {
    ctx.fillStyle = PALETTE.shield;
    ctx.fillText(`SCUDO ${Math.ceil(pl.shieldTime)}s`, 16, 90);
  }

  // Record + vite a destra.
  ctx.textAlign = "right";
  ctx.fillStyle = PALETTE.uiDim;
  ctx.font = `11px ${FONT_MONO}`;
  ctx.fillText(`RECORD ${String(game.highScore).padStart(6, "0")}`, W - 16, 14);
  for (let i = 0; i < pl.lives; i++) {
    const x = W - 24 - i * 24;
    const y = 44;
    ctx.fillStyle = PALETTE.player;
    ctx.shadowColor = PALETTE.player;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 7, y + 7);
    ctx.lineTo(x - 7, y + 7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Combo al centro in alto, con barra del timer.
  if (game.combo >= 2) {
    const mult = comboMultiplier(game.combo);
    const t = Math.max(0, Math.min(1, game.comboTimer / 2.2));
    ctx.textAlign = "center";
    ctx.fillStyle = PALETTE.combo;
    ctx.shadowColor = PALETTE.combo;
    ctx.shadowBlur = 12;
    const size = mult > 1 ? 22 + Math.sin(bgTime * 10) * 2 : 18;
    ctx.font = `bold ${size}px ${FONT_MONO}`;
    ctx.fillText(`COMBO ${game.combo}  x${mult}`, W / 2, 12);
    ctx.shadowBlur = 0;
    const bw = 170;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(W / 2 - bw / 2, 42, bw, 4);
    ctx.fillStyle = PALETTE.combo;
    ctx.fillRect(W / 2 - bw / 2, 42, bw * t, 4);
  }
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
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillText(b.text, W / 2, H * 0.3);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawCenteredText(lines) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((l) => {
    ctx.fillStyle = l.color || PALETTE.ui;
    ctx.shadowColor = l.color || PALETTE.player;
    ctx.shadowBlur = l.glow ? 24 : 0;
    ctx.font = l.font || `20px ${FONT}`;
    ctx.fillText(l.text, W / 2, l.y);
  });
  ctx.shadowBlur = 0;
}

function render() {
  ctx.drawImage(bgCanvas, 0, 0);

  ctx.save();
  game.particles.applyShake(ctx);

  drawStars();

  if (game.state === State.PLAY || game.state === State.GAMEOVER) {
    for (const b of game.playerBullets) b.draw(ctx);
    for (const b of game.enemyBullets) b.draw(ctx);
    for (const r of game.rockets) r.draw(ctx);
    for (const e of game.enemies) e.draw(ctx);
    if (game.boss) game.boss.draw(ctx);
    for (const pu of game.powerups) pu.draw(ctx);
    game.particles.draw(ctx);
    if (game.state === State.PLAY) game.player.draw(ctx);
  }
  drawPopups();

  ctx.restore();

  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (game.state === State.PLAY) {
    drawHUD();
    drawBanner();
  }

  if (game.state === State.MENU) {
    drawCenteredText([
      { text: "NEON SPACE SHOOTER", y: H / 2 - 80, font: `bold 46px ${FONT}`, color: PALETTE.player, glow: true },
      { text: "Premi un tasto o clicca per iniziare", y: H / 2 - 6, color: PALETTE.ui },
      { text: "Muoviti: frecce/WASD o mouse · Spara: Spazio/click · Bomba: B", y: H / 2 + 30, font: `13px ${FONT}`, color: PALETTE.uiDim },
      { text: "Raccogli POWER per potenziare l'arma (fino ai razzi). Se colpito, scendi di livello.", y: H / 2 + 54, font: `13px ${FONT}`, color: PALETTE.uiDim },
      { text: "Incatena le uccisioni: la COMBO moltiplica i punti fino a x5!", y: H / 2 + 80, font: `13px ${FONT}`, color: PALETTE.combo },
    ]);
  } else if (game.state === State.GAMEOVER) {
    drawCenteredText([
      { text: "GAME OVER", y: H / 2 - 60, font: `bold 48px ${FONT}`, color: PALETTE.boss, glow: true },
      { text: `Punteggio: ${game.score}`, y: H / 2, font: `24px ${FONT}`, color: PALETTE.ui },
      { text: `Mondo raggiunto: ${game.level} · Record: ${game.highScore}`, y: H / 2 + 34, color: PALETTE.combo },
      { text: "Premi un tasto o clicca per riprovare", y: H / 2 + 78, color: PALETTE.uiDim },
    ]);
  }
}

// ---------- LOOP + hook di sviluppo ----------

const params = new URLSearchParams(location.search);

if (params.get("autostart") === "1") {
  startPlaying();
  spawnWave();
}

// ?level=N: anteprima di un mondo con una creatura di ogni tipo + boss.
const lvl = parseInt(params.get("level"), 10);
if (params.get("showcase") === "1" || lvl >= 1) {
  startPlaying();
  if (lvl >= 1) {
    game.level = lvl;
    game.theme = worldForLevel(lvl);
    buildBackground(game.theme);
  }
  const th = game.theme;
  const mk = (type, x) => {
    const e = new Enemy(type, x, W, 0, th.enemy[type], 1);
    e.y = 220;
    e.speed = 0;
    return e;
  };
  game.enemies.push(mk("straight", 160), mk("zigzag", 320), mk("shooter", 480));
  game.boss = new Boss(W, game.level, th.boss, 1);
  game.boss.entering = false;
  game.boss.y = 430;
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
