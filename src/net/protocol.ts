// Típusos, verziózott üzenetek a host és a kliensek között.
// A host SOHA nem bízik a kliens által küldött játékos-azonosítóban: a kapcsolathoz
// a "hello" üzenetkor rendelt azonosítót írja rá minden akcióra.
import { PROTOCOL_VERSION, type TableAction, type TableState } from '@/engine/table/state';

export type ClientMessage =
  | { v: number; t: 'hello'; playerId: string; name: string; remote: boolean }
  | { v: number; t: 'action'; action: TableAction }
  | { v: number; t: 'chat'; text: string }
  | { v: number; t: 'ping' };

export type HostMessage =
  | { v: number; t: 'state'; state: TableState }
  | { v: number; t: 'chat'; from: string; text: string; at: number }
  | { v: number; t: 'error'; code: 'version' | 'full' | 'started' | 'invalid'; message: string }
  | { v: number; t: 'pong' };

const REACTIONS_MAX_LEN = 140;

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/** Bejövő kliensüzenet ellenőrzése; érvénytelenre null */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  const m = typeof raw === 'string' ? safeJson(raw) : raw;
  if (!isObj(m) || typeof m.t !== 'string' || typeof m.v !== 'number') return null;
  switch (m.t) {
    case 'hello':
      if (typeof m.playerId !== 'string' || !/^[A-Za-z0-9_-]{6,64}$/.test(m.playerId)) return null;
      if (typeof m.name !== 'string') return null;
      return { v: m.v, t: 'hello', playerId: m.playerId, name: m.name.slice(0, 24), remote: m.remote === true };
    case 'action':
      if (!isObj(m.action) || typeof m.action.type !== 'string') return null;
      return { v: m.v, t: 'action', action: m.action as unknown as TableAction };
    case 'chat':
      if (typeof m.text !== 'string' || m.text.trim() === '') return null;
      return { v: m.v, t: 'chat', text: m.text.slice(0, REACTIONS_MAX_LEN) };
    case 'ping':
      return { v: m.v, t: 'ping' };
    default:
      return null;
  }
}

/** A kliens akciójára ráírja a kapcsolathoz kötött azonosítót (megszemélyesítés ellen) */
export function bindActionToPlayer(action: TableAction, playerId: string): TableAction {
  const a = { ...action } as Record<string, unknown>;
  if ('playerId' in a) a.playerId = playerId;
  if ('by' in a) a.by = playerId;
  // Kliens nem csatlakoztathat mást, és nem indíthat 'join'-t akció formájában
  if (a.type === 'join') return { type: 'reconnect', playerId };
  return a as unknown as TableAction;
}

export function isCompatible(v: number): boolean {
  return v === PROTOCOL_VERSION;
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}
