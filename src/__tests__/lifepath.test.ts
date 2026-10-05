import { describe, it, expect } from 'vitest';
import { yearsToFinancialIndependence, reachedGoals, compressYears } from '@/engine/lifepath';
import { LIFEPATH_MILESTONES, LIFEPATH_START_AGE, LIFEPATH_TARGET_AGE } from '@/data/lifepath';

describe('pénzügyi függetlenség számítása', () => {
  it('visszaadja a közismert táblázat értékeit (5% reálhozam, 4% kivétel)', () => {
    expect(yearsToFinancialIndependence({ savingsRate: 0.5, realReturn: 0.05, withdrawalRate: 0.04 })).toBe(17);
    expect(yearsToFinancialIndependence({ savingsRate: 0.3, realReturn: 0.05, withdrawalRate: 0.04 })).toBe(28);
    // A táblázat 51-et ír (kerekítés); egész évre felfelé kerekítve 52
    expect(yearsToFinancialIndependence({ savingsRate: 0.1, realReturn: 0.05, withdrawalRate: 0.04 })).toBe(52);
  });

  it('óvatosabb feltevéssel (4% reálhozam, 3,5% kivétel) 22 évesen kezdve, 50%-kal 40 év körül érhető el', () => {
    const years = yearsToFinancialIndependence({ savingsRate: 0.5, realReturn: 0.04, withdrawalRate: 0.035 });
    const age = 22 + years;
    expect(age).toBeGreaterThanOrEqual(40);
    expect(age).toBeLessThanOrEqual(43);
  });

  it('átlagos megtakarítással (20%) 40 évesen még nem érhető el', () => {
    const years = yearsToFinancialIndependence({ savingsRate: 0.2, realReturn: 0.04, withdrawalRate: 0.035 });
    expect(22 + years).toBeGreaterThan(55);
  });

  it('megtakarítás nélkül nem érhető el', () => {
    expect(yearsToFinancialIndependence({ savingsRate: 0, realReturn: 0.05, withdrawalRate: 0.04 })).toBe(Infinity);
  });

  it('a fokozatos célok sorban teljesülnek', () => {
    expect(reachedGoals({ cashMonths: 2, nonMortgageDebt: 100, freedomPercent: 0 })).toEqual(['tartalek-1']);
    expect(reachedGoals({ cashMonths: 7, nonMortgageDebt: 0, freedomPercent: 60 })).toEqual(['tartalek-1', 'tartalek-6', 'adossagmentes', 'reszleges']);
  });

  it('az összevont évek ugyanazt adják, mint évenkénti számolás', () => {
    let w = 100_000;
    for (let i = 0; i < 5; i++) w = w * 1.04 + 600_000;
    expect(compressYears(100_000, 600_000, 0.04, 5)).toBe(Math.round(w));
  });
});

describe('életpálya fordulópontjai', () => {
  it('16 évesen indul, 40 évesen mérleg, növekvő sorrendben, egyedi azonosítókkal', () => {
    expect(LIFEPATH_MILESTONES[0].age).toBe(LIFEPATH_START_AGE);
    expect(LIFEPATH_MILESTONES[LIFEPATH_MILESTONES.length - 1].age).toBe(LIFEPATH_TARGET_AGE);
    const ages = LIFEPATH_MILESTONES.map((m) => m.age);
    expect([...ages].sort((a, b) => a - b)).toEqual(ages);
    expect(new Set(LIFEPATH_MILESTONES.map((m) => m.id)).size).toBe(LIFEPATH_MILESTONES.length);
  });
});
