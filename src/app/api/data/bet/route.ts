// ============================================================================
// API Route: /api/data/bet
// BÉT (Budapesti Értéktőzsde) BUX index adatok
// Forrás: Stooq.com (elsődleges, megbízható CSV) + BÉT fallback
// ============================================================================

import { NextResponse } from 'next/server';

interface BuxDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Stooq.com CSV parser (elsődleges forrás)
 * A BÉT saját oldala HTML-alapú, a Stooq CSV-t ad
 */
async function fetchBuxFromStooq(days: number): Promise<BuxDataPoint[]> {
  // Stooq CSV formátum: Date,Open,High,Low,Close,Volume
  // ^bux = BUX index ticker a Stooq-on (%5E = URL-encoded ^)
  const url = `https://stooq.com/q/d/l/?s=%5Ebux&d1=${getDateStr(days)}&d2=${getDateStr(0)}&i=d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PenzugyiSorsfordito/1.0 (educational-game)',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Stooq responded with ${response.status}`);
  }

  const csvText = await response.text();
  const lines = csvText.trim().split('\n');

  // Skip header
  if (lines.length < 2) return [];

  const dataPoints: BuxDataPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) continue;

    const close = parseFloat(parts[4]);
    // NaN ellenőrzés — ha a CSV sor rossz, kihagyjuk
    if (isNaN(close)) continue;

    dataPoints.push({
      date: parts[0],
      open: parseFloat(parts[1]),
      high: parseFloat(parts[2]),
      low: parseFloat(parts[3]),
      close,
      volume: parts[5] ? parseFloat(parts[5]) : undefined,
    });
  }

  return dataPoints;
}

/**
 * BÉT saját CSV próbálkozás (fallback)
 * A BÉT adatletöltő oldala: https://www.bet.hu/oldalak/adatletoltes
 */
async function fetchBuxFromBet(): Promise<BuxDataPoint[]> {
  // BÉT CSV: pontosvesszővel tagolt, magyar számformátum
  const url = 'https://www.bet.hu/oldalak/adatletoltes';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PenzugyiSorsfordito/1.0 (educational-game)',
        'Accept': 'text/csv, text/plain, */*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const text = await response.text();

    // BÉT CSV: "Dátum";"Nyitó";"Maximum";"Minimum";"Záró";"Forgalom"
    // Számok: "73 123,45" (szóközzel tagolt ezresek, tizedesvessző)
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const dataPoints: BuxDataPoint[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(';').map((s) => s.replace(/"/g, '').trim());
      if (parts.length < 5) continue;

      const parseHunNum = (s: string): number => {
        return parseFloat(s.replace(/\s/g, '').replace(',', '.'));
      };

      dataPoints.push({
        date: parts[0],
        open: parseHunNum(parts[1]),
        high: parseHunNum(parts[2]),
        low: parseHunNum(parts[3]),
        close: parseHunNum(parts[4]),
        volume: parts[5] ? parseHunNum(parts[5]) : undefined,
      });
    }

    return dataPoints;
  } catch {
    return [];
  }
}

function calculateChange(data: BuxDataPoint[]): {
  currentValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  yearlyChange: number;
  yearlyChangePercent: number;
} {
  if (data.length === 0) {
    return { currentValue: 0, dailyChange: 0, dailyChangePercent: 0, yearlyChange: 0, yearlyChangePercent: 0 };
  }

  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : latest;
  const oldest = data[0];

  const dailyChange = latest.close - previous.close;
  const dailyChangePercent = previous.close > 0 ? (dailyChange / previous.close) * 100 : 0;
  const yearlyChange = latest.close - oldest.close;
  const yearlyChangePercent = oldest.close > 0 ? (yearlyChange / oldest.close) * 100 : 0;

  return {
    currentValue: latest.close,
    dailyChange: Math.round(dailyChange * 100) / 100,
    dailyChangePercent: Math.round(dailyChangePercent * 100) / 100,
    yearlyChange: Math.round(yearlyChange * 100) / 100,
    yearlyChangePercent: Math.round(yearlyChangePercent * 100) / 100,
  };
}

export const dynamic = 'force-static';

export async function GET() {
  const days = 90;

  try {
    // Stooq az elsődleges (megbízható CSV), BÉT csak fallback (HTML oldal, nem mindig ad CSV-t)
    let data = await fetchBuxFromStooq(days);
    let source = 'stooq.com';

    if (data.length === 0) {
      data = await fetchBuxFromBet();
      source = 'bet.hu';
    }

    if (data.length === 0) {
      // Egyik forrás sem adott adatot
      return NextResponse.json(
        { success: false, error: 'No BUX data available from any source', fallback: true },
        { status: 502 }
      );
    }

    const change = calculateChange(data);

    return NextResponse.json({
      success: true,
      data: {
        source,
        buxIndex: change.currentValue,
        dailyChange: change.dailyChange,
        dailyChangePercent: change.dailyChangePercent,
        yearlyChange: change.yearlyChange,
        yearlyChangePercent: change.yearlyChangePercent,
        history: data.slice(-days),
        dataPoints: data.length,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API /data/bet] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'BÉT data fetch error',
        fallback: true,
      },
      { status: 502 }
    );
  }
}

function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
