// Asztali játék közben a képernyő ébren marad (Screen Wake Lock API), hogy egy szünetben
// se aludjon el a telefon, és ne szakadjon le a szobáról. Ahol nem támogatott, nem csinál semmit.
// A menüben kikapcsolható; a beállítás a böngészőben marad.

const PREF_KEY = 'sorsfordito-ebren-tartas';
type Sentinel = { release: () => Promise<void>; released?: boolean };
let sentinel: Sentinel | null = null;
let wanted = false;

export function wakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export function wakeLockEnabled(): boolean {
  try { return localStorage.getItem(PREF_KEY) !== 'ki'; } catch { return true; }
}

export function setWakeLockEnabled(on: boolean) {
  try { localStorage.setItem(PREF_KEY, on ? 'be' : 'ki'); } catch { /* nincs tárhely */ }
  if (on && wanted) keepAwake();
  else if (!on) void drop();
}

async function drop() {
  const s = sentinel;
  sentinel = null;
  try { await s?.release(); } catch { /* már elengedve */ }
}

/** Kérés (újra): a rendszer háttérbe kerüléskor elengedi, ezért előtérbe kerüléskor újra kell kérni */
export function keepAwake() {
  wanted = true;
  if (!wakeLockSupported() || !wakeLockEnabled()) return;
  if (sentinel && !sentinel.released) return;
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
  const wl = (navigator as unknown as { wakeLock: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
  wl.request('screen').then((s) => { sentinel = s; }).catch(() => { /* pl. akkumulátorkímélő mód */ });
}

export function releaseAwake() {
  wanted = false;
  void drop();
}
