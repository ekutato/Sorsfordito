// ============================================================================
// PENZUGYI SORSFORDITO - Epilogue Cards
// Jatek vegi ertekelés - „kés a csontig, de szelíden"
// ============================================================================

import type { EpilogueId, VictoryLevel } from '@/types/game';
import { fillDeep } from '@/data/live/vars';

export interface EpilogueCard {
  id: EpilogueId;
  title: string;
  emoji: string;
  victoryLevel: VictoryLevel;
  conditions: string;
  text: string;
  lesson: string;
  futureVision: string;
}

/** Nyers tartalom {{változókkal}} - a megjelenítéshez a lenti, kitöltött EPILOGUE_CARDS-t használd */
export const EPILOGUE_CARDS_RAW: EpilogueCard[] = [
  {
    id: 'financial_ninja',
    title: 'A Pénzügyi Ninja',
    emoji: '🥷',
    victoryLevel: 'gold',
    conditions: 'Passzív jövedelem >= Havi kiadás',
    text:
      'Gratulálunk! A pénz neked dolgozik. Most már te döntöd el, reggel felkelsz-e. ' +
      '(De azért kelj fel – a pénzügyi szabadság nem jelenti, hogy egész nap sorozatokat nézhetsz. ' +
      'Vagy igen? Te döntöd el. Ez a lényeg.)',
    lesson:
      'Megtanultad, hogy a pénzügyi szabadság nem gazdagság kérdése – hanem rendszer kérdése. ' +
      'Bevétel > Kiadás + Befektetés = Idő.',
    futureVision:
      'Ha így folytatod a valóságban: 10 éven belül a passzív jövedelmed fedezi az életviteledet. ' +
      'A kulcs: ne állj meg, diverzifikálj, és tanulj tovább.',
  },
  {
    id: 'smart_squirrel',
    title: 'Az Okos Mókus',
    emoji: '🐿️',
    victoryLevel: 'silver',
    conditions: 'Nettó vagyon > 5M Ft, de aktív jövedelem > passzív',
    text:
      'Szorgalmasan gyűjtögetsz, és okosan. Még nem vagy szabad, de az úton vagy. ' +
      'A mókuskerékben legalább te választod a sebességet. ' +
      '(És van mogyoród télire – ez többeknél nincs.)',
    lesson:
      'A megtakarítás szükséges, de nem elégséges. A következő lépés: a megtakarított pénzt ' +
      'dolgoztatni (befektetés), hogy a passzív jövedelem elkezdje utolérni az aktívat.',
    futureVision:
      'Ha a jelenlegi arányban takarítasz meg és fektetsz be: ~5-8 éven belül elérheted a ' +
      '„Pénzügyi Ninja" szintet. A kamatos kamat a barátod.',
  },
  {
    id: 'survivor',
    title: 'A Túlélő',
    emoji: '🏕️',
    victoryLevel: 'bronze',
    conditions: 'Egyenleg > 0, de nincs befektetés',
    text:
      'Túlélted a hónapot (és a játékot). De a pénzed a párnád alatt van, ' +
      'az infláció meg a szekrényed tetején ül és vigyorog. ' +
      'Jó hír: túlélni már tudás. Most jön a neheze: gyarapodni.',
    lesson:
      'A „párnád alatt" tartott pénz minden évben veszít az értékéből (az infláció most évi {{inflation}}%). ' +
      'Évi 4%-os inflációnál például 100 000 Ft vásárlóereje 10 év alatt kb. 66 000 Ft-ra csökken. A pénz soha nem „áll" – vagy dolgozik, vagy fogy.',
    futureVision:
      'Első lépés: nyiss egy állampapír-számlát (webkincstár.hu, 15 perc), ' +
      'és vegyél PMÁP-ot akár 10 000 Ft-ért. Ez már befektetés.',
  },
  {
    id: 'debt_trap_knight',
    title: 'A Hitelcsapda Lovagja',
    emoji: '⚔️',
    victoryLevel: 'fail',
    conditions: 'Adósság > Nettó vagyon',
    text:
      'Houston, van egy kis probléma. Az adósságod nőtt, a vagyonod nem. ' +
      'De nem vagy egyedül – Magyarország jelentős része ezt csinálja. ' +
      'Ideje megfordítani! A lovag nem a csapdában marad – kijut belőle.',
    lesson:
      'A hitel nem ellenség – de a rossz hitel az. Aranyszabály: ' +
      'ha a hitel pénzt termel (lakás kiadásra, vállalkozás) = jó hitel. ' +
      'Ha fogyasztásra megy (telefon, nyaralás) = rossz hitel. ' +
      'Első lépés: a legdrágább hitelt törleszd le először (hólabda módszer).',
    futureVision:
      'Készíts listát az adósságaidról kamatláb szerint. A legdrágábbat törleszd le először ' +
      '(személyi kölcsön > hitelkártya > diákhitel). A diákhitel a legolcsóbb – az marad utoljára.',
  },
  {
    id: 'yolo_champion',
    title: 'Az YOLO Bajnok',
    emoji: '🎉',
    victoryLevel: 'fail',
    conditions: 'Egyenleg < 0',
    text:
      'Minden pénzt elköltöttél, cserébe van élményed. ' +
      'Sajnos az élmény nem fizeti a rezsit. ' +
      'De holnap új nap, és most már tudod, mit NE csinálj. ' +
      '(Spoiler: mindent.)',
    lesson:
      'Az YOLO nem pénzügyi stratégia. A szórakozás fontos, de a pénzügyi biztonság nélkül ' +
      'a szórakozás is stresszes lesz. ' +
      'Próbáld az 50/30/20 szabályt: 50% szükségletek, 30% vágyak, 20% megtakarítás.',
    futureVision:
      'Kezdd elölről: holnap állíts be egy automatikus átutalást a fizetésedből – ' +
      'akár 10 000 Ft/hó is elég. Amit nem látsz, azt nem költöd el.',
  },
  {
    id: 'bankruptcy',
    title: 'Csődközeli Állapot',
    emoji: '💀',
    victoryLevel: 'fail',
    conditions: 'Egyenleg < -1M VAGY Nettó vagyon < -3M',
    text:
      'Ez nem játék volt – ez egy pénzügyi katasztrófa szimuláció. ' +
      'A számlád mélyen mínuszban, az adósságod elszállt. ' +
      'A jó hír: ez csak egy játék volt. A rossz hír: a valóságban is könnyen ide juthat az ember.',
    lesson:
      'A pénzügyi csőd #1 oka: nem a kevés bevétel, hanem a kiadások kontrollálatlan növekedése. ' +
      'Tanulság: SOHA ne költs többet, mint amennyit keresel. Ha a havi mérleg negatív, azonnal cselekedj: ' +
      'vágd a kiadásokat, kérj segítséget (adósságkezelő tanácsadás: ingyenes az OBA-nál).',
    futureVision:
      'Ha a valóságban eladósodtál: az Adósságkezelő Szolgálat (1/310-0210) ingyenes tanácsadást nyújt. ' +
      'A csődvédelem és a magáncsőd is lehetőség – nem szégyen, hanem újrakezdés.',
  },
  {
    id: 'wise_owl',
    title: 'A Bölcs Bagoly',
    emoji: '🦉',
    victoryLevel: 'silver',
    conditions: 'Vagyon közepes, de 4+ Tudás kártya',
    text:
      'Nem vagy a leggazdagabb a szobában, de te vagy a legokosabb. ' +
      'A tudás kamatos kamattal fizet vissza – csak lassabban, mint szeretnéd. ' +
      'De egy bagoly türelmes. (És éjjel is lát – ami a pénzügyekben nagy előny.)',
    lesson:
      'A pénzügyi tudás a legjobb befektetés: 0 Ft fenntartási díj, végtelen hozam. ' +
      'Amit tudsz, azt soha nem veszíted el – és minden döntésedet javítja.',
    futureVision:
      'A tudásoddal már most jobb döntéseket hozol, mint a legtöbb ember. ' +
      'Következő lépés: alkalmazd, amit tanultál. A tudás tett nélkül csak érdekesség.',
  },
];

