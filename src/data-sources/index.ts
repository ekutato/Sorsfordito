// ============================================================================
// PENZUGYI SORSFORDITO - Data Sources Index
// Kliens oldali wrapper az API route-ok hívásához
// ============================================================================

import type { PreGameContext } from './types';

/**
 * Pre-game kontextus lekérdezése
 * A játék indulása előtt hívjuk meg – összegyűjti a T-90 gazdasági adatokat
 *
 * @param useLiveData - true: valós adatok az API-ból, false: mock adatok
 */
export async function fetchPreGameContext(useLiveData: boolean): Promise<PreGameContext> {
  try {
    const response = await fetch(`/api/data/pregame?live=${useLiveData}`, {
      signal: AbortSignal.timeout(8000), // 8 sec max — ha ennyi idő alatt nincs válasz, mock-kal megy
    });

    const json = await response.json();

    if (json.success && json.data) {
      return json.data as PreGameContext;
    }

    throw new Error(json.error || 'Unknown error');
  } catch (error) {
    console.warn('[DataSources] Pre-game context fetch failed, using fallback:', error);
    return getFallbackPreGameContext();
  }
}

/**
 * Friss hírek lekérdezése (játék közben)
 */
export async function fetchLatestNews(
  maxItems: number = 20,
  category?: string
): Promise<Array<{
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  summary: string;
}>> {
  try {
    const params = new URLSearchParams({ max: String(maxItems) });
    if (category) params.set('category', category);

    const response = await fetch(`/api/data/news?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    const json = await response.json();
    return json.success ? json.data.items : [];
  } catch {
    return [];
  }
}

/**
 * MNB árfolyamok lekérdezése
 */
export async function fetchExchangeRates(): Promise<{
  eurHuf: number | null;
  usdHuf: number | null;
} | null> {
  try {
    const response = await fetch('/api/data/mnb?action=current', {
      signal: AbortSignal.timeout(10000),
    });

    const json = await response.json();
    if (json.success) {
      return {
        eurHuf: json.data.eurHuf,
        usdHuf: json.data.usdHuf,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * BUX index lekérdezése
 */
export async function fetchBuxData(): Promise<{
  buxIndex: number;
  dailyChangePercent: number;
  yearlyChangePercent: number;
} | null> {
  try {
    const response = await fetch('/api/data/bet?days=90', {
      signal: AbortSignal.timeout(10000),
    });

    const json = await response.json();
    if (json.success) {
      return {
        buxIndex: json.data.buxIndex,
        dailyChangePercent: json.data.dailyChangePercent,
        yearlyChangePercent: json.data.yearlyChangePercent,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Albérlet árak lekérdezése
 */
export async function fetchRentPrices(
  cities: string[] = ['budapest', 'debrecen', 'szeged']
): Promise<Record<string, { median: number; min: number; max: number }> | null> {
  try {
    const response = await fetch(`/api/data/rent?cities=${cities.join(',')}`, {
      signal: AbortSignal.timeout(25000),
    });

    const json = await response.json();
    if (json.success) {
      return json.data.cities;
    }
    return null;
  } catch {
    return null;
  }
}

// --- Fallback ---

function getFallbackPreGameContext(): PreGameContext {
  return {
    economicSummary: {
      inflationTrend: 'stable',
      interestRateTrend: 'falling',
      rentTrend: 'rising',
      stockMarketTrend: 'rising',
      headline: 'Offline mód – Mock gazdasági adatokkal játszol.',
    },
    fateEventPool: [],
    currentData: {
      inflation: 3.8,
      baseRate: 6.5,
      avgRentBudapest: 220_000,
      avgRentRural: 140_000,
      pmapYield: 6.75,
      buxIndex: 72_500,
      avgNetWage: 380_000,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Re-exportok
export type { PreGameContext, DataSourceAdapter, CachedData } from './types';
export { CACHE_TTL } from './types';
