# 🚀 Neon Space Shooter

Uno **space shooter arcade 2D** in stile neon, scritto in **canvas + JavaScript vanilla**.
Nessuna dipendenza, nessun asset da scaricare: tutto è disegnato con forme geometriche e
i suoni sono sintetizzati con la Web Audio API. Semplice ma con tanto *game juice*
(particelle, screen shake, glow, suoni).

## 🎮 Come si gioca

- **Movimento**: frecce / WASD **oppure** mouse
- **Spara**: Spazio **oppure** click
- Sopravvivi alle ondate di nemici, raccogli i power-up, batti il boss ogni 5 ondate.

### Avvio in locale

Gli ES module richiedono un server (non aprire il file con `file://`):

```bash
npm start          # avvia http://localhost:8123
# poi apri http://localhost:8123 nel browser
```

## ✨ Funzionalità (v1)

- Navicella controllabile da **tastiera e mouse**, con 3 vite
- **3 tipi di nemici**: dritto, zigzag, sparatore
- **Boss** ogni 5 ondate, con barra vita e ventaglio di colpi
- **Power-up**: triplo colpo, scudo, vita extra
- **Punteggio** e **record** salvato nel browser (`localStorage`)
- Juice: particelle, esplosioni, screen shake, glow al neon, suoni, stelle in parallasse
- Stati: menu → gioco → game over con restart

## 🧪 Test

```bash
npm test           # test unitari sulla logica pura (runner integrato di Node)
```

## 🤖 Agenti di sviluppo

Nella cartella `.claude/agents/` ci sono tre agenti Claude Code pensati per il ciclo di
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
  main.js          game loop + macchina a stati
  player.js        navicella
  enemies.js       nemici + boss
  bullets.js       proiettili
  powerups.js      power-up
  particles.js     particelle + screen shake
  audio.js         suoni sintetizzati (Web Audio)
  input.js         tastiera + mouse
  utils.js         collisioni, random, helper
tests/             test unitari (node:test)
.claude/agents/    agenti di sviluppo
```

## 📜 Licenza

MIT
