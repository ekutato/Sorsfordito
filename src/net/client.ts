// Kliensoldal: csatlakozik a hosthoz, akciókat küld, állapotot kap.
// A játékos-azonosító a böngészőben marad, így újracsatlakozáskor ugyanaz a játékos jön vissza.
import { PROTOCOL_VERSION, type TableAction, type TableState } from '@/engine/table/state';
import type { ClientMessage, HostMessage } from './protocol';
import { joinHost, type Transport } from './transport';

const ID_KEY = 'sorsfordito-jatekos-id';

export function getOrCreatePlayerId(): string {
  try {
    const existing = localStorage.getItem(ID_KEY);
    if (existing) return existing;
    const id = `j-${crypto.randomUUID()}`;
    localStorage.setItem(ID_KEY, id);
    return id;
  } catch {
    return `j-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export interface ClientRoom {
  dispatch: (a: TableAction) => void;
  chat: (text: string) => void;
  close: () => void;
}

export async function joinRoom(
  roomCode: string, name: string, remote: boolean,
  on: { state: (s: TableState) => void; chat: (from: string, text: string) => void; error: (msg: string) => void; closed: () => void },
): Promise<ClientRoom> {
  const playerId = getOrCreatePlayerId();
  let t: Transport | undefined;
  const send = (m: ClientMessage) => t?.send(m);
  t = await joinHost(roomCode, {
    onOpen: () => send({ v: PROTOCOL_VERSION, t: 'hello', playerId, name, remote }),
    onMessage: (raw) => {
      const m = raw as HostMessage;
      if (!m || typeof m !== 'object') return;
      if (m.t === 'state') on.state(m.state);
      else if (m.t === 'chat') on.chat(m.from, m.text);
      else if (m.t === 'error') on.error(m.message);
    },
    onClose: on.closed,
    onError: (e) => on.error(e.message),
  });
  return {
    dispatch: (action) => send({ v: PROTOCOL_VERSION, t: 'action', action }),
    chat: (text) => send({ v: PROTOCOL_VERSION, t: 'chat', text }),
    close: () => t?.close(),
  };
}
