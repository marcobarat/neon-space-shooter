// Suoni sintetizzati con la Web Audio API: nessun file audio da caricare.
// L'AudioContext va sbloccato dopo la prima interazione utente (policy browser).

let ctx = null;
let masterGain = null;

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.35;
  masterGain.connect(ctx.destination);
}

function tone({ freq = 440, type = "sine", dur = 0.15, vol = 1, slideTo = null }) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + dur);
}

function noise({ dur = 0.3, vol = 1 }) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1200, t);
  filter.frequency.exponentialRampToValueAtTime(200, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(t);
  src.stop(t + dur);
}

export const sfx = {
  laser: () => tone({ freq: 900, slideTo: 300, type: "square", dur: 0.12, vol: 0.25 }),
  enemyLaser: () => tone({ freq: 300, slideTo: 120, type: "sawtooth", dur: 0.18, vol: 0.2 }),
  explosion: () => noise({ dur: 0.35, vol: 0.5 }),
  hit: () => tone({ freq: 200, slideTo: 60, type: "triangle", dur: 0.2, vol: 0.4 }),
  powerup: () => {
    tone({ freq: 500, slideTo: 900, type: "sine", dur: 0.15, vol: 0.3 });
    tone({ freq: 700, slideTo: 1200, type: "sine", dur: 0.2, vol: 0.2 });
  },
  boss: () => tone({ freq: 120, slideTo: 40, type: "sawtooth", dur: 0.6, vol: 0.4 }),
};
