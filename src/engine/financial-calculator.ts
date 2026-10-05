// ============================================================================
// PENZUGYI SORSFORDITO - Financial Calculator
// Penzugyi szamitasok: cashflow, netto vagyon, hozamok, inflacio
// ============================================================================

import type {
  FinancialSheet,
  ComputedFinancials,
  Investment,
  Debt,
  HUF,
  Percentage,
} from '@/types/financial';
import type { TimeScaleConfig } from '@/types/game';
import { RULESETS, DEFAULT_RULESET_ID } from '@/rulesets';

/**
 * Ujraszamolja a Penzugyi Lap szamitott mezeit
 */
export function computeFinancials(sheet: FinancialSheet): ComputedFinancials {
  const totalIncome =
    sheet.income.salary + sheet.income.passive + sheet.income.oneTime;

  const totalExpenses =
    sheet.expenses.housing +
    sheet.expenses.utilities +
    sheet.expenses.food +
    sheet.expenses.transport +
    sheet.expenses.loanPayments +
    sheet.expenses.other;

  const investmentValue = sheet.investments.reduce(
    (sum, inv) => sum + inv.currentValue,
    0
  );

  const totalDebt = sheet.debts.reduce(
    (sum, debt) => sum + debt.remainingAmount,
    0
  );

  const netWorth = sheet.balance + investmentValue - totalDebt;
  const freeCashflow = totalIncome - totalExpenses;

  const financialFreedomPercent =
    totalExpenses > 0
      ? Math.round((sheet.income.passive / totalExpenses) * 100)
      : 0;

  const emergencyFundMonths =
    totalExpenses > 0
      ? Math.round((sheet.balance / totalExpenses) * 10) / 10
      : Infinity;

  return {
    totalIncome,
    totalExpenses,
    freeCashflow,
    investmentValue,
    totalDebt,
    netWorth,
    financialFreedomPercent,
    emergencyFundMonths,
  };
}

/**
 * Szamolja egy befektetes havi hozamat
 * A valos adatokbol (ha elerheto) vagy fix ratakbol szamol
 */
export function calculateInvestmentReturn(
  investment: Investment,
  annualReturnRate: Percentage,
  monthsInPeriod: number
): HUF {
  // Havi kamatlab
  const monthlyRate = annualReturnRate / 100 / 12;

  // Kamatos kamat formula: P * ((1 + r)^n - 1)
  const compoundReturn =
    investment.currentValue * (Math.pow(1 + monthlyRate, monthsInPeriod) - 1);

  return Math.round(compoundReturn);
}

/**
 * Szamolja egy adossag havi kamatat
 */
export function calculateDebtInterest(
  debt: Debt,
  monthsInPeriod: number
): HUF {
  if (debt.isInterestFree) return 0;

  const monthlyRate = debt.interestRate / 100 / 12;
  return Math.round(debt.remainingAmount * monthlyRate * monthsInPeriod);
}

/**
 * Feldolgozza egy adossag havi torleszteset
 * Visszaadja az uj fennallo osszeget
 */
export function processDebtPayment(
  debt: Debt,
  monthsInPeriod: number
): { newRemaining: HUF; interestPaid: HUF; principalPaid: HUF } {
  if (debt.remainingAmount <= 0) {
    return { newRemaining: 0, interestPaid: 0, principalPaid: 0 };
  }

  const totalPayment = debt.monthlyPayment * monthsInPeriod;
  const interest = calculateDebtInterest(debt, monthsInPeriod);
  const principalPaid = Math.min(totalPayment - interest, debt.remainingAmount);
  const newRemaining = Math.max(0, debt.remainingAmount - principalPaid);

  return {
    newRemaining,
    interestPaid: interest,
    principalPaid,
  };
}

/**
 * Alkalmazza az inflaciot a kiadasokra
 * Maraton es Ultra modban hasznaljuk
 */
