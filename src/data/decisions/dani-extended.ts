// ============================================================================
// PENZUGYI SORSFORDITO - Dani Decision Tree (Marathon/Ultra Mode, Extended)
// Dani, 24→29 eves - 13-20. kor dontesei (Maraton/Ultra mod)
// ============================================================================

import type { DecisionCard } from '@/types/game';

/**
 * Dani dontesfaja - Maraton/Ultra mod (13-20. kor)
 *
 * Fo agak:
 *   1. Lakas-elotakarekossag (13-14. kor)
 *   2. Parkapcsolat es penzugyek (15-16. kor)
 *   3. Senior pozicio (17. kor)
 *   4. Mellekallasbol vallalkozas (18-19. kor)
 *   5. Hosszu tavu portfolio (20. kor)
 */

export const DANI_EXTENDED_DECISIONS: DecisionCard[] = [

  // ===================================================================
  // 1. SZAKASZ: LAKAS-ELOTAKAREKOSSAG (13-14. kor)
  // ===================================================================

  {
    id: 'dani-ext-01',
    category: 'Lakhatás',
    title: 'Lakás-előtakarékosság',
    situation:
      'Már 2+ éve dolgozol, {{balance}} Ft van a számládon. Akár albérletben, akár még otthon laksz, ' +
      'egyre jobban érzed: saját lakás kellene. Lakásvásárlásra gondolsz — de hogyan?',
    dynamicVariables: {
      balance: 'player.balance',
    },
    options: [
      {
        id: 'dani-ext-01-a',
        label: 'Agresszív spórolás lakás önerőre',
        description:
          'Havi –30 000 Ft-ot vágsz a kiadásaidból (szórakozás, rendelés, előfizetések). ' +
          'Szigorú büdzsé, cél: a lakás-önerő összegyűjtése 3 éven belül.',
        financialEffects: [
          { target: 'other', amount: -30_000, description: 'Szigorú büdzsé (lakás-önerő megtakarítás)' },
        ],
        didYouKnow: 'A lakáshitel önerő jellemzően a vételár 20%-a. Budapesten a használt lakások átlagos négyzetméterára most {{sqm_bp}} Ft, így egy kis lakás önereje is milliókban mérhető. A Lakás-takarékpénztár megszűnt, de az önkéntes nyugdíjpénztári megtakarítás lakáscélra is felhasználható!',
      },
      {
        id: 'dani-ext-01-b',
        label: 'CSOK Plusz + Babaváró hitel kombináció',
        description:
          'Ha van párod és gyermeket terveztek, a CSOK Plusz kamattámogatott hitelt és a ' +
          'Babaváró kölcsönt (max 11M Ft) kombinálhatjátok. Tanácsadói díj: –200 000 Ft.',
        financialEffects: [
          { target: 'balance', amount: -200_000, description: 'Független pénzügyi tanácsadói díj' },
        ],
        unlocksKnowledge: ['know-csok'],
        didYouKnow: 'A CSOK Plusz 2024-ben indult: kamattámogatott lakáshitel (max 3%) gyermeket vállaló házaspároknak. 1 gyermeknél max 15M Ft, 2 gyermeknél max 30M Ft, 3 gyermeknél max 50M Ft.',
      },
      {
        id: 'dani-ext-01-c',
        label: 'Marad az albérlet, inkább befektetsz',
        description:
          'Nem rohansz lakást venni. Ehelyett 300 000 Ft-ot TBSZ számlára teszel ETF-be. ' +
          '5 év múlva adómentes hozam, és addigra többet is tudsz önerőre adni.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-tbsz-etf'],
        didYouKnow: 'Egy globális részvény ETF (pl. MSCI World) átlagosan 8-10% éves hozamot hozott az elmúlt 20 évben. TBSZ-en tartva 5 év után adómentes!',
        invests: [{ optionId: 'inv-tbsz-etf', amount: 300_000 }],
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [13, 14],
  },

  // ===================================================================
  // 2. SZAKASZ: PARKAPCSOLAT ES PENZUGYEK (15-16. kor)
  // ===================================================================

  {
    id: 'dani-ext-02',
    requires: { rentsHome: true },
    category: 'Életmód',
    title: 'Párkapcsolat és pénzügyek',
    situation:
      'Párkapcsolatba kerültél. Együtt laktok, és felmerül a kérdés: ' +
      'hogyan kezeljétek a közös pénzügyeket? Ez az egyik leggyakoribb konfliktus-forrás.',
    options: [
      {
        id: 'dani-ext-02-a',
        label: 'Teljes összevonás – közös számla',
        description:
          'Minden bevétel egy közös számlára megy, onnan gazdálkodtok. ' +
          'A lakhatás olcsóbb közösen (–30 000 Ft/hó), az élelmiszer is (–15 000 Ft/hó).',
        financialEffects: [
          { target: 'housing', amount: -30_000, description: 'Olcsóbb lakhatás közösen' },
          { target: 'food', amount: -15_000, description: 'Közös főzés, nagyobb kiszerelés' },
        ],
        didYouKnow: 'A közös számla akkor működik jól, ha mindketten hasonlóan kezelik a pénzt. Fontos: tartsatok meg egy kis „zsebpénz" keretet, amit mindenki szabadon költ!',
      },
      {
        id: 'dani-ext-02-b',
        label: '50/50 arányos megosztás',
        description:
          'Közös kiadásokat felesben fizetjétek, a maradék a sajátotok. ' +
          'Havi –10 000 Ft extra adminisztráció (alkalmazás, átutalás).',
        financialEffects: [
          { target: 'other', amount: -10_000, description: 'Kompromisszum: közös kiadások adminisztrációja' },
        ],
        didYouKnow: 'Az arányos megosztás igazságosabb, ha nagy a jövedelemkülönbség: mindenki a fizetése arányában fizet. Pl. ha te 400K-t keresel és párod 300K-t, te 57%-ot, ő 43%-ot fizet.',
      },
      {
        id: 'dani-ext-02-c',
        label: 'Teljesen külön pénzügyek',
        description:
          'Mindenki a sajátjából gazdálkodik. Szabadság, de dupla költség: ' +
          'két külön streaming-előfizetés, két biztosítás stb. Havi +5 000 Ft extra kiadás.',
        financialEffects: [
          { target: 'other', amount: 5_000, description: 'Dupla szolgáltatások, extra admin' },
        ],
        didYouKnow: 'Kutatások szerint a pénzügyi nézeteltérés az egyik leggyakoribb válóok. Akármelyik rendszert választjátok, a lényeg a nyílt kommunikáció a pénzügyekről!',
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [15, 16],
  },

  // ===================================================================
  // 3. SZAKASZ: SENIOR POZICIO (17. kor)
  // ===================================================================

  {
    id: 'dani-ext-03',
    category: 'Karrier',
    title: 'Senior pozíció',
    situation:
      '3+ éve dolgozol a cégnél, megbízható és tapasztalt kolléga lettél. ' +
      'Senior pozíció kínálkozik — de közben egy versenytárs is megkeresett tech lead ajánlattal.',
    options: [
      {
        id: 'dani-ext-03-a',
        label: 'Senior role a jelenlegi cégnél',
        description:
          'Elfogadod a belső előléptetést: +60 000 Ft/hó béremelés. ' +
          'Ismered a csapatot, stabil pozíció, kevesebb kockázat.',
        financialEffects: [
          { target: 'salary', amount: 60_000, description: 'Senior fejlesztő béremelés' },
        ],
        didYouKnow: 'A belső előléptetés általában 10-15%-os béremelést jelent. Munkahelyváltásnál átlagosan 20-30%-ot lehet kérni — de a stabilitás is érték!',
      },
      {
        id: 'dani-ext-03-b',
        label: 'Tech lead a versenytársnál',
        description:
          '+120 000 Ft/hó fizetés a versenytársnál. Izgalmas projekt, de 3 hónap próbaidő, ' +
          'új csapat, és bizonyítanod kell.',
        financialEffects: [
          { target: 'salary', amount: 120_000, description: 'Tech lead fizetés (versenytárs)' },
        ],
        didYouKnow: 'Próbaidő alatt (max 3 hónap) mindkét fél azonnali hatállyal felmondhat. Tipp: a próbaidő alatt ne vállalj nagy havi kiadásnövekedést (pl. drágább albérlet)!',
      },
      {
        id: 'dani-ext-03-c',
        label: 'Freelance tanácsadás',
        description:
          'Otthagyod az alkalmazotti létet és független tanácsadóként dolgozol. ' +
          'Induló költségek: –100 000 Ft, de havi +150 000 Ft bevétel (ha van ügyfél).',
        financialEffects: [
          { target: 'balance', amount: -100_000, description: 'Freelance startup költségek (eszköz, szoftver, könyvelő)' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 150_000, durationRounds: -1, description: 'Freelance tanácsadói bevétel (kockázatos)' },
        ],
        didYouKnow: 'Freelancerként a bruttó bevételedből le kell vonni a TB-járulékot (18,5%), a szociális hozzájárulási adót (13%), és az SZJA-t (15%). Átalányadózóként a bevétel 55%-a az adóalap (IT szolgáltatásnál).',
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [17],
  },

  // ===================================================================
  // 4. SZAKASZ: MELLEKALLASBOL VALLALKOZAS (18-19. kor)
  // ===================================================================

  {
    id: 'dani-ext-04',
    category: 'Vállalkozás',
    title: 'Mellékállásból vállalkozás',
    situation:
      'A freelance/mellékállásod bevétele szépen nőtt az elmúlt időszakban. ' +
      'Többen keresnek, mint amennyit este-hétvégén el tudsz vállalni. Érdemes teljes állásban csinálni?',
    options: [
      {
        id: 'dani-ext-04-a',
        label: 'Teljes idejű vállalkozás',
        description:
          'Felmondasz és a saját vállalkozásodra koncentrálsz. Induló befektetés: –500 000 Ft ' +
          '(eszközök, marketing, könyvelő). Várható bevétel: +450 000 Ft/hó, de kockázatos.',
        financialEffects: [
          { target: 'balance', amount: -500_000, description: 'Vállalkozás indítás (eszközök, marketing, könyvelő)' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 450_000, durationRounds: -1, description: 'Vállalkozói bevétel (alkalmazotti fizetés helyett)' },
        ],
        didYouKnow: 'Magyarországon a KKV-k 50%-a nem éli túl az első 5 évet. Mielőtt teljes állásba váltasz, legyen legalább 6 havi tartalékod fix kiadásokra!',
      },
      {
        id: 'dani-ext-04-b',
        label: 'Mellékállásban marad, automatizál',
        description:
          'Megtartod az alkalmazotti állást és automatizálod a mellékbevételt: ' +
          '–200 000 Ft eszközökre/szoftverekre, cserébe havi +80 000 Ft extra bevétel.',
        financialEffects: [
          { target: 'balance', amount: -200_000, description: 'Automatizálási eszközök és szoftverek' },
        ],
        ongoingEffects: [
          { target: 'passive', monthlyAmount: 80_000, durationRounds: -1, description: 'Automatizált mellékbevétel' },
        ],
        didYouKnow: 'Az alkalmazotti munkaszerződésed tartalmazhat versenytilalmi vagy mellékállás-tilalmi záradékot. Mindig ellenőrizd, mielőtt mellékállást indítasz!',
      },
      {
        id: 'dani-ext-04-c',
        label: 'Eladja az ügyfélkört',
        description:
          'Eladod a kialakított ügyfélkört és a brand-edet egy nagyobb cégnek. ' +
          'Egyszeri bevétel: +800 000 Ft, de elveszíted a mellékbevételi forrást.',
        financialEffects: [
          { target: 'balance', amount: 800_000, description: 'Ügyfélkör és brand eladása' },
        ],
        didYouKnow: 'Egy jól működő ügyfélkör értéke általában az éves bevétel 1-3×-a. Ha havi 150K Ft bevételed volt, az éves 1.8M Ft — szóval a 800K Ft alulértékelt is lehet!',
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [18, 19],
  },

  // ===================================================================
  // 5. SZAKASZ: HOSSZU TAVU PORTFOLIO (20. kor)
  // ===================================================================

  {
    id: 'dani-ext-05',
    category: 'Befektetés',
    title: 'Hosszú távú portfólió',
    situation:
      'Év végi mérleg ideje. {{balance}} Ft van a számládon, összesen {{netWorth}} Ft a nettó vagyonod. ' +
      'Ideje hosszú távú befektetési stratégiát építeni.',
    dynamicVariables: {
      balance: 'player.balance',
      netWorth: 'player.computed.netWorth',
    },
    options: [
      {
        id: 'dani-ext-05-a',
        label: 'TBSZ maximalizálás',
        description:
          'Éves TBSZ kereted maximális kihasználása: –1 000 000 Ft befektetés ' +
          'ETF-be és osztalékfizető részvényekbe. 5 év után adómentes hozam.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-tbsz-etf', 'inv-dividend-stock'],
        didYouKnow: 'A TBSZ-re csak a nyitás évében fizethetsz be (felső határ nincs, minimum 25 000 Ft). 5 év lejárat után a teljes hozam adómentes — szemben a normál 15% SZJA-val!',
        invests: [{ optionId: 'inv-tbsz-etf', amount: 600_000 }, { optionId: 'inv-dividend-stock', amount: 400_000 }],
      },
      {
        id: 'dani-ext-05-b',
        label: 'Ingatlan befektetés',
        description:
          'Félreteszel 2 000 000 Ft-ot egy befektetési célú kis lakás önerejére. ' +
          'A vásárlás és a kiadás később jön; addig a pénz kötve van, és nem kamatozik.',
        financialEffects: [
          { target: 'balance', amount: -2_000_000, description: 'Befektetési ingatlan önerő' },
        ],
        unlocksInvestment: ['inv-rental-apartment'],
        didYouKnow: 'Befektetési célú ingatlannál számolj a rejtett költségekkel: felújítás, közös költség, biztosítás, adó (15% SZJA a bérleti díjra), üres hónapok. A nettó hozam általában 4-6% évente.',
        acquiresAsset: { id: 'onero', name: 'Önerő befektetési lakásra (elkülönítve)', value: 2_000_000 },
      },
      {
        id: 'dani-ext-05-c',
        label: 'Agresszív növekedés – kripto + részvény',
        description:
          'Magas kockázatú portfólió: –800 000 Ft, fele kriptóba, fele egyedi részvényekbe. ' +
          'Nagy nyereség VAGY nagy veszteség lehetősége.',
        financialEffects: [
        ],
        unlocksInvestment: ['inv-crypto', 'inv-stock-hu'],
        didYouKnow: 'A „befektetési piramis" elve: az alapja a biztonságos eszközök (állampapír, bankbetét), középen a mérsékelt kockázatú (ETF, ingatlan), és csak a csúcsán a magas kockázatú (kripto, egyedi részvény). Soha ne tedd az egészet a csúcsba!',
        invests: [{ optionId: 'inv-crypto', amount: 400_000 }, { optionId: 'inv-stock-hu', amount: 400_000 }],
      },
    ],
    characterPresets: ['career_start'],
    availableAtRounds: [20],
  },
];
