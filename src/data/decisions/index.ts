// ============================================================================
// PENZUGYI SORSFORDITO - Decision Trees Index
// Minden élethelyzet döntésfáinak összegyűjtése
// Marathon/Ultra adaptáció: sprint tartalom arányos átméretekezése
// ============================================================================

import type { DecisionCard, LifeSituationId, TimeScale } from '@/types/game';
import { meets, type Requires, type Situation } from '@/engine/situation';
import { withSituationRequires } from '../situation-requires';
import { TIME_SCALE_CONFIGS } from '@/types/game';

// --- Sprint döntésfák ---
import { DANI_DECISIONS_SPRINT, DANI_SCRIPTED_FATE_EVENTS } from './dani-sprint';
import { FRESH_START_DECISIONS_SPRINT, FRESH_START_SCRIPTED_FATE_EVENTS } from './fresh-start-sprint';
import { INHERITANCE_DECISIONS_SPRINT, INHERITANCE_SCRIPTED_FATE_EVENTS } from './inheritance-sprint';

// --- Extended döntésfák (Marathon/Ultra mód: 13-20. kör) ---
import { DANI_EXTENDED_DECISIONS } from './dani-extended';
import { FRESH_START_EXTENDED_DECISIONS } from './fresh-start-extended';
import { INHERITANCE_EXTENDED_DECISIONS } from './inheritance-extended';
import { liveConditionHolds, type LiveCondition } from '@/data/live/vars';
import { isEmployed } from '@/engine/employment';

// Re-export az egyedi fájlokból
export { DANI_DECISIONS_SPRINT, DANI_SCRIPTED_FATE_EVENTS } from './dani-sprint';
export { FRESH_START_DECISIONS_SPRINT, FRESH_START_SCRIPTED_FATE_EVENTS } from './fresh-start-sprint';
export { INHERITANCE_DECISIONS_SPRINT, INHERITANCE_SCRIPTED_FATE_EVENTS } from './inheritance-sprint';
export { DANI_EXTENDED_DECISIONS } from './dani-extended';
export { FRESH_START_EXTENDED_DECISIONS } from './fresh-start-extended';
export { INHERITANCE_EXTENDED_DECISIONS } from './inheritance-extended';

// ============================================================================
// Sprint → Marathon/Ultra adaptáció
// A sprint döntéseket arányosan szétterítjük a hosszabb játékmódokban.
// Sprint 12 kör (12 hónap) → Marathon 20 kör (5 év) → Ultra 20 kör (10 év)
// ============================================================================

const SPRINT_TOTAL_ROUNDS = TIME_SCALE_CONFIGS.sprint.totalRounds; // 12

/**
 * Sprint döntés körszámait átméretekezni a célskálára.
 * Arányos: sprint round R → target round = ceil(R / 12 * targetTotal)
 * Minimum 2 körös ablak, hogy legyen idő megtalálni.
 */
function mapRoundsToScale(
  sprintRounds: number[],
  targetTotalRounds: number
): number[] {
  // Az 1. kör döntése (pl. pályaválasztás, lakhatás) minden módban az 1. körben marad: előbb dől el, merre indulsz
  const mapped = sprintRounds.map((r) =>
    r === 1 ? 1 : Math.max(1, Math.min(targetTotalRounds, Math.round((r / SPRINT_TOTAL_ROUNDS) * targetTotalRounds)))
  );
  // Deduplikáció + rendezés
  const unique = [...new Set(mapped)].sort((a, b) => a - b);
  // Ha egyetlen körnél landolt, adjunk hozzá egyet (legyen 2 körös ablak)
  if (unique.length === 1 && unique[0] < targetTotalRounds) {
    unique.push(unique[0] + 1);
  }
  return unique;
}

/**
 * Sprint döntéskártyák adaptálása egy másik időskálára.
 * - Az availableAtRounds arányosan átskálázzuk
 * - Az id-ket megtartjuk (a completedIds rendszer így működik)
 */
function mapDecisionsToScale(
  sprintDecisions: DecisionCard[],
  targetScale: TimeScale
): DecisionCard[] {
  const targetTotal = TIME_SCALE_CONFIGS[targetScale].totalRounds;
  return sprintDecisions.map((d) => ({
    ...d,
    availableAtRounds: mapRoundsToScale(d.availableAtRounds, targetTotal),
  }));
}

/**
 * Sprint sorsfordító események adaptálása más időskálákra.
 * A round számot arányosan skálázzuk.
 */
function mapFateEventsToScale(
  sprintEvents: FateEventEntry[],
  targetScale: TimeScale
): FateEventEntry[] {
  const targetTotal = TIME_SCALE_CONFIGS[targetScale].totalRounds;
  return sprintEvents.map((e) => ({
    ...e,
    round: Math.max(1, Math.min(targetTotal, Math.round((e.round / SPRINT_TOTAL_ROUNDS) * targetTotal))),
  }));
}

// ============================================================================
// Generikus döntések a sprint tartalom utáni körökre
// (A sprint csak az első évet fedi le; marathon/ultra esetén a később kör is
// kap tartalmat, ha az arányos átméretekezés nem éri el.)
// ============================================================================

/**
 * Generikus "éves mérleg" típusú döntések, amelyek az arányosan áttett sprint
 * döntések UTÁN kerülnek, ha maradnak üres körök.
 * Ezek mindegyik élethelyzetre egyformák.
 */
