import { describe, it, expect } from 'vitest';
import { backoffDelay, isStale, CLIENT_DEAD_AFTER_MS, HOST_DROP_AFTER_MS, PING_INTERVAL_MS } from '@/net/heartbeat';
import { createTable, reduceTable } from '@/engine/table/state';

describe('újracsatlakozás időzítése', () => {
  it('visszalépés: 1, 2, 4, 8 mp, majd legfeljebb 15 mp', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(backoffDelay)).toEqual([1000, 2000, 4000, 8000, 15000, 15000, 15000]);
  });

  it('a kapcsolat csak a küszöb után számít halottnak; a ping sűrűbb a küszöbnél', () => {
    expect(isStale(0, CLIENT_DEAD_AFTER_MS, CLIENT_DEAD_AFTER_MS)).toBe(false);
    expect(isStale(0, CLIENT_DEAD_AFTER_MS + 1, CLIENT_DEAD_AFTER_MS)).toBe(true);
    expect(PING_INTERVAL_MS * 2).toBeLessThan(CLIENT_DEAD_AFTER_MS);
    expect(HOST_DROP_AFTER_MS).toBeGreaterThan(CLIENT_DEAD_AFTER_MS);
  });

  it('kiesés és visszatérés: ugyanaz a játékos, ugyanott folytatja', () => {
    let s = createTable('ABCD', 'host', 'Host', undefined, 1);
    s = reduceTable(s, { type: 'join', playerId: 'p1', name: 'Bence', remote: true });
    s = reduceTable(s, { type: 'setProfile', playerId: 'p1', profileId: 'fresh_start' });
    s = reduceTable(s, { type: 'start', by: 'host' });
    s = reduceTable(s, { type: 'leave', playerId: 'p1' });
    expect(s.players.find((p) => p.id === 'p1')?.connected).toBe(false);
    s = reduceTable(s, { type: 'join', playerId: 'p1', name: 'Bence', remote: true });
    const p1 = s.players.find((p) => p.id === 'p1')!;
    expect(p1.connected).toBe(true);
    expect(p1.profileId).toBe('fresh_start');
    expect(s.players).toHaveLength(2);
  });
});
