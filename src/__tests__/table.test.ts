import { describe, it, expect } from 'vitest';
import { createTable, reduceTable, generateRoomCode, publicView, DEFAULT_CONFIG, MAX_PLAYERS, type TableState } from '@/engine/table/state';
import { moveOnBoard, BOARD_SIZE, BOARD, DISTRICTS, FIELD_LABELS, districtOf } from '@/data/board';

function lobbyWith(n: number): TableState {
  let s = createTable('ABCD', 'host', 'Host', DEFAULT_CONFIG, 12345);
  for (let i = 1; i < n; i++) s = reduceTable(s, { type: 'join', playerId: `p${i}`, name: `P${i}`, remote: i % 2 === 0 });
  return s;
}

describe('tábla', () => {
  it('24 mező, egy fizetésnap, a lépés körbeér', () => {
    expect(BOARD_SIZE).toBe(24);
    expect(BOARD.filter((f) => f.type === 'payday')).toHaveLength(1);
    expect(moveOnBoard(22, 3)).toEqual({ position: 1, passedYearEnd: true, passedPaydays: 1 });
  });

  it('tematikus negyedek: soronként 4 mező, minden mezőtípus szerepel', () => {
    expect(DISTRICTS).toHaveLength(6);
    for (const d of DISTRICTS) expect(d.fields).toHaveLength(4);
    for (const f of BOARD) expect(districtOf(f.index).id).toBe(f.district);
    const types = new Set(BOARD.map((f) => f.type));
    expect(types.size).toBe(Object.keys(FIELD_LABELS).length);
    // a csapdák a Bankutcán, a kísértések a Piactéren, a találkozások a Közösségi téren vannak
    for (const f of BOARD) {
      if (f.type === 'trap') expect(f.district).toBe('bankutca');
      if (f.type === 'temptation') expect(f.district).toBe('piacter');
      if (f.type === 'encounter' || f.type === 'recharge') expect(f.district).toBe('kozossegi-ter');
      if (f.type === 'office') expect(f.district).toBe('hivatal');
    }
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

  it('a seed nem jut el a kliensekhez, és két szoba seedje eltér', () => {
    const a = createTable('ABCD', 'host', 'Host');
    const b = createTable('ABCD', 'host', 'Host');
    expect(a.seed).not.toBe(b.seed);
    expect(publicView(a).seed).toBe(0);
  });

  it('fizikai kockánál csak 1-6 közötti egész érték fogadható el', () => {
    let s = reduceTable(lobbyWith(1), { type: 'configure', by: 'host', config: { diceSource: 'physical' } });
    s = reduceTable(s, { type: 'start', by: 'host' });
    expect(reduceTable(s, { type: 'roll', playerId: 'host', value: 7 })).toBe(s);
    expect(reduceTable(s, { type: 'roll', playerId: 'host', value: 2.5 })).toBe(s);
    expect(reduceTable(s, { type: 'roll', playerId: 'host', value: 5 }).players[0].lastRoll).toBe(5);
  });

  it('az alkalmazás kockája egyenletes eloszlású (khi-négyzet, 6000 dobás)', () => {
    const counts = [0, 0, 0, 0, 0, 0];
    let s = reduceTable(createTable('EGYE', 'host', 'H', DEFAULT_CONFIG, 777), { type: 'start', by: 'host' });
    for (let i = 0; i < 6000; i++) {
      const r = reduceTable(s, { type: 'roll', playerId: 'host' });
      counts[(r.players[0].lastRoll as number) - 1]++;
      s = { ...s, rngCalls: r.rngCalls };
    }
    const chi = counts.reduce((acc, c) => acc + (c - 1000) ** 2 / 1000, 0);
    // 5 szabadsági fok, 0,1%-os kritikus érték: 20,52
    expect(chi).toBeLessThan(20.52);
  });
});
