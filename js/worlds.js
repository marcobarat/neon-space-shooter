// Mondi a tema: ogni livello ha uno scenario diverso (sfondo animato, colori
// mostri, pool di nemici, archetipo di boss). Si ciclano con la difficoltà crescente.

export const WORLDS = [
  {
    name: "Nebulosa Viola",
    bgTop: "#120a2e",
    bgMid: "#251048",
    bgBottom: "#04030a",
    nebula: ["rgba(120,40,200,0.20)", "rgba(0,160,220,0.16)", "rgba(255,60,160,0.14)", "rgba(0,160,220,0.16)"],
    star: "#bcd4ff",
    enemy: { straight: "#ff5bd0", zigzag: "#ffd23f", shooter: "#8b5bff", tank: "#c58bff", kamikaze: "#ff4d6d", splitter: "#ff8bd0", sniper: "#a06bff", mine: "#ff6ad0" },
    boss: "#ff3860",
    scene: "galaxy",
    pool: ["straight", "zigzag", "shooter", "kamikaze"],
    bossType: "kraken",
  },
  {
    name: "Cintura d'Asteroidi",
    bgTop: "#0a2e1a",
    bgMid: "#12331c",
    bgBottom: "#03080a",
    nebula: ["rgba(60,200,120,0.18)", "rgba(180,220,60,0.14)", "rgba(40,180,160,0.16)", "rgba(120,200,60,0.12)"],
    star: "#d0f0cc",
    enemy: { straight: "#4dffa6", zigzag: "#b6ff3f", shooter: "#3fd0ff", tank: "#c8b06a", kamikaze: "#ff9a3f", splitter: "#8bff6a", sniper: "#3fd0ff", mine: "#b6ff3f", asteroid: "#c8b06a" },
    boss: "#ffae3f",
    scene: "asteroids",
    pool: ["straight", "zigzag", "tank", "kamikaze", "asteroid"],
    bossType: "serpent",
  },
  {
    name: "Ghiaccio Cosmico",
    bgTop: "#0a1e3e",
    bgMid: "#122f5e",
    bgBottom: "#03060f",
    nebula: ["rgba(60,140,255,0.20)", "rgba(120,240,255,0.16)", "rgba(160,120,255,0.14)", "rgba(60,200,255,0.16)"],
    star: "#dbe9ff",
    enemy: { straight: "#7df9ff", zigzag: "#a9c8ff", shooter: "#b18bff", tank: "#8fb8ff", kamikaze: "#ff6a9a", splitter: "#7df9ff", sniper: "#c0a0ff", mine: "#a9c8ff" },
    boss: "#ff5bd0",
    scene: "aurora",
    pool: ["zigzag", "shooter", "sniper", "splitter"],
    bossType: "fortress",
  },
  {
    name: "Inferno Stellare",
    bgTop: "#2e0a0a",
    bgMid: "#571510",
    bgBottom: "#0a0303",
    nebula: ["rgba(255,80,40,0.20)", "rgba(255,180,40,0.16)", "rgba(255,40,90,0.16)", "rgba(255,120,40,0.14)"],
    star: "#ffd8c0",
    enemy: { straight: "#ff6a3f", zigzag: "#ffd23f", shooter: "#ff3860", tank: "#ff9a3f", kamikaze: "#ff2b2b", splitter: "#ff6a3f", sniper: "#ff3860", mine: "#ffb03f" },
    boss: "#ff2b6b",
    scene: "ember",
    pool: ["straight", "shooter", "kamikaze", "mine"],
    bossType: "hive",
  },
  {
    name: "Vuoto Profondo",
    bgTop: "#04121a",
    bgMid: "#0a2430",
    bgBottom: "#01050a",
    nebula: ["rgba(40,220,200,0.18)", "rgba(120,80,220,0.14)", "rgba(60,180,220,0.16)", "rgba(200,60,180,0.12)"],
    star: "#bfeee8",
    enemy: { straight: "#3fffe0", zigzag: "#ffd23f", shooter: "#c56bff", tank: "#6ad0c0", kamikaze: "#ff4d6d", splitter: "#3fffe0", sniper: "#c56bff", mine: "#6affd0", asteroid: "#6ad0c0" },
    boss: "#ff3860",
    scene: "void",
    pool: ["tank", "sniper", "splitter", "mine", "kamikaze", "asteroid"],
    bossType: "laser",
  },
];

// Tema per un dato livello (1-based): cicla sui mondi.
export function worldForLevel(level) {
  return WORLDS[(level - 1) % WORLDS.length];
}

// Indice del mondo (0-based) per il livello dato.
export function worldIndexForLevel(level) {
  return (level - 1) % WORLDS.length;
}

// Quante volte abbiamo completato il ciclo di mondi (per la difficoltà extra).
export function worldCycle(level) {
  return Math.floor((level - 1) / WORLDS.length);
}
