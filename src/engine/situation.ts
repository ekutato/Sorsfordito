// A játékos helyzete egy helyen, a döntéseiből és a valós állapotából (nem összegből becsülve).
// Erre szűr minden kártya: sorskártya, mezőkártya, döntés és opció (közös feltétel: `meets`).
import { isEmployed } from './employment';
import { CHARACTER_PRESETS } from '@/data/character-presets';
import type { FinancialSheet } from '@/types/financial';
import { TIME_SCALE_CONFIGS, type GameState } from '@/types/game';

/** Kiköltözést jelentő döntések (albérlet, kollégium, saját lakás) */
export const MOVE_OUT_CHOICES = ['dani-d01-a', 'dani-d01-c', 'fs-d05-a', 'fs-d05-b', 'fs-ext-03-a', 'fs-ext-03-b', 'fs-ext-03-c'];
/** Lakótárssal / közös lakásban */
export const SHARED_FLAT_CHOICES = ['dani-d01-c', 'fs-d05-b', 'fs-ext-03-c'];
/** Autóvásárlás */
export const CAR_CHOICES = ['fs-d05b-a', 'fs-d05b-b'];
/** Egyetemi (nappali) hallgató */
export const UNIVERSITY_CHOICES = ['fs-d01-a', 'fs-ext-01-a'];
/** Diákstátusz vége: munkába állás, külföld */
export const GRADUATED_CHOICES = ['fs-ext-01-b', 'fs-ext-01-c', 'fs-ext-02-a', 'fs-ext-02-b', 'fs-ext-02-c'];
/** Teljes munkaidős munkába állás (az egyetemi diákmunka nem az) */
export const JOB_CHOICES = ['fs-d01-c', 'fs-ext-01-b', 'fs-ext-02-a', 'fs-ext-02-b', 'fs-ext-02-c'];
/** Munkáltató nélkül (saját vállalkozás, karrierváltás alatti szünet) */
export const NO_EMPLOYER_CHOICES = ['inh-d06-c', 'inh-ext-04-b', 'dani-ext-03-c', 'dani-ext-04-a'];
/** Párkapcsolatot / közös háztartást megalapozó döntések */
export const PARTNER_CHOICES = ['dani-ext-02-a', 'dani-ext-02-b', 'dani-ext-02-c', 'fs-ext-04-a', 'fs-ext-04-b', 'fs-ext-04-c', 'inh-ext-01-a'];
/** Gyerek */
export const CHILD_CHOICES = ['inh-ext-01-a'];
/** Saját vállalkozás / mellékvállalkozás */
export const BUSINESS_CHOICES = ['dani-d06-c', 'dani-ext-03-c', 'dani-ext-04-a', 'dani-ext-04-b', 'inh-d05-a', 'inh-d05-b', 'inh-ext-04-b'];
/** Bankhitel (kiváltható, átütemezhető) */
export const BANK_DEBT_TYPES = ['personal_loan', 'mortgage', 'car_loan', 'credit_card', 'business_loan'];

/** Nem pénzügyi befektetés (képzés, eszköz) */
const NOT_PORTFOLIO = ['inv-professional-cert', 'inv-language', 'inv-solar-panel', 'inv-remote-eur', 'inv-coworking'];

export interface Situation {
  preset: string;
  round: number;
  /** Eltelt hónapok a játék kezdete óta */
  months: number;
  /** Van pénzügyi befektetése (nem vagyontárgy) */
  hasPortfolio: boolean;
  chosen: string[];
  debtTypes: string[];
  hasDebt: boolean;
  hasBankDebt: boolean;
  investments: string[];
  ownsCar: boolean;
  ownsHome: boolean;
  livesWithParents: boolean;
  sharesFlat: boolean;
  employed: boolean;
  student: boolean;
  age: number;
  /** Fizet SZJA-t (van bére, 25 éves elmúlt, nem SZJA-mentes tanulói bér) */
  paysSzja: boolean;
  hasPartner: boolean;
  hasChild: boolean;
  hasBusiness: boolean;
  salary: number;
  expenses: FinancialSheet['expenses'];
}

type SheetPart = Pick<FinancialSheet, 'income' | 'expenses' | 'debts' | 'investments'>;

const any = (chosen: string[], list: string[]) => chosen.some((id) => list.includes(id));

