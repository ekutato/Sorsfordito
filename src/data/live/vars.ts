// ============================================================================
// Élő adatok a játékszövegekben: {{változó}} → a heti csomag aktuális értéke.
// Egyetlen helyen definiált, minden nézet (döntés, sorskártya, tudás, befektetés,
// szótár, mezőkártya, epilógus) ezt használja - így nem maradhat elavult szám.
// ============================================================================
import { LIVE_DATA } from './index';

const fmtDec = (n: number) => n.toLocaleString('hu-HU', { maximumFractionDigits: 2 });
const fmtInt = (n: number) => Math.round(n).toLocaleString('hu-HU');

function val(key: string): number | undefined {
  return LIVE_DATA.ertekek[key]?.value;
}

type VarDef = { key?: string; compute?: () => number | undefined; fmt: 'dec' | 'int'; label: string };

/** A szövegekben használható változók: név → melyik heti értékből és hogyan formázva */
export const LIVE_VAR_DEFS: Record<string, VarDef> = {
  eur_huf: { key: 'mnb.eurHufRate', fmt: 'dec', label: 'EUR/HUF árfolyam' },
  usd_huf: { key: 'mnb.usdHufRate', fmt: 'dec', label: 'USD/HUF árfolyam' },
  chf_huf: { key: 'mnb.chfHufRate', fmt: 'dec', label: 'CHF/HUF árfolyam' },
  base_rate: { key: 'mnb.baseRate', fmt: 'dec', label: 'MNB alapkamat' },
  inflation: { key: 'ksh.annualInflation', fmt: 'dec', label: 'Éves infláció' },
  prev_year_inflation: { key: 'ksh.prevYearAvgInflation', fmt: 'dec', label: 'Előző évi átlagos infláció' },
  pmap_yield: { key: 'akk.pmapYield', fmt: 'dec', label: 'PMÁP kamata' },
  map_plus_yield: { key: 'akk.mapPlusYield', fmt: 'dec', label: 'MÁP Plusz kamata' },
  dkj_yield: { key: 'akk.dkjYield', fmt: 'dec', label: 'DKJ hozama' },
  min_wage: { key: 'ksh.minimumWage', fmt: 'int', label: 'Minimálbér (bruttó)' },
  guaranteed_min_wage: { key: 'ksh.guaranteedMinimumWage', fmt: 'int', label: 'Garantált bérminimum (bruttó)' },
  avg_wage: { key: 'ksh.netAverageWage', fmt: 'int', label: 'Nettó átlagkereset' },
  rent_bp: { key: 'realEstate.budapestRentAvg', fmt: 'int', label: 'Budapesti átlagos albérleti díj' },
  rent_bp_2room: { key: 'realEstate.budapestRent2Room', fmt: 'int', label: 'Budapesti kétszobás albérlet' },
  rent_rural: { key: 'realEstate.ruralRentAvg', fmt: 'int', label: 'Vidéki albérleti díj' },
  sqm_bp: { key: 'realEstate.budapestSqmPrice', fmt: 'int', label: 'Budapesti lakás m²-ára' },
  sqm_rural: { key: 'realEstate.ruralSqmPrice', fmt: 'int', label: 'Vidéki lakás m²-ára' },
  bux_index: { key: 'stockMarket.buxIndex', fmt: 'int', label: 'BUX index' },
  bux_yearly: { key: 'stockMarket.buxYearlyChange', fmt: 'dec', label: 'BUX éves változása' },
  gold_usd: { key: 'metals.goldUsdOz', fmt: 'int', label: 'Arany (USD/uncia)' },
  gold_huf_g: {
    compute: () => { const g = val('metals.goldUsdOz'), u = val('mnb.usdHufRate'); return g && u ? (g * u) / 31.1035 : undefined; },
    fmt: 'int', label: 'Arany (Ft/gramm)',
  },
  silver_usd: { key: 'metals.silverUsdOz', fmt: 'dec', label: 'Ezüst (USD/uncia)' },
  deposit_rate: { key: 'bank.depositRate', fmt: 'dec', label: 'Átlagos lakossági betéti kamat' },
  personal_loan_thm: { key: 'bank.personalLoanThm', fmt: 'dec', label: 'Személyi kölcsön átlagos THM-je' },
  car_loan_thm: { key: 'bank.carLoanThm', fmt: 'dec', label: 'Autóhitel átlagos THM-je' },
  mortgage_thm: { key: 'bank.mortgageThm', fmt: 'dec', label: 'Lakáshitel átlagos THM-je' },
  dh1_rate: { key: 'diakhitel.dh1Rate', fmt: 'dec', label: 'Diákhitel1 kamata' },
  btc_huf: { key: 'crypto.btcHuf', fmt: 'int', label: 'Bitcoin (Ft)' },
  eth_huf: { key: 'crypto.ethHuf', fmt: 'int', label: 'Ether (Ft)' },
  oba_huf: { compute: () => { const e = val('mnb.eurHufRate'); return e ? Math.round(e * 100_000 / 1000) * 1000 : undefined; }, fmt: 'int', label: 'OBA-határ (100 000 EUR) forintban' },
};

