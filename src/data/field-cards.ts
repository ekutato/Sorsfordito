// ============================================================================
// Mezőkártyák a táblás módhoz (egyjátékos). A Döntés, Befektetés, Tudás és
// Sorsfordító mezők a kör meglévő tartalmát emelik ki; az alábbi mezőknek saját
// kártyájuk van. A csapdák a docs/kutatas.md 3. fejezetének valós mintáira épülnek:
// minden csapdának van ellenőrizhető vészjele és kivédési útja (CLAUDE.md 10. szabály).
// ============================================================================

import type { FieldType } from './board';
import { LIVE_DATA } from './live';
import { createRng, seedFromString, shuffle } from '@/engine/rng';
import { EXTRA_TRAP_CARDS, EXTRA_TEMPTATION_CARDS, EXTRA_RECHARGE_CARDS, EXTRA_ENCOUNTER_CARDS, EXTRA_OFFICE_CARDS } from './field-cards-extra';
import type { WellbeingKey } from '@/types/wellbeing';

export interface FieldEffect {
  target: string;
  amount: number;
}

export interface FieldOption {
  label: string;
  effects: FieldEffect[];
  /** A kiadás-hatás ennyi hónap után visszaáll (pl. részletfizetés) */
  durationMonths?: number;
  /** Mi történik - a választás után jelenik meg */
  outcome: string;
  /** Életmódbeli választásnál a jólléti hatást a játékos mérlegeli (nincs univerzális igazság) */
  reflection?: { keys: WellbeingKey[]; prompt: string };
}

/** Az opció azonnali pénzigénye (a negatív egyenleghatások összege, Ft) */
export function optionCost(option: FieldOption): number {
  return option.effects.reduce((sum, e) => (e.target === 'balance' && e.amount < 0 ? sum - e.amount : sum), 0);
}

/** Van-e rá fedezet: amit nem tudsz kifizetni, azt nem választhatod (és el sem vihetik) */
export function canAfford(option: FieldOption, balance: number): boolean {
  const cost = optionCost(option);
  return cost === 0 || cost <= balance;
}

export interface FieldCard {
  id: string;
  field: FieldType;
  title: string;
  body: string;
  /** Csapdáknál: a vészjelek (tudással kiemelve) */
  redFlags?: string[];
  /** Ennél a tudáskártyánál a vészjelek kiemelve jelennek meg */
  highlightWithKnowledge?: string;
  options: FieldOption[];
  /** Valós lépés a játékon kívül */
  realStep: string;
  sourceUrl?: string;
  /** Csak akkor húzható, ha illik a játékos helyzetéhez (különben a pakli következő lapja jön) */
  requires?: CardRequires;
}

export interface CardRequires {
  /** Csak ezeknél a karaktereknél (pl. diák) */
  presets?: string[];
  /** Albérletben / saját lakásban él (elköltözött) */
  rentsHome?: boolean;
  /** Van ilyen befektetése vagy vagyontárgya */
  hasInvestment?: string[];
}

/** A játékos helyzete a kártyák szűréséhez */
export interface CardContext { preset: string; housing: number; investments: string[] }

export function cardFits(card: FieldCard, ctx?: CardContext): boolean {
  const r = card.requires;
  if (!r || !ctx) return true;
  if (r.presets && !r.presets.includes(ctx.preset)) return false;
  if (r.rentsHome && ctx.housing < 100_000) return false;
  if (r.hasInvestment && !r.hasInvestment.some((id) => ctx.investments.includes(id))) return false;
  return true;
}

