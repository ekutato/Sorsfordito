// ============================================================================
// PENZUGYI SORSFORDITO - Data Sources Index
// Kliens oldali wrapper az API route-ok hívásához
// ============================================================================

import type { PreGameContext } from './types';
import { livePreGameContext } from '@/data/live';

/**
 * Pre-game kontextus lekérdezése
 * A játék indulása előtt hívjuk meg – összegyűjti a T-90 gazdasági adatokat
 *
 * @param useLiveData - true: valós adatok az API-ból, false: mock adatok
 */
export async function fetchPreGameContext(_useLiveData: boolean): Promise<PreGameContext> {
  // Statikus export: a heti élő adatcsomag a buildbe van fordítva (src/data/live/heti.json),
  // így nincs hálózati hívás, és nincs basePath-hiba sem.
  return livePreGameContext();
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
  return livePreGameContext();
}

// Re-exportok
export type { PreGameContext, DataSourceAdapter, CachedData } from './types';
export { CACHE_TTL } from './types';
