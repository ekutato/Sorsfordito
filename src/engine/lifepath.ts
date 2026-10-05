// Életpálya mód számításai: mennyi idő alatt érhető el a pénzügyi függetlenség.
// Módszer: Mr. Money Mustache közismert levezetése (nulláról indulva, éves megtakarítás
// reálhozammal kamatozik, cél = éves kiadás / biztonságos kivételi ráta).
// Forrás és kritika: docs/kutatas.md 7.2 (a 4%-os szabály túl optimista, korai
// függetlenségnél 3,25-3,5% a reálisabb).

export interface FiAssumptions {
  /** Megtakarítási ráta a nettó jövedelemből (0-1) */
  savingsRate: number;
  /** Éves reálhozam (infláció feletti), pl. 0.04 */
  realReturn: number;
  /** Biztonságos kivételi ráta, pl. 0.035 */
  withdrawalRate: number;
  /** Induló vagyon a nettó éves jövedelem arányában (0 = nulláról indul) */
  startingWealthYears?: number;
}

/** Hány év kell a pénzügyi függetlenséghez (egész évre felfelé kerekítve); Infinity, ha nem érhető el */
export function yearsToFinancialIndependence(a: FiAssumptions, maxYears = 80): number {
  if (a.savingsRate <= 0) return Infinity;
  const target = (1 - a.savingsRate) / a.withdrawalRate;
  let wealth = a.startingWealthYears ?? 0;
  if (wealth >= target) return 0;
  for (let y = 1; y <= maxYears; y++) {
    wealth = wealth * (1 + a.realReturn) + a.savingsRate;
    if (wealth >= target) return y;
  }
  return Infinity;
}

/** Fokozatos célok (a teljes függetlenség előtt is legyen sikerélmény) */
export const LIFEPATH_GOALS = [
  { id: 'tartalek-1', label: '1 havi tartalék', check: (m: GoalMetrics) => m.cashMonths >= 1 },
  { id: 'tartalek-6', label: '6 havi tartalék', check: (m: GoalMetrics) => m.cashMonths >= 6 },
  { id: 'adossagmentes', label: 'Adósságmentesség (lakáshitel nélkül)', check: (m: GoalMetrics) => m.nonMortgageDebt <= 0 },
  { id: 'reszleges', label: 'Részleges függetlenség (a passzív jövedelem a kiadás felét fedezi)', check: (m: GoalMetrics) => m.freedomPercent >= 50 },
  { id: 'teljes', label: 'Teljes pénzügyi függetlenség', check: (m: GoalMetrics) => m.freedomPercent >= 100 },
] as const;

export interface GoalMetrics {
  cashMonths: number;
  nonMortgageDebt: number;
  freedomPercent: number;
}

export function reachedGoals(m: GoalMetrics): string[] {
  return LIFEPATH_GOALS.filter((g) => g.check(m)).map((g) => g.id);
}

/**
 * Évek összevonása: a rutinszerű éveket a játék egy lépésben számolja ki
 * (cashflow × évek, kamatos kamattal), csak a fordulópont-éveknél áll meg.
 */
export function compressYears(startWealth: number, annualSaving: number, realReturn: number, years: number): number {
  let w = startWealth;
  for (let i = 0; i < years; i++) w = w * (1 + realReturn) + annualSaving;
  return Math.round(w);
}