export const TRAP_CARDS: FieldCard[] = [
  {
    id: 'trap-biztonsagi-szamla',
    field: 'trap',
    title: '„Bankbiztonsági” hívás',
    body: 'Hív a „bankod biztonsági osztálya”: gyanús tranzakciót észleltek, a pénzed veszélyben van. Azonnal utald át egy „biztonsági számlára”, és mondd be az SMS-ben kapott kódot.',
    redFlags: [
      '„Biztonsági számla” a banki gyakorlatban nem létezik.',
      'Kódot kér telefonon - a bank ilyet soha nem kér.',
      'Sürget: „azonnal”, különben elveszik a pénzed.',
      'A kijelzett hívószám hamisítható, attól még nem a bank hív.',
    ],
    highlightWithKnowledge: 'know-digital',
    options: [
      { label: 'Leteszem, és a kártyám hátoldalán lévő számon visszahívom a bankot', effects: [{ target: 'wellbeing.egyensuly', amount: 1 }],
        outcome: 'A bank megerősítette: nem ők hívtak. Kivédted a csalást - és a számlád érintetlen.' },
      { label: 'Nem bízom benne, egyszerűen leteszem', effects: [],
        outcome: 'Jól tetted. Biztosabb, ha legközelebb vissza is hívod a bankot a hivatalos számon.' },
      { label: 'Átutalom a pénzt a „biztonsági számlára”', effects: [{ target: 'balance', amount: -150_000 }, { target: 'wellbeing.egeszseg', amount: -1 }],
        outcome: 'A pénz eltűnt. 2025-ben az ilyen átutalásos csalások átlagos kára 1,6 millió Ft fölött volt. A jel: a „biztonsági számla” nem létezik.' },
    ],
    realStep: 'Csalásgyanúnál tedd le, és te hívd vissza a bankot a kártyád hátoldalán vagy a bank honlapján szereplő számon.',
    sourceUrl: 'https://kiberpajzs.hu/hirek/igy-nem-valunk-telefonos-adathalaszat-aldozatava-tippek-es-tanacsok',
  },
  {
    id: 'trap-deepfake-befektetes',
    field: 'trap',
    title: 'Híresség „titkos befektetése”',
    body: 'Hírportálnak látszó oldalon videó: egy ismert közszereplő elárulja, hogyan lett havi 8%-os „garantált” hozamból gazdag. Csak ma lehet beszállni 50 000 Ft-tal, egy tanácsadó távelérésen segít.',
    redFlags: [
      'Garantált, irreálisan magas hozam: havi 8% évente 150% fölött lenne.',
      'Híresség „ajánlása” - gyakori deepfake-minta.',
      'Sürgetés: „csak ma”.',
      'Távelérési program telepítését kéri.',
    ],
    highlightWithKnowledge: 'know-invest-psychology',
    options: [
      { label: 'Megkeresem a céget az MNB piaci szereplők keresőjében', effects: [{ target: 'wellbeing.egyensuly', amount: 1 }],
        outcome: 'Nincs engedélye, sőt rajta van az MNB figyelmeztető listáján. Kivédted.' },
      { label: 'Nem kattintok rá', effects: [],
        outcome: 'Jó döntés. Ha bizonytalan vagy, a legjobb ellenőrzés az MNB keresője.' },
      { label: 'Befizetem az 50 000 Ft-ot', effects: [{ target: 'balance', amount: -50_000 }, { target: 'wellbeing.egeszseg', amount: -1 }],
        outcome: 'A „platform” eltűnt a pénzeddel. A jel: garantált, kiugró hozam és sürgetés.' },
    ],
    realStep: 'Befektetés előtt ellenőrizd a szolgáltatót az MNB piaci szereplők keresőjében és a figyelmeztető listán.',
    sourceUrl: 'https://www.mnb.hu/felugyelet/engedelyezes-es-intezmenyfelugyeles/piaci-szereplok-keresese',
  },
  {
    id: 'trap-nav-sms',
    field: 'trap',
    title: '„Jóváhagyott adó-visszatérítés” SMS',
    body: 'SMS jön: „NAV: 102 000 Ft adó-visszatérítése jóváhagyva. Igényelje itt 24 órán belül:” - és egy link, ahol a kártyaadataidat kérik.',
    redFlags: [
      'Link az SMS-ben, ami nem a nav.gov.hu oldalra mutat.',
      'Kártyaadatot kér - a NAV ilyet soha nem kér.',
      'Határidővel sürget.',
    ],
    highlightWithKnowledge: 'know-tax',
    options: [
      { label: 'Nem kattintok, az ügyfélkapun nézem meg a NAV-os ügyeimet', effects: [{ target: 'wellbeing.egyensuly', amount: 1 }],
        outcome: 'Nincs semmilyen visszatérítés. Kivédted az adathalászatot.' },
      { label: 'Törlöm az SMS-t', effects: [],
        outcome: 'Biztonságos. Ha kíváncsi vagy, a hivatalos felületen, a címet kézzel beírva nézd meg.' },
      { label: 'Megadom a kártyaadataimat', effects: [{ target: 'balance', amount: -80_000 }, { target: 'wellbeing.egeszseg', amount: -1 }],
        outcome: 'Leemeltek a kártyádról. A jel: a link nem a nav.gov.hu oldalra vitt, és kártyaadatot kért.' },
    ],
    realStep: 'NAV-os ügyet csak a hivatalos felületen (ügyfélkapu, eSZJA) nézz meg, a címet kézzel beírva.',
    sourceUrl: 'https://www.penzcentrum.hu/tech/20260902/azonnal-torold-ha-ilyen-sms-t-kapsz-a-nav-tol-szazezres-csapdaval-fosztjak-ki-a-magyarokat-1204792',
  },
  ...EXTRA_TRAP_CARDS,
];

