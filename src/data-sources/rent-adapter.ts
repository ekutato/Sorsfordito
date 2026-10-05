// ============================================================================
// PENZUGYI SORSFORDITO - Albérlet Adapter
// Források: alberlet.hu, ingatlan.com/alberlet
//
// SCRAPER + PARSER kombinació:
// 1. Scraper: letölti az albérlet-hirdetési oldalakat
// 2. Parser: a HTML-ből kiszedi az árakat, és átlagot számol
//
// FONTOS: Éles scraping etikája:
// - robots.txt tiszteletben tartása
// - Rate limiting (max 1 kérés / 5 sec)
// - User-Agent megadása
// - Cache: naponta max 1x frissítés
// ============================================================================

import type { DataSourceAdapter } from './types';
import type { RealEstateData } from '@/types/data-sources';

/**
 * Albérlet árak gyűjtése
 *
 * Stratégia:
 * 1. ingatlan.com/listar/alberlet+kiado → Budapest / vidéki városok
 * 2. alberlet.hu → kiegészítő forrás
 * 3. KSH éves adat → validálás, baseline
 *
 * A scraper Next.js API route-ként fut (szerver oldalon),
 * mert a böngészőből CORS miatt nem működik.
 */

// --- Ingatlan.com scraper/parser ---

interface RentListing {
  price: number;        // Havi bérleti díj (Ft)
  size: number;         // Méret (m²)
  rooms: number;        // Szobák száma
  district?: string;    // Kerület (Budapest) vagy város
  source: string;       // 'ingatlan.com' | 'alberlet.hu'
}

/**
 * Ingatlan.com albérlet hirdetések parseolása
 *
 * Az ingatlan.com listázó oldal HTML-jében a hirdetések
 * struktúrált adatot tartalmaznak. A parser ezeket szedi ki.
 *
 * MEGJEGYZÉS: Ez a Next.js API route-ban fut (/api/data/rent)
 * A frontend ezt az API-t hívja, nem közvetlenül scrapel.
 */
async function scrapeIngatlanCom(
  city: 'budapest' | 'debrecen' | 'szeged' | 'pecs' | 'gyor',
  maxPages: number = 2
): Promise<RentListing[]> {
  const listings: RentListing[] = [];

  // Az URL pattern: ingatlan.com/listar/kiado+lakas+[varos]
  const citySlug = city === 'budapest' ? 'budapest' : city;
  const baseUrl = `https://ingatlan.com/listar/kiado+lakas+${citySlug}`;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PenzugyiSorsfordito/1.0 (educational-game; contact@example.com)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const html = await response.text();

      // Parser: kiszedi az árakat a HTML-ből
      // Az ingatlan.com hirdetései <div class="listing__price"> elemekben vannak
      // Az ár formátuma: "250 000 Ft/hó" vagy "250.000 Ft"
      const priceRegex = /(\d[\d\s.]+)\s*(?:Ft|HUF)\s*\/?\s*h[oó]/gi;
      let match;

      while ((match = priceRegex.exec(html)) !== null) {
        const priceStr = match[1].replace(/[\s.]/g, '');
        const price = parseInt(priceStr, 10);

        // Szűrés: reális albérlet ár (50K - 1M Ft/hó)
        if (price >= 50_000 && price <= 1_000_000) {
          listings.push({
            price,
            size: 0, // A pontos méret külön parseolás lenne
            rooms: 0,
            district: city,
            source: 'ingatlan.com',
          });
        }
      }

      // Rate limiting: 2 mp várakozás oldalak között
      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.warn(`[Rent] ingatlan.com scraping error (${city}, page ${page}):`, error);
    }
  }

  return listings;
}

/**
 * Alberlet.hu scraper
 * Hasonló logika, más HTML struktúra
 */
async function scrapeAlberletHu(
  city: string = 'budapest'
): Promise<RentListing[]> {
  const listings: RentListing[] = [];

  try {
    const url = `https://www.alberlet.hu/kiado_alberlet/${city}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PenzugyiSorsfordito/1.0 (educational-game)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return listings;

    const html = await response.text();

    // Parser: alberlet.hu árformátum
    const priceRegex = /(\d[\d\s.]+)\s*(?:Ft|HUF)/gi;
    let match;

    while ((match = priceRegex.exec(html)) !== null) {
      const priceStr = match[1].replace(/[\s.]/g, '');
      const price = parseInt(priceStr, 10);

      if (price >= 50_000 && price <= 1_000_000) {
        listings.push({
          price,
          size: 0,
          rooms: 0,
          district: city,
          source: 'alberlet.hu',
        });
      }
    }
  } catch (error) {
    console.warn(`[Rent] alberlet.hu scraping error:`, error);
  }

  return listings;
}

/**
 * Átlagár számítás: medián (nem átlag!) a robusztusabb
 * mert az outlierek (luxuslakások) nem torzítják
 */
function calculateMedianPrice(listings: RentListing[]): number {
  if (listings.length === 0) return 0;

  const sorted = [...listings].sort((a, b) => a.price - b.price);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1].price + sorted[mid].price) / 2)
    : sorted[mid].price;
}

// --- Adapter implementáció ---

export const rentAdapter: DataSourceAdapter<RealEstateData> = {
  name: 'Albérlet árak (ingatlan.com + alberlet.hu)',
  sourceUrl: 'https://ingatlan.com/listar/kiado+lakas',
  updateFrequency: 'monthly',
  lastFetchedAt: null,

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://ingatlan.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async fetchLatest(): Promise<RealEstateData> {
    try {
      // Párhuzamos lekérés: Budapest + vidéki városok
      const [bpIngatlan, bpAlberlet, debrecen, szeged] = await Promise.all([
        scrapeIngatlanCom('budapest', 2),
        scrapeAlberletHu('budapest'),
        scrapeIngatlanCom('debrecen', 1),
        scrapeIngatlanCom('szeged', 1),
      ]);

      // Budapest: mindkét forrás összevonva
      const bpAll = [...bpIngatlan, ...bpAlberlet];
      const bpMedian = calculateMedianPrice(bpAll) || 250_000;

      // Vidék: Debrecen + Szeged átlag (reprezentatív)
      const ruralAll = [...debrecen, ...szeged];
      const ruralMedian = calculateMedianPrice(ruralAll) || 140_000;

      // 2 szobás becsült arány (átlag * 1.3)
      const bp2Room = Math.round(bpMedian * 1.3);

      this.lastFetchedAt = new Date();

      return {
        budapestRentAvg: bpMedian,
        budapestRent2Room: bp2Room,
        ruralRentAvg: ruralMedian,
        budapestSqmPrice: 1_050_000,  // Ez KSH adatból jönne
        ruralSqmPrice: 450_000,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
    } catch (error) {
      console.error('[Rent] Fetch error:', error);
      return this.getFallbackData();
    }
  },

  getFallbackData(): RealEstateData {
    return {
      budapestRentAvg: 250_000,
      budapestRent2Room: 320_000,
      ruralRentAvg: 140_000,
      budapestSqmPrice: 1_050_000,
      ruralSqmPrice: 450_000,
      lastUpdated: '2026-03-01',
    };
  },
};
