# Direzione Artistica — Neon Space Shooter

> Documento dell'**Art Scout**. Obiettivo: mostri **più belli**, più **robotici/alieni**,
> con un **design DIVERSO a ogni mondo** (non solo un cambio di colore), più uno sfondo
> **galassia 3D (three.js) in movimento** che sostituisce/affianca lo sfondo 2D fisso.
>
> **Etica/IP**: qui si prende *ispirazione* su forme, palette e "feel" da shmup rinomati.
> Nessun asset viene copiato. Tutto resta **arte procedurale vettoriale su canvas 2D**,
> generata dal nostro codice. I giochi citati sono riferimenti, non sorgenti da clonare.

---

## 0. Il problema attuale (diagnosi del codice)

Leggendo `js/creatures.js`, `js/worlds.js`, `js/scene.js`:

- Ogni **tipo** di nemico (`straight`, `zigzag`, `shooter`, `tank`, `kamikaze`, `splitter`,
  `sniper`, `mine`) ha **una sola forma fissa** disegnata in `creatures.js`. La medusa è
  sempre una medusa, l'occhio è sempre un occhio.
- I mondi in `worlds.js` cambiano **solo il campo `enemy.<tipo>` (il colore)**. Quindi lo
  stesso mostro appare identico in tutti i mondi, solo ritinto → sensazione di "sempre
  uguale".
- Il vocabolario tecnico è già ottimo e va **riusato**, non buttato:
  `glowFill()` (volume via gradiente radiale bianco→saturo→scuro), `rim()` (contorno neon
  con `shadowBlur`), `eye()` (occhio riutilizzabile), `shade()`/`withAlpha()`.

**La leva chiave**: introdurre un concetto di **"skin di mondo"** — un parametro di stile
(es. `e.skin` o `worldIndex`) passato alle funzioni di disegno, che seleziona **materiale,
motivi e addendi di silhouette** per lo stesso tipo base. Un solo tipo `tank` diventa
*asteroide-mecha* nella Cintura, *iceberg cristallino* nel Ghiaccio, *scoria fusa* nell'Inferno,
*monolite del vuoto* nel Vuoto. Stesso scheletro di codice, materiali diversi.

---

## 1. Principi generali (validi per tutti i mondi)

Distillati dai riferimenti (dettaglio in §8):

1. **Silhouette prima di tutto.** Un nemico deve essere riconoscibile in una frazione di
   secondo dalla sola sagoma nera. Mobile-first, portrait: i mostri sono piccoli (r ≈ 12–18px).
   Regola: **il profilo esterno comunica il TIPO** (minaccia, comportamento), **il
   riempimento comunica il MONDO** (materiale, tema). *(Enter the Gungeon, Nova Drift)*

2. **Linguaggio di forme = comportamento.**
   - Punte/frecce/spine → aggressivo, veloce (kamikaze, mine).
   - Cerchi/cupole/bulbi → passivo o "cervello" (shooter, splitter, boss).
   - Esagoni/trapezi/blocchi → difensivo, meccanico (tank, sniper, fortezza).
   Mantenere questa grammatica costante tra i mondi: cambia il materiale, non il "ruolo"
   della forma. *(Geometry Wars: forma = funzione — dardi appuntiti inseguono, blocchi bloccano.)*

3. **Doppio/triplo glow, non tinta piatta.** Il look neon nasce da livelli di luce:
   (a) un contorno stretto che traccia la forma (`rim()`), (b) un alone medio che irradia
   (`shadowBlur`), (c) un core interno molto chiaro (già in `glowFill`). Evitare il
   "clip-art" piatto. *(Nova Drift costruisce il neon esattamente così, senza shader.)*

4. **Emissive contro sfondo scuro.** Tutti i mondi restano scuri; il mostro è la sorgente
   di luce. Il colore saturo va **al bordo e al core**, i mezzitoni restano al centro per
   dare volume. *(Housemarque/Nex Machina: figure che emettono luce nel buio.)*

5. **Contrasto di temperatura per leggibilità dei proiettili.** I proiettili nemici devono
   sempre "urlare" rispetto al mondo. Se il mondo è freddo (Ghiaccio, Vuoto) i pericoli
   virano al caldo/magenta; se il mondo è caldo (Inferno) i pericoli restano bianchissimi
   al core. Il giocatore (ciano `#19e6ff`) non deve mai confondersi col mondo.