export const TEMPTATION_CARDS: FieldCard[] = [
  {
    id: 'kis-bnpl-telefon',
    field: 'temptation',
    title: 'Most vedd meg, később fizesd',
    body: 'Az új telefon négy részletben, „kamatmentesen”. Ha egy részletet lekésel, késedelmi díj jön, és a havi kiadásod négy hónapig magasabb.',
    options: [
      { label: 'Megveszem részletre', effects: [{ target: 'other', amount: 12_000 }], durationMonths: 4,
        reflection: { keys: ['eletero'], prompt: 'Új telefon részletre: van, akinek ez valódi öröm, van, akit a havi részlet nyomaszt.' },
        outcome: 'Örülsz az új telefonnak, de négy hónapig 12 000 Ft-tal nagyobb a havi kiadásod.' },
      { label: 'Olcsóbb, felújított készüléket veszek készpénzért', effects: [{ target: 'balance', amount: -60_000 }],
        outcome: 'Egyszer fizettél, havi teher nélkül.' },
      { label: 'Kivárok, a régi még működik', effects: [],
        reflection: { keys: ['eletero'], prompt: 'Kivárni a régi telefonnal: van, akinek ez nyugodt döntés, van, akit bosszant a lassú készülék.' },
        outcome: 'Kicsit bosszant, de a pénzed megmaradt.' },
    ],
    realStep: 'Részletre vásárlás előtt olvasd el a késedelmi díjakat, és számold össze a teljes visszafizetendő összeget.',
  },
  {
    id: 'kis-elofizetesek',
    field: 'temptation',
    title: 'Szivárgó előfizetések',
    body: 'Átnézed a bankszámlakivonatot: három streaming, egy edzésapp és egy felhőtárhely - összesen havi 14 000 Ft. Kettőt hónapok óta nem használtál.',
    options: [
      { label: 'Lemondom, amit nem használok', effects: [{ target: 'other', amount: -7_000 }],
        outcome: 'Havi 7 000 Ft-tal kevesebb kiadás - évente 84 000 Ft.' },
      { label: 'Mind marad, jó, ha van', effects: [],
        outcome: 'Kényelmes, de a havi 14 000 Ft tovább csordogál.' },
    ],
    realStep: 'Havonta egyszer nézd át a bankszámlakivonatot az ismétlődő terhelések miatt.',
  },
  ...EXTRA_TEMPTATION_CARDS,
];