/** A legutóbbi a listák közül (pl. kiköltözött, majd visszaköltözött) */
function lastOf(chosen: string[], list: string[]): number {
  let i = -1;
  chosen.forEach((id, k) => { if (list.includes(id)) i = k; });
  return i;
}

export function situationOf(input: { sheet: SheetPart; chosen: string[]; preset: string; round: number; monthsPerRound?: number; age?: number }): Situation {
  const { sheet, chosen, preset, round } = input;
  const p = CHARACTER_PRESETS[preset];
  const startAge = input.age ?? p?.age ?? 30;
  const months = (round - 1) * (input.monthsPerRound ?? 1);
  const next = p?.nextBirthdayInMonths ?? 12;
  const age = startAge + (months >= next ? 1 + Math.floor((months - next) / 12) : 0);
  const debts = sheet.debts.filter((d) => d.remainingAmount > 0);
  const debtTypes = debts.map((d) => d.type);
  const investments = sheet.investments.map((i) => i.optionId);
  const startsHome = preset === 'fresh_start' || preset === 'career_start';
  const movedOut = lastOf(chosen, MOVE_OUT_CHOICES) > lastOf(chosen, ['fs-d05-c', 'dani-d01-b']);
  const graduated = any(chosen, GRADUATED_CHOICES);
  const university = any(chosen, UNIVERSITY_CHOICES) && !graduated;
  const apprentice = chosen.includes('fs-d01-b') && !graduated;
  const student = university || apprentice || (chosen.includes('fs-ext-01-a'));
  const noEmployer = lastOf(chosen, NO_EMPLOYER_CHOICES) > lastOf(chosen, ['inh-ext-04-a', 'dani-ext-03-a', 'dani-ext-03-b']);
  // Az egyetemista diákmunkája nem munkaviszony; a szakképzési munkaszerződés az
  const employed = !noEmployer && (university && !any(chosen, JOB_CHOICES) ? false : isEmployed(sheet.income.salary, chosen));
  return {
    preset, round, months, chosen, debtTypes,
    hasPortfolio: investments.some((i) => !i.startsWith('asset:') && !NOT_PORTFOLIO.includes(i)),
    hasDebt: debts.length > 0,
    hasBankDebt: debts.some((d) => BANK_DEBT_TYPES.includes(d.type)),
    investments,
    ownsCar: investments.includes('asset:auto') || any(chosen, CAR_CHOICES),
    ownsHome: investments.includes('asset:lakas') || chosen.includes('fs-ext-03-b') || chosen.includes('inh-d06-a'),
    livesWithParents: startsHome && !movedOut,
    sharesFlat: lastOf(chosen, SHARED_FLAT_CHOICES) >= 0 && lastOf(chosen, SHARED_FLAT_CHOICES) === lastOf(chosen, MOVE_OUT_CHOICES),
    employed,
    student,
    age,
    paysSzja: sheet.income.salary > 0 && age >= 25 && !apprentice,
    hasPartner: any(chosen, PARTNER_CHOICES),
    hasChild: any(chosen, CHILD_CHOICES),
    hasBusiness: any(chosen, BUSINESS_CHOICES) || investments.some((i) => ['inv-online-biz', 'inv-freelance-platform', 'asset:uzletresz'].includes(i)),
    salary: sheet.income.salary,
    expenses: sheet.expenses,
  };
}

/** A játékos eddigi döntései (opcióazonosítók, időrendben) */
export function chosenOf(game: Pick<GameState, 'eventLog'>): string[] {
  return (game.eventLog ?? []).map((e) => e.details?.optionId as string | undefined).filter((x): x is string => !!x);
}

/** Az aktív játékos helyzete */
export function situationOfGame(game: Pick<GameState, 'players' | 'activePlayerIndex' | 'eventLog' | 'currentRound' | 'config'>): Situation {
  const p = game.players[game.activePlayerIndex];
  return situationOf({
    sheet: p.financialSheet, chosen: chosenOf(game), preset: p.lifeSituation, round: game.currentRound,
    monthsPerRound: TIME_SCALE_CONFIGS[game.config.timeScale]?.monthsPerRound ?? 1,
    age: game.config.rules?.customProfile && game.config.customProfile ? game.config.customProfile.age : undefined,
  });
}

