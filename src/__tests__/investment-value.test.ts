import { describe, it, expect } from 'vitest';
import { revalue, monthLabel } from '@/engine/investment-value';
import { fieldBonus, bonusCardFor } from '@/data/bonus-cards';
import type { Investment } from '@/types/financial';

const inv = (optionId: string, value = 100_000): Investment => ({ optionId, purchasePrice: value, purchasedAtRound: 1, currentValue: value, totalIncomeGenerated: 0 });
const moves = () => [{ month: '2025-11', ratio: 1.02 }, { month: '2025-12', ratio: 0.99 }, { month: '2026-01', ratio: 1.01 }];

describe('befektetések értékváltozása', () => {
  it('egy hónap: a valós havi mozgás aránya, évszámos indoklással', () => {
    const r = revalue(inv('inv-forex-eur'), 0, 1, moves)!;
    expect(r.after).toBe(102_000);
    expect(r.reason).toContain('EUR/HUF +2');
    expect(r.reason).toContain('2025. november');
  });
  it('negyedéves kör: a három hónap szorzata; a sor végén elölről', () => {
    expect(revalue(inv('inv-stock-hu'), 0, 3, moves)!.after).toBe(Math.round(100_000 * 1.02 * 0.99 * 1.01));
    expect(revalue(inv('inv-stock-hu'), 3, 1, moves)!.after).toBe(102_000);
  });
  it('kamatozó / jövedelemtermelő eszköz értéke nem változik (a hozam külön jóváíródik)', () => {
    expect(revalue(inv('inv-pmap'), 0, 1, moves)).toBeNull();
    expect(revalue(inv('inv-room-rent'), 0, 1, moves)).toBeNull();
  });
  it('magyar hónapnév', () => expect(monthLabel('2026-03')).toBe('2026. március'));
});

describe('a végső két lap', () => {
  it('befektetésekkel - befektetések nélkül = árfolyamnyereség + hozam', () => {
    const balance = 300_000;
    const items = [
      { purchasePrice: 100_000, currentValue: 104_000, totalIncomeGenerated: 0 },
      { purchasePrice: 200_000, currentValue: 200_000, totalIncomeGenerated: 9_000 },
    ];
    const without = balance + items.reduce((a, r) => a + r.purchasePrice, 0) - items.reduce((a, r) => a + r.totalIncomeGenerated, 0);
    const withInv = balance + items.reduce((a, r) => a + r.currentValue, 0);
    expect(withInv - without).toBe(4_000 + 9_000);
  });
});

describe('mezőbónusz', () => {
  it('Tudás mező: 3 tudáskeret; Befektetés mező: 2 befektetés, 5 ajánlat; más mező: alap', () => {
    expect(fieldBonus('knowledge').knowledgeLimit).toBe(3);
    expect(fieldBonus('investment')).toMatchObject({ investLimit: 2, investOffers: 5 });
    expect(fieldBonus('trap')).toMatchObject({ knowledgeLimit: 2, investLimit: 1, investOffers: 3 });
  });
  it('a Tudás mező lapja ingyenes, még meg nem szerzett tudáskártya', () => {
    const c = bonusCardFor('knowledge', 0, 'g1', ['know-tax'])!;
    expect(c.options[0].effects[0].target).toMatch(/^knowledge:/);
    expect(c.options[0].effects[0].target).not.toBe('knowledge:know-tax');
    expect(c.options.some((o) => !o.effects.some((e) => e.target === 'balance' && e.amount < 0))).toBe(true);
  });
});
