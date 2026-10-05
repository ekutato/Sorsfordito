// ============================================================================
// PENZUGYI SORSFORDITO - BÉT (Budapesti Értéktőzsde) Adapter
// Forrás: BÉT adatletöltő oldal (https://www.bet.hu/oldalak/adatletoltes)
//
// A BÉT-nek van saját adatletöltő oldala, ahonnan CSV formátumban
// letölthetők a történeti BUX index és részvényadatok.
// ============================================================================

import type { DataSourceAdapter } from './types';
import type { StockMarketData } from '@/types/data-sources';

/**
 * BÉT Adatletöltő
 *
 * URL: https://www.bet.hu/oldalak/adatletoltes
 * Formátum: CSV
 * Elérhető adatok:
 * - BUX index (napi záró, nyitó, min, max)
 * - Egyedi részvények (OTP, MOL, Richter, stb.)
 * - Forgalmi adatok
 *
 * A CSV parseolás menete:
 * 1. HTTP GET a CSV URL-re
 * 2. CSV szöveg sorokra bontása
 * 3. Fejléc azonosítása (Dátum, Nyitó, Záró, Min, Max, Forgalom)
 * 4. Sorok parseolása számokká
 */

interface BuxDayData {
  date: string;       // YYYY-MM-DD
  open: number;       // Nyitó érték
  close: number;      // Záró érték
  high: number;       // Napi max
  low: number;        // Napi min
  volume: number;     // Forgalom
}

/**
 * CSV parser: BÉT adatletöltő formátuma
 *
 * A CSV tipikusan így néz ki:
 * Dátum;Nyitó;Max;Min;Záró;Forgalom
 * 2026.03.01;78500;78900;78200;78750;12345678
 *
 * FONTOS: a BÉT pontosvesszőt (;) használ elválasztónak, nem vesszőt!
 */
function parseBuxCsv(csvText: string): BuxDayData[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Fejléc átugrása (első sor)
  const dataLines = lines.slice(1);
  const results: BuxDayData[] = [];

  for (const line of dataLines) {
    const cols = line.split(';').map((c) => c.trim());
    if (cols.length < 5) continue;

    // Dátum formátum: "2026.03.01" → "2026-03-01"
    const dateStr = cols[0].replace(/\./g, '-');

    // Számok: magyar formátum (szóköz ezres, vessző tizedes)
    const parseHunNum = (s: string): number => {
      return parseFloat(s.replace(/\s/g, '').replace(',', '.')) || 0;
    };

    results.push({
      date: dateStr,
      open: parseHunNum(cols[1]),
      high: parseHunNum(cols[2]),
      low: parseHunNum(cols[3]),
      close: parseHunNum(cols[4]),
      volume: cols.length > 5 ? parseHunNum(cols[5]) : 0,
    });
  }

  return results;
}

/**
 * BUX index adatok letöltése a BÉT adatletöltő oldaláról
 * A pontos URL-t a BÉT adatletöltő oldalán generálja az API
 */
