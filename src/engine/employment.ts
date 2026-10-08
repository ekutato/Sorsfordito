// Van-e munkáltatója a játékosnak (cafeteria, prémium, munkahelyi lapok csak ekkor jönnek).
// Közelítés: a nettó bér legalább a nettó minimálbér fele (részmunkaidős munkaviszony is ide tartozik);
// az ösztöndíj és a diákszövetkezeti munka ez alatt marad.
// A szakképzési munkaszerződés (duális képzés) munkaviszony (NAV 1131-es jogviszonykód), a bértől függetlenül:
// a tanulónak az egyéb juttatás (cafeteria, étkezés) arányosan jár, ha az azonos munkakörű dolgozók kapják
// (KEMKIK: Főbb tudnivalók a szakképzési munkaszerződésről, 2026.05.14.).
// A nettó minimálbér a heti csomag bruttó minimálbéréből: − 18,5% TB-járulék − 15% SZJA (2026).
import { LIVE_ECONOMIC_DATA } from '@/data/live';

export function netMinimumWage(): number {
  return Math.round(LIVE_ECONOMIC_DATA.ksh.minimumWage * (1 - 0.185 - 0.15));
}

/** Szakképzési munkaszerződést jelentő döntések */
export const APPRENTICE_CHOICES = ['fs-d01-b'];

export function isEmployed(salary: number, chosen?: string[]): boolean {
  return salary >= netMinimumWage() / 2 || (chosen ?? []).some((id) => APPRENTICE_CHOICES.includes(id));
}

/** Szakképzési munkabér 2026: bruttó 100 000-168 000 Ft, SZJA- és szochomentes, csak 18,5% TB-járulék */
export const APPRENTICE_GROSS = 100_000;
export const apprenticeNet = (gross = APPRENTICE_GROSS) => Math.round(gross * (1 - 0.185));
