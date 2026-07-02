// Game loop principale e macchina a stati (menu / gioco / game over).
import { rand, randInt, circleHit, TAU } from "./utils.js";
import { initInput, input, consumeStart, onFirstInteraction } from "./input.js";
import { unlockAudio, sfx } from "./audio.js";
import { Player } from "./player.js";
import { Enemy, Boss } from "./enemies.js";
import { PowerUp } from "./powerups.js";
import { ParticleSystem } from "./particles.js";
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
    tw: rand(0, TAU),      // fase del twinkle
    twSpeed: rand(1.5, 4), // velocità del twinkle
  };
});

// Nebulosa di sfondo disegnata UNA volta su un canvas offscreen (performance).
const bgCanvas = document.createElement("canvas");
bgCanvas.width = W;
bgCanvas.height = H;
(function buildBackground() {
  const bg = bgCanvas.getContext("2d");
  const grad = bg.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, PALETTE.bgTop);
  grad.addColorStop(1, PALETTE.bgBottom);
  bg.fillStyle = grad;
  bg.fillRect(0, 0, W, H);
  // Macchie di nebulosa (radial gradient) per dare profondità e colore.
  const blobs = [
    { x: W * 0.25, y: H * 0.3, r: 320, c: PALETTE.nebulaA },
    { x: W * 0.8, y: H * 0.2, r: 280, c: PALETTE.nebulaB },
    { x: W * 0.6, y: H * 0.75, r: 360, c: PALETTE.nebulaC },
    { x: W * 0.1, y: H * 0.85, r: 240, c: PALETTE.nebulaB },
  ];
  for (const b of blobs) {
    const g = bg.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, b.c);
    g.addColorStop(1, "rgba(0,0,0,0)");
    bg.fillStyle = g;
    bg.beginPath();
    bg.arc(b.x, b.y, b.r, 0, TAU);
    bg.fill();
  }
})();

let bgTime = 0; // tempo globale per il twinkle

let game;

function newGame() {
  return {
    state: State.MENU,
    player: new Player(W, H),
    enemies: [],
    playerBullets: [],
    enemyBullets: [],
    powerups: [],
    particles: new ParticleSystem(),
    score: 0,
    wave: 0,
    waveCooldown: 1.2,
    boss: null,
    highScore: Number(localStorage.getItem(HS_KEY) || 0),
    flash: 0,       // flash bianco schermo quando il player viene colpito
    combo: 0,       // uccisioni in catena
    comboTimer: 0,  // tempo rimasto prima che la combo scada
    hitStop: 0,     // freeze breve del gameplay per dare "peso" ai colpi
    popups: [],     // scritte fluttuanti (punteggio, combo)
  };
}

// Moltiplicatore in base alla combo: x1, x1.5 (5), x2 (10), x3 (20)...
function comboMult() {
  const c = game.combo;
  if (c >= 20) return 3;
  if (c >= 10) return 2;
  if (c >= 5) return 1.5;
  return 1;
}

function addPopup(x, y, text, color) {
  game.popups.push({ x, y, text, color, life: 0.9, vy: -46 });
}
game = newGame();

function startPlaying() {
  const hs = game.highScore;
  game = newGame();
  game.highScore = hs;
  game.state = State.PLAY;
}

function spawnWave() {
  game.wave += 1;
  // Ogni 5 ondate: boss.
  if (game.wave % 5 === 0) {
    game.boss = new Boss(W, game.wave / 5);
    sfx.boss();
    return;
  }
  const count = Math.min(4 + game.wave, 14);
  const types = ["straight"];
  if (game.wave >= 2) types.push("zigzag");
  if (game.wave >= 3) types.push("shooter");
  for (let i = 0; i < count; i++) {
    const type = types[randInt(0, types.length - 1)];
    const x = rand(50, W - 50);
    // Dalla 3ª ondata compaiono varianti (pattern alternativo) con prob. crescente.
    const variant = game.wave >= 3 && Math.random() < 0.4 ? 1 : 0;
    const e = new Enemy(type, x, W, variant);
    e.y = -30 - rand(0, 300); // sfalsati in verticale
    game.enemies.push(e);
  }
}

