// ============================================================================
// PENZUGYI SORSFORDITO - News RSS Adapter
// Magyar gazdasági hírek gyűjtése RSS feedekből
//
// Források:
// - Portfolio.hu RSS
// - MNB hírek
// - 24.hu/fn/gazdasag
// - Index.hu/gazdasag
// ============================================================================

import type { DataSourceAdapter } from './types';
import type { NewsItem, NewsCategory } from '@/types/data-sources';
import { MOCK_NEWS_EVENTS } from '@/data/mock-economic-data';

/**
 * RSS feed-ek listája
 * Ezek a magyar gazdasági hírportálok nyilvános RSS feedjei
 */
const RSS_FEEDS = [
  {
    name: 'Portfolio.hu',
    url: 'https://www.portfolio.hu/rss/all.xml',
    categories: ['stock_market', 'real_estate', 'banking', 'general_economy'] as NewsCategory[],
  },
  {
    name: '24.hu Gazdaság',
    url: 'https://24.hu/fn/gazdasag/feed/',
    categories: ['wages', 'consumer', 'tax_policy', 'general_economy'] as NewsCategory[],
  },
  {
    name: 'Index.hu Gazdaság',
    url: 'https://index.hu/gazdasag/rss',
    categories: ['general_economy', 'consumer', 'real_estate'] as NewsCategory[],
  },
];

/**
 * Gazdasági kulcsszavak → kategória mapping
 * Ezzel kategorizáljuk a híreket automatikusan
 */
const KEYWORD_CATEGORIES: Array<{ keywords: string[]; category: NewsCategory }> = [
  { keywords: ['kamat', 'mnb', 'jegybank', 'alapkamat', 'monetáris'], category: 'interest_rates' },
  { keywords: ['infláció', 'drágul', 'áremelkedés', 'fogyasztói ár'], category: 'inflation' },
  { keywords: ['bér', 'fizetés', 'foglalkoztatás', 'munkanélküli', 'minimálbér'], category: 'wages' },
  { keywords: ['ingatlan', 'lakás', 'albérlet', 'bérleti díj', 'lakáspiac'], category: 'real_estate' },
  { keywords: ['tőzsde', 'bux', 'részvény', 'otp', 'mol', 'richter'], category: 'stock_market' },
  { keywords: ['bitcoin', 'kripto', 'ethereum', 'blokklánc'], category: 'crypto' },
  { keywords: ['adó', 'szja', 'áfa', 'nav', 'adóbevallás', 'kata'], category: 'tax_policy' },
  { keywords: ['bank', 'hitel', 'betét', 'csok', 'babaváró', 'diákhitel'], category: 'banking' },
  { keywords: ['rezsi', 'gáz', 'áram', 'energia', 'élelmiszer', 'üzemanyag'], category: 'consumer' },
];

/**
 * Hír kategorizálása kulcsszavak alapján
 */
function categorizeNews(title: string, summary: string): NewsCategory {
  const text = (title + ' ' + summary).toLowerCase();

  for (const { keywords, category } of KEYWORD_CATEGORIES) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }

  return 'general_economy';
}

/**
 * RSS XML parseolása
 *
 * Egy tipikus RSS item:
 * <item>
 *   <title>Cím</title>
 *   <link>URL</link>
 *   <pubDate>Mon, 01 Mar 2026 08:00:00 +0100</pubDate>
 *   <description>Leírás</description>
 * </item>
 */
function parseRssXml(xmlText: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Egyszerű regex-alapú RSS parser (DOMParser nélkül, szerveren is fut)
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
    const itemXml = itemMatch[1];

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const description = extractTag(itemXml, 'description');

    if (!title || !link) continue;

    // Dátum parseolása
    const publishedAt = pubDate
      ? new Date(pubDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Összefoglaló: HTML tag-ek eltávolítása
    const cleanSummary = (description || '')
      .replace(/<[^>]+>/g, '')    // HTML tagek
      .replace(/&[^;]+;/g, ' ')   // HTML entities
      .trim()
      .slice(0, 200);             // Max 200 karakter

    const category = categorizeNews(title, cleanSummary);

    items.push({
      id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title.slice(0, 150),
      source: sourceName,
      url: link,
      publishedAt,
      category,
      summary: cleanSummary || title,
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  // CDATA kezelés
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Sima tag
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Gazdasági relevanciájú hírek szűrése
 * Nem minden hír releváns a játékhoz
 */
function filterRelevantNews(items: NewsItem[]): NewsItem[] {
  return items.filter((item) => {
    // Csak gazdasági kategóriák
    return item.category !== 'general_economy' ||
      KEYWORD_CATEGORIES.some(({ keywords }) =>
        keywords.some((kw) => item.title.toLowerCase().includes(kw))
      );
  });
}

// --- Adapter implementáció ---

export const newsAdapter: DataSourceAdapter<NewsItem[]> = {
  name: 'Magyar gazdasági hírek (RSS)',
  sourceUrl: 'https://www.portfolio.hu/rss/all.xml',
  updateFrequency: 'daily',
  lastFetchedAt: null,

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(RSS_FEEDS[0].url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async fetchLatest(): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    // Párhuzamos RSS lekérés minden forrásból
    const results = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        try {
          const response = await fetch(feed.url, {
            headers: {
              'User-Agent': 'PenzugyiSorsfordito/1.0 (educational-game)',
              'Accept': 'application/rss+xml, application/xml, text/xml',
            },
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) return [];

          const xmlText = await response.text();
          return parseRssXml(xmlText, feed.name);
        } catch (error) {
          console.warn(`[News] RSS fetch error (${feed.name}):`, error);
          return [];
        }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    }

    // Szűrés: csak releváns + frissítés időbélyeg
    const relevant = filterRelevantNews(allItems);

    // Rendezés: legfrissebb elöl
    relevant.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Max 50 hír (a T-90 poolhoz elég)
    const result = relevant.slice(0, 50);

    this.lastFetchedAt = new Date();
    console.log(`[News] ${result.length} releváns gazdasági hír gyűjtve ${RSS_FEEDS.length} forrásból`);

    return result;
  },

  getFallbackData(): NewsItem[] {
    return MOCK_NEWS_EVENTS;
  },
};
