// WebRTC-kapcsolat PeerJS-szel. A host a szobakódból képzett peer-azonosítón figyel,
// a kliensek oda csatlakoznak. Csak böngészőben fut (dinamikus import, SSR-mentes).
// TURN: ha a /sorsfordito/.netlify/functions/turn-credentials elérhető, rövid élettartamú
// hitelesítőt kér; ha nincs, STUN-nal próbálkozik (egy wifin így is működik).
import type { DataConnection, Peer as PeerType } from 'peerjs';
import { diag } from './diag';

export const PEER_PREFIX = 'sorsfordito-hu-';
const STUN: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }];

export function hostPeerId(roomCode: string): string {
  return `${PEER_PREFIX}${roomCode.toUpperCase()}`;
}

/** TURN-hitelesítő címe: a weben a saját útvonal, az APK-ban (nincs basePath) az éles oldal */
function turnUrl(base: string): string {
  if (typeof window !== 'undefined' && !base && !/nexai\.hu$/.test(window.location.hostname)) {
    return 'https://nexai.hu/sorsfordito/api/turn-credentials';
  }
  return `${base}/api/turn-credentials`;
}

export async function getIceServers(base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''): Promise<RTCIceServer[]> {
  try {
    const r = await fetch(turnUrl(base), { signal: AbortSignal.timeout(4000) });
    if (!r.ok) { diag(`TURN: nincs beállítva (${r.status}), csak STUN`, { turn: false }); return STUN; }
    const j = (await r.json()) as { iceServers?: RTCIceServer[] };
    const ok = !!(j.iceServers && j.iceServers.length);
    diag(ok ? 'TURN: van (továbbító a különböző hálózatokhoz)' : 'TURN: üres válasz, csak STUN', { turn: ok });
    return ok ? [...STUN, ...j.iceServers!] : STUN;
  } catch {
    diag('TURN: nem elérhető, csak STUN', { turn: false });
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
  /** Él-e még a szoba: a peer nincs megszűnve, és a jelzőszerveren elérhető (új játékos is be tud jönni) */
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

/** Két új peer között legalább ennyi idő telik el, hogy hiba esetén se árasszuk el a szobaszervert */
export const PEER_MIN_GAP_MS = 3000;
let lastPeerAt = 0;

async function createPeer(id?: string): Promise<PeerType> {
  const wait = lastPeerAt + PEER_MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastPeerAt = Date.now();
  const { Peer } = await import('peerjs');
  const iceServers = await getIceServers();
  const opts = { config: { iceServers }, debug: 0 };
  diag(id ? 'Szobaszerver: a szoba bejegyzése…' : 'Szobaszerver: kapcsolódás…', { signal: 'kapcsolódik', ice: '-' });
  return id ? new Peer(id, opts) : new Peer(opts);
}

/** A közvetlen kapcsolat ICE-állapotának naplózása (checking → connected / failed) */
function watchIce(conn: DataConnection, who: string) {
  const pc = (conn as unknown as { peerConnection?: RTCPeerConnection }).peerConnection;
  if (!pc) return;
  pc.addEventListener('iceconnectionstatechange', () => {
    diag(`Közvetlen kapcsolat${who}: ${pc.iceConnectionState}`, { ice: pc.iceConnectionState });
  });
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

/** Csak a helyi tesztcsatornán: a host "leszakad a szobaszerverről" (új játékost nem fogad) */
let localSignalDown = false;
if (typeof window !== 'undefined') {
  (window as unknown as { __sfNet?: unknown }).__sfNet = {
    dropSignal: () => { if (isLocalNet()) localSignalDown = true; },
  };
}

function openLocalHost(roomCode: string, h: HostHandlers): HostTransport {
  const ch = new BroadcastChannel(`sorsfordito-${roomCode}`);
  const conns = new Set<string>();
  localSignalDown = false;
  ch.onmessage = (e: MessageEvent<LocalMsg>) => {
    const m = e.data;
    if (m.to !== 'host') return;
    if (m.kind === 'open' && localSignalDown) return;
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
    isAlive: () => alive && !localSignalDown,
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
    // Mint a PeerJS valós hálózaton: a saját bezárás után a zárás-esemény késve (akár másodpercekkel később) érkezik
    close: () => { post(ch, { kind: 'close', from: me, to: 'host' }); ch.close(); open = false; setTimeout(() => h.onClose(), 1500); },
  };
}

export async function openHost(roomCode: string, h: HostHandlers): Promise<HostTransport> {
  if (isLocalNet()) return openLocalHost(roomCode, h);
  const peer = await createPeer(hostPeerId(roomCode));
  const conns = new Map<string, DataConnection>();
  let retry: ReturnType<typeof setTimeout> | undefined;
  let retryN = 0;
  peer.on('open', () => { retryN = 0; diag('Szobaszerver: a szoba elérhető', { signal: 'kapcsolódva' }); h.onOpen(); });
  peer.on('error', (e) => { diag(`Szobaszerver hiba: ${(e as { type?: string }).type ?? e.message}`, { signal: 'hiba' }); h.onError(e as Error); });
  // A jelzőszerverről leszakadva (hálózatváltás, háttérbe kerülés) visszalépéssel újrapróbáljuk;
  // a már élő adatcsatornák ettől függetlenül működnek tovább. Ha így sem megy, a host-őr újranyitja a szobát.
  const tryReconnect = () => {
    retry = undefined;
    if (peer.destroyed || !peer.disconnected) return;
    try { peer.reconnect(); } catch { /* alább újra */ }
    retryN++;
    retry = setTimeout(tryReconnect, Math.min(8000, 2000 * 2 ** (retryN - 1)));
  };
  peer.on('disconnected', () => {
    diag('Szobaszerver: leszakadt, visszakapcsolódás…', { signal: 'leszakadt' });
    if (!retry) retry = setTimeout(tryReconnect, 500);
  });
  peer.on('connection', (conn) => {
    diag('Új játékos kopogtat');
    watchIce(conn, ' (bejövő)');
    conn.on('open', () => { conns.set(conn.connectionId, conn); h.onConnect(conn.connectionId); });
    conn.on('data', (d) => h.onMessage(conn.connectionId, d));
    conn.on('close', () => { conns.delete(conn.connectionId); h.onDisconnect(conn.connectionId); });
  });
  return {
    sendTo: (id, msg) => { try { conns.get(id)?.send(msg); } catch { /* bomló kapcsolat */ } },
    broadcast: (msg) => conns.forEach((c) => { try { c.send(msg); } catch { /* bomló kapcsolat */ } }),
    drop: (id) => { conns.get(id)?.close(); conns.delete(id); },
    isAlive: () => !peer.destroyed && !peer.disconnected,
    close: () => { if (retry) clearTimeout(retry); peer.destroy(); },
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
    diag('Szobaszerver: kapcsolódva, a szoba keresése…', { signal: 'kapcsolódva' });
    conn = peer.connect(hostPeerId(roomCode), { reliable: true, serialization: 'json' });
    watchIce(conn, '');
    conn.on('open', () => { diag('Kapcsolat a szobával: nyitva'); h.onOpen(); });
    conn.on('data', (d) => h.onMessage(d));
    conn.on('close', () => h.onClose());
    conn.on('error', (e) => h.onError(e as Error));
  });
  peer.on('error', (e) => {
    const type = (e as { type?: string }).type ?? '';
    diag(`Hiba: ${type || e.message}`, type === 'peer-unavailable' ? {} : { signal: 'hiba' });
    h.onError(e as Error);
  });
  peer.on('disconnected', () => diag('Szobaszerver: leszakadt', { signal: 'leszakadt' }));
  return {
    send: (msg) => { try { conn?.send(msg); } catch { /* bomló kapcsolat - a szívverés észreveszi */ } },
    close: () => peer.destroy(),
  };
}