// Aggiunge punteggio applicando il moltiplicatore combo; mostra uno score-pop.
function addScore(base, x, y) {
  const mult = comboMult();
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

  // Scritte fluttuanti (score-pop): vivono anche fuori dallo stato PLAY.
  for (const pu of game.popups) {
    pu.y += pu.vy * dt;
    pu.vy *= 0.9;
    pu.life -= dt;
  }
  game.popups = game.popups.filter((p) => p.life > 0);

  if (game.state !== State.PLAY) {
    if (consumeStart()) {
      if (game.state === State.MENU || game.state === State.GAMEOVER) startPlaying();
    }
    return;
  }

  // Hit-stop: congela brevemente il gameplay per dare peso ai colpi/kill.
  if (game.hitStop > 0) {
    game.hitStop = Math.max(0, game.hitStop - dt);
    return;
  }

  // Decadimento della combo.
  if (game.combo > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;
  }

  const p = game.player;
  p.update(dt, game.playerBullets);

  // Proiettili.
  for (const b of game.playerBullets) b.update(dt, W, H);
  for (const b of game.enemyBullets) b.update(dt, W, H);

  // Nemici.
  for (const e of game.enemies) e.update(dt, game.enemyBullets, p.x);
  if (game.boss) game.boss.update(dt, game.enemyBullets, p.x);

  // Power-up.
  for (const pu of game.powerups) pu.update(dt, H);

  handleCollisions();

  // Pulizia.
  game.playerBullets = game.playerBullets.filter((b) => !b.dead);
  game.enemyBullets = game.enemyBullets.filter((b) => !b.dead);
  game.enemies = game.enemies.filter((e) => !e.dead);
  game.powerups = game.powerups.filter((pu) => !pu.dead);
  if (game.boss && game.boss.dead) game.boss = null;

  // Gestione ondate: quando tutto è pulito, prossima ondata dopo un cooldown.
  if (game.enemies.length === 0 && !game.boss) {
    game.waveCooldown -= dt;
    if (game.waveCooldown <= 0) {
      spawnWave();
      game.waveCooldown = 2.0;
    }
  }
}

function killEnemy(e) {
  game.particles.burst(e.x, e.y, e.isBoss ? PALETTE.boss : PALETTE.zigzag, e.isBoss ? 70 : 22);
  game.particles.addShake(e.isBoss ? 22 : 7);
  game.hitStop = Math.max(game.hitStop, e.isBoss ? 0.11 : 0.045); // peso del colpo
  sfx.explosion();
  // Combo: sale a ogni kill, si azzera se passa troppo tempo tra un kill e l'altro.
  game.combo += 1;
  game.comboTimer = 2.2;
  addScore(e.score, e.x, e.y);
  // Chance di drop power-up.
  const chance = e.isBoss ? 1 : 0.12;
  if (Math.random() < chance) {
    game.powerups.push(new PowerUp(e.x, e.y, PowerUp.randomType()));
  }
}

