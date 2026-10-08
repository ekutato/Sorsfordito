import { describe, it, expect, beforeEach } from 'vitest';
import { createTable, reduceTable, pendingCustoms, approvedCustom, DEFAULT_CONFIG, type TableState } from '@/engine/table/state';
import { sanitizeCustomProfile, presetAsCustom, CUSTOM_LIMITS } from '@/engine/custom-profile';
import { useGameStore } from '@/store/game-store';
import { DEFAULT_RULES, type CustomProfile, type GameRules } from '@/types/game';

const MINE: CustomProfile = { age: 35, balance: 1_500_000, salary: 450_000, housing: 150_000, utilities: 40_000, food: 80_000, transport: 25_000, other: 30_000 };
const RULES_ON: GameRules = { ...DEFAULT_RULES, customProfile: true };

function lobby(rules: GameRules = RULES_ON): TableState {
  let s = createTable('ABCD', 'host', 'Host', { ...DEFAULT_CONFIG, rules }, 1);
  s = reduceTable(s, { type: 'join', playerId: 'p1', name: 'Bence', remote: true });
  for (const id of ['host', 'p1']) {
    s = reduceTable(s, { type: 'setProfile', playerId: id, profileId: 'career_start' });
    s = reduceTable(s, { type: 'setColor', playerId: id, color: id === 'host' ? '#F2A33A' : '#5BA8F0' });
  }
  return s;
}

describe('saját helyzet: bemenet', () => {
  it('a határokra vág, hiányos adatot elutasít', () => {
    const c = sanitizeCustomProfile({ ...MINE, age: 5, balance: 99_000_000, salary: -10 })!;
    expect(c.age).toBe(CUSTOM_LIMITS.age[0]);
    expect(c.balance).toBe(CUSTOM_LIMITS.balance[1]);
    expect(c.salary).toBe(0);
    expect(sanitizeCustomProfile({ ...MINE, food: 'sok' })).toBeNull();
    expect(sanitizeCustomProfile(null)).toBeNull();
  });
  it('a karakter alapértékei az űrlaphoz', () => {
    const c = presetAsCustom('career_start');
    expect(c.age).toBe(24);
    expect(c.balance).toBe(220_000);
  });
});

describe('saját helyzet: egyjátékos indulás', () => {
  beforeEach(() => useGameStore.getState().resetGame());
  const cfg = { timeScale: 'sprint' as const, mode: 'solo' as const, playerCount: 1, useLiveData: false, startDate: '2026-10' };

  it('engedélyezett szabálynál a megadott számokkal indul (a tartozások maradnak)', () => {
    useGameStore.getState().startNewGame({ ...cfg, rules: RULES_ON, customProfile: MINE }, 'inheritance', 'Teszt');
    const sh = useGameStore.getState().game!.players[0].financialSheet;
    expect(sh.balance).toBe(1_500_000);
    expect(sh.startBalance).toBe(1_500_000);
    expect(sh.income.salary).toBe(450_000);
    expect(sh.expenses.housing).toBe(150_000);
    expect(sh.debts.length).toBeGreaterThan(0);
  });
  it('kikapcsolt szabálynál a megadott helyzet hatástalan', () => {
    useGameStore.getState().startNewGame({ ...cfg, rules: DEFAULT_RULES, customProfile: MINE }, 'career_start', 'Teszt');
    const sh = useGameStore.getState().game!.players[0].financialSheet;
    expect(sh.balance).toBe(220_000);
    expect(sh.income.salary).toBe(320_000);
  });
});

