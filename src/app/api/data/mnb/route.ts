// ============================================================================
// API Route: /api/data/mnb
// MNB árfolyam lekérdezés (SOAP proxy)
// A kliens nem tud közvetlenül SOAP-ot hívni → szerveren proxy-zzuk
// ============================================================================

import { NextResponse } from 'next/server';

const MNB_WSDL = 'https://www.mnb.hu/arfolyamok.asmx';

function buildSoapEnvelope(method: string, params: string = ''): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:mnb="http://www.mnb.hu/webservices/">
  <soap:Body>
    <mnb:${method}>${params}</mnb:${method}>
  </soap:Body>
</soap:Envelope>`;
}

function extractResultFromSoap(xml: string, method: string): string {
  const resultTag = `${method}Result`;
  const regex = new RegExp(`<${resultTag}>([\\s\\S]*?)</${resultTag}>`, 'i');
  const match = xml.match(regex);
  if (!match) return '';
  // CDATA kicsomagolás
  return match[1]
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .trim();
}

function parseRatesXml(xml: string): Record<string, number> {
  const rates: Record<string, number> = {};
  const rateRegex = /<Rate[^>]*curr="([^"]+)"[^>]*>([^<]+)<\/Rate>/gi;
  let match;
  while ((match = rateRegex.exec(xml)) !== null) {
    const currency = match[1];
    const value = parseFloat(match[2].replace(',', '.'));
    if (!isNaN(value)) {
      rates[currency] = value;
    }
  }
  return rates;
}

export const dynamic = 'force-static';

export async function GET() {
  const action = 'current';

  try {
    if (action === 'current') {
      // Aktuális árfolyamok
      const envelope = buildSoapEnvelope('GetCurrentExchangeRates');
      const response = await fetch(MNB_WSDL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.mnb.hu/webservices/GetCurrentExchangeRates',
        },
        body: envelope,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`MNB API responded with ${response.status}`);
      }

      const soapXml = await response.text();
      const resultXml = extractResultFromSoap(soapXml, 'GetCurrentExchangeRates');
      const rates = parseRatesXml(resultXml);

      return NextResponse.json({
        success: true,
        data: {
          rates,
          eurHuf: rates['EUR'] ?? null,
          usdHuf: rates['USD'] ?? null,
          chfHuf: rates['CHF'] ?? null,
          fetchedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[API /data/mnb] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'MNB API error',
        fallback: true,
      },
      { status: 502 }
    );
  }
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
