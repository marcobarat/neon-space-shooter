// Game loop principale e macchina a stati (menu / gioco / game over).
import { rand, randInt, circleHit, TAU } from "./utils.js";
import { initInput, input, consumeStart, onFirstInteraction } from "./input.js";
import { unlockAudio, sfx } from "./audio.js";
import { Player } from "./player.js";
import { Enemy, Boss } from "./enemies.js";
import { PowerUp } from "./powerups.js";
import { ParticleSystem } from "./particles.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

initInput(canvas);
onFirstInteraction(unlockAudio);

const HS_KEY = "neon_space_shooter_highscore";
const State = { MENU: "menu", PLAY: "play", GAMEOVER: "gameover" };

// Stelle di sfondo in parallasse (persistono tra gli stati).
const stars = Array.from({ length: 90 }, () => ({
  x: rand(0, W),
  y: rand(0, H),
  z: rand(0.3, 1),
}));

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
    flash: 0, // flash bianco schermo quando il player viene colpito
  };
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
    const e = new Enemy(type, x, W);
    e.y = -30 - rand(0, 300); // sfalsati in verticale
    game.enemies.push(e);
  }
}

function addScore(n) {
  game.score += n;
  if (game.score > game.highScore) {
    game.highScore = game.score;
    localStorage.setItem(HS_KEY, String(game.highScore));
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
  updateStars(dt);
  game.particles.update(dt);
  game.flash = Math.max(0, game.flash - dt * 3);

  if (game.state !== State.PLAY) {
    if (consumeStart()) {
      if (game.state === State.MENU || game.state === State.GAMEOVER) startPlaying();
    }
    return;
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
  game.particles.burst(e.x, e.y, e.isBoss ? "#ff3860" : "#ffd23f", e.isBoss ? 60 : 20);
  game.particles.addShake(e.isBoss ? 20 : 6);
  sfx.explosion();
  addScore(e.score);
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
    ctx.globalAlpha = s.z;
    ctx.fillStyle = "#9fbfff";
    ctx.fillRect(s.x, s.y, s.z * 2, s.z * 2);
  }
  ctx.globalAlpha = 1;
}

function drawHUD() {
  ctx.fillStyle = "#cde";
  ctx.font = "16px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`PUNTI ${game.score}`, 16, 14);
  ctx.fillText(`ONDATA ${game.wave}`, 16, 36);

  // Vite come piccole navicelle.
  ctx.textAlign = "right";
  ctx.fillText(`RECORD ${game.highScore}`, W - 16, 14);
  for (let i = 0; i < game.player.lives; i++) {
    const x = W - 24 - i * 26;
    const y = 44;
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 7, y + 7);
    ctx.lineTo(x - 7, y + 7);
    ctx.closePath();
    ctx.fill();
  }

  if (game.player.tripleTime > 0) {
    ctx.fillStyle = "#7df9ff";
    ctx.textAlign = "left";
    ctx.fillText(`TRIPLO ${Math.ceil(game.player.tripleTime)}s`, 16, 60);
  }
}

function drawCenteredText(lines) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((l) => {
    ctx.fillStyle = l.color || "#cde";
    ctx.shadowColor = l.color || "#7df9ff";
    ctx.shadowBlur = l.glow ? 20 : 0;
    ctx.font = l.font || "20px system-ui, sans-serif";
    ctx.fillText(l.text, W / 2, l.y);
  });
  ctx.shadowBlur = 0;
}

function render() {
  ctx.clearRect(0, 0, W, H);
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

  ctx.restore();

  // Flash bianco quando colpito.
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.4})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (game.state === State.PLAY) drawHUD();

  if (game.state === State.MENU) {
    drawCenteredText([
      { text: "NEON SPACE SHOOTER", y: H / 2 - 70, font: "bold 44px system-ui, sans-serif", color: "#00e5ff", glow: true },
      { text: "Premi un tasto o clicca per iniziare", y: H / 2 + 10, color: "#cde" },
      { text: "Frecce/WASD o mouse per muoverti — Spazio o click per sparare", y: H / 2 + 44, font: "14px system-ui, sans-serif", color: "#7a8bb0" },
    ]);
  } else if (game.state === State.GAMEOVER) {
    drawCenteredText([
      { text: "GAME OVER", y: H / 2 - 60, font: "bold 46px system-ui, sans-serif", color: "#ff3860", glow: true },
      { text: `Punteggio: ${game.score}`, y: H / 2, font: "24px system-ui, sans-serif", color: "#cde" },
      { text: `Record: ${game.highScore}`, y: H / 2 + 34, color: "#ffd23f" },
      { text: "Premi un tasto o clicca per riprovare", y: H / 2 + 78, color: "#7a8bb0" },
    ]);
  }
}

// ---------- LOOP ----------

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
