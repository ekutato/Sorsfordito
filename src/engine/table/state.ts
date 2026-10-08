// Asztali (többjátékos) játékállapot - a host gépén fut, ez a hiteles állapot.
// Tiszta függvények: (állapot, akció) -> új állapot. Hálózat és UI nélkül tesztelhető.
import { createRng, rollDie } from '@/engine/rng';
import { moveOnBoard, BOARD } from '@/data/board';
import type { FieldType } from '@/data/board';
import type { RulesetId } from '@/rulesets';
import type { CustomProfile, GameRules, TimeScale } from '@/types/game';
import { sanitizeCustomProfile } from '@/engine/custom-profile';

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
  /**
   * A dobás forrása: 'app' = a host gépén kriptográfiai véletlen,
   * 'physical' = valódi kocka, a játékos beírja / a Bluetooth-kocka küldi az eredményt.
   */
  diceSource: 'app' | 'physical';
  /** Egyenlő verseny: mindenki a host által választott karakterrel játszik */
  sameProfile?: boolean;
  /** Időtáv: ebből jön a fordulók száma és a hónapok (a saját telefonos játék ezt használja) */
  timeScale?: TimeScale;
  /** A host játékmesteri szabályai - minden játékos ugyanezzel indul (egyenlő esélyek) */
  rules?: GameRules;
}

/** Amit a játékos telefonja a saját játékáról jelent (a ranglistához és a táblához) */
export interface PlayerReport {
  /** Hányadik fordulót fejezte be (0 = még egyet sem) */
  finishedRound: number;
  /** Melyik fordulóban tart most */
  currentRound: number;
  position: number;
  balance: number;
  netWorth: number;
  /** Jólléti index 0-100 */
  wellbeing: number;
  /** Pénzügyi szabadság % (passzív jövedelem / kiadás) */
  freedom: number;
  /** Biztonsági kör % */
  safety: number;
  /** Véget ért-e a játéka (epilógus) */
  ended?: boolean;
}

export interface TablePlayer {
  id: string;
  name: string;
  /** A játékos által választott szín ('' = még nem választott) */
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
  /** A saját játékának legutóbbi jelentése */
  report?: PlayerReport;
  /** Ha a játék indulása után csatlakozott: melyik asztali fordulóban (a saját tempójában játszik) */
  lateJoinRound?: number;
  /** Hely a közös mezőkártya-pakliban (a csatlakozás sorrendje, nem változik) */
  slot?: number;
  /** Saját helyzet (ha a játékmester engedi): életkor, induló tőke, havi bevétel és kiadás */
  custom?: CustomProfile;
  /** A játékmester jóváhagyta a saját helyzetet (a hosté automatikusan jóváhagyott) */
  customApproved?: boolean;
  /** A játékmester elutasította: a játékos a karakter alapértékeivel játszik, vagy újat küld */
  customRejected?: boolean;
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
  /** A közös mezőkártya-pakli keverése (nyilvános; a dobás seed-je titkos marad) */
  deckSeed?: number;
  /** A következő játékos helye a közös pakliban */
  nextSlot?: number;
  log: Array<{ round: number; text: string }>;
}

export type TableAction =
  | { type: 'join'; playerId: string; name: string; remote: boolean }
  | { type: 'leave'; playerId: string }
  | { type: 'reconnect'; playerId: string }
  | { type: 'setProfile'; playerId: string; profileId: string; goal?: string }
  | { type: 'setColor'; playerId: string; color: string }
  /** Saját helyzet beküldése (null = visszavonás, a karakter alapértékei) */
  | { type: 'setCustom'; playerId: string; custom: CustomProfile | null }
  /** A játékmester jóváhagyja vagy elutasítja egy játékos saját helyzetét */
  | { type: 'approveCustom'; by: string; target: string; approved: boolean }
  | { type: 'configure'; by: string; config: Partial<TableConfig> }
  | { type: 'start'; by: string; sharedFateId?: string }
  | { type: 'roll'; playerId: string; /** Csak fizikai kockánál: a dobott érték (1-6) */ value?: number }
  | { type: 'finishTurn'; playerId: string }
  | { type: 'report'; playerId: string; report: PlayerReport }
  | { type: 'pause'; by: string }
  | { type: 'resume'; by: string }
  | { type: 'skipRound'; by: string; sharedFateId?: string };

