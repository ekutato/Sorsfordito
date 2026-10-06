// Kapcsolatdiagnosztika: lépésenkénti napló (szobaszerver, a host keresése, közvetlen kapcsolat).
// A felület a "Részletek" alatt mutatja, és a játékos kimásolhatja hibabejelentéshez.
import { create } from 'zustand';

export interface DiagEntry { at: number; text: string }

interface DiagStore {
  entries: DiagEntry[];
  /** Röviden: a szobaszerver állapota */
  signal: 'nincs' | 'kapcsolódik' | 'kapcsolódva' | 'leszakadt' | 'hiba';
  /** A közvetlen (WebRTC) kapcsolat ICE-állapota */
  ice: string;
  turn: boolean;
}

export const useDiag = create<DiagStore>()(() => ({ entries: [], signal: 'nincs', ice: '-', turn: false }));

export function diag(text: string, patch?: Partial<Omit<DiagStore, 'entries'>>) {
  useDiag.setState((s) => ({ ...patch, entries: [...s.entries.slice(-59), { at: Date.now(), text }] }));
}

export function diagText(): string {
  const s = useDiag.getState();
  const t = (n: number) => new Date(n).toLocaleTimeString('hu-HU');
  return [
    `Szobaszerver: ${s.signal} · Közvetlen kapcsolat: ${s.ice} · TURN: ${s.turn ? 'van' : 'nincs'}`,
    `Böngésző: ${typeof navigator !== 'undefined' ? navigator.userAgent : '-'}`,
    ...s.entries.map((e) => `${t(e.at)} ${e.text}`),
  ].join('\n');
}
