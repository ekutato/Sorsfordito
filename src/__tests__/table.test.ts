import { describe, it, expect } from 'vitest';
import { createTable, reduceTable, generateRoomCode, publicView, DEFAULT_CONFIG, MAX_PLAYERS, PLAYER_COLORS, type TableState } from '@/engine/table/state';
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

describe('asztali játék: jelentések és közös körzárás', () => {
  const rep = (finishedRound: number, extra: Partial<import('@/engine/table/state').PlayerReport> = {}) => ({
    finishedRound, currentRound: finishedRound + 1, position: 3, balance: 100_000, netWorth: 150_000, wellbeing: 55, freedom: 0, safety: 10, ...extra,
  });

  function started(n: number) {
    let s = lobbyWith(n);
    s = reduceTable(s, { type: 'configure', by: 'host', config: { totalRounds: 2 } });
    return reduceTable(s, { type: 'start', by: 'host' });
  }

  it('a forduló csak akkor lép tovább, ha minden csatlakozott játékos kész', () => {
    let s = started(3);
    expect(s.round).toBe(1);
    s = reduceTable(s, { type: 'report', playerId: 'host', report: rep(1) });
    s = reduceTable(s, { type: 'report', playerId: 'p1', report: rep(1) });
    expect(s.round).toBe(1);
    s = reduceTable(s, { type: 'report', playerId: 'p2', report: rep(0) });
    expect(s.round).toBe(1);
    s = reduceTable(s, { type: 'report', playerId: 'p2', report: rep(1) });
    expect(s.round).toBe(2);
    expect(s.players.every((p) => !p.done)).toBe(true);
  });

  it('kiesett játékos nem tartja fel a többieket; az utolsó forduló után vége', () => {
    let s = started(2);
    s = reduceTable(s, { type: 'leave', playerId: 'p1' });
    s = reduceTable(s, { type: 'report', playerId: 'host', report: rep(1) });
    expect(s.round).toBe(2);
    s = reduceTable(s, { type: 'report', playerId: 'host', report: rep(2, { ended: true }) });
    expect(s.phase).toBe('finished');
  });

  it('érvénytelen vagy túlzó jelentést a host korlátoz vagy eldob', () => {
    let s = started(1);
    const before = s;
    s = reduceTable(s, { type: 'report', playerId: 'host', report: { finishedRound: 'x' } as never });
    expect(s).toBe(before);
    s = reduceTable(s, { type: 'report', playerId: 'host', report: rep(0, { wellbeing: 999, position: 99 }) });
    const r = s.players[0].report!;
    expect(r.wellbeing).toBe(100);
    expect(r.position).toBeLessThan(24);
  });

  it('idegen azonosítóval nem lehet jelenteni', () => {
    const s = started(1);
    expect(reduceTable(s, { type: 'report', playerId: 'nincs-ilyen', report: rep(1) })).toBe(s);
  });
});

