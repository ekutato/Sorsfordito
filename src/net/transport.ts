// WebRTC-kapcsolat PeerJS-szel. A host a szobakódból képzett peer-azonosítón figyel,
// a kliensek oda csatlakoznak. Csak böngészőben fut (dinamikus import, SSR-mentes).
// TURN: ha a /sorsfordito/.netlify/functions/turn-credentials elérhető, rövid élettartamú
// hitelesítőt kér; ha nincs, STUN-nal próbálkozik (egy wifin így is működik).
import type { DataConnection, Peer as PeerType } from 'peerjs';

export const PEER_PREFIX = 'sorsfordito-hu-';
const STUN: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }];

export function hostPeerId(roomCode: string): string {
  return `${PEER_PREFIX}${roomCode.toUpperCase()}`;
}

export async function getIceServers(base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''): Promise<RTCIceServer[]> {
  try {
    const r = await fetch(`${base}/api/turn-credentials`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return STUN;
    const j = (await r.json()) as { iceServers?: RTCIceServer[] };
    return j.iceServers && j.iceServers.length ? [...STUN, ...j.iceServers] : STUN;
  } catch {
    return STUN;
  }
}

export interface Transport {
  send(msg: unknown): void;
  close(): void;
}

export interface HostTransport {
  /** Üzenet egy kapcsolatnak */
  sendTo(connId: string, msg: unknown): void;
  broadcast(msg: unknown): void;
  /** Egy (elhallgatott) kapcsolat bontása */
  drop(connId: string): void;
  /** Él-e még a szoba (a jelzőszerverhez kötött peer) */
  isAlive(): boolean;
  close(): void;
}

export interface HostHandlers {
  onOpen: () => void;
  onConnect: (connId: string) => void;
  onMessage: (connId: string, raw: unknown) => void;
  onDisconnect: (connId: string) => void;
  onError: (err: Error) => void;
}

async function createPeer(id?: string): Promise<PeerType> {
  const { Peer } = await import('peerjs');
  const iceServers = await getIceServers();
  const opts = { config: { iceServers }, debug: 0 };
  return id ? new Peer(id, opts) : new Peer(opts);
}

/**
 * Helyi tesztcsatorna (?halo=helyi): ugyanabban a böngészőben, több lapon,
 * internet és jelzőszerver nélkül (BroadcastChannel). Fejlesztéshez és automatikus teszthez.
 */
export function isLocalNet(): boolean {
  try { return new URLSearchParams(window.location.search).get('halo') === 'helyi'; } catch { return false; }
}

type LocalMsg = { kind: 'open' | 'data' | 'close'; from: string; to: string; data?: unknown };

/** Bezárt csatornára küldés csendben elnyelve (a kapcsolat már bomlik) */
function post(ch: BroadcastChannel, m: LocalMsg) {
  try { ch.postMessage(m); } catch { /* csatorna zárva */ }
}

function openLocalHost(roomCode: string, h: HostHandlers): HostTransport {
  const ch = new BroadcastChannel(`sorsfordito-${roomCode}`);
  const conns = new Set<string>();
  ch.onmessage = (e: MessageEvent<LocalMsg>) => {
    const m = e.data;
    if (m.to !== 'host') return;
    if (m.kind === 'open') { conns.add(m.from); post(ch, { kind: 'open', from: 'host', to: m.from }); h.onConnect(m.from); }
    else if (m.kind === 'data' && conns.has(m.from)) h.onMessage(m.from, m.data);
    else if (m.kind === 'close') { conns.delete(m.from); h.onDisconnect(m.from); }
  };
  setTimeout(() => h.onOpen(), 0);
  let alive = true;
  return {
    sendTo: (id, msg) => post(ch, { kind: 'data', from: 'host', to: id, data: msg }),
    broadcast: (msg) => conns.forEach((id) => post(ch, { kind: 'data', from: 'host', to: id, data: msg })),
    drop: (id) => { conns.delete(id); post(ch, { kind: 'close', from: 'host', to: id }); },
    isAlive: () => alive,
    close: () => { alive = false; conns.forEach((id) => post(ch, { kind: 'close', from: 'host', to: id })); ch.close(); },
  };
}

function joinLocalHost(roomCode: string, h: ClientHandlers): Transport {
  const ch = new BroadcastChannel(`sorsfordito-${roomCode}`);
  const me = `c-${Math.random().toString(36).slice(2, 10)}`;
  let open = false;
  ch.onmessage = (e: MessageEvent<LocalMsg>) => {
    const m = e.data;
    if (m.to !== me) return;
    if (m.kind === 'open' && !open) { open = true; h.onOpen(); }
    else if (m.kind === 'data') h.onMessage(m.data);
    else if (m.kind === 'close') h.onClose();
  };
  // A host lehet, hogy még nem figyel: néhányszor újrapróbáljuk
  let tries = 0;
  const knock = () => { if (open || tries++ > 20) return; post(ch, { kind: 'open', from: me, to: 'host' }); setTimeout(knock, 300); };
  knock();
  return {
    send: (msg) => post(ch, { kind: 'data', from: me, to: 'host', data: msg }),
    close: () => { post(ch, { kind: 'close', from: me, to: 'host' }); ch.close(); },
  };
}

export async function openHost(roomCode: string, h: HostHandlers): Promise<HostTransport> {
  if (isLocalNet()) return openLocalHost(roomCode, h);
  const peer = await createPeer(hostPeerId(roomCode));
  const conns = new Map<string, DataConnection>();
  peer.on('open', () => h.onOpen());
  peer.on('error', (e) => h.onError(e as Error));
  // A jelzőszerverről leszakadva (hálózatváltás, háttérbe kerülés) visszakapcsolódunk;
  // a már élő adatcsatornák ettől függetlenül működnek tovább
  peer.on('disconnected', () => { if (!peer.destroyed) { try { peer.reconnect(); } catch { /* újra próbáljuk később */ } } });
  peer.on('connection', (conn) => {
    conn.on('open', () => { conns.set(conn.connectionId, conn); h.onConnect(conn.connectionId); });
    conn.on('data', (d) => h.onMessage(conn.connectionId, d));
    conn.on('close', () => { conns.delete(conn.connectionId); h.onDisconnect(conn.connectionId); });
  });
  return {
    sendTo: (id, msg) => conns.get(id)?.send(msg),
    broadcast: (msg) => conns.forEach((c) => { try { c.send(msg); } catch { /* bomló kapcsolat */ } }),
    drop: (id) => { conns.get(id)?.close(); conns.delete(id); },
    isAlive: () => !peer.destroyed,
    close: () => peer.destroy(),
  };
}

export interface ClientHandlers {
  onOpen: () => void;
  onMessage: (raw: unknown) => void;
  onClose: () => void;
  onError: (err: Error) => void;
}

export async function joinHost(roomCode: string, h: ClientHandlers): Promise<Transport> {
  if (isLocalNet()) return joinLocalHost(roomCode, h);
  const peer = await createPeer();
  let conn: DataConnection | undefined;
  peer.on('open', () => {
    conn = peer.connect(hostPeerId(roomCode), { reliable: true, serialization: 'json' });
    conn.on('open', () => h.onOpen());
    conn.on('data', (d) => h.onMessage(d));
    conn.on('close', () => h.onClose());
    conn.on('error', (e) => h.onError(e as Error));
  });
  peer.on('error', (e) => h.onError(e as Error));
  return {
    send: (msg) => { try { conn?.send(msg); } catch { /* bomló kapcsolat - a szívverés észreveszi */ } },
    close: () => peer.destroy(),
  };
}
