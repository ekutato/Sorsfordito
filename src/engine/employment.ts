// Van-e munkáltatója a játékosnak (cafeteria, prémium, munkahelyi lapok csak ekkor jönnek).
// Közelítés: a nettó bér legalább a nettó minimálbér fele (részmunkaidős munkaviszony is ide tartozik);
// az ösztöndíj, a duális képzési juttatás és a diákszövetkezeti munka ez alatt marad.
// A nettó minimálbér a heti csomag bruttó minimálbéréből: − 18,5% TB-járulék − 15% SZJA (2026).
import { LIVE_ECONOMIC_DATA } from '@/data/live';

export function netMinimumWage(): number {
  return Math.round(LIVE_ECONOMIC_DATA.ksh.minimumWage * (1 - 0.185 - 0.15));
}

export function isEmployed(salary: number): boolean {
  return salary >= netMinimumWage() / 2;
}