describe('késői csatlakozás', () => {
  const rep = (currentRound: number, finishedRound: number) => ({ finishedRound, currentRound, position: 0, balance: 0, netWorth: 0, wellbeing: 50, freedom: 0, safety: 0 });

  it('elindult játékba is be lehet szállni; a karaktert egyszer választhatja', () => {
    let s = createTable('ABCD', 'host', 'Host', { ...DEFAULT_CONFIG, totalRounds: 5 }, 1);
    s = reduceTable(s, { type: 'setProfile', playerId: 'host', profileId: 'career_start' });
    s = reduceTable(s, { type: 'start', by: 'host' });
    s = reduceTable(s, { type: 'join', playerId: 'late', name: 'Kési', remote: true });
    const late = s.players.find((p) => p.id === 'late')!;
    expect(late.lateJoinRound).toBe(1);
    s = reduceTable(s, { type: 'setProfile', playerId: 'late', profileId: 'fresh_start' });
    expect(s.players.find((p) => p.id === 'late')!.profileId).toBe('fresh_start');
    s = reduceTable(s, { type: 'setProfile', playerId: 'late', profileId: 'inheritance' });
    expect(s.players.find((p) => p.id === 'late')!.profileId).toBe('fresh_start');
    // a host játék közben nem válthat karaktert
    s = reduceTable(s, { type: 'setProfile', playerId: 'host', profileId: 'inheritance' });
    expect(s.players.find((p) => p.id === 'host')!.profileId).toBe('career_start');
  });

  it('a felzárkózó játékos nem tartja fel a kört; ha utolérte, beszámít', () => {
    let s = createTable('ABCD', 'host', 'Host', { ...DEFAULT_CONFIG, totalRounds: 9 }, 1);
    s = reduceTable(s, { type: 'start', by: 'host' });
    s = reduceTable(s, { type: 'report', playerId: 'host', report: rep(2, 1) });
    s = reduceTable(s, { type: 'report', playerId: 'host', report: rep(3, 2) });
    expect(s.round).toBe(3);
    s = reduceTable(s, { type: 'join', playerId: 'late', name: 'Kési', remote: true });
    s = reduceTable(s, { type: 'report', playerId: 'late', report: rep(1, 0) });
    s = reduceTable(s, { type: 'report', playerId: 'host', report: rep(4, 3) });
    expect(s.round).toBe(4); // nem várta meg a felzárkózót
    s = reduceTable(s, { type: 'report', playerId: 'late', report: rep(4, 3) });
    s = reduceTable(s, { type: 'report', playerId: 'host', report: rep(5, 4) });
    expect(s.round).toBe(4); // most már őt is várja
    s = reduceTable(s, { type: 'report', playerId: 'late', report: rep(5, 4) });
    expect(s.round).toBe(5);
  });

  it('teli szobába és befejezett játékba nem lehet beszállni', () => {
    let s = lobbyWith(10);
    s = reduceTable(s, { type: 'start', by: 'host' });
    expect(reduceTable(s, { type: 'join', playerId: 'x11', name: 'Tizenegy', remote: true }).players).toHaveLength(10);
    const fin = { ...s, phase: 'finished' as const };
    expect(reduceTable(fin, { type: 'join', playerId: 'y', name: 'Y', remote: true })).toBe(fin);
  });
});

describe('színválasztás', () => {
  it('belépéskor nincs szín, a játékos választ; foglalt és ismeretlen szín nem választható', () => {
    let s = lobbyWith(2);
    expect(s.players.every((p) => p.color === '')).toBe(true);
    s = reduceTable(s, { type: 'setColor', playerId: 'host', color: PLAYER_COLORS[2] });
    expect(s.players[0].color).toBe(PLAYER_COLORS[2]);
    const taken = reduceTable(s, { type: 'setColor', playerId: 'p1', color: PLAYER_COLORS[2] });
    expect(taken.players[1].color).toBe('');
    const bogus = reduceTable(s, { type: 'setColor', playerId: 'p1', color: 'red' });
    expect(bogus.players[1].color).toBe('');
    s = reduceTable(s, { type: 'setColor', playerId: 'host', color: PLAYER_COLORS[0] });
    expect(reduceTable(s, { type: 'setColor', playerId: 'p1', color: PLAYER_COLORS[2] }).players[1].color).toBe(PLAYER_COLORS[2]);
  });

  it('indítás után a lobbyjátékos nem vált színt; a szín nélküli az első szabadot kapja', () => {
    let s = lobbyWith(2);
    s = reduceTable(s, { type: 'setColor', playerId: 'host', color: PLAYER_COLORS[0] });
    s = reduceTable(s, { type: 'start', by: 'host' });
    expect(s.players[1].color).toBe(PLAYER_COLORS[1]);
    expect(reduceTable(s, { type: 'setColor', playerId: 'host', color: PLAYER_COLORS[5] }).players[0].color).toBe(PLAYER_COLORS[0]);
  });

  it('a késői játékos a karakterválasztás előtt színt választhat', () => {
    let s = reduceTable(lobbyWith(1), { type: 'setColor', playerId: 'host', color: PLAYER_COLORS[0] });
    s = reduceTable(s, { type: 'start', by: 'host' });
    s = reduceTable(s, { type: 'join', playerId: 'late1', name: 'Késő', remote: true });
    s = reduceTable(s, { type: 'setColor', playerId: 'late1', color: PLAYER_COLORS[0] });
    expect(s.players[1].color).toBe('');
    s = reduceTable(s, { type: 'setColor', playerId: 'late1', color: PLAYER_COLORS[4] });
    expect(s.players[1].color).toBe(PLAYER_COLORS[4]);
  });
});
