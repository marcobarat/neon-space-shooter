// Gestione unificata di tastiera, mouse e touch.
// Espone uno stato leggibile dal player + edge-trigger per azioni (bomba, super,
// pausa, start) + pulsanti touch a schermo per mobile.

const keys = new Set();

export const input = {
  mouseX: 270,
  mouseY: 480,
  mouseActive: false,
  firing: false,
  isTouch: false,
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

// Pulsanti touch a schermo (popolati in initInput in base al canvas).
export const touchButtons = [];

let unlockCallbacks = [];
export function onFirstInteraction(cb) {
  unlockCallbacks.push(cb);
}
function fireUnlock() {
  unlockCallbacks.forEach((cb) => cb());
  unlockCallbacks = [];
}

// Callback SINCRONO per la condivisione: va eseguito DENTRO al gesto utente
// (touch/click/tasto) per non perdere la "user activation" richiesta da
// navigator.share() su iOS/Android.
const shareCallbacks = [];
export function onShare(cb) { shareCallbacks.push(cb); }
function fireShare() { shareCallbacks.forEach((cb) => cb()); }

// Edge-trigger per le azioni.
let startPressed = false;
let bombPressed = false;
let superPressed = false;
let pausePressed = false;
let sharePressed = false;
let dailyPressed = false;
export function consumeStart() { const v = startPressed; startPressed = false; return v; }
export function consumeDaily() { const v = dailyPressed; dailyPressed = false; return v; }
export function consumeBomb() { const v = bombPressed; bombPressed = false; return v; }
export function consumeSuper() { const v = superPressed; superPressed = false; return v; }
export function consumePause() { const v = pausePressed; pausePressed = false; return v; }
export function consumeShare() { const v = sharePressed; sharePressed = false; return v; }

export function initInput(canvas) {
  // Layout pulsanti touch (coordinate canvas).
  const W = canvas.width, H = canvas.height;
  touchButtons.push(
    { id: "pause", x: W - 30, y: 30, r: 20, label: "II" },
    { id: "bomb", x: 54, y: H - 56, r: 34, label: "B" },
    { id: "super", x: W - 54, y: H - 56, r: 34, label: "S" },
    // Pulsante CONDIVIDI: visibile/attivo solo al Game Over (hidden gestito da main.js).
    { id: "share", x: W / 2, y: H * 0.32 + 210, r: 34, label: "⤴", hidden: true },
    // Pulsante SFIDA DEL GIORNO: visibile solo nel menu (hidden gestito da main.js).
    { id: "daily", x: W / 2, y: H * 0.5 + 236, r: 34, label: "🔥", hidden: true },
  );

  const trigger = (id) => {
    if (id === "pause") pausePressed = true;
    else if (id === "bomb") bombPressed = true;
    else if (id === "super") superPressed = true;
    else if (id === "share") { sharePressed = true; fireShare(); }
    else if (id === "daily") dailyPressed = true;
  };

  // ---- Tastiera ----
  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (e.code === "Space") input.firing = true;
    if (!e.repeat) {
      if (e.code === "KeyB" || e.code === "ShiftLeft") bombPressed = true;
      if (e.code === "KeyE") superPressed = true;
      if (e.code === "KeyP" || e.code === "Escape") pausePressed = true;
      // Condividi (desktop): non deve contare come "premi per riprovare".
      if (e.code === "KeyC") { sharePressed = true; fireShare(); }
      // Sfida del giorno (desktop).
      if (e.code === "KeyG") dailyPressed = true;
    }
    startPressed = true;
    fireUnlock();
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
    if (e.code === "Space") input.firing = false;
  });

  const toCanvas = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((clientX - rect.left) / rect.width) * canvas.width;
    input.mouseY = ((clientY - rect.top) / rect.height) * canvas.height;
  };
  const canvasPoint = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };
  const hitButton = (p) => touchButtons.find((b) => {
    if (b.hidden) return false;
    const dx = p.x - b.x, dy = p.y - b.y;
    return dx * dx + dy * dy <= (b.r + 8) * (b.r + 8);
  });

  // ---- Mouse ----
  canvas.addEventListener("mousemove", (e) => { toCanvas(e.clientX, e.clientY); input.mouseActive = true; });
  canvas.addEventListener("mousedown", (e) => {
    input.mouseActive = true;
    const p = canvasPoint(e.clientX, e.clientY);
    const b = hitButton(p);
    // "share" non deve contare come "premi per riprovare" (niente startPressed).
    if (b) { trigger(b.id); if (b.id !== "share" && b.id !== "daily") startPressed = true; fireUnlock(); return; }
    toCanvas(e.clientX, e.clientY);
    input.firing = true;
    startPressed = true;
    fireUnlock();
  });
  window.addEventListener("mouseup", () => { input.firing = false; });

  // ---- Touch ----
  // La nave si posiziona SOPRA il dito di questo offset, così il pollice non la copre.
  const TOUCH_OFFSET = 90;
  let moveTouchId = null;
  const onStart = (e) => {
    e.preventDefault();
    input.isTouch = true;
    for (const t of e.changedTouches) {
      const p = canvasPoint(t.clientX, t.clientY);
      const b = hitButton(p);
      if (b) { trigger(b.id); if (b.id !== "share" && b.id !== "daily") startPressed = true; fireUnlock(); continue; }
      // Touch di movimento/sparo.
      moveTouchId = t.identifier;
      input.mouseX = p.x; input.mouseY = Math.max(0, p.y - TOUCH_OFFSET);
      input.mouseActive = true;
      input.firing = true;
      startPressed = true;
      fireUnlock();
    }
  };
  const onMove = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === moveTouchId) {
        const p = canvasPoint(t.clientX, t.clientY);
        input.mouseX = p.x; input.mouseY = Math.max(0, p.y - TOUCH_OFFSET);
      }
    }
  };
  const onEnd = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === moveTouchId) {
        moveTouchId = null;
        input.firing = false;
      }
    }
  };
  canvas.addEventListener("touchstart", onStart, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onEnd, { passive: false });
  canvas.addEventListener("touchcancel", onEnd, { passive: false });
}
