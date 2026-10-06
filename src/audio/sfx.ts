// Hangok és rezgés: a böngésző állítja elő (Web Audio), hangfájl nincs. Alapból némítva.
// A hang sehol nem visz egyedül információt - a látható jelzések mindig megmaradnak.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Sfx =
  | 'roll' | 'step' | 'coinIn' | 'coinOut' | 'card' | 'tick' | 'success' | 'warning'
  | 'roundReady' | 'reaction' | 'milestone' | 'gameEnd';

interface SoundPrefs {
  sound: boolean;
  haptics: boolean;
  setSound: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
}

export const useSoundPrefs = create<SoundPrefs>()(
  persist(
    (set) => ({
      sound: false,
      haptics: false,
      setSound: (on) => { set({ sound: on }); if (on) { unlockAudio(); play('success'); } },
      setHaptics: (on) => { set({ haptics: on }); if (on) buzz([30]); },
    }),
    { name: 'sorsfordito-hang', partialize: (s) => ({ sound: s.sound, haptics: s.haptics }) },
  ),
);

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    try {
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.25;
      master.connect(ctx.destination);
    } catch { ctx = null; return null; }
  }
  return ctx;
}

/** Mobilon a hang csak felhasználói érintés után indulhat: az első érintéskor feloldjuk */
export function unlockAudio() {
  const c = audio();
  if (c && c.state === 'suspended') void c.resume().catch(() => {});
}

if (typeof window !== 'undefined') {
  const once = () => { if (useSoundPrefs.getState().sound) unlockAudio(); };
  window.addEventListener('pointerdown', once, { passive: true });
  window.addEventListener('keydown', once);
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 1, endFreq?: number) {
  const c = ctx!, t = c.currentTime + start;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(start: number, dur: number, vol = 0.6, lowpass = 3000) {
  const c = ctx!, t = c.currentTime + start;
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf; f.type = 'lowpass'; f.frequency.value = lowpass; g.gain.value = vol;
  src.connect(f).connect(g).connect(master!);
  src.start(t);
}

const RECIPES: Record<Sfx, () => void> = {
  roll: () => { for (let i = 0; i < 6; i++) noise(i * 0.06, 0.05, 0.5, 2200); },
  step: () => tone(520, 0, 0.07, 'triangle', 0.6, 380),
  coinIn: () => { tone(988, 0, 0.09, 'square', 0.25); tone(1319, 0.08, 0.18, 'square', 0.25); },
  coinOut: () => tone(330, 0, 0.18, 'triangle', 0.5, 220),
  card: () => noise(0, 0.18, 0.35, 1200),
  tick: () => tone(1800, 0, 0.03, 'square', 0.25),
  success: () => { tone(660, 0, 0.1, 'sine', 0.6); tone(880, 0.09, 0.16, 'sine', 0.6); },
  warning: () => { tone(300, 0, 0.16, 'sawtooth', 0.25); tone(240, 0.15, 0.22, 'sawtooth', 0.25); },
  roundReady: () => { tone(392, 0, 0.5, 'sine', 0.7); tone(587, 0, 0.5, 'sine', 0.35); },
  reaction: () => tone(1046, 0, 0.08, 'sine', 0.5),
  milestone: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.16, 'triangle', 0.55)); },
  gameEnd: () => { [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.14, 0.32, 'sine', 0.55)); },
};

const VIBES: Partial<Record<Sfx, number[]>> = {
  roll: [20, 40, 20], coinIn: [15], coinOut: [25], warning: [60, 40, 60], milestone: [30, 50, 30, 50, 60], roundReady: [40],
};

function buzz(pattern: number[]) {
  try {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    navigator.vibrate?.(pattern);
  } catch { /* nem támogatott */ }
}

/** Hang (és ha be van kapcsolva, rezgés). Kikapcsolt állapotban semmit nem csinál. */
export function play(name: Sfx) {
  const { sound, haptics } = useSoundPrefs.getState();
  if (haptics && VIBES[name]) buzz(VIBES[name]!);
  if (!sound) return;
  const c = audio();
  if (!c) return;
  if (c.state === 'suspended') void c.resume().catch(() => {});
  try { RECIPES[name](); } catch { /* hang nélkül megy tovább */ }
}

/** Fékező: ugyanabból a hangból legfeljebb egy `gapMs`-enként (pl. sok egymás utáni egyenlegváltozás) */
export function makeThrottle(gapMs: number, now: () => number = () => Date.now()) {
  let last = -Infinity;
  return () => { const t = now(); if (t - last < gapMs) return false; last = t; return true; };
}

/** Mérföldkő: egy mutató először lépi át a küszöböt (előtte alatta volt) */
export function crossed(prev: number | undefined, next: number, threshold: number): boolean {
  return prev !== undefined && prev < threshold && next >= threshold;
}