export const GENERIC_LATE_GAME_DECISIONS: DecisionCard[] = [
  {
    id: 'gen-career-review',
    requires: { employed: true },
    category: 'Karrier',
    title: 'Karrierváltás?',
    situation:
      'Egy ideje már a jelenlegi munkahelyeden dolgozol. Egyenleged: {{balance}} Ft. ' +
      'Kaptál egy ajánlatot egy másik cégtől. A fizetésed most {{salary}} Ft/hó.',
    dynamicVariables: {
      balance: 'player.balance',
      salary: 'player.income.salary',
    },
    options: [
      {
        id: 'gen-career-a',
        label: 'Váltasz: +20% fizetés, új kihívás',
        description:
          'Az új cég 20%-kal többet kínál, de próbaidő alatt 3 hónap bizonytalan.',
        raisesSalaryPct: 20,
        financialEffects: [],
        didYouKnow:
          'A legnagyobb fizetésemelés Magyarországon munkahelyváltáskor jön: átlag 15-25%. ' +
          'Belső emelés ritkán haladja meg az évi 5-8%-ot.',
      },
      {
        id: 'gen-career-b',
        label: 'Maradsz: stabilitás + emelést kérsz',
        description:
          'Beszélsz a főnökkel, és sikerül 10%-os emelést kialkudnod.',
        raisesSalaryPct: 10,
        financialEffects: [],
        didYouKnow:
          'Tipp: éves teljesítményértékeléskor mindig kérj emelést! ' +
          'A legtöbb munkáltató számít rá, és automatikus emelés ritkán van.',
      },
      {
        id: 'gen-career-c',
        label: 'Nem változtatsz',
        description: 'Minden megy tovább, ahogy eddig.',
        financialEffects: [],
        didYouKnow:
          'Ha a fizetésed nem nő legalább az inflációval (most {{inflation}}%), valójában csökken. ' +
          '2023-2025 között az átlagbér ~10%-kal emelkedett évente.',
      },
    ],
    characterPresets: ['fresh_start', 'career_start', 'inheritance'],
    availableAtRounds: [], // Dinamikusan töltjük
  },
  {
    id: 'gen-invest-review',
    category: 'Befektetés',
    title: 'Befektetési stratégia',
    situation:
      'Nettó vagyonod: {{netWorth}} Ft. Ideje áttekinteni a befektetéseidet. ' +
      'A PMÁP hozam most {{pmap_yield}}%, az infláció {{inflation}}%.',
    dynamicVariables: {},
    options: [
      {
        id: 'gen-invest-a',
        label: 'Agresszív: ETF + részvény',
        description:
          'Pénzed nagyobb részét tőzsdébe teszed. Magasabb hozam, de nagyobb kockázat.',
        financialEffects: [],
        invests: [{ optionId: 'inv-tbsz-etf', amount: 200_000 }],
        didYouKnow:
          'Az amerikai részvénypiac (S&P 500) átlagos éves hozama ~10% volt (1926-2024). ' +
          'De volt olyan év, amikor -37% esett (2008). Türelem kell!',
      },
      {
        id: 'gen-invest-b',
        label: 'Kiegyensúlyozott: PMÁP + vegyes',
        description:
          'Az állampapír biztonságos, a PMÁP kamata az inflációt követi.',
        financialEffects: [],
        invests: [{ optionId: 'inv-pmap', amount: 100_000 }],
        didYouKnow:
          'A PMÁP (Prémium Magyar Állampapír) kamata most {{pmap_yield}}%: az előző évi átlagos inflációt ({{prev_year_inflation}}%) követi egy kis prémiummal. ' +
          'Államgarancia, évente egyszeri kamatfizetés, és lejárat előtt is visszaváltható.',
      },
      {
        id: 'gen-invest-c',
        label: 'Óvatos: megtakarítás bankszámlán',
        description:
          'Lekötöd a megtakarítást. Biztonságos, de a hozam az infláció közelében marad.',
        financialEffects: [],
        didYouKnow:
          'A lekötött bankbetét most átlagosan {{deposit_rate}}% kamatot ad, az infláció {{inflation}}%. ' +
          'A kamatból 28% adót vonnak le, így reálértéken kevés marad — viszont a pénzed biztonságban van (OBA).',
      },
    ],
    characterPresets: ['fresh_start', 'career_start', 'inheritance'],
    availableAtRounds: [], // Dinamikusan töltjük
  },
  {
    id: 'gen-life-milestone',
    requires: { rentsHome: true },
    category: 'Életmód',
    title: 'Életszínvonal emelése?',
    situation:
      'Jól keresed a kenyered: {{salary}} Ft/hó. Lakhatásra {{housing}} Ft-ot költesz. ' +
      'Az ismerősi kör nyomást gyakorol: jobb lakás, jobb autó, drágább nyaralás...',
    dynamicVariables: {
      salary: 'player.income.salary',
      housing: 'player.expenses.housing',
    },
    options: [
      {
        id: 'gen-life-a',
        requires: { sharesFlat: true },
        label: 'Feljebb lépsz (drágább albérlet)',
        description:
          'Saját lakás, nem lakótárssal. Kényelmesebb, de +80 000 Ft/hó.',
        financialEffects: [
          { target: 'housing', amount: 80_000, description: 'Drágább albérlet (felár)' },
        ],
        didYouKnow:
          'A „lifestyle inflation" a #1 oka annak, hogy a fizetésemelés nem épít vagyont. ' +
          'Ha a fizetésed 20%-kal nő, de a kiadásaid is: semmit sem nyertél.',
      },
      {
        id: 'gen-life-b',
        label: 'Tudatosan maradsz: megtakarításba teszed',
        description:
          'Nem emelkedsz. A többletet befekteted. Hosszú távon ez az erős döntés.',
        financialEffects: [
          { target: 'balance', amount: 100_000, description: 'Extra megtakarítás' },
        ],
        didYouKnow:
          'A „pay yourself first" szabály: a bevételed 20%-át automatikusan félretenni, ' +
          'MIELŐTT bármi mást költenél. Ez az #1 vagyonépítési szokás.',
      },
    ],
    characterPresets: ['fresh_start', 'career_start', 'inheritance'],
    availableAtRounds: [], // Dinamikusan töltjük
  },

  // ============================================================================
  // ÚJ generikus döntések — Tartalombővítés (Marathon/Ultra lyuktöltés)
  // ============================================================================

  {
    id: 'gen-insurance-review',
    category: 'Pénzkezelés',
    title: 'Biztosítási felülvizsgálat',
    situation:
      'A biztosítási tanácsadód felhív: érdemes felülvizsgálni a meglévő biztosításaidat. ' +
      'Lehet, hogy többet fizetsz, mint kellene — vagy pont hiányzik valami fontos.',
    options: [
      {
        id: 'gen-insurance-a',
        label: 'Átváltasz olcsóbb biztosítóra',
        description:
          'Összehasonlítod egy online biztosítási összehasonlító oldalon az ajánlatokat és évi 40 000 Ft-ot spórolsz.',
        financialEffects: [
          { target: 'other', amount: -3_300, description: 'Biztosítás megtakarítás (havi)' },
        ],
        didYouKnow:
          'Egy online összehasonlító oldalon néhány perc alatt összevetheted a biztosítók ajánlatait. ' +
          'Átlagosan 20-30%-ot spórolhatsz éves szinten csak a váltással!',
      },
      {
        id: 'gen-insurance-b',
        label: 'Kötesz lakásbiztosítást is',
        description:
          'Eddig nem volt lakásbiztosításod. Évi ~40 000 Ft, de fedezi a víz-, tűz- és betöréskárt.',
        financialEffects: [
          { target: 'other', amount: 3_500, description: 'Lakásbiztosítás (havi)' },
        ],
        didYouKnow:
          'Magyarországon a lakások csak ~60%-a van biztosítva. Egy vízcsőtörés javítása ' +
          '200-500 000 Ft — biztosítással a biztosító fizeti.',
      },
      {
        id: 'gen-insurance-c',
        label: 'Nem változtatsz',
        description: 'Marad minden a régiben.',
        financialEffects: [],
        didYouKnow:
          'A biztosítás olyan, mint az esernyő: feleslegesnek tűnik, amíg nem esik.',
      },
    ],
    characterPresets: ['fresh_start', 'career_start', 'inheritance'],
    availableAtRounds: [],
  },
  {
    id: 'gen-side-income',
    category: 'Vállalkozás',
    title: 'Mellékbevétel lehetőség',
    situation:
      'Egy ismerős felajánl egy rendszeres mellékállás-lehetőséget. ' +
      'A kérdés: megéri-e az időráfordítás a plusz pénzért?',
    options: [
      {
        id: 'gen-side-a',
        label: 'Elvállalod: +60 000 Ft/hó',
        description:
          'Hétvégente 5-6 óra extra munka, de a pénz jól jön.',
        financialEffects: [
          { target: 'salary', amount: 60_000, description: 'Mellékállás bevétel' },
        ],
        didYouKnow:
          'A magyar munkavállalók ~25%-a végez valamilyen mellékállást. ' +
          'A mellékbevétel is adóköteles — átalányadóval a legegyszerűbb!',
      },
      {
        id: 'gen-side-b',
        label: 'Online passzív bevétel építés',
        description:
          'Online kurzus / blog / affiliate marketing indítás. Kezdetben nem fizet, de skálázható.',
        financialEffects: [
          { target: 'balance', amount: -80_000, description: 'Online platform indítás' },
        ],
        didYouKnow:
          'A passzív jövedelem felépítése 6-12 hónapot vesz igénybe, de utána minimális munkával működik.',
      },
      {
        id: 'gen-side-c',
        label: 'Nem vállalsz mellékállást',
        description: 'A szabadidőd fontosabb — pihenés, fejlődés, kapcsolatok.',
        financialEffects: [],
        didYouKnow:
          'A work-life balance nem luxus: a burnout évi 100-200 000 Ft egészségügyi költséget okozhat.',
      },
    ],
    characterPresets: ['fresh_start', 'career_start', 'inheritance'],
    availableAtRounds: [],
  },
  {
    id: 'gen-debt-management',
    category: 'Adósságkezelés',
    title: 'Adósságkezelés felülvizsgálat',
    situation:
      'Havi törlesztőid: {{loanPayments}} Ft. Érdemes lehet gyorsabban törleszteni ' +
      'vagy refinanszírozni.',
    dynamicVariables: {
      loanPayments: 'player.expenses.loanPayments',
    },
    options: [
      {
        id: 'gen-debt-a',
        label: 'Extra előtörlesztés',
        description:
          'Egyszeri 100 000 Ft-ot ráteszel a legdrágább hitelre. A részlet marad, a futamidő rövidül.',
        financialEffects: [
        ],
        didYouKnow:
          'Az előtörlesztés „garantált hozam": ha a hiteled kamata 8%, az előtörlesztéssel 8%-ot „keresed". ' +
          'Nincs befektetés, ami ezt kockázat nélkül hozza.',
        paysOffLoan: { amount: 100_000 },
      },
      {
        id: 'gen-debt-b',
        label: 'Hitelkiváltás (refinanszírozás)',
        description:
          'Olcsóbb hitelt keresel a meglévő helyett. Ha 2%-kal jobb a THM, megéri.',
        financialEffects: [
          { target: 'balance', amount: -50_000, description: 'Hitelkiváltási díjak' },
        ],
        didYouKnow:
          'A hitelkiváltásnál számold bele az előtörlesztési díjat és az új hitel induló költségeit is. ' +
          'Mindig a THM-et hasonlítsd, ne csak a kamatot!',
        adjustsLoan: { paymentDelta: -8_000 },
      },
      {
        id: 'gen-debt-c',
        label: 'Nem változtatsz',
        description: 'A jelenlegi törlesztés rendben van.',
        financialEffects: [],
        didYouKnow:
          'Ha a hitel kamata < befektetési hozam, matematikailag jobb a minimális törlesztés. ' +
          'DE: a pszichológiai teher is számít — az adósságmentesség jól esik.',
      },
    ],
    characterPresets: ['fresh_start', 'career_start', 'inheritance'],
    availableAtRounds: [],
  },
  {
    id: 'gen-education-upgrade',
    category: 'Karrier',
    title: 'Képzés vagy továbbképzés',
    situation:
      'A munkaerőpiac változik: AI, automatizáció, új technológiák. ' +
      'Érdemes-e időt és pénzt befektetni a tudásodba?',
    options: [
      {
        id: 'gen-edu-a',
        label: 'Szakmai tanfolyam (online)',
        description:
          'Online kurzusplatformon elérhető képzés: –50 000 Ft egyszeri. 2-3 hónap tanulás, értékes tudás.',
        financialEffects: [
          { target: 'balance', amount: -50_000, description: 'Online kurzus díja' },
          { target: 'salary', amount: 25_000, description: 'Béremelkedés a képzés után' },
        ],
        didYouKnow:
          'Az online kurzusplatformok képzései sokszor néhány ezer forintba kerülnek, de a tudás tartósan emeli a piaci értéked.',
      },
      {
        id: 'gen-edu-b',
        label: 'Nyelvvizsga megszerzése',
        description:
          'Nyelvtanfolyam + vizsga: –120 000 Ft. A nyelvtudás 15-25%-kal emeli a fizetésedet.',
        financialEffects: [
          { target: 'balance', amount: -120_000, description: 'Nyelvtanfolyam + vizsgadíj' },
          { target: 'salary', amount: 40_000, description: 'Nyelvvizsga miatti béremelkedés' },
        ],
        didYouKnow:
          'A KSH szerint a nyelvvizsga átlagosan 10-15%-kal emeli a fizetést. ' +
          'Két nyelv? +25%. A befektetés 1-2 éven belül megtérül.',
      },
      {
        id: 'gen-edu-c',
        label: 'Nem tanulsz most',
        description: 'A gyakorlati tapasztalat is értékes — nem minden tanulás kerül pénzbe.',
        financialEffects: [],
        didYouKnow:
          'Az „on-the-job training" (munka közbeni tanulás) a legértékesebb — ' +
          'de a formális képzés nyitja a karrierugrást.',
      },
    ],
    characterPresets: ['fresh_start', 'career_start', 'inheritance'],
    availableAtRounds: [],
  },
  {
    id: 'gen-housing-upgrade',
    requires: { rentsHome: true },
    category: 'Lakhatás',
    title: 'Lakhatási döntés',
    situation:
      'Lakhatásra {{housing}} Ft-ot költesz havonta. A környéken drágulnak az albérletek. ' +
      'Ideje átgondolni a lakáshelyzeted?',
    dynamicVariables: {
      housing: 'player.expenses.housing',
    },
    options: [
      {
        id: 'gen-house-a',
        label: 'Lakásvásárlás (ha megvan az önerő)',
        description:
          'Önerő + lakáshitel: hosszú távon olcsóbb, mint albérlet. De 20-30 évre köt le.',
        financialEffects: [
          { target: 'balance', amount: -2_000_000, description: 'Lakásvásárlás önerő' },
          { target: 'housing', amount: -100_000, description: 'Albérlet helyett saját' },
        ],
        didYouKnow:
          'Budapesten a használt lakások átlagos négyzetméterára most {{sqm_bp}} Ft - egy 50 m²-es lakás ennek ötvenszerese. ' +
          'A CSOK Plusz-szal akár 3% kamattal is hitelezhetnek.',
        takesLoan: { name: 'Lakáshitel', type: 'mortgage', monthlyPayment: 110_000, months: 240, rateKey: 'bank.mortgageThm' },
        acquiresAsset: { id: 'lakas', name: 'Saját lakás (vételár)', value: 2_000_000, plusLoanPrincipal: true },
      },
      {
        id: 'gen-house-b',
        label: 'Olcsóbb albérletet keresel',
        description:
          'Kevésbé felkapott helyen 20-30%-kal olcsóbb az albérlet.',
        financialEffects: [
          { target: 'balance', amount: -200_000, description: 'Költözési költségek + kaució' },
          { target: 'housing', amount: -30_000, description: 'Olcsóbb albérlet' },
        ],
        didYouKnow:
          'Budapest XIII-XIV. kerületeiben 20-30%-kal olcsóbb az albérlet, mint a belvárosban. ' +
          'Az ingázási idő gyakran csak +10-15 perc.',
      },
      {
        id: 'gen-house-c',
        label: 'Maradsz a jelenlegi helyen',
        description: 'A stabilitás is érték — nem kell mindig változtatni.',
        financialEffects: [],
        didYouKnow:
          'A költözés rejtett költségei: kaució (2 hó), festés, bútorszállítás, internet átírás ' +
          '— összesen akár 300-500 000 Ft.',
      },
    ],
    characterPresets: ['fresh_start', 'career_start', 'inheritance'],
    availableAtRounds: [],
  },
];

