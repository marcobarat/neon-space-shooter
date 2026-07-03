# Changelog

Tutte le modifiche rilevanti del progetto sono documentate qui.
Il formato segue una versione semplificata di [Keep a Changelog](https://keepachangelog.com/it/).

## [0.2.0] — 2026-07-03

### Armi, razzi e bombe (contro la noia delle armi a timer)
- **Armi a livelli persistenti** (`js/player.js`): raccogli **Power** e sali
  (singolo → doppio → triplo → spread a 5 vie → **razzi a ricerca**). Niente timer:
  le armi restano finché non vieni colpito, e allora **scendi di un livello** (perdi
  una vita solo a livello 0). `shotPattern()` è puro e testato.
- **Razzi a ricerca** (`js/rockets.js`): al livello arma massimo la navicella lancia
  missili homing che curvano verso il nemico più vicino ed esplodono ad area.
- **Bombe a scorta**: le accumuli (HUD), le detoni col tasto **B/Shift** → ripuliscono
  lo schermo dai proiettili e infliggono danno a tutti (`js/main.js`, `js/input.js`).

### Mondi a tema (contro "sempre uguale")
- Nuovo `js/worlds.js`: 5 mondi che ciclano — Nebulosa Viola, Cintura d'Asteroidi,
  Ghiaccio Cosmico, Inferno Stellare, Vuoto Profondo. Dopo ogni boss si **cambia
  mondo**: sfondo, colori di mostri e boss cambiano (banner "MONDO X").
- `js/creatures.js` e `js/enemies.js` usano il colore del mondo per ogni creatura.

### Difficoltà e power-up
- **Difficoltà in salita**: velocità e cadenza di fuoco crescono con ondate/livelli.
- **Combo estesa a x5** (`comboMultiplier` in `js/utils.js`, testata).
- Power-up ridisegnati con icone distinte: Power, Bomba, Scudo, Vita (drop pesati).
- HUD: livello arma (pips), contatore bombe, mondo corrente. Hook `?level=N` per
  l'anteprima di ogni mondo.
- Nuovi test in `tests/gameplay.test.js` (armi, combo, mondi, targeting razzi).

## [0.1.0] — creature e prima grafica neon (storico)

### Creature spaziali + bilanciamento boss
- I nemici non sono più forme geometriche ma vere **creature spaziali** animate
  (nuovo modulo `js/creatures.js`): medusa aliena (straight), falena/pipistrello
  spaziale con ali che sbattono (zigzag), occhio fluttuante con tentacoli e blink
  (shooter), e un **kraken/cervello a un occhio** per il boss.
- **Boss ribilanciato** (era imbattibile): meno HP (`32 + 9·livello`), fase 2 solo
  sotto il 33% di vita, spirale più rada e lenta, ventaglio più stretto e proiettili
  più lenti (`js/enemies.js`).
- Hook di sviluppo `?showcase=1` per vedere tutte le creature + boss (screenshot).

### Grafica (contro l'aspetto "banale")
- Nuova palette neon centrale in `js/palette.js`, usata al posto degli hex sparsi.
- Sfondo vivo: nebulosa a gradiente (canvas offscreen) + stelle su 3 layer con
  parallasse e twinkle, al posto dei "puntini su nero" (`js/main.js`).
- Glow a strati e gradienti su navicella, nemici e boss; muzzle flash e rinculo
  sullo sparo (`js/player.js`, `js/enemies.js`).
- Proiettili con scia luminosa (`js/bullets.js`).
- HUD ridisegnato a tema (monospace, punteggio grande, vite luminose).

### Divertimento / varietà (contro la "noia")
- Sistema **combo/moltiplicatore**: uccisioni in catena aumentano la combo
  (x1 → x1.5 → x2 → x3) con score-pop fluttuanti e barra del timer (`js/main.js`).
- **Hit-stop**: micro-freeze del gameplay a ogni uccisione per dare peso ai colpi.
- **Varianti di pattern** per i tre tipi di nemico (deriva, accelerazione, raffica)
  e **boss a due fasi** con spirale di proiettili sotto il 40% di vita (`js/enemies.js`).
- Hook di sviluppo `?autostart=1` per avviare subito una partita (test/screenshot).

### Strumenti
- Il `game-director` ha valutato lo stato del gioco a fronte del feedback del proprietario
  ("carino ma estremamente noioso e graficamente banale") e ha creato due nuovi agenti
  specialisti in `.claude/agents/`:
  - `juice-designer` — game feel/juice e varietà, per rendere il gioco meno noioso
    (impatto dei colpi, combo/moltiplicatore, pattern e ritmo delle ondate).
  - `visual-artist` — direzione artistica neon in canvas 2D (glow a strati, gradienti,
    sfondo vivo, trail), per superare l'aspetto grafico banale.
- Aggiornata la tabella agenti nel `README.md`.

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
