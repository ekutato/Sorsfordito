import { describe, it, expect } from 'vitest';
import {
  applyWellbeingDelta, clampWellbeing, isBalanced, isWellbeingTarget, neutralWellbeing, wellbeingIndex, wellbeingKeyOf,
} from '@/types/wellbeing';
import { RULESETS, resolveRuleset } from '@/rulesets';

describe('jólléti index', () => {
  it('a skála -5..+5 között marad', () => {
    expect(clampWellbeing(9)).toBe(5);
    expect(clampWellbeing(-9)).toBe(-5);
    const w = applyWellbeingDelta(neutralWellbeing(), 'egyensuly', -7);
    expect(w.egyensuly).toBe(-5);
  });

  it('az index 0-100, semleges állapotban 50', () => {
    expect(wellbeingIndex(neutralWellbeing())).toBe(50);
    expect(wellbeingIndex({ eletero: 5, egeszseg: 5, egyensuly: 5 })).toBe(100);
    expect(wellbeingIndex({ eletero: -5, egeszseg: -5, egyensuly: -5 })).toBe(0);
    expect(wellbeingIndex(undefined)).toBe(50);
  });

  it('kiegyensúlyozott, ha egyik jelölő sem negatív', () => {
    expect(isBalanced({ eletero: 0, egeszseg: 2, egyensuly: 1 })).toBe(true);
    expect(isBalanced({ eletero: 3, egeszseg: 3, egyensuly: -1 })).toBe(false);
  });

  it('felismeri a hatás-célpontot', () => {
    expect(isWellbeingTarget('wellbeing.eletero')).toBe(true);
    expect(isWellbeingTarget('wellbeing.harmonia')).toBe(false);
    expect(isWellbeingTarget('balance')).toBe(false);
    expect(wellbeingKeyOf('wellbeing.egeszseg')).toBe('egeszseg');
  });
});

describe('szabálycsomag', () => {
  it('a Sorsfordító feliratai: életerő, egészség, egyensúly', () => {
    expect(Object.values(RULESETS['sorsfordito-alap'].labels.wellbeing)).toEqual(['Életerő', 'Egészség', 'Egyensúly']);
  });

  it('a Milion-csomag élesben nem aktiválható', () => {
    expect(resolveRuleset('milion-szemlelet', true).id).toBe('sorsfordito-alap');
    expect(resolveRuleset('milion-szemlelet', false).id).toBe('milion-szemlelet');
    expect(resolveRuleset('ismeretlen', false).id).toBe('sorsfordito-alap');
  });
});
