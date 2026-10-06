// Asztali (többjátékos) kapcsolat állapota a böngészőben. Nem a játék maga: mindenki a saját
// telefonján a saját játékát játssza; az asztal a fordulókat, a ranglistát és a reakciókat köti össze.
// Automatikus újracsatlakozás: szívverés, visszalépéses újrapróbálás, és azonnali próba,
// amikor az alkalmazás visszakerül az előtérbe (iOS-en a háttérben a kapcsolat megszakadhat).
import { create } from 'zustand';
import { generateRoomCode, DEFAULT_CONFIG, type PlayerReport, type TableConfig, type TableState, type TableAction } from '@/engine/table/state';
import { startHostRoom, type HostRoom } from '@/net/host';
import { joinRoom as joinClientRoom, getOrCreatePlayerId, type ClientRoom } from '@/net/client';
import { isLocalNet } from '@/net/transport';
import { backoffDelay, isStale, PING_INTERVAL_MS, CLIENT_DEAD_AFTER_MS, WAKE_CHECK_MS } from '@/net/heartbeat';

export type TableRole = 'host' | 'client';
type Status = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

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
  /** Hányadik újrapróbálkozásnál tartunk (0 = nincs folyamatban) */
  attempt: number;
  /** Sikeres (újra)kapcsolódások sorszáma - a jelentés újraküldéséhez */
  connSeq: number;
  /** Rövid "Újra kapcsolódva" jelzés */
  justReconnected: boolean;
  reactions: Reaction[];
  entry: { code?: string } | null;
  openEntry: (code?: string) => void;
  closeEntry: () => void;
  createRoom: (name: string, config?: Partial<TableConfig>, code?: string) => Promise<void>;
  joinRoom: (code: string, name: string) => Promise<void>;
  resume: () => Promise<void>;
  reconnectNow: () => void;
  setProfile: (profileId: string) => void;
  configure: (config: Partial<TableConfig>) => void;
  start: () => void;
  report: (r: PlayerReport) => void;
  react: (text: string) => void;
  leave: () => void;
}

let host: HostRoom | null = null;
let client: ClientRoom | null = null;
let session: SessionInfo | null = null;
let reactionSeq = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let pingTimer: ReturnType<typeof setInterval> | undefined;
let wakeTimer: ReturnType<typeof setTimeout> | undefined;
let lastAlive = 0;
let listenersOn = false;
/** Szándékos kilépés után nem próbálkozunk újra */
let stopped = false;
/** A következő host-indítás új szoba (nem a mentés visszatöltése) */
let freshNext = false;