6. **"Materiale" leggibile con 3 mosse.** Su canvas 2D un materiale è: **gradiente base**
   (già in `glowFill`) + **1 pattern di dettaglio** (crepe, pannelli, cristalli, celle) +
   **1 accento emissivo** (fughe, vene, spie). Non serve altro; il dettaglio in eccesso
   diventa rumore alle dimensioni mobile.

7. **Robotico vs alieno = bordi.** Robotico → spigoli vivi, linee rette, pannellature,
   simmetria, "occhi" che diventano lenti/scanner. Alieno → curve, asimmetria, bulbi,
   membrane, "occhi" biologici con palpebra. Ogni mondo sceglie **dove** sta sul cursore
   robotico↔alieno (vedi tabella §2).

8. **Animazione a basso costo = vita.** Un mostro "vivo" costa poco: un `sin(t)` che fa
   pulsare il core, oscillare i tentacoli, ruotare un anello, lampeggiare una spia. È già
   il pattern del codice attuale — va esteso, non appesantito.

---

## 2. Mappa d'identità dei 5 mondi

Ogni mondo riceve una **posizione sull'asse robotico↔alieno**, un **materiale dominante**,
un **motivo di dettaglio** e un **accento emissivo**. È questo che rende lo stesso tipo
diverso da mondo a mondo.

| Mondo | Boss (codice) | Cursore | Materiale | Motivo di dettaglio | Accento emissivo |
|---|---|---|---|---|---|
| 1. Nebulosa Viola | `kraken` | **Alieno** (bio) | carne/membrana traslucida | vene pulsanti, macchie fosforescenti | magenta/oro, occhi bio |
| 2. Cintura d'Asteroidi | `serpent` | **Robo-organico** (mecha di scarto) | roccia + metallo arrugginito bullonato | pannelli, bulloni, crepe di magma | verde-acido di scanner |
| 3. Ghiaccio Cosmico | `fortress` | **Cristallino/robotico** | ghiaccio + lega bianca | sfaccettature, brina, spigoli netti | ciano gelido interno |
| 4. Inferno Stellare | `hive` | **Bio-magmatico** | scoria/chitina incandescente | crepe di lava che respirano, croste nere | arancio-bianco al core |
| 5. Vuoto Profondo | `laser` | **Alieno-digitale/geometrico** | vetro nero + energia | wireframe, glitch, geometria sacra | ciano/viola olografico |

**Regola di silhouette per mondo** (add-on da innestare sul tipo base):
- Viola → **tentacoli/frange** morbide che ondeggiano.
- Asteroidi → **placche irregolari e bulloni** sporgenti dal profilo.
- Ghiaccio → **schegge/aculei** cristallini rigidi sul contorno.
- Inferno → **creste/spine** con orlo che brucia.
- Vuoto → **anelli/segmenti fluttuanti staccati** dal corpo (levitazione).

---

## 3. Le 5 skin dei tipi base

Per ciascun tipo base, ecco come **cambia in ogni mondo**. La forma-scheletro resta quella
delle funzioni esistenti; cambiano riempimento, contorno e 1–2 addendi.

### STRAIGHT (`drawStraight`, la "medusa")
- **Viola** — medusa aliena piena (baseline): campana traslucida, tentacoli molli, macchie
  fosforescenti. È l'ancora estetica del mondo bio.
- **Asteroidi** — *drone-mina bulbo*: la campana diventa un guscio metallico a spicchi
  bullonati; i tentacoli diventano **cavi rigidi** con lucine terminali.
- **Ghiaccio** — *fiocco vivente*: campana esagonale sfaccettata, "tentacoli" come **aculei
  di ghiaccio** che non ondeggiano ma vibrano leggermente.
- **Inferno** — *ascesa di brace*: campana con crepe di lava pulsanti; i tentacoli sono
  **filamenti di fuoco** (coda additiva `lighter`).
- **Vuoto** — *sfera-nodo*: cupola di vetro nero con **anello orbitante** di punti; tentacoli
  ridotti a **linee dati** tratteggiate.

### ZIGZAG (`drawZigzag`, la "falena")
- **Viola** — falena spaziale bio (baseline): ali membranose, antenne.
- **Asteroidi** — *aliante di lamiera*: ali a **pannelli angolari** con bordo arrugginito;
  il flap è più meccanico (scatti).
- **Ghiaccio** — *libellula di cristallo*: ali **trasparenti sfaccettate** con brina sul bordo,
  scia di scintillii.
