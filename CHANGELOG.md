# Changelog

Tutte le modifiche rilevanti del progetto sono documentate qui.
Il formato segue una versione semplificata di [Keep a Changelog](https://keepachangelog.com/it/).

## [0.1.0] — 2026-07-02

Prima versione giocabile di **Neon Space Shooter**.

### Aggiunto
- Game loop e macchina a stati (menu → gioco → game over) in `js/main.js`.
- Navicella del giocatore con controllo **tastiera e mouse**, sparo con cooldown,
  3 vite, invulnerabilità temporanea dopo un colpo (`js/player.js`).
- Tre tipi di nemici — dritto, zigzag, sparatore — con spawn a ondate crescenti
  (`js/enemies.js`).
- **Boss** ogni 5 ondate, con barra vita e pattern di colpi a ventaglio.
- Proiettili di player e nemici (`js/bullets.js`).
- Power-up: triplo colpo, scudo, vita extra (`js/powerups.js`).
- Sistema di particelle + screen shake per il "game juice" (`js/particles.js`).
- Suoni sintetizzati con la Web Audio API, senza file audio (`js/audio.js`).
- Punteggio e record persistente su `localStorage`.
- Sfondo con stelle in parallasse.

### Test
- Test unitari sulla logica pura (`clamp`, `rand`, `randInt`, `choose`, `circleHit`)
  in `tests/utils.test.js` — eseguibili con `npm test`.
- **Da testare a mano nel browser**: rendering su canvas, feel del gameplay, audio.

### Strumenti
- Aggiunti tre agenti di sviluppo in `.claude/agents/`: `feature-scout`,
  `regression-tester`, `test-author`.
- Aggiunto il meta-agente `game-director`: valuta le dimensioni di qualità del gioco,
  decide autonomamente quali agenti specialisti servono, li crea se mancano e ne
  orchestra il lavoro verso un gioco qualitativamente perfetto.
