import { describe, it, expect } from 'vitest';
import { createTable, reduceTable, generateRoomCode, MAX_PLAYERS, type TableState } from '@/engine/table/state';
import { moveOnBoard, BOARD_SIZE, BOARD } from '@/data/board';

function lobbyWith(n: number): TableState {
  let s = createTable('ABCD', 'host', 'Host');
  for (let i = 1; i < n; i++) s = reduceTable(s, { type: 'join', playerId: `p${i}`, name: `P${i}`, remote: i % 2 === 0 });
  return s;
}

describe('tábla', () => {
  it('24 mező, két fizetésnap, a lépés körbeér', () => {
    expect(BOARD_SIZE).toBe(24);
    expect(BOARD.filter((f) => f.type === 'payday')).toHaveLength(2);
    expect(moveOnBoard(22, 3)).toEqual({ position: 1, passedYearEnd: true, passedPaydays: 1 });
  });
});

describe('asztali állapot', () => {
  it('legfeljebb 10 játékos csatlakozhat', () => {
    expect(lobbyWith(12).players).toHaveLength(MAX_PLAYERS);
  });

  it('csak a host indíthat és konfigurálhat', () => {
    const s = lobbyWith(3);
    expect(reduceTable(s, { type: 'start', by: 'p1' }).phase).toBe('lobby');
    expect(reduceTable(s, { type: 'configure', by: 'p1', config: { totalRounds: 5 } }).config.totalRounds).toBe(12);
    expect(reduceTable(s, { type: 'start', by: 'host' }).phase).toBe('playing');
  });

  it('a dobás determinisztikus, és fordulónként egyszer lehet dobni', () => {
    const s = reduceTable(lobbyWith(2), { type: 'start', by: 'host' });
    const a = reduceTable(s, { type: 'roll', playerId: 'host' });
    const b = reduceTable(s, { type: 'roll', playerId: 'host' });
    expect(a.players[0].lastRoll).toBe(b.players[0].lastRoll);
    expect(reduceTable(a, { type: 'roll', playerId: 'host' })).toBe(a);
  });

  it('a forduló akkor zárul, ha minden csatlakozott játékos kész; a kiesett nem tart fel', () => {
    let s = reduceTable(lobbyWith(3), { type: 'start', by: 'host' });
    s = reduceTable(s, { type: 'leave', playerId: 'p2' });
    for (const id of ['host', 'p1']) {
      s = reduceTable(s, { type: 'roll', playerId: id });
      s = reduceTable(s, { type: 'finishTurn', playerId: id });
    }
    expect(s.round).toBe(2);
    expect(s.players.every((p) => !p.done)).toBe(true);
  });

  it('dobás nélkül nem lehet befejezni a kört', () => {
    const s = reduceTable(lobbyWith(1), { type: 'start', by: 'host' });
    expect(reduceTable(s, { type: 'finishTurn', playerId: 'host' }).round).toBe(1);
  });

  it('az utolsó forduló után vége a játéknak', () => {
    let s = reduceTable(lobbyWith(1), { type: 'configure', by: 'host', config: { totalRounds: 1, mode: 'trial' } });
    s = reduceTable(s, { type: 'start', by: 'host' });
    s = reduceTable(s, { type: 'roll', playerId: 'host' });
    s = reduceTable(s, { type: 'finishTurn', playerId: 'host' });
    expect(s.phase).toBe('finished');
  });

  it('újracsatlakozáskor ugyanaz a játékos jön vissza', () => {
    let s = reduceTable(lobbyWith(2), { type: 'start', by: 'host' });
    s = reduceTable(s, { type: 'leave', playerId: 'p1' });
    s = reduceTable(s, { type: 'join', playerId: 'p1', name: 'P1', remote: true });
    expect(s.players).toHaveLength(2);
    expect(s.players[1].connected).toBe(true);
  });

  it('a szobakód 4 betű, félreolvasható karakterek nélkül', () => {
    for (let i = 0; i < 50; i++) expect(generateRoomCode()).toMatch(/^[ABCDEFGHJKLMNPRSTUVZ]{4}$/);
  });
});
