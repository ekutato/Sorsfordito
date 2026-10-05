// ============================================================================
// PENZUGYI SORSFORDITO - Round Processor
// Kor-feldolgozo: a jatek minden korenek logikaja
// ============================================================================

import type {
  FinancialSheet,
  FinancialSnapshot,
  Investment,
  HUF,
  ActiveOngoingEffect,
} from '@/types/financial';
import type {
  GameState,
  GamePhase,
  GameEvent,
  DecisionCard,
  DecisionOption,
  FateEvent,
  TimeScaleConfig,
} from '@/types/game';
import { TIME_SCALE_CONFIGS } from '@/types/game';
import {
  computeFinancials,
  calculateInvestmentReturn,
  processDebtPayment,
  applyInflation,
} from './financial-calculator';
import type { EconomicData } from '@/types/data-sources';

// --- Kor fazisok sorrendben ---

export const ROUND_PHASES: GamePhase[] = [
  'round_income',
  'round_expenses',
  'round_decision',
  'round_invest',
  'round_fate',
  'round_summary',
];

/**
 * Egy teljes kor eredmenye - minden fazist tartalmaz
 */
export interface RoundResult {
  round: number;
  gameDate: string;
  events: GameEvent[];
  snapshot: FinancialSnapshot;
  isCrisis: boolean; // Egyenleg < 0?
  isGameOver: boolean; // Utolso kor?
}

// --- 0. fazis: Tartós hatások kezelése (lejárt effektek eltávolítása) ---

export function processOngoingEffects(
  sheet: FinancialSheet,
  round: number,
  gameDate: string
): { updatedSheet: FinancialSheet; events: GameEvent[] } {
  const active = sheet.activeOngoingEffects ?? [];
  if (active.length === 0) return { updatedSheet: sheet, events: [] };

  let updatedSheet = { ...sheet };
  const events: GameEvent[] = [];
  const stillActive: ActiveOngoingEffect[] = [];

  for (const oe of active) {
    if (oe.remainingRounds === 0) {
      // Lejárt: visszavonjuk a hatást
      if (oe.target === 'salary') {
        updatedSheet.income = {
          ...updatedSheet.income,
          salary: updatedSheet.income.salary - oe.monthlyAmount,
        };
      } else if (oe.target === 'debt_reduction') {
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          loanPayments: updatedSheet.expenses.loanPayments + oe.monthlyAmount,
        };
      } else if (oe.target in updatedSheet.expenses) {
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          [oe.target]: (updatedSheet.expenses as any)[oe.target] - oe.monthlyAmount,
        };
      }

      events.push({
        round,
        gameDate,
        type: 'income',
        description: `Lejárt: ${oe.description}`,
        financialImpact: 0,
      });
    } else {
      // Még aktív: csökkentjük a hátralévő köröket (ha nem végtelen)
      stillActive.push({
        ...oe,
        remainingRounds: oe.remainingRounds === -1 ? -1 : oe.remainingRounds - 1,
      });
    }
  }

  updatedSheet.activeOngoingEffects = stillActive;
  updatedSheet.computed = computeFinancials(updatedSheet);

  return { updatedSheet, events };
}

// --- 1. fazis: Bevetel ---

export interface IncomeResult {
  salaryIncome: HUF;
  passiveIncome: HUF;
  totalIncome: HUF;
  updatedSheet: FinancialSheet;
  events: GameEvent[];
}