/** Egy változó formázott értéke, vagy undefined, ha nincs adat */
export function liveVar(name: string): string | undefined {
  const d = LIVE_VAR_DEFS[name];
  if (!d) return undefined;
  const n = d.compute ? d.compute() : d.key ? val(d.key) : undefined;
  if (n === undefined || Number.isNaN(n)) return undefined;
  return d.fmt === 'int' ? fmtInt(n) : fmtDec(n);
}

/** Melyik heti kulcsot használja egy változó (a "Hol használja a játék" listához) */
export function liveKeysOfVar(name: string): string[] {
  const d = LIVE_VAR_DEFS[name];
  if (!d) return [];
  if (d.key) return [d.key];
  if (name === 'gold_huf_g') return ['metals.goldUsdOz', 'mnb.usdHufRate'];
  if (name === 'oba_huf') return ['mnb.eurHufRate'];
  return [];
}

const VAR_RE = /\{\{(\w+)\}\}/g;

/**
 * {{változó}} → élő érték. Az `extra` (pl. a játékos saját adatai) elsőbbséget élvez.
 * Ismeretlen vagy hiányzó változónál "n. a." kerül a szövegbe (soha nem marad {{…}}).
 */
export function fillLiveVars(text: string, extra?: (name: string) => string | undefined): string {
  if (!text || !text.includes('{{')) return text;
  return text.replace(VAR_RE, (_m, name: string) => extra?.(name) ?? liveVar(name) ?? 'n. a.');
}

/** A szövegben szereplő változónevek */
export function varsIn(text: string): string[] {
  return Array.from(text.matchAll(VAR_RE), (m) => m[1]);
}

// --- Élő feltételek: ugyanarra a körre több sorskártya, a valós helyzet dönt ---

export type LiveCondition = 'forint_gyengul' | 'forint_erosodik' | 'inflacio_emelkedik' | 'inflacio_csokken';

function rising(key: string): boolean | undefined {
  const e = LIVE_DATA.ertekek[key];
  if (!e?.elozo) return undefined;
  return e.value > e.elozo.value;
}

/** Igaz-e most a feltétel. Előző heti érték hiányában a trendek és a hosszabb távú adatok döntenek. */
export function liveConditionHolds(c: LiveCondition): boolean {
  switch (c) {
    case 'forint_gyengul': return rising('mnb.eurHufRate') ?? false;
    case 'forint_erosodik': return !(rising('mnb.eurHufRate') ?? false);
    case 'inflacio_emelkedik': return rising('ksh.annualInflation') ?? LIVE_DATA.trendek.inflationTrend === 'rising';
    case 'inflacio_csokken': return !(rising('ksh.annualInflation') ?? LIVE_DATA.trendek.inflationTrend === 'rising');
  }
}

/** Egy objektum összes szövegmezőjében kicseréli a {{változókat}} (az azonosítókat nem érinti) */
export function fillDeep<T>(obj: T, extra?: (name: string) => string | undefined): T {
  if (typeof obj === 'string') return fillLiveVars(obj, extra) as unknown as T;
  if (Array.isArray(obj)) return obj.map((x) => fillDeep(x, extra)) as unknown as T;
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = k === 'id' || k.endsWith('Id') || k === 'target' || k === 'url' ? v : fillDeep(v, extra);
    }
    return out as T;
  }
  return obj;
}
