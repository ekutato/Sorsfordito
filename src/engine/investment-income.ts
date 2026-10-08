// Befektetés havi hatása: amit a kártya ígér, azt a játék ténylegesen jóváírja.
// Kamatozó eszköznél a heti élő adatból számol (állampapír: adómentes; bankbetét: 28% kamatadó).
// Ami valójában béremelés (képzés, nyelvtudás, távmunka), az a fizetést növeli, nem a passzív jövedelmet;
// a napelem a rezsit csökkenti.
import type { InvestmentOption } from '@/types/financial';
import { LIVE_DATA } from '@/data/live';

export type IncomeTarget = 'passive' | 'salary' | 'utilities';

/** Bankbetét kamatadója 2023. július óta: 15% SZJA + 13% szocho (CLAUDE.md 4. szabály) */
export const DEPOSIT_INTEREST_TAX = 0.28;

const live = (key: string): number | undefined => {
  const x = LIVE_DATA.ertekek[key];
  return x && typeof x.value === 'number' ? x.value : undefined;
};

const SALARY_IDS = new Set(['inv-professional-cert', 'inv-language', 'inv-remote-eur']);
const UTILITY_IDS = new Set(['inv-solar-panel']);

export function investmentTarget(option: Pick<InvestmentOption, 'id'>): IncomeTarget {
  if (SALARY_IDS.has(option.id)) return 'salary';
  if (UTILITY_IDS.has(option.id)) return 'utilities';
  return 'passive';
}

/** Havi összeg (Ft), amelyet a befektetés a célpontjára ad (utilities esetén ennyivel csökken a rezsi) */
export function monthlyInvestmentIncome(option: Pick<InvestmentOption, 'id' | 'entryPrice' | 'monthlyPassiveIncome' | 'dynamicDataKey'>): number {
  // Állampapír: a heti hozamból, adómentesen
  if (option.dynamicDataKey === 'akk.pmapYield' || option.dynamicDataKey === 'akk.mapPlusYield') {
    const y = live(option.dynamicDataKey);
    if (y !== undefined) return Math.round((option.entryPrice * y) / 100 / 12);
  }
  if (option.id === 'inv-bank-deposit') {
    const y = live('bank.depositRate');
    if (y !== undefined) return Math.round((option.entryPrice * y * (1 - DEPOSIT_INTEREST_TAX)) / 100 / 12);
  }
  return option.monthlyPassiveIncome;
}
