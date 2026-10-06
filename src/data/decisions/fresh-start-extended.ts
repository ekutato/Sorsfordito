// ============================================================================
// PENZUGYI SORSFORDITO - Fresh Start Decision Tree (Marathon/Ultra Mode)
// 18→23 eves, Zsófi fejlődése - 13-20. kör döntésfája
// ============================================================================

import type { DecisionCard } from '@/types/game';

/**
 * "Zsófi felnő" döntésfája - Maraton/Ultra mód (13-20. kör)
 *
 * Fő ágak:
 *   1. Egyetem befejezése (13-14. kör) - MA/munka/gap year
 *   2. Első igazi munka (15-16. kör) - multi/KKV/startup
 *   3. Önálló élet (17. kör) - albérlet/lakáshitel/lakótárs
 *   4. Párkapcsolati pénzügyek (18-19. kör) - közös/proporcionális/külön
 *   5. Karrierugrás (20. kör) - MBA/iparágváltás/vezetői pozíció
 */

export const FRESH_START_EXTENDED_DECISIONS: DecisionCard[] = [

  // ===================================================================
  // 1. SZAKASZ: EGYETEM BEFEJEZÉSE (13-14. kör)
  // ===================================================================

  {
    id: 'fs-ext-01',
    category: 'Pályaválasztás',
    title: 'Egyetem befejezése',
    situation:
      'Már 2+ éve tanulsz és/vagy dolgozol. Az alapképzésed végéhez közeledik, ' +
      'vagy már munkatapasztalatot szereztél. Az egyenleged: {{balance}} Ft. ' +
      'Mi legyen a következő lépés? A döntés hosszú távon meghatározza a karriered.',
    dynamicVariables: {
      balance: 'player.balance',
    },
    options: [
      {
        id: 'fs-ext-01-a',
        label: 'Mesterképzés (MA/MSc)',
        description:
          'Folytatod az egyetemet mesterszakon. Még 2 év tanulás, ösztöndíjból élsz. ' +
          'A tandíj és tankönyvek ~100 000 Ft-ba kerülnek, de a diplomás bér magasabb lesz. ' +
          'Befektetés a jövőbe – ha kitartasz.',
        financialEffects: [
          { target: 'balance', amount: -100_000, description: 'Tandíj és tankönyvek' },
        ],
        didYouKnow:
          'Magyarországon a mesterszakos diplomások átlagosan 25-35%-kal többet keresnek, mint az alapszakosok. ' +
          'A legtöbb állami ösztöndíjas helyen a tandíj 0 Ft – de a ponthatár magas!',
      },
      {
        id: 'fs-ext-01-b',
        label: 'Belépés a munkaerőpiacra',
        description:
          'Elég volt a tanulásból! Pályakezdőként keresel munkát: nettó ~280 000 Ft/hó. ' +
          'Végre saját bevétel, de a munkahelyre járás is pénzbe kerül.',
        financialEffects: [
          { target: 'salary', amount: 280_000, description: 'Pályakezdő nettó fizetés' },
          { target: 'transport', amount: 15_000, description: 'Munkába járás költsége' },
        ],
        didYouKnow:
          'A KSH szerint a friss diplomások átlagos nettó keresete ~300 000 Ft/hó (2025). ' +
          'Az első munkahelyen a legfontosabb a tapasztalatszerzés – ne csak a fizetést nézd!',
      },
      {
        id: 'fs-ext-01-c',
        label: 'Gap year külföldön',
        description:
          'Egy évet külföldön töltesz: Work & Travel, au pair, vagy Erasmus+. ' +
          'A kiutazás és berendezkedés ~400 000 Ft, de alkalmi munkákból EUR-ban keresel (+50 000 Ft/hó). ' +
          'Nyelvet tanulsz, világot látsz – és más szemmel jössz vissza.',
        financialEffects: [
          { target: 'balance', amount: -400_000, description: 'Kiutazás és berendezkedés költségei' },
          { target: 'salary', amount: 50_000, description: 'Alkalmi munka EUR-ban (HUF átváltva)' },
        ],
        unlocksKnowledge: ['know-eu-travel'],
        didYouKnow:
          'Az Erasmus+ ösztöndíj havi 400-600 EUR-t fizet (célország függő). ' +
          'A külföldi tapasztalat a magyar munkaerőpiacon átlagosan 15-20%-os bérelőnyt jelent a visszatérés után.',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [13, 14],
  },

  // ===================================================================
  // 2. SZAKASZ: ELSŐ IGAZI MUNKA (15-16. kör)
  // ===================================================================

  {
    id: 'fs-ext-02',
    category: 'Karrier',
    title: 'Első igazi munka',
    situation:
      'Munkát keresel vagy váltanál. Három nagyon különböző lehetőség van előtted. ' +
      'Mindegyiknek megvan az előnye és a hátránya. Egyenleged: {{balance}} Ft. ' +
      'Milyen munkahelyet választasz?',
    dynamicVariables: {
      balance: 'player.balance',
    },
    options: [
      {
        id: 'fs-ext-02-a',
        label: 'Multinacionális cég',
        description:
          'Stabil, jól fizető multi (autóipar, pénzügyi szolgáltatás, IT stb.). ' +
          'Nettó ~350 000 Ft/hó + cafeteria. De a bejárás drágább, és dress code is van.',
        financialEffects: [
          { target: 'salary', amount: 350_000, description: 'Multinacionális nettó fizetés' },
          { target: 'transport', amount: 20_000, description: 'Bejárás az irodába' },
          { target: 'other', amount: 15_000, description: 'Dress code és megjelenés' },
        ],
        didYouKnow:
          'A multik cafeteria-kerete évi 400-800 000 Ft, ami adóoptimalizált juttatás (SZÉP-kártya, egészségpénztár). ' +
          'Ez havi 30-60 000 Ft extra – kérdezd meg az interjún!',
      },
      {
        id: 'fs-ext-02-b',
        label: 'Magyar KKV',
        description:
          'Kisebb magyar cég: nettó ~280 000 Ft/hó. Kevesebb pénz, de rugalmasabb munkaidő, ' +
          'közvetlenebb főnök, és szélesebb feladatkör – gyorsabban tanulsz.',
        financialEffects: [
          { target: 'salary', amount: 280_000, description: 'KKV nettó fizetés' },
          { target: 'transport', amount: 10_000, description: 'Közeli munkahely' },
        ],
        didYouKnow:
          'A magyar KKV-k a GDP 50%-át adják és a foglalkoztatottak 70%-át alkalmazzák. ' +
          'Egy kisebb cégben 2-3 év alatt vezető lehetsz – egy multinál ez 5-8 év.',
      },
      {
        id: 'fs-ext-02-c',
        label: 'Startup',
        description:
          'Egy induló vállalkozáshoz csatlakozol: nettó ~250 000 Ft/hó, de részvényopciót kapsz. ' +
          'Ha beindul a cég: nagy nyereség. Ha nem: tapasztalat és tanulság.',
        financialEffects: [
          { target: 'salary', amount: 250_000, description: 'Startup fizetés' },
        ],
        unlocksInvestment: ['inv-online-biz'],
        didYouKnow:
          'A startupok 90%-a elbukik, de a maradék 10% extrém hozamot ad. ' +
          'A részvényopció (ESOP) csak akkor ér valamit, ha a cég „exitál" (eladják vagy tőzsdére viszik).',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [15, 16],
  },

  // ===================================================================
  // 3. SZAKASZ: ÖNÁLLÓ ÉLET (17. kör)
  // ===================================================================

  {
    id: 'fs-ext-03',
    category: 'Lakhatás',
    title: 'Önálló élet',
    situation:
      'Elég volt a szülőknél vagy kollégiumban lakásból? A bevételed stabil, ' +
      'az egyenleged: {{balance}} Ft. Ideje önállósodni – de hogyan?',
    dynamicVariables: {
      balance: 'player.balance',
    },
    options: [
      {
        id: 'fs-ext-03-a',
        label: 'Egyedül albérletbe',
        description:
          'Saját kis lakás: kaució + első havi díj ~400 000 Ft. ' +
          'Havi albérlet ~180 000 Ft, rezsi ~35 000 Ft. Teljes szabadság, de drága.',
        financialEffects: [
          { target: 'balance', amount: -400_000, description: 'Kaució + költözés' },
          { target: 'housing', amount: 180_000, description: 'Albérleti díj (egyedül)' },
          { target: 'utilities', amount: 35_000, description: 'Rezsi (víz, gáz, áram, net)' },
        ],
        didYouKnow:
          'Budapesten az átlagos albérletár most {{rent_bp}} Ft/hó - a garzonok ennél olcsóbbak. ' +
          'A kaució általában 2 havi díj – ezt visszakapod, ha rendben hagyod a lakást. Mindig kérj írásos szerződést!',
      },
      {
        id: 'fs-ext-03-b',
        label: 'CSOK Plusz lakáshitel (ha van pár)',
        description:
          'Ha stabil párkapcsolatban vagy, a CSOK Plusz kamattámogatott hitelt ad. ' +
          'Önerő: ~500 000 Ft, havi törlesztő: ~100 000 Ft. Saját lakás – de hosszú elköteleződés.',
        financialEffects: [
          { target: 'balance', amount: -500_000, description: 'Önerő (CSOK Plusz)' },
          { target: 'loanPayments', amount: 100_000, description: 'Lakáshitel törlesztő (CSOK Plusz)' },
        ],
        didYouKnow:
          'A CSOK Plusz 2024-től elérhető: max 3% kamat, 1 gyermeknél 15M, 2-nél 30M, 3-nál 50M Ft hitel. ' +
          '2. gyerektől 10M Ft tartozáselengedés! Feltétel: házasság, nő max 40 év, 2 év TB.',
      },
      {
        id: 'fs-ext-03-c',
        label: 'Lakótársakkal közösen',
        description:
          'Megosztott lakás 1-2 lakótárssal. Kaució: ~250 000 Ft, havi bérleti díj: ~110 000 Ft, ' +
          'rezsi: ~18 000 Ft (megosztva). Olcsóbb, társaságos – de kompromisszumokkal jár.',
        financialEffects: [
          { target: 'balance', amount: -250_000, description: 'Kaució + költözés (megosztva)' },
          { target: 'housing', amount: 110_000, description: 'Albérleti díj (megosztva)' },
          { target: 'utilities', amount: 18_000, description: 'Rezsi (megosztva)' },
        ],
        didYouKnow:
          'A lakótársi együttélésnél a leggyakoribb konfliktusforrás a pénz. ' +
          'Tipp: közös számla a rezsire, ahova mindenki fix összeget utal – és írásos megállapodás a költségekről!',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [17],
  },

  // ===================================================================
  // 4. SZAKASZ: PÁRKAPCSOLATI PÉNZÜGYEK (18-19. kör)
  // ===================================================================

  {
    id: 'fs-ext-04',
    category: 'Életmód',
    title: 'Párkapcsolati pénzügyek',
    situation:
      'Stabil párkapcsolatban vagy, és egyre többet vagytok együtt. ' +
      'Felmerül a kérdés: hogyan kezeljétek a közös kiadásokat? ' +
      'A havi bevételed: {{income}} Ft, az egyenleged: {{balance}} Ft.',
    dynamicVariables: {
      balance: 'player.balance',
      income: 'player.income.salary',
    },
    options: [
      {
        id: 'fs-ext-04-a',
        label: 'Közös kassza',
        description:
          'Minden bevétel egy közös számlára megy, onnan költötök. ' +
          'A lakhatás, élelmiszer és egyéb kiadások megosztva olcsóbbak.',
        financialEffects: [
          { target: 'housing', amount: -25_000, description: 'Megosztott lakhatás' },
          { target: 'food', amount: -10_000, description: 'Közös bevásárlás és főzés' },
          { target: 'other', amount: -5_000, description: 'Közös előfizetések' },
        ],
        didYouKnow:
          'A közös kassza a legegyszerűbb rendszer, de a legtöbb konfliktust okozza, ' +
          'ha nincs megegyezés a költési szokásokról. Tipp: legyen egy „személyes keret" is mindkettőtöknek!',
      },
      {
        id: 'fs-ext-04-b',
        label: 'Proporcionális megosztás',
        description:
          'Ki-ki a jövedelme arányában járul hozzá a közös kiadásokhoz. ' +
          'Ha te 60%-ot keresel, te fizeted a közös költségek 60%-át. Igazságos és átlátható.',
        financialEffects: [
          { target: 'other', amount: -8_000, description: 'Arányos költségmegosztás megtakarítás' },
        ],
        didYouKnow:
          'A proporcionális megosztás a pénzügyi tanácsadók szerint a legfenntarthatóbb modell. ' +
          'Egy egyszerű közös költségmegosztó táblázat segít nyomon követni a kiadásokat.',
      },
      {
        id: 'fs-ext-04-c',
        label: 'Teljesen külön pénzügyek',
        description:
          'Mindenki a sajátját kezeli: külön számla, külön költségvetés. ' +
          'A közös kiadásokat felváltva vagy felezve fizetik. Több adminisztráció, de teljes függetlenség.',
        financialEffects: [
          { target: 'other', amount: 5_000, description: 'Dupla adminisztráció és párhuzamos előfizetések' },
        ],
        didYouKnow:
          'A magyar párok 40%-a teljesen közösen kezeli a pénzügyeit, 35%-a részben közösen, ' +
          'és 25%-a teljesen külön. Nincs egyetlen jó megoldás – a lényeg, hogy beszéljetek róla!',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [18, 19],
  },

  // ===================================================================
  // 5. SZAKASZ: KARRIERUGRÁS (20. kör)
  // ===================================================================

  {
    id: 'fs-ext-05',
    category: 'Karrier',
    title: 'Karrierugrás',
    situation:
      'Öt év munkatapasztalattal a hátad mögött elérkeztél egy fordulóponthoz. ' +
      'Az egyenleged: {{balance}} Ft, a nettó vagyonod: {{netWorth}} Ft. ' +
      'Mit lépsz? A döntés meghatározza a következő évtizedet.',
    dynamicVariables: {
      balance: 'player.balance',
      netWorth: 'player.computed.netWorth',
    },
    options: [
      {
        id: 'fs-ext-05-a',
        label: 'MBA / posztgraduális képzés',
        description:
          'Visszamész tanulni: MBA vagy szakirányú továbbképzés. ' +
          'A tandíj ~500 000 Ft, de 6 kör múlva a fizetésed +100 000 Ft/hó-val nő. ' +
          'Hosszú távú befektetés a karrieredbe.',
        financialEffects: [
          { target: 'balance', amount: -500_000, description: 'MBA / továbbképzés tandíja' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 100_000, durationRounds: -1, description: 'MBA bérelőny (6 kör késleltetéssel)', startAfterRounds: 6 },
        ],
        didYouKnow:
          'Egy MBA átlagos megtérülése 3-5 év. A Corvinus, CEU és BME MBA programjai nemzetközileg is elismertek. ' +
          'Sok munkáltató részben vagy egészben finanszírozza a továbbképzést – érdemes kérdezni!',
      },
      {
        id: 'fs-ext-05-b',
        label: 'Iparágváltás (tech/pénzügy)',
        description:
          'Váltasz egy jobban fizető szektorra: IT, fintech, vagy pénzügyi tanácsadás. ' +
          'Azonnali fizetésemelés: +80 000 Ft/hó. Új kihívások, meredek tanulási görbe.',
        financialEffects: [
          { target: 'salary', amount: 80_000, description: 'Iparágváltás béremelés' },
        ],
        didYouKnow:
          'A tech és pénzügyi szektor a legjobban fizető iparágak Magyarországon (KSH, 2025). ' +
          'Egy karrierváltó bootcamp (3-6 hónap) átlagosan 200-500 000 Ft, de a bérkülönbség 1 év alatt megtéríti.',
      },
      {
        id: 'fs-ext-05-c',
        label: 'Vezetői pozíció (előléptetés)',
        description:
          'A jelenlegi munkahelyeden lépsz feljebb: csapatvezető vagy osztályvezető leszel. ' +
          'Fizetésemelés: +60 000 Ft/hó, de a reprezentációs költségek is nőnek (+20 000 Ft/hó).',
        financialEffects: [
          { target: 'salary', amount: 60_000, description: 'Vezetői pótlék' },
          { target: 'other', amount: 20_000, description: 'Reprezentáció (üzleti ebédek, megjelenés)' },
        ],
        didYouKnow:
          'A vezetői pozíció nem csak fizetésemelés: felelősség, stressz, és hosszabb munkanapok járnak vele. ' +
          'A jó vezető 3-5 év alatt akár megduplázhatja a jövedelmét bónuszokkal és juttatásokkal.',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [20],
  },
];
