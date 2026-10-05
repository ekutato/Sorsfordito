// Jólléti hatások (WELLBEING_EFFECTS) hozzáfésülése a döntési és sorskártyákhoz.
// A tartalom így egy helyen bővíthető, a kártyafájlok érintetlenek maradnak.
import type { DecisionCard, FinancialEffect } from '@/types/game';
import { WELLBEING_KEYS, type Wellbeing, type WellbeingTarget } from '@/types/wellbeing';
import { RULESETS, DEFAULT_RULESET_ID } from '@/rulesets';
import { WELLBEING_EFFECTS } from './wellbeing-effects';

const LABELS = RULESETS[DEFAULT_RULESET_ID].labels.wellbeing;

function toEffects(w: Partial<Wellbeing> | undefined): Array<{ target: WellbeingTarget; amount: number }> {
  if (!w) return [];
  return WELLBEING_KEYS.filter((k) => (w[k] ?? 0) !== 0).map((k) => ({
    target: `wellbeing.${k}` as WellbeingTarget,
    amount: w[k] as number,
  }));
}

const hasWellbeing = (effects: Array<{ target: string }>) => effects.some((e) => e.target.startsWith('wellbeing.'));

export function withWellbeingDecision(card: DecisionCard): DecisionCard {
  return {
    ...card,
    options: card.options.map((o) => {
      if (hasWellbeing(o.financialEffects)) return o;
      const extra: FinancialEffect[] = toEffects(WELLBEING_EFFECTS[o.id]).map((e) => ({
        ...e,
        description: `Jóllét: ${LABELS[e.target.slice(10) as keyof typeof LABELS].toLowerCase()}`,
      }));
      return extra.length ? { ...o, financialEffects: [...o.financialEffects, ...extra] } : o;
    }),
  };
}

export function withWellbeingFate<T extends { id: string; options?: Array<{ effects: Array<{ target: string; amount: number }> }> }>(
  entry: T
): T {
  if (!entry.options) return entry;
  return {
    ...entry,
    options: entry.options.map((o, i) => {
      if (hasWellbeing(o.effects)) return o;
      const extra = toEffects(WELLBEING_EFFECTS[`${entry.id}:${i}`]);
      return extra.length ? { ...o, effects: [...o.effects, ...extra] } : o;
    }),
  };
}