/**
 * Generikus döntések dinamikus körszám-hozzárendelése.
 * A sprint tartalom arányos áttétele után megkeressük az üres köröket,
 * és oda tesszük a generikus döntéseket.
 */
function fillGapsWithGenericDecisions(
  mappedSprintDecisions: DecisionCard[],
  targetTotal: number
): DecisionCard[] {
  // Mely körökben van már döntés?
  const coveredRounds = new Set<number>();
  for (const d of mappedSprintDecisions) {
    for (const r of d.availableAtRounds) {
      coveredRounds.add(r);
    }
  }

  // Összegyűjtjük az ÖSSZES üres kört (nem kell min 2 egymás utáni)
  const emptyRounds: number[] = [];
  for (let r = 1; r <= targetTotal; r++) {
    if (!coveredRounds.has(r)) {
      emptyRounds.push(r);
    }
  }

  // A generikus döntések bármelyik üres körben jöhetnek: az első, amelyik a játékos helyzetéhez illik
  // (pl. hitelkezelés csak hitellel, befektetési áttekintés csak befektetéssel), és mindegyik egyszer
  // A karakter első döntése előtt nem jön generikus döntés (előbb dől el, merre indul)
  const firstOwn = Math.min(...mappedSprintDecisions.flatMap((d) => d.availableAtRounds), targetTotal);
  const genericRounds = emptyRounds.filter((r) => r > firstOwn);
  const generics: DecisionCard[] = genericRounds.length
    ? GENERIC_LATE_GAME_DECISIONS.map((gen) => ({ ...gen, availableAtRounds: genericRounds }))
    : [];

  return [...mappedSprintDecisions, ...generics];
}

/**
 * Generikus sorsfordító események a sprint utáni körökre.
 */