export function processIncome(
  sheet: FinancialSheet,
  round: number,
  gameDate: string,
  tsConfig: TimeScaleConfig
): IncomeResult {
  const months = tsConfig.monthsPerRound;
  let currentSalary = sheet.income.salary;
  const events: GameEvent[] = [];

  // Karrierprogresszió: marathon/ultra módban, évi ~5% emelés
  // Marathon: 12/3 = 4 kör/év, Ultra: 12/6 = 2 kör/év
  const roundsPerYear = Math.round(12 / months);
  if (tsConfig.applyCareerProgression && currentSalary > 0 && round > 1 && round % roundsPerYear === 0) {
    const raisePercent = 0.05; // 5% éves emelés (MO átlag: 5-10%)
    const raiseAmount = Math.round(currentSalary * raisePercent);
    if (raiseAmount > 0) {
      currentSalary += raiseAmount;
      events.push({
        round,
        gameDate,
        type: 'income',
        description: `Karrierprogresszió: +${raiseAmount.toLocaleString('hu-HU')} Ft/hó fizetésemelés (+5%)`,
        financialImpact: 0, // Havi emelés, nem egyszeri
      });
    }
  }

  const salaryIncome = currentSalary * months;
  const passiveIncome = sheet.income.passive * months;
  const totalIncome = salaryIncome + passiveIncome;

  const updatedSheet: FinancialSheet = {
    ...sheet,
    balance: sheet.balance + totalIncome,
    income: {
      ...sheet.income,
      salary: currentSalary, // Frissített fizetés (karrierprogresszió után)
      oneTime: 0, // Egyszeri bevetel resetelese uj kor elejen
    },
  };
  updatedSheet.computed = computeFinancials(updatedSheet);

  events.push({
    round,
    gameDate,
    type: 'income',
    description: months > 1
      ? `Bevétel beérkezett: ${salaryIncome.toLocaleString('hu-HU')} Ft (${months} hónap × ${currentSalary.toLocaleString('hu-HU')} Ft/hó)` +
        (passiveIncome > 0 ? ` + Passzív: ${passiveIncome.toLocaleString('hu-HU')} Ft` : '')
      : `Bevétel beérkezett: ${salaryIncome.toLocaleString('hu-HU')} Ft` +
        (passiveIncome > 0 ? `, Passzív: +${passiveIncome.toLocaleString('hu-HU')} Ft` : ''),
    financialImpact: totalIncome,
  });

  return { salaryIncome, passiveIncome, totalIncome, updatedSheet, events };
}

// --- 2. fazis: Kiadasok ---

export interface ExpenseResult {
  totalExpenses: HUF;
  updatedSheet: FinancialSheet;
  events: GameEvent[];
  inflationApplied: boolean;
}

export function processExpenses(
  sheet: FinancialSheet,
  round: number,
  gameDate: string,
  tsConfig: TimeScaleConfig,
  economicData?: EconomicData
): ExpenseResult {
  const months = tsConfig.monthsPerRound;
  let currentExpenses = sheet.expenses;
  let inflationApplied = false;

  // Inflacio alkalmazasa (Maraton/Ultra modban, minden 4. korben)
  if (tsConfig.applyInflation && round % 4 === 0 && economicData) {
    currentExpenses = applyInflation(
      currentExpenses,
      economicData.ksh.annualInflation,
      months
    );
    inflationApplied = true;
  }

  const totalExpenses =
    (currentExpenses.housing +
      currentExpenses.utilities +
      currentExpenses.food +
      currentExpenses.transport +
      currentExpenses.loanPayments +
      currentExpenses.other) * months;

  const updatedSheet: FinancialSheet = {
    ...sheet,
    balance: sheet.balance - totalExpenses,
    expenses: currentExpenses,
  };
  updatedSheet.computed = computeFinancials(updatedSheet);

  const monthlyTotal = totalExpenses / months;
  const events: GameEvent[] = [
    {
      round,
      gameDate,
      type: 'expense',
      description: months > 1
        ? `Kiadások levonva: ${totalExpenses.toLocaleString('hu-HU')} Ft (${months} hónap × ${Math.round(monthlyTotal).toLocaleString('hu-HU')} Ft/hó)` +
          (inflationApplied ? ' – inflációval korrigálva' : '')
        : `Kiadások levonva: ${totalExpenses.toLocaleString('hu-HU')} Ft` +
          (inflationApplied ? ' (inflációval korrigálva)' : ''),
      financialImpact: -totalExpenses,
    },
  ];

  return { totalExpenses, updatedSheet, events, inflationApplied };
}

// --- 3. fazis: Dontes alkalmazasa ---

export interface DecisionResult {
  selectedOption: DecisionOption;
  updatedSheet: FinancialSheet;
  events: GameEvent[];
  unlockedInvestments: string[];
  unlockedKnowledge: string[];
  nextDecisionId?: string;
}

