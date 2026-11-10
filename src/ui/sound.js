/**
 * sound.js — Soft Web Audio sounds. Mute toggle saved in localStorage.
 * Audio starts only after first user interaction.
 */

let ctx = null;
let muted = false;

try {
  muted = localStorage.getItem('loopfarm.muted') === 'true';
} catch {}

function getCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { ctx = null; }
  }
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function play(freq, type, duration, attack = 0.005, vol = 0.18) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(vol, c.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration + 0.01);
  } catch {}
}

export const sound = {
  plant()    { play(440, 'sine', 0.1, 0.01, 0.12); },
  water()    { play(660, 'sine', 0.15, 0.01, 0.1); play(880, 'sine', 0.1, 0.02, 0.07); },
  harvest()  { play(523, 'triangle', 0.2, 0.01, 0.15); play(659, 'triangle', 0.15, 0.03, 0.1); },
  bump()     { play(220, 'sawtooth', 0.08, 0.001, 0.08); },
  complete() { [523,659,784,1047].forEach((f,i) => setTimeout(() => play(f,'sine',0.3,0.01,0.15), i*120)); },

  isMuted() { return muted; },

  setMuted(val) {
    muted = val;
    try { localStorage.setItem('loopfarm.muted', String(val)); } catch {}
  },

  toggle() {
    this.setMuted(!muted);
    return muted;
  },

  // Must be called on first user interaction to unlock AudioContext
  unlock() { getCtx(); },
};
