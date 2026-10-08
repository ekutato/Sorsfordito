// Előjel és irány egy helyen: a szín azt mutatja, javítja-e a játékos helyzetét a tétel
// (bevétel, egyenleg, jóllét: + jó; kiadás, törlesztő: − jó). Mínuszjel: valódi "−" (U+2212).
import { formatEffectAmount } from './financial-calculator';

export const MINUS = '−';
const EXPENSE_TARGETS = new Set(['housing', 'utilities', 'food', 'transport', 'loanPayments', 'other']);
const MONTHLY_TARGETS = new Set(['salary', 'passive', ...EXPENSE_TARGETS]);

/** Javítja-e a helyzetet (zöld) - 0 semleges */
export function effectDirection(target: string, amount: number): 'good' | 'bad' | 'neutral' {
  if (amount === 0) return 'neutral';
  const up = amount > 0;
  if (EXPENSE_TARGETS.has(target)) return up ? 'bad' : 'good';
  return up ? 'good' : 'bad';
}

/**
 * Előjeles összeg a pénzed szemszögéből: "+12 000 Ft", "−5 000 Ft/hó", "+1 pont".
 * Kiadásnál az előjel a pénzmozgás iránya: a kiadás növekedése "−" (piros), a csökkenése "+" (zöld),
 * így az előjel és a szín mindig egyezik.
 */
export function signedEffect(target: string, amount: number, opts?: { durationMonths?: number }): string {
  const flow = EXPENSE_TARGETS.has(target) ? -amount : amount;
  const sign = flow > 0 ? '+' : flow < 0 ? MINUS : '';
  const body = formatEffectAmount(target, Math.abs(amount));
  const monthly = MONTHLY_TARGETS.has(target) ? '/hó' : '';
  const dur = opts?.durationMonths ? ` (${opts.durationMonths} hónapig)` : '';
  return `${sign}${body}${monthly}${dur}`;
}

/** Előjeles Ft-összeg pénzmozgáshoz (egyenlegváltozás) */
export function signedHUF(amount: number): string {
  return signedEffect('balance', Math.round(amount));
}

export const DIRECTION_CLASS = { good: 'text-money-positive', bad: 'text-money-negative', neutral: 'text-money-neutral' } as const;
