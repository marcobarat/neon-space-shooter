// Sfondo galassia 3D animato con three.js, su un canvas WebGL dedicato dietro al
// gioco 2D. Ruota lentamente e la camera deriva → effetto movimento. Cambia colori
// per mondo. Se three.js non è disponibile, il boot fa fallback (il gioco 2D resta).
import * as THREE from "three";

// Colori (interno caldo, esterno a tema) per ognuno dei 5 mondi.
const WORLD_COLORS = [
  { inside: "#ff9cf0", outside: "#7a3cff" }, // Nebulosa Viola
  { inside: "#d6ff8a", outside: "#2fd67a" }, // Cintura d'Asteroidi
  { inside: "#cfe8ff", outside: "#3ca0ff" }, // Ghiaccio Cosmico
  { inside: "#ffd060", outside: "#ff4a2a" }, // Inferno Stellare
  { inside: "#b6fff0", outside: "#2fe0d0" }, // Vuoto Profondo
];

// Densità in base al device: i telefoni riempiono meno pixel → meno punti,
// stessa resa percepita, frame-time al sicuro.
const COUNT = (typeof window !== "undefined" && window.innerWidth < 760) ? 4500 : 12000;
const RADIUS = 11;
const BRANCHES = 5;
const SPIN = 1.1;
const RANDOMNESS = 0.45;
const RAND_POWER = 3;

let renderer, scene, camera, points, geometry, material;
let positions, radii, colors;
let clock;
let started = false;
let targetColors = null; // transizione fluida tra i mondi

function buildColorsInto(arr, worldIndex) {
  const wc = WORLD_COLORS[worldIndex % WORLD_COLORS.length];
  const inside = new THREE.Color(wc.inside);
  const outside = new THREE.Color(wc.outside);
  for (let i = 0; i < COUNT; i++) {
    const mixed = inside.clone().lerp(outside, Math.min(1, radii[i] / RADIUS));
    arr[i * 3] = mixed.r;
    arr[i * 3 + 1] = mixed.g;
    arr[i * 3 + 2] = mixed.b;
  }
}

function buildColors(worldIndex) {
  buildColorsInto(colors, worldIndex);
  if (geometry) geometry.attributes.color.needsUpdate = true;
}

// Texture radiale morbida per i punti: elimina i quadratini duri e simula
// il bloom senza post-processing (gratis su GPU).
function makePointTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const cc = c.getContext("2d");
  const g = cc.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  cc.fillStyle = g;
  cc.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

export function initGalaxy(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 3.2, 7.5);
  camera.lookAt(0, 0, 0);

  geometry = new THREE.BufferGeometry();
  positions = new Float32Array(COUNT * 3);
  colors = new Float32Array(COUNT * 3);
  radii = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const r = Math.pow(Math.random(), 1.4) * RADIUS;
    radii[i] = r;
    const branch = (i % BRANCHES) / BRANCHES * Math.PI * 2;
    const spin = r * SPIN;
    const rx = Math.pow(Math.random(), RAND_POWER) * (Math.random() < 0.5 ? 1 : -1) * RANDOMNESS * r;
    const ry = Math.pow(Math.random(), RAND_POWER) * (Math.random() < 0.5 ? 1 : -1) * RANDOMNESS * r * 0.5;
    const rz = Math.pow(Math.random(), RAND_POWER) * (Math.random() < 0.5 ? 1 : -1) * RANDOMNESS * r;
    positions[i * 3] = Math.cos(branch + spin) * r + rx;
    positions[i * 3 + 1] = ry;
    positions[i * 3 + 2] = Math.sin(branch + spin) * r + rz;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  buildColors(0);

  material = new THREE.PointsMaterial({
    size: 0.07,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    map: makePointTexture(),
    alphaTest: 0.01,
  });

  points = new THREE.Points(geometry, material);
  points.rotation.x = 0.5;
  scene.add(points);

  clock = new THREE.Clock();
  started = true;

  window.addEventListener("resize", onResize);
  animate();
}

function onResize() {
  if (!renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  if (!started) return;
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  points.rotation.y = t * 0.06;
  // Deriva lenta della camera per dare senso di movimento/vita.
  camera.position.x = Math.sin(t * 0.08) * 1.2;
  camera.position.y = 3.2 + Math.sin(t * 0.05) * 0.6;
  camera.lookAt(0, 0, 0);
  // Transizione colori fluida verso il mondo nuovo (~1s), poi si spegne.
  if (targetColors) {
    let maxDiff = 0;
    for (let i = 0; i < colors.length; i++) {
      const d = targetColors[i] - colors[i];
      colors[i] += d * 0.055;
      const ad = Math.abs(d);
      if (ad > maxDiff) maxDiff = ad;
    }
    geometry.attributes.color.needsUpdate = true;
    if (maxDiff < 0.01) {
      colors.set(targetColors);
      targetColors = null;
    }
  }
  renderer.render(scene, camera);
}

// Cambia i colori della galassia per il mondo dato (0-based), con dissolvenza.
export function setGalaxyWorld(worldIndex) {
  if (!started) return;
  if (!targetColors) targetColors = new Float32Array(COUNT * 3);
  buildColorsInto(targetColors, worldIndex);
}
