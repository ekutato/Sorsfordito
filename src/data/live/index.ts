// ============================================================================
// PENZUGYI SORSFORDITO - Heti élő adatcsomag
// Egyetlen igazságforrás a játék gazdasági alapértékeihez.
// A heti rutin a heti.json-t frissíti (forrással, verified jelzéssel),
// a build ebből készít statikus adatot.
// ============================================================================

import type { EconomicData, NewsItem } from '@/types/data-sources';
import type { PreGameContext } from '@/data-sources/types';
import heti from './heti.json';

type Trend = 'rising' | 'falling' | 'stable';

export interface LiveValue {
  value: number;
  unit: string;
  asOf: string;
  verified: boolean;
  source: string;
  url: string;
}

export interface LiveDataPack {
  het: string;
  frissitve: string;
  ertekek: Record<string, LiveValue>;
  trendek: {
    inflationTrend: Trend;
    interestRateTrend: Trend;
    rentTrend: Trend;
    stockMarketTrend: Trend;
  };
  hirek: Array<Omit<NewsItem, 'id' | 'summary'> & {
    /** A heti rutin által megírt, ember által jóváhagyott játékhatás */
    jatekEsemeny?: PreGameContext['fateEventPool'][number]['generatedEvent'];
  }>;
}

export const LIVE_DATA = heti as unknown as LiveDataPack;

function v(key: string): number {
  const entry = LIVE_DATA.ertekek[key];
  if (!entry) throw new Error(`Hiányzó élő adat: ${key}`);
  return entry.value;
}

/** A nem megerősített (verified=false) értékek listája - a játékvezetőnek jelezzük */
export function unverifiedKeys(): string[] {
  return Object.entries(LIVE_DATA.ertekek)
    .filter(([, e]) => !e.verified)
    .map(([k]) => k);
}

export const LIVE_ECONOMIC_DATA: EconomicData = {
  lastUpdated: LIVE_DATA.frissitve,
  mnb: {
    baseRate: v('mnb.baseRate'),
    eurHufRate: v('mnb.eurHufRate'),
    usdHufRate: v('mnb.usdHufRate'),
    lastUpdated: LIVE_DATA.ertekek['mnb.eurHufRate'].asOf,
  },
  ksh: {
    annualInflation: v('ksh.annualInflation'),
    monthlyInflation: v('ksh.monthlyInflation'),
    grossAverageWage: v('ksh.grossAverageWage'),
    netAverageWage: v('ksh.netAverageWage'),
    netMedianWage: v('ksh.netMedianWage'),
    minimumWage: v('ksh.minimumWage'),
    guaranteedMinimumWage: v('ksh.guaranteedMinimumWage'),
    unemploymentRate: v('ksh.unemploymentRate'),
    lastUpdated: LIVE_DATA.ertekek['ksh.annualInflation'].asOf,
  },
  akk: {
    pmapYield: v('akk.pmapYield'),
    mapPlusYield: v('akk.mapPlusYield'),
    dkjYield: v('akk.dkjYield'),
    oneYearBondYield: v('akk.oneYearBondYield'),
    fiveYearBondYield: v('akk.fiveYearBondYield'),
    lastUpdated: LIVE_DATA.frissitve,
  },
  realEstate: {
    budapestRentAvg: v('realEstate.budapestRentAvg'),
    budapestRent2Room: v('realEstate.budapestRent2Room'),
    ruralRentAvg: v('realEstate.ruralRentAvg'),
    budapestSqmPrice: v('realEstate.budapestSqmPrice'),
    ruralSqmPrice: v('realEstate.ruralSqmPrice'),
    lastUpdated: LIVE_DATA.ertekek['realEstate.budapestRentAvg'].asOf,
  },
  stockMarket: {
    buxIndex: v('stockMarket.buxIndex'),
    buxDailyChange: v('stockMarket.buxDailyChange'),
    buxYearlyChange: v('stockMarket.buxYearlyChange'),
    lastUpdated: LIVE_DATA.ertekek['stockMarket.buxIndex'].asOf,
  },
};

export const LIVE_NEWS: NewsItem[] = LIVE_DATA.hirek.map(({ jatekEsemeny: _e, ...h }, i) => ({
  ...h,
  id: `live-${LIVE_DATA.het}-${i + 1}`,
  summary: h.title,
}));

/** Hírből generált Sorsfordító-pool - csak a jóváhagyott játékhatással rendelkező hírekből */
export function liveFateEventPool(): PreGameContext['fateEventPool'] {
  return LIVE_DATA.hirek
    .filter((h) => h.jatekEsemeny)
    .map((h) => ({
      sourceNewsTitle: h.title,
      sourceUrl: h.url,
      publishedAt: h.publishedAt,
      generatedEvent: h.jatekEsemeny!,
    }));
}

/** A teljes játékkezdő kontextus a heti élő adatcsomagból */
export function livePreGameContext(): PreGameContext {
  return {
    economicSummary: liveEconomicSummary(),
    fateEventPool: liveFateEventPool(),
    currentData: liveCurrentData(),
    generatedAt: LIVE_DATA.frissitve,
  };
}

const fmtInt = (n: number) => Math.round(n).toLocaleString('hu-HU');
const fmtDec = (n: number) => n.toLocaleString('hu-HU', { maximumFractionDigits: 2 });

export function liveHeadline(): string {
  const d = LIVE_ECONOMIC_DATA;
  return (
    `Az MNB alapkamata ${fmtDec(d.mnb.baseRate)}%, az éves infláció ${fmtDec(d.ksh.annualInflation)}%. ` +
    `Az euró ${fmtDec(d.mnb.eurHufRate)} Ft, a BUX ${fmtInt(d.stockMarket.buxIndex)} pont. ` +
    `A nettó átlagkereset ${fmtInt(d.ksh.netAverageWage)} Ft, egy budapesti albérlet átlagosan ${fmtInt(d.realEstate.budapestRentAvg)} Ft/hó.`
  );
}

export function liveCurrentData(): PreGameContext['currentData'] {
  const d = LIVE_ECONOMIC_DATA;
  return {
    inflation: d.ksh.annualInflation,
    baseRate: d.mnb.baseRate,
    avgRentBudapest: d.realEstate.budapestRentAvg,
    avgRentRural: d.realEstate.ruralRentAvg,
    pmapYield: d.akk.pmapYield,
    buxIndex: d.stockMarket.buxIndex,
    avgNetWage: d.ksh.netAverageWage,
  };
}

export function liveEconomicSummary(): PreGameContext['economicSummary'] {
  return { ...LIVE_DATA.trendek, headline: liveHeadline() };
}
