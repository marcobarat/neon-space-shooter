# Changelog

Tutte le modifiche rilevanti del progetto sono documentate qui.
Il formato segue una versione semplificata di [Keep a Changelog](https://keepachangelog.com/it/).

## [0.5.0] — 2026-07-08 — Update "Bestiario"

### Mostri ridisegnati DA ZERO, unici per mondo (`js/bestiary/`)
- Via il sistema a kit (skins.js decorava gli stessi 8 scheletri): ora ogni mondo
  ha il SUO bestiario — 23 creature disegnate da zero, base scura + accenti
  (niente "blob luminoso"), corpi multi-parte e animazione secondaria.
- **Nebulosa** (cartoon-dark): Ombra Golosa (imp a goccia con dentoni), Falenotte
  (falena-pipistrello), Sputafuoco (rospo-cannone con occhi su peduncoli),
  Urlo Cadente (teschio-cometa con afterimage).
- **Asteroidi** (robot di rottami): Bidone-7 (barile con gambe a pistone),
  Sfarfaglio (aliante asimmetrico con LED), Mastodonte (corazzato con fornace e
  radar), Ariete (missile riciclato che trema accelerando).
- **Ghiaccio** (costrutti cristallini): Vespa di Brina (ali-lama a scatto),
  Prisma (schegge orbitanti che si allineano prima dello sparo), Ago del Gelo
  (canna cristallina), Geode (due metà che respirano → si legge che si divide).
- **Inferno** (demoni): Bracino (sorriso luminoso a denti scuri), Bocca di
  Vulcano (cratere-mortaio che si carica), Diavolo Tuffatore (testa cornuta in
  picchiata), Cuore Ustionante (riccio di magma col teschietto inciso).
- **Vuoto** (entità digitali): Monolite (lastra con cubi d'angolo fluttuanti),
  Pupilla del Vuoto (canna a rotaia di dati), Dittico (due celle col ponte
  glitch), Glitch Statico (rombo d'errore con chevron warning), Frammento
  Ostile (chevron con aberrazione cromatica), Relitto Corrotto.
- Dispatch per (mondo, tipo) con fallback cross-mondo; corpi statici cotti in
  sprite (spritecache), parti vive senza shadowBlur. `debug-bestiary.html`
  mostra l'intero foglio creature per l'iterazione artistica.

### 🪨 Asteroidi frantumabili (`js/enemies.js`, `js/main.js`, `js/worlds.js`)
- Nuovo nemico **asteroide** (grande, lento, ruota e deriva) nei pool di
  Cintura d'Asteroidi e Vuoto Profondo: alla morte si spezza in 2-3 **schegge**,
  ogni scheggia in 2 **sassi** veloci (catena `SPLITS`, generalizza lo splitter).
  Le vene di minerale luminose ne disegnano le linee di frattura. Drop powerup
  ridotto sui frammenti.

### 🛡 Super che distruggono i proiettili nemici
- Il **laser** vaporizza i colpi nemici nella sua colonna (scintille incluse).
- I **droni orbitali** bloccano i colpi al contatto (r=9): ora sono anche scudo.
  (Nova e bomba già ripulivano lo schermo.)

### Pulizia
- Eliminati js/skins.js e il vecchio strato "materiali"; creatures.js ridotto ai
  soli helper dei boss (glowFill/rim/eye/drawBoss); boss migrati agli occhi del
  bestiario (lente/glifo/fessura/anello). Test: 35 verdi (nuovo bestiary.test.js).

## [0.4.0] — 2026-07-06 — Update "Retrò-Moderno 2026"

### Mostri con design diverso per mondo (`js/skins.js`, `js/creatures.js`)
- **Shape kit per mondo**: BIO (Nebulosa), SCRAP (Asteroidi), CRYSTAL (Ghiaccio),
  MAGMA (Inferno), VOID (Vuoto). Cambiano la **geometria**, non solo il colore:
  arti (tentacoli / cavi rigidi / spuntoni di ghiaccio / filamenti di fuoco /
  linee-dati), silhouette (curve organiche → faccette via `hard`), dettagli sul
  perimetro (piastre+bulloni, schegge, creste ardenti, archi glitch) e ampiezza
  delle animazioni (`wobble`).
- **Occhi per mondo** (`eyeFor`): bio, lente robotica, glifo cristallino,
  fessura ardente, anello digitale. Il vecchio overlay `applyMaterial` ora
  delega ai kit.

### Boss ridisegnati (`js/bosses.js`)
- **Kraken**: membrana traslucida, solchi-cervello pulsanti, occhi minori in furia.
- **Serpente**: coda a dischi corazzati + telegraph di luce coda→testa, muso blindato.
- **Fortezza**: giunture dei pannelli, cannoni distrutti **congelati** (leggi i danni),
  lente rossa solo quando spara.
- **Regina Alveare**: nido d'ape vero, le celle si accendono prima dello sciame.
- **Nucleo Laser**: anelli olografici controrotanti (+veloci nel fuoco), linee
  d'energia risucchiate in carica.

### Sfondi "retrò-moderni" (`js/scene.js`, `js/main.js`, `js/worlds.js`, `js/galaxy3d.js`)
- Rampe **duotone** per mondo (`bgMid`) + **dither ordinato** Bayer 8×8 cotto.
- **Grana filmica** animata (1 pattern-fill a frame) sopra 3D e 2D.
- **Parallasse a 2 profondità**: layer FAR per scena (silhouette di asteroidi,
  colonne di brace, monoliti, foschie) che risponde al movimento del player.
- Galassia three.js: densità per device (4500 mobile / 12000 desktop), **texture
  punto morbida** (bloom gratis), **transizione colori fluida** tra mondi.

### Performance (`js/spritecache.js`)
- Corpi statici dei nemici cotti in **sprite offscreen ×2** (fill volumetrico +
  rim shadowBlur pagati una volta); gradienti `glowFill` **memoizzati**; cache
  svuotata al cambio mondo; flag di rollback `USE_SPRITES`.

### 🔥 Daily Challenge (`js/daily.js`)
- **Sfida del giorno** stile Wordle: seed dalla data → **stesse ondate per tutti**
  (spawn deterministici), punteggio del giorno + **streak** di giorni consecutivi
  in `localStorage`. Dal menu: tasto **G** o pulsante 🔥 su touch.
- **Flex Card dedicata**: badge "SFIDA DEL g/m · STREAK n" e testo di condivisione
  "stesso seed per tutti, battimi".

### Test
- Nuovi test: shape kit (`tests/skins.test.js`), PRNG deterministico `seeded`
  (spostato in `utils.js`), Daily Challenge (`tests/daily.test.js`). 35 verdi.

## [0.3.0] — 2026-07-03 — Update "Epico"

### Nuovi mostri (`js/enemies.js`, `js/creatures.js`)
- **tank** (asteroide corazzato), **kamikaze** (si tuffa sul player), **splitter**
  (si divide alla morte in 2 splitling), **sniper** (mirino telegrafato + colpo veloce),
  **mine** (esplode in un anello di proiettili). Pool di nemici per mondo in `worlds.js`.

### Boss unici per mondo (`js/bosses.js`)
- 5 archetipi diversi, uno per mondo: **Kraken** (spirale), **Serpente** (segmenti),
  **Fortezza** (cannoni che si distruggono), **Regina Alveare** (genera sciami),
  **Nucleo Laser** (spazza un fascio). Factory `createBoss`.

### Super-armi / ultimate (`js/supers.js`)
- 5 super con **icona unica**: laser, rallenta-tempo, droni orbitali, nova, missili.
- **Slot singolo**: si carica coi kill **e** cade come pickup raro; una nuova
  **sovrascrive** quella non usata. Attivazione col tasto **E**.

### Sfondo galassia vivo (`js/scene.js`)
- Scena animata diversa per mondo: galassia a spirale, campo di asteroidi, aurore,
  braci, vuoto con galassie lontane — con parallasse e movimento.

### Arte, schermate, mobile
- **Navicella che cambia forma a ogni livello arma** (L0→L4).
- Menu e **Game Over ridisegnati** (game-over con lockout anti-restart + statistiche run).
- **Pausa** (tasto P/Esc + pulsante ⏸).
- **Layout verticale (portrait) responsive** + **controlli touch** (trascina per muoverti,
  auto-fire, pulsanti a schermo Bomba/Super/Pausa) — giocabile su telefono.
- **Difficoltà anticipata**, combo fino a x5, agente `mobile-tester`, nuovi test.

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
