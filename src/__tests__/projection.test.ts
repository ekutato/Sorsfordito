import { describe, it, expect } from 'vitest';
import { projectInvestment, compoundRate } from '@/engine/projection';
import { LIVE_DATA } from '@/data/live';

describe('befektetések 5, 10, 20 év múlva', () => {
  it('állampapír: kamatos kamat a mostani hozammal', () => {
    const r = LIVE_DATA.ertekek['akk.pmapYield'].value as number;
    const p = projectInvestment({ optionId: 'inv-pmap', currentValue: 300_000 });
    expect(p.kind).toBe('compound');
    expect(p.points.map((x) => x.years)).toEqual([5, 10, 20]);
    expect(p.points[2].mid).toBe(Math.round(300_000 * Math.pow(1 + r / 100, 20)));
    expect(p.points[2].real).toBeLessThanOrEqual(p.points[2].mid);
  });
  it('bankbetét: a 28% kamatadó után', () => {
    const r = LIVE_DATA.ertekek['bank.depositRate'].value as number;
    expect(compoundRate('inv-bank-deposit')).toBeCloseTo(r * 0.72, 6);
  });
  it('jövedelemtermelő: érték + havi hozam összesen', () => {
    const p = projectInvestment({ optionId: 'inv-garage', currentValue: 1_000_000, monthlyIncome: 20_000 });
    expect(p.kind).toBe('income');
    expect(p.points[0].mid).toBe(1_000_000 + 20_000 * 12 * 5);
  });
  it('kripto: nincs előrejelzés', () => {
    expect(projectInvestment({ optionId: 'inv-crypto', currentValue: 100_000, monthlyIncome: 0 }).kind).toBe('none');
  });
});

describe('árfolyamos sáv ellenőrzött forrásból', () => {
  it('ETF: hosszú távú átlag és jobb időszak, forrással', async () => {
    const { RETURN_BANDS } = await import('@/data/long-term-returns');
    for (const b of Object.values(RETURN_BANDS)) { expect(b.url).toMatch(/^https:\/\//); expect(b.low).toBeLessThanOrEqual(b.mid); expect(b.mid).toBeLessThanOrEqual(b.high); }
    const p = projectInvestment({ optionId: 'inv-tbsz-etf', currentValue: 100_000 });
    expect(p.kind).toBe('market');
    expect(p.points[0].mid).toBe(Math.round(100_000 * Math.pow(1.0657, 5)));
    expect(p.points[0].high).toBeGreaterThan(p.points[0].mid);
  });
});
