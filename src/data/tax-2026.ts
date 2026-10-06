// 2026-os bérszámfejtési kulcsok (CLAUDE.md 4. szabály). A 25 év alattiak kedvezményének
// felső határa évente változik (az előző év júliusi bruttó átlagkeresete).
// Forrás: bank360.hu (2026: havi max. 715 765 Ft adóalap-kedvezmény), adozona.hu.

export const SZJA_RATE = 0.15;
export const TB_RATE = 0.185;
/** 25 év alattiak SZJA-mentességének havi felső határa 2026-ban (bruttó, Ft) */
export const YOUTH_EXEMPTION_LIMIT_2026 = 715_765;
export const YOUTH_EXEMPTION_SOURCE = 'https://bank360.hu/blog/szja-mentesseg-szamos-kedvezmeny-valhat-ertelmetlenne-25-ev-alatt';

/** Nettó bér a bruttóból: 25 év alatt a határig nincs SZJA */
export function netFromGross(gross: number, under25: boolean, limit = YOUTH_EXEMPTION_LIMIT_2026): number {
  const taxable = under25 ? Math.max(0, gross - limit) : gross;
  return gross - gross * TB_RATE - taxable * SZJA_RATE;
}

/** Bruttó bér a nettóból (a fenti képlet megfordítása, szakaszonként lineáris) */
export function grossFromNet(net: number, under25: boolean, limit = YOUTH_EXEMPTION_LIMIT_2026): number {
  if (!under25) return net / (1 - TB_RATE - SZJA_RATE);
  const netAtLimit = limit * (1 - TB_RATE);
  if (net <= netAtLimit) return net / (1 - TB_RATE);
  // a határ fölötti részre már SZJA is jár
  return limit + (net - netAtLimit) / (1 - TB_RATE - SZJA_RATE);
}

/** A 25. születésnap után a nettó: ugyanaz a bruttó, de már teljes SZJA-val */
export function netAfterTurning25(netUnder25: number, limit = YOUTH_EXEMPTION_LIMIT_2026): number {
  return Math.round(netFromGross(grossFromNet(netUnder25, true, limit), false, limit));
}

/**
 * Melyik körben kezd SZJA-t fizetni a 25. születésnapja után (vagy undefined, ha a játék alatt nem).
 * age: az indulási kor; nextBirthdayInMonths: hány hónap múlva van a következő születésnap (1-12).
 * A kedvezmény utoljára a születésnap hónapjában jár, a következő hónaptól van SZJA.
 */
export function round25(age: number, nextBirthdayInMonths: number, monthsPerRound: number, totalRounds: number): number | undefined {
  if (age >= 25) return undefined;
  const birthdayOffset = nextBirthdayInMonths + (25 - age - 1) * 12;
  const r = Math.floor((birthdayOffset + 1) / monthsPerRound) + 1;
  return r <= totalRounds ? r : undefined;
}

/** A születésnap naptári hónapja (1-12) a játék kezdő dátumából */
export function birthdayMonth(startDate: string, nextBirthdayInMonths: number): number {
  const [, m] = startDate.split('-').map(Number);
  return ((m - 1 + nextBirthdayInMonths) % 12) + 1;
}