export const GENERIC_FATE_EVENTS: FateEventEntry[] = [
  // --- Pozitív események (fizetés kell) ---
  {
    id: 'fate-gen-01', round: 0, title: 'Fizetésemelés',
    description: 'A munkahelyed éves inflációkövető emelést adott (az infláció most {{inflation}}%): +15 000 Ft nettó havonta.',
    type: 'positive' as const,
    effects: [{ target: 'salary', amount: 15_000 }],
    requires: { hasSalary: true, employed: true },
  },
  {
    id: 'fate-gen-03', round: 0, title: 'Prémium a cégtől',
    description: 'Jó évet zárt a cég — kaptál egyhavi prémiumot!',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 200_000 }],
    requires: { hasSalary: true, employed: true },
  },
  {
    id: 'fate-gen-05', round: 0, title: 'Sikeres próbaidő/értékelés',
    description: 'A féléves teljesítményértékelésed kiváló lett. A főnöködtől kaptál egyszeri juttatást.',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 100_000 }],
    requires: { hasSalary: true, employed: true },
  },
  // --- Pozitív események (mindig) ---
  {
    id: 'fate-gen-07', round: 0, title: 'Adó-visszaigénylés',
    description: 'Az SZJA-bevallásból visszakapsz: +45 000 Ft (adókedvezmény).',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 45_000 }],
  },
  {
    id: 'fate-gen-09', round: 0, title: 'Garázsvásár / Vaterás eladás',
    description: 'Rendet raktál és eladtad a felesleges holmikat online. Bevétel: +35 000 Ft.',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 35_000 }],
  },
  {
    id: 'fate-gen-10', round: 0, title: 'Cashback-akció a banktól',
    description: 'A bankkártyás vásárlásaid után cashback-ot kaptál: +15 000 Ft.',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 15_000 }],
  },
  {
    id: 'fate-gen-15', round: 0, title: 'Nagyszülői meglepetés',
    description: 'A nagymamád / nagypapád névnapodra borítékot küldött: +25 000 Ft.',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 25_000 }],
  },
  // --- Negatív események (mindig) ---
  {
    id: 'fate-gen-04', round: 0, title: 'Rezsiárak emelkedtek',
    description: 'A gázszolgáltató árkorrekciót hajtott végre – havi rezsid megemelkedett.',
    type: 'negative' as const,
    effects: [{ target: 'utilities', amount: 4_000 }],
  },
  {
    id: 'fate-gen-06', round: 0, title: 'Családi esemény',
    description: 'Esküvőre hívtak – ajándék, öltöny/ruha, utazás összesen: –60 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -60_000 }],
  },
  {
    id: 'fate-gen-08', round: 0, title: 'Fogorvos + szemüveg',
    description: 'Félévente esedékes fogorvosi vizsgálat + új szemüveg/kontaktlencse: –40 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -40_000 }],
  },
  {
    id: 'fate-gen-11', round: 0, title: 'Telefon tönkrement',
    description: 'A mobilod kijelzője összetört. Új telefon vagy javítás: –75 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -75_000 }],
  },
  {
    id: 'fate-gen-12', round: 0, title: 'Mosógép leállt',
    description: 'A mosógéped megadta magát 8 év után. Új gép + kiszállítás: –95 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -95_000 }],
  },
  {
    id: 'fate-gen-13', round: 0, title: 'Közlekedési bírság',
    description: 'Lejárt a parkolójegyed / sebességtúllépés – bírság: –30 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -30_000 }],
  },
  {
    id: 'fate-gen-14', round: 0, title: 'Vízvezeték-javítás',
    description: 'A csap / WC-öblítő meghibásodott. Vízszerelő kiszállás + alkatrész: –55 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -55_000 }],
  },
  {
    id: 'fate-gen-16', round: 0, title: 'Élelmiszerárak emelkedtek',
    description: 'A havi élelmiszer-kiadásaid emelkedtek az árak növekedése miatt.',
    type: 'negative' as const,
    effects: [{ target: 'food', amount: 5_000 }],
  },
  {
    id: 'fate-gen-17', round: 0, title: 'Gyógyszertári kiadás',
    description: 'Megfáztál és antibiotikumra + vitaminokra volt szükséged: –20 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -20_000 }],
  },
  // --- Autó-specifikus (csak ha van autó) ---
  {
    id: 'fate-gen-02', round: 0, title: 'Váratlan autójavítás',
    description: 'Meghibásodott a fék/kuplung. Szervizköltség: –85 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -85_000 }],
    requires: { hasHighTransport: true },
  },
  {
    id: 'fate-gen-18', round: 0, title: 'Autó műszaki vizsga',
    description: 'A műszaki vizsgán kiderült, hogy cserélni kell a féktárcsát. Vizsga + javítás: –65 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -65_000 }],
    requires: { hasHighTransport: true },
  },

  // ============================================================================
  // ÚJ generikus sorsfordítók — Tartalombővítés
  // ============================================================================

  // --- Pozitívak ---
  {
    id: 'fate-gen-19', round: 0, title: 'Munkáltatói cafeteria',
    description:
      'A munkáltatód bővítette a cafeteriát: a SZÉP-kártyádra mostantól havonta jut egy kis keret ' +
      '(szakképzési munkaszerződéssel tanulóként is jár, arányosan, ha az azonos munkakörű kollégák is kapják). ' +
      'Ez nem készpénz - csak meghatározott célra (például étkezésre) költhető, ezért az étkezési kiadásod csökken, nem az egyenleged nő.',
    type: 'positive' as const,
    effects: [{ target: 'food', amount: -10_000 }],
    requires: { hasSalary: true, employed: true },
  },
  {
    id: 'fate-gen-20', round: 0, title: 'Nyereménybetét sorsolás',
    description: 'A bankod nyereménybetét-sorsolásán 150 000 Ft-ot nyertél! Megérte a lekötés.',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 150_000 }],
  },
  {
    id: 'fate-gen-21', round: 0, title: 'Családi adókedvezmény visszaigénylés',
    description: 'A NAV feldolgozta a bevallásodat: a családi adókedvezmény miatt 55 000 Ft-ot visszakapsz.',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 55_000 }],
  },
  {
    id: 'fate-gen-22', round: 0, title: 'Online kurzus bevétel',
    description: 'Egy korábbi online kurzus/tutorial amit készítettél, most is hoz bevételt: +25 000 Ft.',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 25_000 }],
  },
  {
    id: 'fate-gen-23', round: 0, title: 'Háztartási tárgy eladása',
    description: 'Egy online piactéren eladtad a régi bútorodat/kütyüdet: +40 000 Ft.',
    type: 'positive' as const,
    effects: [{ target: 'balance', amount: 40_000 }],
  },

  // --- Negatívak ---
  {
    id: 'fate-gen-24', round: 0, title: 'Háztartási gép meghibásodás',
    description: 'A hűtőszekrény kompresszora leállt. Javítás/csere: –110 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -110_000 }],
  },
  {
    id: 'fate-gen-25', round: 0, title: 'Albérleti kaució elvesztés',
    requires: { rentsHome: true },
    description: 'Az előző főbérlő visszatartotta a kauciód egy részét „festés" címén: –80 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -80_000 }],
  },
  {
    id: 'fate-gen-26', round: 0, title: 'Nyaralás túlköltekezés',
    description: 'A nyaralás drágább lett a tervezettnél (szállás áremelkedés, extra programok): –120 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -120_000 }],
  },
  {
    id: 'fate-gen-27', round: 0, title: 'Parkolási bírság',
    description: 'Parkolóőr bírságot írt: lejárt a parkolójegyed. –30 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -30_000 }],
  },
  {
    id: 'fate-gen-28', round: 0, title: 'Elektromos hiba javítás',
    description: 'A lakásod biztosítéka kiégett, villanyszerelő kellett. Javítás: –55 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -55_000 }],
  },
  {
    id: 'fate-gen-29', round: 0, title: 'Háziállat állatorvos',
    description: 'A kutyád/macskád megbetegedett. Vizsgálat + kezelés + gyógyszer: –45 000 Ft.',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -45_000 }],
  },
  {
    id: 'fate-gen-30', round: 0, title: 'Élelmiszer áremelkedés',
    description: 'Az alapélelmiszerek ára ismét emelkedett. A havi bevásárlás +6 000 Ft-tal drágább.',
    type: 'negative' as const,
    effects: [{ target: 'food', amount: 6_000 }],
  },
];

// ============================================================================
// Tudáspróbás sorsfordító események
// A játékos a korábban megszerzett tudásból kérdést kap. Helyes válasz = jutalom.
// Ezek MÁS kérdések, mint a kártya-vásárláskori kvíz!
// ============================================================================