describe('saját helyzet: asztal, játékmesteri jóváhagyás', () => {
  it('a vendégé jóváhagyásra vár, addig nem indul a játék', () => {
    let s = reduceTable(lobby(), { type: 'setCustom', playerId: 'p1', custom: MINE });
    expect(pendingCustoms(s).map((p) => p.id)).toEqual(['p1']);
    s = reduceTable(s, { type: 'start', by: 'host' });
    expect(s.phase).toBe('lobby');
    expect(approvedCustom(s, s.players[1])).toBeUndefined();
  });
  it('jóváhagyás után indul, és a jóváhagyott helyzet megy a játékba', () => {
    let s = reduceTable(lobby(), { type: 'setCustom', playerId: 'p1', custom: MINE });
    s = reduceTable(s, { type: 'approveCustom', by: 'host', target: 'p1', approved: true });
    expect(pendingCustoms(s)).toHaveLength(0);
    s = reduceTable(s, { type: 'start', by: 'host' });
    expect(s.phase).toBe('playing');
    expect(approvedCustom(s, s.players[1])).toEqual(MINE);
  });
  it('elutasításkor a karakter alapértékei maradnak, és a játékos értesül', () => {
    let s = reduceTable(lobby(), { type: 'setCustom', playerId: 'p1', custom: MINE });
    s = reduceTable(s, { type: 'approveCustom', by: 'host', target: 'p1', approved: false });
    const p1 = s.players.find((p) => p.id === 'p1')!;
    expect(p1.custom).toBeUndefined();
    expect(p1.customRejected).toBe(true);
    expect(reduceTable(s, { type: 'start', by: 'host' }).phase).toBe('playing');
  });
  it('csak a játékmester hagyhat jóvá; a sajátja automatikusan jóváhagyott', () => {
    let s = reduceTable(lobby(), { type: 'setCustom', playerId: 'p1', custom: MINE });
    s = reduceTable(s, { type: 'approveCustom', by: 'p1', target: 'p1', approved: true });
    expect(pendingCustoms(s)).toHaveLength(1);
    s = reduceTable(s, { type: 'setCustom', playerId: 'host', custom: MINE });
    expect(s.players.find((p) => p.id === 'host')!.customApproved).toBe(true);
  });
  it('a módosított helyzet újra jóváhagyásra vár', () => {
    let s = reduceTable(lobby(), { type: 'setCustom', playerId: 'p1', custom: MINE });
    s = reduceTable(s, { type: 'approveCustom', by: 'host', target: 'p1', approved: true });
    s = reduceTable(s, { type: 'setCustom', playerId: 'p1', custom: { ...MINE, balance: 20_000_000 } });
    expect(pendingCustoms(s).map((p) => p.id)).toEqual(['p1']);
  });
  it('kikapcsolt szabálynál nem lehet beküldeni', () => {
    const s = reduceTable(lobby(DEFAULT_RULES), { type: 'setCustom', playerId: 'p1', custom: MINE });
    expect(s.players[1].custom).toBeUndefined();
  });
  it('a vendég kliens nem hagyhatja jóvá a sajátját álcázott akcióval sem', async () => {
    const { bindActionToPlayer } = await import('@/net/protocol');
    const a = bindActionToPlayer({ type: 'approveCustom', by: 'host', target: 'p1', approved: true }, 'p1');
    let s = reduceTable(lobby(), { type: 'setCustom', playerId: 'p1', custom: MINE });
    s = reduceTable(s, a);
    expect(pendingCustoms(s)).toHaveLength(1);
  });
  it('késői játékos: saját helyzet a játéka indulásáig, jóváhagyással', () => {
    let s = reduceTable(lobby(), { type: 'start', by: 'host' });
    s = reduceTable(s, { type: 'join', playerId: 'late', name: 'Kata', remote: true });
    s = reduceTable(s, { type: 'setCustom', playerId: 'late', custom: MINE });
    s = reduceTable(s, { type: 'setProfile', playerId: 'late', profileId: 'career_start' });
    expect(pendingCustoms(s).map((p) => p.id)).toEqual(['late']);
    s = reduceTable(s, { type: 'approveCustom', by: 'host', target: 'late', approved: true });
    expect(approvedCustom(s, s.players.find((p) => p.id === 'late')!)).toEqual(MINE);
  });
});
