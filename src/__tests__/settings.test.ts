import { describe, it, expect } from 'vitest';
import { clampStartBalance } from '@/store/game-store';
import { DEFAULT_RULES, TEST_MODE_MAX_BALANCE } from '@/types/game';
import { secureDieRoll } from '@/store/board-actions';
import { SUBJECTIVE_WELLBEING, WELLBEING_EFFECTS } from '@/data/wellbeing-effects';
import { TRAP_CARDS, TEMPTATION_CARDS, RECHARGE_CARDS, ENCOUNTER_CARDS, OFFICE_CARDS } from '@/data/field-cards';

describe('játékmesteri szabályok: kezdő egyenleg', () => {
  it('alapból a karakter kezdő egyenlege, bármit kér a felület', () => {
    expect(clampStartBalance('fresh_start', 9_000_000)).toBe(80_000);
    expect(clampStartBalance('career_start', undefined)).toBe(220_000);
  });

  it('egyéni beállításnál a karakter felső határára vág', () => {
    const rules = { ...DEFAULT_RULES, customStartBalance: true };
    expect(clampStartBalance('fresh_start', 600_000, rules)).toBe(500_000);
    expect(clampStartBalance('career_start', 1_500_000, rules)).toBe(1_000_000);
    expect(clampStartBalance('inheritance', 9_000_000, rules)).toBe(8_000_000);
    expect(clampStartBalance('fresh_start', -5, rules)).toBe(0);
    expect(clampStartBalance('fresh_start', 300_000, rules)).toBe(300_000);
  });

  it('tesztmódban 20 M Ft a határ', () => {
    const rules = { ...DEFAULT_RULES, testMode: true };
    expect(clampStartBalance('fresh_start', 50_000_000, rules)).toBe(TEST_MODE_MAX_BALANCE);
  });
});

describe('kocka', () => {
  it('egyenletes: khi-négyzet 6000 dobásra (df = 5, p = 0,001 küszöb 20,52)', () => {
    const c = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6000; i++) c[secureDieRoll() - 1] += 1;
    const chi = c.reduce((s, o) => s + (o - 1000) ** 2 / 1000, 0);
    expect(chi).toBeLessThan(20.52);
  });
});

describe('személyes mérlegelés (nincs univerzális jólléti igazság)', () => {
  it('minden szubjektív bejegyzésnek van kérdése és 1-2 jelölője, és nem fix egyszerre', () => {
    for (const [k, v] of Object.entries(SUBJECTIVE_WELLBEING)) {
      expect(v.prompt.length, k).toBeGreaterThan(20);
      expect(v.keys.length, k).toBeGreaterThanOrEqual(1);
      expect(v.keys.length, k).toBeLessThanOrEqual(2);
      expect(WELLBEING_EFFECTS[k], k).toBeUndefined();
    }
  });

  it('az otthon maradás és a lakhatási döntések szubjektívek', () => {
    expect(SUBJECTIVE_WELLBEING['dani-d01-b']).toBeDefined();
    expect(SUBJECTIVE_WELLBEING['fs-d05-c']).toBeDefined();
  });

  it('mezőkártyán a mérlegelős opció nem ad fix jólléti pontot; csapdánál nincs mérlegelés', () => {
    for (const c of [...TRAP_CARDS, ...TEMPTATION_CARDS, ...RECHARGE_CARDS, ...ENCOUNTER_CARDS, ...OFFICE_CARDS]) {
      for (const o of c.options) {
        if (o.reflection) {
          expect(o.effects.some((e) => e.target.startsWith('wellbeing.')), `${c.id}/${o.label}`).toBe(false);
          expect(c.field).not.toBe('trap');
        }
      }
    }
  });
});