export const useTableStore = create<TableStore>()((set, get) => {
  const addReaction = (from: string, text: string) => {
    const r = { id: ++reactionSeq, from, text, at: Date.now() };
    set((st) => ({ reactions: [...st.reactions.slice(-4), r] }));
    setTimeout(() => set((st) => ({ reactions: st.reactions.filter((x) => x.id !== r.id) })), 4500);
  };

  const markConnected = () => {
    lastAlive = Date.now();
    const wasReconnecting = get().attempt > 0 || get().status === 'reconnecting';
    if (get().status !== 'connected') {
      set((st) => ({ status: 'connected', error: null, attempt: 0, connSeq: st.connSeq + 1, justReconnected: wasReconnecting }));
      if (wasReconnecting) setTimeout(() => set({ justReconnected: false }), 3000);
    }
  };

  const teardown = () => {
    try { host?.close(); } catch { /* már zárva */ }
    try { client?.close(); } catch { /* már zárva */ }
    host = null; client = null;
    if (pingTimer) clearInterval(pingTimer);
    if (wakeTimer) clearTimeout(wakeTimer);
    pingTimer = undefined; wakeTimer = undefined;
  };

  /** Kapcsolat elvesztése: visszalépéses újrapróbálás, amíg a munkamenet él */
  const lost = (msg?: string) => {
    if (stopped || !session) return;
    if (retryTimer) return; // már ütemezve
    teardown();
    const attempt = get().attempt + 1;
    set({ status: 'reconnecting', attempt, error: msg ?? null });
    retryTimer = setTimeout(() => { retryTimer = undefined; void connect(); }, backoffDelay(attempt - 1));
  };

  const connect = async () => {
    if (!session || stopped) return;
    const { role, roomCode, name } = session;
    const playerId = getOrCreatePlayerId();
    set({ role, roomCode, playerId, status: get().status === 'idle' ? 'connecting' : get().status });
    try {
      if (role === 'host') {
        const fresh = freshNext;
        freshNext = false;
        host = await startHostRoom(roomCode, playerId, name,
          (s) => { set({ table: s }); markConnected(); },
          (e) => {
            const m = e?.message ?? '';
            // A kód még foglalt a szerveren (előző peer): kicsit később újra
            if (/unavailable-id|is taken/i.test(m) || /network|server|socket|disconnect/i.test(m)) lost(friendlyError(e));
            else set({ error: friendlyError(e) });
          },
          addReaction, fresh);
      } else {
        client = await joinClientRoom(roomCode, name, true, {
          state: (s) => { set({ table: s }); markConnected(); },
          chat: addReaction,
          alive: () => { lastAlive = Date.now(); },
          error: (m) => lost(m),
          closed: () => lost('A kapcsolat megszakadt. Újracsatlakozás…'),
        });
        lastAlive = Date.now();
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = setInterval(() => {
          if (!client) return;
          if (get().status === 'connected' && isStale(lastAlive, Date.now(), CLIENT_DEAD_AFTER_MS)) { lost('A kapcsolat elhallgatott. Újracsatlakozás…'); return; }
          client.ping();
        }, PING_INTERVAL_MS);
      }
    } catch (e) {
      lost(friendlyError(e as Error));
    }
  };

  /** Az alkalmazás visszakerült előtérbe / újra van hálózat: azonnal ellenőrizzük a kapcsolatot */
  const onWake = () => {
    if (!session || stopped) return;
    if (document.visibilityState === 'hidden') return;
    if (host) {
      if (!host.isAlive()) lost('A szoba újranyitása…');
      return;
    }
    if (get().status !== 'connected' || !client) {
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = undefined; }
      teardown();
      void connect();
      return;
    }
    const before = lastAlive;
    client.ping();
    if (wakeTimer) clearTimeout(wakeTimer);
    wakeTimer = setTimeout(() => { if (lastAlive === before) lost('A kapcsolat megszakadt. Újracsatlakozás…'); }, WAKE_CHECK_MS);
  };

  const ensureListeners = () => {
    if (listenersOn || typeof window === 'undefined') return;
    listenersOn = true;
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);
    window.addEventListener('pageshow', onWake);
    // A host lapja bezárul: szólunk a klienseknek, hogy várakozó állapotba menjenek
    window.addEventListener('pagehide', () => { if (host) { try { host.close(); } catch { /* */ } } });
  };

  const begin = async (s: SessionInfo) => {
    stopped = false;
    session = s;
    saveSession(s);
    ensureListeners();
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = undefined; }
    teardown();
    set({ status: 'connecting', error: null, attempt: 0 });
    await connect();
  };

  return {
    role: null, roomCode: null, playerId: null, table: null, status: 'idle', error: null,
    attempt: 0, connSeq: 0, justReconnected: false, reactions: [], entry: null,
    openEntry: (code) => set({ entry: { code } }),
    closeEntry: () => set({ entry: null }),

    createRoom: async (name, config, code) => {
      const roomCode = code ?? generateRoomCode(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32);
      freshNext = true;
      await begin({ role: 'host', roomCode, name });
      if (config && host && host.state().phase === 'lobby') {
        host.dispatch({ type: 'configure', by: get().playerId ?? '', config: { ...DEFAULT_CONFIG, ...config } });
      }
    },

    joinRoom: async (code, name) => begin({ role: 'client', roomCode: code.trim().toUpperCase(), name }),

    resume: async () => {
      const s = loadSession();
      if (!s || get().role) return;
      await begin(s);
    },

    reconnectNow: () => {
      if (!session) return;
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = undefined; }
      teardown();
      set({ status: 'reconnecting' });
      void connect();
    },

    setProfile: (profileId) => dispatch({ type: 'setProfile', playerId: get().playerId ?? '', profileId }),
    configure: (config) => dispatch({ type: 'configure', by: get().playerId ?? '', config }),
    start: () => dispatch({ type: 'start', by: get().playerId ?? '' }),
    report: (report) => dispatch({ type: 'report', playerId: get().playerId ?? '', report }),
    react: (text) => { if (host) host.chat(text); else client?.chat(text); },

    leave: () => {
      stopped = true;
      session = null;
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = undefined; }
      teardown();
      saveSession(null);
      set({ role: null, roomCode: null, table: null, status: 'idle', error: null, attempt: 0, reactions: [], entry: null });
    },
  };

  function dispatch(a: TableAction) {
    if (host) host.dispatch(a);
    else client?.dispatch(a);
  }
});

function friendlyError(e: Error): string {
  const m = e?.message ?? '';
  if (/unavailable-id|is taken/i.test(m)) return 'A szoba újranyitása folyamatban (a szerver még az előző kapcsolatot látja)…';
  if (/peer-unavailable|Could not connect to peer/i.test(m)) return 'A szoba most nem elérhető: a szobát nyitó telefonon legyen nyitva a játék. Újrapróbálom…';
  if (/network|server|socket/i.test(m)) return 'Nincs kapcsolat a szobaszerverrel. Újrapróbálom…';
  return m || 'Kapcsolati hiba. Újrapróbálom…';
}

/** Meghívólink a szobához (a kezdőképernyő ebből tölti ki a kódot) */
export function inviteLink(roomCode: string): string {
  const base = typeof window !== 'undefined' ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/` : '';
  return `${base}?szoba=${roomCode}${isLocalNet() ? '&halo=helyi' : ''}`;
}
