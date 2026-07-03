// Mondi a tema: ogni livello ha uno scenario diverso (sfondo, colori mostri, boss).
// Si ciclano con la difficoltà crescente.

export const WORLDS = [
  {
    name: "Nebulosa Viola",
    bgTop: "#120a2e",
    bgBottom: "#04030a",
    nebula: ["rgba(120,40,200,0.20)", "rgba(0,160,220,0.16)", "rgba(255,60,160,0.14)", "rgba(0,160,220,0.16)"],
    star: "#bcd4ff",
    enemy: { straight: "#ff5bd0", zigzag: "#ffd23f", shooter: "#8b5bff" },
    boss: "#ff3860",
  },
  {
    name: "Cintura d'Asteroidi",
    bgTop: "#0a2e1a",
    bgBottom: "#03080a",
    nebula: ["rgba(60,200,120,0.18)", "rgba(180,220,60,0.14)", "rgba(40,180,160,0.16)", "rgba(120,200,60,0.12)"],
    star: "#d0f0cc",
    enemy: { straight: "#4dffa6", zigzag: "#b6ff3f", shooter: "#3fd0ff" },
    boss: "#ffae3f",
  },
  {
    name: "Ghiaccio Cosmico",
    bgTop: "#0a1e3e",
    bgBottom: "#03060f",
    nebula: ["rgba(60,140,255,0.20)", "rgba(120,240,255,0.16)", "rgba(160,120,255,0.14)", "rgba(60,200,255,0.16)"],
    star: "#dbe9ff",
    enemy: { straight: "#7df9ff", zigzag: "#a9c8ff", shooter: "#b18bff" },
    boss: "#ff5bd0",
  },
  {
    name: "Inferno Stellare",
    bgTop: "#2e0a0a",
    bgBottom: "#0a0303",
    nebula: ["rgba(255,80,40,0.20)", "rgba(255,180,40,0.16)", "rgba(255,40,90,0.16)", "rgba(255,120,40,0.14)"],
    star: "#ffd8c0",
    enemy: { straight: "#ff6a3f", zigzag: "#ffd23f", shooter: "#ff3860" },
    boss: "#ff2b6b",
  },
  {
    name: "Vuoto Profondo",
    bgTop: "#04121a",
    bgBottom: "#01050a",
    nebula: ["rgba(40,220,200,0.18)", "rgba(120,80,220,0.14)", "rgba(60,180,220,0.16)", "rgba(200,60,180,0.12)"],
    star: "#bfeee8",
    enemy: { straight: "#3fffe0", zigzag: "#ffd23f", shooter: "#c56bff" },
    boss: "#ff3860",
  },
];

// Tema per un dato livello (1-based): cicla sui mondi.
export function worldForLevel(level) {
  return WORLDS[(level - 1) % WORLDS.length];
}

// Quante volte abbiamo completato il ciclo di mondi (per la difficoltà extra).
export function worldCycle(level) {
  return Math.floor((level - 1) / WORLDS.length);
}
