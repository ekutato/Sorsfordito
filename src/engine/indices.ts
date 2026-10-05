// A három élő index: pénzügyi szabadság, biztonsági kör, jólléti index.
import type { FinancialSheet } from '@/types/financial';
import { wellbeingIndex, isBalanced } from '@/types/wellbeing';
import type { Ruleset } from '@/rulesets';

export interface PlayerIndices {
  /** Passzív jövedelem / havi kiadás, % (100 = pénzügyileg független) */
  financialFreedom: number;
  /** Készpénz / (havi kiadás × szabálycsomag hónapjai), % (0-100) */
  safetyCircle: number;
  /** 0-100 */
  wellbeing: number;
  /** Egyik jólléti jelölő sem negatív */
  balanced: boolean;
}

export function computeIndices(sheet: FinancialSheet, ruleset: Ruleset): PlayerIndices {
  const expenses = Object.values(sheet.expenses).reduce((a, b) => a + b, 0);
  const passive = sheet.income.passive;
  const financialFreedom = expenses > 0 ? Math.round((passive / expenses) * 100) : 0;
  const target = expenses * ruleset.safetyCircleMonths;
  const safetyCircle = target > 0 ? Math.max(0, Math.min(100, Math.round((sheet.balance / target) * 100))) : 0;
  return {
    financialFreedom,
    safetyCircle,
    wellbeing: wellbeingIndex(sheet.wellbeing),
    balanced: isBalanced(sheet.wellbeing),
  };
}