- **Inferno** — *falena di cenere*: ali con **bordo incandescente** e "buchi" che brillano;
  lascia particelle calde.
- **Vuoto** — *farfalla wireframe*: ali disegnate come **reticolo** (solo linee) con leggero
  effetto glitch/sdoppiamento.

### SHOOTER (`drawShooter`, l'"occhio fluttuante")
- **Viola** — occhio carnoso con tentacoli (baseline), palpebra biologica.
- **Ghiaccio** — *sentinella-lente*: corpo in **lega bianca a pannelli**, l'occhio diventa
  una **lente/scanner** con iride ad anello, tentacoli → **bracci articolati** rigidi.
- **Inferno** — *cuore-fornace*: sfera con **fenditura incandescente** al posto dell'occhio;
  "sbatte" come una brace che respira.
- **Vuoto** — *drone-sensore olografico*: iride ad **anelli concentrici** olografici; i
  tentacoli sono **raggi** che si accendono quando mira.

### TANK (`drawTank`, l'"asteroide corazzato")
- **Asteroidi** — *asteroide-mecha* (baseline naturale): roccia con **placche imbullonate**
  e una fenditura di magma; l'occhio è una **spia-scanner**.
- **Ghiaccio** — *iceberg corazzato*: blocco **cristallino sfaccettato**, crepe che rifrangono,
  bordo brinato; l'occhio è un nucleo ciano interno.
- **Inferno** — *masso di scoria*: superficie nera crostosa con **reticolo di lava** che
  pulsa nelle crepe; l'occhio è una fenditura bianco-arancio.
- **Vuoto** — *monolite fluttuante*: prisma di **vetro nero** con spigoli olografici e un
  anello di detriti che orbita; l'occhio è un glifo luminoso.

### KAMIKAZE (`drawKamikaze`, il "dardo/cometa")
- **Viola** — cometa aliena con coda (baseline).
- **Asteroidi** — *missile di scarto*: fusoliera a **pannelli** con alette; coda di scintille.
- **Ghiaccio** — *scheggia-proiettile*: **stalattite affilata** con scia di brina; punta che
  brilla.
- **Inferno** — *meteora infuocata* (il suo elemento): nucleo bianco, **coda di lava** lunga
  additiva — qui il kamikaze è al massimo dell'impatto.
- **Vuoto** — *lancia di luce*: dardo **wireframe** con scia tratteggiata e sdoppiamento.

### SPLITTER (`drawSplitter`, il "blob")
- **Ghiaccio** — *nucleo che si cristallizza*: blob con **spigoli di ghiaccio** che crescono;
  quando si divide, "si spezza" come vetro.
- **Inferno** — *goccia di magma*: blob incandescente con **crosta nera** che si crepa
  mostrando lava sotto.
- **Vuoto** — *cellula digitale*: blob dal **contorno glitchato**, si sdoppia con effetto eco.
- **Viola/Asteroidi** (se presente) — bio-gel (baseline) / **sacca di scoria** metallica.

### SNIPER (`drawSniper`, la "torretta esagonale")
- **Ghiaccio** — *torretta di cristallo*: esagono **sfaccettato**, canna come **raggio di
  ghiaccio**; il telegrafo mira è ciano gelido.
- **Vuoto** — *occhio-cecchino olografico*: esagono di **vetro nero** con anelli, il mirino è
  una **linea olografica** che si stringe.
- **Asteroidi** — *torretta imbullonata* su base rocciosa; canna metallica.

### MINE (`drawMine`, la "mina spinata")
- **Inferno** — *mina-brace*: nucleo che **respira lava**, spine annerite con punte roventi.
- **Vuoto** — *nodo instabile*: sfera di **vetro nero** con spine-raggio e core che glitcha
  prima di esplodere.
- **Ghiaccio** — *mina-riccio di ghiaccio*: spine cristalline, core ciano lampeggiante.

> Nota di coerenza: il **rosso/magenta lampeggiante del pericolo** (core mina, telegrafo
> sniper, occhio boss in furia) resta costante **in tutti i mondi** — è un segnale di gameplay,
> non decorazione. Non ricolorarlo a tema.

---

## 4. I 5 boss

I 5 archetipi in `bosses.js` sono già mappati 1:1 sui mondi. Qui l'identità visiva per
renderli epici e coerenti col mondo. Tutti riusano `glowFill`, `rim`, `eye`, `drawHealth`.

