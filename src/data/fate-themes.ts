// A sorskártyák témája (melyik negyedhez illik) és naptárhoz kötött hónapjai.
// A húzás (engine/fate-deck.ts) ebből dönti el, mi jön a lépett negyedben és melyik hónapban.
import type { DistrictId } from './board';

export const FATE_THEME: Record<string, DistrictId> = {
  // Munkahely: bér, munka, képzés, mellékállás
  'fate-fs-03': 'munkahely', 'fate-fs-05': 'munkahely', 'fate-fs-08': 'munkahely', 'fate-fs-09': 'munkahely',
  'fate-dani-01': 'munkahely', 'fate-dani-03': 'munkahely', 'fate-dani-07': 'munkahely', 'fate-dani-09': 'munkahely', 'fate-dani-11': 'munkahely',
  'fate-inh-04': 'munkahely', 'fate-inh-11': 'munkahely',
  'fate-gen-01': 'munkahely', 'fate-gen-03': 'munkahely', 'fate-gen-05': 'munkahely', 'fate-gen-19': 'munkahely', 'fate-gen-22': 'munkahely',
  'fate-know-01': 'munkahely', 'fate-know-02': 'munkahely', 'fate-know-03': 'munkahely', 'fate-know-08': 'munkahely', 'fate-story-side-gig': 'munkahely',
  // Bankutca: számla, megtakarítás, hitel, kamat
  'fate-fs-04': 'bankutca', 'fate-dani-06': 'bankutca', 'fate-dani-10': 'bankutca', 'fate-inh-07': 'bankutca',
  'fate-gen-10': 'bankutca', 'fate-gen-20': 'bankutca', 'fate-know-04': 'bankutca', 'fate-know-05': 'bankutca', 'fate-know-11': 'bankutca',
  // Tőzsde: árfolyam, infláció, befektetés
  'fate-fs-06': 'tozsde', 'fate-fs-06b': 'tozsde', 'fate-dani-02': 'tozsde', 'fate-dani-02b': 'tozsde', 'fate-inh-09': 'tozsde', 'fate-inh-09b': 'tozsde',
  'fate-know-07': 'tozsde', 'fate-know-09': 'tozsde', 'fate-know-10': 'tozsde', 'fate-story-invest-tip': 'tozsde',
  // Piactér: vásárlás, javítás, drágulás, lakbér
  'fate-fs-07': 'piacter', 'fate-fs-10': 'piacter', 'fate-fs-12': 'piacter', 'fate-dani-04': 'piacter', 'fate-dani-08': 'piacter', 'fate-dani-12': 'piacter',
  'fate-inh-03': 'piacter', 'fate-inh-05': 'piacter', 'fate-inh-08': 'piacter', 'fate-inh-12': 'piacter',
  'fate-gen-02': 'piacter', 'fate-gen-04': 'piacter', 'fate-gen-09': 'piacter', 'fate-gen-11': 'piacter', 'fate-gen-12': 'piacter', 'fate-gen-14': 'piacter',
  'fate-gen-16': 'piacter', 'fate-gen-23': 'piacter', 'fate-gen-24': 'piacter', 'fate-gen-25': 'piacter', 'fate-gen-26': 'piacter', 'fate-gen-28': 'piacter',
  'fate-gen-30': 'piacter', 'fate-know-12': 'piacter',
  // Hivatal: adó, hagyaték, bírság, pályázat, nyugdíj
  'fate-fs-11': 'hivatal', 'fate-dani-05': 'hivatal', 'fate-inh-01': 'hivatal', 'fate-inh-02': 'hivatal',
  'fate-gen-07': 'hivatal', 'fate-gen-13': 'hivatal', 'fate-gen-18': 'hivatal', 'fate-gen-21': 'hivatal', 'fate-gen-27': 'hivatal', 'fate-know-06': 'hivatal',
  // Közösségi tér: család, barátok, egészség
  'fate-fs-01': 'kozossegi-ter', 'fate-fs-02': 'kozossegi-ter', 'fate-inh-06': 'kozossegi-ter', 'fate-inh-10': 'kozossegi-ter',
  'fate-gen-06': 'kozossegi-ter', 'fate-gen-08': 'kozossegi-ter', 'fate-gen-15': 'kozossegi-ter', 'fate-gen-17': 'kozossegi-ter', 'fate-gen-29': 'kozossegi-ter',
  'fate-story-friend-loan': 'kozossegi-ter',
};

/**
 * Naptárhoz kötött kártyák (a valós hónapokban jönnek, elsőbbséggel):
 * karácsony és év végi bónusz decemberben; a cafeteria-nyilatkozat januárban;
 * az SZJA-bevallási tervezet márciustól májusig (március 15-től elérhető, a határidő május 20.;
 * forrás: nav.gov.hu, "Indul a 2026-os szja-szezon"); az adó-visszatérítés a bevallás után, áprilistól júniusig;
 * a nyaralás júliusban-augusztusban.
 */
export const FATE_MONTHS: Record<string, number[]> = {
  'fate-fs-12': [12], 'fate-dani-12': [12], 'fate-inh-12': [12], 'fate-inh-11': [12],
  'fate-gen-19': [1],
  'fate-dani-05': [3, 4, 5],
  'fate-inh-02': [4, 5, 6], 'fate-gen-07': [4, 5, 6], 'fate-gen-21': [4, 5, 6],
  'fate-gen-26': [7, 8],
};