export const GENERIC_KNOWLEDGE_FATE_EVENTS: FateEventEntry[] = [
  {
    id: 'fate-know-01',
    round: 0,
    title: 'Alkalmi könyvelési munka!',
    description:
      'Egy kisvállalkozó ismerősöd segítséget kér a NAV-bevallásához. ' +
      'Ha értesz az adózáshoz, jól fizet érte.',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-tax',
      quiz: {
        question: 'Melyik adónem NEM terheli a munkavállalót közvetlenül?',
        options: [
          'SZJA (személyi jövedelemadó)',
          'TB-járulék (18,5%)',
          'Szociális hozzájárulási adó (SZOCHO)',
        ],
        correctIndex: 2,
        explanation:
          'A SZOCHO-t a munkáltató fizeti a bruttó bér 13%-a mértékében – ' +
          'nem vonják le a fizetésedből! Az SZJA (15%) és a TB (18,5%) viszont igen.',
      },
      successEffects: [{ target: 'balance', amount: 60_000 }],
      noKnowledgeMessage:
        'Ehhez az „Adóoptimalizálás 101" tudáskártyára van szükséged. Szerezd meg a Befektetés fázisban!',
      failureMessage:
        'Sajnos nem sikerült – az ismerősöd mást kért fel. De tanultál belőle!',
    },
  },
  {
    id: 'fate-know-02',
    round: 0,
    title: 'Freelance webfejlesztés',
    description:
      'Egy startup gyors weblap-javítást kér tőled. Online fizetéssel dolgoznál – ' +
      'de tudnod kell a biztonságos számlázás alapjait.',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-digital',
      quiz: {
        question: 'Melyik fizetési mód a legbiztonságosabb online munka esetén?',
        options: [
          'Azonnali banki átutalás (AFR) a saját számlára',
          'Előre utalás ismeretlen megbízónak online fizetési szolgáltatáson',
          'Kriptovalutás fizetés anonim walletbe',
        ],
        correctIndex: 0,
        explanation:
          'Az AFR (azonnali fizetési rendszer) 5 mp alatt megérkezik, a bank nyilvántartja ' +
          'a tranzakciót, és a pénz a saját nevedre szóló számlára jön. Biztonságos és nyomon követhető!',
      },
      successEffects: [{ target: 'balance', amount: 80_000 }],
      noKnowledgeMessage:
        'Ehhez a „Digitális pénzügyek" tudáskártyára van szükséged. Szerezd meg a Befektetés fázisban!',
      failureMessage:
        'Nem tudtad a helyes választ, a megrendelő mást keresett. Legközelebb jobban sikerül!',
    },
  },
  {
    id: 'fate-know-03',
    round: 0,
    requires: { employed: true },
    title: 'Munkahelyi konfliktus',
    description:
      'A főnököd jogtalanul le akar vonni a fizetésedből egy hibáért. ' +
      'Ha ismered a munkajogot, megvédheted magad!',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -30_000 }],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-labor',
      quiz: {
        question: 'Levonhat-e a munkáltató a fizetésedből egyoldalúan?',
        options: [
          'Igen, ha a főnök úgy dönt',
          'Nem, csak bírósági ítélettel vagy írásos hozzájárulással',
          'Igen, ha az összeg kisebb, mint a minimálbér',
        ],
        correctIndex: 1,
        explanation:
          'A Munka Törvénykönyve szerint a munkáltató NEM vonhat le egyoldalúan a fizetésből. ' +
          'Csak bírósági ítélettel, végrehajtással, vagy a munkavállaló írásos hozzájárulásával.',
      },
      successEffects: [{ target: 'balance', amount: 30_000 }],
      noKnowledgeMessage:
        'Ehhez a „Munkajog alapok" tudáskártyára van szükséged. A levonás sajnos megtörtént.',
      failureMessage:
        'Nem tudtad pontosan az érvedet, a levonás megmaradt. De legközelebb tudni fogod!',
    },
  },
  {
    id: 'fate-know-04',
    round: 0,
    title: 'Adósság-átütemezés lehetőség',
    description:
      'A banki tanácsadó felhív: lehetőséged van a hiteled átütemezésére, ' +
      'kedvezőbb feltételekkel. De tudnod kell, mire figyelj!',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-debt',
      quiz: {
        question: 'Hitelkiváltásnál (refinanszírozás) mire figyelsz elsősorban?',
        options: [
          'A havi törlesztőrészlet legyen minél alacsonyabb',
          'A futamidő legyen minél hosszabb',
          'A teljes visszafizetendő összeg, díjakkal együtt',
        ],
        correctIndex: 2,
        explanation:
          'A kiváltás akkor éri meg, ha az új hitel teljes visszafizetendő összege (a THM-ből adódik) a váltás ' +
          'költségeivel - előtörlesztési díj, új hitel díjai - együtt is kisebb, mint a régié. ' +
          'A hosszabb futamidő alacsonyabb törlesztőt jelent, de TÖBB összes kamatot.',
      },
      successEffects: [{ target: 'loanPayments', amount: -15_000 }],
      noKnowledgeMessage:
        'Ehhez az „Adósságkezelés" tudáskártyára van szükséged. Sajnos lemaradtál a lehetőségről.',
      failureMessage:
        'Nem tudtad megítélni az ajánlatot, ezért nem mertél váltani. A régi hitel marad.',
    },
  },
  {
    id: 'fate-know-05',
    round: 0,
    title: 'Vészhelyzeti kiadás!',
    description:
      'Elromlott a telefonod, és sürgős fogorvosi kezelésre is szükséged van. ' +
      'Összesen 80 000 Ft váratlan kiadás. Felkészültél a vészhelyzetre?',
    type: 'negative' as const,
    effects: [{ target: 'balance', amount: -80_000 }],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-savings',
      quiz: {
        question: 'Hol érdemes tartani a vészhelyzeti alapot?',
        options: [
          'Azonnal elérhető bankszámlán vagy rövid lejáratú betétben',
          'Részvényekben, mert ott a legjobb a hozam',
          'Készpénzben a párnacihában',
        ],
        correctIndex: 0,
        explanation:
          'A vészhelyzeti alapnak LIKVID-nek kell lennie: azonnal elérhető bankszámlán ' +
          'vagy max. 1 napos lekötésű betétben. A cél nem a hozam, hanem a gyors hozzáférés!',
      },
      successEffects: [{ target: 'balance', amount: 40_000 }],
      noKnowledgeMessage:
        'Ehhez a „Megtakarítás 101" tudáskártyára van szükséged. A teljes összeget elveszítetted.',
      failureMessage:
        'A vészhelyzeti alapod nem volt jól elhelyezve. A teljes összeg elment.',
    },
  },
  {
    id: 'fate-know-06',
    round: 0,
    title: 'Nyugdíjpénztári ajánlat',
    description:
      'A munkahelyeden önkéntes nyugdíjpénztári csatlakozási akció van. ' +
      'Ha tudod, hogyan működik az adójóváírás, megéri belépni!',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-pension',
      quiz: {
        question: 'Mennyi az önkéntes nyugdíjpénztári adójóváírás maximuma évente?',
        options: ['75 000 Ft', '150 000 Ft', '300 000 Ft'],
        correctIndex: 1,
        explanation:
          'A befizetés 20%-a, de max évi 150 000 Ft. Ez „ingyen pénz" az államtól – ' +
          'ha nem használod ki, kihagyod a legegyszerűbb hozamot!',
      },
      successEffects: [{ target: 'balance', amount: 50_000 }],
      noKnowledgeMessage:
        'Ehhez a „Nyugdíj-előtakarékosság" tudáskártyára van szükséged. Kihagytad a lehetőséget!',
      failureMessage:
        'Nem tudtad a részleteket, ezért bizonytalan voltál. Legközelebb már tudni fogod.',
    },
  },

  // ============================================================================
  // ÚJ tudáspróbás sorsfordítók — az új tudáskártyákhoz
  // ============================================================================

  {
    id: 'fate-know-07',
    round: 0,
    title: 'Kriptovaluta befektetési lehetőség',
    description:
      'Egy kollégád azt mondja: „Most kell Bitcoint venni, mielőtt felrobban az ára!" ' +
      'Ha ismered a kriptopiaci szabályozást, okosabb döntést hozol.',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-crypto',
      quiz: {
        question: 'Mennyi adót kell fizetni a kriptovaluta-nyereség után Magyarországon?',
        options: ['27% ÁFA', '15% SZJA (nincs SZOCHO)', '30% + SZOCHO'],
        correctIndex: 1,
        explanation:
          'A kripto nyereség 15% SZJA-köteles, nincs rajta SZOCHO (járulék). ' +
          'Ez az EU egyik legkedvezőbb kulcsa. De csak fiat-ra váltáskor keletkezik adófizetési kötelezettség!',
      },
      successEffects: [{ target: 'balance', amount: 70_000 }],
      noKnowledgeMessage:
        'Ehhez a „Kriptovaluta-szabályozás" tudáskártyára van szükséged. Nem tudtad, mire figyelj.',
      failureMessage:
        'Nem tudtad az adószabályt, ezért rosszul időzítetted az eladást.',
    },
  },
  {
    id: 'fate-know-08',
    round: 0,
    title: 'Freelance megbízás számlázással',
    description:
      'Egy külföldi cég freelance projektet ajánl 800 EUR értékben. ' +
      'Ha ismered a számlázási és adózási szabályokat, megcsinálod.',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-freelance',
      quiz: {
        question: 'Mennyi az átalányadó költséghányada szolgáltatási tevékenységre 2026-ban?',
        options: ['40%', '45%', '80%'],
        correctIndex: 1,
        explanation:
          '2026-ban az átalányadó költséghányada szolgáltatásokra 45% (korábban 40%). ' +
          'Ez azt jelenti, hogy a bevétel 55%-ára fizetsz 15% SZJA-t + 18,5% TB-járulékot + 13% szochót.',
      },
      successEffects: [{ target: 'balance', amount: 85_000 }],
      noKnowledgeMessage:
        'Ehhez a „Szabadfoglalkozú adózás" tudáskártyára van szükséged. Kihagytad a lehetőséget!',
      failureMessage:
        'Rosszul számoltad ki a nettó bevételt, a projekt kevesebbet hozott a vártnál.',
    },
  },
  {
    id: 'fate-know-09',
    round: 0,
    title: 'Pánik a tőzsdén!',
    description:
      'A BUX 8%-ot esett egy nap alatt. Mindenki pánikol és eladja a részvényeit. ' +
      'Ha ismered a befektetési pszichológiát, nem esel csapdába.',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-invest-psychology',
      quiz: {
        question: 'Mi a legjobb stratégia tőzsdei pánik idején hosszú távú befektetőként?',
        options: [
          'Azonnal eladni mindent, mielőtt tovább esik',
          'Tartani a tervet, a rendszeres befizetést folytatni (DCA)',
          'Átváltani mindent kriptóba',
        ],
        correctIndex: 1,
        explanation:
          'A DCA (Dollar Cost Averaging) szerint rendszeresen, fix összeget fektetsz be, az ártól függetlenül: ' +
          'eséskor ugyanannyi pénzért több részesedést kapsz, emelkedéskor kevesebbet. Nyereséget nem garantál, ' +
          'de kiveszi az érzelmeket a döntésből - pánikban eladni a veszteséget teszi véglegessé.',
      },
      successEffects: [{ target: 'balance', amount: 60_000 }],
      noKnowledgeMessage:
        'Ehhez a „Befektetési pszichológia" tudáskártyára van szükséged.',
      failureMessage:
        'Pánikban eladtad az ETF-jeidet veszteséggel. A türelem kifizetődött volna.',
    },
  },
  {
    id: 'fate-know-10',
    round: 0,
    title: 'Inflációs környezetben döntés',
    description:
      'Az infláció emelkedik, a bankbetéted reálértéke csökken. ' +
      'Hogyan véded meg a megtakarításodat?',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-inflation',
      quiz: {
        question: 'Mi a reálhozam, ha a bankbetéted 6%-ot fizet és az infláció 4%?',
        options: ['~2%', '10%', '~0,3%'],
        correctIndex: 2,
        explanation:
          'A bankbetét kamatából előbb levonják a 28% kamatadót (15% SZJA + 13% szocho): 6% × 0,72 = 4,32%. ' +
          'Ebből jön le az infláció: 4,32% – 4% ≈ 0,3% a reálhozam. A lakossági állampapír kamata adómentes.',
      },
      successEffects: [{ target: 'balance', amount: 45_000 }],
      noKnowledgeMessage:
        'Ehhez az „Infláció és értékmegőrzés" tudáskártyára van szükséged.',
      failureMessage:
        'Nem ismerted a reálhozam fogalmát, a pénzed vásárlóereje csökkent.',
    },
  },
  {
    id: 'fate-know-11',
    round: 0,
    title: 'Lakásvásárlási alkalom!',
    description:
      'Egy jó árú lakást találtál, de gyorsan kell dönteni. ' +
      'Ha ismered a vásárlási folyamatot, nem ér meglepetés.',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-apartment-buying',
      quiz: {
        question: 'Mennyi a kötelező minimum önerő lakásvásárláshoz (banki hitelhez)?',
        options: ['10%', '20%', '30%'],
        correctIndex: 1,
        explanation:
          'A bankok minimum 20% önerőt várnak el. 30M Ft-os lakásnál ez 6M Ft. ' +
          'CSOK Plusz-szal az önerő-követelmény 10%-ra csökkenhet első lakásnál.',
      },
      successEffects: [{ target: 'balance', amount: 100_000 }],
      noKnowledgeMessage:
        'Ehhez a „Lakásvásárlási útmutató" tudáskártyára van szükséged. Elmulasztottad az alkut.',
      failureMessage:
        'Nem tudtad az önerő-szabályt, a bank elutasította a kérelmedet.',
    },
  },
  {
    id: 'fate-know-12',
    round: 0,
    title: 'Autócsere dilemma',
    description:
      'A régi autód egyre drágább fenntartani. Új autó hitelre vagy használt készpénzre?',
    type: 'positive' as const,
    effects: [],
    knowledgeCheck: {
      requiredKnowledgeId: 'know-car-finance',
      quiz: {
        question: 'Mennyi egy autó TELJES éves fenntartási költsége (TCO) átlagosan Magyarországon?',
        options: ['300-500 ezer Ft', '1-1,5 millió Ft', '3-4 millió Ft'],
        correctIndex: 1,
        explanation:
          'Egy autó teljes éves költsége: KGFB + benzin + szerviz + parkolás + adó + értékcsökkenés ' +
          '= átlagosan 1-1,5M Ft/év. Ezt sokan alábecsülik!',
      },
      successEffects: [{ target: 'balance', amount: 50_000 }],
      noKnowledgeMessage:
        'Ehhez az „Autófinanszírozás" tudáskártyára van szükséged.',
      failureMessage:
        'Rosszul mérted fel az autó fenntartási költségeit.',
    },
  },
];