async function fetchBuxData(
  startDate: string, // YYYY-MM-DD
  endDate: string
): Promise<BuxDayData[]> {
  try {
    // A BÉT adatletöltő API URL-je
    // (A pontos endpoint a BÉT oldalon generálódik - ez egy típusos minta)
    const url = `https://www.bet.hu/oldalak/adatletoltes?` +
      `instrument=BUX` +
      `&startdate=${startDate.replace(/-/g, '.')}` +
      `&enddate=${endDate.replace(/-/g, '.')}` +
      `&format=csv`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PenzugyiSorsfordito/1.0 (educational-game)',
        'Accept': 'text/csv, text/plain',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[BÉT] HTTP ${response.status}`);
      return [];
    }

    const csvText = await response.text();
    return parseBuxCsv(csvText);
  } catch (error) {
    console.error('[BÉT] Fetch error:', error);
    return [];
  }
}

/**
 * Alternatív forrás: Stooq.com (ha a BÉT nem elérhető)
 * A Stooq ingyenesen nyújt BUX adatokat CSV-ben
 */
async function fetchBuxFromStooq(days: number = 90): Promise<BuxDayData[]> {
  try {
    // Stooq BUX adatok
    const url = `https://stooq.com/q/d/l/?s=^bux&i=d`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'PenzugyiSorsfordito/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const csvText = await response.text();
    const lines = csvText.trim().split('\n').slice(1); // Fejléc skip

    return lines.slice(-days).map((line) => {
      const [date, open, high, low, close, volume] = line.split(',');
      return {
        date,
        open: parseFloat(open) || 0,
        high: parseFloat(high) || 0,
        low: parseFloat(low) || 0,
        close: parseFloat(close) || 0,
        volume: parseFloat(volume) || 0,
      };
    }).filter(d => d.close > 0);
  } catch (error) {
    console.warn('[BÉT/Stooq] Fallback fetch error:', error);
    return [];
  }
}

/**
 * Napi és éves változás számítása
 */
function calculateChanges(data: BuxDayData[]): {
  currentValue: number;
  dailyChange: number;
  yearlyChange: number;
} {
  if (data.length === 0) {
    return { currentValue: 78_500, dailyChange: 0, yearlyChange: 0 };
  }

  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : latest;

  // Éves: az adatsor elejéhez képest (vagy 252 kereskedési nap)
  const yearAgoIndex = Math.max(0, data.length - 252);
  const yearAgo = data[yearAgoIndex];

  const dailyChange = previous.close > 0
    ? ((latest.close - previous.close) / previous.close) * 100
    : 0;

  const yearlyChange = yearAgo.close > 0
    ? ((latest.close - yearAgo.close) / yearAgo.close) * 100
    : 0;

  return {
    currentValue: Math.round(latest.close),
    dailyChange: Math.round(dailyChange * 100) / 100,
    yearlyChange: Math.round(yearlyChange * 100) / 100,
  };
}

// --- Adapter implementáció ---

export const betAdapter: DataSourceAdapter<StockMarketData> = {
  name: 'BÉT (Budapesti Értéktőzsde)',
  sourceUrl: 'https://www.bet.hu/oldalak/adatletoltes',
  updateFrequency: 'daily',
  lastFetchedAt: null,

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://www.bet.hu', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async fetchLatest(): Promise<StockMarketData> {
    // Először BÉT-ről próbálunk, ha nem megy → Stooq fallback
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    let buxData = await fetchBuxData(startDate, endDate);

    if (buxData.length === 0) {
      console.log('[BÉT] Primary source failed, trying Stooq...');
      buxData = await fetchBuxFromStooq(30);
    }

    if (buxData.length === 0) {
      console.warn('[BÉT] All sources failed, using fallback');
      return this.getFallbackData();
    }

    const changes = calculateChanges(buxData);
    this.lastFetchedAt = new Date();

    return {
      buxIndex: changes.currentValue,
      buxDailyChange: changes.dailyChange,
      buxYearlyChange: changes.yearlyChange,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  },

  async fetchHistory(days: number): Promise<StockMarketData[]> {
    const buxData = await fetchBuxFromStooq(days);

    if (buxData.length === 0) {
      return [this.getFallbackData()];
    }

    return buxData.map((d, i, arr) => {
      const prevClose = i > 0 ? arr[i - 1].close : d.close;
      return {
        buxIndex: Math.round(d.close),
        buxDailyChange: prevClose > 0
          ? Math.round(((d.close - prevClose) / prevClose) * 10000) / 100
          : 0,
        buxYearlyChange: 0, // Éves változás nem releváns napos adatnál
        lastUpdated: d.date,
      };
    });
  },

  getFallbackData(): StockMarketData {
    return {
      buxIndex: 78_500,
      buxDailyChange: 0.45,
      buxYearlyChange: 12.3,
      lastUpdated: '2026-03-01',
    };
  },
};