export const RECHARGE_CARDS: FieldCard[] = [
  {
    id: 'fel-pihenes',
    field: 'recharge',
    title: 'Feltöltődés',
    body: 'Egy szabad hétvége. Mivel töltöd?',
    options: [
      { label: 'Kirándulás a barátokkal (ingyen)', effects: [],
        reflection: { keys: ['egyensuly', 'egeszseg'], prompt: 'Közös kirándulás: van, akit feltölt a társaság és a mozgás, van, akinek a csendes pihenés jobb.' },
        outcome: 'Feltöltődtél, és a kapcsolataid is erősödtek.' },
      { label: 'Wellness hétvége (40 000 Ft)', effects: [{ target: 'balance', amount: -40_000 }],
        reflection: { keys: ['eletero'], prompt: 'Wellness hétvége: van, akit tényleg kipihentet, van, akinek az ára miatt nem az igazi.' },
        outcome: 'Kipihented magad - ennek ára volt.' },
      { label: 'Túlórát vállalok', effects: [{ target: 'balance', amount: 30_000 }, { target: 'wellbeing.eletero', amount: -1 }],
        outcome: 'Több pénz, kevesebb pihenés.' },
    ],
    realStep: 'A pihenés is befektetés: a kiégés drágább, mint egy szabad hétvége.',
  },
  ...EXTRA_RECHARGE_CARDS,
];

export const ENCOUNTER_CARDS: FieldCard[] = [
  {
    id: 'tal-baratod-uzlete',
    field: 'encounter',
    title: 'Találkozás: közös vállalkozás',
    body: 'Egy régi barátod kávézót nyitna, és társat keres 2 000 000 Ft-tal. Szerződés még nincs, csak lelkesedés.',
    options: [
      { label: 'Beszállok, de előbb írásban rögzítjük a feltételeket', effects: [{ target: 'balance', amount: -2_000_000 }],
        reflection: { keys: ['egyensuly'], prompt: 'Közös vállalkozás egy baráttal: van, akinek ez összetartozás, van, akit a pénzügyi kötődés feszít.' },
        outcome: 'Társak lettetek, tiszta szabályokkal. Hogy megtérül-e, később kiderül.' },
      { label: 'Segítek tanáccsal, pénzzel nem', effects: [],
        reflection: { keys: ['egyensuly'], prompt: 'Tanáccsal segíteni, pénzzel nem: van, akinek ez tiszta határ, van, akit bűntudat gyötör miatta.' },
        outcome: 'A barátság megmaradt, a pénzed is.' },
      { label: 'Nemet mondok', effects: [],
        outcome: 'Megértette. Nem minden lehetőség a tiéd.' },
    ],
    realStep: 'Közös befektetésnél előre, írásban rögzítsétek a hozzájárulást és a kiszállás feltételeit.',
  },
  ...EXTRA_ENCOUNTER_CARDS,
];

export const OFFICE_CARDS: FieldCard[] = [
  {
    id: 'hiv-szja-tervezet',
    field: 'office',
    title: 'Hivatal: az SZJA-bevallási tervezet',
    body: 'A NAV elkészíti az SZJA-bevallás tervezetét, de érdemes ellenőrizni: hiányozhat belőle kedvezmény vagy egy bevétel.',
    options: [
      { label: 'Átnézem, és beírom a kimaradt kedvezményt', effects: [{ target: 'balance', amount: 15_000 }],
        outcome: 'Megérte: a kimaradt kedvezmény miatt visszatérítés jár.' },
      { label: 'Hagyom, majd automatikusan elfogadják', effects: [],
        outcome: 'Elfogadták a tervezetet - ellenőrzés nélkül.' },
    ],
    realStep: 'Az SZJA-bevallás tervezetét az eSZJA felületen nézd át a határidő előtt.',
  },
  ...EXTRA_OFFICE_CARDS,
];

/** Piaci hír mező: a heti élő adatcsomag egy híre (saját megfogalmazás + forrás) */
/** Minden saját mezőkártya (a piaci hír a heti csomagból jön) */
export const ALL_FIELD_CARDS: FieldCard[] = [...TRAP_CARDS, ...TEMPTATION_CARDS, ...RECHARGE_CARDS, ...ENCOUNTER_CARDS, ...OFFICE_CARDS];