// ============================================================================
// Sztorivonal sorsfordító események (többkörös: döntés → visszacsatolás)
// A játékos döntése nyomán egy folyamat indul, amely pár kör múlva feloldódik.
// Az outcome a döntés pillanatában eldől (random) és a PendingStoryline-ban tárolódik.
// ============================================================================

export const STORYLINE_FATE_EVENTS: FateEventEntry[] = [
  {
    id: 'fate-story-friend-loan',
    round: 0,
    title: 'Barátod pénzt kér kölcsön',
    description:
      'A régi haverold, Gergő felhív: „Szorult helyzetben vagyok, kölcsönadnál 50 000 Ft-ot? ' +
      'Pár hónapon belül visszaadom, becsszó!"',
    type: 'decision' as const,
    effects: [],
    options: [
      {
        label: 'Kölcsönadod az 50 000 Ft-ot',
        effects: [{ target: 'balance', amount: -50_000 }],
        storylineTrigger: {
          type: 'friend_loan' as const,
          resolveAfterRounds: 3,
          data: { friendName: 'Gergő', amount: 50_000 },
        },
      },
      {
        label: 'Sajnálod, de nem adsz kölcsön',
        effects: [],
      },
    ],
  },
  {
    id: 'fate-story-invest-tip',
    round: 0,
    requires: { employed: true },
    title: 'Befektetési tipp egy kollégától',
    description:
      'Egy kollégád megsúgja: „Van egy biztos befektetési lehetőség, egy startup részvény. ' +
      'Ha most beteszünk 30 000 Ft-ot, duplán jön vissza!" Megbízol benne?',
    type: 'decision' as const,
    effects: [],
    options: [
      {
        label: 'Befektetsz 30 000 Ft-ot',
        effects: [{ target: 'balance', amount: -30_000 }],
        storylineTrigger: {
          type: 'investment_result' as const,
          resolveAfterRounds: 2,
          data: { investmentName: 'startup részvény', amount: 30_000 },
        },
      },
      {
        label: 'Nem kockáztatsz, kihagyod',
        effects: [],
      },
    ],
  },
  {
    id: 'fate-story-side-gig',
    round: 0,
    title: 'Mellékállás lehetőség',
    description:
      'Egy ismerősöd felajánlja, hogy hétvégente segíthetsz az online boltjában rendeléseket csomagolni. ' +
      'Két hónapig tartana, hétvégente 4-5 óra munka.',
    type: 'decision' as const,
    effects: [],
    options: [
      {
        label: 'Elvállalod a mellékállást',
        effects: [],
        storylineTrigger: {
          type: 'side_gig' as const,
          resolveAfterRounds: 2,
          data: { gigName: 'Rendeléscsomagolás', totalPayment: 80_000 },
        },
      },
      {
        label: 'Nem vállalod (pihenés fontosabb)',
        effects: [],
      },
    ],
  },
];

