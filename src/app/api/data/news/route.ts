// ============================================================================
// API Route: /api/data/news
// Magyar gazdasági hírek RSS proxy
// A kliensből nem biztos, hogy elérhető az RSS feed (CORS) → szerveren proxyzom
// ============================================================================

import { NextResponse } from 'next/server';

interface RssFeed {
  name: string;
  url: string;
  categories: string[];
}

const RSS_FEEDS: RssFeed[] = [
  {
    name: 'Portfolio.hu',
    url: 'https://www.portfolio.hu/rss/all.xml',
    categories: ['stock_market', 'real_estate', 'banking', 'general_economy'],
  },
  {
    name: '24.hu Gazdaság',
    url: 'https://24.hu/fn/gazdasag/feed/',
    categories: ['wages', 'consumer', 'tax_policy', 'general_economy'],
  },
  {
    name: 'Index.hu Gazdaság',
    url: 'https://index.hu/gazdasag/rss',
    categories: ['general_economy', 'consumer', 'real_estate'],
  },
];

const KEYWORD_CATEGORIES: Array<{ keywords: string[]; category: string }> = [
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

function categorizeNews(title: string, summary: string): string {
  const text = (title + ' ' + summary).toLowerCase();
  for (const { keywords, category } of KEYWORD_CATEGORIES) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return 'general_economy';
}

function extractTag(xml: string, tag: string): string {
  // CDATA
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  // Normal
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  summary: string;
}

function parseRssXml(xmlText: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
    const itemXml = itemMatch[1];

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const description = extractTag(itemXml, 'description');

    if (!title || !link) continue;

    const publishedAt = pubDate
      ? new Date(pubDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const cleanSummary = (description || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .trim()
      .slice(0, 200);

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

export const dynamic = 'force-static';

export async function GET() {
  const maxItems = 50;
  const categoryFilter: string | null = null;

  try {
    // Párhuzamos RSS lekérés
    const results = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'PenzugyiSorsfordito/1.0 (educational-game)',
            'Accept': 'application/rss+xml, application/xml, text/xml',
          },
          signal: AbortSignal.timeout(10000),
          next: { revalidate: 3600 }, // Next.js cache: 1 óra
        });

        if (!response.ok) return [];

        const xmlText = await response.text();
        return parseRssXml(xmlText, feed.name);
      })
    );

    const allItems: NewsItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    }

    // Szűrés
    let filtered = allItems;
    if (categoryFilter) {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Rendezés: legfrissebb elöl
    filtered.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Max limit
    const result = filtered.slice(0, maxItems);

    return NextResponse.json({
      success: true,
      data: {
        items: result,
        totalCount: result.length,
        sources: RSS_FEEDS.map((f) => f.name),
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API /data/news] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'News fetch error',
        fallback: true,
      },
      { status: 502 }
    );
  }
}
