// ---------------------------------------------------------------------------
// Wormzy sound engine — everything here is synthesized with the Web Audio
// API. No audio files, no external assets, nothing to license. Browsers
// block audio until a user gesture happens, so init()/resume() should be
// called from a click handler (we do this in startLevel()).
// ---------------------------------------------------------------------------

let ctx = null;
let masterGain = null;
let muted = false;

let ambiencePlaying = false;
let padA = null;
let padB = null;
let padGain = null;
let noteTimer = null;
let birdTimer = null;

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

function sweep(freqFrom, freqTo, { type = "sine", duration = 0.4, gain = 0.18, delay = 0 } = {}) {
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

function noiseBurst({ duration = 0.12, gain = 0.15, delay = 0, filterFreq = 800 } = {}) {
  const c = getCtx();
  if (!c) return;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
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

export function playEat() {
  tone(880, { type: "triangle", duration: 0.12, gain: 0.16 });
  tone(1320, { type: "triangle", duration: 0.16, gain: 0.14, delay: 0.06 });
}

export function playPush() {
  noiseBurst({ duration: 0.1, gain: 0.14, filterFreq: 350 });
  tone(110, { type: "sawtooth", duration: 0.12, gain: 0.1 });
}

export function playInvalid() {
  tone(140, { type: "square", duration: 0.08, gain: 0.1 });
}

export function playSpikeHit() {
  noiseBurst({ duration: 0.2, gain: 0.2, filterFreq: 2200 });
  tone(90, { type: "sawtooth", duration: 0.25, gain: 0.15 });
}

export function playFall() {
  sweep(650, 70, { type: "sine", duration: 0.55, gain: 0.16 });
}

export function playLevelComplete() {
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(freq, { type: "triangle", duration: 0.22, gain: 0.15, delay: i * 0.11 });
  });
}

export function playAllComplete() {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
    tone(freq, { type: "triangle", duration: 0.3, gain: 0.16, delay: i * 0.1 });
  });
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
    tone(freq, { type: "sine", duration: 0.5, gain: 0.1, delay: 0.55 + i * 0.02 });
  });
}

// ---------- soothing background ambience ----------
// A soft two-voice drone (like a held piano pedal chord) plus a slow,
// randomised pentatonic note loop (piano-ish) and occasional bird chirps
// (zoo/nature feel). Everything is generated — nothing to load.

const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C D E G A C — pentatonic-ish, always sounds pleasant

function pianoNote(freq, gainLevel = 0.05, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const harmonic = c.createOscillator();
  const amp = c.createGain();
  const harmonicGain = c.createGain();
  osc.type = "sine";
  harmonic.type = "triangle";
  osc.frequency.value = freq;
  harmonic.frequency.value = freq * 2;
  harmonicGain.gain.value = 0.25;
  osc.connect(amp);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(amp);
  amp.connect(masterGain);
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(gainLevel, t0 + 0.03);
  amp.gain.exponentialRampToValueAtTime(0.0008, t0 + 2.2);
  osc.start(t0);
  harmonic.start(t0);
  osc.stop(t0 + 2.3);
  harmonic.stop(t0 + 2.3);
}

function chirp() {
  const c = getCtx();
  if (!c) return;
  const base = 1800 + Math.random() * 900;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(base, t0);
  osc.frequency.exponentialRampToValueAtTime(base * 1.35, t0 + 0.07);
  osc.frequency.exponentialRampToValueAtTime(base * 0.85, t0 + 0.15);
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(0.05, t0 + 0.015);
  amp.gain.linearRampToValueAtTime(0, t0 + 0.2);
  osc.connect(amp);
  amp.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + 0.22);
  if (Math.random() < 0.5) {
    // a quick second chirp, like a reply
    setTimeout(() => {
      if (ambiencePlaying) chirp();
    }, 160 + Math.random() * 120);
  }
}

function scheduleNote() {
  if (!ambiencePlaying) return;
  const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
  pianoNote(freq, 0.05);
  const delay = 1.2 + Math.random() * 1.4;
  noteTimer = setTimeout(scheduleNote, delay * 1000);
}

function scheduleBird() {
  if (!ambiencePlaying) return;
  const delay = 4 + Math.random() * 7;
  birdTimer = setTimeout(() => {
    if (!ambiencePlaying) return;
    chirp();
    scheduleBird();
  }, delay * 1000);
}

export function startAmbience() {
  const c = getCtx();
  if (!c || ambiencePlaying) return;
  if (c.state === "suspended") c.resume();
  ambiencePlaying = true;

  padGain = c.createGain();
  padGain.gain.value = 0.0001;
  const padFilter = c.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 700;

  padA = c.createOscillator();
  padA.type = "sine";
  padA.frequency.value = 130.81; // C3
  padB = c.createOscillator();
  padB.type = "sine";
  padB.frequency.value = 196.0; // G3
  padB.detune.value = 3;

  padA.connect(padFilter);
  padB.connect(padFilter);
  padFilter.connect(padGain);
  padGain.connect(masterGain);

  padA.start();
  padB.start();

  const t0 = c.currentTime;
  padGain.gain.linearRampToValueAtTime(0.035, t0 + 2.5);

  scheduleNote();
  scheduleBird();
}

export function stopAmbience() {
  if (!ambiencePlaying) return;
  ambiencePlaying = false;
  if (noteTimer) clearTimeout(noteTimer);
  if (birdTimer) clearTimeout(birdTimer);

  const c = getCtx();
  if (c && padGain) {
    const t0 = c.currentTime;
    padGain.gain.cancelScheduledValues(t0);
    padGain.gain.setValueAtTime(padGain.gain.value, t0);
    padGain.gain.linearRampToValueAtTime(0.0001, t0 + 0.6);
  }
  const localA = padA;
const localB = padB;
setTimeout(() => {
  try {
    localA && localA.stop();
  } catch {
    /* already stopped */
  }
  try {
    localB && localB.stop();
  } catch {
    /* already stopped */
  }
}, 700);
  padA = null;
  padB = null;
  padGain = null;
}
