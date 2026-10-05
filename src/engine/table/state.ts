// Asztali (többjátékos) játékállapot - a host gépén fut, ez a hiteles állapot.
// Tiszta függvények: (állapot, akció) -> új állapot. Hálózat és UI nélkül tesztelhető.
import { createRng, rollDie, seedFromString } from '@/engine/rng';
import { moveOnBoard, BOARD } from '@/data/board';
import type { FieldType } from '@/data/board';
import type { RulesetId } from '@/rulesets';

export const PROTOCOL_VERSION = 1;
export const MAX_PLAYERS = 10;
export const PLAYER_COLORS = ['#F2A33A', '#5BA8F0', '#3FC795', '#E9967A', '#C7A4F2', '#E8B730', '#6EC6CA', '#F08DB0', '#A3B86C', '#B9C2D6'];

export type TablePhase = 'lobby' | 'playing' | 'paused' | 'finished';
export type TableMode = 'trial' | 'sprint' | 'session' | 'lifepath';

export interface TableConfig {
  mode: TableMode;
  /** Fordulók száma (próbajáték: 1, sprint: 12, tesztalkalom: a host állítja, életpálya: évek) */
  totalRounds: number;
  /** Hány hónap egy forduló */
  monthsPerRound: number;
  /** Fordulóidő másodpercben (0 = nincs) */
  turnSeconds: number;
  ruleset: RulesetId;
}

export interface TablePlayer {
  id: string;
  name: string;
  color: string;
  connected: boolean;
  remote: boolean;
  /** Választott kezdőprofil (karakter-preset azonosító) */
  profileId?: string;
  goal?: string;
  position: number;
  lastRoll?: number;
  landedOn?: FieldType;
  /** Ebben a fordulóban végzett-e */
  done: boolean;
}

export interface TableState {
  v: number;
  roomCode: string;
  seed: number;
  rngCalls: number;
  hostId: string;
  phase: TablePhase;
  config: TableConfig;
  round: number;
  players: TablePlayer[];
  /** A forduló közös Sorsfordító kártyája (mindenki ugyanazt húzza) */
  sharedFateId?: string;
  log: Array<{ round: number; text: string }>;
}

export type TableAction =
  | { type: 'join'; playerId: string; name: string; remote: boolean }
  | { type: 'leave'; playerId: string }
  | { type: 'reconnect'; playerId: string }
  | { type: 'setProfile'; playerId: string; profileId: string; goal?: string }
  | { type: 'configure'; by: string; config: Partial<TableConfig> }
  | { type: 'start'; by: string; sharedFateId?: string }
  | { type: 'roll'; playerId: string }
  | { type: 'finishTurn'; playerId: string }
  | { type: 'pause'; by: string }
  | { type: 'resume'; by: string }
  | { type: 'skipRound'; by: string; sharedFateId?: string };

export const DEFAULT_CONFIG: TableConfig = { mode: 'sprint', totalRounds: 12, monthsPerRound: 1, turnSeconds: 0, ruleset: 'sorsfordito-alap' };

export function createTable(roomCode: string, hostId: string, hostName: string, config: TableConfig = DEFAULT_CONFIG): TableState {
  const base: TableState = {
    v: PROTOCOL_VERSION, roomCode, seed: seedFromString(roomCode + hostId), rngCalls: 0, hostId,
    phase: 'lobby', config, round: 0, players: [], log: [],
  };
  return reduceTable(base, { type: 'join', playerId: hostId, name: hostName, remote: false });
}

/** Determinisztikus dobás: a seed + az eddigi hívások száma adja a következő értéket */
function nextRoll(state: TableState): { roll: number; rngCalls: number } {
  const rng = createRng(state.seed);
  for (let i = 0; i < state.rngCalls; i++) rng();
  return { roll: rollDie(rng), rngCalls: state.rngCalls + 1 };
}

const isHost = (s: TableState, id: string) => s.hostId === id;
const mapPlayer = (s: TableState, id: string, f: (p: TablePlayer) => TablePlayer): TablePlayer[] =>
  s.players.map((p) => (p.id === id ? f(p) : p));

