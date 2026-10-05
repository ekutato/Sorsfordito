import { describe, it, expect } from 'vitest';
import { TRAP_CARDS, TEMPTATION_CARDS, RECHARGE_CARDS, ENCOUNTER_CARDS, OFFICE_CARDS, cardForField, marketNewsCard } from '@/data/field-cards';
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
