// Helyzethez kötött kártyák: a kártya csak akkor jön, ha a története igaz a játékosra
// (pl. hitelkiváltás csak bankhitellel, autós lap csak autóval, SZJA-visszatérítés csak SZJA-fizetőnek).
// A kártyák saját `requires` mezőjével összefésülve szűr (engine/situation.ts: meets).
// Forrás: a 2026-10-09-i logikai átvizsgálás (sors-, mező- és döntéskártyák).
import { MOVE_OUT_CHOICES, type Requires } from '@/engine/situation';

const CAR: Requires = { ownsCar: true };
const AT_OWN_HOME: Requires = { livesWithParents: false };
const OWN_HOME: Requires = { ownsHome: true };

export const SITUATION_REQUIRES: Record<string, Requires> = {
  // --- Hitel ---
  'fate-know-04': { hasBankDebt: true },        // hitelkiváltás / átütemezés
  'gen-debt-management': { hasBankDebt: true },

  // --- Befektetés, vállalkozás ---
  'fate-inh-02': { hasInvestment: ['inv-onkentes-penztar'], paysSzja: true },  // pénztári adójóváírás
  'fate-inh-07': { hasInvestment: ['inv-pmap', 'inv-map-plus', 'inv-bond-ladder'] },
  'fate-know-09': { hasInvestment: ['inv-tbsz-etf', 'inv-stock-hu', 'inv-dividend-stock'] },
  'fate-gen-20': { hasInvestment: ['inv-bank-deposit'] },  // nyereménybetét-sorsolás
  'fate-gen-22': { hasBusiness: true },        // korábbi online kurzus bevétele
  'fate-know-08': { hasBusiness: true },       // EU-s számlázás
  'fate-know-02': { presets: ['career_start'] }, // weboldal-javítás (fejlesztő)
  'gen-invest-review': { hasPortfolio: true },
  'hiv-atalanyado': { hasBusiness: true },

  // --- Autó ---
  'fate-gen-02': CAR, 'fate-gen-18': CAR, 'fate-gen-13': CAR, 'fate-gen-27': CAR, 'fate-know-12': CAR,
  'fate-inh-03': CAR, 'fate-inh-12': CAR, 'fate-inh-05': CAR, 'fate-inh-09b': CAR, 'fate-dani-02b': CAR,
  'tal-szomszed-auto': { ownsCar: false },

  // --- Család ---
  'fate-gen-21': { hasChild: true },           // családi adókedvezmény
  'hiv-elso-hazasok': { hasPartner: true },

  // --- SZJA (25 év alatt és tanulói bérnél nincs) ---
  'fate-gen-07': { paysSzja: true },
  'fate-know-06': { employed: true, paysSzja: true },
  'hiv-szja-tervezet': { paysSzja: true },
  'hiv-szja-reszlet': { paysSzja: true },
  'hiv-penztari-jovairas': { paysSzja: true },
  'hiv-egy-szazalek': { paysSzja: true },

  // --- Munkahely (munkaviszony, nem diákmunka) ---
  'fate-know-07': { employed: true },
  'fate-dani-07': { employed: true }, 'fate-dani-11': { employed: true }, 'fate-dani-09': { employed: true, minMonths: 5 },
  'fate-inh-04': { employed: true }, 'fate-inh-11': { employed: true },
  'fate-gen-03': { employed: true, minSalary: 200_000 }, 'fate-gen-05': { employed: true, minSalary: 200_000 },
  'fate-know-11': { employed: true },          // lakásvásárlás
  'kis-kave': { employed: true },
  'fel-csapatsport': { employed: true },
  // Szakképzési munkaszerződésnél rendkívüli munkaidő nem rendelhető el (KEMKIK, 2026.05.14.)
  'fel-projekthajra': { employed: true, student: false },
  'gen-career-review': { employed: true, minMonths: 2 },
  'gen-life-milestone': { employed: true },
  'fs-ext-05': { employed: true },
  'gen-insurance-review': { employed: true },   // meglévő biztosítások
  'gen-education-upgrade': { employed: true },  // a képzés után béremelés

  // --- Lakhatás ---
  // Háztartási gép, vízvezeték, villany: a saját lakás gondja. Otthon a szülők, albérletben és kollégiumban
  // jellemzően a bérbeadó (illetve a kollégium) javíttatja a lakás tartozékait.
  'fate-gen-12': OWN_HOME, 'fate-gen-14': OWN_HOME, 'fate-gen-24': OWN_HOME, 'fate-gen-28': OWN_HOME,
  'fel-csalad': AT_OWN_HOME,
  'fate-fs-07': AT_OWN_HOME,                   // étkezési szokások: rendelés, kávézó, saját főzés                   // "Régen voltál otthon"
  'hiv-lakcim': { chose: MOVE_OUT_CHOICES },   // "Elköltöztél"
  'tal-lakotars': { sharesFlat: false },
  'fs-ext-03': { livesWithParents: true },     // "Elég volt a szülőknél?"

  // --- Diák / biztosított ---
  'hiv-diakmunka': { student: true },
  'hiv-eu-jarulek': { employed: false, student: false },

  // --- Időzítés ---
  'fate-dani-01': { maxMonths: 3 },            // első fizetés
  'fate-fs-01': { maxMonths: 4 },              // érettségi alkalmából
  'fate-fs-03': { minMonths: 4 },              // kiemelkedő félév

  // --- Korábbi ág ---
  'dani-ext-04': { chose: ['dani-d06-c', 'dani-ext-03-c'] },  // a mellékvállalkozásod bevétele nőtt
  'inh-ext-02': { notChose: ['inh-d03-a'] },   // a telek már eladva
  'fs-ext-02': { notChose: ['fs-ext-01-a', 'fs-ext-01-c'] },  // mesterképzés / külföld alatt nem
};

/** A kártya saját feltétele és a helyzet-feltétel együtt */
export function withSituationRequires(id: string, own?: Requires): Requires | undefined {
  const extra = SITUATION_REQUIRES[id];
  return extra ? { ...own, ...extra } : own;
}
