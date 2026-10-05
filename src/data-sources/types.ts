// ============================================================================
// PENZUGYI SORSFORDITO - Data Source Adapter Interface
// Minden adatforrás ezt az interfészt implementálja
// ============================================================================

/**
 * Egy adatforrás adapter interfésze
 * Minden forrás (MNB, KSH, albérlet, BÉT, hír) ezt valósítja meg
 */
export interface DataSourceAdapter<T> {
  /** Adapter neve (debug/logging) */
  name: string;

  /** Forras URL */
  sourceUrl: string;

  /** Milyen gyakran erdemes frissiteni */
  updateFrequency: 'realtime' | 'daily' | 'weekly' | 'monthly';

  /** Elerheto-e a forras (gyors health check) */
  isAvailable(): Promise<boolean>;

  /** Friss adatok lekerese */
  fetchLatest(): Promise<T>;

  /** T-N napos tortenet lekerese (ha tamogatja a forras) */
  fetchHistory?(days: number): Promise<T[]>;

  /** Utolso sikeres lekeres idopontja */
  lastFetchedAt: Date | null;

  /** Fallback: mock adat, ha a forras nem elerheto */
  getFallbackData(): T;
}

/**
 * A T-90 előfeldolgozó kimenete
 * A játék indulásakor ez áll rendelkezésre (90 nap gazdasági adat)
 */
export interface PreGameContext {
  /** Gazdasági összefoglaló az elmúlt 90 napról */
  economicSummary: {
    inflationTrend: 'rising' | 'falling' | 'stable';
    interestRateTrend: 'rising' | 'falling' | 'stable';
    rentTrend: 'rising' | 'falling' | 'stable';
    stockMarketTrend: 'rising' | 'falling' | 'stable';
    headline: string; // "Az elmúlt hónapban: infláció stabil (3.8%), BUX erősödött (+2.1%)"
  };

  /** Előre generált Sorsfordító pool az elmúlt 30 nap híreiből */
  fateEventPool: Array<{
    sourceNewsTitle: string;
    sourceUrl: string;
    publishedAt: string;
    generatedEvent: {
      title: string;
      description: string;
      type: 'positive' | 'negative' | 'decision';
      effects: Array<{ target: string; amount: number }>;
    };
  }>;

  /** Aktuális gazdasági adatok (a játék induló értékei) */
  currentData: {
    inflation: number;
    baseRate: number;
    avgRentBudapest: number;
    avgRentRural: number;
    pmapYield: number;
    buxIndex: number;
    avgNetWage: number;
  };

  /** Mikor készült ez az előfeldolgozás */
  generatedAt: string;
}

/**
 * Cache wrapper - tarolja az adatot es a frissites idopontjat
 */
export interface CachedData<T> {
  data: T;
  fetchedAt: Date;
  expiresAt: Date;
  source: string;
}

/**
 * Cache lejárati idők forrástípusonként
 */
export const CACHE_TTL = {
  mnb: 24 * 60 * 60 * 1000,         // 24 óra (napi frissítés)
  ksh: 7 * 24 * 60 * 60 * 1000,     // 1 hét (havi adatok)
  akk: 7 * 24 * 60 * 60 * 1000,     // 1 hét
  rent: 30 * 24 * 60 * 60 * 1000,   // 1 hónap (lassan változik)
  bet: 24 * 60 * 60 * 1000,         // 24 óra
  news: 4 * 60 * 60 * 1000,         // 4 óra (friss hírek)
} as const;