function handleCollisions() {
  const p = game.player;

  // Proiettili player vs nemici + boss.
  for (const b of game.playerBullets) {
    if (b.dead) continue;
    for (const e of game.enemies) {
      if (!e.dead && circleHit(b, e)) {
        b.dead = true;
        game.particles.burst(b.x, b.y, "#7df9ff", 5);
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
      game.particles.burst(e.x, e.y, "#ffd23f", 16);
      damagePlayer();
    }
  }

  // Power-up raccolti.
  for (const pu of game.powerups) {
    if (!pu.dead && circleHit(pu, p)) {
      pu.dead = true;
      p.addPowerup(pu.type);
      game.particles.burst(pu.x, pu.y, "#4dffa6", 14);
      sfx.powerup();
    }
  }
}

function damagePlayer() {
  const p = game.player;
  if (p.invuln > 0) return;
  const survived = p.takeHit();
  game.particles.burst(p.x, p.y, "#00e5ff", 22);
  game.particles.addShake(14);
  game.flash = 0.6;
  sfx.hit();
  if (!survived) {
    game.state = State.GAMEOVER;
  }
}

// ---------- RENDER ----------

function drawStars() {
  for (const s of stars) {
    const tw = 0.6 + 0.4 * Math.sin(bgTime * s.twSpeed + s.tw);
    ctx.globalAlpha = Math.min(1, s.z * tw);
    if (s.size > 2) {
      ctx.fillStyle = PALETTE.starBright;
      ctx.shadowColor = PALETTE.star;
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = PALETTE.star;
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
  ctx.textBaseline = "top";
  ctx.shadowBlur = 0;

  // Punteggio (grande, monospace) + ondata.
  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.ui;
  ctx.font = `bold 22px ${FONT_MONO}`;
  ctx.fillText(String(game.score).padStart(6, "0"), 16, 12);
  ctx.font = `11px ${FONT_MONO}`;
  ctx.fillStyle = PALETTE.uiDim;
  ctx.fillText(`ONDATA ${game.wave}`, 16, 40);

  // Record + vite a destra.
  ctx.textAlign = "right";
  ctx.fillStyle = PALETTE.uiDim;
  ctx.font = `11px ${FONT_MONO}`;
  ctx.fillText(`RECORD ${String(game.highScore).padStart(6, "0")}`, W - 16, 14);
  for (let i = 0; i < game.player.lives; i++) {
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
    const mult = comboMult();
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

  // Power-up attivi.
  let py = 58;
  ctx.textAlign = "left";
  ctx.font = `11px ${FONT_MONO}`;
  if (game.player.tripleTime > 0) {
    ctx.fillStyle = PALETTE.triple;
    ctx.fillText(`TRIPLO ${Math.ceil(game.player.tripleTime)}s`, 16, py);
    py += 16;
  }
  if (game.player.shieldTime > 0) {
    ctx.fillStyle = PALETTE.shield;
    ctx.fillText(`SCUDO ${Math.ceil(game.player.shieldTime)}s`, 16, py);
  }
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
  // Sfondo statico (nebulosa) disegnato dal canvas offscreen: niente black edges.
  ctx.drawImage(bgCanvas, 0, 0);

  ctx.save();
  game.particles.applyShake(ctx);

  drawStars();

  if (game.state === State.PLAY || game.state === State.GAMEOVER) {
    for (const b of game.playerBullets) b.draw(ctx);
    for (const b of game.enemyBullets) b.draw(ctx);
    for (const e of game.enemies) e.draw(ctx);
    if (game.boss) game.boss.draw(ctx);
    for (const pu of game.powerups) pu.draw(ctx);
    game.particles.draw(ctx);
    if (game.state === State.PLAY) game.player.draw(ctx);
  }
  drawPopups();

  ctx.restore();

  // Flash bianco quando colpito (contenuto per accessibilità).
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (game.state === State.PLAY) drawHUD();

  if (game.state === State.MENU) {
    drawCenteredText([
      { text: "NEON SPACE SHOOTER", y: H / 2 - 70, font: `bold 46px ${FONT}`, color: PALETTE.player, glow: true },
      { text: "Premi un tasto o clicca per iniziare", y: H / 2 + 10, color: PALETTE.ui },
      { text: "Frecce/WASD o mouse per muoverti — Spazio o click per sparare", y: H / 2 + 44, font: `13px ${FONT}`, color: PALETTE.uiDim },
      { text: "Incatena le uccisioni per far salire la COMBO e moltiplicare i punti!", y: H / 2 + 70, font: `13px ${FONT}`, color: PALETTE.combo },
    ]);
  } else if (game.state === State.GAMEOVER) {
    drawCenteredText([
      { text: "GAME OVER", y: H / 2 - 60, font: `bold 48px ${FONT}`, color: PALETTE.boss, glow: true },
      { text: `Punteggio: ${game.score}`, y: H / 2, font: `24px ${FONT}`, color: PALETTE.ui },
      { text: `Record: ${game.highScore}`, y: H / 2 + 34, color: PALETTE.combo },
      { text: "Premi un tasto o clicca per riprovare", y: H / 2 + 78, color: PALETTE.uiDim },
    ]);
  }
}

// ---------- LOOP ----------

// Hook di sviluppo: ?autostart=1 salta al gioco e lancia subito un'ondata
// (comodo per screenshot/test automatici, innocuo per il giocatore).
if (new URLSearchParams(location.search).get("autostart") === "1") {
  startPlaying();
  spawnWave();
}

// Hook di sviluppo: ?showcase=1 mostra una di ogni creatura + il boss, ferme,
// per verificare l'arte (screenshot). Non usato in gioco normale.
if (new URLSearchParams(location.search).get("showcase") === "1") {
  startPlaying();
  const e1 = new Enemy("straight", 160, W, 0); e1.y = 220; e1.speed = 0;
  const e2 = new Enemy("zigzag", 320, W, 0); e2.y = 220; e2.speed = 0;
  const e3 = new Enemy("shooter", 480, W, 0); e3.y = 220; e3.speed = 0;
  game.enemies.push(e1, e2, e3);
  game.boss = new Boss(W, 1);
  game.boss.entering = false;
  game.boss.y = 420;
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