### 1. Nebulosa Viola — KRAKEN (cervello/kraken alieno)
- **Direzione**: la creatura-madre bio. Corpo lobato tipo cervello + tentacoli lunghi
  (già così). Spingere il **traslucido**: solchi cerebrali che pulsano di magenta, macchie
  fosforescenti, grande occhio dorato che diventa rosso in furia.
- **Upgrade**: 2–3 **occhi minori** che si aprono a coro in furia; vene che si illuminano al
  ritmo dello sparo a spirale. È il boss "vivo".

### 2. Cintura d'Asteroidi — SERPENTE (verme corazzato)
- **Direzione**: **verme-macchina** fatto di segmenti rocciosi imbullonati (non palle lisce).
  Ogni segmento = placca con bordo metallico e una vena di magma; la testa è un **muso
  corazzato** con mandibole e occhio-scanner.
- **Upgrade**: i segmenti della coda si illuminano in sequenza quando sta per sparare
  (telegrafo naturale). In furia, le vene di magma diventano bianche.

### 3. Ghiaccio Cosmico — FORTEZZA (stazione di ghiaccio-lega)
- **Direzione**: la più **robotica**. Struttura trapezoidale a **pannelli bianchi** con
  spigoli di cristallo; i cannoni sono torrette meccaniche che, andando offline (già in
  logica), si **congelano/spengono** visibilmente (grigio, brina, nessun glow).
- **Upgrade**: quando perde un cannone, una scheggia di ghiaccio ne copre il moncone;
  l'occhio centrale è una **lente-scanner** ad anelli, rossa solo quando spara.

