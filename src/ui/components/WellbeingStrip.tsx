'use client';

import type { FinancialSheet } from '@/types/financial';
import { WELLBEING_KEYS, WELLBEING_MAX, neutralWellbeing, wellbeingIndex } from '@/types/wellbeing';
import type { Ruleset } from '@/rulesets';
import { RULESETS, DEFAULT_RULESET_ID } from '@/rulesets';

interface Props {
  sheet: FinancialSheet;
  ruleset?: Ruleset;
}

/** Jólléti jelölők (-5..+5) és a biztonsági kör haladása */
export function WellbeingStrip({ sheet, ruleset = RULESETS[DEFAULT_RULESET_ID] }: Props) {
  const w = sheet.wellbeing ?? neutralWellbeing();
  const index = wellbeingIndex(w);
  const monthly = sheet.computed?.totalExpenses ?? 0;
  const target = monthly * ruleset.safetyCircleMonths;
  const safetyPct = target > 0 ? Math.max(0, Math.min(100, Math.round((sheet.balance / target) * 100))) : 0;

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
                <span className={`font-mono font-semibold ${v > 0 ? 'text-money-positive' : v < 0 ? 'text-money-negative' : ''}`}>
                  {v > 0 ? `+${v}` : v}
                </span>
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
