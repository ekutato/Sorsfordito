// ============================================================================
// PENZUGYI SORSFORDITO - Knowledge Cards
// Tudas kartyak - valós magyar pénzügyi ismeretek
// ============================================================================

export interface QuizQuestion {
  /** Kerdes szovege */
  question: string;
  /** Valaszlehetosegek (3 db) */
  options: string[];
  /** A helyes valasz indexe (0-2) */
  correctIndex: number;
  /** Magyarazat a helyes valaszhoz (megjelenik valasz utan) */
  explanation: string;
}

export interface KnowledgeCard {
  id: string;
  name: string;

  /** Megszerzesi ar (0 = ingyenes, pl. online tanulas) */
  price: number;

  /** Tartos havi hatas leirasa */
  ongoingEffect: string;

  /** Tartos havi penzugyi hatas (Ft) */
  ongoingMonthlyEffect: number;

  /** Milyen mezoket modosit */
  effectTarget: string;

  /** Milyen befekteteseket / opciókat old fel */
  unlocks: string[];

  /** Valos tudasblokk (amit a jatekos tanul) */
  realWorldKnowledge: string;

  /** Valos forras URL */
  sourceUrl: string;

  /** Freemium tier */
  tier: 'free' | 'premium';

  /** Opcional: MiFID-stilusu kviz kerdesek (ha van, a vasarlas elott meg kell valaszolni) */
  quiz?: QuizQuestion[];
}

