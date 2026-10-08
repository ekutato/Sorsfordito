import { describe, it, expect } from 'vitest';
import { TRAP_CARDS, TEMPTATION_CARDS, RECHARGE_CARDS, ENCOUNTER_CARDS, OFFICE_CARDS, cardForField, marketNewsCard, optionCost, canAfford } from '@/data/field-cards';
import { BOARD } from '@/data/board';

const ALL = [...TRAP_CARDS, ...TEMPTATION_CARDS, ...RECHARGE_CARDS, ...ENCOUNTER_CARDS, ...OFFICE_CARDS];

describe('mezőkártyák', () => {
  it('minden csapdának van vészjele, kivédési útja (veszteség nélküli opció) és valós lépése', () => {
    for (const c of TRAP_CARDS) {
      expect(c.redFlags?.length, c.id).toBeGreaterThan(0);
      const safe = c.options.filter((o) => !o.effects.some((e) => e.target === 'balance' && e.amount < 0));
      expect(safe.length, c.id).toBeGreaterThan(0);
      expect(c.options.some((o) => o.effects.some((e) => e.target === 'balance' && e.amount < 0)), c.id).toBe(true);
      expect(c.realStep.length, c.id).toBeGreaterThan(20);
    }
  });

  it('egyedi azonosítók, minden opciónak van kimenetele', () => {
    expect(new Set(ALL.map((c) => c.id)).size).toBe(ALL.length);
    for (const c of ALL) for (const o of c.options) expect(o.outcome.length, `${c.id}/${o.label}`).toBeGreaterThan(5);
  });

  it('a kártyák ismétlés nélkül körbejárnak', () => {
    const seen = TRAP_CARDS.map((_, i) => cardForField('trap', i)!.id);
    expect(new Set(seen).size).toBe(TRAP_CARDS.length);
    expect(cardForField('trap', TRAP_CARDS.length)!.id).toBe(TRAP_CARDS[0].id);
  });

  it('a táblán minden mezőtípushoz van kártya vagy a kör tartalma tartozik hozzá', () => {
    const withRoundContent = new Set(['payday', 'decision', 'investment', 'knowledge', 'fate']);
    for (const f of BOARD) {
      if (withRoundContent.has(f.type)) continue;
      expect(cardForField(f.type, 0), f.type).toBeDefined();
    }
  });

  it('a piaci hír a heti adatcsomagból jön, forrással', () => {
    const c = marketNewsCard(0)!;
    expect(c.sourceUrl).toMatch(/^https:\/\//);
  });
});

describe('fedezet a mezőkártyákon', () => {
  it('minden kártyán van pénzigény nélküli opció (fedezet nélkül sem akad el a játék)', () => {
    for (const c of ALL) expect(c.options.some((o) => optionCost(o) === 0), c.id).toBe(true);
  });

  it('a kávézós beszállás 2 000 000 Ft, mínuszos egyenlegből nem választható', () => {
    const cafe = ENCOUNTER_CARDS.find((c) => c.id === 'tal-baratod-uzlete')!;
    const join = cafe.options.find((o) => optionCost(o) > 0)!;
    expect(optionCost(join)).toBe(2_000_000);
    expect(cafe.body).toContain('2 000 000 Ft');
    expect(canAfford(join, -50_000)).toBe(false);
    expect(canAfford(join, 1_999_999)).toBe(false);
    expect(canAfford(join, 2_000_000)).toBe(true);
    expect(cafe.options.filter((o) => canAfford(o, -50_000)).length).toBe(2);
  });

  it('a táblás művelet sem alkalmaz fedezet nélküli opciót', async () => {
    const { useGameStore } = await import('@/store/game-store');
    const { resolveFieldCard, acknowledgeOutcome } = await import('@/store/board-actions');
    useGameStore.getState().startNewGame(
      { timeScale: 'sprint', mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10' },
      'career_start', 'Teszt',
    );
    // mínuszos egyenleg (a kezdő egyenleg nem lehet negatív, ezért utólag vonjuk le)
    useGameStore.getState().modifyBalance('player-1', -320_000, 'teszt');
    const cafe = ENCOUNTER_CARDS.find((c) => c.id === 'tal-baratod-uzlete')!;
    const join = cafe.options.find((o) => optionCost(o) > 0)!;
    const advice = cafe.options.find((o) => o.label.startsWith('Segítek'))!;
    expect(resolveFieldCard('encounter', join, cafe)).toBe(false);
    expect(useGameStore.getState().game!.players[0].financialSheet.balance).toBe(-100_000);
    expect(resolveFieldCard('encounter', advice, cafe)).toBe(true);
    const b = useGameStore.getState().game!.board!;
    expect(b.awaitingOutcomeAck).toBe(true);
    expect(b.lastResult?.choice).toBe(advice.label);
    acknowledgeOutcome();
    expect(useGameStore.getState().game!.board!.awaitingOutcomeAck).toBe(false);
  });
});

describe('formatHUF', () => {
  it('teljes, szóközzel tagolt magyar alak', async () => {
    const { formatHUF } = await import('@/engine/financial-calculator');
    expect(formatHUF(2_000_000)).toBe('2 000 000 Ft');
    expect(formatHUF(-150_000)).toBe('-150 000 Ft');
    expect(formatHUF(950)).toBe('950 Ft');
  });
});

describe('mezőkártyák keverése', () => {
  it('különböző játékokban az első csapda nem mindig ugyanaz, egy játékon belül nincs ismétlés', () => {
    const firsts = new Set(Array.from({ length: 30 }, (_, i) => cardForField('trap', 0, `game-${i}`)!.id));
    expect(firsts.size).toBeGreaterThan(1);
    const one = TRAP_CARDS.map((_, i) => cardForField('trap', i, 'game-x')!.id);
    expect(new Set(one).size).toBe(TRAP_CARDS.length);
    expect(cardForField('trap', 0, 'game-x')!.id).toBe(cardForField('trap', 0, 'game-x')!.id);
  });
});

describe('közös asztali pakli', () => {
  const TYPES = [['trap', TRAP_CARDS], ['temptation', TEMPTATION_CARDS], ['recharge', RECHARGE_CARDS], ['encounter', ENCOUNTER_CARDS], ['office', OFFICE_CARDS]] as const;
  it('amíg a pakli tart, minden (játékos, látogatás) más lapot kap', () => {
    for (const n of [2, 4, 6, 10]) for (const [type, deck] of TYPES) {
      const ids: string[] = [];
      for (let v = 0; v * n < deck.length; v++) for (let s = 0; s < n && v * n + s < deck.length; s++) {
        ids.push(cardForField(type, v, 'x', { seed: 42, slot: s, players: n })!.id);
      }
      expect(new Set(ids).size, `${type}, ${n} játékos`).toBe(ids.length);
    }
  });
  it('ugyanaz az asztal ugyanazt osztja, más asztal másképp keveri', () => {
    const a = cardForField('trap', 0, 'g1', { seed: 7, slot: 1, players: 4 })!.id;
    expect(cardForField('trap', 0, 'g2', { seed: 7, slot: 1, players: 4 })!.id).toBe(a);
  });
  it('legalább 10 lap minden mezőtípusból (10 fős garancia)', () => {
    for (const [type, deck] of TYPES) expect(deck.length, type).toBeGreaterThanOrEqual(10);
  });
});
