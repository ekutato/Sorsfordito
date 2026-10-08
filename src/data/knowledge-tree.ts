// Egymásra épülő tudás: szintek és előfeltételek, valamint hogy egy tudás a játékban ténylegesen mit ad.
// Szint 1 = alapok (költségvetés, megtakarítás, infláció, adó, digitális biztonság, munkajog),
// szint 2 = pénzügyi eszközök (hitel, állampapír/TBSZ, nyugdíj, biztosítás, lakás),
// szint 3 = haladó (befektetési pszichológia, kripto, vállalkozás, ingatlanbefektetés).
import { KNOWLEDGE_CARDS } from './knowledge-cards';
import { INVESTMENT_OPTIONS } from './investment-options';
import { ALL_FIELD_CARDS } from './field-cards';
import type { DistrictId } from './board';

export const KNOWLEDGE_TREE: Record<string, { level: 1 | 2 | 3; requires?: string[] }> = {
  'know-savings': { level: 1 },
  'know-inflation': { level: 1 },
  'know-digital': { level: 1 },
  'know-labor': { level: 1 },
  'know-tax': { level: 1 },
  'know-inheritance-law': { level: 1 },
  'know-debt': { level: 2, requires: ['know-savings'] },
  'know-tbsz': { level: 2, requires: ['know-inflation'] },
  'know-pension': { level: 2, requires: ['know-tax'] },
  'know-insurance': { level: 2, requires: ['know-savings'] },
  'know-freelance': { level: 2, requires: ['know-tax'] },
  'know-car-finance': { level: 2, requires: ['know-debt'] },
  'know-csok': { level: 2, requires: ['know-debt'] },
  'know-apartment-buying': { level: 2, requires: ['know-debt'] },
  'know-housing': { level: 2, requires: ['know-debt'] },
  'know-eu-travel': { level: 2, requires: ['know-labor'] },
  'know-invest-psychology': { level: 3, requires: ['know-tbsz'] },
  'know-crypto': { level: 3, requires: ['know-tbsz', 'know-digital'] },
  'know-business': { level: 3, requires: ['know-freelance'] },
  'know-eu-funds': { level: 3, requires: ['know-business'] },
  'know-real-estate': { level: 3, requires: ['know-apartment-buying'] },
  'know-insurance-advanced': { level: 3, requires: ['know-insurance'] },
};

export const LEVEL_LABEL = { 1: 'Alap', 2: 'Eszközök', 3: 'Haladó' } as const;

export const levelOf = (id: string) => KNOWLEDGE_TREE[id]?.level ?? 1;
export const requiresOf = (id: string) => KNOWLEDGE_TREE[id]?.requires ?? [];
export const prerequisitesMet = (id: string, owned: string[]) => requiresOf(id).every((r) => owned.includes(r));

/** A döntés témája → a hozzá illő tudás (a heti kínálat ehhez igazodik) */
export const CATEGORY_KNOWLEDGE: Record<string, string[]> = {
  'Adósságkezelés': ['know-debt'],
  'Finanszírozás': ['know-debt', 'know-car-finance'],
  'Befektetés': ['know-tbsz', 'know-invest-psychology', 'know-crypto'],
  'Ingatlan': ['know-apartment-buying', 'know-real-estate'],
  'Lakhatás': ['know-apartment-buying', 'know-csok', 'know-housing'],
  'Karrier': ['know-labor', 'know-freelance'],
  'Pályaválasztás': ['know-labor', 'know-tax'],
  'Közlekedés': ['know-car-finance'],
  'Megtakarítás': ['know-savings', 'know-inflation'],
  'Pénzkezelés': ['know-savings', 'know-inflation'],
  'Stratégia': ['know-tbsz', 'know-pension'],
  'Vállalkozás': ['know-freelance', 'know-business'],
  'Életmód': ['know-savings', 'know-insurance'],
};

/** A negyed témája → tudás és befektetés */
export const DISTRICT_KNOWLEDGE: Record<DistrictId, string[]> = {
  munkahely: ['know-labor', 'know-tax', 'know-freelance'],
  bankutca: ['know-savings', 'know-debt', 'know-digital'],
  tozsde: ['know-inflation', 'know-tbsz', 'know-invest-psychology'],
  piacter: ['know-savings', 'know-digital', 'know-car-finance'],
  hivatal: ['know-tax', 'know-pension', 'know-csok'],
  'kozossegi-ter': ['know-insurance', 'know-labor', 'know-savings'],
};

export const DISTRICT_INVESTMENTS: Record<DistrictId, string[]> = {
  munkahely: ['inv-professional-cert', 'inv-language', 'inv-freelance-platform'],
  bankutca: ['inv-bank-deposit', 'inv-pmap', 'inv-map-plus', 'inv-bond-ladder'],
  tozsde: ['inv-tbsz-etf', 'inv-dividend-stock', 'inv-forex-eur', 'inv-forex-usd', 'inv-gold'],
  piacter: ['inv-online-biz', 'inv-solar-panel', 'inv-coworking'],
  hivatal: ['inv-onkentes-penztar', 'inv-pmap', 'inv-map-plus'],
  'kozossegi-ter': ['inv-p2p-lending', 'inv-coworking', 'inv-language'],
};

/** Mit ad ténylegesen ez a tudás a játékban (a kártyán ez látszik, nem ígéret) */
export function knowledgeEffects(id: string): string[] {
  const out: string[] = [];
  const unlocks = INVESTMENT_OPTIONS.filter((o) => o.requiredKnowledge === id).map((o) => o.name);
  if (unlocks.length) out.push(`Feloldja: ${unlocks.join(', ')}`);
  const traps = ALL_FIELD_CARDS.filter((c) => c.highlightWithKnowledge === id).length;
  if (traps) out.push(`${traps} csapdalapon kiemeli a vészjeleket, és nem indul a sürgető óra`);
  const next = Object.entries(KNOWLEDGE_TREE).filter(([, v]) => v.requires?.includes(id)).map(([k]) => KNOWLEDGE_CARDS.find((c) => c.id === k)?.name ?? k);
  if (next.length) out.push(`Erre épül: ${next.join(', ')}`);
  return out;
}
