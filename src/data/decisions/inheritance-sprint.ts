// ============================================================================
// PENZUGYI SORSFORDITO - Inheritance Decision Tree (Sprint Mode)
// 30 eves, varatlan orokseg (5M Ft + videki telek) - 12 havi dontesfaja
// ============================================================================

import type { DecisionCard } from '@/types/game';

/**
 * "Váratlan örökség" dontesfaja - Sprint mod (12 kor = 12 honap)
 *
 * Fo agak:
 *   1. Az örökség kezelése (1-2. honap) – mit csinálsz az 5M Ft-tal?
 *   2. Adósságstratégia (3-4. honap) – személyi kölcsön vs. befektetés
 *   3. A vidéki telek sorsa (5-6. honap) – eladni / megtartani / fejleszteni
 *   4. Befektetési diverzifikáció (7-8. honap) – portfólió-építés
 *   5. Vállalkozás vagy biztonság (9-10. honap)
 *   6. Év végi stratégia (11-12. honap)
 */

export const INHERITANCE_DECISIONS_SPRINT: DecisionCard[] = [

  // ===================================================================
  // 1. SZAKASZ: AZ ÖRÖKSÉG KEZELÉSE (1-2. honap)
  // ===================================================================

  {
    id: 'inh-d01',
    category: 'Befektetés',
    title: 'Az 5 millió forint kérdése',
    situation:
      'Nagypapádtól váratlanul örököltél: 5 000 000 Ft készpénz + egy vidéki telek. ' +
      'A számládon {{balance}} Ft van most. A személyi kölcsönöd még fut: 1 800 000 Ft, ' +
      '12.5%-os kamattal. Mit csinálsz először az 5M Ft-tal?',
    dynamicVariables: {
      balance: 'player.balance',
    },
    options: [
      {
        id: 'inh-d01-a',
        label: 'Azonnal törleszted a hitelt',
        description:
          'Kifizeted az 1 800 000 Ft személyi kölcsönt. Marad 3.2M Ft, ' +
          'és megszűnik a havi 42 000 Ft-os törlesztés. Nincs több kamat!',
        financialEffects: [
        ],
        nextDecisionId: 'inh-d03',
        didYouKnow: 'Ha 12.5%-os kamatú hiteled van, az előtörlesztés „garantált 12.5%-os hozam". Nincs olyan befektetés, ami ezt kockázat nélkül hozza!',
        paysOffLoan: { type: 'personal_loan' },
      },
      {
        id: 'inh-d01-b',
        label: 'Befekteted az egészet, a hitelt futni hagyod',
        description:
          'Az 5M Ft-ot diverzifikáltan befekteted: PMÁP + ETF + kripto mix. ' +
          'Ha a hozam > 12.5% → nyertél. De a kockázat is nagyobb.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-pmap', 'inv-tbsz-etf', 'inv-crypto'],
        nextDecisionId: 'inh-d03',
        didYouKnow: 'A „hozamvadász" stratégia kockázatos: ha a befektetés bukik, a hitel kamata tovább fut. A matematika ritkán veri a biztonságot.',
        invests: [{ optionId: 'inv-pmap', amount: 2_000_000 }, { optionId: 'inv-tbsz-etf', amount: 2_000_000 }, { optionId: 'inv-crypto', amount: 500_000 }],
      },
      {
        id: 'inh-d01-c',
        label: 'Vársz és gondolkodsz (bankszámlán hagyod)',
        description:
          'Nem döntesz kapkodva. Az 5M Ft a bankszámlán marad 1-2 hónapig, ' +
          'amíg tájékozódsz. Bölcs, de az infláció ({{inflation}}%) eszi az értékét.',
        financialEffects: [],
        nextDecisionId: 'inh-d02',
        didYouKnow: 'A „ne dönts sietve" szabály igaz, DE a készpénzen ülés is döntés: az infláció (most évi {{inflation}}%) folyamatosan eszi a vásárlóerőt.',
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [1],
  },

  // ===================================================================
  // 2. SZAKASZ: ADÓSSÁGSTRATÉGIA (3-4. honap)
  // ===================================================================

  {
    id: 'inh-d02',
    requires: { hasDebtType: 'personal_loan' },
    category: 'Adósságkezelés',
    title: 'A személyi kölcsön kérdése',
    situation:
      'Még mindig fizeted a személyi kölcsön havi 42 000 Ft-os törlesztőjét. ' +
      'Hátralévő tartozás: ~1 600 000 Ft. Közben a PMÁP {{pmap_yield}}%-ot hoz, ' +
      'a kölcsön kamata 12.5%. A matekot nézed...',
    dynamicVariables: {
      pmap_yield: 'economicData.interestRates.pmapYield',
    },
    options: [
      {
        id: 'inh-d02-a',
        label: 'Előtörlesztesz – végleg szabadulsz',
        description:
          'Kifizeted a maradék ~1.6M Ft-ot. Szabad vagy! ' +
          'A felszabaduló 42 000 Ft/hó megy megtakarításra.',
        financialEffects: [
        ],
        nextDecisionId: 'inh-d04',
        didYouKnow: 'Az előtörlesztési díj max 1% a visszafizetett összegnek. 1.6M Ft-nál ez max 16 000 Ft – megéri, ha 12.5%-os kamatot spórolsz.',
        paysOffLoan: { type: 'personal_loan' },
      },
      {
        id: 'inh-d02-b',
        label: 'Kivárod – a minimumot fizeted',
        description:
          'Tartod a havi 42 000 Ft törlesztést, a pénzed befekteted. ' +
          'Kockázat: ha rosszul megy a befektetés, dupla veszteség.',
        financialEffects: [],
        nextDecisionId: 'inh-d04',
        didYouKnow: 'A pénzügyi pszichológia szerint az adósság mentális teher is. Az „adósságmentesség érzése" gyakran többet ér, mint a matematikai optimum.',
      },
      {
        id: 'inh-d02-c',
        requires: { ownsHome: true },
        label: 'Refinanszírozol – olcsóbb hitelt veszel fel',
        description:
          'Banki személyi kölcsön 12.5% → kiváltod 8%-os lakáscélúra (ha van fedezet). ' +
          'Havi törlesztő csökken: 42 000 → 32 000 Ft. De újabb hitelszerződés kell.',
        financialEffects: [
          { target: 'balance', amount: -50_000, description: 'Hitelkiváltási díjak' },
        ],
        nextDecisionId: 'inh-d04',
        didYouKnow: 'A hitelkiváltás (refinanszírozás) legális és okos lépés – HA az új kamat legalább 2%-kal alacsonyabb. A díjakat számold bele!',
        adjustsLoan: { type: 'personal_loan', paymentDelta: -10_000, ratePct: 8 },
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [3, 4],
  },

  // ===================================================================
  // 3. SZAKASZ: A VIDÉKI TELEK SORSA (5-6. honap)
  // ===================================================================

  {
    id: 'inh-d03',
    category: 'Ingatlan',
    title: 'A vidéki telek',
    situation:
      'A nagypapád után örököltél egy 800 m²-es telket Baja mellett. ' +
      'Ingatlanügynök szerint ~4-6M Ft-ot ér. A szomszéd azt mondja: ' +
      '„Építs rá, a turizmus felfutóban!" A telek adója: 12 000 Ft/év.',
    options: [
      {
        id: 'inh-d03-a',
        label: 'Eladod a telket',
        description:
          'Az ingatlanügynök 5 200 000 Ft-ot ajánl (jutalékkal együtt 4 800 000 Ft marad). ' +
          'Azonnali készpénz. Vége a történetnek.',
        financialEffects: [
          { target: 'balance', amount: 4_800_000, description: 'Telek eladási ára (jutalék levonva)' },
        ],
        nextDecisionId: 'inh-d04',
        didYouKnow: 'Örökölt ingatlan eladásánál a szerzéskori értéket kell alapul venni az SZJA szempontjából. 5 éven belüli eladásnál 15% adó a nyereségre!',
      },
      {
        id: 'inh-d03-b',
        label: 'Megtartod – befektetésnek',
        description:
          'A telek értéke évente 5-10%-ot nőhet (ha a környék fejlődik). ' +
          'Éves fenntartás: ~50 000 Ft (adó, kaszálás, kerítés). Passzív vagyonelem.',
        financialEffects: [
          { target: 'other', amount: 4_000, description: 'Telekfenntartás havi költsége' },
        ],
        didYouKnow: 'A vidéki telkek értéke Magyarországon 2020-2025 között átlagosan 8%/évet emelkedett. De a likviditás alacsony – nem tudod gyorsan eladni.',
      },
      {
        id: 'inh-d03-c',
        label: 'Mobilházat építesz rá (rövid távú kiadás)',
        description:
          'Mobilház telepítés: ~3-5M Ft. Utána rövid távú lakáskiadás (online szállásplatformon) / vendégház: ' +
          '+40-100 000 Ft/hó bevétel (vidéken alacsonyabb kihasználtság, erős szezonalitás). Nagy befektetés.',
        financialEffects: [
          { target: 'balance', amount: -4_000_000, description: 'Mobilház telepítés + berendezés' },
        ],
        ongoingEffects: [
        ],
        unlocksInvestment: ['inv-room-rent'],
        unlocksKnowledge: ['know-business'],
        didYouKnow: 'A NTAK (Nemzeti Turisztikai Adatszolgáltató Központ) regisztráció kötelező szálláskiadáshoz. Online intézheted: info.ntak.hu',
        acquiresAsset: { id: 'mobilhaz', name: 'Mobilház a telken (vendégház)', value: 4_000_000, monthlyIncome: 65_000 },
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [5, 6],
  },

  // ===================================================================
  // 4. SZAKASZ: BEFEKTETÉSI DIVERZIFIKÁCIÓ (7-8. honap)
  // ===================================================================

  {
    id: 'inh-d04',
    category: 'Befektetés',
    title: 'Portfólió-építés',
    situation:
      'A számládon {{balance}} Ft van. A pénzügyi „tanácsadód" (egy videómegosztón látott videó) ' +
      'azt mondja: „Ne tedd az összes tojást egy kosárba!" ' +
      'A kérdés: hogyan diverzifikálj?',
    dynamicVariables: {
      balance: 'player.balance',
    },
    options: [
      {
        id: 'inh-d04-a',
        label: 'Konzervatív: 30% bankbetét + 70% PMÁP',
        description:
          'Biztonságos, kiszámítható. PMÁP: most {{pmap_yield}}%/év, lekötött betét: átlagosan {{deposit_rate}}% körül. ' +
          'Nem fog a szomszéd irigykedni, de éjjel nyugodtan alszol.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-pmap', 'inv-bank-deposit'],
        didYouKnow: 'A konzervatív portfólió nem „unalmas" – hanem kockázatarányos. Warren Buffett #1 szabálya: „Ne veszíts pénzt." #2: „Lásd #1."',
        invests: [{ optionId: 'inv-bank-deposit', amount: 300_000 }, { optionId: 'inv-pmap', amount: 700_000 }],
      },
      {
        id: 'inh-d04-b',
        label: 'Kiegyensúlyozott: 20% részvény + 40% ETF + 40% PMÁP',
        description:
          'TBSZ-számlán: magyar részvények + globális ETF. Várható hozam: 8-12%/év. ' +
          'Kockázat: közepes. 5 éves távlatban a TBSZ adómentes!',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-pmap', 'inv-tbsz-etf', 'inv-stock-hu'],
        unlocksKnowledge: ['know-tbsz'],
        didYouKnow: 'A TBSZ (Tartós Befektetési Számla) 5 év után 0% adó a hozamra! Ez a magyar befektetők „titkos fegyvere".',
        invests: [{ optionId: 'inv-stock-hu', amount: 300_000 }, { optionId: 'inv-tbsz-etf', amount: 600_000 }, { optionId: 'inv-pmap', amount: 600_000 }],
      },
      {
        id: 'inh-d04-c',
        label: 'Agresszív: 30% kripto + 30% részvény + 40% ETF',
        description:
          'Magas potenciál, magas kockázat. A kripto extrém volatilis, ' +
          'a részvénypiac ingadozó – de 5-10 éves távon történelmileg a legjobb hozam.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-crypto', 'inv-tbsz-etf', 'inv-stock-hu'],
        didYouKnow: 'A kriptodeviza nyereségre 15% SZJA-t kell fizetni Magyarországon. Ha TBSZ-en tartanád – a kripto sajnos NEM tehető TBSZ-re!',
        invests: [{ optionId: 'inv-crypto', amount: 600_000 }, { optionId: 'inv-stock-hu', amount: 600_000 }, { optionId: 'inv-tbsz-etf', amount: 800_000 }],
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [7, 8],
  },

  // ===================================================================
  // 5. SZAKASZ: VÁLLALKOZÁS VAGY BIZTONSÁG (9-10. honap)
  // ===================================================================

  {
    id: 'inh-d05',
    category: 'Vállalkozás',
    title: 'Saját vállalkozás?',
    situation:
      'Egy régi ismerős üzleti ajánlattal keresett: közösen nyitnátok egy kávézót. ' +
      'A te részed: 2-3M Ft tőke. Közben a munkahelyed stabil, 420 000 Ft nettó. ' +
      'A kérdés: kockáztatsz, vagy biztonságban maradsz?',
    options: [
      {
        id: 'inh-d05-a',
        label: 'Belevágok – társas vállalkozás',
        description:
          'Kávézó-társulás: 2 500 000 Ft tőke. Havonta +50-200 000 Ft profit VAGY veszteség. ' +
          'Az első évben általában nem termel. Kockázatos, de a sajátod.',
        financialEffects: [
          { target: 'balance', amount: -2_500_000, description: 'Vállalkozás tőkéje' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 80_000, durationRounds: -1, description: 'Vállalkozás profit (átlag, ha beindul)' },
        ],
        unlocksKnowledge: ['know-business'],
        unlocksInvestment: ['inv-online-biz'],
        didYouKnow: 'Társas vállalkozásnál MINDIG legyen írásos társasági szerződés (Kft. esetén kötelező). A szóbeli megállapodás = recept a katasztrófára.',
        acquiresAsset: { id: 'uzletresz', name: 'Üzletrész (kávézó-társulás)', value: 2_500_000 },
      },
      {
        id: 'inh-d05-b',
        label: 'Mellékállásban indítasz online vállalkozást',
        description:
          'Webshop / dropshipping / online oktatás. Alacsony belépési költség (200-500 000 Ft). ' +
          'A munkád mellett csinálod. Lassabb, de kisebb a kockázat.',
        financialEffects: [
          { target: 'balance', amount: -300_000, description: 'Online vállalkozás indítás' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 50_000, durationRounds: -1, description: 'Online vállalkozás bevétel (lassú indulás)' },
        ],
        unlocksKnowledge: ['know-business'],
        didYouKnow: 'Az egyéni vállalkozás indítása online, ingyenes a Webes Ügysegéden (nyilvantarto.hu). Átalányadó 2026: általában 45% költséghányad, egyes kétkezi tevékenységeknél 80%, kiskereskedelemnél 90%.',
      },
      {
        id: 'inh-d05-c',
        label: 'Nem vállalkozol – passzív befektetés',
        description:
          'A pénzed dolgozik helyetted: PMÁP, ETF, ingatlan. ' +
          'Nincs extra munka, nincs extra kockázat. Lassú, de biztos vagyonépítés.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-pmap', 'inv-tbsz-etf'],
        didYouKnow: 'A passzív befektetés (index ETF) történelmileg évi 7-10%-ot hoz. A legtöbb aktív alapkezelő nem veri ezt hosszú távon!',
        invests: [{ optionId: 'inv-pmap', amount: 250_000 }, { optionId: 'inv-tbsz-etf', amount: 250_000 }],
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [9, 10],
  },

  // ===================================================================
  // 6. SZAKASZ: ÉV VÉGI STRATÉGIA (11-12. honap)
  // ===================================================================

  {
    id: 'inh-d06',
    category: 'Stratégia',
    title: 'Év végi mérleg',
    situation:
      'Eltelt {{elapsed}} az örökség óta. Egyenleged: {{balance}} Ft. ' +
      'Nettó vagyonod: {{netWorth}} Ft. Szabad cashflow: {{cashflow}} Ft/hó. ' +
      'Az örökség megfordította az életed – de jó irányba?',
    dynamicVariables: {
      balance: 'player.balance',
      netWorth: 'player.computed.netWorth',
      cashflow: 'player.computed.freeCashflow',
    },
    options: [
      {
        id: 'inh-d06-a',
        label: 'Lakásvásárlás – saját otthon',
        description:
          'Az önerőd (20% min.) megvan egy kisebb lakáshoz. Hitel: ~15-20M Ft, ' +
          'havi törlesztő: ~100-130 000 Ft. Nincs több albérlet!',
        financialEffects: [
          { target: 'balance', amount: -3_000_000, description: 'Lakásvásárlás önerő + díjak' },
          { target: 'housing', amount: -220_000, description: 'Albérlet megszűnik' },
          { target: 'utilities', amount: 10_000, description: 'Nagyobb rezsi (saját lakás)' },
        ],
        didYouKnow: 'A CSOK Plusz (2024-től) akár 50M Ft kedvezményes hitelt is jelent családosoknak. A támogatás feltétele: gyermekvállalás.',
        takesLoan: { name: 'Lakáshitel', type: 'mortgage', monthlyPayment: 120_000, months: 240, rateKey: 'bank.mortgageThm' },
        acquiresAsset: { id: 'lakas', name: 'Saját lakás (vételár)', value: 3_000_000, plusLoanPrincipal: true },
      },
      {
        id: 'inh-d06-b',
        label: 'Teljes passzív jövedelem – a pénz dolgozik',
        description:
          'Céled: a befektetéseid hozama fedezze a kiadásaid egy részét. ' +
          'Diverzifikált portfólió + ingatlan kiadás = mini „pénzügyi függetlenség".',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-pmap', 'inv-tbsz-etf', 'inv-gold'],
        didYouKnow: 'A „4% szabály" (FIRE mozgalom): ha a befektetéseid évi hozama 4%, és annyit veszel ki, a tőkéd „örökké" elég. 25× éves kiadás = cél.',
        invests: [{ optionId: 'inv-pmap', amount: 400_000 }, { optionId: 'inv-tbsz-etf', amount: 400_000 }, { optionId: 'inv-gold', amount: 200_000 }],
      },
      {
        id: 'inh-d06-c',
        label: 'Karrierváltás – megvan a háttér hozzá',
        description:
          'Az örökség biztonsági hálót adott. Most mersz váltani: ' +
          'új szakma, magasabb fizetés, de 3-6 hónap átmeneti idő fizetés nélkül.',
        setsSalary: { amount: 0, description: '3 hónap fizetés nélkül (felmondás)' },
        financialEffects: [
          { target: 'balance', amount: -100_000, description: 'Képzési költség' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 550_000, durationRounds: -1, startAfterMonths: 3, description: 'Új munkahelyi fizetés (3 hónap múlva indul)' },
        ],
        unlocksKnowledge: ['know-tax'],
        didYouKnow: 'A felmondási idő alatt is jár a fizetés (30-90 nap). Ha te mondasz fel, az utolsó napig dolgoznod kell, hacsak nem egyeztek meg másként.',
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [11, 12],
  },
];

/**
 * Sorsfordító események - Inheritance (Sprint mód)
 * 12 hónapra 12 esemény, egy 30 éves örökséget kapó embernek
 */
export const INHERITANCE_SCRIPTED_FATE_EVENTS = [
  {
    id: 'fate-inh-01', round: 1, title: 'Hagyatéki eljárás költségei',
    description:
      'Egyenesági rokon (nagypapa) után nincs örökösödési illeték, de az ügyvédi díj ' +
      'és földhivatali átírás nem ingyenes: 150 000 Ft ügyvéd + 30 000 Ft illeték.',
    type: 'negative' as const, effects: [{ target: 'balance', amount: -180_000 }],
  },
  {
    id: 'fate-inh-02', round: 2, title: 'Adó-visszatérítés',
    description: 'A NAV feldolgozta a bevallásod: az önkéntes nyugdíjpénztári befizetésed után járó 20%-os adójóváírást (legfeljebb évi 150 000 Ft) a pénztárszámládra utalják. Ez nem készpénz: a nyugdíjcélú megtakarításodat növeli.',
    type: 'positive' as const, effects: [],
  },
  {
    id: 'fate-inh-03', round: 3, title: 'Autó meghibásodás',
    description: 'A 8 éves autód váltóbakja beadta a kulcsot. Javítás: –145 000 Ft.',
    type: 'negative' as const, effects: [{ target: 'balance', amount: -145_000 }],
  },
  {
    id: 'fate-inh-04', round: 4, title: 'Fizetésemelés',
    description: 'Éves értékelés: a főnök elégedett. Bruttó +50 000 Ft/hó (nettó ~+35 000 Ft).',
    type: 'positive' as const, effects: [{ target: 'salary', amount: 35_000 }],
  },
  {
    id: 'fate-inh-05', round: 5, title: 'Rezsiárak emelkedése',
    description:
      'A gázárak emelkedtek Európában, és a rezsiplafon feletti fogyasztásod ' +
      'is drágult. A közlekedési költségeid szintén nőttek az üzemanyagár-emelés miatt.',
    type: 'negative' as const, effects: [
      { target: 'utilities', amount: 12_000 },
      { target: 'transport', amount: 6_000 },
    ],
  },
  {
    id: 'fate-inh-06', round: 6, title: 'Családi kölcsönkérés',
    description: 'Az unokatestvéred 500 000 Ft-ot kér kölcsön. „Visszaadom fél éven belül." Adsz?',
    type: 'decision' as const, effects: [],
    options: [
      { label: 'Adsz 500 000 Ft-ot', effects: [{ target: 'balance', amount: -500_000 }] },
      { label: 'Adsz kevesebbet (200 000 Ft)', effects: [{ target: 'balance', amount: -200_000 }] },
      { label: 'Nem adsz', effects: [] },
    ],
  },
  {
    id: 'fate-inh-07', round: 7, title: 'Állampapír-kamat érkezett',
    description: 'Megérkezett az állampapírod kamata. A PMÁP évente egyszer fizet kamatot (most {{pmap_yield}}%), és a kamat adómentes! A játékban a kamat havi bontásban már a passzív jövedelmed része, ezért itt nem kapsz külön összeget.',
    type: 'positive' as const, effects: [],
  },
  {
    id: 'fate-inh-08', round: 8, title: 'Lakbéremelés',
    description: 'A főbérlő bejelentette: +20 000 Ft/hó az új bérleti díj. A szerződést meg kell újítani.',
    type: 'negative' as const, effects: [{ target: 'housing', amount: 20_000 }],
  },
  {
    id: 'fate-inh-09', round: 9, title: 'Erősödik a forint',
    liveCondition: 'forint_erosodik' as const,
    description:
      'Egy euró most {{eur_huf}} Ft - erősödött a forint. ' +
      'Az import termékek olcsóbbak lettek, a külföldi út is kevesebbe kerül.',
    type: 'positive' as const, effects: [
      { target: 'food', amount: -4_000 },
      { target: 'other', amount: -3_000 },
    ],
  },
  {
    id: 'fate-inh-09b', round: 9, title: 'Gyengül a forint',
    liveCondition: 'forint_gyengul' as const,
    description:
      'A forint gyengült: egy euró már {{eur_huf}} Ft. Az import termékek és az üzemanyag drágulnak. ' +
      'Tanulság: az árfolyam mindkét irányba mozog - a devizában tartott megtakarítás ilyenkor többet ér forintban.',
    type: 'negative' as const, effects: [
      { target: 'food', amount: 4_000 },
      { target: 'transport', amount: 3_000 },
    ],
  },
  {
    id: 'fate-inh-10', round: 10, title: 'Egészségügyi kiadás',
    description: 'Fogpótlás szükséges (nem TB-támogatott): –120 000 Ft.',
    type: 'negative' as const, effects: [{ target: 'balance', amount: -120_000 }],
  },
  {
    id: 'fate-inh-11', round: 11, title: 'Év végi bónusz',
    description: 'A céged jól zárta az évet: egyszeri jutalom 225 000 Ft (bruttó, nettó: ~150 000).',
    type: 'positive' as const, effects: [{ target: 'balance', amount: 150_000 }],
  },
  {
    id: 'fate-inh-12', round: 12, title: 'Éves biztosítás + karácsonyi költségek',
    description: 'Autó KGFB + CASCO megújítás + karácsonyi ajándékok: –160 000 Ft.',
    type: 'negative' as const, effects: [{ target: 'balance', amount: -160_000 }],
  },
];
