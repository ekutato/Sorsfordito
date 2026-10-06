// ============================================================================
// PENZUGYI SORSFORDITO - Inheritance Decision Tree (Marathon/Ultra Mode)
// Petra 30→35 eves - Extended decisions (rounds 13-20)
// ============================================================================

import type { DecisionCard } from '@/types/game';

/**
 * "Váratlan örökség" döntésfa - Maraton/Ultra mód (13-20. kör)
 *
 * Petra 31-35 éves korának döntései:
 *   1. Családtervezés (13-14. kör) – GYES, Babaváró, DINK
 *   2. Ingatlankezelés (15-16. kör) – felújítás / bérbeadás / fejlesztés
 *   3. Portfólió-átrendezés (17. kör) – konzervatív / kiegyensúlyozott / nemzetközi
 *   4. Karrier csúcsdöntés (18-19. kör) – vezető / saját cég / részmunkaidő
 *   5. Pénzügyi függetlenség (20. kör) – FIRE / félnyugdíj / maximális jövedelem
 */

export const INHERITANCE_EXTENDED_DECISIONS: DecisionCard[] = [

  // ===================================================================
  // 1. SZAKASZ: CSALÁDTERVEZÉS (13-14. kör)
  // ===================================================================

  {
    id: 'inh-ext-01',
    category: 'Életmód',
    title: 'Családtervezés',
    situation:
      '31-32 éves vagy, stabil párkapcsolatban élsz. A karriered jól alakul, ' +
      'a pénzügyi helyzeted rendezett. Egyre többet gondolkodsz a családalapításon – ' +
      'de ez komoly pénzügyi döntés is. Hogyan tervezel?',
    options: [
      {
        id: 'inh-ext-01-a',
        label: 'GYES + Babaváró hitel igénylése',
        description:
          'Igénybe veszed a Babaváró hitelt (max 11M Ft, 0% kamat, ha 5 éven belül gyerek születik). ' +
          'GYED alatt (első 2 év) a fizetésed 70%-át kapod, utána GYES (nyugdíjminimum). A támogatás óriási.',
        financialEffects: [
          { target: 'balance', amount: 11_000_000, description: 'Babaváró hitel folyósítás (0% kamat feltételekkel)' },
          { target: 'loanPayments', amount: 0, description: 'Babaváró törlesztő (0% ha 5 éven belül gyerek)' },
          { target: 'salary', amount: -126_000, description: 'GYED alatti jövedelemcsökkenés (420K → ~294K GYED, átmeneti)' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 294_000, durationRounds: 4, description: 'GYED ellátás (fizetés 70%-a, felső határral)' },
        ],
        didYouKnow: 'GYED (első 2 év): a korábbi fizetésed 70%-a, legfeljebb a minimálbér ({{min_wage}} Ft) kétszeresének 70%-a (bruttó). GYES (2 éves kor után, 3 éves korig): a nyugdíjminimum, 28 500 Ft/hó. A Babaváró feltétele: házasság, nő max 40 év, 3 év TB jogviszony.',
      },
      {
        id: 'inh-ext-01-b',
        label: 'Halasztás 2-3 évvel – karrierfókusz',
        description:
          'Még nem most. Előbb kihasználod a karriered lendületét: előléptetés, ' +
          'magasabb fizetés, erősebb pénzügyi alap. A gyerek ráér 34-35 évesen is.',
        financialEffects: [
          { target: 'salary', amount: 50_000, description: 'Előléptetés miatti fizetésemelés' },
          { target: 'other', amount: 15_000, description: 'Magasabb életszínvonal költségei' },
        ],
        didYouKnow: 'Magyarországon az átlagos első gyermekvállalási életkor 30,3 év (KSH, 2025). A Babaváró hitel igénylésének feltétele: max 40 éves nő, házasság, legalább 3 éves TB jogviszony.',
      },
      {
        id: 'inh-ext-01-c',
        label: 'DINK életmód (Double Income, No Kids)',
        description:
          'Tudatosan döntitek: nem vállaltok gyereket. A dupla jövedelem ' +
          'utazásra, hobbiakra, befektetésekre megy. Szabadabb, de más életpálya.',
        financialEffects: [
          { target: 'other', amount: 30_000, description: 'Utazás, hobbi, élmények havi költsége' },
          { target: 'balance', amount: -200_000, description: 'Életmód-befektetések (kurzusok, felszerelés)' },
        ],
        didYouKnow: 'A DINK háztartások átlagos megtakarítási rátája 25-35%, szemben a gyermekes családok 5-15%-ával. A különbség hosszú távon befektetve jelentős vagyonkülönbséget eredményez.',
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [13, 14],
  },

  // ===================================================================
  // 2. SZAKASZ: INGATLANKEZELÉS (15-16. kör)
  // ===================================================================

  {
    id: 'inh-ext-02',
    category: 'Ingatlan',
    title: 'Ingatlankezelés',
    situation:
      'Van egy ingatlanod (telek vagy mobilház a vidéki telken). Az ingatlanpiac ' +
      'élénk, a bérleti díjak emelkednek. Ideje dönteni: mi legyen a vagyonelemeddel?',
    options: [
      {
        id: 'inh-ext-02-a',
        label: 'Felújítás és eladás',
        description:
          'Befektetsz 2M Ft-ot felújításra (festés, kert, tetőjavítás), ' +
          'majd 8M Ft-ért eladod. A projekt 2-3 hónapig tart, de szép haszon.',
        financialEffects: [
          { target: 'balance', amount: -2_000_000, description: 'Felújítási költségek' },
          { target: 'balance', amount: 8_000_000, description: 'Ingatlan eladási ár (közvetítői díjjal csökkentve)' },
          { target: 'other', amount: -10_000, description: 'Projekt menedzsment költségek (utazás, idő)' },
        ],
        didYouKnow: 'Ingatlan eladásnál a szerzéstől (örökléstől) számított 5 éven belül 15% SZJA-t kell fizetni a nyereségre. 5 év után az adó 0%! Érdemes kivárni, ha lehet.',
      },
      {
        id: 'inh-ext-02-b',
        label: 'Hosszú távú bérbeadás',
        description:
          'Rendbe teszed az ingatlant (500 000 Ft), majd hosszú távra kiadod. ' +
          'Havi 130 000 Ft stabil bérleti díj, minimális kockázattal.',
        financialEffects: [
          { target: 'balance', amount: -500_000, description: 'Ingatlan rendberakása bérbeadáshoz' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 130_000, durationRounds: -1, description: 'Hosszú távú bérleti díj bevétel' },
        ],
        didYouKnow: 'A bérbeadásból származó jövedelemre 15% SZJA-t kell fizetni. Választhatsz tételes költségelszámolást (amortizáció, javítás) vagy 10%-os átalány költséghányadot.',
      },
      {
        id: 'inh-ext-02-c',
        label: 'Fejlesztés apartmanházra',
        description:
          'Nagyobb léptékű beruházás: 6M Ft-ból 3 kis apartmant alakítasz ki. ' +
          'Magasabb bevétel (250 000 Ft/hó), de komoly tőkeigény és kockázat.',
        financialEffects: [
          { target: 'balance', amount: -6_000_000, description: 'Apartmanház építés/fejlesztés' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 250_000, durationRounds: -1, description: 'Apartmanház bérleti díj bevétel (3 lakás)' },
        ],
        didYouKnow: 'Több lakás bérbeadása esetén az adóhatóság megítélheti, hogy rendszeres gazdasági tevékenységet végzel – ilyenkor egyéni vállalkozói regisztráció szükséges.',
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [15, 16],
  },

  // ===================================================================
  // 3. SZAKASZ: PORTFÓLIÓ-ÁTRENDEZÉS (17. kör)
  // ===================================================================

  {
    id: 'inh-ext-03',
    category: 'Befektetés',
    title: 'Portfólió-átrendezés',
    situation:
      'A számládon {{balance}} Ft van, a nettó vagyonod {{netWorth}} Ft. ' +
      'Két éve építed a portfóliódat – ideje felülvizsgálni. ' +
      'A piacok változtak, a céljaid is fejlődtek. Merre indulsz?',
    dynamicVariables: {
      balance: 'player.balance',
      netWorth: 'player.computed.netWorth',
    },
    options: [
      {
        id: 'inh-ext-03-a',
        label: 'Konzervatív irány – kötvénylétra + PMÁP',
        description:
          'Biztonságra játszol: különböző lejáratú magyar államkötvények (kötvénylétra) + PMÁP. ' +
          'Kiszámítható hozam, alacsony kockázat. 1.5M Ft átcsoportosítás.',
        financialEffects: [
          { target: 'balance', amount: -1_500_000, description: 'Konzervatív portfólió átrendezés' },
        ],
        unlocksInvestment: ['inv-bond-ladder', 'inv-pmap'],
        didYouKnow: 'A kötvénylétra stratégia lényege: különböző lejáratú kötvényeket veszel (1, 3, 5 év), így mindig van, ami lejár, és újra befektetheted az aktuális kamaton.',
      },
      {
        id: 'inh-ext-03-b',
        label: 'Marad kiegyensúlyozott – osztalékrészvények',
        description:
          'A meglévő mix jól működik, de bővíted osztalékfizető részvényekkel. ' +
          '500 000 Ft új befektetés. Negyedéves osztalék = mini passzív jövedelem.',
        financialEffects: [
          { target: 'balance', amount: -500_000, description: 'Osztalékrészvény vásárlás' },
        ],
        unlocksInvestment: ['inv-dividend-stock'],
        didYouKnow: 'A rendszeres portfólió-újrasúlyozás (rebalancing) évi 0.5-1%-kal javíthatja a hozamot. Ha egy eszköz aránya eltér a célsúlytól 5%-nál többel, ideje átrendezni.',
      },
      {
        id: 'inh-ext-03-c',
        label: 'Nemzetközi diverzifikáció – globális ETF + EUR',
        description:
          'A magyar piac kicsi és koncentrált. Globális ETF-ek (S&P 500, MSCI World) + ' +
          'EUR megtakarítás: 1M Ft. Védelem a forint gyengülés ellen.',
        financialEffects: [
          { target: 'balance', amount: -1_000_000, description: 'Nemzetközi portfólió diverzifikáció' },
        ],
        unlocksInvestment: ['inv-tbsz-etf', 'inv-forex-eur'],
        didYouKnow: 'A devizadiverzifikáció fontos: a forint hosszú távon inkább gyengült az euróhoz képest (most {{eur_huf}} Ft/EUR), de évről évre mindkét irányba mozoghat. EUR vagy USD eszközök természetes védelmet adnak.',
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [17],
  },

  // ===================================================================
  // 4. SZAKASZ: KARRIER CSÚCSDÖNTÉS (18-19. kör)
  // ===================================================================

  {
    id: 'inh-ext-04',
    category: 'Karrier',
    title: 'Karrier csúcsdöntés',
    situation:
      '34 éves vagy, a karriered csúcsán. A tapasztalatod, a kapcsolatrendszered ' +
      'és a pénzügyi háttered lehetővé teszi, hogy nagyot lépj. ' +
      'De melyik irányba?',
    options: [
      {
        id: 'inh-ext-04-a',
        label: 'Felsővezetői pozíció',
        description:
          'Elfogadod a vezetői ajánlatot: +150 000 Ft/hó fizetésemelés. ' +
          'Cserébe: több stressz, reprezentáció, kevesebb szabadidő. A presztízs viszont nagy.',
        financialEffects: [
          { target: 'salary', amount: 150_000, description: 'Felsővezetői fizetésemelés' },
          { target: 'other', amount: 30_000, description: 'Reprezentáció és magasabb életszínvonal költségei' },
        ],
        didYouKnow: 'A vezetői kiégés (burnout) Magyarországon a munkavállalók 30%-át érinti. A magasabb fizetés nem mindig kompenzálja a mentális egészségre gyakorolt hatást.',
      },
      {
        id: 'inh-ext-04-b',
        label: 'Saját tanácsadó cég alapítása',
        description:
          'Felmondasz és saját tanácsadó céget indítasz. Az átmeneti jövedelemkiesés fájdalmas ' +
          '(-420 000 Ft/hó fizetés + 1M Ft indulás), de ha beindul: 600 000 Ft/hó bevétel.',
        financialEffects: [
          { target: 'salary', amount: -420_000, description: 'Felmondás – fizetés megszűnése' },
          { target: 'balance', amount: -1_000_000, description: 'Cégalapítás + indulási költségek' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 600_000, durationRounds: -1, description: 'Tanácsadó cég bevétel (beindulás után)' },
        ],
        unlocksKnowledge: ['know-business'],
        didYouKnow: 'Egyéni tanácsadó cégek (Kft.) alapítása: min. 3M Ft törzstőke (de elég 1.5M Ft készpénz). A KATA 2022-es szigorítása óta az átalányadó a legnépszerűbb kisvállalkozói forma.',
      },
      {
        id: 'inh-ext-04-c',
        label: 'Részmunkaidő + aktív befektetéskezelés',
        description:
          'Csökkented a munkaidőd (4 napos munkahét): -150 000 Ft/hó fizetés. ' +
          'A felszabaduló időben aktívan kezeled a portfóliódat: +80 000 Ft/hó extra hozam.',
        financialEffects: [
          { target: 'salary', amount: -150_000, description: 'Részmunkaidő miatti fizetéscsökkenés' },
        ],
        ongoingEffects: [
          { target: 'salary', monthlyAmount: 80_000, durationRounds: -1, description: 'Aktív befektetéskezelés hozama' },
        ],
        didYouKnow: 'A 4 napos munkahét kísérletei világszerte pozitív eredményeket mutattak: a termelékenység nem csökkent, a kiégés viszont jelentősen mérséklődött (2022-es brit kísérlet).',
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [18, 19],
  },

  // ===================================================================
  // 5. SZAKASZ: PÉNZÜGYI FÜGGETLENSÉG (20. kör)
  // ===================================================================

  {
    id: 'inh-ext-05',
    category: 'Stratégia',
    title: 'Pénzügyi függetlenség',
    situation:
      '35 éves vagy. Egyenleged: {{balance}} Ft, nettó vagyonod: {{netWorth}} Ft. ' +
      'Az örökség óta 5 év telt el. Most kell eldöntened: ' +
      'mi a hosszú távú pénzügyi stratégiád az elkövetkező évtizedekre?',
    dynamicVariables: {
      balance: 'player.balance',
      netWorth: 'player.computed.netWorth',
    },
    options: [
      {
        id: 'inh-ext-05-a',
        label: 'FIRE – korai pénzügyi függetlenség',
        description:
          'Financial Independence, Retire Early: agresszív megtakarítás és befektetés. ' +
          'Extra 2M Ft befektetés + havi 40 000 Ft kiadáscsökkentés. Cél: 45 évesen „nyugdíj".',
        financialEffects: [
          { target: 'balance', amount: -2_000_000, description: 'FIRE stratégia – extra befektetés' },
          { target: 'other', amount: -40_000, description: 'Agresszív megtakarítás (kiadáscsökkentés)' },
        ],
        didYouKnow: 'A FIRE mozgalom „4%-os szabálya": ha éves kiadásaid 25-szörösét befekteted, évi 4% kivétellel a tőkéd „örökké" elég. Pl. havi 400 000 Ft kiadás → 120M Ft cél.',
      },
      {
        id: 'inh-ext-05-b',
        label: 'Kiegyensúlyozott félnyugdíj',
        description:
          'Nem szélsőséges, de tudatos: kevesebb munka (-100 000 Ft/hó) és 1M Ft extra befektetés. ' +
          'Cél: 50-55 évesen részleges pénzügyi függetlenség.',
        financialEffects: [
          { target: 'salary', amount: -100_000, description: 'Kevesebb munka, több szabadidő' },
          { target: 'balance', amount: -1_000_000, description: 'Hosszú távú befektetés' },
        ],
        didYouKnow: 'A „Barista FIRE" variáns: elég vagyonod van, hogy részmunkaidőben dolgozz kedvtelésből. Nem teljes nyugdíj, de szabad és stresszmentes élet.',
      },
      {
        id: 'inh-ext-05-c',
        label: 'Maximális aktív jövedelem',
        description:
          'Nem akarsz korán visszavonulni – szeretsz dolgozni! Extra projektek (+80 000 Ft/hó) ' +
          'és magasabb életszínvonal (+20 000 Ft/hó). A vagyon majd jön a karrierrel.',
        financialEffects: [
          { target: 'salary', amount: 80_000, description: 'Extra projektek jövedelme' },
          { target: 'other', amount: 20_000, description: 'Magasabb életszínvonal költségei' },
        ],
        didYouKnow: 'A „Die with Zero" filozófia szerint nem az a cél, hogy minél többet takaríts meg, hanem hogy az életed során optimálisan használd el a pénzed – élményekre, tapasztalatokra.',
      },
    ],
    characterPresets: ['inheritance'],
    availableAtRounds: [20],
  },
];