/** Közös feltétel: sorskártya, mezőkártya, döntés és opció */
export interface Requires {
  presets?: string[];
  hasSalary?: boolean;
  employed?: boolean;
  chose?: string[];
  notChose?: string[];
  rentsHome?: boolean;
  livesHome?: boolean;
  livesWithParents?: boolean;
  sharesFlat?: boolean;
  hasDebt?: boolean;
  hasBankDebt?: boolean;
  hasDebtType?: string | string[];
  hasInvestment?: string[];
  ownsCar?: boolean;
  ownsHome?: boolean;
  student?: boolean;
  paysSzja?: boolean;
  hasPartner?: boolean;
  hasChild?: boolean;
  hasBusiness?: boolean;
  minAge?: number;
  minRound?: number;
  maxRound?: number;
  minSalary?: number;
  /** Eltelt hónapok (a mód léptékétől független időzítés) */
  minMonths?: number;
  maxMonths?: number;
  hasPortfolio?: boolean;
}

const eq = (want: boolean | undefined, is: boolean) => want === undefined || want === is;

export function meets(r: Requires | undefined, s: Situation): boolean {
  if (!r) return true;
  if (r.presets && !r.presets.includes(s.preset)) return false;
  if (r.hasSalary && s.salary <= 0) return false;
  if (!eq(r.employed, s.employed)) return false;
  if (r.chose && !any(s.chosen, r.chose)) return false;
  if (r.notChose && any(s.chosen, r.notChose)) return false;
  // Albérlő: elköltözött és nem saját lakásban él (a kollégium is az)
  if (r.rentsHome !== undefined && !eq(r.rentsHome, !s.livesWithParents && !s.ownsHome)) return false;
  if (r.livesHome !== undefined && !eq(r.livesHome, s.livesWithParents)) return false;
  if (!eq(r.livesWithParents, s.livesWithParents)) return false;
  if (!eq(r.sharesFlat, s.sharesFlat)) return false;
  if (!eq(r.hasDebt, s.hasDebt)) return false;
  if (!eq(r.hasBankDebt, s.hasBankDebt)) return false;
  if (r.hasDebtType) {
    const types = Array.isArray(r.hasDebtType) ? r.hasDebtType : [r.hasDebtType];
    if (!s.debtTypes.some((t) => types.includes(t))) return false;
  }
  if (r.hasInvestment && !r.hasInvestment.some((id) => s.investments.includes(id))) return false;
  if (!eq(r.ownsCar, s.ownsCar)) return false;
  if (!eq(r.ownsHome, s.ownsHome)) return false;
  if (!eq(r.student, s.student)) return false;
  if (!eq(r.paysSzja, s.paysSzja)) return false;
  if (!eq(r.hasPartner, s.hasPartner)) return false;
  if (!eq(r.hasChild, s.hasChild)) return false;
  if (!eq(r.hasBusiness, s.hasBusiness)) return false;
  if (r.minAge !== undefined && s.age < r.minAge) return false;
  if (r.minRound !== undefined && s.round < r.minRound) return false;
  if (r.maxRound !== undefined && s.round > r.maxRound) return false;
  if (r.minSalary !== undefined && s.salary < r.minSalary) return false;
  if (r.minMonths !== undefined && s.months < r.minMonths) return false;
  if (r.maxMonths !== undefined && s.months > r.maxMonths) return false;
  if (!eq(r.hasPortfolio, s.hasPortfolio)) return false;
  return true;
}

/** Rejtett szabály a hatásokra: nem módosíthat olyat, ami nincs (hitel, kiadás, fizetés) */
const HOUSEHOLD = ['food', 'utilities', 'housing', 'transport'];
export function effectsFit(effects: Array<{ target: string; amount?: number; monthlyAmount?: number }>, s: Situation): boolean {
  for (const e of effects) {
    const amount = e.amount ?? e.monthlyAmount ?? 0;
    if (e.target === 'loanPayments' && amount < 0 && !s.hasDebt) return false;
    if (e.target === 'salary' && amount !== 0 && !s.employed && s.salary <= 0) return false;
    if (HOUSEHOLD.includes(e.target) && amount !== 0 && (s.expenses[e.target as keyof Situation['expenses']] ?? 0) <= 0) return false;
  }
  return true;
}

/** Eltelt idő magyarul: "2 hónap", "1 év", "2 év 3 hónap" */
export function elapsedText(months: number): string {
  const y = Math.floor(months / 12), m = months % 12;
  return [y ? `${y} év` : '', m ? `${m} hónap` : ''].filter(Boolean).join(' ') || '1 hónap';
}