export function applyInflation(
  expenses: FinancialSheet['expenses'],
  annualInflationRate: Percentage,
  monthsInPeriod: number
): FinancialSheet['expenses'] {
  // Az inflaciot a teljes idoszakra szamoljuk
  const periodRate = annualInflationRate / 100 * (monthsInPeriod / 12);
  const multiplier = 1 + periodRate;

  return {
    housing: Math.round(expenses.housing * multiplier),
    utilities: Math.round(expenses.utilities * multiplier),
    food: Math.round(expenses.food * multiplier), // Elelmiszer: inflacio folott szokas noni
    transport: Math.round(expenses.transport * multiplier),
    loanPayments: expenses.loanPayments, // A torleszto FIX - nem no inflacióval!
    other: Math.round(expenses.other * multiplier),
  };
}

/**
 * Szamolja a Penzugyi IQ-t (0-100) a jatek vegere
 * Sulyozott atlag 6 szempont alapjan
 */
export function calculateFinancialIQ(params: {
  startingNetWorth: HUF;
  endingNetWorth: HUF;
  startingIncome: HUF;
  endingIncome: HUF;
  passiveIncomeRatio: Percentage; // passziv / osszes bevetel
  investmentCount: number;
  knowledgeCount: number;
  debtReduction: Percentage; // mennyit torlosztott le
  crisisCount: number; // hanyszor volt valsagban
  emergencyFundMonths: number;
}): number {
  const {
    startingNetWorth,
    endingNetWorth,
    startingIncome,
    endingIncome,
    passiveIncomeRatio,
    investmentCount,
    knowledgeCount,
    debtReduction,
    crisisCount,
    emergencyFundMonths,
  } = params;

  // 1. Vagyonnovekedesi pontszam (0-20)
  const wealthGrowth =
    startingNetWorth > 0
      ? Math.min(20, Math.max(0, ((endingNetWorth - startingNetWorth) / startingNetWorth) * 20))
      : endingNetWorth > 0 ? 15 : 0;

  // 2. Jovedelem-novekedesi pontszam (0-15)
  const incomeGrowth =
    startingIncome > 0
      ? Math.min(15, Math.max(0, ((endingIncome - startingIncome) / startingIncome) * 30))
      : endingIncome > 0 ? 10 : 0;

  // 3. Passziv jovedelem arany (0-20)
  const passiveScore = Math.min(20, passiveIncomeRatio * 0.2);

  // 4. Diverzifikacio (0-15)
  const diversificationScore = Math.min(15, investmentCount * 3);

  // 5. Tudas (0-15)
  const knowledgeScore = Math.min(15, knowledgeCount * 2.5);

  // 6. Penzugyi biztonsag (0-15)
  const safetyScore =
    Math.min(5, emergencyFundMonths * 1.5) + // Veszhelyzeti alap (0-5)
    Math.min(5, debtReduction * 0.05) +       // Adossagcsokkentes (0-5)
    Math.max(0, 5 - crisisCount * 2);         // Valsagkerules (0-5)

  const totalIQ = Math.round(
    wealthGrowth + incomeGrowth + passiveScore +
    diversificationScore + knowledgeScore + safetyScore
  );

  return Math.min(100, Math.max(0, totalIQ));
}

/**
 * Formatazza a Ft osszegeket magyar formatumra
 */
export function formatHUF(amount: HUF): string {
  if (Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${millions.toFixed(1)}M Ft`;
  }
  return `${amount.toLocaleString('hu-HU')} Ft`;
}

/**
 * Szinezi az osszeget (pozitiv = zold, negativ = piros)
 */
export function getAmountColor(amount: HUF): string {
  if (amount > 0) return 'text-money-positive';
  if (amount < 0) return 'text-money-negative';
  return 'text-money-neutral';
}

/**
 * Szamolja hány hónap kell egy adott osszeg osszegyujtesere
 * a jelenlegi szabad cashflow-val
 */
export function monthsToSave(targetAmount: HUF, monthlySavings: HUF): number | null {
  if (monthlySavings <= 0) return null; // Soha nem eri el
  return Math.ceil(targetAmount / monthlySavings);
}


const WB_LABELS = RULESETS[DEFAULT_RULESET_ID].labels.wellbeing;

/** Hatás összegének megjelenítése: jólléti célpontnál pont, egyébként Ft */
export function formatEffectAmount(target: string, amount: number): string {
  if (target.startsWith('wellbeing.')) {
    const key = target.slice(10) as keyof typeof WB_LABELS;
    return `${amount} ${WB_LABELS[key] ?? 'pont'}`;
  }
  return formatHUF(amount);
}
