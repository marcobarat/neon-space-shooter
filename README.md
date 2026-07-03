# 🚀 Neon Space Shooter

Uno **space shooter arcade 2D** in stile neon, scritto in **canvas + JavaScript vanilla**.
Nessuna dipendenza, nessun asset da scaricare: tutto è disegnato con forme geometriche e
i suoni sono sintetizzati con la Web Audio API. Semplice ma con tanto *game juice*
(particelle, screen shake, glow, suoni).

## 🎮 Come si gioca

- **Movimento**: frecce / WASD **oppure** mouse
- **Spara**: Spazio **oppure** click
- **Bomba**: tasto **B** (o Shift) — ripulisce lo schermo e danneggia tutti
- Raccogli **Power** per potenziare l'arma (fino ai razzi a ricerca). Se vieni
  colpito scendi di un livello arma; perdi una vita solo a livello base.
- Batti il boss per passare al **mondo successivo**: scenario, mostri e boss cambiano.
- Incatena le uccisioni: la **combo** moltiplica i punti fino a **x5**.

### Avvio in locale

Gli ES module richiedono un server (non aprire il file con `file://`):

```bash
npm start          # avvia http://localhost:8123
# poi apri http://localhost:8123 nel browser
```

## ✨ Funzionalità (v0.2.0)

- **Armi a livelli persistenti** + **razzi a ricerca** al livello massimo
- **Bombe a scorta** con detonazione manuale (bottone del panico)
- **5 mondi a tema** che ciclano: scenario, mostri e boss cambiano a ogni livello
- **Mostri spaziali** animati (medusa, falena, occhio) + **kraken boss** a due fasi
- **Combo** che moltiplica i punti fino a **x5**, con score-pop
- **Difficoltà in salita** con ondate e livelli
- **Power-up**: Power (arma+), Bomba, Scudo, Vita (drop pesati)
- **Punteggio** e **record** salvato nel browser (`localStorage`)
- Juice: particelle, esplosioni, screen shake, hit-stop, glow al neon, suoni
- Stati: menu → gioco → game over con restart

## 🧪 Test

```bash
npm test           # test unitari sulla logica pura (runner integrato di Node)
```

## 🤖 Agenti di sviluppo

Nella cartella `.claude/agents/` ci sono sei agenti Claude Code pensati per il ciclo di
release del gioco:

| Agente | Cosa fa | Quando usarlo |
| --- | --- | --- |
| **feature-scout** | Trae ispirazione dalle tendenze e propone feature fighe per i ragazzi del 2026 | Dopo una release, per decidere cosa costruire dopo |
| **juice-designer** | Aggiunge game feel/juice e varietà per rendere il gioco meno noioso (impatto, combo, pattern, ritmo) | Quando il gioco è piatto, noioso o "sempre uguale" |
| **visual-artist** | Direttore artistico neon: eleva l'estetica in canvas 2D (glow a strati, gradienti, sfondo vivo, trail) | Quando il gioco è graficamente banale o spento |
| **regression-tester** | Esegue test e verifica l'assenza di regressioni | Prima di pubblicare una release |
| **test-author** | Crea nuovi test case man mano che arrivano nuovi sviluppi | Dopo aver aggiunto una feature o un fix |
| **game-director** | Meta-agente "regista": valuta la qualità, decide da solo quali agenti servono, li crea e li orchestra | Quando vuoi portare il gioco a un livello superiore |

Da Claude Code puoi invocarli per nome (es. *"usa l'agente feature-scout per proporre idee
per la prossima release"*).

## 📂 Struttura

```
index.html         canvas + bootstrap
style.css          stile (sfondo neon, centratura)
js/
  main.js          game loop + macchina a stati + mondi/difficoltà
  player.js        navicella + armi a livelli + bombe
  enemies.js       nemici + boss (colore dal mondo)
  creatures.js     arte delle creature spaziali
  worlds.js        mondi a tema (sfondo/colori per livello)
  rockets.js       razzi a ricerca (homing)
  bullets.js       proiettili con scia
  powerups.js      power-up (Power/Bomba/Scudo/Vita)
  particles.js     particelle + screen shake
  palette.js       palette neon + font
  audio.js         suoni sintetizzati (Web Audio)
  input.js         tastiera + mouse + bomba
  utils.js         collisioni, random, combo, helper
tests/             test unitari (node:test)
.claude/agents/    agenti di sviluppo
```

## 📜 Licenza

MIT
