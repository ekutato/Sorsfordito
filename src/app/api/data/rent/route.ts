// ============================================================================
// API Route: /api/data/rent
// Magyar albérlet árak lekérdezése
// Források: ingatlan.com, alberlet.hu (szerver oldali scraping)
// ============================================================================

import { NextResponse } from 'next/server';

interface RentListing {
  price: number;
  city: string;
  district?: string;
  rooms: number;
  area: number;
  source: string;
}

/**
 * Ingatlan.com albérlet lista scrapelés
 * Rate limit: 2 sec kérések között
 */
async function scrapeIngatlanCom(city: string): Promise<RentListing[]> {
  const citySlug = city === 'budapest' ? 'budapest' : city.toLowerCase();
  const url = `https://ingatlan.com/listazes/kiado+lakas+${citySlug}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PenzugyiSorsfordito/1.0; educational-game)',
        'Accept': 'text/html',
        'Accept-Language': 'hu-HU,hu;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const html = await response.text();
    const listings: RentListing[] = [];

    // Árak kinyerése a HTML-ből
    // Az ingatlan.com tipikus formátum: "180 000 Ft/hó" vagy "180.000 Ft"
    const priceRegex = /(\d[\d\s.]+)\s*Ft\s*\/?\s*h[oó]/gi;
    let match;
    while ((match = priceRegex.exec(html)) !== null) {
      const priceStr = match[1].replace(/[\s.]/g, '');
      const price = parseInt(priceStr);
      if (price >= 50_000 && price <= 1_000_000) {
        listings.push({
          price,
          city: citySlug,
          rooms: 2, // Alapértelmezett becslés
          area: 50,
          source: 'ingatlan.com',
        });
      }
    }

    return listings;
  } catch {
    return [];
  }
}

/**
 * Alberlet.hu scraping
 */
async function scrapeAlberletHu(city: string): Promise<RentListing[]> {
  const citySlug = city === 'budapest' ? 'budapest' : city.toLowerCase();
  const url = `https://www.alberlet.hu/${citySlug}/`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PenzugyiSorsfordito/1.0; educational-game)',
        'Accept': 'text/html',
        'Accept-Language': 'hu-HU,hu;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const html = await response.text();
    const listings: RentListing[] = [];

    // Alberlet.hu tipikus: "Ft 180 000/hó" vagy "180000 Ft"
    const priceRegex = /(?:Ft\s*)?(\d[\d\s.]+)(?:\s*Ft)?\s*\/?\s*h[oó]/gi;
    let match;
    while ((match = priceRegex.exec(html)) !== null) {
      const priceStr = match[1].replace(/[\s.]/g, '');
      const price = parseInt(priceStr);
      if (price >= 50_000 && price <= 1_000_000) {
        listings.push({
          price,
          city: citySlug,
          rooms: 2,
          area: 50,
          source: 'alberlet.hu',
        });
      }
    }

    return listings;
  } catch {
    return [];
  }
}

/**
 * Medián számítás (nem átlag! – kiszűri az outliereket)
 */
function calculateMedian(prices: number[]): number {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// Fallback adatok, ha a scraping nem megy
const FALLBACK_RENT_DATA = {
  budapest: { median: 220_000, min: 120_000, max: 450_000, sampleSize: 0 },
  debrecen: { median: 140_000, min: 80_000, max: 250_000, sampleSize: 0 },
  szeged: { median: 120_000, min: 70_000, max: 200_000, sampleSize: 0 },
  pecs: { median: 110_000, min: 65_000, max: 180_000, sampleSize: 0 },
  gyor: { median: 150_000, min: 90_000, max: 280_000, sampleSize: 0 },
};

export const dynamic = 'force-static';

export async function GET() {
  const cities = ['budapest', 'debrecen', 'szeged'];

  try {
    const results: Record<string, {
      median: number;
      min: number;
      max: number;
      sampleSize: number;
      sources: string[];
    }> = {};

    // Párhuzamos scraping minden városra
    // Rate limit: 2 sec szünet városonként (szekvenciálisan)
    for (const city of cities) {
      const trimmedCity = city.trim().toLowerCase();

      // Párhuzamosan mindkét forrásból
      const [ingatlanListings, alberletListings] = await Promise.allSettled([
        scrapeIngatlanCom(trimmedCity),
        scrapeAlberletHu(trimmedCity),
      ]);

      const allListings: RentListing[] = [];
      const sources: string[] = [];

      if (ingatlanListings.status === 'fulfilled' && ingatlanListings.value.length > 0) {
        allListings.push(...ingatlanListings.value);
        sources.push('ingatlan.com');
      }
      if (alberletListings.status === 'fulfilled' && alberletListings.value.length > 0) {
        allListings.push(...alberletListings.value);
        sources.push('alberlet.hu');
      }

      if (allListings.length > 0) {
        const prices = allListings.map((l) => l.price);
        results[trimmedCity] = {
          median: calculateMedian(prices),
          min: Math.min(...prices),
          max: Math.max(...prices),
          sampleSize: prices.length,
          sources,
        };
      } else {
        // Fallback
        const fallback = FALLBACK_RENT_DATA[trimmedCity as keyof typeof FALLBACK_RENT_DATA];
        if (fallback) {
          results[trimmedCity] = { ...fallback, sources: ['fallback'] };
        }
      }

      // Rate limit: 2 sec szünet a következő város előtt
      if (cities.indexOf(city) < cities.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        cities: results,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API /data/rent] Error:', error);

    // Fallback adatok visszaadása
    return NextResponse.json({
      success: true,
      data: {
        cities: FALLBACK_RENT_DATA,
        fallback: true,
        fetchedAt: new Date().toISOString(),
      },
    });
  }
}