export function applyDecision(
  sheet: FinancialSheet,
  decision: DecisionCard,
  selectedOptionId: string,
  round: number,
  gameDate: string
): DecisionResult {
  const option = decision.options.find((o) => o.id === selectedOptionId);
  if (!option) throw new Error(`Invalid option: ${selectedOptionId}`);

  let updatedSheet = { ...sheet };
  const events: GameEvent[] = [];

  // Penzugyi hatasok alkalmazasa
  for (const effect of option.financialEffects) {
    switch (effect.target) {
      case 'balance':
        updatedSheet.balance += effect.amount;
        break;
      case 'salary':
        updatedSheet.income = {
          ...updatedSheet.income,
          salary: updatedSheet.income.salary + effect.amount,
        };
        break;
      case 'housing':
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          housing: updatedSheet.expenses.housing + effect.amount, // ADD logika (konzisztens a store-ral)
        };
        break;
      case 'utilities':
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          utilities: updatedSheet.expenses.utilities + effect.amount,
        };
        break;
      case 'food':
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          food: updatedSheet.expenses.food + effect.amount,
        };
        break;
      case 'transport':
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          transport: updatedSheet.expenses.transport + effect.amount,
        };
        break;
      case 'loanPayments':
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          loanPayments: updatedSheet.expenses.loanPayments + effect.amount,
        };
        break;
      case 'other':
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          other: updatedSheet.expenses.other + effect.amount,
        };
        break;
    }
  }

  // Tartós hatások (ongoingEffects) feldolgozása
  if (option.ongoingEffects && option.ongoingEffects.length > 0) {
    const newOngoing: ActiveOngoingEffect[] = option.ongoingEffects.map((oe, idx) => ({
      id: `ongoing-${decision.id}-${option.id}-${idx}`,
      target: oe.target,
      monthlyAmount: oe.monthlyAmount,
      startedAtRound: round,
      durationRounds: oe.durationRounds,
      remainingRounds: oe.durationRounds, // -1 = végtelen
      description: oe.description,
      sourceDecisionId: decision.id,
    }));

    updatedSheet.activeOngoingEffects = [
      ...(updatedSheet.activeOngoingEffects ?? []),
      ...newOngoing,
    ];

    // Azonnali hatásokat is alkalmazzuk: a tartós effektek az aktuális körben is érvényesek
    for (const oe of option.ongoingEffects) {
      if (oe.target === 'salary') {
        updatedSheet.income = {
          ...updatedSheet.income,
          salary: updatedSheet.income.salary + oe.monthlyAmount,
        };
      } else if (oe.target in updatedSheet.expenses) {
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          [oe.target]: (updatedSheet.expenses as any)[oe.target] + oe.monthlyAmount,
        };
      }
      // 'debt_reduction' típus: a loanPayments csökkentése
      if (oe.target === 'debt_reduction') {
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          loanPayments: Math.max(0, updatedSheet.expenses.loanPayments - oe.monthlyAmount),
        };
      }

      events.push({
        round,
        gameDate,
        type: 'income',
        description: `Tartós hatás: ${oe.description} (${oe.monthlyAmount > 0 ? '+' : ''}${oe.monthlyAmount.toLocaleString('hu-HU')} Ft/hó${oe.durationRounds === -1 ? '' : `, ${oe.durationRounds} körig`})`,
        financialImpact: 0, // Havi változás, nem egyszeri
      });
    }
  }

  updatedSheet.computed = computeFinancials(updatedSheet);

  events.push({
    round,
    gameDate,
    type: 'decision',
    description: `${decision.title}: ${option.label}`,
    financialImpact: option.financialEffects.reduce((sum, e) => {
      if (e.target === 'balance') return sum + e.amount;
      return sum; // Havi valtozasokat nem szamoljuk egyszeri hatasnak
    }, 0),
    details: { decisionId: decision.id, optionId: option.id },
  });

  // Tudas kartyak feloldasa
  if (option.unlocksKnowledge) {
    for (const knowledgeId of option.unlocksKnowledge) {
      if (!updatedSheet.acquiredKnowledge.includes(knowledgeId)) {
        updatedSheet.acquiredKnowledge = [
          ...updatedSheet.acquiredKnowledge,
          knowledgeId,
        ];
        events.push({
          round,
          gameDate,
          type: 'knowledge',
          description: `Új tudás: ${knowledgeId}`,
        });
      }
    }
  }

  return {
    selectedOption: option,
    updatedSheet,
    events,
    unlockedInvestments: option.unlocksInvestment || [],
    unlockedKnowledge: option.unlocksKnowledge || [],
    nextDecisionId: option.nextDecisionId,
  };
}

// --- 4. fazis: Befektetes hozamok ---

export interface InvestmentReturnResult {
  totalReturns: HUF;
  updatedSheet: FinancialSheet;
  events: GameEvent[];
}

