// Asztali (többjátékos) kapcsolat állapota a böngészőben. Nem a játék maga: mindenki a saját
// telefonján a saját játékát játssza; az asztal a fordulókat, a ranglistát és a reakciókat köti össze.
import { create } from 'zustand';
import { generateRoomCode, DEFAULT_CONFIG, type PlayerReport, type TableConfig, type TableState } from '@/engine/table/state';
import { startHostRoom, type HostRoom } from '@/net/host';
import { joinRoom as joinClientRoom, getOrCreatePlayerId, type ClientRoom } from '@/net/client';
import { isLocalNet } from '@/net/transport';

export type TableRole = 'host' | 'client';
type Status = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

interface Reaction { id: number; from: string; text: string; at: number }

interface SessionInfo { role: TableRole; roomCode: string; name: string }
const SESSION_KEY = 'sorsfordito-asztal-munkamenet';
const sessionStore = () => (isLocalNet() ? sessionStorage : localStorage);

function saveSession(s: SessionInfo | null) {
  try { s ? sessionStore().setItem(SESSION_KEY, JSON.stringify(s)) : sessionStore().removeItem(SESSION_KEY); } catch { /* nincs tárhely */ }
}
export function loadSession(): SessionInfo | null {
  try { const r = sessionStore().getItem(SESSION_KEY); return r ? (JSON.parse(r) as SessionInfo) : null; } catch { return null; }
}

interface TableStore {
  role: TableRole | null;
  roomCode: string | null;
  playerId: string | null;
  table: TableState | null;
  status: Status;
  error: string | null;
  reactions: Reaction[];
  /** A belépő képernyő nyitva (kezdőképernyő gombja vagy meghívólink) */
  entry: { code?: string } | null;
  openEntry: (code?: string) => void;
  closeEntry: () => void;
  createRoom: (name: string, config?: Partial<TableConfig>, code?: string) => Promise<void>;
  joinRoom: (code: string, name: string) => Promise<void>;
  resume: () => Promise<void>;
  setProfile: (profileId: string) => void;
  configure: (config: Partial<TableConfig>) => void;
  start: () => void;
  report: (r: PlayerReport) => void;
  react: (text: string) => void;
  leave: () => void;
}

let host: HostRoom | null = null;
let client: ClientRoom | null = null;
let reactionSeq = 0;

export const useTableStore = create<TableStore>()((set, get) => {
  const addReaction = (from: string, text: string) => {
    const r = { id: ++reactionSeq, from, text, at: Date.now() };
    set((st) => ({ reactions: [...st.reactions.slice(-4), r] }));
    setTimeout(() => set((st) => ({ reactions: st.reactions.filter((x) => x.id !== r.id) })), 4500);
  };
  const fail = (msg: string) => set({ status: 'error', error: msg });

  return {
    role: null, roomCode: null, playerId: null, table: null, status: 'idle', error: null, reactions: [], entry: null,
    openEntry: (code) => set({ entry: { code } }),
    closeEntry: () => set({ entry: null }),

    createRoom: async (name, config, code) => {
      const roomCode = code ?? generateRoomCode(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32);
      const playerId = getOrCreatePlayerId();
      set({ role: 'host', roomCode, playerId, status: 'connecting', error: null });
      try {
        host = await startHostRoom(roomCode, playerId, name,
          (s) => set({ table: s, status: 'connected' }),
          (e) => fail(friendlyError(e)),
          addReaction);
        if (config && host.state().phase === 'lobby') host.dispatch({ type: 'configure', by: playerId, config: { ...DEFAULT_CONFIG, ...config } });
        saveSession({ role: 'host', roomCode, name });
      } catch (e) { fail(friendlyError(e as Error)); }
    },

    joinRoom: async (code, name) => {
      const roomCode = code.trim().toUpperCase();
      const playerId = getOrCreatePlayerId();
      set({ role: 'client', roomCode, playerId, status: 'connecting', error: null });
      try {
        client = await joinClientRoom(roomCode, name, true, {
          state: (s) => set({ table: s, status: 'connected', error: null }),
          chat: addReaction,
          error: (m) => fail(m),
          closed: () => set({ status: 'closed', error: 'A host kapcsolata megszakadt. Újracsatlakozás…' }),
        });
        saveSession({ role: 'client', roomCode, name });
      } catch (e) { fail(friendlyError(e as Error)); }
    },

    resume: async () => {
      const s = loadSession();
      if (!s || get().role) return;
      if (s.role === 'host') await get().createRoom(s.name, undefined, s.roomCode);
      else await get().joinRoom(s.roomCode, s.name);
    },

    setProfile: (profileId) => dispatch({ type: 'setProfile', playerId: get().playerId ?? '', profileId }),
    configure: (config) => dispatch({ type: 'configure', by: get().playerId ?? '', config }),
    start: () => dispatch({ type: 'start', by: get().playerId ?? '' }),
    report: (report) => dispatch({ type: 'report', playerId: get().playerId ?? '', report }),
    react: (text) => { if (host) host.chat(text); else client?.chat(text); },

    leave: () => {
      host?.close(); client?.close();
      host = null; client = null;
      saveSession(null);
      set({ role: null, roomCode: null, table: null, status: 'idle', error: null, reactions: [], entry: null });
    },
  };

  function dispatch(a: Parameters<HostRoom['dispatch']>[0]) {
    if (host) host.dispatch(a);
    else client?.dispatch(a);
  }
});

function friendlyError(e: Error): string {
  const m = e?.message ?? '';
  if (/unavailable-id|is taken/i.test(m)) return 'Ez a szobakód már foglalt. Nyiss új szobát.';
  if (/peer-unavailable|Could not connect to peer/i.test(m)) return 'Nincs ilyen nyitott szoba. Ellenőrizd a kódot, és hogy a szobát nyitó telefonon nyitva van-e a játék.';
  if (/network|server|socket/i.test(m)) return 'Nem sikerült kapcsolódni a szobaszerverhez. Ellenőrizd az internetkapcsolatot.';
  return m || 'Ismeretlen hiba a kapcsolatban.';
}

/** Meghívólink a szobához (a kezdőképernyő ebből tölti ki a kódot) */
export function inviteLink(roomCode: string): string {
  const base = typeof window !== 'undefined' ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/` : '';
  return `${base}?szoba=${roomCode}${isLocalNet() ? '&halo=helyi' : ''}`;
}