export const KNOWLEDGE_CARDS: KnowledgeCard[] = [
  {
    id: 'know-tax',
    name: 'Adóoptimalizálás 101',
    price: 80_000,
    ongoingEffect: 'Éves adó-visszaigénylés: +45 000 Ft/év (havonta ~3 750 Ft)',
    ongoingMonthlyEffect: 3_750,
    effectTarget: 'balance', // Evi egyszeri bonus, havi atlagra vetitve
    unlocks: [],
    realWorldKnowledge:
      'Családi adókedvezmény: 1 gyerek után 66 670 Ft/hó adóalap-csökkentés. ' +
      '25 év alatti fiatalok SZJA-mentessége: a bruttó átlagkereset szintjéig 0% SZJA (2026-ban évi ~8 millió Ft nagyságrendig; a pontos határt a NAV teszi közzé). ' +
      'Négy vagy több gyermekes anyák élethosszig SZJA-mentesek.',
    sourceUrl: 'https://www.nav.gov.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mennyi a személyi jövedelemadó (SZJA) mértéke Magyarországon?',
        options: ['15%', '10%', '27%'],
        correctIndex: 0,
        explanation: 'Az SZJA egységesen 15% Magyarországon. Ezen felül 18,5% társadalombiztosítási járulékot is levonnak a bruttó bérből.',
      },
      {
        question: 'Ki jogosult a 25 év alatti SZJA-mentességre?',
        options: [
          'Csak egyetemi hallgatók',
          'Minden 25 év alatti munkavállaló (a bruttó átlagbérig)',
          'Csak az első munkahelyen dolgozók',
        ],
        correctIndex: 1,
        explanation: 'Minden 25 év alatti fiatal jogosult, a bruttó átlagkereset szintjéig (2026-ban évi ~8 millió Ft nagyságrend). Ez havi 40-50 000 Ft megtakarítást jelent!',
      },
    ],
  },
  {
    id: 'know-tbsz',
    name: 'Tőzsde & TBSZ tudás',
    price: 60_000,
    ongoingEffect: 'ETF, részvény és TBSZ befektetések elérhetővé válnak (5 év után adómentes!)',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: ['inv-tbsz-etf', 'inv-stock-hu'],
    realWorldKnowledge:
      'A TBSZ (Tartós Befektetési Számla) 3 kulcsszabálya: ' +
      '1) Gyűjtőévet követő 3 év: 10% adó. 2) +2 év (összesen 5): 0% adó! ' +
      '3) Bármilyen tőzsdei termék tartható rajta (részvény, ETF, kötvény). ' +
      'FONTOS: nem a számlanyitástól, hanem a gyűjtőév végétől számít az 5 év! ' +
      'Brókerszámla nyitása: KBC, Random Capital, vagy Interactive Brokers (IBKR). ' +
      'Aranyszabály: csak azt a pénzt fektesd, amire 5+ évig nincs szükséged.',
    sourceUrl: 'https://www.bet.hu/tbsz',
    tier: 'free',
    quiz: [
      {
        question: 'Mi a TBSZ (Tartós Befektetési Számla) legfőbb előnye?',
        options: [
          'Havi fix kamatot fizet, mint a bankbetét',
          'Az állam garantálja a befektetés értékét',
          '5 év után 0% adó a teljes hozamra',
        ],
        correctIndex: 2,
        explanation: 'A TBSZ 5 év után teljesen adómentes hozamot biztosít (normálisan 15% SZJA lenne). Ez Magyarország legnagyobb befektetési adóelőnye!',
      },
      {
        question: 'Melyik állítás IGAZ az ETF-ről (tőzsdén kereskedett alap)?',
        options: [
          'Egyetlen részvénybe fektet, ezért kockázatos',
          'Egy vásárlással akár több száz cégbe fektethetsz (diverzifikáció)',
          'Csak bankban vásárolható, brókernél nem',
        ],
        correctIndex: 1,
        explanation: 'Az ETF egy teljes indexet követ (pl. S&P 500 = 500 cég). Ezzel automatikusan diverzifikálsz — kevesebb kockázat, mint egyedi részvény!',
      },
      {
        question: 'Mikor veszíthetsz pénzt a tőzsdén?',
        options: [
          'Soha, mert az ETF-ek mindig emelkednek',
          'Csak ha rossz céget választasz',
          'Bármikor rövid távon — de hosszú távon (10+ év) történelmileg emelkedett',
        ],
        correctIndex: 2,
        explanation: 'A tőzsde rövid távon ingadozik (akár -30-50% is lehet), de 10+ éves távon történelmileg mindig emelkedett (~7-10%/év). Ezért fontos a türelem!',
      },
    ],
  },
  {
    id: 'know-housing',
    name: 'Lakástámogatás-navigátor',
    price: 50_000,
    ongoingEffect: 'CSOK / Otthonteremtési kedvezmény elérhető a döntésfában',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: ['decision-csok', 'decision-home-purchase'],
    realWorldKnowledge:
      'CSOK 2026: gyerekek után járó vissza nem térítendő támogatás lakásvásárláshoz. ' +
      'Falusi CSOK: vidéki településeken magasabb összeg. ' +
      'Kamattámogatott lakáshitel: fix 3% kamat 5 évre, ha megfelelő a jövedelem. ' +
      'Babaváró hitel: max 11M Ft, 0% kamat ha 5 éven belül jön gyerek.',
    sourceUrl: 'https://www.otthonteremtesi-kedvezmeny.hu',
    tier: 'premium',
    quiz: [
      {
        question: 'Mi a CSOK Plusz lényege?',
        options: [
          'Kedvezményes lakáshitel gyermekvállalás feltételével',
          'Ingyenes lakás az államtól',
          'Visszatérítés a lakásbiztosítás díjából',
        ],
        correctIndex: 0,
        explanation: 'A CSOK Plusz kedvezményes kamatozású lakáshitelt jelent (max 3%), de feltétele a gyermekvállalás. Ha nem születik gyermek, a kedvezmény visszafizetendő!',
      },
      {
        question: 'Mennyi önerő kell lakásvásárláshoz (minimum)?',
        options: ['5%', '20%', '50%'],
        correctIndex: 1,
        explanation: 'A bankok minimum 20% önerőt várnak el. Egy 30M Ft-os lakásnál ez 6M Ft. A CSOK ezt csökkentheti, de nem pótolja teljesen!',
      },
    ],
  },
  {
    id: 'know-business',
    name: 'Vállalkozás alapok',
    price: 120_000,
    ongoingEffect: 'Online vállalkozás indítása elérhető',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: ['inv-online-biz'],
    realWorldKnowledge:
      'Egyéni vállalkozás indítása 2026-ban: online, 15 perc, ingyenes (Webes Ügysegéd). ' +
      'Átalányadó: 2026-ban 45% költséghányad (korábban 40%), évi ~39M Ft bevételig. ' +
      'KATA 2022 óta erősen korlátozott: csak magánszemélyeknek számlázóknak (pl. taxi). ' +
      'Kft. alapítás: min. 3M Ft törzstőke (pénzbeli is lehet).',
    sourceUrl: 'https://www.nav.gov.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mennyibe kerül egyéni vállalkozás indítása Magyarországon?',
        options: ['50 000 Ft', '150 000 Ft + ügyvédi díj', 'Ingyenes (online)'],
        correctIndex: 2,
        explanation: 'Egyéni vállalkozás indítása 2026-ban teljesen ingyenes, online, a Webes Ügysegéden. Kb. 15 perc az egész folyamat!',
      },
      {
        question: 'Mi az átalányadózás lényege?',
        options: [
          'Fix havi adó, összeg függetlenül a bevételtől',
          'A NAV határozza meg az adódat',
          'A bevétel egy %-a elismert költség, a maradékra fizetsz adót',
        ],
        correctIndex: 2,
        explanation: 'Az átalányadónál a bevétel 45%-a (szolgáltatás) vagy 80%-a (kereskedelem) elismert költség — nem kell számlát gyűjtened! A maradékra fizetsz 15% SZJA-t.',
      },
    ],
  },
  // know-stock összevonva know-tbsz-be (Tőzsde & TBSZ tudás)
  {
    id: 'know-insurance',
    name: 'Biztosítás-tudatosság',
    price: 0, // PENZ7 ingyenes tanulas
    ongoingEffect: 'Váratlan események (Sorsfordító) költsége –50%',
    ongoingMonthlyEffect: 0,
    effectTarget: 'fate_damage_reduction',
    unlocks: [],
    realWorldKnowledge:
      'A 3 legfontosabb biztosítás: ' +
      '1) Lakásbiztosítás: évi ~30-50E Ft, fedezi a víz-, tűz-, betöréskárt. ' +
      '2) CASCO (autóra): évi ~80-200E Ft, saját autó sérülésére. ' +
      '3) Életbiztosítás (ha van hiteled): a bank megköveteli, de a piac összehasonlítása sokat spórolhat. ' +
      'TIPP: biztositas.hu-n 5 perc alatt összehasonlíthatod az ajánlatokat.',
    sourceUrl: 'https://www.mabisz.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mit fedez a KGFB (kötelező biztosítás)?',
        options: [
          'A te autód által másoknak okozott károkat',
          'A saját autód javítási költségeit',
          'A lopáskárt és természeti károkat',
        ],
        correctIndex: 0,
        explanation: 'A KGFB kizárólag a te autód által MÁSOKNAK okozott kárt fedezi. A saját autód sérülésére CASCO biztosítás kell!',
      },
      {
        question: 'Mennyit biztosít az OBA (Betétbiztosítási Alap) személyenként és bankonként?',
        options: ['10 000 EUR', '1 000 000 EUR', '100 000 EUR'],
        correctIndex: 2,
        explanation: 'Az OBA személyenként és bankonként 100 000 EUR-ig (kb. 40M Ft) védi a bankbetétedet. Ez automatikus — nem kell külön kérni!',
      },
    ],
  },

  // ============================================================================
  // ÚJ INGYENES TUDÁSKÁRTYÁK — Tudáspróbás sorsfordítóknál hasznosulnak
  // ============================================================================

  {
    id: 'know-labor',
    name: 'Munkajog alapok',
    price: 0,
    ongoingEffect: 'Munkahelyi konfliktusok elkerülése és alkalmi munkalehetőségek',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'A Munka Törvénykönyve (Mt.) szerint: ' +
      '1) Próbaidő max. 3 hónap (kollektív szerződéssel max. 6). ' +
      '2) Felmondási idő: min. 30 nap, minden 3 ledolgozott év után +5 nap. ' +
      '3) Túlóra: +50% pótlék hétköznapon, +100% pihenőnapon. ' +
      '4) Alapszabadság: 20 nap + életkor után pótszabadság (+1-10 nap). ' +
      '5) 2026-ban a minimálbér bruttó 322 800 Ft, garantált bérminimum 373 200 Ft.',
    sourceUrl: 'https://www.munkajog.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mennyi a felmondási idő, ha a munkáltató mond fel (alapesetben)?',
        options: ['15 nap', '60 nap', '30 nap'],
        correctIndex: 2,
        explanation:
          'A felmondási idő alapesetben 30 nap. Munkáltatói felmondásnál ' +
          'a munkaviszony időtartama alapján nőhet (+5 nap minden 3 év után).',
      },
      {
        question: 'Mennyit kapsz túlórapótlékként hétköznapon?',
        options: ['50% pótlék', '25% pótlék', '100% pótlék'],
        correctIndex: 0,
        explanation:
          'Hétköznapi túlórára +50% pótlék jár. Pihenőnapon +100%, ' +
          'munkaszüneti napon +100% + alapbér. Ha nem fizetik: munkaügyi hatósághoz fordulhatsz.',
      },
      {
        question: 'Mennyi az alapszabadság Magyarországon?',
        options: ['15 munkanap', '20 munkanap', '25 munkanap'],
        correctIndex: 1,
        explanation:
          'Az alapszabadság évi 20 munkanap. Ehhez jön életkor alapján pótszabadság: ' +
          '25 év felett +1, 28 felett +2, egészen 45 felett +10 napig.',
      },
    ],
  },
  {
    id: 'know-debt',
    name: 'Adósságkezelés',
    price: 0,
    ongoingEffect: 'Adósság-átütemezési és refinanszírozási lehetőségek felismerése',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'A THM (Teljes Hiteldíj Mutató) tartalmazza az ÖSSZES költséget: kamat + díjak + biztosítás. ' +
      'Mindig a THM-et hasonlítsd, ne a kamatot! ' +
      'Jó adósság: lakáshitel (értéknövelő), diákhitel (jövőbe fektetés). ' +
      'Rossz adósság: személyi kölcsön fogyasztásra, áruházak 0%-os akciói (rejtett díjak). ' +
      'Hógolyó módszer: a legkisebb adósságot fizeted ki először (motiváció). ' +
      'Lavina módszer: a legmagasabb kamatút fizeted először (matematikailag optimális). ' +
      'MNB Zöld hitel: kedvezményes THM energiahatékony lakásra.',
    sourceUrl: 'https://www.mnb.hu/fogyasztovedelem',
    tier: 'free',
    quiz: [
      {
        question: 'Mi a THM (Teljes Hiteldíj Mutató)?',
        options: [
          'A hitel összes költsége egy %-ban (kamat + díjak + biztosítás)',
          'Csak a kamatláb százaléka',
          'A havi törlesztőrészlet összege',
        ],
        correctIndex: 0,
        explanation:
          'A THM tartalmazza a kamatot, kezelési költséget, folyósítási díjat, kötelező biztosítást – ' +
          'mindent. Két ajánlatot MINDIG THM alapján hasonlíts! Az MNB törvényben kötelezővé tette.',
      },
      {
        question: 'Melyik adósságtörlesztési stratégia a matematikailag optimális?',
        options: [
          'Hógolyó: a legkisebb adósságot fizeted először',
          'Mindegy, csak fizess valamennyit mindegyikre',
          'Lavina: a legmagasabb kamatú adósságot fizeted először',
        ],
        correctIndex: 2,
        explanation:
          'A lavina módszer a matematikailag legjobb: a legmagasabb kamatú adósságra mész rá először, ' +
          'ezzel a legkevesebb összes kamatot fizeted. A hógolyó viszont pszichológiailag motiválóbb.',
      },
    ],
  },
  {
    id: 'know-savings',
    name: 'Megtakarítás 101',
    price: 0,
    ongoingEffect: 'Vészhelyzeti kiadások csökkentett hatása (jobb felkészültség)',
    ongoingMonthlyEffect: 0,
    effectTarget: 'emergency_preparedness',
    unlocks: [],
    realWorldKnowledge:
      'A 3 alappillér: ' +
      '1) Vészhelyzeti alap: 3-6 havi kiadás, likviden (bankszámlán/rövid lekötés). ' +
      '2) 50/30/20 szabály: 50% szükségletek, 30% vágyak, 20% megtakarítás. ' +
      '3) Kamatos kamat: havi 20 000 Ft, 7% hozammal, 20 év = 10,4M Ft (4,8M befizetéssel!). ' +
      'Az OBA 100 000 EUR-ig védi a bankbetéteket személyenként és bankonként. ' +
      'A PMÁP 2026-ban kb. 6,5-7% hozamot ad, állami garanciával.',
    sourceUrl: 'https://www.oba.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mennyi vészhelyzeti alapot ajánlanak a pénzügyi szakértők?',
        options: [
          '1 havi kiadásnak megfelelő összeg',
          '12 havi kiadásnak megfelelő összeg',
          '3-6 havi kiadásnak megfelelő összeg',
        ],
        correctIndex: 2,
        explanation:
          'A legtöbb pénzügyi tanácsadó 3-6 havi kiadást ajánl. Ez fedezi a váratlan ' +
          'munkanélküliséget, betegséget, javításokat. Fontos: ez NEM befektetés – likviden tartsd!',
      },
      {
        question: 'Mi az 50/30/20 szabály?',
        options: [
          '50% szükségletek, 30% vágyak, 20% megtakarítás',
          '50% adó, 30% megtakarítás, 20% szórakozás',
          '50% lakhatás, 30% élelmiszer, 20% közlekedés',
        ],
        correctIndex: 0,
        explanation:
          'Az 50/30/20 szabály: a nettó jövedelem 50%-a szükségletekre (lakás, rezsi, étel), ' +
          '30%-a vágyakra (szórakozás, hobbi), 20%-a megtakarításra/befektetésre.',
      },
      {
        question: 'Havi 20 000 Ft megtakarítás 7% hozammal 20 év alatt kb. mennyit ér?',
        options: ['10 400 000 Ft', '7 200 000 Ft', '4 800 000 Ft'],
        correctIndex: 0,
        explanation:
          'A kamatos kamat ereje: 20 év × 12 hó × 20 000 Ft = 4,8M Ft befizetés, de a hozam ' +
          'további ~5,6M Ft-ot termel. Ez a „compound interest" – Einstein szerint a világ 8. csodája!',
      },
    ],
  },
  {
    id: 'know-digital',
    name: 'Digitális pénzügyek',
    price: 0,
    ongoingEffect: 'Digitális bevételi lehetőségek és online biztonsági tudás',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'Online bankválasztás: Wise, Revolut, OTP Simple – mindegyik más. ' +
      'Biztonsági alap: 2FA (kétfaktoros hitelesítés) MINDEN pénzügyi fiókra! ' +
      'Mobil fizetés: Apple Pay / Google Pay – a kártyaszám nincs megosztva. ' +
      'Adathalászat: soha ne kattints „banki" linkre SMS-ből vagy e-mailből! ' +
      'Az azonnali átutalás (AFR) 2024-től ingyenes és 5 mp alatt megérkezik. ' +
      'Magyar Bankszövetség: 2024-ben 12 milliárd Ft online csalási kár keletkezett.',
    sourceUrl: 'https://www.mnb.hu/fogyasztovedelem/penzugyi-tudatossag',
    tier: 'free',
    quiz: [
      {
        question: 'Mi a legfontosabb online biztonsági lépés a bankfiókoknál?',
        options: [
          'Erős jelszó és kétfaktoros hitelesítés (2FA)',
          'Csak a bank mobilappját használni',
          'Havonta jelszót cserélni',
        ],
        correctIndex: 0,
        explanation:
          'A 2FA (pl. SMS-kód, Google Authenticator, biometrikus) a legfontosabb védelmi réteg. ' +
          'Még ha a jelszavadat ellopják, a 2FA nélkül nem tudnak belépni.',
      },
      {
        question: 'Hogyan ismered fel az adathalász (phishing) SMS-t vagy e-mailt?',
        options: [
          'A bank logóját tartalmazza, tehát hiteles',
          'Ha a telefonszám magyar, akkor biztonságos',
          'Sürgős cselekvésre szólít fel és linket tartalmaz',
        ],
        correctIndex: 2,
        explanation:
          'Adathalász jellemzők: sürgősség („fiókod zárolva!"), ismeretlen link, nyelvtani hibák. ' +
          'Szabály: SOHA ne kattints banki linkre SMS-ből/e-mailből! Nyisd meg közvetlenül a bank oldalát.',
      },
    ],
  },
  {
    id: 'know-pension',
    name: 'Nyugdíj-előtakarékosság',
    price: 0,
    ongoingEffect: 'Önkéntes nyugdíjpénztári és NYESZ ismeretek',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'Önkéntes nyugdíjpénztár: a befizetés 20%-a adójóváírásként visszajön (max évi 150 000 Ft). ' +
      'NYESZ (Nyugdíj-Előtakarékossági Számla): ugyancsak 20% jóváírás. ' +
      'Az állami nyugdíj a fizetésed ~60-70%-a lesz – nem elég a jelenlegi életszínvonal fenntartására! ' +
      'Nyugdíjkorhatár: 65 év (2026-ban). ' +
      'Kamatos kamat: 25 évesen havi 15 000 Ft-ot félretéve 7%-kal, 65 évesen ~30M Ft lesz (befizetés: 7,2M Ft).',
    sourceUrl: 'https://www.mnb.hu/fogyasztovedelem/penzugyi-navigacio/megfelelo-nyugdijcelu-megtakaritas',
    tier: 'free',
    quiz: [
      {
        question: 'Mennyi adójóváírást kapsz az önkéntes nyugdíjpénztári befizetés után?',
        options: [
          '20% (max évi 150 000 Ft)',
          '10% (max évi 75 000 Ft)',
          '30% (max évi 200 000 Ft)',
        ],
        correctIndex: 0,
        explanation:
          'Az önkéntes nyugdíjpénztári befizetés 20%-a visszajár adójóváírásként, max évi 150 000 Ft. ' +
          'Ha évi 750 000 Ft-ot fizetsz be (havi ~62 500 Ft), a teljes jóváírás a tiéd!',
      },
      {
        question: 'Az állami nyugdíj kb. hány százaléka a jelenlegi fizetésednek?',
        options: ['30-40%', '60-70%', '90-100%'],
        correctIndex: 1,
        explanation:
          'A magyar állami nyugdíj átlagosan a korábbi fizetés 60-70%-a. ' +
          '400 000 Ft fizetésnél ez kb. 240-280 000 Ft lesz. Az öngondoskodás pótolja a különbséget!',
      },
    ],
  },

  // ============================================================================
  // TOVÁBBI TUDÁSKÁRTYÁK — Kripto, EU pályázatok, lakás, család, freelance, stb.
  // ============================================================================

  {
    id: 'know-crypto',
    name: 'Kriptovaluta-szabályozás',
    price: 0,
    ongoingEffect: 'Kripto adózási és szabályozási ismeretek (MiCA, SZJA)',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'MiCA (Markets in Crypto-Assets) EU szabályozás 2025. július 1-től kötelező az MNB-engedély: minden kriptoeszköz-szolgáltató engedélyköteles. ' +
      'Magyarországon az MNB felügyeli a kripto-szolgáltatókat. ' +
      'Adózás: 15% SZJA a kripto nyereségre (fiat-ra váltáskor), SZOCHO nincs. ' +
      'Kripto-kripto csere NEM adóköteles – csak a fiat-ra váltás az adózási esemény. ' +
      'DAC8/CARF adatcsere 2026-tól: a kriptoplatformok automatikusan jelentik az adóhatóságnak a tranzakciókat. ' +
      'Kötelező travel rule validálás 2025. december 27-től minden utalásnál.',
    sourceUrl: 'https://www.mnb.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mi a kriptovaluta nyereség adójának mértéke Magyarországon?',
        options: [
          '15% SZJA + 13% SZOCHO',
          '0%, mert nincs rá szabályozás',
          '15% SZJA, SZOCHO nincs',
        ],
        correctIndex: 2,
        explanation:
          'A kriptovaluta nyereségre 15% SZJA-t kell fizetni, de SZOCHO-t nem. ' +
          'Az adókötelezettség fiat-ra váltáskor keletkezik, nem kripto-kripto cserénél.',
      },
      {
        question: 'Mikor kell adót fizetni kriptovaluta után?',
        options: [
          'Minden egyes kripto-kripto csere után',
          'Csak fiat pénzre (Ft, EUR) váltáskor',
          'Évente egyszer, a portfólió értéke alapján',
        ],
        correctIndex: 1,
        explanation:
          'Magyarországon az adókötelezettség akkor keletkezik, amikor kriptovalutát fiat pénzre (pl. HUF, EUR) váltasz. ' +
          'A kripto-kripto csere (pl. BTC → ETH) NEM adóköteles esemény.',
      },
    ],
  },
  {
    id: 'know-eu-funds',
    name: 'EU-s pályázatok',
    price: 80_000,
    ongoingEffect: 'EU-s pályázati lehetőségek felismerése és pályázatírási alapok',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'Széchenyi Plusz Program (szechenyi2030.hu): 2021–2027-es EU-s fejlesztési ciklus fő kerete. ' +
      'GINOP Plusz: gazdaságfejlesztési és innovációs pályázatok KKV-knak. ' +
      'RRF (Helyreállítási és Ellenállóképességi Terv): kisebb vállalkozásoknak is elérhető EU-s források. ' +
      'Vidékfejlesztési Program (VP): agrár és vidéki vállalkozásoknak. ' +
      'Pályázatfigyelés: palyazat.gov.hu — a hivatalos magyar pályázati portál. ' +
      'Tipp: pályázatíró cégek 3-7%-ot kérnek, de sok pályázat önállóan is beadható.',
    sourceUrl: 'https://www.palyazat.gov.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Melyik a magyar kormány hivatalos pályázati portálja?',
        options: [
          'palyazat.gov.hu',
          'eu-palyazat.hu',
          'szechenyi.hu',
        ],
        correctIndex: 0,
        explanation:
          'A palyazat.gov.hu az egyetlen hivatalos portál, ahol az összes aktuális EU-s és hazai pályázat megtalálható. ' +
          'Érdemes rendszeresen figyelni az új kiírásokat!',
      },
      {
        question: 'Mi a GINOP Plusz célja?',
        options: [
          'Gazdaságfejlesztés és innováció KKV-knak',
          'Lakástámogatás magánszemélyeknek',
          'Egészségügyi fejlesztések finanszírozása',
        ],
        correctIndex: 0,
        explanation:
          'A GINOP Plusz (Gazdaságfejlesztési és Innovációs Operatív Program Plusz) kis- és középvállalkozások ' +
          'fejlesztését támogatja: digitalizáció, kapacitásbővítés, innovációs projektek.',
      },
    ],
  },
  {
    id: 'know-apartment-buying',
    name: 'Lakásvásárlási útmutató',
    price: 100_000,
    ongoingEffect: 'Lakásvásárlási folyamat és költségek ismerete',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'Minimum 20% önerő szükséges a banki hitelhez. Foglaló: általában a vételár 10%-a (jogi kötőerővel bír). ' +
      'Energetikai tanúsítvány: 2026-ban kötelező minden adásvételnél. ' +
      'Ügyvéd + közjegyző szükséges a szerződés érvényességéhez. ' +
      'Tulajdoni lap ellenőrzés: e-hiteles.hu-n online elérhető, ~3 600 Ft. ' +
      'Földhivatali bejegyzés: kb. 6-12 hét az átírás. ' +
      'Illeték: 4% visszterhes vagyonátruházási illeték. 35 év alattiak 35M Ft-ig illetékmentesek (első lakás).',
    sourceUrl: 'https://www.nav.gov.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mekkora a foglaló általában lakásvásárlásnál?',
        options: ['A vételár 10%-a', 'A vételár 5%-a', 'A vételár 20%-a'],
        correctIndex: 0,
        explanation:
          'A foglaló általában a vételár 10%-a. Ha a vevő áll el, elveszíti a foglalót. ' +
          'Ha az eladó áll el, a foglaló kétszeresét kell visszafizetnie.',
      },
      {
        question: 'Minimum mennyi önerő kell lakáshitelhez?',
        options: ['10%', '20%', '30%'],
        correctIndex: 1,
        explanation:
          'A bankok minimum 20% önerőt várnak el. Egy 40M Ft-os lakásnál ez 8M Ft saját pénz. ' +
          'Egyes programok (pl. CSOK Plusz) csökkenthetik az effektív önerő-szükségletet.',
      },
      {
        question: 'Mennyi a lakásvásárlási illeték mértéke?',
        options: ['2%', '6%', '4%'],
        correctIndex: 2,
        explanation:
          'A visszterhes vagyonátruházási illeték 4%. 35 év alatti első lakásvásárlók 35M Ft forgalmi értékig ' +
          'illetékmentességet kapnak. Felette a teljes összeg után kell fizetni.',
      },
    ],
  },
  {
    id: 'know-csok',
    name: 'CSOK és családtámogatások',
    price: 0,
    ongoingEffect: 'Családtámogatási programok és kedvezményes hitelek ismerete',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'CSOK Plusz (2024-től): kedvezményes lakáshitel max 3% kamattal. ' +
      '1 gyerekre max 15M Ft, 2 gyerekre 30M Ft, 3+ gyerekre 50M Ft hitelkeret. ' +
      'Babaváró hitel: 11M Ft, 0% kamat, ha 5 éven belül születik gyerek. ' +
      'Feltételek: házasság, a nő max 40 éves, minimum 3 év TB jogviszony. ' +
      'Gyermekenként 10M Ft elengedés a 2. gyerektől. ' +
      'Otthon Start (első lakás): max 50M Ft, fix 3% kamat.',
    sourceUrl: 'https://www.otthonteremtesi-kedvezmeny.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mekkora a CSOK Plusz maximális hitelösszege 3 vagy több gyerek esetén?',
        options: ['50M Ft', '30M Ft', '80M Ft'],
        correctIndex: 0,
        explanation:
          'A CSOK Plusz 3 vagy több gyermeknél max 50M Ft kedvezményes hitelt nyújt, legfeljebb 3%-os kamattal. ' +
          '1 gyereknél 15M, 2-nél 30M Ft a felső határ.',
      },
      {
        question: 'Mekkora a Babaváró hitel összege?',
        options: ['5M Ft', '11M Ft', '15M Ft'],
        correctIndex: 1,
        explanation:
          'A Babaváró hitel 11M Ft, 0% kamattal — ha 5 éven belül születik gyerek. ' +
          'A 2. gyerektől 10M Ft-ot elengednek a tőkéből. Házasság és 3 év TB jogviszony a feltétel.',
      },
    ],
  },
  {
    id: 'know-freelance',
    name: 'Szabadfoglalkozású adózás',
    price: 60_000,
    ongoingEffect: 'Egyéni vállalkozási és adózási formák ismerete, freelance platform elérhető',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: ['inv-freelance-platform'],
    realWorldKnowledge:
      'KATA 2022 óta: csak magánszemélyeknek számlázók használhatják, havi 50 000 Ft tételes adó, max 18M Ft/év bevétel. ' +
      'Átalányadó 2026: 45% költséghányad (szolgáltatás), 80% (kereskedelem), max ~39M Ft/év bevételig. ' +
      'Kft. alapítás: minimum 3M Ft törzstőke (pénzbeli is lehet). ' +
      'Számlázás: szamlazz.hu, billingo.hu — mindkettő NAV Online Számla kompatibilis. ' +
      'EV (egyéni vállalkozás) indítása: ingyenes, online, kb. 15 perc a Webes Ügysegéden.',
    sourceUrl: 'https://www.nav.gov.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Ki használhatja a KATA-t 2022 óta?',
        options: [
          'Bármelyik vállalkozó korlátozás nélkül',
          'Csak magánszemélyeknek számlázók (pl. taxisok, fodrászok)',
          'Csak Kft.-k 50M Ft árbevételig',
        ],
        correctIndex: 1,
        explanation:
          'A KATA 2022-es módosítás óta kizárólag azoknak érhető el, akik csak magánszemélyeknek számláznak. ' +
          'Cégeknek számlázni nem lehet KATA-s vállalkozóként.',
      },
      {
        question: 'Mennyi a költséghányad átalányadónál szolgáltatások esetén (2026)?',
        options: ['30%', '80%', '45%'],
        correctIndex: 2,
        explanation:
          'Szolgáltatási tevékenységnél 45% a költséghányad (2026-ban). ' +
          'Kereskedelmi tevékenységnél 80%. A maradékra fizeted a 15% SZJA-t és a TB járulékot.',
      },
    ],
  },
  {
    id: 'know-invest-psychology',
    name: 'Befektetési pszichológia',
    price: 0,
    ongoingEffect: 'Negatív befektetési sorsfordítók hatása csökken (tudatosabb döntéshozatal)',
    ongoingMonthlyEffect: 0,
    effectTarget: 'fate_damage_reduction',
    unlocks: [],
    realWorldKnowledge:
      'Veszteségkerülés (loss aversion): a veszteség ~2× fájdalmasabb, mint az azonos méretű nyereség öröme. ' +
      'FOMO (Fear of Missing Out): félelem a kimaradástól → kapkodó, átgondolatlan döntések (pl. mém-coinok vásárlása csúcson). ' +
      'Sunk cost fallacy: ne ragaszkodj egy rossz befektetéshez csak azért, mert már sokat költöttél rá! ' +
      'DCA (Dollar Cost Averaging): rendszeres fix összeg befektetés — kiátlagolja a piaci ingadozásokat. ' +
      'Anchoring bias: az első szám, amit hallasz, befolyásolja az ítéletedet (pl. „régen 50M volt ez a lakás").',
    sourceUrl: 'https://www.investopedia.com/behavioral-finance-4689777',
    tier: 'free',
    quiz: [
      {
        question: 'Mi a FOMO a befektetési pszichológiában?',
        options: [
          'Félelem a kimaradástól — kapkodó vásárlás, mert „mindenki csinálja"',
          'Egy befektetési alap neve',
          'Fix havi összeg befektetési stratégia',
        ],
        correctIndex: 0,
        explanation:
          'A FOMO (Fear of Missing Out) kapkodó, érzelmi döntésekhez vezet. Tipikus jel: „most kell venni, mert holnap drágább lesz!" ' +
          'Aranyszabály: ha FOMO érzés hajt, állj meg és gondolkodj!',
      },
      {
        question: 'Mi a DCA (Dollar Cost Averaging) stratégia lényege?',
        options: [
          'Egyszerre a lehető legtöbb pénzt befektetni',
          'Rendszeres fix összeg befektetése időszakonként',
          'Mindig a legolcsóbb részvényt megvenni',
        ],
        correctIndex: 1,
        explanation:
          'A DCA-nál rendszeresen (pl. havonta) fix összeget fektetsz be, függetlenül az aktuális árfolyamtól. ' +
          'Drágán kevesebbet, olcsón többet veszel — kiátlagolva csökkented a kockázatot.',
      },
      {
        question: 'Mi a sunk cost fallacy (elsüllyedt költség tévedés)?',
        options: [
          'Egy rossz befektetésnél eladni, mielőtt nagyobb a veszteség',
          'A befektetési díjak figyelmen kívül hagyása',
          'Ragaszkodás egy rossz befektetéshez, mert „már ennyit költöttem rá"',
        ],
        correctIndex: 2,
        explanation:
          'A sunk cost fallacy: tovább tartasz egy veszteséges pozíciót, mert „nem akarod elfogadni a veszteséget". ' +
          'A helyes kérdés: „Ha ma nulláról indulnék, megvenném-e ezt?" Ha nem → el kell adni.',
      },
    ],
  },
  {
    id: 'know-inflation',
    name: 'Infláció és értékmegőrzés',
    price: 0,
    ongoingEffect: 'Inflációs hatások megértése és reálhozam-számítási képesség',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'Magyar CPI-t (fogyasztói árindex) a KSH méri. Inflációs történet: 2022: 24,5% (csúcs), 2023: 17,6%, 2024: ~3,7%, 2025: 4,4%. ' +
      'Reálhozam képlet: nominális hozam – infláció. Ha 7% hozam és 4% infláció → 3% reálhozam. ' +
      'Inflációvédelem eszközei: ' +
      'PMÁP (Prémium Magyar Állampapír): inflációkövető kamat + prémium. ' +
      'Ingatlan: hosszú távon általában tartja az értékét. ' +
      'Arany: hagyományos inflációvédelem, de hozamot nem fizet. ' +
      'Részvény: hosszú távon (10+ év) megveri az inflációt.',
    sourceUrl: 'https://www.ksh.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mi a reálhozam?',
        options: [
          'A nominális hozam mínusz az infláció',
          'A nominális hozam és az infláció összege',
          'Az infláció mínusz a nominális hozam',
        ],
        correctIndex: 0,
        explanation:
          'Reálhozam = nominális hozam – infláció. Ha a bankbetéted 7%-ot fizet, de az infláció 4%, ' +
          'a valódi vásárlóerő-növekedésed csak 3%. Mindig reálhozamban gondolkodj!',
      },
      {
        question: 'Melyik eszköz véd legjobban az infláció ellen Magyarországon?',
        options: [
          'Folyószámlán tartott pénz',
          'PMÁP (inflációkövető állampapír) vagy ingatlan',
          'Rövid lejáratú bankbetét',
        ],
        correctIndex: 1,
        explanation:
          'A PMÁP kamat automatikusan követi az inflációt (+ prémium), így garantált a reálhozam. ' +
          'Az ingatlan hosszú távon szintén jó inflációvédelem. A folyószámlán a pénz reálértéke fogy!',
      },
    ],
  },
  {
    id: 'know-insurance-advanced',
    name: 'Biztosítási termékek (haladó)',
    price: 90_000,
    ongoingEffect: 'Haladó biztosítási ismeretek és egészségpénztár elérhető',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: ['inv-health-fund'],
    realWorldKnowledge:
      'Unit-linked biztosítás: befektetési elemmel kombinált biztosítás — magas díj, nem garantált hozam. ' +
      'Hagyományos életbiztosítás: garantált összeg halál esetén, de alacsony hozam. ' +
      'Egészségpénztár: a befizetés 20%-a adójóváírásként visszajön (max 150 000 Ft/év). ' +
      'Felhasználható: gyógyszer, szemüveg, fogorvos, magánorvos, gyógytorna. ' +
      'Utasbiztosítás: EU-ban az EBK (Európai Betegbiztosítási Kártya) ingyen, de csak alap ellátás. ' +
      'EU-n kívül kötelező magán utasbiztosítás (kb. 500–2 000 Ft/nap).',
    sourceUrl: 'https://www.mabisz.hu',
    tier: 'premium',
    quiz: [
      {
        question: 'Mi a unit-linked biztosítás fő problémája?',
        options: [
          'Nem nyújt biztosítási védelmet',
          'Csak 65 év felettiek köthetik',
          'Magas díjak és nem garantált hozam',
        ],
        correctIndex: 2,
        explanation:
          'A unit-linked biztosítás ötvözi a biztosítást és a befektetést, de mindkettőből a rosszabbat kapod: ' +
          'magas alapkezelési díj (2-5%/év) és nem garantált a hozam. Általában olcsóbb külön biztosítást + ETF-et venni.',
      },
      {
        question: 'Mennyi adójóváírást kapsz egészségpénztári befizetés után?',
        options: [
          '10% (max 75 000 Ft/év)',
          '20% (max 150 000 Ft/év)',
          '30% (max 200 000 Ft/év)',
        ],
        correctIndex: 1,
        explanation:
          'Az egészségpénztári befizetés 20%-a visszajár adójóváírásként, évi max 150 000 Ft. ' +
          'Ha évi 750 000 Ft-ot fizetsz be, a teljes kedvezményt kihasználod. Gyógyszerre, fogorvosra is jó!',
      },
    ],
  },
  {
    id: 'know-car-finance',
    name: 'Autófinanszírozás',
    price: 0,
    ongoingEffect: 'Autótartás valós költségeinek és finanszírozási lehetőségek ismerete',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'Autó TCO (Total Cost of Ownership) éves szinten: ' +
      'vételár + KGFB (~80-120k Ft/év) + CASCO (opcionális, 80-300k Ft/év) + üzemanyag (~25-40k Ft/hó) + ' +
      'szerviz (~12k Ft/hó átlag) + parkolás + értékcsökkenés (évente 10-15%). ' +
      'Lízing vs hitel: a lízing havi törlesztője alacsonyabb, de a futamidő végén nem a tiéd az autó (zárt végű lízingnél maradványérték). ' +
      'THM összehasonlítás kötelező minden ajánlatnál! ' +
      'Használt autó vásárlás: műszaki vizsga + előélet-ellenőrzés (carvertical.com, totalcar.hu).',
    sourceUrl: 'https://www.mnb.hu/fogyasztovedelem',
    tier: 'free',
    quiz: [
      {
        question: 'Mi a különbség a KGFB és a CASCO között?',
        options: [
          'A KGFB a másoknak okozott kárt fedezi, a CASCO a saját autódat',
          'A KGFB a saját autód sérülését fedezi, a CASCO másokét',
          'Nincs különbség, ugyanaz más néven',
        ],
        correctIndex: 0,
        explanation:
          'A KGFB (kötelező gépjármű-felelősségbiztosítás) a te autód által MÁSOKNAK okozott kárt fedezi. ' +
          'A CASCO a SAJÁT autód sérülését, lopását, természeti kárait. A KGFB kötelező, a CASCO opcionális.',
      },
      {
        question: 'Kb. mennyibe kerül egy átlagos autó tartása évente (TCO)?',
        options: [
          '200-400 ezer Ft',
          '1-1,5 millió Ft',
          '3-4 millió Ft',
        ],
        correctIndex: 1,
        explanation:
          'Egy átlagos autó éves TCO-ja 1-1,5M Ft: KGFB (~100k) + üzemanyag (~360k) + szerviz (~144k) + ' +
          'értékcsökkenés (~300-500k) + egyéb (parkolás, mosás, gumi). Havi szinten ez 80-125k Ft!',
      },
    ],
  },
  {
    id: 'know-real-estate',
    name: 'Ingatlanbefektetés',
    price: 120_000,
    ongoingEffect: 'Ingatlan befektetési ismeretek és bérbeadási lehetőség elérhető',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: ['inv-rental-apartment'],
    realWorldKnowledge:
      'Bérleti hozam számítás: éves bérleti díj / vételár × 100. Budapest átlag: 4-6%. ' +
      'Adózás: 15% SZJA a bérleti bevételre (10% költségátalány vagy tételes költségelszámolás). ' +
      '5 éves szabály: ha 5 éven belül eladod az ingatlant, a nyereségre 15% SZJA-t fizetsz. 5 év felett: 0%. ' +
      'Airbnb szabályozás: NTAK (Nemzeti Turisztikai Adatszolgáltató Központ) regisztráció kötelező, helyi IFA adó. ' +
      'Felújítás ROI: energetikai korszerűsítés (napelem, szigetelés) növeli az értéket és csökkenti a rezsit.',
    sourceUrl: 'https://www.nav.gov.hu',
    tier: 'premium',
    quiz: [
      {
        question: 'Hogyan számolod ki a bérleti hozamot?',
        options: [
          'Havi bérleti díj / vételár × 100',
          'Éves bérleti díj / vételár × 100',
          'Vételár / éves bérleti díj × 100',
        ],
        correctIndex: 1,
        explanation:
          'Bérleti hozam = éves bérleti díj / vételár × 100. Pl. ha 200 000 Ft/hó bérleti díjat kapsz egy 50M Ft-os lakásért: ' +
          '(200 000 × 12) / 50 000 000 × 100 = 4,8%. Budapest átlag: 4-6%.',
      },
      {
        question: 'Mi az ingatlan eladásának 5 éves szabálya?',
        options: [
          '5 éven belül eladva 15% SZJA a nyereségre, 5 év felett 0%',
          '5 évig nem adhatod el a lakásodat',
          '5 év után 50% adókedvezményt kapsz',
        ],
        correctIndex: 0,
        explanation:
          'Ha az ingatlan vásárlásától számítva 5 éven belül adsz el, a nyereségre 15% SZJA-t fizetsz. ' +
          '5 év elteltével a nyereség teljesen adómentes. Érdemes kivárni!',
      },
    ],
  },
  {
    id: 'know-inheritance-law',
    name: 'Öröklési jog alapok',
    price: 0,
    ongoingEffect: 'Öröklési illetékek és hagyatéki eljárás ismerete',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: [],
    realWorldKnowledge:
      'Egyenesági rokon (szülő, nagyszülő, gyerek, unoka): 0% öröklési illeték! ' +
      'Oldalági rokon (testvér, nagybácsi, unokatestvér): 18% illeték. Nem rokon: 18%. ' +
      'Hagyatéki eljárás: közjegyző vezeti, általában 6-12 hónap. ' +
      'Ingatlan átírás költsége: ügyvéd + földhivatali díj összesen kb. 150-300k Ft. ' +
      'Végrendelet: 2 tanú szükséges (írásbeli magánvégrendelet), vagy közjegyzői okirat (biztonságosabb, ~30-50k Ft). ' +
      'Kötelesrész: a törvényes örökrész fele mindenképp jár az egyenesági rokonnak és házastársnak.',
    sourceUrl: 'https://www.nav.gov.hu',
    tier: 'free',
    quiz: [
      {
        question: 'Mennyi az öröklési illeték egyenesági rokonok között (szülő → gyerek)?',
        options: ['9%', '0%', '18%'],
        correctIndex: 1,
        explanation:
          'Egyenesági rokonok (szülő, nagyszülő, gyerek, unoka) között az öröklési illeték 0%! ' +
          'Oldalági rokonoknál (testvér, nagybácsi) és nem rokonoknál viszont 18%.',
      },
      {
        question: 'Ki vezeti a hagyatéki eljárást Magyarországon?',
        options: ['Bíróság', 'Ügyvéd', 'Közjegyző'],
        correctIndex: 2,
        explanation:
          'A hagyatéki eljárást közjegyző vezeti le. Az eljárás általában 6-12 hónapig tart. ' +
          'Ha vita van az örökösök között, a közjegyző a bírósághoz utalja az ügyet.',
      },
    ],
  },
  {
    id: 'know-eu-travel',
    name: 'Külföldi munka és pénzügy',
    price: 50_000,
    ongoingEffect: 'Külföldi munkavállalási és pénzügyi ismeretek, távmunka lehetőség elérhető',
    ongoingMonthlyEffect: 0,
    effectTarget: 'none',
    unlocks: ['inv-remote-eur'],
    realWorldKnowledge:
      'EU szabad munkavállalás: bármely EU-tagállamban dolgozhatsz engedély nélkül. ' +
      '183 napos szabály: ha egy naptári évben 183+ napot tartózkodsz egy országban, ott adózol. ' +
      'Kettős adóztatás elkerülése: Magyarország 80+ országgal kötött egyezményt. ' +
      'Wise / Revolut: olcsó nemzetközi utalás (bankközi árfolyam, ~0,5% díj vs bank 2-4%). ' +
      'Nyugdíj összeszámítás: S1 nyomtatvánnyal az EU-s TB jogviszonyok összeadódnak a nyugdíjhoz. ' +
      'Külföldi munkabér: a nettó magasabb lehet, de az életköltség (lakás, élelmiszer) is lényegesen magasabb!',
    sourceUrl: 'https://eures.ec.europa.eu',
    tier: 'premium',
    quiz: [
      {
        question: 'Mi a 183 napos szabály lényege?',
        options: [
          'Ha 183+ napot töltesz egy országban, ott kell adóznod',
          'Ennyi nap szabadság jár évente az EU-ban',
          'Ennyi napig dolgozhatsz külföldön vízum nélkül',
        ],
        correctIndex: 0,
        explanation:
          'A 183 napos szabály: ha egy naptári évben 183+ napot töltesz egy adott országban, ' +
          'ott keletkezik adókötelezettséged. Ez a kettős adóztatás elkerülésének alapszabálya.',
      },
      {
        question: 'Melyik szolgáltatás a legolcsóbb nemzetközi utalásra?',
        options: [
          'Hagyományos banki átutalás',
          'Western Union',
          'Wise vagy Revolut',
        ],
        correctIndex: 2,
        explanation:
          'A Wise és Revolut bankközi árfolyamon váltanak, ~0,5% díjjal. A hagyományos bankok 2-4% spread-et számolnak, ' +
          'plusz átutalási díjat. Rendszeres külföldi bevételnél évi 100 000+ Ft-ot spórolhatsz.',
      },
    ],
  },
];

export const FREE_KNOWLEDGE = KNOWLEDGE_CARDS.filter((k) => k.tier === 'free');
export const PREMIUM_KNOWLEDGE = KNOWLEDGE_CARDS.filter((k) => k.tier === 'premium');
