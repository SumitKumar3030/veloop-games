// ---------------------------------------------------------------------------
// Merge Master sound engine.
//
// SFX are synthesized with the Web Audio API — no files, nothing to license.
// Background music plays YOUR OWN track via a plain <audio> element, the
// same way it's wired up in Wormzy: drop a file in your project's
// /public/sounds folder and point BACKGROUND_MUSIC_SRC at it from Game.jsx.
//
// Browsers block audio until a user gesture happens, so initSound() /
// startBackgroundMusic() should be called from a click handler — Game.jsx
// calls them from handlePlay(), which only ever runs from a button press.
// ---------------------------------------------------------------------------

let ctx = null;
let masterGain = null;
let muted = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

export function initSound() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume();
}

export function setMuted(value) {
  muted = value;
  const c = getCtx();
  if (c && masterGain) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 1, c.currentTime, 0.05);
  }
  if (bgAudio) {
    bgAudio.volume = muted ? 0 : bgTargetVolume;
  }
}

export function isMuted() {
  return muted;
}

// ---------- low-level helpers ----------

function tone(freq, { type = "sine", duration = 0.15, gain = 0.2, delay = 0, attack = 0.01 } = {}) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(amp);
  amp.connect(masterGain);
  const t0 = c.currentTime + delay;
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(gain, t0 + attack);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function sweep(freqFrom, freqTo, { type = "sine", duration = 0.35, gain = 0.18, delay = 0 } = {}) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  const t0 = c.currentTime + delay;
  osc.frequency.setValueAtTime(freqFrom, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), t0 + duration);
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(amp);
  amp.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noiseBurst({ duration = 0.15, gain = 0.2, delay = 0, filterFreq = 900, filterType = "lowpass" } = {}) {
  const c = getCtx();
  if (!c) return;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  const amp = c.createGain();
  src.connect(filter);
  filter.connect(amp);
  amp.connect(masterGain);
  const t0 = c.currentTime + delay;
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

// ---------- game sound effects ----------

// Same tiers as getEffectLevel() in Game.jsx — pitch/intensity climbs with
// the merged tile's value so a 1024 merge feels bigger than a 4 merge.
function mergeTierFor(value) {
  if (value >= 1024) return "legendary";
  if (value >= 256) return "epic";
  if (value >= 64) return "strong";
  if (value >= 16) return "medium";
  return "small";
}

// Call once per merge, e.g. result.merges.forEach((m, i) => playMerge(m.value, i))
// `stackIndex` staggers simultaneous merges slightly so a combo doesn't
// sound like one muddy chord.
export function playMerge(value, stackIndex = 0) {
  const tier = mergeTierFor(value);
  const delay = stackIndex * 0.05;

  if (tier === "small") {
    tone(720, { type: "triangle", duration: 0.1, gain: 0.14, delay });
    tone(960, { type: "triangle", duration: 0.12, gain: 0.1, delay: delay + 0.04 });
  } else if (tier === "medium") {
    tone(540, { type: "triangle", duration: 0.12, gain: 0.16, delay });
    tone(810, { type: "triangle", duration: 0.14, gain: 0.12, delay: delay + 0.05 });
  } else if (tier === "strong") {
    tone(380, { type: "sawtooth", duration: 0.14, gain: 0.14, delay });
    tone(570, { type: "triangle", duration: 0.18, gain: 0.14, delay: delay + 0.05 });
    tone(760, { type: "sine", duration: 0.2, gain: 0.1, delay: delay + 0.09 });
  } else if (tier === "epic") {
    tone(300, { type: "sawtooth", duration: 0.18, gain: 0.16, delay });
    tone(450, { type: "triangle", duration: 0.2, gain: 0.15, delay: delay + 0.06 });
    tone(600, { type: "sine", duration: 0.24, gain: 0.12, delay: delay + 0.12 });
    tone(900, { type: "sine", duration: 0.28, gain: 0.1, delay: delay + 0.18 });
  } else {
    // legendary — a little fanfare
    [261.63, 329.63, 392.0, 523.25, 659.25].forEach((freq, i) => {
      tone(freq, { type: "triangle", duration: 0.28, gain: 0.15, delay: delay + i * 0.08 });
    });
  }
}

// A short rising flourish layered on top when a single move chains more
// than one merge (combo x2, x3...). Call in addition to playMerge for each.
export function playComboBoost(comboCount) {
  if (comboCount < 2) return;
  const steps = Math.min(comboCount, 5);
  sweep(500 + steps * 40, 900 + steps * 120, { type: "sine", duration: 0.22, gain: 0.1 });
}

// Very soft tick for a fresh tile appearing after a move — quiet on
// purpose since it happens almost every turn.
export function playSpawn() {
  tone(1200, { type: "sine", duration: 0.05, gain: 0.05 });
}

export function playInvalidMove() {
  tone(160, { type: "square", duration: 0.08, gain: 0.1 });
}

export function playBombExplosion() {
  noiseBurst({ duration: 0.3, gain: 0.24, filterFreq: 1200 });
  sweep(220, 40, { type: "sawtooth", duration: 0.4, gain: 0.18 });
}

export function playBonus() {
  tone(784, { type: "triangle", duration: 0.16, gain: 0.14 });
  tone(1046.5, { type: "triangle", duration: 0.2, gain: 0.13, delay: 0.08 });
}

export function playRevive() {
  [392.0, 523.25, 659.25, 784.0].forEach((freq, i) => {
    tone(freq, { type: "triangle", duration: 0.22, gain: 0.14, delay: i * 0.09 });
  });
}

export function playGameOver() {
  sweep(500, 90, { type: "sawtooth", duration: 0.7, gain: 0.16 });
  tone(140, { type: "sine", duration: 0.5, gain: 0.12, delay: 0.35 });
}

// ---------------------------------------------------------------------------
// Custom background music (your own file, e.g. public/sounds/background.mp3)
// Plain HTML5 <audio> element, looped, independent of the Web Audio SFX
// above — just fades your track in/out quietly under the action.
// ---------------------------------------------------------------------------
let bgAudio = null;
let bgTargetVolume = 0.22;

function fadeAudio(audio, target, durationMs, onDone) {
  const start = audio.volume;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / durationMs);
    audio.volume = start + (target - start) * t;
    if (t < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}

// src: root-relative path to your file in /public, e.g. "/sounds/background.mp3"
// volume: 0 to 1 — start low (0.15–0.25) so it sits under the SFX
export function startBackgroundMusic(src, volume = 0.22) {
  if (typeof window === "undefined") return;
  bgTargetVolume = volume;

  if (bgAudio) {
    bgAudio.volume = muted ? 0 : bgTargetVolume;
    if (bgAudio.paused) bgAudio.play().catch(() => {});
    return;
  }

  bgAudio = new Audio(src);
  bgAudio.loop = true;
  bgAudio.volume = 0;
  bgAudio.play().catch(() => {
    // Autoplay was blocked — startBackgroundMusic() is called from
    // handlePlay(), a click handler, so this should be rare.
  });
  fadeAudio(bgAudio, muted ? 0 : bgTargetVolume, 1500);
}

export function stopBackgroundMusic() {
  if (!bgAudio) return;
  const toStop = bgAudio;
  bgAudio = null;
  fadeAudio(toStop, 0, 500, () => toStop.pause());
}

export function setBackgroundVolume(volume) {
  bgTargetVolume = volume;
  if (bgAudio && !muted) bgAudio.volume = volume;
}
