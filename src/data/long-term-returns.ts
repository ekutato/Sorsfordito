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
export const RETURN_BANDS: Record<string, ReturnBand> = {};

/** Melyik befektetés melyik csoport sávját használja */
export const BAND_OF: Record<string, string> = {
  'inv-tbsz-etf': 'globalEquity',
  'inv-stock-hu': 'bux',
  'inv-dividend-stock': 'bux',
  'inv-gold': 'gold',
};
