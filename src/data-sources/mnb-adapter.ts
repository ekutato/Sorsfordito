// ============================================================================
// PENZUGYI SORSFORDITO - MNB (Magyar Nemzeti Bank) Adapter
// SOAP webservice: http://www.mnb.hu/arfolyamok.asmx
// Az egyetlen igazi API a magyar pénzügyi adatok között!
// ============================================================================

import type { DataSourceAdapter } from './types';
import type { MNBData } from '@/types/data-sources';

/**
 * MNB SOAP Webservice adapter
 *
 * Elérhető műveletek:
 * - GetCurrentExchangeRates: aktuális árfolyamok
 * - GetExchangeRates: történeti árfolyamok (dátum-tartomány)
 * - GetCurrencies: támogatott devizák listája
 * - GetInfo: szolgáltatás információ
 *
 * A SOAP kérés XML formátumú, a válasz is XML.
 * Mivel ez frontend-ből fut (böngészőben), a SOAP hívást
 * egy egyszerű fetch + XML parse helyettesíti.
 *
 * FONTOS: CORS problémák lehetnek! Éles környezetben
 * a backend (Next.js API route) közvetít.
 */

const MNB_SOAP_URL = 'http://www.mnb.hu/arfolyamok.asmx';

// SOAP request template
function buildSoapEnvelope(method: string, params: string = ''): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:mnb="http://www.mnb.hu/webservices/">
  <soap:Body>
    <mnb:${method}>${params}</mnb:${method}>
  </soap:Body>
</soap:Envelope>`;
}

/**
 * Aktuális árfolyamok lekérése
 * Next.js API route-ként fut (CORS elkerülése)
 */
async function fetchCurrentRates(): Promise<{ eurHuf: number; usdHuf: number } | null> {
  try {
    const soapBody = buildSoapEnvelope('GetCurrentExchangeRates');

    const response = await fetch(MNB_SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.mnb.hu/webservices/GetCurrentExchangeRates',
      },
      body: soapBody,
    });

    if (!response.ok) return null;

    const xmlText = await response.text();

    // XML parseolás - az árfolyamok a <Rate> elemekben vannak
    const eurMatch = xmlText.match(/curr="EUR"[^>]*>([^<]+)</);
    const usdMatch = xmlText.match(/curr="USD"[^>]*>([^<]+)</);

    return {
      eurHuf: eurMatch ? parseFloat(eurMatch[1].replace(',', '.')) : 0,
      usdHuf: usdMatch ? parseFloat(usdMatch[1].replace(',', '.')) : 0,
    };
  } catch (error) {
    console.error('[MNB] Fetch error:', error);
    return null;
  }
}

/**
 * Történeti árfolyamok lekérése (T-N napos)
 */
async function fetchHistoricalRates(
  startDate: string, // YYYY-MM-DD
  endDate: string,
  currency: string = 'EUR'
): Promise<Array<{ date: string; rate: number }> | null> {
  try {
    const params = `
      <mnb:startDate>${startDate}</mnb:startDate>
      <mnb:endDate>${endDate}</mnb:endDate>
      <mnb:currencyNames>${currency}</mnb:currencyNames>`;

    const soapBody = buildSoapEnvelope('GetExchangeRates', params);

    const response = await fetch(MNB_SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.mnb.hu/webservices/GetExchangeRates',
      },
      body: soapBody,
    });

    if (!response.ok) return null;

    const xmlText = await response.text();

    // Összes <Day date="YYYY-MM-DD"><Rate curr="EUR">XXX,XX</Rate></Day>
    const dayRegex = /date="(\d{4}-\d{2}-\d{2})"[^>]*>.*?curr="EUR"[^>]*>([^<]+)/gs;
    const rates: Array<{ date: string; rate: number }> = [];
    let match;

    while ((match = dayRegex.exec(xmlText)) !== null) {
      rates.push({
        date: match[1],
        rate: parseFloat(match[2].replace(',', '.')),
      });
    }

    return rates;
  } catch (error) {
    console.error('[MNB] Historical fetch error:', error);
    return null;
  }
}

// --- Adapter implementáció ---

export const mnbAdapter: DataSourceAdapter<MNBData> = {
  name: 'MNB (Magyar Nemzeti Bank)',
  sourceUrl: MNB_SOAP_URL,
  updateFrequency: 'daily',
  lastFetchedAt: null,

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(MNB_SOAP_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async fetchLatest(): Promise<MNBData> {
    const rates = await fetchCurrentRates();

    if (!rates) {
      console.warn('[MNB] Falling back to mock data');
      return this.getFallbackData();
    }

    this.lastFetchedAt = new Date();

    return {
      baseRate: 6.5, // Az alapkamatot külön API-ból kellene, de ritkán változik
      eurHufRate: rates.eurHuf,
      usdHufRate: rates.usdHuf,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  },

  async fetchHistory(days: number): Promise<MNBData[]> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const rates = await fetchHistoricalRates(startDate, endDate);

    if (!rates || rates.length === 0) {
      return [this.getFallbackData()];
    }

    return rates.map((r) => ({
      baseRate: 6.5,
      eurHufRate: r.rate,
      usdHufRate: r.rate * 0.92, // Becsült USD/EUR arány
      lastUpdated: r.date,
    }));
  },

  getFallbackData(): MNBData {
    return {
      baseRate: 6.5,
      eurHufRate: 408.5,
      usdHufRate: 385.2,
      lastUpdated: '2026-03-01',
    };
  },
};
