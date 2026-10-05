// ============================================================================
// PENZUGYI SORSFORDITO - T-90 Pre-Game Processor
// Játék indítása előtt 90 napot feldolgoz:
// - Gazdasági adatok gyűjtése + trendek számítása
// - Hírek gyűjtése + Sorsfordító pool generálása
// - Induló értékek kalibrálása valós adatból
// ============================================================================

import type { PreGameContext } from './types';
import type { EconomicData, NewsItem } from '@/types/data-sources';
import { mnbAdapter } from './mnb-adapter';
import { rentAdapter } from './rent-adapter';
import { betAdapter } from './bet-adapter';
import { newsAdapter } from './news-adapter';
import { MOCK_ECONOMIC_DATA_2026_Q1, MOCK_NEWS_EVENTS } from '@/data/mock-economic-data';
import { LIVE_ECONOMIC_DATA, livePreGameContext } from '@/data/live';

const T_DAYS = 90; // 90 napos előfeldolgozás

/**
 * Trend meghatározása az adatsorból
 * Az utolsó érték és az átlag összehasonlítása
 */
function determineTrend(
  values: number[]
): 'rising' | 'falling' | 'stable' {
  if (values.length < 2) return 'stable';

  const recentHalf = values.slice(Math.floor(values.length / 2));
  const olderHalf = values.slice(0, Math.floor(values.length / 2));

  const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
  const olderAvg = olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length;

  const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (changePercent > 2) return 'rising';
  if (changePercent < -2) return 'falling';
  return 'stable';
}

/**
 * Sorsfordító események generálása hírekből
 *
 * Egyszerű rule-based rendszer a pilothoz.
 * Később LLM-mel (Claude API) cseréljük le, ami
 * sokkal jobb kontextuális eseményeket generál.
 */
function generateFateEventsFromNews(
  news: NewsItem[]
): PreGameContext['fateEventPool'] {
  const pool: PreGameContext['fateEventPool'] = [];

  for (const item of news) {
    // Kategória alapú szabályok
    let event: PreGameContext['fateEventPool'][0] | null = null;

    switch (item.category) {
      case 'interest_rates':
        event = {
          sourceNewsTitle: item.title,
          sourceUrl: item.url,
          publishedAt: item.publishedAt,
          generatedEvent: {
            title: 'Kamatdöntés',
            description: `Az MNB kamatot módosított. ${item.summary}`,
            type: item.title.toLowerCase().includes('emel') ? 'negative' : 'positive',
            effects: [{
              target: 'balance',
              amount: item.title.toLowerCase().includes('emel') ? -15_000 : 10_000,
            }],
          },
        };
        break;

      case 'inflation':
        event = {
          sourceNewsTitle: item.title,
          sourceUrl: item.url,
          publishedAt: item.publishedAt,
          generatedEvent: {
            title: 'Inflációs hír',
            description: `${item.summary} Ez érinti a havi kiadásaidat.`,
            type: 'negative',
            effects: [{
              target: 'food',
              amount: 5_000, // Élelmiszer kiadás nő
            }],
          },
        };
        break;

      case 'wages':
        event = {
          sourceNewsTitle: item.title,
          sourceUrl: item.url,
          publishedAt: item.publishedAt,
          generatedEvent: {
            title: 'Munkaerőpiaci hír',
            description: item.summary,
            type: item.title.toLowerCase().includes('emelked') ? 'positive' : 'negative',
            effects: [{
              target: 'salary',
              amount: item.title.toLowerCase().includes('emelked') ? 20_000 : -10_000,
            }],
          },
        };
        break;

      case 'real_estate':
        event = {
          sourceNewsTitle: item.title,
          sourceUrl: item.url,
          publishedAt: item.publishedAt,
          generatedEvent: {
            title: 'Ingatlanpiaci hír',
            description: `${item.summary} Ez hatással van az albérleti piacra.`,
            type: item.title.toLowerCase().includes('drág') ? 'negative' : 'positive',
            effects: [{
              target: 'housing',
              amount: item.title.toLowerCase().includes('drág') ? 15_000 : -10_000,
            }],
          },
        };
        break;

      case 'stock_market':
        event = {
          sourceNewsTitle: item.title,
          sourceUrl: item.url,
          publishedAt: item.publishedAt,
          generatedEvent: {
            title: 'Tőzsdei hír',
            description: item.summary,
            type: item.title.toLowerCase().includes('esett') ? 'decision' : 'positive',
            effects: [{
              target: 'balance',
              amount: 0, // A befektetés értékét külön kezeljük
            }],
          },
        };
        break;

      case 'consumer':
        event = {
          sourceNewsTitle: item.title,
          sourceUrl: item.url,
          publishedAt: item.publishedAt,
          generatedEvent: {
            title: 'Fogyasztói árak',
            description: item.summary,
            type: 'negative',
            effects: [{
              target: item.title.toLowerCase().includes('gáz') ||
                      item.title.toLowerCase().includes('rezsi')
                ? 'utilities' : 'food',
              amount: 8_000,
            }],
          },
        };
        break;

      default:
        // Általános gazdasági hír → döntéses esemény
        event = {
          sourceNewsTitle: item.title,
          sourceUrl: item.url,
          publishedAt: item.publishedAt,
          generatedEvent: {
            title: 'Gazdasági hír',
            description: item.summary,
            type: 'decision',
            effects: [],
          },
        };
    }

    if (event) {
      pool.push(event);
    }
  }

  return pool;
}

