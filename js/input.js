// Gestione unificata di tastiera e mouse.
// Espone uno stato leggibile dal player, senza sapere nulla del gioco.

const keys = new Set();

export const input = {
  mouseX: 400,
  mouseY: 300,
  mouseActive: false, // true quando l'utente muove/usa il mouse
  firing: false,      // true se Spazio o click premuti
  // Direzioni normalizzate da tastiera (-1, 0, 1)
  get dx() {
    let d = 0;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) d -= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD")) d += 1;
    return d;
  },
  get dy() {
    let d = 0;
    if (keys.has("ArrowUp") || keys.has("KeyW")) d -= 1;
    if (keys.has("ArrowDown") || keys.has("KeyS")) d += 1;
    return d;
  },
};

let unlockCallbacks = [];
export function onFirstInteraction(cb) {
  unlockCallbacks.push(cb);
}
function fireUnlock() {
  unlockCallbacks.forEach((cb) => cb());
  unlockCallbacks = [];
}

// startPressed: usato dal menu / game over per "premere un tasto per iniziare".
let startPressed = false;
export function consumeStart() {
  const v = startPressed;
  startPressed = false;
  return v;
}

// bombPressed: edge-trigger per detonare una bomba (tasto B o Shift).
let bombPressed = false;
export function consumeBomb() {
  const v = bombPressed;
  bombPressed = false;
  return v;
}

export function initInput(canvas) {
  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }
    keys.add(e.code);
    if (e.code === "Space") input.firing = true;
    if ((e.code === "KeyB" || e.code === "ShiftLeft") && !e.repeat) bombPressed = true;
    startPressed = true;
    fireUnlock();
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
    if (e.code === "Space") input.firing = false;
  });

  const toCanvas = (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
  };

  canvas.addEventListener("mousemove", (e) => {
    toCanvas(e);
    input.mouseActive = true;
  });

  canvas.addEventListener("mousedown", (e) => {
    toCanvas(e);
    input.mouseActive = true;
    input.firing = true;
    startPressed = true;
    fireUnlock();
  });

  window.addEventListener("mouseup", () => {
    input.firing = false;
  });
}
