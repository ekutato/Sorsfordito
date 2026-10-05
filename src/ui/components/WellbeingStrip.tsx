'use client';

import type { FinancialSheet } from '@/types/financial';
import { WELLBEING_KEYS, WELLBEING_MAX, neutralWellbeing } from '@/types/wellbeing';
import { computeIndices } from '@/engine/indices';
import type { Ruleset } from '@/rulesets';
import { RULESETS, DEFAULT_RULESET_ID } from '@/rulesets';

interface Props {
  sheet: FinancialSheet;
  ruleset?: Ruleset;
}

/** A jólléti jelölők, az index és a biztonsági kör - egy helyen számolva mindkét nézethez */
export function wellbeingSummary(sheet: FinancialSheet, ruleset: Ruleset) {
  const ix = computeIndices(sheet, ruleset);
  return { w: sheet.wellbeing ?? neutralWellbeing(), index: ix.wellbeing, safetyPct: ix.safetyCircle };
}

const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);
const toneOf = (v: number) => (v > 0 ? 'text-money-positive' : v < 0 ? 'text-money-negative' : '');

/** Egysoros változat a kompakt Pénzügyi Laphoz (kártya- és kvízfázisban is látszik) */
export function WellbeingMini({ sheet, ruleset = RULESETS[DEFAULT_RULESET_ID] }: Props) {
  const { w, index, safetyPct } = wellbeingSummary(sheet, ruleset);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 pt-2 border-t border-white/5 text-[10px] text-[var(--color-text-muted)]">
      {WELLBEING_KEYS.map((k) => (
        <span key={k}>
          {ruleset.labels.wellbeing[k]}{' '}
          <span className={`font-mono font-semibold ${toneOf(w[k])}`}>{signed(w[k])}</span>
        </span>
      ))}
      <span className="ml-auto">
        {ruleset.labels.wellbeingIndex} <span className="font-mono font-semibold text-[var(--color-text)]">{index}</span>
      </span>
      <span>
        {ruleset.labels.safetyCircle} <span className="font-mono font-semibold text-[var(--color-text)]">{safetyPct}%</span>
      </span>
    </div>
  );
}

/** Jólléti jelölők (-5..+5) és a biztonsági kör haladása */
export function WellbeingStrip({ sheet, ruleset = RULESETS[DEFAULT_RULESET_ID] }: Props) {
  const { w, index, safetyPct } = wellbeingSummary(sheet, ruleset);

  return (
    <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
          {ruleset.labels.wellbeingIndex}
        </span>
        <span className="font-mono text-xs font-semibold">{index}/100</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {WELLBEING_KEYS.map((k) => {
          const v = w[k];
          const pct = (Math.abs(v) / WELLBEING_MAX) * 50;
          return (
            <div key={k} className="bg-white/5 rounded-lg p-2" aria-label={`${ruleset.labels.wellbeing[k]}: ${v}`}>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--color-text-muted)]">{ruleset.labels.wellbeing[k]}</span>
                <span className={`font-mono font-semibold ${toneOf(v)}`}>{signed(v)}</span>
              </div>
              <div className="relative h-1.5 mt-1 rounded-full bg-white/10 overflow-hidden">
                <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />
                <div
                  className={`absolute top-0 h-full ${v >= 0 ? 'bg-money-positive' : 'bg-money-negative'}`}
                  style={v >= 0 ? { left: '50%', width: `${pct}%` } : { right: '50%', width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
          <span>{ruleset.labels.safetyCircle} ({ruleset.safetyCircleMonths} havi kiadás)</span>
          <span className="font-mono">{safetyPct}%</span>
        </div>
        <div className="h-1.5 mt-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-card-knowledge" style={{ width: `${safetyPct}%` }} />
        </div>
      </div>
    </div>
  );
}