export function marketNewsCard(index: number): FieldCard | undefined {
  const items = LIVE_DATA.hirek.filter((h) => h.jatekEsemeny);
  if (items.length === 0) return undefined;
  const h = items[index % items.length];
  const ev = h.jatekEsemeny!;
  return {
    id: `hir-${LIVE_DATA.het}-${index % items.length}`,
    field: 'market_news',
    title: ev.title,
    body: ev.description,
    options: [{ label: 'Tudomásul veszem', effects: ev.effects.map((e) => ({ target: e.target, amount: e.amount })), outcome: `Forrás: ${h.source}` }],
    realStep: `Forrás: ${h.source}`,
    sourceUrl: h.url,
  };
}

/** A mezőhöz tartozó kártya; a soron következő lapot a mező látogatásainak száma adja (ismétlés nélkül körbejár) */
/** Közös asztali pakli: minden játékosnak saját helye van, a lapok egy közös keverésből jönnek */
export interface SharedDeck { seed: number; slot: number; players: number }

/**
 * A mező kártyája.
 * - Asztali játékban (shared): a lap indexe látogatás × játékosszám + hely a közösen kevert pakliban, így
 *   amíg egy mezőtípus pakliját végig nem húzzák, két játékos soha nem kap azonos lapot (üzenetváltás nélkül).
 * - Egyjátékos módban: a pakli játékonként (seed: a játék azonosítója) kevert, egy játékon belül nincs ismétlés.
 * - Seed nélkül a pakli eredeti sorrendje (tesztekhez).
 */
export function cardForField(field: FieldType, visit: number, seed?: string, shared?: SharedDeck, ctx?: CardContext): FieldCard | undefined {
  const pick = (cards: FieldCard[]) => {
    if (!cards.length) return undefined;
    const deck = shared ? shuffle(cards, createRng(seedFromString(`asztal-${shared.seed}-${field}`)))
      : seed ? shuffle(cards, createRng(seedFromString(`${seed}-${field}`))) : cards;
    const start = shared ? visit * Math.max(1, shared.players) + shared.slot : visit;
    // A helyzethez nem illő lap kimarad: a pakli következő illő lapja jön
    for (let k = 0; k < deck.length; k++) {
      const c = deck[(start + k) % deck.length];
      if (cardFits(c, ctx)) return c;
    }
    return deck[start % deck.length];
  };
  switch (field) {
    case 'trap': return pick(TRAP_CARDS);
    case 'temptation': return pick(TEMPTATION_CARDS);
    case 'recharge': return pick(RECHARGE_CARDS);
    case 'encounter': return pick(ENCOUNTER_CARDS);
    case 'office': return pick(OFFICE_CARDS);
    case 'market_news':
      return marketNewsCard(shared ? visit * Math.max(1, shared.players) + shared.slot : seed ? visit + (seedFromString(seed) % 97) : visit);
    default: return undefined;
  }
}

/** A húzás helye a pakliban (a keverés megjelenítéséhez): pakliméret, hányadik lap, új keverés-e */
export function cardDrawInfo(field: FieldType, visit: number, shared?: SharedDeck): { size: number; index: number; newPass: boolean } | undefined {
  const size = { trap: TRAP_CARDS.length, temptation: TEMPTATION_CARDS.length, recharge: RECHARGE_CARDS.length, encounter: ENCOUNTER_CARDS.length, office: OFFICE_CARDS.length }[field as string];
  if (!size) return undefined;
  const n = shared ? Math.max(1, shared.players) : 1;
  const at = (v: number) => v * n + (shared?.slot ?? 0);
  const pass = (v: number) => Math.floor(at(v) / size);
  return { size, index: at(visit) % size, newPass: visit === 0 || pass(visit) !== pass(visit - 1) };
}

/** A kör meglévő tartalmát kiemelő mezők rövid magyarázata */
export const FIELD_HINTS: Partial<Record<FieldType, string>> = {
  payday: 'Fizetésnap: megérkezik a havi bevétel.',
  decision: 'Döntés mező: ebben a körben a döntésed kerül a középpontba.',
  investment: 'Befektetés mező: nézd meg a befektetési lehetőségeket a kör során.',
  knowledge: 'Tudás mező: ebben a körben érdemes tudáskártyát szerezni.',
  fate: 'Sorsfordító mező: az élet közbeszól - jön a kör sorskártyája.',
};
