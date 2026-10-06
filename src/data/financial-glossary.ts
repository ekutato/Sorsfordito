import { fillDeep } from '@/data/live/vars';
// ============================================================================
// PENZUGYI SORSFORDITO - Pénzügyi Fogalomtár
// A játékban előforduló pénzügyi rövidítések és fogalmak magyarázata
// ============================================================================

export interface GlossaryEntry {
  /** Rövid kulcs (a szövegben erre keresünk) */
  term: string;
  /** Teljes név */
  fullName: string;
  /** 1-2 mondatos leírás */
  description: string;
  /** Előnyök (max 2-3 pont) */
  pros: string[];
  /** Hátrányok (max 2-3 pont) */
  cons: string[];
  /** Kockázati szint */
  risk: 'minimális' | 'alacsony' | 'közepes' | 'magas' | '—';
  /** Hivatalos forrás URL */
  sourceUrl?: string;
  /** Forrás neve */
  sourceName?: string;
}

/** Nyers tartalom {{változókkal}} - a megjelenítéshez a lenti, kitöltött FINANCIAL_GLOSSARY-t használd */
export const FINANCIAL_GLOSSARY_RAW: GlossaryEntry[] = [
  // --- Állampapírok & Megtakarítások ---
  {
    term: 'PMÁP',
    fullName: 'Prémium Magyar Állampapír',
    description:
      'Az állam által kibocsátott, inflációkövető állampapír magánszemélyeknek. ' +
      'Kamata minden évben az előző évi átlagos infláció plusz egy kis prémium (most {{pmap_yield}}%). ' +
      'Évente egyszer fizet kamatot, és az állam garantálja a visszafizetést.',
    pros: [
      'Államilag garantált (nem bukhatsz rajta)',
      'A kamat az előző évi inflációt követi, prémiummal',
      'Évente egyszeri kamatfizetés, a kamat adómentes',
    ],
    cons: [
      'Több éves futamidő (idő előtt visszaváltható, de díj ellenében)',
      'Ha az infláció lassul, a következő évi kamat is kisebb',
    ],
    risk: 'minimális',
    sourceUrl: 'https://www.allampapir.hu',
    sourceName: 'ÁKK (Államadósság Kezelő Központ)',
  },
  {
    term: 'TBSZ',
    fullName: 'Tartós Befektetési Számla',
    description:
      'Speciális értékpapírszámla, ahol 5 év után a teljes hozam adómentes (0% adó). ' +
      '3 év után 10% adó. Részvény, ETF, kötvény mind tartható rajta.',
    pros: [
      '5 év után 0% adó a hozamra (normál esetben 15% SZJA + 13% szocho)',
      'Bármilyen értékpapírt tarthatsz rajta',
      'Évente nyithatsz újat (több TBSZ párhuzamosan)',
    ],
    cons: [
      '5 évig nem szabad kivenni (különben elvész az adóelőny)',
      'Csak a nyitás évében lehet pénzt befizetni',
      'Kripto NEM tartható TBSZ-en',
    ],
    risk: 'alacsony',
    sourceUrl: 'https://www.bet.hu',
    sourceName: 'BÉT (Budapesti Értéktőzsde)',
  },
  {
    term: 'ETF',
    fullName: 'Exchange-Traded Fund (Tőzsdén kereskedett alap)',
    description:
      'Olyan befektetési alap, ami egy teljes indexet követ (pl. S&P 500 = 500 legnagyobb ' +
      'amerikai cég). Egyetlen vásárlással százas cégekbe fektetsz.',
    pros: [
      'Automatikus diverzifikáció (nem egy cégre teszed)',
      'Nagyon alacsony költség (0,03-0,2%/év)',
      'Történelmileg 7-10%/év átlagos hozam',
    ],
    cons: [
      'Árfolyamkockázat (rövid távon eshet)',
      'Devizakockázat (USD/EUR alapú ETF-eknél)',
      'Nem garantált hozam',
    ],
    risk: 'közepes',
    sourceUrl: 'https://www.bet.hu/oldalak/etf',
    sourceName: 'BÉT',
  },

  // --- Adók & Támogatások ---
  {
    term: 'SZJA',
    fullName: 'Személyi Jövedelemadó',
    description:
      'Magyarországon a személyi jövedelemadó egységesen 15%. ' +
      'Fontos: 25 év alattiak számára az SZJA mentes a bruttó átlagbér összegéig!',
    pros: [
      '25 év alatti kedvezmény (a bruttó átlagkereset szintjéig mentes)',
      'Családi adókedvezmény gyermekek után',
      'Önkéntes nyugdíjpénztári adó-visszatérítés (20%)',
    ],
    cons: [
      'A munkaadó további 13% szociális hozzájárulást fizet',
      'Befektetési hozamra is 15% (kivéve TBSZ)',
    ],
    risk: '—',
    sourceUrl: 'https://nav.gov.hu',
    sourceName: 'NAV (Nemzeti Adó- és Vámhivatal)',
  },
  {
    term: 'THM',
    fullName: 'Teljes Hiteldíj Mutató',
    description:
      'Egyetlen szám, ami a hitel ÖSSZES költségét tartalmazza: kamat + kezelési díj + ' +
      'értékelési díj + minden rejtett költség. Hiteleknél mindig a THM-et hasonlítsd!',
    pros: [
      'Egy számban mutatja a hitel valós költségét',
      'Törvényileg kötelező feltüntetni',
      'Összehasonlíthatóvá teszi a hitelajánlatokat',
    ],
    cons: [
      'Nem tartalmazza a biztosítási díjat (ami gyakran kötelező)',
      'Változó kamatnál a THM is változik',
    ],
    risk: '—',
    sourceUrl: 'https://www.mnb.hu/fogyasztovedelem',
    sourceName: 'MNB (Magyar Nemzeti Bank)',
  },
  {
    term: 'CSOK',
    fullName: 'Családok Otthonteremtési Kedvezménye',
    description:
      'Állami támogatás lakásvásárláshoz vagy építéshez, gyermekvállalás feltételével. ' +
      '2024-től CSOK Plusz: akár 50M Ft kedvezményes hitel, max 3% kamattal.',
    pros: [
      'Vissza nem térítendő támogatás + kedvezményes hitel',
      'Új és használt lakásra is igényelhető',
      'Vidéki CSOK: kisebb településeken extra kedvezmények',
    ],
    cons: [
      'Gyermekvállalási kötelezettség (bírság, ha nem teljesül)',
      'Bürokratikus ügyintézés',
      'Ingatlan értékbecslés és feltételek szükségesek',
    ],
    risk: 'alacsony',
    sourceUrl: 'https://csok.hu',
    sourceName: 'Hivatalos CSOK információk',
  },

  // --- Diákhitel ---
  {
    term: 'DH1',
    fullName: 'Diákhitel 1 (szabad felhasználású)',
    description:
      'Hallgatói hitel szabad felhasználásra, államilag támogatott kamattal. ' +
      'Törlesztés a tanulmányok befejezése után indul, a jövedelem arányában.',
    pros: [
      'Államilag támogatott kamat (jelenleg {{dh1_rate}}%)',
      'Tanulmányok alatt nem kell törleszteni',
      'Jövedelem arányos törlesztés',
    ],
    cons: [
      'Kamatozó hitel: a tartozás a kamattal együtt nő',
      'Adósság, amit később törlesztened kell',
      'Ha nem fejezed be az egyetemet, a törlesztés akkor is indul',
    ],
    risk: 'alacsony',
    sourceUrl: 'https://diakhitel.hu',
    sourceName: 'Diákhitel Központ',
  },
  {
    term: 'DH2',
    fullName: 'Diákhitel 2 (tandíj célú)',
    description:
      'Kizárólag tandíj fizetésére fordítható hallgatói hitel. Kamatmentes! ' +
      'A Diákhitel Központ közvetlenül az intézménynek utalja.',
    pros: [
      'Teljesen kamatmentes (0%)',
      'Tanulmányok alatt nem kell törleszteni',
      'Közvetlenül a tandíjat fedezi',
    ],
    cons: [
      'Csak tandíjra használható',
      'Diplomaszerzés után indul a törlesztés',
    ],
    risk: 'alacsony',
    sourceUrl: 'https://diakhitel.hu',
    sourceName: 'Diákhitel Központ',
  },

  // --- Gépjármű ---
  {
    term: 'KGFB',
    fullName: 'Kötelező Gépjármű Felelősségbiztosítás',
    description:
      'Minden forgalomba helyezett gépjárműhöz kötelező biztosítás. ' +
      'A te autód által MÁSOKNAK okozott kárt fedezi (nem a sajátodat!).',
    pros: [
      'Másnak okozott kár fedezetét biztosítja',
      'Évente váltható (november az átjelentkezési időszak)',
      'Összehasonlító oldalakon olcsó ajánlat kereshető',
    ],
    cons: [
      'NEM fedezi a saját autód kárát (ahhoz CASCO kell)',
      'Bónusz-málusz rendszer: baleset = drágulás',
      'Évi 25 000 – 120 000 Ft (kortól, autótól függ)',
    ],
    risk: '—',
    sourceUrl: 'https://www.mnb.hu/fogyasztovedelem/biztositasi-piac',
    sourceName: 'MNB',
  },
  {
    term: 'CASCO',
    fullName: 'Gépjármű casco biztosítás',
    description:
      'Önkéntes biztosítás, ami a SAJÁT autód kárát fedezi: ' +
      'lopás, törés, természeti kár, vandalizmus, vad-ütközés.',
    pros: [
      'Saját kár fedezése (lopás, törés, jégverés)',
      'Hiteles autónál a bank általában megköveteli',
      'Önrész választható (magasabb önrész = olcsóbb díj)',
    ],
    cons: [
      'Drága: évi 80 000 – 300 000 Ft',
      'Öreg autónál nem éri meg (ha az autó értéke < 2 év díj)',
      'Amortizáció: a biztosító az autó aktuális értékét fizeti',
    ],
    risk: '—',
    sourceUrl: 'https://www.netrisk.hu',
    sourceName: 'Biztosítás-összehasonlító',
  },

  // --- Intézmények ---
  {
    term: 'OBA',
    fullName: 'Országos Betétbiztosítási Alap',
    description:
      'Ha a bankod csődbe menne, az OBA személy/bank kombináció alapján ' +
      '100 000 EUR-ig (most kb. {{oba_huf}} Ft) garantálja a betéted visszafizetését.',
    pros: [
      '100 000 EUR-ig teljes védelem személyenként/bankonként',
      '20 munkanapon belül kifizetés',
      'Automatikus (nem kell külön kérni)',
    ],
    cons: [
      '100 000 EUR feletti összeg nincs védve',
      'Csak bankbetétre vonatkozik (befektetésre NEM)',
    ],
    risk: '—',
    sourceUrl: 'https://www.oba.hu',
    sourceName: 'OBA',
  },
  {
    term: 'BÉT',
    fullName: 'Budapesti Értéktőzsde',
    description:
      'A magyar tőzsde, ahol részvényekkel, kötvényekkel és ETF-ekkel kereskedhetsz. ' +
      'A legnagyobb kibocsátók között van bank, energiacég, gyógyszergyártó és távközlési cég - a játékban: ' +
      'Pannon Bankcsoport Nyrt., Duna Energia Nyrt., Tisza Gyógyszer Nyrt., Hármashatár Távközlés Nyrt. (kitalált cégek).',
    pros: [
      'Magyar cégekbe fektethetsz (forintban)',
      'Szabályozott, biztonságos kereskedés',
      'Osztalékot is kaphatsz (részvényektől)',
    ],
    cons: [
      'Kis piac (kevés részvény, alacsony likviditás)',
      'Nyitvatartás: hétfő-péntek 9:00-17:00',
    ],
    risk: 'közepes',
    sourceUrl: 'https://www.bet.hu',
    sourceName: 'BÉT',
  },
  {
    term: 'MNB',
    fullName: 'Magyar Nemzeti Bank',
    description:
      'Magyarország központi bankja. Meghatározza az alapkamatot, felügyeli a bankokat, ' +
      'és védi a fogyasztókat a pénzügyi piacon.',
    pros: [
      'Ingyenes fogyasztóvédelmi panaszkezelés',
      'Hitel-összehasonlító (mnb.hu)',
      'Pénzügyi Navigátor füzetek (letölthető, ingyenes)',
    ],
    cons: [],
    risk: '—',
    sourceUrl: 'https://www.mnb.hu',
    sourceName: 'MNB',
  },

  // --- Életmód & Tudatos Fogyasztás ---
  {
    term: 'BNPL',
    fullName: 'Buy Now, Pay Later (Vedd meg most, fizess később)',
    description:
      'Részletfizetési szolgáltatás (pl. Klarna, Afterpay, Árukereső Részletfizetés), ' +
      'ami 3-4 részletre bontja a vásárlást. Kamatmentes, DE késedelmi díj van!',
    pros: [
      'Kamatmentes, ha időben fizetsz',
      'Könnyű aktiválni online vásárlásnál',
    ],
    cons: [
      'Késedelmi díj 15-25% (ha lekésed a részletet)',
      'Nem épít hitelképességet (banknak láthatatlan)',
      'Impulzusvásárlásra csábít (nem érzed a kiadást azonnal)',
    ],
    risk: 'közepes',
    sourceName: 'MNB Fogyasztóvédelem',
    sourceUrl: 'https://www.mnb.hu/fogyasztovedelem',
  },
  {
    term: 'láthatatlan kiadás',
    fullName: 'Láthatatlan kiadások (latte-faktor)',
    description:
      'Kis tételek, amiket nem veszünk észre, de összeadódnak: napi kávé (1 200 Ft × 20 = 24 000 Ft/hó), ' +
      'ételfutár-felár, előfizetések, applikáció-vásárlások. Éves szinten akár 300-500 000 Ft.',
    pros: [
      'Ha felismered, sokat spórolhatsz (havi 20-50 000 Ft)',
      'Nem igényel radikális életmódváltást, csak tudatosságot',
    ],
    cons: [
      'Nehéz nyomon követni (sok kis tétel)',
      'Pszichológiailag „megérdemlem" érzés nehezíti a csökkentést',
    ],
    risk: '—',
  },
  {
    term: 'előfizetés-halmozás',
    fullName: 'Előfizetés-csapda (subscription stacking)',
    description:
      'Streaming, zene, felhő, fitness app, játékok — külön-külön kicsik (1 500–5 000 Ft), ' +
      'de 6-8 előfizetés havi 15–30 000 Ft. Sokan elfelejtik, melyiket használják ténylegesen.',
    pros: [
      'Havonta felülvizsgálva akár 10-15 000 Ft spórolható',
      'Családi csomagok 40-60%-kal olcsóbbak',
    ],
    cons: [
      'Automatikus megújítás (nem is vesszük észre)',
      'Ingyenes próba → fizetős (ha nem mondod le időben)',
    ],
    risk: '—',
  },
  {
    term: 'ételfutár-app',
    fullName: 'Ételkiszállítás felára (ételfutár-appok)',
    description:
      'Az ételrendelés kiszállítási díja + szervizdíj + az étterem appon belüli drágább árai ' +
      'összesen 30-50%-kal drágíthatják a rendelést a helyszíni árhoz képest.',
    pros: [
      'Kényelmes, időt spórol',
      'Előfizetéssel csökkenthető a kiszállítási díj (de az is pénz)',
    ],
    cons: [
      'Heti 3× rendelés ≈ havi 40-60 000 Ft (főzéssel 20-30 000 Ft lenne)',
      'Emelt árak az appon belül (étterem + platform árrés)',
      'Impulzusrendelés veszélye (éjszakai rendelések)',
    ],
    risk: '—',
  },
  {
    term: 'Babaváró',
    fullName: 'Babaváró hitel',
    description:
      'Államilag támogatott, szabad felhasználású hitel házaspároknak (max 11M Ft). ' +
      'Ha 5 éven belül születik gyermek, a kamat 0%, és 3 gyermeknél a teljes összeg elengedhető.',
    pros: [
      'Szabad felhasználás (akár lakásra, autóra, befektetésre)',
      '0% kamat gyermekvállalás esetén',
      '3 gyermeknél a teljes tartozás elengedhető',
    ],
    cons: [
      'Házasság szükséges (legalább az egyik fél 40 év alatti)',
      'Ha nem születik gyermek 5 éven belül → kamatozóvá válik, és a kamattámogatást is vissza kell fizetni',
      'Visszafizetési kötelezettség gyermek nélkül',
    ],
    risk: 'közepes',
    sourceUrl: 'https://www.mnb.hu/fogyasztovedelem',
    sourceName: 'MNB',
  },
  {
    term: 'vészalap',
    fullName: 'Vészhelyzeti tartalék (emergency fund)',
    description:
      'Likvid megtakarítás (bankszámlán vagy rövid állampapírban), ami 3-6 havi kiadást fedez. ' +
      'Ha bármi történik (munkahely elvesztés, betegség), nem kell hitelt felvenni.',
    pros: [
      'Biztonság: váratlan kiadásokra azonnal elérhető',
      'Nem kell drága hitelt felvenni vészhelyzetben',
      'Lelki nyugalom és pénzügyi stabilitás',
    ],
    cons: [
      'Alacsony hozam (bankszámlán alig fizet kamatot)',
      'Infláció miatt reálértékben csökken',
    ],
    risk: 'minimális',
  },

  // --- Befektetések: Deviza & Nemesfémek ---
  {
    term: 'deviza',
    fullName: 'Deviza (külföldi valuta befektetés)',
    description:
      'Külföldi valuta (EUR, USD, CHF) tartása megtakarítási céllal. ' +
      'Ha a forint gyengül, a devizád forintban többet ér. Bankszámlán vagy fintech devizaszámlán könnyen elérhető (egy euró most {{eur_huf}} Ft).',
    pros: [
      'Forintgyengülés ellen véd (diverzifikáció)',
      'Nagyon likvid (azonnal visszaváltható)',
      'Egyes szolgáltatóknál hétköznap olcsó a váltás (nézd meg a felárat!)',
    ],
    cons: [
      'Ha a forint erősödik, veszítesz rajta',
      'Árfolyamnyereség 15% SZJA-köteles',
      'Nem fizet kamatot (hacsak nem kötöd le)',
    ],
    risk: 'közepes',
  },
  {
    term: 'nemesfém',
    fullName: 'Nemesfém befektetés (arany, ezüst)',
    description:
      'Arany és ezüst tartása fizikai formában (érme, tömb) vagy ETF-ben. ' +
      'Történelmileg válságálló, infláció-rezisztens. Az arany ára most kb. {{gold_usd}} USD/uncia.',
    pros: [
      'Inflációvédelem (évezredes értékmegőrző)',
      'Geopolitikai válságban értéke nő (menedékeszköz)',
      'Befektetési aranyra 0% ÁFA Magyarországon',
    ],
    cons: [
      'Nem termel hozamot (nincs kamat, nincs osztalék)',
      'Fizikai tárolás problémás (széf költség)',
      'Ezüstre 27% ÁFA (!), aranyra 0%',
    ],
    risk: 'közepes',
    sourceUrl: 'https://www.mnb.hu',
    sourceName: 'MNB (aranytömb értékesítés)',
  },
  {
    term: 'Fintech-szolgáltatók',
    fullName: 'Fintech-szolgáltatók (online bankok, devizaszámlák, befektetési appok)',
    description:
      'Mobilalkalmazáson keresztül működő pénzügyi szolgáltatók: devizaszámla, nemzetközi utalás, ' +
      'kártya, befektetés. Sokszor olcsók és kényelmesek, de nem mindegyik bank, és nem mindegyik magyar felügyelet alatt áll.',
    pros: [
      'Gyors, kényelmes, sokszor alacsony díjak',
      'Több devizában tarthatod a pénzed',
      'Hétköznap gyakran kedvező devizaváltás',
    ],
    cons: [
      'Ellenőrizd: van-e MNB- vagy más EU-s felügyeleti engedélye',
      'Ellenőrizd: kiterjed-e a betétre az OBA vagy egy másik ország betétbiztosítása - a nem banki szolgáltatónál nincs betétbiztosítás',
      'Nézd meg a díjakat, a devizaváltási felárat és a hétvégi felárat is',
      'Az engedélyt az MNB Intézménykeresőjében ellenőrizheted: a szolgáltató cégnevére keress, ne a márkanevére',
    ],
    risk: 'alacsony',
    sourceUrl: 'https://intezmenykereso.mnb.hu/',
    sourceName: 'MNB Intézménykereső',
  },
  {
    term: 'Freelance platform',
    fullName: 'Freelance (szabadúszó) platform',
    description:
      'Online piactér, ahol megbízók és szabadúszók találnak egymásra: programozás, grafika, fordítás, szövegírás. ' +
      'A platform közvetít, a munkát te végzed, a díjból jellemzően jutalékot von le.',
    pros: [
      'Munka mellett is lehet kis megbízásokkal kezdeni',
      'Nemzetközi megbízók, devizás bevétel',
      'Referenciát és értékeléseket gyűjthetsz',
    ],
    cons: [
      'Nézd meg a jutalékot és a kifizetési díjakat - ezek a bevételből mennek el',
      'A bevétel adóköteles: a formája (például egyéni vállalkozás) a helyzetedtől függ, a NAV oldalán nézz utána',
      'Kezdetben kevés a megbízás, a profil felépítése idő',
    ],
    risk: 'közepes',
    sourceUrl: 'https://nav.gov.hu',
    sourceName: 'NAV',
  },

  // --- Egyéb fogalmak ---
  {
    term: 'nettó',
    fullName: 'Nettó jövedelem',
    description:
      'A „kézhez kapott" összeg, amiből már levonták az adókat és járulékokat. ' +
      'A bruttó bérből kb. 33,5%-ot vonnak le (15% SZJA + 18,5% TB).',
    pros: [
      'Ezt az összeget költheted ténylegesen',
    ],
    cons: [
      'A bruttónak csak ~66,5%-a marad nettóban',
    ],
    risk: '—',
  },
  {
    term: 'infláció',
    fullName: 'Infláció (pénzromlás)',
    description:
      'Az általános árszínvonal emelkedése: ha az infláció 5%, akkor ami tavaly 1000 Ft volt, ' +
      'az idén 1050 Ft. A pénzed vásárlóereje csökken, ha nem fekteted be.',
    pros: [
      'Hitelekre „jó" (a tartozásod reálértéke csökken)',
    ],
    cons: [
      'A bankszámlán álló pénz évről évre kevesebbet ér',
      'A megtakarítás hozamának meg kell vernie az inflációt',
    ],
    risk: '—',
    sourceUrl: 'https://www.ksh.hu/stadat_inflacios-adatok',
    sourceName: 'KSH (Központi Statisztikai Hivatal)',
  },
];

/** A szövegekben a {{változók}} a heti élő adatokból kapják az értéküket (src/data/live/vars.ts) */
export const FINANCIAL_GLOSSARY: GlossaryEntry[] = fillDeep(FINANCIAL_GLOSSARY_RAW);

/**
 * Fogalom keresése a szótárban (case-insensitive).
 * Visszaadja az első találatot, vagy undefined-ot.
 */
export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
  const lower = term.toLowerCase();
  return FINANCIAL_GLOSSARY.find(
    (entry) => entry.term.toLowerCase() === lower
  );
}

/**
 * Az összes fogalom "term" értéke — regex-hez.
 * A hosszabb fogalmak előre kerülnek, hogy a regex a leghosszabb matchet találja.
 */
export function getGlossaryTermPattern(): RegExp {
  const terms = FINANCIAL_GLOSSARY
    .map((e) => e.term)
    .sort((a, b) => b.length - a.length) // hosszabb először
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // regex escape
  return new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
}
