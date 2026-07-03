# 🚀 Neon Space Shooter

Uno **space shooter arcade 2D** in stile neon, scritto in **canvas + JavaScript vanilla**.
Nessuna dipendenza, nessun asset da scaricare: tutto è disegnato con forme geometriche e
i suoni sono sintetizzati con la Web Audio API. Semplice ma con tanto *game juice*
(particelle, screen shake, glow, suoni).

## 🎮 Come si gioca

- **Desktop** — Movimento: frecce/WASD o mouse · Spara: Spazio/click · **Bomba: B** ·
  **Super: E** · **Pausa: P/Esc**
- **Mobile** — trascina per muoverti (fuoco automatico) · pulsanti a schermo **B** (bomba),
  **S** (super), **⏸** (pausa)
- Raccogli **Power** per potenziare l'arma (fino ai razzi). Se colpito scendi di un
  livello arma; perdi una vita solo a livello base.
- Carica la **super** coi kill (o raccoglila): attivala col tasto **E**/pulsante S.
- Batti il boss per passare al **mondo successivo**: scenario, mostri e boss cambiano.
- Incatena le uccisioni: la **combo** moltiplica i punti fino a **x5**.

### Avvio in locale

Gli ES module richiedono un server (non aprire il file con `file://`):

```bash
npm start          # avvia http://localhost:8123
# poi apri http://localhost:8123 nel browser
```

## ✨ Funzionalità (v0.3.0)

- **Layout verticale (portrait) responsive** + **controlli touch** (giocabile su telefono)
- **10 tipi di nemici** con comportamenti veri (tank, kamikaze, splitter, sniper, mine, …)
- **5 boss unici**, uno per mondo (kraken, serpente, fortezza, alveare, nucleo-laser)
- **Super-armi** (laser, rallenta-tempo, droni, nova, missili): si caricano coi kill o
  cadono come pickup; una sola armata, si attiva col tasto **E**
- **Navicella che evolve di forma** a ogni livello arma; razzi a ricerca al massimo
- **Bombe a scorta** + **pausa** (P/Esc o pulsante) + **5 mondi** con sfondi galassia animati
- **Combo** fino a **x5**, difficoltà in salita, record salvato (`localStorage`)
- Juice: particelle, esplosioni, screen shake, hit-stop, glow al neon, suoni

## 🧪 Test

```bash
npm test           # test unitari sulla logica pura (runner integrato di Node)
```

## 🤖 Agenti di sviluppo

Nella cartella `.claude/agents/` ci sono sette agenti Claude Code pensati per il ciclo di
release del gioco:

| Agente | Cosa fa | Quando usarlo |
| --- | --- | --- |
| **feature-scout** | Trae ispirazione dalle tendenze e propone feature fighe per i ragazzi del 2026 | Dopo una release, per decidere cosa costruire dopo |
| **juice-designer** | Aggiunge game feel/juice e varietà per rendere il gioco meno noioso (impatto, combo, pattern, ritmo) | Quando il gioco è piatto, noioso o "sempre uguale" |
| **visual-artist** | Direttore artistico neon: eleva l'estetica in canvas 2D (glow a strati, gradienti, sfondo vivo, trail) | Quando il gioco è graficamente banale o spento |
| **regression-tester** | Esegue test e verifica l'assenza di regressioni | Prima di pubblicare una release |
| **test-author** | Crea nuovi test case man mano che arrivano nuovi sviluppi | Dopo aver aggiunto una feature o un fix |
| **game-director** | Meta-agente "regista": valuta la qualità, decide da solo quali agenti servono, li crea e li orchestra | Quando vuoi portare il gioco a un livello superiore |
| **mobile-tester** | Prova il gioco su viewport iPhone/Android (emulazione), layout portrait, touch e performance | Prima di una release che tocca UI/mobile |

Da Claude Code puoi invocarli per nome (es. *"usa l'agente feature-scout per proporre idee
per la prossima release"*).

## 📂 Struttura

```
index.html         canvas + bootstrap
style.css          stile (sfondo neon, centratura)
js/
  main.js          game loop + stati + mondi/difficoltà/super
  player.js        navicella evolutiva + armi a livelli + bombe + slot super
  enemies.js       10 tipi di nemici (comportamenti)
  creatures.js     arte delle creature spaziali
  bosses.js        5 boss unici (uno per mondo) + factory
  supers.js        super-armi (icone, droni, effetti)
  worlds.js        mondi a tema (sfondo/colori/pool/boss per livello)
  scene.js         sfondi galassia animati per mondo
  rockets.js       razzi a ricerca (homing)
  bullets.js       proiettili con scia
  powerups.js      power-up (Power/Bomba/Scudo/Vita/Super)
  particles.js     particelle + screen shake
  palette.js       palette neon + font
  audio.js         suoni sintetizzati (Web Audio)
  input.js         tastiera + mouse + touch + pulsanti
  utils.js         collisioni, random, combo, helper
tests/             test unitari (node:test)
.claude/agents/    agenti di sviluppo
```

## 📜 Licenza

MIT
