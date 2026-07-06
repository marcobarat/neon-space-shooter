// Sprite cache: cuoce in un canvas offscreen le parti STATICHE dei nemici
// (corpo con gradiente volumetrico + rim-light con shadowBlur), che sono le
// operazioni più costose del frame su mobile. Le parti vive (tentacoli, ali,
// occhi, blink, pattern animati) restano disegnate per-frame sopra lo sprite.
//
// Chiave: `${tipo}|${kit}|${colore}|${size}` — per mondo è attiva una sola
// skin e i raggi sono discreti, quindi la cache resta piccola (≤ poche decine
// di sprite). Va svuotata al cambio di mondo con clearSprites().

const cache = new Map();
const SCALE = 2; // supersampling ×2: nitido anche su schermi ad alta densità

// Ritorna { canvas, half } dove half è la semi-dimensione in px logici.
// drawFn(ctx) disegna centrato sull'origine (come dentro le drawX).
export function bodySprite(key, halfSize, drawFn) {
  let s = cache.get(key);
  if (!s) {
    const canvas = document.createElement("canvas");
    const px = Math.ceil(halfSize * 2 * SCALE);
    canvas.width = px;
    canvas.height = px;
    const c = canvas.getContext("2d");
    c.scale(SCALE, SCALE);
    c.translate(halfSize, halfSize);
    drawFn(c);
    s = { canvas, half: halfSize };
    cache.set(key, s);
  }
  return s;
}

// Disegna lo sprite centrato su (0,0) del ctx corrente (già traslato).
export function blitSprite(ctx, s) {
  ctx.drawImage(s.canvas, -s.half, -s.half, s.half * 2, s.half * 2);
}

export function clearSprites() {
  cache.clear();
}

export function spriteCount() {
  return cache.size;
}