/**
 * A sprint sorsfordítókhoz hozzáadjuk a generikus eseményeket
 * azoknál a köröknél, ahol nincs sprint esemény.
 * Minden 3. üres körbe tudáspróbás esemény kerül.
 * Minden 5. üres körbe sztorivonal esemény kerül (ha van elég kör a feloldáshoz).
 */
function fillFateGaps(
  mappedSprintFates: FateEventEntry[],
  targetTotal: number
): FateEventEntry[] {
  const coveredRounds = new Set(mappedSprintFates.map((e) => e.round));
  const generics = [...GENERIC_FATE_EVENTS];
  const knowledgeGenerics = [...GENERIC_KNOWLEDGE_FATE_EVENTS];
  const storylines = [...STORYLINE_FATE_EVENTS];
  const result = [...mappedSprintFates];

  let genIdx = 0;
  let knowIdx = 0;
  let storyIdx = 0;
  let emptyCount = 0;
  for (let r = 1; r <= targetTotal; r++) {
    if (!coveredRounds.has(r)) {
      emptyCount++;
      // Minden 5. üres kör: sztorivonal (ha van elég hely a feloldáshoz)
      // Minden 3.: tudáspróba; páros: generikus
      if (emptyCount % 5 === 0 && storyIdx < storylines.length && r <= targetTotal - 4) {
        result.push({ ...storylines[storyIdx], round: r });
        storyIdx++;
      } else if (emptyCount % 3 === 0 && knowIdx < knowledgeGenerics.length) {
        result.push({ ...knowledgeGenerics[knowIdx], round: r });
        knowIdx++;
      } else if (emptyCount % 2 === 0 && genIdx < generics.length) {
        result.push({ ...generics[genIdx], round: r });
        genIdx++;
      }
    }
  }

  return result;
}

// ============================================================================
// Döntésfák és sorsfordítók generálása minden skálához
// ============================================================================

function buildDecisionsForScale(
  sprintDecisions: DecisionCard[],
  scale: TimeScale,
  extendedDecisions?: DecisionCard[]
): DecisionCard[] {
  if (scale === 'sprint') return sprintDecisions;
  const mapped = mapDecisionsToScale(sprintDecisions, scale);
  const targetTotal = TIME_SCALE_CONFIGS[scale].totalRounds;
  // Extended döntések hozzáfűzése (Marathon/Ultra: 13-20. kör)
  const combined = extendedDecisions ? [...mapped, ...extendedDecisions] : mapped;
  return fillGapsWithGenericDecisions(combined, targetTotal);
}

function buildFateEventsForScale(
  sprintFates: FateEventEntry[],
  scale: TimeScale
): FateEventEntry[] {
  if (scale === 'sprint') return sprintFates;
  const mapped = mapFateEventsToScale(sprintFates, scale);
  const targetTotal = TIME_SCALE_CONFIGS[scale].totalRounds;
  return fillFateGaps(mapped, targetTotal);
}

// --- Döntésfák registry ---

type DecisionRegistry = Record<LifeSituationId, Partial<Record<TimeScale, DecisionCard[]>>>;

const DECISION_REGISTRY: DecisionRegistry = {
  fresh_start: {
    sprint: FRESH_START_DECISIONS_SPRINT,
    marathon: buildDecisionsForScale(FRESH_START_DECISIONS_SPRINT, 'marathon', FRESH_START_EXTENDED_DECISIONS),
    ultra: buildDecisionsForScale(FRESH_START_DECISIONS_SPRINT, 'ultra', FRESH_START_EXTENDED_DECISIONS),
  },
  career_start: {
    sprint: DANI_DECISIONS_SPRINT,
    marathon: buildDecisionsForScale(DANI_DECISIONS_SPRINT, 'marathon', DANI_EXTENDED_DECISIONS),
    ultra: buildDecisionsForScale(DANI_DECISIONS_SPRINT, 'ultra', DANI_EXTENDED_DECISIONS),
  },
  inheritance: {
    sprint: INHERITANCE_DECISIONS_SPRINT,
    marathon: buildDecisionsForScale(INHERITANCE_DECISIONS_SPRINT, 'marathon', INHERITANCE_EXTENDED_DECISIONS),
    ultra: buildDecisionsForScale(INHERITANCE_DECISIONS_SPRINT, 'ultra', INHERITANCE_EXTENDED_DECISIONS),
  },
};

/**
 * Döntés kartyák lekérdezése élethelyzet + időskála alapján
 */
export function getDecisionsFor(
  lifeSituation: LifeSituationId,
  timeScale: TimeScale
): DecisionCard[] {
  return (DECISION_REGISTRY[lifeSituation]?.[timeScale] ?? []).map(withWellbeingDecision);
}

/**
 * Az aktuális körhöz tartozó döntés kartya megkeresése.
 * A completedIds-ben lévő kártyákat kihagyja (már meghozott döntések).
 */
/** Albérletben lakik-e (otthon lakva csak hozzájárulás van, az albérlet legalább ennyi) */
export const RENT_THRESHOLD = 100_000;

/** A játékos helyzete a döntések szűréséhez: korábbi választások, fennálló tartozások */
export interface DecisionContext { chosen?: string[]; debtTypes?: string[]; salary?: number; situation?: Situation }

/** Választható-e az opció a játékos ágán (pl. kollégium csak tanulónak) */
export function optionFits(o: DecisionCard['options'][number], ctx?: DecisionContext): boolean {
  if (ctx?.situation) return meets(o.requires, ctx.situation);
  const c = o.requires?.chose;
  return !c || !ctx?.chosen || c.some((id) => ctx.chosen!.includes(id));
}

/** A döntés játékosra illő opciói */
export function fittingOptions(d: DecisionCard, ctx?: DecisionContext): DecisionCard['options'] {
  return d.options.filter((o) => optionFits(o, ctx));
}

/** Illik-e a döntés a játékos ágához és helyzetéhez */
export function decisionFits(d: DecisionCard, housing?: number, ctx?: DecisionContext): boolean {
  if (fittingOptions(d, ctx).length === 0) return false;
  if (ctx?.situation) return meets(withSituationRequires(d.id, d.requires), ctx.situation);
  const r = d.requires;
  if (!r) return true;
  if (r.rentsHome && housing !== undefined && housing < RENT_THRESHOLD) return false;
  if (r.livesHome && housing !== undefined && housing >= RENT_THRESHOLD) return false;
  if (r.chose && ctx?.chosen && !r.chose.some((id) => ctx.chosen!.includes(id))) return false;
  if (r.hasDebtType && ctx?.debtTypes && ![r.hasDebtType].flat().some((t) => ctx.debtTypes!.includes(t))) return false;
  if (r.employed && ctx?.salary !== undefined && !isEmployed(ctx.salary, ctx.chosen)) return false;
  return true;
}

export function getDecisionForRound(
  decisions: DecisionCard[],
  round: number,
  completedIds: string[] = [],
  housing?: number,
  ctx?: DecisionContext,
): DecisionCard | undefined {
  return decisions.find(
    (d) => d.availableAtRounds.includes(round) && !completedIds.includes(d.id) && decisionFits(d, housing, ctx)
  );
}

/**
 * Döntés mezőn: ha a körnek nincs döntése, a következő esedékes (még meg nem hozott) döntés előrejön -
 * a mező így értelmet kap, és a karakter életútja a dobással gyorsulhat.
 */
export function getDecisionForField(
  decisions: DecisionCard[], round: number, completedIds: string[], housing: number | undefined, onDecisionField: boolean, ctx?: DecisionContext,
): { decision?: DecisionCard; broughtForward: boolean } {
  const now = getDecisionForRound(decisions, round, completedIds, housing, ctx);
  if (now || !onDecisionField) return { decision: now, broughtForward: false };
  const next = decisions
    .filter((d) => !completedIds.includes(d.id) && d.availableAtRounds.some((r) => r > round) && decisionFits(d, housing, ctx))
    .sort((a, b) => Math.min(...a.availableAtRounds.filter((r) => r > round)) - Math.min(...b.availableAtRounds.filter((r) => r > round)))[0];
  return { decision: next, broughtForward: !!next };
}

