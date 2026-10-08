// A kör bevételének és kiadásának terve: ugyanezt használja a könyvelés (game-store) és az előnézet,
// így a képernyőn látott összeg pontosan az, ami levonásra / jóváírásra kerül.
import type { GameState, CharacterPresetId } from '@/types/game';
import type { Expenses } from '@/types/financial';
import { TIME_SCALE_CONFIGS } from '@/types/game';
import { CHARACTER_PRESETS } from '@/data/character-presets';
import { round25, netAfterTurning25 } from '@/data/tax-2026';
import { amortizeDebts, applyInflation } from '@/engine/financial-calculator';
import { LIVE_ECONOMIC_DATA } from '@/data/live';

export const RAISE_PERCENT = 0.05;

export interface IncomePlan {
  months: number;
  salaryBefore: number;
  /** Éves emelés (Maraton/Ultra) Ft/hó */
  raise: number;
  /** 25. születésnap: a nettó változása Ft/hó (negatív) */
  birthdayDelta: number;
  salary: number;
  passive: number;
  total: number;
}

export function planRoundIncome(game: GameState): IncomePlan {
  const player = game.players[game.activePlayerIndex];
  const ts = TIME_SCALE_CONFIGS[game.config.timeScale];
  const months = ts.monthsPerRound;
  const round = game.currentRound;
  const salaryBefore = player.financialSheet.income.salary;
  let salary = salaryBefore;
  const roundsPerYear = Math.round(12 / months);
  let raise = 0;
  if (ts.applyCareerProgression && salary > 0 && round > 1 && round % roundsPerYear === 0) {
    raise = Math.round(salary * RAISE_PERCENT);
    salary += raise;
  }
  let birthdayDelta = 0;
  const preset = CHARACTER_PRESETS[player.lifeSituation as CharacterPresetId];
  const age = game.config.customProfile?.age ?? preset?.age ?? 99;
  if (preset?.nextBirthdayInMonths && salary > 0 && !player.financialSheet.youthTaxEnded
    && round25(age, preset.nextBirthdayInMonths, months, ts.totalRounds) === round) {
    birthdayDelta = netAfterTurning25(salary) - salary;
    salary += birthdayDelta;
  }
  const passive = player.financialSheet.income.passive;
  return { months, salaryBefore, raise, birthdayDelta, salary, passive, total: (salary + passive) * months };
}

export interface ExpensePlan {
  months: number;
  /** Az évfordulós infláció utáni kiadások (ha most drágul) */
  inflated: Expenses | null;
  inflationRate: number;
  expenses: Expenses;
  monthly: number;
  total: number;
  /** A lejáró hitel túlfizetett részlete, ami visszajár */
  refund: number;
}

export function planRoundExpenses(game: GameState): ExpensePlan {
  const player = game.players[game.activePlayerIndex];
  const ts = TIME_SCALE_CONFIGS[game.config.timeScale];
  const months = ts.monthsPerRound;
  const round = game.currentRound;
  const roundsPerYear = Math.round(12 / months);
  const rate = LIVE_ECONOMIC_DATA.ksh.annualInflation;
  const inflated = ts.applyInflation && round > 1 && (round - 1) % roundsPerYear === 0
    ? applyInflation(player.financialSheet.expenses, rate, 12) : null;
  const expenses = inflated ?? player.financialSheet.expenses;
  const monthly = expenses.housing + expenses.utilities + expenses.food + expenses.transport + expenses.loanPayments + expenses.other;
  const refund = amortizeDebts(player.financialSheet.debts, months, round).refund;
  return { months, inflated, inflationRate: rate, expenses, monthly, total: monthly * months, refund };
}
