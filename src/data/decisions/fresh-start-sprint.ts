// ============================================================================
// PENZUGYI SORSFORDITO - Fresh Start Decision Tree (Sprint Mode)
// 18 eves, erettsegi utan - 12 havi dontesfaja
// ============================================================================

import type { DecisionCard } from '@/types/game';

/**
 * "Érettségi után" dontesfaja - Sprint mod (12 kor = 12 honap)
 *
 * Fo agak:
 *   1. Pályaválasztás (1-2. honap) - egyetem / szakma / munka
 *   2. Első bevétel és gazdálkodás (3-4. honap)
 *   3. Diákhitel döntés (5-6. honap)
 *   4. Első megtakarítás (7-8. honap)
 *   5. Szülőktől való függetlenedés (9-10. honap)
 *   6. Egy év mérleg (11-12. honap)
 */

export const FRESH_START_DECISIONS_SPRINT: DecisionCard[] = [

  // ===================================================================
  // 1. SZAKASZ: PÁLYAVÁLASZTÁS (1-2. honap)
  // ===================================================================

  {
    id: 'fs-d01',
    category: 'Pályaválasztás',
    title: 'Mi legyen, ha nagy leszek?',
    situation:
      'Győrben leérettségiztél, gratulálunk! Van {{balance}} Ft félretéve diákmunkából. ' +
      'A szüleid támogatnak, de pénzügyileg most te döntesz először. ' +
      'Három út áll előtted – az első év meghatározza a pályádat.',
    dynamicVariables: {
      balance: 'player.balance',
    },
    options: [
      {
        id: 'fs-d01-a',
        label: 'Egyetemre mész (nappali)',
        description:
          'Budapesti egyetem (BME / ELTE / Corvinus) vagy a győri Széchenyi Egyetem. ' +
          'Nincs bevétel, de ösztöndíj esélyes (25 000 – 50 000 Ft/hó). ' +
          'A diploma 4-5 éves befektetés a jövődbe.',
        financialEffects: [
          { target: 'salary', amount: 25_000, description: 'Tanulmányi ösztöndíj (átlag)' },
          { target: 'other', amount: 10_000, description: 'Egyetemi költségek (jegyzet, közlekedés)' },
        ],
        nextDecisionId: 'fs-d03',
        didYouKnow: 'Ha a felvételi pontszámod magas, tandíjmentes az egyetem. A tanulmányi ösztöndíjat félévente újra osztják – a jegyeid számítanak!',
      },
      {
        id: 'fs-d01-b',
        label: 'Szakmát tanulsz (technikum / szakképző iskola)',
        description:
          'Villanyszerelő, informatikus, CNC-gépkezelő - érettségi után rövidebb képzés. ' +
          'Duális képzésben szakképzési munkaszerződést kötsz a képzőhellyel: ez munkaviszony, ' +
          'bruttó 100-168 ezer Ft munkabérrel, amelyből csak a 18,5% TB-járulék jön le (SZJA-mentes). ' +
          'Hamarabb keresel, de alacsonyabb a plafon.',
        financialEffects: [
          { target: 'salary', amount: 81_500, description: 'Tanulói munkabér (bruttó 100 000 Ft − 18,5% TB-járulék)' },
          { target: 'transport', amount: 1_400, description: 'Bejárás (a bérlet 86%-át a képzőhely megtéríti)' },
        ],
        nextDecisionId: 'fs-d02',
        didYouKnow: 'A szakmunkások iránti kereslet nagy. Egy tapasztalt villanyszerelő vagy hegesztő akár az országos nettó átlagkereset ({{avg_wage}} Ft) felett is kereshet.',
      },
      {
        id: 'fs-d01-c',
        label: 'Azonnal dolgozni mész',
        description:
          'Győri gyárak (autógyár, beszállítók): gyártósor / raktáros — 240-280 000 Ft nettó. ' +
          'Azonnal van fizetésed, de nincs képesítésed. ' +
          'Később nehezebb lesz feljebb lépni végzettség nélkül.',
        financialEffects: [
          { target: 'salary', amount: 260_000, description: 'Betanított munkás fizetés' },
          { target: 'transport', amount: 15_000, description: 'Munkába járás' },
          { target: 'food', amount: 30_000, description: 'Saját étkezés' },
        ],
        nextDecisionId: 'fs-d02',
        didYouKnow: 'A 25 év alatti fiatalok a bruttó átlagkeresethez kötött havi határig nem fizetnek SZJA-t (a pontos összeget a NAV teszi közzé). Minimálbéres (bruttó {{min_wage}} Ft) fizetésnél ez a bruttó bér 15%-ával több nettót jelent minden hónapban!',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [1],
  },

  // ===================================================================
  // 2. SZAKASZ: ELSŐ BEVÉTEL ÉS GAZDÁLKODÁS (3-4. honap)
  // ===================================================================

  {
    id: 'fs-d02',
    category: 'Pénzkezelés',
    title: 'Az első saját pénzed',
    situation:
      'Két hónap eltelt, az egyenleged: {{balance}} Ft. ' +
      'Akár ösztöndíj, akár fizetés – ez a TE pénzed, de a szüleid szólnak: ' +
      '„Segíts a háztartásba!" Közben a haverjaink koncertre hívnak.',
    dynamicVariables: {
      balance: 'player.balance',
    },
    options: [
      {
        id: 'fs-d02-a',
        label: 'Tudatos költségterv (büdzsé)',
        description:
          'Csinálsz egy egyszerű bevétel-kiadás listát (papíron vagy appban). ' +
          'Adózol a szülőknek 15 000 Ft/hó-t, a többit beosztod.',
        financialEffects: [
          { target: 'housing', amount: 15_000, description: 'Hozzájárulás otthon' },
          { target: 'other', amount: -5_000, description: 'Kevesebb impulzusvásárlás' },
        ],
        nextDecisionId: 'fs-d04',
        didYouKnow: 'A legtöbb pénzügyi szakértő szerint a büdzsé készítése a #1 legjobb anyagi szokás. Egy egyszerű füzet is elég: bevétel bal, kiadás jobb.',
      },
      {
        id: 'fs-d02-b',
        label: 'Kiszámolod, amennyiből muszáj → a többi megy „szórakozásra"',
        description:
          'Nem tervezel túl sokat, de a fix kiadásokat fedezed. ' +
          'Ami marad, arra szabadon költesz. Néha hó végén szűkön leszel.',
        financialEffects: [
          { target: 'other', amount: 10_000, description: 'Szórakozás, koncert, kávé' },
        ],
        nextDecisionId: 'fs-d04',
        didYouKnow: 'A „pay yourself first" (fizess először magadnak) elv: amint megérkezik a pénz, azonnal tedd félre a megtakarítást. Ami marad, arra költesz.',
      },
      {
        id: 'fs-d02-c',
        label: 'Mindent elköltesz – az élet szép',
        description:
          'Új ruhák, kiadós társas programok, streaming előfizetések. ' +
          'Fiatal vagy, élvezd! (De a hónap végén mindig nullán leszel.)',
        financialEffects: [
          { target: 'balance', amount: -40_000, description: 'Impulzusvásárlás' },
          { target: 'other', amount: 25_000, description: 'Szórakozás + előfizetések' },
        ],
        nextDecisionId: 'fs-d05',
        didYouKnow: 'A „lifestyle creep" (elszaladó életszínvonal) 18 évesen kezdődik. Aki korán megtanulja kontrollálni, annak később könnyebb dolga lesz.',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [3, 4],
  },

  // ===================================================================
  // 3. SZAKASZ: DIÁKHITEL DÖNTÉS (5-6. honap)
  // ===================================================================

  {
    id: 'fs-d03',
    requires: { chose: ['fs-d01-a'] },
    category: 'Finanszírozás',
    title: 'Kell a diákhitel?',
    situation:
      'Egyetemista vagy, az ösztöndíj kevés az egyetemista élethez. ' +
      'A Diákhitel Központ kínálja: DH1 (szabad felhasználás, {{dh1_rate}}% kamat) ' +
      'vagy DH2 (tandíj, 0% kamat). A barátaid fele felvette, fele nem.',
    dynamicVariables: {
      dh1_rate: 'economicData.interestRates.dh1',
    },
    options: [
      {
        id: 'fs-d03-a',
        label: 'Felveszed a DH1-et (szabad felhasználás)',
        description:
          'Havi 75 000 Ft kölcsön, szabad felhasználásra. ' +
          'Kényelmesebb élet, de adósságba kerülsz. ' +
          'A törlesztés diploma után indul (piaci kamattal!).',
        financialEffects: [],
        takesLoan: { name: 'Diákhitel1', type: 'student_loan', principal: 0, monthlyPayment: 0, rateKey: 'diakhitel.dh1Rate', monthlyDraw: 75_000 },
        didYouKnow: 'A DH1 kamatozó hitel (jelenleg {{dh1_rate}}% kamattal), a törlesztés a tanulmányok után indul. Ha 3 évig havi 75 000 Ft-ot veszel fel, ~2,7M Ft tőketartozásod lesz, amit kamatostul kell visszafizetni!',
      },
      {
        id: 'fs-d03-b',
        label: 'Csak DH2 (tandíjhoz, ha szükség)',
        description:
          'A DH2 0%-os kamatú, amíg tanulsz. Csak a tandíjra veszed fel, ' +
          'ha elveszítenéd az állami finanszírozást. Fegyelmezettebb út.',
        financialEffects: [],
        didYouKnow: 'A DH2 Magyarország legjobb kölcsöne: 0% kamat a tanulmányok alatt! Még ha nem kell most, jó tudni, hogy van ilyen biztonsági háló.',
      },
      {
        id: 'fs-d03-c',
        label: 'Nem kérsz hitelt – diákmunka mellett tanulsz',
        description:
          'Részmunkaidős diákmunka: 80-120 000 Ft/hó. ' +
          'Időigényes, de nem lesz adósságod. A tanulmányok csúszhatnak.',
        financialEffects: [
          { target: 'salary', amount: 100_000, description: 'Diákmunka bevétel' },
          { target: 'other', amount: 5_000, description: 'Extra közlekedés a munkába' },
        ],
        nextDecisionId: 'fs-d04',
        didYouKnow: 'Diákmunkásként a bruttó = nettó (nincs TB-járulék, csak 15% SZJA, de 25 év alatt az is mentes). A Diákszövetkezetek segítenek munkát találni.',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [5, 6],
  },

  // ===================================================================
  // 4. SZAKASZ: ELSŐ MEGTAKARÍTÁS (7-8. honap)
  // ===================================================================

  {
    id: 'fs-d04',
    category: 'Megtakarítás',
    title: 'Hova tedd az első félretett pénzed?',
    situation:
      'Van {{balance}} Ft a számládon. Ha sikerült valamennyit félretenni, ' +
      'megkérdezed magadtól: bankszámlán hagyjam, vagy csináljak vele valamit? ' +
      'Az infláció {{inflation}}% – a pénzed lassan veszít az értékéből.',
    dynamicVariables: {
      balance: 'player.balance',
      inflation: 'economicData.inflation.latest',
    },
    options: [
      {
        id: 'fs-d04-a',
        label: 'Bankszámlán hagyod (0% kamat)',
        description:
          'Biztonságos, azonnal elérhető. De az infláció megeszi: ' +
          'éves szinten {{inflation}}%-kal kevesebbet ér. Egyszerű, de drága.',
        financialEffects: [],
        didYouKnow: 'Ha 100 000 Ft-ot hagysz a folyószámlán {{inflation}}%-os inflációnál, egy év múlva ugyanannyi pénzért nagyjából ennyivel kevesebbet tudsz venni. A semmi is költség!',
      },
      {
        id: 'fs-d04-b',
        label: 'MÁP Plusz – az állam garantálja',
        description:
          'Minimum 10 000 Ft-tól vásárolható, webkincstár.hu-n. ' +
          'Most átlagosan {{map_plus_yield}}% éves kamat (az infláció {{inflation}}%). 5 éves futamidő, de lejárat előtt is visszaváltható.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-pmap'],
        didYouKnow: 'A WebKincstárban online nyithatsz számlát. A lakossági állampapírok kamata SZJA- és szochomentes, így ugyanakkora kamatnál többet kapsz kézhez, mint egy bankbetétnél.',
        invests: [{ optionId: 'inv-map-plus', amount: 50_000 }],
      },
      {
        id: 'fs-d04-c',
        label: 'Takarékos bankbetét (lekötés)',
        description:
          'Banki lekötött betét: most átlagosan {{deposit_rate}}% körül, akciósan ennél több is lehet. ' +
          'Kicsit jobb, mint a folyószámla, de a kamatból 28% adót (15% SZJA + 13% szocho) levonnak.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-bank-deposit'],
        didYouKnow: 'Az OBA (Országos Betétbiztosítási Alap) 100 000 EUR-ig védi a bankbetétedet. Ez most kb. {{oba_huf}} Ft – szóval a te megtakarításod biztonságban van.',
        invests: [{ optionId: 'inv-bank-deposit', amount: 30_000 }],
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [7, 8],
  },

  // ===================================================================
  // 5. SZAKASZ: FÜGGETLENEDÉS (9-10. honap)
  // ===================================================================

  {
    id: 'fs-d05',
    requires: { livesHome: true },
    category: 'Életmód',
    title: 'Maradj vagy költözz?',
    situation:
      'Egy éve érettségiztel. A szüleidnél élsz, de egyre inkább önálló akarsz lenni. ' +
      'A haverod kollégiumi helyet ajánl, vagy albérletet néznétek ketten. ' +
      'Egyenleged: {{balance}} Ft, bevételed: {{income}} Ft/hó.',
    dynamicVariables: {
      balance: 'player.balance',
      income: 'player.income.salary',
    },
    options: [
      {
        id: 'fs-d05-a',
        requires: { chose: ['fs-d01-a', 'fs-d01-b'] },
        label: 'Kollégiumba költözöl',
        description:
          'Kollégiumi díj: ~25-40 000 Ft/hó (egyetemistáknak olcsó). ' +
          'Közösség, tanulótársak, de szűkös hely és szabályok.',
        financialEffects: [
          { target: 'housing', amount: 35_000, description: 'Kollégiumi díj' },
          { target: 'food', amount: 30_000, description: 'Saját étkezés' },
          { target: 'utilities', amount: 0, description: 'A rezsi benne van a díjban' },
        ],
        didYouKnow: 'A kollégium Magyarország legolcsóbb lakhatása. Pályázathoz kell: jó tanulmányi átlag, szociális helyzet, és jelentkezni a határidőre!',
      },
      {
        id: 'fs-d05-b',
        label: 'Albérletbe költözöl (lakótárssal)',
        description:
          'Megosztott lakás: a lakbér fele (egy átlagos budapesti albérlet most {{rent_bp}} Ft/hó). ' +
          'Szabadság, de drága. Kaució: 2 havi bérleti díj.',
        financialEffects: [
          { target: 'balance', amount: -260_000, description: 'Kaució + költözés' },
          { target: 'housing', amount: 120_000, description: 'Feles albérlet' },
          { target: 'utilities', amount: 20_000, description: 'Megosztott rezsi' },
          { target: 'food', amount: 40_000, description: 'Saját élelmiszer' },
        ],
        didYouKnow: 'A lakótársi együttélésben MINDIG legyen írásos megállapodás a költségmegosztásról. Mintát ingyen találsz az interneten, de egy egyszerű közös költségmegosztó táblázat is megteszi.',
      },
      {
        id: 'fs-d05-c',
        label: 'Otthon maradsz – spórolsz',
        description:
          'Nincs extra lakásköltség. Hozzájárulsz a háztartáshoz (15 000 Ft/hó). ' +
          'A megtakarított pénzt félreteszed. Kevésbé önálló, de pénzügyileg okos.',
        financialEffects: [
          { target: 'housing', amount: 15_000, description: 'Hozzájárulás otthon' },
        ],
        didYouKnow: 'A „szülőknél lakás" szégyen? Az EU-ban a fiatalok átlagosan 26 éves koruk körül költöznek el otthonról (Eurostat, 2023). Pénzügyileg ez lehet a legokosabb döntés!',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [9],
  },

  // ===================================================================
  // 5b. SZAKASZ: AUTÓVÁSÁRLÁS (10. honap – külön kör, hogy biztosan megjelenjen)
  // ===================================================================

  {
    id: 'fs-d05b',
    category: 'Közlekedés',
    title: 'Kell a saját autó?',
    situation:
      'Havonta {{transport}} Ft-ot költesz közlekedésre (BKK bérlet / vonat). ' +
      'Egy ismerős eladná a 10 éves kisautóját 1 200 000 Ft-ért. ' +
      'A szalonban pedig 0 Ft önerővel kínálnak új autót hitelre. ' +
      'Megéri saját kocsit tartani, vagy a tömegközlekedés az okosabb?',
    dynamicVariables: {
      transport: 'player.expenses.transport',
    },
    options: [
      {
        id: 'fs-d05b-a',
        label: 'Veszel használt autót (készpénz)',
        description:
          '10 éves kisautó, 120 000 km. Ára: 1 200 000 Ft készpénzben. ' +
          'Havi fenntartás: KGFB ~8 000 Ft, benzin ~25 000 Ft, szerviz ~12 000 Ft/hó átlag. ' +
          'Cserébe a BKK bérlet megszűnik.',
        financialEffects: [
          { target: 'balance', amount: -1_200_000, description: 'Használt autó vételára' },
          { target: 'transport', amount: -15_000, description: 'BKK bérlet megszűnik' },
          { target: 'other', amount: 45_000, description: 'Autó fenntartás (KGFB + benzin + szerviz)' },
        ],
        didYouKnow:
          'Egy használt autó valós havi költsége átlagosan 80-120 000 Ft ' +
          '(üzemanyag + biztosítás + szerviz + adó + parkolás + értékcsökkenés). ' +
          'A KGFB kötelező, a CASCO opcionális de ajánlott.',
        acquiresAsset: { id: 'auto', name: 'Használt autó (vételár)', value: 1_200_000 },
      },
      {
        id: 'fs-d05b-b',
        label: 'Autóhitelre veszel újat',
        description:
          'Új belépő kategóriás kisautó, 5 500 000 Ft. Önerő: 500 000 Ft, hitel: 5 000 000 Ft, ' +
          '5 évre, a THM-et a bank egyedileg adja. A havi törlesztő a mostani átlagos THM-mel ({{car_loan_thm}}%) számolódik. ' +
          'A banknak CASCO biztosítás kötelező (évi ~120 000 Ft).',
        financialEffects: [
          { target: 'balance', amount: -500_000, description: 'Autóhitel önerő' },
          { target: 'transport', amount: -15_000, description: 'BKK bérlet megszűnik' },
          { target: 'other', amount: 55_000, description: 'Fenntartás (KGFB + CASCO + benzin + szerviz)' },
        ],
        didYouKnow:
          'A THM (Teljes Hiteldíj Mutató) tartalmazza az összes költséget: kamat + díjak. ' +
          'Autóhitelnél MINDIG a THM-et hasonlítsd, ne a kamatot! ' +
          'Hiteles autónál a bank kötelezővé teszi a CASCO-t – ez évi 80-300 000 Ft extra.',
        takesLoan: { name: 'Autóhitel', type: 'car_loan', principal: 5_000_000, months: 60, rateKey: 'bank.carLoanThm' },
        acquiresAsset: { id: 'auto', name: 'Új autó (vételár)', value: 500_000, plusLoanPrincipal: true },
      },
      {
        id: 'fs-d05b-c',
        label: 'Marad a tömegközlekedés',
        description:
          'Havi bérlet (Budapest-bérlet vagy vármegyebérlet): töredéke egy autó havi költségének. ' +
          'Nincs parkolás, nincs szerviz, nincs KGFB. ' +
          'A megspórolt pénzt befektetheted.',
        financialEffects: [],
        didYouKnow:
          'Egy autó TELJES fenntartási költsége évi 1-1,5M Ft (még ha „olcsó" is). ' +
          'Egy éves bérletköltség ennek csak a töredéke, diákoknak még kevesebb. ' +
          'A különbség befektetve 10 év alatt akár 10-15M Ft is lehet!',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [10],
  },

  // ===================================================================
  // 6. SZAKASZ: EGY ÉV MÉRLEG (11-12. honap)
  // ===================================================================

  {
    id: 'fs-d06',
    category: 'Stratégia',
    title: 'Egy éves mérleg',
    situation:
      'Egy év telt el az érettségid óta. Egyenleged: {{balance}} Ft. ' +
      'Nettó vagyonod: {{netWorth}} Ft. {{income}} Ft jön be havonta. ' +
      'Sokat tanultál – mit csinálsz a következő évvel?',
    dynamicVariables: {
      balance: 'player.balance',
      netWorth: 'player.computed.netWorth',
      income: 'player.income.salary',
    },
    options: [
      {
        id: 'fs-d06-a',
        label: 'Extra bevételt keresel (mellékállás)',
        description:
          'Diákmunka / futár / webshop – havi +50-80 000 Ft extra. ' +
          'Időigényes, de gyorsítja a megtakarítást.',
        financialEffects: [],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 65_000, durationRounds: -1, description: 'Mellékállás bevétel' },
        ],
        didYouKnow: 'Sok fiatal végez valamilyen mellékállást. Az ételfutár-appoknak dolgozó futárok bevétele erősen ingadozik (napszak, időjárás, borravaló) - számold ki, mennyi marad az üzemanyag és a járulékok után!',
      },
      {
        id: 'fs-d06-b',
        label: 'Képzésbe fektetsz (nyelvvizsga/jogosítvány)',
        description:
          'Nyelvvizsga: ~50 000 Ft. Jogosítvány: ~250 000 Ft. ' +
          'Hosszú távú befektetés: a nyelvvizsga +10-15% bérelőnyt jelent.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-language'],
        didYouKnow: 'A KSH adatai szerint egy nyelvvizsga átlagosan 10-15%-kal emeli a fizetést. Két nyelv? +25%. A befektetés megtérül 1-2 éven belül!',
        invests: [{ optionId: 'inv-language', amount: 150_000 }],
      },
      {
        id: 'fs-d06-c',
        label: 'Tartós megtakarítási terv',
        description:
          'Beállítasz egy automatikus átutalást megtakarítási számlára: 10 000 Ft/hó. ' +
          'Nem sok, de a rendszeresség az ereje. 5 év múlva meglepődsz.',
        financialEffects: [
          { target: 'other', amount: -10_000, description: 'Rendszeres megtakarítás (auto átutalás)' },
        ],
        didYouKnow: 'A „compound effect" (kamatos kamat hatás): havi 20 000 Ft megtakarítás 6% hozammal 10 év alatt 3.3 millió Ft. 20 év alatt 9.3 millió!',
      },
    ],
    characterPresets: ['fresh_start'],
    availableAtRounds: [11, 12],
  },
];

/**
 * Sorsfordító események - Fresh Start (Sprint mód)
 * 12 hónapra 12 esemény, egy 18 éves friss indulónak
 * Változatos, valós élethelyzetek – nem platform-specifikus
 */
export const FRESH_START_SCRIPTED_FATE_EVENTS = [
  {
    id: 'fate-fs-01', round: 1, title: 'Családi meglepetés',
    description:
      'A rokonok összedobtak az érettségi alkalmából. Borítékban összesen 50 000 Ft érkezett. ' +
      'Nem számítottál rá – mit kezdesz vele?',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 50_000 }],
  },
  {
    id: 'fate-fs-02', round: 2, title: 'Váratlan egészségügyi kiadás',
    description:
      'Elromlott egy fogad, és a TB csak részben fedezi a kezelést. ' +
      'Fogorvos + gyógyszer: –35 000 Ft.',
    type: 'negative' as const, effects: [{ target: 'balance', amount: -35_000 }],
  },
  {
    id: 'fate-fs-03', round: 3, requires: { chose: ['fs-d01-a', 'fs-d01-b'] }, title: 'Ösztöndíj-bónusz',
    description: 'Kiemelkedő félév! Extra tanulmányi jutalom: +40 000 Ft.',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 40_000 }],
  },
  {
    id: 'fate-fs-04', round: 4, title: 'Havi kiadások átvizsgálása',
    description:
      'Ránézel a bankszámlád kivonatára: streaming, appok, apró előfizetések összeadódnak. ' +
      'Van, amit hónapok óta nem használsz. Rendet raksz?',
    type: 'decision' as const, effects: [],
    options: [
      { label: 'Lemondod a felesleget (–5 000 Ft/hó)', effects: [{ target: 'other', amount: -5_000 }] },
      { label: 'Nem piszkálod, jó úgy', effects: [{ target: 'other', amount: 8_000 }] },
    ],
  },
  {
    id: 'fate-fs-05', round: 5, title: 'Alkalmi munka lehetőség',
    description:
      'Egy szomszéd költözik, segítséget kér. Egy nap fizikai munka: +30 000 Ft. ' +
      'Máskor egy rendezvényen hostessként / segéderőként kereshetsz: +15 000 Ft.',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 45_000 }],
  },
  {
    id: 'fate-fs-06', round: 6, title: 'Gyorsul a drágulás',
    liveCondition: 'inflacio_emelkedik' as const,
    description:
      'Gyorsul az infláció: az árak egy év alatt átlagosan {{inflation}}%-kal nőttek. ' +
      'A havi bevásárlás drágább lett, a rezsi is nőtt.',
    type: 'negative' as const, effects: [
      { target: 'food', amount: 5_000 },
      { target: 'utilities', amount: 3_000 },
    ],
  },
  {
    id: 'fate-fs-06b', round: 6, title: 'Lassul a drágulás',
    liveCondition: 'inflacio_csokken' as const,
    description:
      'Lassul az infláció: az árak egy év alatt átlagosan csak {{inflation}}%-kal nőttek. ' +
      'Ez jó hír, de az árszínvonal így is emelkedik - a félretett pénzed vásárlóereje lassabban, de tovább fogy.',
    type: 'negative' as const, effects: [
      { target: 'food', amount: 2_000 },
    ],
  },
  {
    id: 'fate-fs-07', round: 7, title: 'Étkezési szokások',
    description:
      'Visszanézed a havi étkezési kiadásaidat: rendelés + kávézó + streetfood = ' +
      'jóval több, mint az alap élelmiszer-büdzsé. Változtatsz?',
    type: 'decision' as const, effects: [],
    options: [
      { label: 'Otthon főzök, batchelek (–8 000 Ft/hó)', effects: [{ target: 'food', amount: -8_000 }] },
      { label: 'Marad így, nem akarok spórolni az evésen', effects: [{ target: 'food', amount: 10_000 }] },
    ],
  },
  {
    id: 'fate-fs-08', round: 8, title: 'Ismerős ajánl egy tanfolyamot',
    description:
      'Egy ismerős díjmentes online kurzust ajánl (táblázatkezelés, grafikai tervezés vagy programozás alapok). ' +
      'Ha elvégzed, új készséget szerezhetsz – és egy hétvégi freelance munkát is kapsz belőle!',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 25_000 }],
  },
  {
    id: 'fate-fs-09', round: 9, title: 'Megbízás ismerőstől',
    description:
      'Egy ismerős ajánlott: korrepetálás / kisebb megbízás → +35 000 Ft egyszeri bevétel.',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 35_000 }],
  },
  {
    id: 'fate-fs-10', round: 10, title: 'Impulzusvásárlás',
    description:
      'Egy akciós ajánlat csábított: ruha, kiegészítő, vagy tech-kütyü – „most vagy soha" áron. ' +
      'Utólag kiderült, hogy egyik sem volt igazán szükséges. Összesen: –35 000 Ft.',
    type: 'negative' as const, effects: [{ target: 'balance', amount: -35_000 }],
  },
  {
    id: 'fate-fs-11', round: 11, title: 'Pályázati nyeremény',
    description:
      'Jelentkeztél egy pályázatra (tanulmányi, sport, vagy közösségi) és díjat nyertél! ' +
      'Jutalom: +60 000 Ft.',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 60_000 }],
  },
  {
    id: 'fate-fs-12', round: 12, title: 'Ünnepi időszak kiadások',
    description:
      'Ajándékok a családnak, közös programok, szilveszteri buli – minden összeadódik: –40 000 Ft.',
    type: 'negative' as const, effects: [{ target: 'balance', amount: -40_000 }],
  },
];
