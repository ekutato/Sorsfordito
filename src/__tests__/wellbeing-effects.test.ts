import { describe, it, expect } from 'vitest';
import { WELLBEING_EFFECTS } from '@/data/wellbeing-effects';
import { getDecisionsFor, getScriptedFateEvents, GENERIC_LATE_GAME_DECISIONS, STORYLINE_FATE_EVENTS, GENERIC_FATE_EVENTS } from '@/data/decisions';
import { withWellbeingDecision } from '@/data/wellbeing-merge';
import { withWellbeingFate } from '@/data/wellbeing-merge';
import type { LifeSituationId, TimeScale } from '@/types/game';

const SITUATIONS: LifeSituationId[] = ['fresh_start', 'career_start', 'inheritance'];
const SCALES: TimeScale[] = ['sprint', 'marathon', 'ultra'];

describe('jólléti hatások tartalma', () => {
  it('minden érték -2..+2 közötti egész', () => {
    for (const [k, w] of Object.entries(WELLBEING_EFFECTS)) {
      for (const v of Object.values(w)) {
        expect(Number.isInteger(v), k).toBe(true);
        expect(Math.abs(v as number), k).toBeLessThanOrEqual(2);
      }
    }
  });

  it('minden kulcs létező döntési opcióra vagy sorskártya-opcióra mutat, és be is kerül', () => {
    const optionIds = new Set<string>();
    const fateKeys = new Set<string>();
    let mergedDecisionEffects = 0;
    for (const s of SITUATIONS) for (const t of SCALES) {
      for (const d of getDecisionsFor(s, t)) for (const o of d.options) {
        optionIds.add(o.id);
        mergedDecisionEffects += o.financialEffects.filter((e) => e.target.startsWith('wellbeing.')).length;
      }
      for (const f of getScriptedFateEvents(s, t)) {
        const m = withWellbeingFate(f);
        m.options?.forEach((_, i) => fateKeys.add(`${f.id}:${i}`));
      }
    }
    for (const d of GENERIC_LATE_GAME_DECISIONS.map(withWellbeingDecision)) for (const o of d.options) optionIds.add(o.id);
    for (const f of [...STORYLINE_FATE_EVENTS, ...GENERIC_FATE_EVENTS]) f.options?.forEach((_, i) => fateKeys.add(`${f.id}:${i}`));
    const missing = Object.keys(WELLBEING_EFFECTS).filter((k) => !optionIds.has(k) && !fateKeys.has(k));
    expect(missing).toEqual([]);
    expect(mergedDecisionEffects).toBeGreaterThan(50);
  });
});