// --- Sorsfordító események registry ---

export type FateEventEntry = {
  id: string;
  round: number;
  /** Élő feltétel: ugyanarra a körre több változat, a heti adatok döntik el, melyik jön */
  liveCondition?: LiveCondition;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'decision';
  effects: Array<{ target: string; amount: number }>;
  options?: Array<{
    label: string;
    effects: Array<{ target: string; amount: number }>;
    /** Sztorivonal indítás: ha a játékos ezt választja, többkörös folyamat indul */
    storylineTrigger?: {
      type: 'friend_loan' | 'side_gig' | 'investment_result' | 'generic';
      resolveAfterRounds: number;
      data: Record<string, unknown>;
    };
  }>;
  /** Feltételek: az esemény csak akkor jelenik meg, ha illik a játékos helyzetéhez (engine/situation.ts) */
  requires?: Requires & { hasHighTransport?: boolean };
  /** Tudáspróba: a játékos a megszerzett tudásból kap kérdést, helyes válasz = jutalom */
  knowledgeCheck?: {
    requiredKnowledgeId: string;
    quiz: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    };
    successEffects: Array<{ target: string; amount: number }>;
    noKnowledgeMessage: string;
    failureMessage: string;
  };
  /** Hír forrás metaadatok (ha news_generated típusú esemény) */
  newsSource?: {
    title: string;
    url: string;
    publishedAt: string;
  };
};

type FateRegistry = Record<LifeSituationId, Partial<Record<TimeScale, FateEventEntry[]>>>;

const FATE_REGISTRY: FateRegistry = {
  fresh_start: {
    sprint: FRESH_START_SCRIPTED_FATE_EVENTS,
    marathon: buildFateEventsForScale(FRESH_START_SCRIPTED_FATE_EVENTS, 'marathon'),
    ultra: buildFateEventsForScale(FRESH_START_SCRIPTED_FATE_EVENTS, 'ultra'),
  },
  career_start: {
    sprint: DANI_SCRIPTED_FATE_EVENTS,
    marathon: buildFateEventsForScale(DANI_SCRIPTED_FATE_EVENTS, 'marathon'),
    ultra: buildFateEventsForScale(DANI_SCRIPTED_FATE_EVENTS, 'ultra'),
  },
  inheritance: {
    sprint: INHERITANCE_SCRIPTED_FATE_EVENTS,
    marathon: buildFateEventsForScale(INHERITANCE_SCRIPTED_FATE_EVENTS, 'marathon'),
    ultra: buildFateEventsForScale(INHERITANCE_SCRIPTED_FATE_EVENTS, 'ultra'),
  },
};

/**
 * Sorsfordító események lekérdezése élethelyzet + időskála alapján
 */
export function getScriptedFateEvents(
  lifeSituation: LifeSituationId,
  timeScale: TimeScale
): FateEventEntry[] {
  return FATE_REGISTRY[lifeSituation]?.[timeScale] ?? [];
}

/**
 * Az aktuális körhöz tartozó sorsfordító megkeresése
 */
export function getFateEventForRound(
  events: FateEventEntry[],
  round: number
): FateEventEntry | undefined {
  const sameRound = events.filter((ev) => ev.round === round);
  // A feltételes változatok közül az, amelyik a heti adatok szerint igaz; különben a feltétel nélküli
  const e = sameRound.find((ev) => ev.liveCondition && liveConditionHolds(ev.liveCondition))
    ?? sameRound.find((ev) => !ev.liveCondition);
  return e ? withWellbeingFate(e) : undefined;
}

// --- Statisztikák (debug/admin) ---

export function getContentStats() {
  const situations = Object.keys(DECISION_REGISTRY) as LifeSituationId[];
  const stats: Record<string, { decisions: number; fateEvents: number }> = {};

  for (const sit of situations) {
    const dec = DECISION_REGISTRY[sit];
    const fate = FATE_REGISTRY[sit];
    const decCount = Object.values(dec).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
    const fateCount = Object.values(fate).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
    stats[sit] = { decisions: decCount, fateEvents: fateCount };
  }

  return {
    totalDecisions: Object.values(stats).reduce((s, v) => s + v.decisions, 0),
    totalFateEvents: Object.values(stats).reduce((s, v) => s + v.fateEvents, 0),
    bySituation: stats,
  };
}

// --- Élő adatok: hír-alapú sorsfordítók beillesztése ---

import type { PreGameContext } from '@/data-sources/types';
import { withWellbeingDecision, withWellbeingFate } from '../wellbeing-merge';

/**
 * PreGameContext.fateEventPool elemeit FateEventEntry formátumra konvertálja.
 * A hír-generált események `newsSource` metaadattal rendelkeznek.
 */
export function convertPoolToFateEntries(
  pool: PreGameContext['fateEventPool']
): FateEventEntry[] {
  return pool.map((item, idx) => ({
    id: `fate-news-${idx}`,
    round: 0, // Még nincs kiosztva — a blendFateEvents rendeli hozzá
    title: item.generatedEvent.title,
    description: item.generatedEvent.description,
    type: item.generatedEvent.type,
    effects: item.generatedEvent.effects,
    newsSource: {
      title: item.sourceNewsTitle,
      url: item.sourceUrl,
      publishedAt: item.publishedAt,
    },
  }));
}

/**
 * Szkriptelt + hír-generált sorsfordítók összefésülése.
 *
 * Prioritás:
 *   1. Szkriptelt események (karakter-specifikus) → az eredeti körükhöz rendelve
 *   2. Hír-generált események → az üres körökbe osztva
 *   3. Generikus események (fillFateGaps logika) → a megmaradó üres körökbe
 *
 * Így a játék minden alkalommal friss és aktuális, de a karakter-történet megmarad.
 */
export function blendFateEvents(
  scriptedEvents: FateEventEntry[],
  newsEntries: FateEventEntry[],
  totalRounds: number
): FateEventEntry[] {
  const result = [...scriptedEvents];
  const coveredRounds = new Set(result.map((e) => e.round));

  // Üres körök összegyűjtése
  const emptyRounds: number[] = [];
  for (let r = 1; r <= totalRounds; r++) {
    if (!coveredRounds.has(r)) {
      emptyRounds.push(r);
    }
  }

  // Hír-események keverése (véletlenszerű sorrend a változatosság érdekében)
  const shuffledNews = [...newsEntries].sort(() => Math.random() - 0.5);

  // Hír-események beillesztése az üres körökbe
  let newsIdx = 0;
  const newsRounds = new Set<number>();
  for (const r of emptyRounds) {
    if (newsIdx >= shuffledNews.length) break;
    result.push({ ...shuffledNews[newsIdx], round: r });
    newsRounds.add(r);
    newsIdx++;
  }

  // Megmaradó üres körök: generikus + tudáspróba + storyline események (meglévő logika)
  const remainingEmpty = emptyRounds.filter((r) => !newsRounds.has(r));
  if (remainingEmpty.length > 0) {
    let genIdx = 0;
    let knowIdx = 0;
    let storyIdx = 0;

    for (let i = 0; i < remainingEmpty.length; i++) {
      const r = remainingEmpty[i];

      if (i % 5 === 0 && STORYLINE_FATE_EVENTS[storyIdx]) {
        // Minden 5. üres körbe storyline esemény
        result.push({ ...STORYLINE_FATE_EVENTS[storyIdx % STORYLINE_FATE_EVENTS.length], round: r });
        storyIdx++;
      } else if (i % 3 === 0 && GENERIC_KNOWLEDGE_FATE_EVENTS[knowIdx]) {
        // Minden 3. üres körbe tudáspróba
        result.push({ ...GENERIC_KNOWLEDGE_FATE_EVENTS[knowIdx % GENERIC_KNOWLEDGE_FATE_EVENTS.length], round: r });
        knowIdx++;
      } else {
        // Többi: generikus esemény
        result.push({ ...GENERIC_FATE_EVENTS[genIdx % GENERIC_FATE_EVENTS.length], round: r });
        genIdx++;
      }
    }
  }

  return result;
}
