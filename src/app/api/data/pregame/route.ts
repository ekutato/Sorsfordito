// ============================================================================
// API Route: /api/data/pregame
// T-90 Pre-game Context Processor
// Összegyűjti az elmúlt 90 nap gazdasági adatait és generálja a játék kontextust
// ============================================================================

import { NextResponse } from 'next/server';

/**
 * T-90 Pre-game Context
 * Az összes adatforrásból összegyűjtött kontextus a játék indulásához
 */
interface PreGameResponse {
  economicSummary: {
    inflationTrend: 'rising' | 'falling' | 'stable';
    interestRateTrend: 'rising' | 'falling' | 'stable';
    rentTrend: 'rising' | 'falling' | 'stable';
    stockMarketTrend: 'rising' | 'falling' | 'stable';
    headline: string;
  };
  currentData: {
    inflation: number;
    baseRate: number;
    avgRentBudapest: number;
    avgRentRural: number;
    pmapYield: number;
    buxIndex: number;
    avgNetWage: number;
  };
  newsEvents: Array<{
    title: string;
    category: string;
    publishedAt: string;
    source: string;
  }>;
  generatedAt: string;
}

export const dynamic = 'force-static';

export async function GET() {
  // Static export: mock adatokkal térünk vissza
  return NextResponse.json({
    success: true,
    data: createMockPreGameContext(),
  });
}

/**
 * Mock pre-game context – ha nincs internet vagy hiba van
 * 2026 Q1 magyar gazdasági adatok alapján
 */
function createMockPreGameContext(): PreGameResponse {
  return {
    economicSummary: {
      inflationTrend: 'stable',
      interestRateTrend: 'falling',
      rentTrend: 'rising',
      stockMarketTrend: 'rising',
      headline: 'A magyar tőzsde erősödik: a BUX index 72 500 pontnál áll, ami 5,2%-os emelkedés az elmúlt 3 hónapban. Az euró árfolyama 405 Ft körül mozog. Egy budapesti átlagos albérlet havi 220 000 Ft. Az MNB alapkamat 6,5%, az infláció ~3,8%.',
    },
    currentData: {
      inflation: 3.8,
      baseRate: 6.5,
      avgRentBudapest: 220_000,
      avgRentRural: 140_000,
      pmapYield: 6.75,
      buxIndex: 72_500,
      avgNetWage: 380_000,
    },
    newsEvents: [
      { title: 'Az MNB fenntartotta az alapkamatot 6.5%-on', category: 'interest_rates', publishedAt: '2026-03-10', source: 'Portfolio.hu' },
      { title: 'Tovább drágulnak a budapesti albérletek', category: 'real_estate', publishedAt: '2026-03-08', source: '24.hu' },
      { title: 'A BUX index új csúcsot döntött', category: 'stock_market', publishedAt: '2026-03-05', source: 'Index.hu' },
      { title: 'Emelkedik az élelmiszerek ára a boltokban', category: 'consumer', publishedAt: '2026-03-03', source: '24.hu' },
      { title: 'A PMÁP továbbra is a legnépszerűbb befektetés', category: 'interest_rates', publishedAt: '2026-03-01', source: 'Portfolio.hu' },
    ],
    generatedAt: new Date().toISOString(),
  };
}