/**
 * Összesített headline generálása az elmúlt 90 napról
 */
function generateHeadline(context: {
  inflationTrend: string;
  interestRateTrend: string;
  rentTrend: string;
  stockMarketTrend: string;
  inflation: number;
  buxChange: number;
}): string {
  const parts: string[] = [];

  const trendHu = (t: string) =>
    t === 'rising' ? 'emelkedő' : t === 'falling' ? 'csökkenő' : 'stabil';

  parts.push(`infláció ${trendHu(context.inflationTrend)} (${context.inflation}%)`);

  if (context.stockMarketTrend === 'rising') {
    parts.push(`BUX erősödött (+${context.buxChange.toFixed(1)}%)`);
  } else if (context.stockMarketTrend === 'falling') {
    parts.push(`BUX gyengült (${context.buxChange.toFixed(1)}%)`);
  } else {
    parts.push(`BUX stagnált`);
  }

  if (context.rentTrend === 'rising') {
    parts.push('albérletek drágultak');
  }

  return `Az elmúlt 90 napban: ${parts.join(', ')}.`;
}

// =====================================================
// FŐ FÜGGVÉNY: T-90 előfeldolgozás
// =====================================================

/**
 * Teljes T-90 előfeldolgozás
 *
 * Ezt a játék indítása előtt hívjuk meg.
 * Ha online: valós adatokból dolgozik.
 * Ha offline: mock adatokból.
 *
 * @param useLiveData - true: valós scraping/API, false: mock adatok
 */
export async function processPreGameContext(
  useLiveData: boolean = false
): Promise<PreGameContext> {

  if (!useLiveData) {
    // === OFFLINE MÓD: mock adatokból ===
    return createMockPreGameContext();
  }

  // === ONLINE MÓD: valós adatok ===
  console.log('[PreGame] T-90 előfeldolgozás indítása...');

  // 1. Párhuzamos adatgyűjtés
  const [mnbData, rentData, betData, newsData] = await Promise.allSettled([
    mnbAdapter.fetchLatest(),
    rentAdapter.fetchLatest(),
    betAdapter.fetchHistory!(T_DAYS),
    newsAdapter.fetchLatest(),
  ]);

  // 2. Adatok kinyerése (fallback ha valamelyik nem sikerült)
  const mnb = mnbData.status === 'fulfilled'
    ? mnbData.value
    : mnbAdapter.getFallbackData();

  const rent = rentData.status === 'fulfilled'
    ? rentData.value
    : rentAdapter.getFallbackData();

  const betHistory = betData.status === 'fulfilled'
    ? betData.value
    : [betAdapter.getFallbackData()];

  const news = newsData.status === 'fulfilled'
    ? newsData.value
    : MOCK_NEWS_EVENTS;

  // 3. Trendek számítása
  const buxValues = betHistory.map((d) => d.buxIndex);
  const stockTrend = determineTrend(buxValues);

  const latestBet = betHistory[betHistory.length - 1] || betAdapter.getFallbackData();

  // 4. Sorsfordító pool generálása
  const fatePool = generateFateEventsFromNews(news);

  // 5. Kontextus összeállítása
  const context: PreGameContext = {
    economicSummary: {
      inflationTrend: 'stable', // KSH havi adatból kellene, de az ritkán változik
      interestRateTrend: 'stable',
      rentTrend: 'rising', // Budapest: szinte mindig emelkedő
      stockMarketTrend: stockTrend,
      headline: generateHeadline({
        inflationTrend: 'stable',
        interestRateTrend: 'stable',
        rentTrend: 'rising',
        stockMarketTrend: stockTrend,
        inflation: LIVE_ECONOMIC_DATA.ksh.annualInflation,
        buxChange: latestBet.buxYearlyChange,
      }),
    },
    fateEventPool: fatePool,
    currentData: {
      inflation: LIVE_ECONOMIC_DATA.ksh.annualInflation,
      baseRate: mnb.baseRate,
      avgRentBudapest: rent.budapestRentAvg,
      avgRentRural: rent.ruralRentAvg,
      pmapYield: LIVE_ECONOMIC_DATA.akk.pmapYield,
      buxIndex: latestBet.buxIndex,
      avgNetWage: LIVE_ECONOMIC_DATA.ksh.netAverageWage,
    },
    generatedAt: new Date().toISOString(),
  };

  console.log('[PreGame] T-90 feldolgozás kész:', context.economicSummary.headline);
  console.log(`[PreGame] ${fatePool.length} Sorsfordító esemény generálva hírből`);

  return context;
}

/**
 * Mock T-90 kontextus (offline fejlesztéshez)
 */
function createMockPreGameContext(): PreGameContext {
  return livePreGameContext();
}
