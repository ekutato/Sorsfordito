// Szívverés és újracsatlakozás időzítése - tiszta függvények, tesztelhetők.

/** A kliens ennyi időnként pingel */
export const PING_INTERVAL_MS = 10_000;
/** Ennyi válaszhiány után a kliens halottnak tekinti a kapcsolatot */
export const CLIENT_DEAD_AFTER_MS = 25_000;
/** Ennyi csend után a host kiesettnek jelöli a játékost (nem tartja fel a kört) */
export const HOST_DROP_AFTER_MS = 30_000;
/** Visszatéréskor (előtérbe kerülés) ennyi ideig várunk a ping válaszára */
export const WAKE_CHECK_MS = 4_000;

/** Visszalépéses várakozás: 1, 2, 4, 8, majd 15 mp-enként */
export function backoffDelay(attempt: number): number {
  return Math.min(15_000, 1000 * 2 ** Math.max(0, attempt));
}

/** Halott-e a kapcsolat: az utolsó életjel óta eltelt idő meghaladja a küszöböt */
export function isStale(lastSeen: number, now: number, limitMs: number): boolean {
  return now - lastSeen > limitMs;
}