function startRound(s: TableState, sharedFateId?: string): TableState {
  return {
    ...s,
    round: s.round + 1,
    sharedFateId,
    players: s.players.map((p) => ({ ...p, done: false, lastRoll: undefined, landedOn: undefined })),
  };
}

export function reduceTable(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case 'join': {
      if (s.players.some((p) => p.id === a.playerId)) return reduceTable(s, { type: 'reconnect', playerId: a.playerId });
      if (s.phase !== 'lobby' || s.players.length >= MAX_PLAYERS) return s;
      const name = a.name.trim().slice(0, 24) || `Játékos ${s.players.length + 1}`;
      const player: TablePlayer = {
        id: a.playerId, name, color: PLAYER_COLORS[s.players.length % PLAYER_COLORS.length],
        connected: true, remote: a.remote, position: 0, done: false,
      };
      return { ...s, players: [...s.players, player] };
    }
    case 'leave':
      if (s.phase === 'lobby') return { ...s, players: s.players.filter((p) => p.id !== a.playerId) };
      return { ...s, players: mapPlayer(s, a.playerId, (p) => ({ ...p, connected: false })) };
    case 'reconnect':
      return { ...s, players: mapPlayer(s, a.playerId, (p) => ({ ...p, connected: true })) };
    case 'setProfile':
      if (s.phase !== 'lobby') return s;
      return { ...s, players: mapPlayer(s, a.playerId, (p) => ({ ...p, profileId: a.profileId, goal: a.goal?.slice(0, 140) })) };
    case 'configure':
      if (!isHost(s, a.by) || s.phase !== 'lobby') return s;
      return { ...s, config: { ...s.config, ...a.config } };
    case 'start':
      if (!isHost(s, a.by) || s.phase !== 'lobby' || s.players.length < 1) return s;
      return startRound({ ...s, phase: 'playing' }, a.sharedFateId);
    case 'roll': {
      if (s.phase !== 'playing') return s;
      const p = s.players.find((x) => x.id === a.playerId);
      if (!p || p.done || p.lastRoll !== undefined) return s;
      const { roll, rngCalls } = nextRoll(s);
      const moved = moveOnBoard(p.position, roll);
      return {
        ...s, rngCalls,
        players: mapPlayer(s, p.id, (x) => ({ ...x, lastRoll: roll, position: moved.position, landedOn: BOARD[moved.position].type })),
        log: [...s.log, { round: s.round, text: `${p.name} dobott: ${roll}` }],
      };
    }
    case 'finishTurn': {
      if (s.phase !== 'playing') return s;
      const next = { ...s, players: mapPlayer(s, a.playerId, (p) => (p.lastRoll !== undefined ? { ...p, done: true } : p)) };
      return closeRoundIfDone(next);
    }
    case 'pause':
      return isHost(s, a.by) && s.phase === 'playing' ? { ...s, phase: 'paused' } : s;
    case 'resume':
      return isHost(s, a.by) && s.phase === 'paused' ? { ...s, phase: 'playing' } : s;
    case 'skipRound':
      if (!isHost(s, a.by) || s.phase !== 'playing') return s;
      return s.round >= s.config.totalRounds ? { ...s, phase: 'finished' } : startRound(s, a.sharedFateId);
  }
}

/** A forduló akkor zárul, ha minden csatlakozott játékos kész (a kiesettek nem tartják fel a többieket) */
export function closeRoundIfDone(s: TableState, nextSharedFateId?: string): TableState {
  const active = s.players.filter((p) => p.connected);
  if (active.length === 0 || !active.every((p) => p.done)) return s;
  if (s.round >= s.config.totalRounds) return { ...s, phase: 'finished' };
  return startRound(s, nextSharedFateId);
}

/** Szobakód: 4 betű, összetéveszthető karakterek nélkül */
export function generateRoomCode(rng: () => number = Math.random): string {
  const ALPHA = 'ABCDEFGHJKLMNPRSTUVZ';
  return Array.from({ length: 4 }, () => ALPHA[Math.floor(rng() * ALPHA.length)]).join('');
}
