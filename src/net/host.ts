// Host-oldali szoba: fogadja a kliensek akcióit, alkalmazza a hiteles állapotra,
// és mindenkinek kiküldi az új állapotot. Az állapotot helyben menti (folytatható).
import { createTable, reduceTable, publicView, PROTOCOL_VERSION, type TableAction, type TableState } from '@/engine/table/state';
import { parseClientMessage, bindActionToPlayer, isCompatible, type HostMessage } from './protocol';
import { openHost, isLocalNet, type HostTransport } from './transport';
import { HOST_DROP_AFTER_MS, isStale } from './heartbeat';

const SAVE_KEY = (code: string) => `sorsfordito-asztal-${code}`;
const store = () => (isLocalNet() ? sessionStorage : localStorage);

export interface HostRoom {
  state: () => TableState;
  dispatch: (a: TableAction) => void;
  /** A host saját reakciója / üzenete mindenkinek */
  chat: (text: string) => void;
  /** Él-e még a szoba (iOS-en háttérben a peer megszűnhet) */
  isAlive: () => boolean;
  close: () => void;
}

export async function startHostRoom(
  roomCode: string, hostId: string, hostName: string,
  onState: (s: TableState) => void, onError: (e: Error) => void,
  onChat: (from: string, text: string) => void = () => {},
  /** Új szoba: nem töltjük vissza a korábbi (azonos kódú) mentést */
  fresh = false,
): Promise<HostRoom> {
  let state = (fresh ? null : loadState(roomCode)) ?? createTable(roomCode, hostId, hostName);
  const connPlayer = new Map<string, string>();
  const lastSeen = new Map<string, number>();
  let transport: HostTransport | undefined;

  const publish = () => {
    saveState(state);
    onState(state);
    const msg: HostMessage = { v: PROTOCOL_VERSION, t: 'state', state: publicView(state) };
    transport?.broadcast(msg);
  };
  const apply = (a: TableAction) => { state = reduceTable(state, a); publish(); };

  transport = await openHost(roomCode, {
    onOpen: publish,
    onConnect: () => {},
    onMessage: (connId, raw) => {
      lastSeen.set(connId, Date.now());
      const m = parseClientMessage(raw);
      if (!m) return;
      if (!isCompatible(m.v)) {
        transport?.sendTo(connId, { v: PROTOCOL_VERSION, t: 'error', code: 'version', message: 'Frissítsd az alkalmazást.' } satisfies HostMessage);
        return;
      }
      if (m.t === 'hello') {
        // Ugyanaz a játékos új kapcsolattal: a régit bontjuk
        for (const [cid, pid] of connPlayer) if (pid === m.playerId && cid !== connId) { connPlayer.delete(cid); lastSeen.delete(cid); transport?.drop(cid); }
        connPlayer.set(connId, m.playerId);
        apply({ type: 'join', playerId: m.playerId, name: m.name, remote: m.remote });
        return;
      }
      const pid = connPlayer.get(connId);
      if (!pid) return;
      if (m.t === 'action') apply(bindActionToPlayer(m.action, pid));
      else if (m.t === 'chat') {
        const from = state.players.find((p) => p.id === pid)?.name ?? '?';
        transport?.broadcast({ v: PROTOCOL_VERSION, t: 'chat', from, text: m.text, at: Date.now() } satisfies HostMessage);
        onChat(from, m.text);
      } else if (m.t === 'ping') transport?.sendTo(connId, { v: PROTOCOL_VERSION, t: 'pong' } satisfies HostMessage);
    },
    onDisconnect: (connId) => dropConn(connId),
    onError,
  });

  // Csendben leszakadt kapcsolat (pl. iOS háttér): 30 mp életjel nélkül kiesettnek jelöljük,
  // hogy ne tartsa fel a kört; visszatéréskor a 'reconnect' visszahozza
  function dropConn(connId: string) {
    const pid = connPlayer.get(connId);
    connPlayer.delete(connId);
    lastSeen.delete(connId);
    // Ha ugyanaz a játékos már új kapcsolattal visszajött, nem jelöljük kiesettnek
    if (pid && ![...connPlayer.values()].includes(pid)) apply({ type: 'leave', playerId: pid });
  }
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [connId, seen] of lastSeen) {
      if (isStale(seen, now, HOST_DROP_AFTER_MS)) { transport?.drop(connId); dropConn(connId); }
    }
  }, 5000);

  return {
    state: () => state,
    dispatch: (a) => apply(bindActionToPlayer(a, hostId)),
    chat: (text) => {
      const from = state.players.find((p) => p.id === hostId)?.name ?? 'Host';
      const t = text.slice(0, 140);
      transport?.broadcast({ v: PROTOCOL_VERSION, t: 'chat', from, text: t, at: Date.now() } satisfies HostMessage);
      onChat(from, t);
    },
    isAlive: () => transport?.isAlive() ?? false,
    close: () => { clearInterval(sweep); transport?.close(); },
  };
}

function loadState(code: string): TableState | null {
  try {
    const raw = store().getItem(SAVE_KEY(code));
    const s = raw ? (JSON.parse(raw) as TableState) : null;
    return s && s.v === PROTOCOL_VERSION ? s : null;
  } catch { return null; }
}

function saveState(s: TableState): void {
  try { store().setItem(SAVE_KEY(s.roomCode), JSON.stringify(s)); } catch { /* privát mód: mentés nélkül */ }
}