/** A szövegekben a {{változók}} a heti élő adatokból kapják az értéküket (src/data/live/vars.ts) */
export const EPILOGUE_CARDS: EpilogueCard[] = fillDeep(EPILOGUE_CARDS_RAW);

/**
 * Meghatározza az epilógust a pénzügyi adatok alapján
 */
export function determineEpilogue(params: {
  balance: number;
  netWorth: number;
  passiveIncome: number;
  totalExpenses: number;
  totalDebt: number;
  knowledgeCount: number;
  hasInvestments: boolean;
}): EpilogueCard {
  const { balance, netWorth, passiveIncome, totalExpenses, totalDebt, knowledgeCount, hasInvestments } = params;

  // === FAIL szint — legrosszabb esetek először ===

  // Csődközeli: súlyos eladósodás
  if (balance < -1_000_000 || netWorth < -3_000_000) {
    return EPILOGUE_CARDS.find((e) => e.id === 'bankruptcy')!;
  }

  // YOLO Bajnok: negatív egyenleg ÉS negatív vagyon
  if (balance < 0 && netWorth < 0) {
    return EPILOGUE_CARDS.find((e) => e.id === 'yolo_champion')!;
  }

  // Hitelcsapda Lovagja: adósság > vagyon
  if (totalDebt > 0 && totalDebt > netWorth && netWorth < 1_000_000) {
    return EPILOGUE_CARDS.find((e) => e.id === 'debt_trap_knight')!;
  }

  // === GOLD szint ===

  // Pénzügyi Ninja: passzív jövedelem fedezi a kiadásokat
  if (passiveIncome >= totalExpenses && passiveIncome > 0) {
    return EPILOGUE_CARDS.find((e) => e.id === 'financial_ninja')!;
  }

  // === SILVER szint ===

  // Okos Mókus: jó vagyon, de még nem szabad
  if (netWorth > 5_000_000 && passiveIncome < totalExpenses) {
    return EPILOGUE_CARDS.find((e) => e.id === 'smart_squirrel')!;
  }

  // Bölcs Bagoly: sok tudás, pozitív vagyon
  if (knowledgeCount >= 4 && netWorth > 0) {
    return EPILOGUE_CARDS.find((e) => e.id === 'wise_owl')!;
  }

  // === BRONZE szint ===

  // Túlélő: pozitív egyenleg, de nincs befektetés vagy alacsony vagyon
  if (balance >= 0 && !hasInvestments) {
    return EPILOGUE_CARDS.find((e) => e.id === 'survivor')!;
  }

  // Túlélő: pozitív egyenleg, van befektetés, de alacsony vagyon
  if (balance >= 0 && netWorth < 5_000_000) {
    return EPILOGUE_CARDS.find((e) => e.id === 'survivor')!;
  }

  // Default: Okos Mókus (ha ide jut, relatíve jól áll)
  return EPILOGUE_CARDS.find((e) => e.id === 'smart_squirrel')!;
}