export const DEFAULT_CONFIG: TableConfig = { mode: 'sprint', totalRounds: 12, monthsPerRound: 1, turnSeconds: 0, ruleset: 'sorsfordito-alap', diceSource: 'app' };

/** 32 bites kezdőérték a böngésző kriptográfiai véletlenforrásából (WebCrypto) */
export function secureSeed(): number {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0];
  } catch {
    return Math.floor(Math.random() * 2 ** 32) >>> 0;
  }
}

export function createTable(roomCode: string, hostId: string, hostName: string, config: TableConfig = DEFAULT_CONFIG, seed: number = secureSeed()): TableState {
  const base: TableState = {
    v: PROTOCOL_VERSION, roomCode, seed, rngCalls: 0, hostId,
    phase: 'lobby', config, round: 0, players: [], log: [],
    deckSeed: secureSeed(), nextSlot: 0,
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

/** Szín nélküli játékos (pl. kiesett a lobbyból) az első szabad színt kapja, hogy a táblán megkülönböztethető legyen */
function withFallbackColors(players: TablePlayer[]): TablePlayer[] {
  const used = new Set(players.map((p) => p.color).filter(Boolean));
  return players.map((p) => {
    if (p.color) return p;
    const c = PLAYER_COLORS.find((x) => !used.has(x)) ?? PLAYER_COLORS[0];
    used.add(c);
    return { ...p, color: c };
  });
}

/** Szín a megjelenítéshez: választás előtt semleges szürke */
export const displayColor = (p: Pick<TablePlayer, 'color'>) => p.color || '#6B7280';
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
      // Játék közben is be lehet szállni: a késői játékos a saját tempójában, az 1. körtől játszik
      if (s.phase === 'finished' || s.players.length >= MAX_PLAYERS) return s;
      const late = s.phase === 'playing' || s.phase === 'paused';
      const name = a.name.trim().slice(0, 24) || `Játékos ${s.players.length + 1}`;
      const player: TablePlayer = {
        id: a.playerId, name, color: '', slot: s.nextSlot ?? s.players.length,
        // Közös karakteres lobby: az érkező is a host karakterét kapja
        ...(!late && s.config.sameProfile ? { profileId: s.players.find((x) => x.id === s.hostId)?.profileId } : {}),
        connected: true, remote: a.remote, position: 0, done: false,
        ...(late ? { lateJoinRound: s.round } : {}),
      };
      return { ...s, players: [...s.players, player], nextSlot: (s.nextSlot ?? s.players.length) + 1 };
    }
    case 'leave':
      if (s.phase === 'lobby') return { ...s, players: s.players.filter((p) => p.id !== a.playerId) };
      return { ...s, players: mapPlayer(s, a.playerId, (p) => ({ ...p, connected: false })) };
    case 'reconnect':
      return { ...s, players: mapPlayer(s, a.playerId, (p) => ({ ...p, connected: true })) };
    case 'setProfile': {
      const p = s.players.find((x) => x.id === a.playerId);
      if (s.config.sameProfile) {
        const hostProfile = s.players.find((x) => x.id === s.hostId)?.profileId;
        if (s.phase === 'lobby') {
          // Közös karakter: csak a host választ, és mindenkire érvényes
          if (!isHost(s, a.playerId)) return s;
          return { ...s, players: s.players.map((x) => ({ ...x, profileId: a.profileId })) };
        }
        // Késői játékos közös karakteres asztalnál: a host karakterét kapja
        if (!(p?.lateJoinRound !== undefined && !p.profileId) || !hostProfile) return s;
        return { ...s, players: withFallbackColors(mapPlayer(s, p.id, (x) => ({ ...x, profileId: hostProfile }))) };
      }
      // A lobbyban bárki válthat; játék közben csak a késői játékos választhat egyszer
      if (s.phase !== 'lobby' && !(p?.lateJoinRound !== undefined && !p.profileId)) return s;
      const players = mapPlayer(s, a.playerId, (x) => ({ ...x, profileId: a.profileId, goal: a.goal?.slice(0, 140) }));
      // A késői játékos a karakterválasztással indul: ha színt nem választott, az első szabadot kapja
      return { ...s, players: s.phase === 'lobby' ? players : withFallbackColors(players) };
    }
    case 'setColor': {
      const p = s.players.find((x) => x.id === a.playerId);
      if (!p || !PLAYER_COLORS.includes(a.color)) return s;
      // A lobbyban bárki válthat; játék közben csak a késői játékos, amíg nincs karaktere
      if (s.phase !== 'lobby' && !(p.lateJoinRound !== undefined && !p.profileId)) return s;
      if (s.players.some((x) => x.id !== p.id && x.color === a.color)) return s;
      return { ...s, players: mapPlayer(s, p.id, (x) => ({ ...x, color: a.color })) };
    }
    case 'setCustom': {
      const p = s.players.find((x) => x.id === a.playerId);
      if (!p || !s.config.rules?.customProfile) return s;
      if (!customEditable(s, p)) return s;
      if (a.custom === null) return { ...s, players: mapPlayer(s, p.id, (x) => ({ ...x, custom: undefined, customApproved: undefined, customRejected: undefined })) };
      const custom = sanitizeCustomProfile(a.custom);
      if (!custom) return s;
      return { ...s, players: mapPlayer(s, p.id, (x) => ({ ...x, custom, customApproved: isHost(s, p.id), customRejected: undefined })) };
    }
    case 'approveCustom': {
      if (!isHost(s, a.by)) return s;
      const p = s.players.find((x) => x.id === a.target);
      if (!p?.custom || !customEditable(s, p)) return s;
      return {
        ...s,
        players: mapPlayer(s, p.id, (x) => (a.approved
          ? { ...x, customApproved: true, customRejected: undefined }
          : { ...x, custom: undefined, customApproved: undefined, customRejected: true })),
      };
    }
    case 'configure': {
      if (!isHost(s, a.by) || s.phase !== 'lobby') return s;
      const config = { ...s.config, ...a.config };
      if (config.sameProfile && !s.config.sameProfile) {
        // Bekapcsoláskor mindenki a host karakterét kapja (ha már választott)
        const hostProfile = s.players.find((x) => x.id === s.hostId)?.profileId;
        return { ...s, config, players: s.players.map((x) => ({ ...x, profileId: hostProfile })) };
      }
      return { ...s, config };
    }
    case 'start':
      if (!isHost(s, a.by) || s.phase !== 'lobby' || s.players.length < 1) return s;
      // Saját helyzet: indulás csak, ha a játékmester mindet átnézte
      if (pendingCustoms(s).length > 0) return s;
      return startRound({ ...s, phase: 'playing', players: withFallbackColors(s.players) }, a.sharedFateId);
    case 'roll': {
      if (s.phase !== 'playing') return s;
      const p = s.players.find((x) => x.id === a.playerId);
      if (!p || p.done || p.lastRoll !== undefined) return s;
      let roll: number, rngCalls = s.rngCalls;
      if (s.config.diceSource === 'physical') {
        if (!Number.isInteger(a.value) || (a.value as number) < 1 || (a.value as number) > 6) return s;
        roll = a.value as number;
      } else {
        ({ roll, rngCalls } = nextRoll(s));
      }
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
    case 'report': {
      if (s.phase !== 'playing' && s.phase !== 'paused') return s;
      if (!s.players.some((p) => p.id === a.playerId)) return s;
      const r = sanitizeReport(a.report);
      if (!r) return s;
      const next = {
        ...s,
        players: mapPlayer(s, a.playerId, (p) => ({
          ...p, report: r, position: r.position % BOARD.length,
          // Kész a fordulóval, ha a saját játékában lezárta a mostani asztali fordulót
          done: r.ended === true || r.finishedRound >= s.round,
        })),
      };
      return s.phase === 'playing' ? closeRoundIfDone(next) : next;
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

/**
 * Rangsor: a pénzügyi függetlenség (passzív jövedelem / kiadás) - ez a kiinduló vagyontól kevésbé függ,
 * mint a nettó vagyon. Holtversenynél a biztonsági kör, majd a jóllét dönt.
 */
export function rankPlayers<T extends { report?: PlayerReport }>(players: T[]): T[] {
  return players.filter((p) => p.report).sort((a, b) =>
    b.report!.freedom - a.report!.freedom || b.report!.safety - a.report!.safety || b.report!.wellbeing - a.report!.wellbeing);
}

/** Jóváhagyásra váró saját helyzetek (csak ha a szabály engedi) */
export function pendingCustoms(s: TableState): TablePlayer[] {
  if (!s.config.rules?.customProfile) return [];
  return s.players.filter((p) => p.custom && !p.customApproved && customEditable(s, p));
}

/** A lobbyban bárki; játék közben csak a késői játékos, amíg a saját játéka el nem indult (nincs jelentése) */
function customEditable(s: TableState, p: TablePlayer): boolean {
  return s.phase === 'lobby' || (p.lateJoinRound !== undefined && !p.report);
}

/** A játékos induló saját helyzete: csak engedélyezett szabálynál és jóváhagyva */
export function approvedCustom(s: TableState, p: TablePlayer): CustomProfile | undefined {
  return s.config.rules?.customProfile && p.custom && p.customApproved ? p.custom : undefined;
}

/** Későn csatlakozott, és még nem érte utol az asztali fordulót: nem tartja fel a többieket */
export function isCatchingUp(s: TableState, p: TablePlayer): boolean {
  return p.lateJoinRound !== undefined && (p.report?.currentRound ?? 0) < s.round;
}

/** A forduló akkor zárul, ha minden csatlakozott játékos kész (a kiesettek nem tartják fel a többieket) */
export function closeRoundIfDone(s: TableState, nextSharedFateId?: string): TableState {
  const active = s.players.filter((p) => p.connected && !isCatchingUp(s, p));
  if (active.length === 0 || !active.every((p) => p.done)) return s;
  if (s.round >= s.config.totalRounds) return { ...s, phase: 'finished' };
  return startRound(s, nextSharedFateId);
}

const finite = (x: unknown) => typeof x === 'number' && Number.isFinite(x);

/** A kliens jelentésének ellenőrzése (a host nem bízik vakon a számokban) */
export function sanitizeReport(r: unknown): PlayerReport | null {
  if (!r || typeof r !== 'object') return null;
  const o = r as Record<string, unknown>;
  const keys = ['finishedRound', 'currentRound', 'position', 'balance', 'netWorth', 'wellbeing', 'freedom', 'safety'] as const;
  if (!keys.every((k) => finite(o[k]))) return null;
  const int = (k: (typeof keys)[number], lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(o[k] as number)));
  return {
    finishedRound: int('finishedRound', 0, 1000),
    currentRound: int('currentRound', 0, 1000),
    position: int('position', 0, BOARD.length - 1),
    balance: int('balance', -1e11, 1e11),
    netWorth: int('netWorth', -1e11, 1e11),
    wellbeing: int('wellbeing', 0, 100),
    freedom: int('freedom', 0, 10000),
    safety: int('safety', 0, 100),
    ended: o.ended === true,
  };
}

/**
 * A klienseknek kiküldött nézet: a seed és a hívásszámláló a hostnál marad,
 * különben a játékosok előre kiszámolhatnák a következő dobásokat.
 */
export function publicView(s: TableState): TableState {
  return { ...s, seed: 0, rngCalls: 0 };
}

/** Szobakód: 4 betű, összetéveszthető karakterek nélkül */
export function generateRoomCode(rng: () => number = Math.random): string {
  const ALPHA = 'ABCDEFGHJKLMNPRSTUVZ';
  return Array.from({ length: 4 }, () => ALPHA[Math.floor(rng() * ALPHA.length)]).join('');
}
