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
    expect(formatHUF(-150_000)).toBe('−150 000 Ft');
    expect(formatHUF(-0.4)).toBe('0 Ft');
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

describe('előjel és szín iránya', () => {
  it('a kiadás növekedése rossz, a bevétel növekedése jó; havi tételnél /hó', async () => {
    const { effectDirection, signedEffect } = await import('@/engine/money-sign');
    expect(effectDirection('housing', 20_000)).toBe('bad');
    expect(effectDirection('loanPayments', -5_000)).toBe('good');
    expect(effectDirection('balance', -1)).toBe('bad');
    expect(effectDirection('salary', 50_000)).toBe('good');
    expect(effectDirection('passive', 0)).toBe('neutral');
    expect(effectDirection('wellbeing.egeszseg', -1)).toBe('bad');
    expect(signedEffect('salary', 50_000)).toBe('+50 000 Ft/hó');
    expect(signedEffect('balance', -1_000)).toBe('−1 000 Ft');
    expect(signedEffect('food', -10_000, { durationMonths: 3 })).toBe('+10 000 Ft/hó (3 hónapig)');
    expect(signedEffect('housing', 220_000)).toBe('−220 000 Ft/hó');
  });
});

describe('mezőkártya: csak a helyzethez illő lap', () => {
  it('a diákigazolvány-lap nem jön Petrának, a TBSZ-lap TBSZ nélkül nem jön', async () => {
    const { cardForField } = await import('@/data/field-cards');
    for (let v = 0; v < 30; v++) {
      const c = cardForField('office', v, 'g1', undefined, { preset: 'inheritance', housing: 220_000, investments: [] })!;
      expect(c.title).not.toMatch(/diákigazolvány|TBSZ-t|nyári munka diákként|átalányadó/);
      const d = cardForField('office', v, 'g1', undefined, { preset: 'career_start', housing: 0, investments: [] })!;
      expect(d.title).not.toMatch(/lakcímbejelentés/);
    }
  });
});

describe('pakli állapota a keveréshez', () => {
  it('új keverés az első húzáskor és a pakli végén', async () => {
    const { cardDrawInfo, TRAP_CARDS } = await import('@/data/field-cards');
    const n = TRAP_CARDS.length;
    expect(cardDrawInfo('trap', 0)?.newPass).toBe(true);
    expect(cardDrawInfo('trap', 1)?.newPass).toBe(false);
    expect(cardDrawInfo('trap', n)?.newPass).toBe(true);
    expect(cardDrawInfo('trap', 2, { seed: 1, slot: 1, players: 4 })).toEqual({ size: n, index: (2 * 4 + 1) % n, newPass: Math.floor(9 / n) !== Math.floor(5 / n) });
    expect(cardDrawInfo('knowledge', 0)).toBeUndefined();
  });
});

describe('hírlap és sorskártya csak a helyzethez illően', () => {
  it('otthon lakó, fizetés nélküli 18 éves nem kap lakbéremelést és béremelést', async () => {
    const { marketNewsCard } = await import('@/data/field-cards');
    const ctx = { preset: 'fresh_start', housing: 15_000, investments: [], salary: 0 };
    for (let i = 0; i < 20; i++) {
      const c = marketNewsCard(i, ctx);
      if (!c) continue;
      expect(c.options[0].effects.some((e) => e.target === 'housing' || e.target === 'salary'), c.title).toBe(false);
    }
    const renter = marketNewsCard(0, { preset: 'career_start', housing: 260_000, investments: [], salary: 320_000 });
    expect(renter).toBeDefined();
  });

  it('sorskártya: otthon lakva nincs lakbéremelés és kaucióvesztés, fizetés nélkül nincs béremelés', async () => {
    const { drawFateCard } = await import('@/engine/fate-deck');
    const D = await import('@/data/decisions');
    const pool = { scripted: D.getScriptedFateEvents('fresh_start', 'marathon'), generic: D.GENERIC_FATE_EVENTS, knowledge: D.GENERIC_KNOWLEDGE_FATE_EVENTS, storyline: D.STORYLINE_FATE_EVENTS };
    const sheet = { income: { salary: 0, passive: 0, oneTime: 0 }, expenses: { housing: 15_000, utilities: 0, food: 0, transport: 0, loanPayments: 0, other: 0 }, acquiredKnowledge: [] as string[] };
    const drawn: string[] = [];
    for (let r = 0; r < 60; r++) {
      const e = drawFateCard({ pool, months: [(r % 12) + 1], district: (['piacter', 'munkahely', 'hivatal'] as const)[r % 3], onFateField: false, drawn, sheet, seed: 'z' });
      if (!e) break;
      drawn.push(e.id);
      expect(e.effects.some((x) => (x.target === 'housing' && x.amount > 0) || x.target === 'salary'), e.title).toBe(false);
      expect(e.id).not.toBe('fate-gen-25');
    }
  });
});