### 4. Inferno Stellare — REGINA ALVEARE (alveare magmatico)
- **Direzione**: **chitina incandescente**. Corpo esagonale (celle d'alveare) con **crepe di
  lava** che respirano; le celle si aprono per far uscire i minion, mostrando bagliore
  interno. Bio + fuoco.
- **Upgrade**: prima di generare uno sciame, le celle **si accendono** una per una (telegrafo).
  In furia l'intero guscio pulsa arancio-bianco.

### 5. Vuoto Profondo — NUCLEO LASER (entità geometrica/olografica)
- **Direzione**: la più **astratta/aliena-digitale**. Nucleo a stella (già a 10 punte) di
  **vetro nero** con **anelli olografici** rotanti attorno; in fase di carica il nucleo
  attira linee di energia verso il centro. Niente carne: pura geometria + luce.
- **Upgrade**: il telegrafo del fascio (già presente) parte da un **occhio-glifo** che si apre;
  gli anelli accelerano durante lo sweep. Palette ciano/viola olografica.

---

## 5. Gli sfondi (2D + galassia 3D three.js)

Direzione: **mantenere gli sfondi 2D** di `scene.js` come strato di gameplay leggero
(asteroidi, aurora, braci) e introdurre **dietro tutto** una **galassia 3D three.js** in
lento movimento come strato "cosmico" profondo. La galassia 3D dà parallasse e profondità
reale; il 2D resta per gli elementi tematici vicini. Il canvas di gioco resta sopra, invariato.

### Regole comuni per la galassia 3D
- **Mood**: lenta, ipnotica, mai distrae dal gameplay. Rotazione ~0.02–0.05 rad/s, come già
  fa la galassia 2D (`rotate(t * 0.05)`).
- **Movimento**: leggerissima **parallasse** legata alla progressione/al movimento del
  giocatore (drift orizzontale sottile), più una **rotazione costante** della spirale.
- **Densità**: scalabile per performance (vedi §6). Target: 3.000–8.000 punti su mobile,
  fino a 15.000+ su desktop.
- **Colori**: guidati dalla `nebula[]` del mondo — i punti campionano un **gradiente
  core→braccio** dal centro caldo/chiaro verso i bracci nel colore-tema.

### Per mondo
| Mondo | Galassia 3D: mood, colori, densità, movimento |
|---|---|
| **Nebulosa Viola** | Spirale classica a 2 bracci. Core bianco-oro, bracci **viola→ciano→magenta** (`nebula` esistente). Densità alta, polvere diffusa. Rotazione lenta oraria, drift minimo. Il mood "nascita cosmica". |
| **Cintura d'Asteroidi** | Galassia più **sporca/verde-acida**: pochi bracci, più **banda di detriti** (fascia densa di punti sul piano). Colori verde/lime/teal. Movimento con leggero "scorrimento" laterale come se si attraversasse la cintura. |
| **Ghiaccio Cosmico** | Galassia **fredda e rada**: nebulosa blu-ciano diffusa, punti bianchi taglienti, meno bracci, più "campo stellare" cristallino. Rotazione lentissima, sensazione di quiete gelida. |
| **Inferno Stellare** | **Nube di nascita stellare**: core rosso-arancio pulsante (una *starburst*), bracci corti caldi, densità alta al centro che **pulsa** (sin lento). Movimento di convezione (drift verso l'alto, come le braci 2D). |
| **Vuoto Profondo** | **Quasi vuoto**: 1–2 galassie lontane piccole e nitide su nero profondo, pochissimi punti, forte senso di isolamento. Colori teal/viola desaturati. Movimento impercettibile, deriva lenta. Contrasto massimo con i nemici in primo piano. |

### Transizione tra mondi
Al cambio mondo, **interpolare** colore dei punti e densità (fade su ~1s) invece di un taglio
netto: la galassia sembra "trasformarsi", non ricaricarsi.

---

## 6. Note di implementazione (canvas 2D + three.js)

### Canvas 2D (mostri e boss)
- **Riusare il vocabolario esistente**: `glowFill()` per il volume, `rim()` per il neon,
  `eye()` per gli occhi, `shade()`/`withAlpha()` per le varianti. Non introdurre nuovi
  sistemi: aggiungere solo **funzioni-materiale** e **funzioni-addon di silhouette**.
- **Parametro skin**: passare l'indice del mondo (o un oggetto `skin`) alle draw. In pratica
  un piccolo dispatch: `drawTank(ctx, e, skin)` dove `skin ∈ {rock, ice, magma, void, bio}`.
  Ogni skin definisce: `pattern(ctx,r)` (crepe/sfaccettature/celle/wireframe) e
  `accent` (colore emissivo). Lo scheletro resta uno solo per tipo.
- **Materiali economici e come farli**:
  - *Cristallo/ghiaccio*: 3–4 segmenti di poligono con `strokeStyle` bianco a bassa alpha
    per le sfaccettature + un highlight lineare. `globalCompositeOperation` non serve.
  - *Metallo/roccia bullonata*: pattern già presente (crepe/crateri nel `drawTank`) +
    2–3 cerchietti scuri (bulloni) e un bordo `shade(base,-0.4)`.
  - *Magma/scoria*: fill scuro + **crepe emissive** = tracciare linee con `strokeStyle`
    caldo e `shadowBlur` che **pulsano** con `0.5+0.5*sin(t)`.
  - *Wireframe/olografico*: disegnare **solo** il contorno poligonale + anelli, alpha bassa,
    eventuale sdoppiamento di 1px per il "glitch".
- **Rim-light**: il `rim()` esistente è la fonte primaria del look neon — usarlo sempre
  tranne durante `hitFlash`.
- **Costo/performance mobile** (fondamentale):
  - `shadowBlur` è la voce **più cara**. Tenerlo per il `rim`/core, non su ogni linea di
    dettaglio. Le crepe/pattern si disegnano **senza** shadow (già così nel codice).
  - Evitare gradienti radiali ricreati per ogni linea: `glowFill` una volta per corpo.
  - Nessun asset esterno, tutto vettoriale: coerente col vincolo IP e con la portabilità.
  - Cap ai dettagli: alle dimensioni r≈14px, **max 1 pattern + 1 accento**; oltre è rumore.

### three.js (galassia di sfondo)
- **Un solo `THREE.Points`** con `BufferGeometry` (attributi `position` + `color`). Un solo
  draw call. **Additive blending** (`THREE.AdditiveBlending`), `depthWrite:false`,
  `sizeAttenuation:true`.
- **Animare nel vertex shader** (`ShaderMaterial`), non sul CPU: la rotazione a spirale e il
  drift si calcolano in GPU dal tempo `uTime` — così migliaia di punti costano pochissimo su
  telefono. (Aggiornare in CPU array lunghi ogni frame è il principale killer di FPS.)
- **Performance mobile**:
  - Contare i punti in base a `devicePixelRatio`/larghezza: preset *low* (≈3k) / *high* (≈12k).
  - `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
  - Niente post-processing pesante: il "bloom" si simula con **texture di punto morbida**
    (gradiente radiale in un canvas → `THREE.CanvasTexture`) invece di un pass di bloom.
  - Il canvas WebGL sta **dietro** al canvas 2D di gioco (o è lo stesso stack a z inferiore);
    il gioco continua a girare in 2D senza modifiche alla logica.
  - Fallback: se WebGL non è disponibile o il device è debole, restare sulla galassia 2D
    esistente (`scene.js` già la disegna). Degradare con grazia.
- **Colori dal mondo**: passare la `nebula[]` come uniform/vertex-color; l'interpolazione
  core→braccio si fa assegnando il colore per-vertice alla generazione.

---

## 7. Riferimenti d'ispirazione (cosa prendere da ciascuno)

- **Ikaruga** (Treasure) — **leggibilità assoluta** tramite contrasto forte e coerenza: la
  forma comunica la regola. Da prendere: disciplina della silhouette e delle "letture"
  istantanee, non il bianco/nero letterale.
- **Nex Machina / Resogun** (Housemarque) — **neon su buio + esplosioni di luce**, mondi
  visivamente distinti tra loro. Da prendere: figure che emettono luce, forte identità
  cromatica per livello, ricompensa visiva alla distruzione.
- **Nova Drift** — il **look neon costruito a strati di glow senza shader**, tutto
  vettoriale. È il modello tecnico più vicino al nostro canvas 2D: contorno stretto + alone
  + core. Da prendere: la ricetta esatta del glow e la pulizia geometrica.
- **Geometry Wars** — **forma = funzione** (dardi appuntiti inseguono, blocchi bloccano),
  bloom e griglia reattiva. Da prendere: grammatica delle forme legata al comportamento e
  l'idea della griglia/sfondo che reagisce.
- **ZeroRanger** — **palette ristretta e audace** (verde/arancio) come identità. Da prendere:
  il coraggio di dare a ogni mondo una palette limitata e memorabile invece di "tutti i colori".
- **Galak-Z** — estetica **anime-mecha** con nemici robotici articolati. Da prendere: il lato
  "robotico" (pannelli, articolazioni, scanner) per i mondi meccanici (Asteroidi, Ghiaccio).
- **Sky Force Reloaded** — **boss metallici massicci** che perdono pezzi. Da prendere: boss
  che si degradano visibilmente (la Fortezza che spegne i cannoni è già in linea con questo).
- **Enter the Gungeon** — **shape language + readability**: dettaglio solo se aggiunge alla
  lettura della silhouette. Da prendere: personalità con pochi tratti, mai rumore.
- **Jamestown** — coesione tematica e **VFX leggibili** in mezzo al caos. Da prendere: far
  "urlare" i pericoli sopra a uno sfondo ricco.

---

## 8. Priorità di partenza (massimo impatto / minimo costo)

1. **Sistema di skin per mondo (fondamenta).** Introdurre il parametro `skin`/`worldIndex`
   nelle draw di `creatures.js` + 5 funzioni-materiale (`bio`, `rock`, `ice`, `magma`, `void`).
   È il cambiamento che risolve alla radice il "sempre uguale". Senza questo, il resto non
   scala.

2. **Partire dai 3 tipi più frequenti nei pool**: **`straight`, `zigzag`, `kamikaze`**
   (compaiono in quasi tutti i mondi → massima visibilità del cambiamento). Poi `tank`,
   `shooter`, `sniper`, `splitter`, `mine`.

3. **Mondo pilota: Cintura d'Asteroidi (2) o Ghiaccio Cosmico (3).** Sono i più lontani dal
   look "bio" attuale, quindi il salto **robotico/cristallino** è il più evidente e
   dimostra subito il valore del sistema. Consiglio: **Ghiaccio** (materiale cristallino
   nuovo e vistoso, palette fredda già pronta in `worlds.js`).

4. **Boss del mondo pilota** con il suo upgrade (§4) — un boss ridisegnato vale, in percezione,
   quanto dieci nemici.

5. **Galassia 3D three.js** come layer separato, con **fallback** al 2D. Iniziare con la
   sola **Nebulosa Viola** (spirale classica) per validare performance su telefono, poi
   declinare le altre 4 varianti (§5).

> Ordine consigliato in una frase: *prima il sistema di skin → poi Ghiaccio (nemici + boss)
> come vetrina → poi la galassia 3D del mondo 1 → poi estendere skin e galassia agli altri
> mondi.*