export function processInvestmentReturns(
  sheet: FinancialSheet,
  round: number,
  gameDate: string,
  tsConfig: TimeScaleConfig,
  economicData?: EconomicData
): InvestmentReturnResult {
  if (sheet.investments.length === 0) {
    return { totalReturns: 0, updatedSheet: sheet, events: [] };
  }

  const months = tsConfig.monthsPerRound;
  let totalReturns = 0;

  const updatedInvestments = sheet.investments.map((inv) => {
    // Alapertelmezett eves hozam: 6% (PMAP szintu)
    const annualRate = economicData?.akk.pmapYield ?? 6.0;
    const returnAmount = calculateInvestmentReturn(inv, annualRate, months);
    totalReturns += returnAmount;

    return {
      ...inv,
      currentValue: inv.currentValue + returnAmount,
      totalIncomeGenerated: inv.totalIncomeGenerated + returnAmount,
    };
  });

  // Passziv jovedelem frissitese
  const monthlyPassive = sheet.investments.reduce((sum, inv) => {
    // Egyszeru becles: befektetes havi hozama
    return sum + Math.round(inv.currentValue * 0.005);
  }, 0);

  const updatedSheet: FinancialSheet = {
    ...sheet,
    investments: updatedInvestments,
    income: { ...sheet.income, passive: monthlyPassive },
  };
  updatedSheet.computed = computeFinancials(updatedSheet);

  const events: GameEvent[] = totalReturns > 0
    ? [{
        round,
        gameDate,
        type: 'investment',
        description: `Befektetési hozam: +${Math.round(totalReturns).toLocaleString('hu-HU')} Ft`,
        financialImpact: Math.round(totalReturns),
      }]
    : [];

  return { totalReturns: Math.round(totalReturns), updatedSheet, events };
}

// --- 5. fazis: Sorsfordito alkalmazasa ---

export interface FateResult {
  updatedSheet: FinancialSheet;
  events: GameEvent[];
}

export function applyFateEvent(
  sheet: FinancialSheet,
  fateEvent: FateEvent,
  round: number,
  gameDate: string,
  selectedOptionId?: string // Ha dontes-tipusu sorsfordito
): FateResult {
  let updatedSheet = { ...sheet };
  const events: GameEvent[] = [];

  // Ha dontes-tipusu es van kivalasztott opcio
  const effects =
    fateEvent.type === 'decision' && selectedOptionId
      ? fateEvent.decisionOptions?.find((o) => o.id === selectedOptionId)?.financialEffects ?? []
      : fateEvent.financialEffects;

  for (const effect of effects) {
    switch (effect.target) {
      case 'balance':
        updatedSheet.balance += effect.amount;
        break;
      case 'salary':
        updatedSheet.income = {
          ...updatedSheet.income,
          salary: updatedSheet.income.salary + effect.amount,
        };
        break;
      case 'housing':
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          housing: updatedSheet.expenses.housing + effect.amount,
        };
        break;
      case 'food':
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          food: updatedSheet.expenses.food + effect.amount,
        };
        break;
      case 'loanPayments':
        updatedSheet.expenses = {
          ...updatedSheet.expenses,
          loanPayments: updatedSheet.expenses.loanPayments + effect.amount,
        };
        break;
      default:
        // Egyeb kiadasi kategoriak
        if (effect.target in updatedSheet.expenses) {
          (updatedSheet.expenses as any)[effect.target] += effect.amount;
        }
        break;
    }
  }

  // Biztositas-tudassal rendelkezo jatekos: negativ hatasok 50%-a
  const hasInsurance = updatedSheet.acquiredKnowledge.includes('know-insurance');
  if (hasInsurance && fateEvent.type === 'negative') {
    // A negativ balance-hatasokat felezzuk
    for (const effect of effects) {
      if (effect.target === 'balance' && effect.amount < 0) {
        const saving = Math.round(Math.abs(effect.amount) * 0.5);
        updatedSheet.balance += saving;
        events.push({
          round,
          gameDate,
          type: 'knowledge',
          description: `Biztosítás megtérítés: +${saving.toLocaleString('hu-HU')} Ft`,
          financialImpact: saving,
        });
      }
    }
  }

  updatedSheet.computed = computeFinancials(updatedSheet);

  const totalImpact = effects.reduce((sum, e) => {
    if (e.target === 'balance') return sum + e.amount;
    return sum;
  }, 0);

  events.unshift({
    round,
    gameDate,
    type: 'fate',
    description: `Sorsfordító: ${fateEvent.title}`,
    financialImpact: totalImpact,
    details: { fateEventId: fateEvent.id, source: fateEvent.source },
  });

  return { updatedSheet, events };
}

// --- 6. fazis: Kor vegi osszesites ---

export function takeSnapshot(
  sheet: FinancialSheet,
  round: number,
  gameDate: string
): FinancialSnapshot {
  return {
    round,
    gameDate,
    balance: sheet.balance,
    netWorth: sheet.computed.netWorth,
    freeCashflow: sheet.computed.freeCashflow,
    passiveIncome: sheet.income.passive,
  };
}

// --- Valsag ellenorzes ---

export function checkCrisis(sheet: FinancialSheet): boolean {
  return sheet.balance < 0;
}

// --- Jatek vege ellenorzes ---

export function checkGameOver(
  currentRound: number,
  tsConfig: TimeScaleConfig
): boolean {
  return currentRound >= tsConfig.totalRounds;
}
