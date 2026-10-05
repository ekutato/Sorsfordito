// ============================================================================
// PENZUGYI SORSFORDITO - Dani Decision Tree (Sprint Mode)
// Dani, 24 eves, palyakezdo - 12 havi dontesfaja
// ============================================================================

import type { DecisionCard } from '@/types/game';

/**
 * Dani dontesfaja - Sprint mod (12 kor = 12 honap)
 *
 * Fo agak:
 *   1. Lakhatas (1-2. honap)
 *   2. Elso megtakaritasi dontesek (3-4. honap)
 *   3. Diakhitel-strategia (5-6. honap)
 *   4. Befektetesi lehetosegek (7-8. honap)
 *   5. Karrierdontesek (9-10. honap)
 *   6. Eves osszegzes (11-12. honap)
 */

export const DANI_DECISIONS_SPRINT: DecisionCard[] = [

  // ===================================================================
  // 1. SZAKASZ: LAKHATAS (1-2. honap)
  // ===================================================================

  {
    id: 'dani-d01',
    category: 'Lakhatás',
    title: 'Albérlet vagy maradás?',
    situation:
      'Megkaptad az első állásodat! Nettó {{salary}} Ft/hó junior fejlesztőként. ' +
      'A szüleid szívesen látnak otthon Kecskeméten, de a munkahelyed Budapesten van. ' +
      'Az ingázás napi 3 óra vonaton.',
    dynamicVariables: {
      salary: 'player.income.salary',
      rent_bp: 'economicData.realEstate.budapestRentAvg',
    },
    options: [
      {
        id: 'dani-d01-a',
        label: 'Kiköltözöl egyedül Budapestre',
        description:
          'Albérlet: –{{rent_bp}} Ft/hó. Kaució: –{{rent_bp}} × 2 (egyszeri). ' +
          'Rezsi: –35 000 Ft/hó. Cserébe: nincs ingázás, önálló élet, networking.',
        financialEffects: [
          { target: 'balance', amount: -500_000, description: 'Kaució + költözés', isDynamic: true, dynamicDataKey: 'realEstate.budapestRentAvg' },
          { target: 'housing', amount: 180_000, description: 'Albérlet havi díja' },
          { target: 'utilities', amount: 35_000, description: 'Rezsi' },
          { target: 'transport', amount: -10_000, description: 'Kevesebb közlekedés (nem ingázik)' },
        ],
        nextDecisionId: 'dani-d03',
        didYouKnow: 'Az albérletszerződésnél mindig kérj számlát a kaucióról! A jogszabály szerint a kaució max 3 havi bérleti díj lehet.',
      },
      {
        id: 'dani-d01-b',
        label: 'Otthon maradsz, ingázol',
        description:
          'Hozzájárulás otthon: –40 000 Ft/hó. MÁV országbérlet: –18 900 Ft/hó. ' +
          'Megtakarítás: +146 000 Ft/hó az albérlethez képest, de napi 3 óra az utazás.',
        financialEffects: [
          { target: 'housing', amount: 40_000, description: 'Háztartásba hozzájárulás' },
          { target: 'transport', amount: 18_900, description: 'MÁV országbérlet (Kecskemét–Bp, BKK-val együtt)' },
        ],
        nextDecisionId: 'dani-d04',
        didYouKnow: 'Az országbérlet (18 900 Ft/hó) az egész országban érvényes — vonat, busz, HÉV, és Budapesten a BKK járatain is! Nem kell külön Budapest-bérlet.',
      },
      {
        id: 'dani-d01-c',
        label: 'Lakótársat keresel Budapesten',
        description:
          'Megosztott albérlet: –110 000 Ft/hó. Megosztott rezsi: –20 000 Ft/hó. ' +
          'Kaució (feles): –220 000 Ft. Kompromisszum: kevesebb privát tér.',
        financialEffects: [
          { target: 'balance', amount: -250_000, description: 'Feles kaució + költözés' },
          { target: 'housing', amount: 110_000, description: 'Feles albérlet' },
          { target: 'utilities', amount: 20_000, description: 'Megosztott rezsi' },
          { target: 'transport', amount: -10_000, description: 'Kevesebb közlekedés' },
        ],
        nextDecisionId: 'dani-d03',
        didYouKnow: 'Lakótársnál mindig legyen írásos megállapodás a közös költségekről! Külön albérleti szerződés mindkettőtöknek.',
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [1],
  },

  // ===================================================================
  // 2. SZAKASZ: ELSO PENZUGYI DONTESEK (2-3. honap)
  // ===================================================================

  {
    id: 'dani-d02',
    category: 'Pénzkezelés',
    title: 'Az első szabad pénzed',
    situation:
      'Két hónap munka után van {{balance}} Ft a számládon. ' +
      'A hónap végén {{cashflow}} Ft marad a kiadások után. ' +
      'A kollegáid hétvégi programokra hívnak, a szüleid azt mondják „spórolj!".',
    dynamicVariables: {
      balance: 'player.balance',
      cashflow: 'player.computed.freeCashflow',
    },
    options: [
      {
        id: 'dani-d02-a',
        label: 'Vészhelyzeti alap építése',
        description:
          'Az összes szabad pénzt félreteszed egy külön számlára. ' +
          'Cél: 3 havi kiadásnak megfelelő tartalék. Unalmas, de biztonságos.',
        financialEffects: [
          { target: 'other', amount: -10_000, description: 'Kevesebb szórakozás (önmegtartóztatás)' },
        ],
        nextDecisionId: 'dani-d05',
        didYouKnow: 'A pénzügyi tanácsadók szerint 3-6 havi kiadásnak megfelelő vészhelyzeti alappal kell rendelkezni, MIELŐTT bármibe befektetnél.',
      },
      {
        id: 'dani-d02-b',
        label: 'Egyensúly: spórolsz is, élsz is',
        description:
          '50/30/20 szabály: 50% szükségletek, 30% vágyak, 20% megtakarítás. ' +
          'Nem mondasz le mindenről, de tudatosan költesz.',
        financialEffects: [
          { target: 'other', amount: 5_000, description: 'Szórakozás, közösségi élet' },
        ],
        nextDecisionId: 'dani-d05',
        didYouKnow: 'Az 50/30/20 szabályt Elizabeth Warren szenátor népszerűsítette. Egyszerű, mégis hatékony pénzkezelési módszer.',
      },
      {
        id: 'dani-d02-c',
        label: 'YOLO mód: élvezed az első fizetést',
        description:
          'Új telefon (180 000 Ft részletre), hétvégi bulizás, rendelés a Wolton. ' +
          'Megérdemelted! (De a megtakarítás várat magára.)',
        financialEffects: [
          { target: 'balance', amount: -180_000, description: 'Új telefon (részletre is mehet)' },
          { target: 'other', amount: 25_000, description: 'Magasabb havi kiadás (szórakozás, rendelések)' },
        ],
        nextDecisionId: 'dani-d06',
        didYouKnow: 'A „lifestyle inflation" (életszínvonal-infláció) az első fizetésemelés legnagyobb csapdája: ahogy nő a bevétel, nőnek a kiadások is.',
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [2, 3],
  },

  // ===================================================================
  // 3. SZAKASZ: DIAKHITEL-STRATEGIA (4-6. honap)
  // ===================================================================

  {
    id: 'dani-d03',
    category: 'Adósságkezelés',
    title: 'Diákhitel kérdés',
    situation:
      'Az egyetemi évek alatt lehetőséged volt Diákhitel 2-t (DH2) felvenni — ' +
      'kamatmentes, szabad felhasználású hitel max 3 200 000 Ft-ig. ' +
      'Sok hallgatótársad élt vele. Te igényelted?',
    options: [
      {
        id: 'dani-d03-a',
        label: 'Igen, felvettem – most törlesztek extra',
        description:
          'Van 3 200 000 Ft DH2 tartozásod. Hamarosan indul a törlesztés (~30 000 Ft/hó). ' +
          'Félreteszel havonta extra 20 000 Ft-ot az előtörlesztésre is.',
        financialEffects: [
          { target: 'loanPayments', amount: 30_000, description: 'DH2 havi törlesztő' },
          { target: 'other', amount: -20_000, description: 'Extra előtörlesztés (havi)' },
        ],
        ongoingEffects: [
          { target: 'debt_reduction', monthlyAmount: 20_000, durationRounds: -1, description: 'Extra diákhitel-törlesztés' },
        ],
        nextDecisionId: 'dani-d05',
        didYouKnow: 'A DH2 kamatmentes az EGÉSZ futamidő alatt — tanulmányok alatt ÉS után is! Ez Magyarország legjobb kölcsöne. A DH1 viszont diploma után piaci kamatra vált (~5-7%). Ne keverd össze őket!',
      },
      {
        id: 'dani-d03-b',
        label: 'Igen, felvettem – minimálisan törlesztek, a pénzt befektetem',
        description:
          'Van 3 200 000 Ft DH2 tartozásod. Csak a kötelező 30 000 Ft/hó-t fizeted. ' +
          'A megmaradó pénzt PMÁP-ba teszed (~6-7% hozam).',
        financialEffects: [
          { target: 'loanPayments', amount: 30_000, description: 'DH2 havi törlesztő' },
        ],
        nextDecisionId: 'dani-d05',
        unlocksInvestment: ['inv-pmap'],
        didYouKnow: 'Mivel a DH2 0%-os, matematikailag jobban jársz, ha a pénzt befekteted (pl. PMÁP 6-7% hozam). A „jó adósság" iskolapéldája.',
      },
      {
        id: 'dani-d03-c',
        label: 'Nem vettem fel diákhitelt',
        description:
          'Ösztöndíjból és/vagy munkából finanszíroztad a tanulmányaidat. ' +
          'Nincs adósságod — tiszta lappal indulsz!',
        financialEffects: [],
        nextDecisionId: 'dani-d05',
        didYouKnow: 'A DH2-t érdemes ismerni akkor is, ha nem vetted fel: felnőttképzésre (pl. MBA, nyelvtanfolyam) később is igényelhető, és 0%-os kamattal a legjobb hitel a piacon.',
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [4, 5],
  },

  // ===================================================================
  // 4. SZAKASZ: BEFEKTETESI LEHETOSEGEK (6-8. honap)
  // ===================================================================

  {
    id: 'dani-d04',
    category: 'Befektetés',
    title: 'Az első befektetésed',
    situation:
      'A kollégád mesél a TBSZ-ről: 5 év után adómentes a hozam! ' +
      'Közben a TikTokon mindenki kriptót tolja. Az édesapád azt mondja: „tedd az OTP-be." ' +
      'Neked {{balance}} Ft van a számládon.',
    dynamicVariables: {
      balance: 'player.balance',
    },
    options: [
      {
        id: 'dani-d04-a',
        label: 'PMÁP – az állampapír biztonsága',
        description:
          'Magyar Állampapír Plusz: {{pmap_yield}}% hozam, állam garantálja. ' +
          'Minimum 10 000 Ft-tól, webkincstár.hu-n 15 perc alatt megvehető.',
        financialEffects: [
          { target: 'balance', amount: -100_000, description: 'PMÁP vásárlás' },
        ],
        unlocksInvestment: ['inv-pmap'],
        didYouKnow: 'A PMÁP kamata félévente nő (lépcsős kamat). Az 5. évben a legmagasabb. Ha előbb kiszeded, csak a kisebb kamatot kapod.',
      },
      {
        id: 'dani-d04-b',
        label: 'Kripto – beleugrassz a mély vízbe',
        description:
          'Veszel 50 000 Ft értékű Bitcoint. Lehet +100% is, de -50% is. ' +
          'A volatilitás extrém – bírod az idegekkel?',
        financialEffects: [
          { target: 'balance', amount: -50_000, description: 'Bitcoin vásárlás' },
        ],
        unlocksInvestment: ['inv-crypto'],
        didYouKnow: 'A Bitcoin ára 2021-ben +60%-ot ment, 2022-ben -65%-ot esett, 2023-ban +155%-ot emelkedett. Ez a volatilitás.',
      },
      {
        id: 'dani-d04-c',
        label: 'Tanulás előbb – TBSZ kurzus',
        description:
          'Nem veszel semmit. Először megtanulod, hogyan működik a tőzsde és a TBSZ. ' +
          'Ingyenes online képzés (BÉT Akadémia). 1 hónapba kerül, utána okosabban döntesz.',
        financialEffects: [],
        unlocksKnowledge: ['know-tbsz'],
        didYouKnow: 'A BÉT Akadémia ingyenes online kurzusokat kínál tőzsdei alapismeretekről: https://www.bet.hu/bet-akademia',
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [6, 7, 8],
  },

  // ===================================================================
  // 5. SZAKASZ: KARRIER (9-10. honap)
  // ===================================================================

  {
    id: 'dani-d05',
    category: 'Karrier',
    title: 'Karrierváltás vagy stabilitás?',
    situation:
      'Fél éve dolgozol. A főnököd elégedett, de a fizetésemelés nem jön. ' +
      'Közben egy startup megkeresett: +80 000 Ft/hó, de bizonytalan cég. ' +
      'A másik opció: esti OKJ-képzés, ami fél év múlva +50 000 Ft/hó béremelést hozna.',
    options: [
      {
        id: 'dani-d05-a',
        label: 'Maradsz, kikéred a fizetésemelést',
        description:
          'Tárgyalsz a főnökkel. 60% esély +35 000 Ft/hó emelésre. ' +
          'Biztonságos, ismered a csapatot, de a növekedés lassú.',
        financialEffects: [
          { target: 'salary', amount: 35_000, description: 'Fizetésemelés (ha sikerül)' },
        ],
        didYouKnow: 'Fizetéstárgyalási tipp: készülj konkrét számokkal (piaci átlag, saját eredmények). A Profession.hu bérkalkukátora ingyenes.',
      },
      {
        id: 'dani-d05-b',
        label: 'Váltasz a startuphoz',
        description:
          '+80 000 Ft/hó fizetés. Izgalmas projekt, de 6 hónap próbaidő, ' +
          'és a startup-ok 90%-a megbukik. Kockázat–hozam döntés.',
        financialEffects: [
          { target: 'salary', amount: 80_000, description: 'Magasabb fizetés (startup)' },
        ],
        didYouKnow: 'Munkahelyváltásnál a próbaidő alatt (max. 3 hónap) bármelyik fél azonnali hatállyal felmondhat. Legyen B-terved!',
      },
      {
        id: 'dani-d05-c',
        label: 'Képzésbe fektetsz (OKJ / szakmai)',
        description:
          'Esti OKJ-képzés: –150 000 Ft (egyszeri). 6 hónap tanulás, utána ' +
          '+50 000 Ft/hó tartós béremelkedés. Rövid távon fáj, hosszú távon megéri.',
        financialEffects: [
          { target: 'balance', amount: -150_000, description: 'OKJ képzés tandíja' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 50_000, durationRounds: -1, description: 'Béremelkedés a képzés után (6 hónap múlva)' },
        ],
        unlocksInvestment: ['inv-professional-cert'],
        didYouKnow: 'A Diákhitel 1-et felnőttképzésre is felhasználhatod! 0%-os kamat a tanulmányok idejére.',
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [9, 10],
  },

  // ===================================================================
  // 6. SZAKASZ: EVES OSSZEGZES (11-12. honap)
  // ===================================================================

  {
    id: 'dani-d06',
    category: 'Stratégia',
    title: 'Év végi mérleg',
    situation:
      'Egy év telt el. Egyenleged: {{balance}} Ft. Nettó vagyonod: {{netWorth}} Ft. ' +
      'Szabad cashflow-d: {{cashflow}} Ft/hó. Az új év közeleg – mi legyen a terved?',
    dynamicVariables: {
      balance: 'player.balance',
      netWorth: 'player.computed.netWorth',
      cashflow: 'player.computed.freeCashflow',
    },
    options: [
      {
        id: 'dani-d06-a',
        label: 'Agresszív megtakarítás – lakás-önerő',
        description:
          'Mindent félreteszel. Cél: 3 éven belül lakás-önerő (20%, ~5-8M Ft). ' +
          'Szigorú büdzsé, de a saját otthon a végcél.',
        financialEffects: [
          { target: 'other', amount: -15_000, description: 'Még szigorúbb büdzsé' },
        ],
        didYouKnow: 'A lakáshitel önerő minimum 20% (2026-ban). Budapesti kis lakás (~30M Ft) esetén ez 6M Ft. Kamattámogatott hitellel olcsóbb.',
      },
      {
        id: 'dani-d06-b',
        label: 'Diverzifikált befektetés – TBSZ + PMÁP',
        description:
          'Nyitsz TBSZ-számlát, fele PMÁP, fele ETF. Hosszú távú stratégia: ' +
          '5 év után adómentes hozam. Nem lakásra, hanem szabadságra gyűjtesz.',
        financialEffects: [],
        unlocksInvestment: ['inv-pmap', 'inv-tbsz-etf'],
        unlocksKnowledge: ['know-tbsz'],
        didYouKnow: 'A TBSZ + PMÁP kombináció Magyarország legjobb adóoptimalizált befektetése. 5 év után 0% adó a hozamra!',
      },
      {
        id: 'dani-d06-c',
        label: 'Vállalkozás indítása mellékállásban',
        description:
          'Szabadidődben freelance projektet indítasz (web fejlesztés / grafika / fordítás). ' +
          'Extra bevétel +50-150 000 Ft/hó, de az idő limitált.',
        financialEffects: [
          { target: 'balance', amount: -50_000, description: 'Vállalkozás indítási költség' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 80_000, durationRounds: -1, description: 'Freelance mellékbevétel (átlag)' },
        ],
        unlocksKnowledge: ['know-business'],
        didYouKnow: 'Egyéni vállalkozás indítása 2026-ban online, ingyenes (Webes Ügysegéd). Átalányadó 2026: 45% költséghányad (szolgáltatások), kereskedelemnél 80%. Évi ~39M Ft bevételig.',
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [11, 12],
  },
];

/**
 * Sorsfordito esemenyek - eloirott (offline mod / fallback)
 * A Sprint jatekban minden korben 1 Sorsfordito jon
 */
export const DANI_SCRIPTED_FATE_EVENTS = [
  {
    id: 'fate-dani-01', round: 1, title: 'SZÉP-kártya bónusz',
    description: 'A munkaadód 20 000 Ft-ot utalt a SZÉP-kártyádra. Kellemes meglepetés!',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 20_000 }],
  },
  {
    id: 'fate-dani-02', round: 2, title: 'Forint gyengülés: drágulás',
    description:
      'A forint árfolyama gyengült (EUR/HUF 400+), az import termékek megdrágultak. ' +
      'Az élelmiszer- és közlekedési költségeid is emelkedtek.',
    type: 'negative' as const, effects: [
      { target: 'transport', amount: 8_000 },
      { target: 'food', amount: 5_000 },
    ],
  },
  {
    id: 'fate-dani-03', round: 3, title: 'Freelance megbízás',
    description: 'Egy ismerős ajánlott egy hétvégi projektre. Egyszeri bevétel: +80 000 Ft.',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 80_000 }],
  },
  {
    id: 'fate-dani-04', round: 4, title: 'Laptop megadta magát',
    description: 'A 6 éves laptopod végleg leállt. Új kell: –180 000 Ft (vagy részlet).',
    type: 'negative' as const, effects: [{ target: 'balance', amount: -180_000 }],
  },
  {
    id: 'fate-dani-05', round: 5, title: 'Adó-visszatérítés',
    description: 'NAV visszautalt 45 000 Ft-ot. A 25 év alatti SZJA-mentesség miatt jár vissza!',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 45_000 }],
  },
  // DH2 törlesztés: a dani-d03 döntés kezeli (ha a játékos felvette)
  {
    id: 'fate-dani-06', round: 6, title: 'Számlakivonat érkezett',
    description: 'Megnézed a féléves pénzügyi összesítőd. Ideje átgondolni, jó úton haladsz-e!',
    type: 'positive' as const, effects: [],
  },
  {
    id: 'fate-dani-07', round: 7, title: 'Túlóra lehetőség',
    description:
      'A főnököd megkérdezi, vállalsz-e extra műszakot hétvégén. ' +
      'Jól jönne a pénz, de a pihenés is fontos.',
    type: 'decision' as const, effects: [],
    options: [
      { label: 'Vállalod (+45 000 Ft)', effects: [{ target: 'balance', amount: 45_000 }] },
      { label: 'Kihagyod (pihenés)', effects: [] },
    ],
  },
  {
    id: 'fate-dani-08', round: 8, title: 'Lakbéremelés',
    description: 'Az albérleted drágul: +15 000 Ft/hó. A szerződés lejárt, új feltételek.',
    type: 'negative' as const, effects: [{ target: 'housing', amount: 15_000 }],
  },
  {
    id: 'fate-dani-09', round: 9, title: 'Jutalmat kaptál!',
    description: 'A féléves értékelés kiváló – egyszeri prémium: +120 000 Ft.',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 120_000 }],
  },
  {
    id: 'fate-dani-10', round: 10, title: 'Hova tűnt a fizum?',
    description:
      'Megnézed az utolsó havi kiadásaidat: apró vásárlások a boltban, kávézások, ' +
      'előfizetések és egyéb „láthatatlan" tételek – összesen 70 000 Ft! Változtatsz?',
    type: 'decision' as const, effects: [],
    options: [
      { label: 'Drasztikus vágás (–40 000 Ft/hó)', effects: [{ target: 'other', amount: -40_000 }] },
      { label: 'Kicsit spórolok (–15 000 Ft/hó)', effects: [{ target: 'other', amount: -15_000 }] },
      { label: 'Így is jó, élem az életem', effects: [{ target: 'other', amount: 20_000 }] },
    ],
  },
  {
    id: 'fate-dani-11', round: 11, title: 'AI átalakítja a munkaerőpiacot',
    description:
      'A céged bejelentette: az AI-t bevezetik a munkába. ' +
      'Egyes pozíciók megszűnnek, de aki tanulja az AI-t, előléptetést kap.',
    type: 'decision' as const, effects: [],
    options: [
      { label: 'Megtanulom az AI-t (–30 000 Ft tanfolyam, de +25 000 Ft/hó)', effects: [
        { target: 'balance', amount: -30_000 },
        { target: 'salary', amount: 25_000 },
      ]},
      { label: 'Kivárok, hátha nem érint', effects: [] },
    ],
  },
  {
    id: 'fate-dani-12', round: 12, title: 'Karácsonyi költségek',
    description: 'Ajándékok, utazás, ünnepi vacsora: egyszeri kiadás –85 000 Ft.',
    type: 'negative' as const, effects: [{ target: 'balance', amount: -85_000 }],
  },
];
