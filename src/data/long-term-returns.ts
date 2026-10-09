// Hosszú távú (múltbeli) éves hozamok az árfolyamos eszközök előrejelzési sávjához.
// Csak ellenőrzött, forrással megadott érték kerülhet ide (CLAUDE.md 1. szabály).
// A sáv: rosszabb / átlag / jobb éves hozam (%), a forrás időszakaiból. A múltbeli hozam nem garancia.

export interface ReturnBand {
  label: string;
  low: number;
  mid: number;
  high: number;
  /** Mire vonatkozik (devizanem, időszak) */
  basis: string;
  source: string;
  url: string;
  asOf: string;
}

/** Eszközcsoport → sáv. Ha egy csoport hiányzik, az eszköznél nincs előrejelzés (nem becsülünk). */
export const RETURN_BANDS: Record<string, ReturnBand> = {
  // MSCI World, euróban, nettó (osztalék újrabefektetve): 2001 óta évi 6,57%, az utolsó 10 évben 12,69% (2026.09.30.)
  globalEquity: {
    label: 'Világ részvénypiaca (MSCI World)', low: 6.57, mid: 6.57, high: 12.69,
    basis: 'euróban, osztalékkal; 2001 óta 6,57%, az utolsó 10 évben 12,69% - a köztes években 2022-ben −12,78% is volt',
    source: 'MSCI World index factsheet (EUR)', url: 'https://www.msci.com/documents/10199/ff545d0e-0088-425b-8bd5-b0a92d02bff5', asOf: '2026-09-30',
  },
  // BUX: összhozamindex (osztalékkal), 1991.01.02. = 1000 pont (BÉT). Záróértékek: 2015 vége 23 920,65; 2025 vége 111 032 (MTI/VG a BÉT adataiból)
  // Saját számítás: 1991-2025 évi 14,4%, 2015-2025 évi 16,6%
  bux: {
    label: 'Budapesti részvények (BUX)', low: 14.4, mid: 14.4, high: 16.6,
    basis: 'forintban, osztalékkal; 1991 óta évi 14,4%, az utolsó 10 évben 16,6% - a 90-es évek magas inflációjával együtt, ezért a jövőben valószínűleg kevesebb',
    source: 'BÉT (BUX összhozamindex, bázis 1991 = 1000) + MTI/VG záróértékek', url: 'https://bet.hu/site/Angol/Contents/Products-and-Services/Indices/BUX', asOf: '2025-12-30',
  },
  // Arany: az amerikai aranystandard 1971-es vége óta évi 8% dollárban (WGC, 2024.12.31-i adatok), hozamot nem fizet
  gold: {
    label: 'Arany', low: 8, mid: 8, high: 8,
    basis: 'dollárban, 1971 óta (World Gold Council); kamatot, osztalékot nem fizet, és évekig is eshet',
    source: 'World Gold Council: Relevance of gold as a strategic asset 2025', url: 'https://www.gold.org/goldhub/research/relevance-of-gold-as-a-strategic-asset-2025/return', asOf: '2024-12-31',
  },
};

/** Melyik befektetés melyik csoport sávját használja */
export const BAND_OF: Record<string, string> = {
  'inv-tbsz-etf': 'globalEquity',
  'inv-stock-hu': 'bux',
  'inv-dividend-stock': 'bux',
  'inv-gold': 'gold',
};
