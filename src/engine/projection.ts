// Mennyit érhet a befektetés 5, 10, 20 év múlva - tájékoztató, a ranglistán nem számít.
// - Kamatozó (állampapír, betét): a mostani, ellenőrzött kamattal, a kamatot újra befektetve (betétnél 28% adó után).
// - Jövedelemtermelő (kiadás, képzés, napelem, P2P): az érték + a havi hozam összesen, ha változatlan marad.
// - Árfolyamos (részvény, ETF, arany): sáv a hosszú távú múltbeli hozamokból (data/long-term-returns.ts).
// - Kripto és ami nem jelezhető előre: nincs szám.
// Mindegyik mellett a mai pénzben vett érték is (a mostani éves inflációval).
import { LIVE_DATA } from '@/data/live';
import { DEPOSIT_INTEREST_TAX } from './investment-income';
import { BAND_OF, RETURN_BANDS, type ReturnBand } from '@/data/long-term-returns';

export const PROJECTION_YEARS = [5, 10, 20] as const;

const live = (k: string) => {
  const v = LIVE_DATA.ertekek[k]?.value;
  return typeof v === 'number' ? v : undefined;
};

export type ProjectionKind = 'compound' | 'income' | 'market' | 'none';

export interface Projection {
  kind: ProjectionKind;
  /** Éves kamat (%), kamatozónál */
  ratePct?: number;
  band?: ReturnBand;
  points: Array<{ years: number; low: number; mid: number; high: number; real: number }>;
  note: string;
}

/** Évenkénti kamat a kamatozó eszközökre (adózás után) */
export function compoundRate(optionId: string): number | undefined {
  if (optionId === 'inv-pmap') return live('akk.pmapYield');
  if (optionId === 'inv-map-plus') return live('akk.mapPlusYield');
  if (optionId === 'inv-bank-deposit') { const r = live('bank.depositRate'); return r === undefined ? undefined : r * (1 - DEPOSIT_INTEREST_TAX); }
  return undefined;
}

const grow = (value: number, pct: number, years: number) => value * Math.pow(1 + pct / 100, years);

export function projectInvestment(inv: { optionId: string; currentValue: number; monthlyIncome?: number }): Projection {
  const infl = live('ksh.annualInflation') ?? 0;
  const deflate = (v: number, y: number) => Math.round(v / Math.pow(1 + infl / 100, y));
  const rate = compoundRate(inv.optionId);
  if (rate !== undefined) {
    return {
      kind: 'compound', ratePct: rate,
      points: PROJECTION_YEARS.map((y) => { const v = Math.round(grow(inv.currentValue, rate, y)); return { years: y, low: v, mid: v, high: v, real: deflate(v, y) }; }),
      note: `Ha a mostani ${rate.toLocaleString('hu-HU', { maximumFractionDigits: 2 })}%-os kamat${inv.optionId === 'inv-bank-deposit' ? ' (28% kamatadó után)' : ''} maradna, és a kamatot újra befekteted.${inv.optionId === 'inv-pmap' ? ' A PMÁP kamata az inflációt követi, ezért évről évre változik.' : ''}`,
    };
  }
  const band = RETURN_BANDS[BAND_OF[inv.optionId] ?? ''];
  if (band) {
    return {
      kind: 'market', band,
      points: PROJECTION_YEARS.map((y) => {
        const mid = Math.round(grow(inv.currentValue, band.mid, y));
        return { years: y, low: Math.round(grow(inv.currentValue, band.low, y)), mid, high: Math.round(grow(inv.currentValue, band.high, y)), real: deflate(mid, y) };
      }),
      note: `${band.label}: múltbeli éves hozam ${band.basis}. A szám a hosszú távú átlaggal, a sáv a jobb időszakkal számol. A múltbeli hozam nem garancia, rövid távon nagy esés is lehet.`,
    };
  }
  const monthly = inv.monthlyIncome ?? 0;
  if (monthly > 0 && inv.optionId !== 'inv-crypto') {
    return {
      kind: 'income',
      points: PROJECTION_YEARS.map((y) => { const v = Math.round(inv.currentValue + monthly * 12 * y); return { years: y, low: v, mid: v, high: v, real: deflate(v, y) }; }),
      note: 'A befektetett érték és a havi hozam összesen, ha a havi hozam változatlan marad.',
    };
  }
  return { kind: 'none', points: [], note: inv.optionId === 'inv-crypto' ? 'A kriptoeszközök árfolyamára nincs megbízható hosszú távú átlag: nem jelezhető előre.' : 'Ennél a befektetésnél nincs megalapozott hosszú távú előrejelzés.' };
}
