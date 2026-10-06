// Jólléti hatások döntési opciónként
//
// Kulcsok:
// - Döntési kártyák opciói: az opció saját `id`-ja (pl. 'dani-d01-a').
// - Döntéses sorskártyák opciói: a forrásfájlokban ezeknek nincs saját `id`-juk,
//   ezért a kulcs `<sorskártya-id>:<opció 0-tól számolt indexe>` (pl. 'fate-dani-07:0').
//
// Két csoport van, mert nincsenek univerzális igazságok:
//
// 1. WELLBEING_EFFECTS - RÖGZÍTETT hatások (-2..+2 pont jelölőnként; hiányzó kulcs = 0).
//    Csak ott, ahol a hatás kutatással alátámasztott és nem ízlés kérdése:
//    adósság és anyagi bizonytalanság → szorongás; tartalék és adósságmentesség →
//    kevesebb anyagi szorongás; átverés, kockázatos „biztos tipp" → stressz;
//    tartós túlmunka, pihenés- és alváshiány → kimerülés. Minden sor mellett
//    ott az indoklás.
//
// 2. SUBJECTIVE_WELLBEING - SZUBJEKTÍV hatások: életmód, lakhatás, együttélés
//    (szülőkkel, lakótárssal, párral), család, pályairány, szabadidő, ingázás,
//    étkezés, segítségnyújtás, kockázatvállalási kedv. Ezekben az emberek
//    különbözőek - az otthon maradás valakinek biztonság, másnak teher. Itt a
//    játékos maga dönti el, hogy a választás feltölti (+1), semleges (0) vagy
//    megterheli (-1) a megadott jelölő(ke)t; a kérdés mindkét oldalt megmutatja.
//
// Elv: nincs „jó" vagy „rossz" út - a pénzügyileg erős döntéseknek is lehet
// jólléti ára, és fordítva. Ahol nincs életszerű hatás, ott nincs bejegyzés.
import type { Wellbeing, WellbeingKey } from '@/types/wellbeing';

export interface SubjectiveWellbeing {
  /** Melyik jelölő(k)re hat - a játékos dönti el, feltölt (+1), semleges (0) vagy megterhel (-1) */
  keys: WellbeingKey[];
  /** Rövid, semleges kérdés, amely MINDKÉT oldalt megmutatja (max ~110 karakter) */
  prompt: string;
}

// ============================================================================
// 1. Rögzített, kutatással alátámasztott hatások
// ============================================================================
export const WELLBEING_EFFECTS: Record<string, Partial<Wellbeing>> = {
  // Dani - Sprint
  'dani-d02-a': { egeszseg: 1, eletero: -1 }, // vésztartalék → kevesebb anyagi szorongás (docs/kutatas.md 2.2 Tartalékképzés)
  'dani-d02-c': { eletero: 1, egeszseg: -1 }, // tartalék nélkül, részletfizetéssel → anyagi bizonytalanság, szorongás (docs/kutatas.md 2.2)
  'dani-d03-c': { egeszseg: 1 }, // nincs tartozás → kevesebb anyagi szorongás (docs/kutatas.md 2.2)
  'dani-d06-c': { eletero: -1, egeszseg: -1 }, // főállás melletti vállalkozás szabadidőben → tartós túlmunka, alváshiány (általános munkaegészségügyi alap)

  // Zsófi (fresh_start) - Sprint
  'fs-d02-a': { egeszseg: 1 }, // követett költségterv, kiszámíthatóság → kevesebb anyagi stressz (docs/kutatas.md 2.1-2.2)
  'fs-d02-b': { eletero: 1, egeszseg: -1 }, // hó végére elfogyó pénz, tartalék nélkül → anyagi bizonytalanság, szorongás (docs/kutatas.md 2.2)
  'fs-d02-c': { eletero: 1, egyensuly: 1, egeszseg: -1 }, // minden elköltve, nulla tartalék → állandó anyagi szorítás (docs/kutatas.md 2.2)
  'fs-d03-a': { eletero: 1, egeszseg: -1 }, // szabad felhasználású diákhitel → jövőbeli adósság miatti szorongás (docs/kutatas.md 2.2-2.3)
  'fs-d05b-b': { eletero: 1, egeszseg: -1 }, // autóhitel értékvesztő eszközre → törlesztési teher, szorongás (docs/kutatas.md 2.2-2.3)
  'fs-d06-a': { eletero: -1, egeszseg: -1 }, // mellékállás tanulás/munka mellett → túlmunka, kevesebb pihenés (általános munkaegészségügyi alap)

  // Generikus döntések
  'gen-insurance-b': { egeszseg: 1 }, // védettség váratlan kár ellen → kevesebb anyagi szorongás (tartalékhoz hasonló, docs/kutatas.md 2.2)
  'gen-side-a': { eletero: -1, egeszseg: -1 }, // rendszeres hétvégi munka → tartós túlmunka, kevesebb pihenés (általános munkaegészségügyi alap)
  'gen-debt-a': { egeszseg: 1 }, // gyorsabban csökkenő adósság → kevesebb anyagi szorongás (docs/kutatas.md 2.2)

  // Petra (inheritance) - Sprint
  'inh-d01-a': { egeszseg: 1 }, // megszűnő személyi kölcsön → kevesebb anyagi szorongás (docs/kutatas.md 2.2)
  'inh-d01-b': { egeszseg: -1 }, // futó személyi kölcsön + piaci kockázat → anyagi bizonytalanság (docs/kutatas.md 2.2)
  'inh-d02-a': { egeszseg: 1, eletero: 1 }, // adósságmentesség → kevesebb anyagi szorongás (docs/kutatas.md 2.2)
  'inh-d02-b': { egeszseg: -1 }, // elhúzódó tartozás → anyagi bizonytalanság, szorongás (docs/kutatas.md 2.2)
  'inh-d05-b': { eletero: -1 }, // főállás melletti vállalkozás → tartós túlmunka, kevesebb pihenés (általános munkaegészségügyi alap)

  // Döntéses sorskártyák (kulcs: '<sorskártya-id>:<opcióindex>')
  'fate-dani-07:0': { eletero: -1, egeszseg: -1 }, // hétvégi túlóra → elmarad a pihenés, kimerülés (általános munkaegészségügyi alap)
  'fate-story-invest-tip:0': { egeszseg: -1 }, // „biztos, duplán jön vissza" tipp → csalás-vészjel, pénzvesztés miatti stressz (docs/kutatas.md 3.2 B, H)
  'fate-story-side-gig:0': { eletero: -1 }, // két hónapnyi foglalt hétvége → túlmunka, kevesebb pihenés (általános munkaegészségügyi alap)
};

// ============================================================================
// 2. Szubjektív hatások - a játékos dönti el, neki mit jelent
// ============================================================================
export const SUBJECTIVE_WELLBEING: Record<string, SubjectiveWellbeing> = {
  // ==========================================================================
  // Dani - Sprint
  // ==========================================================================
  'dani-d01-a': { keys: ['eletero', 'egyensuly'], prompt: 'Egyedül élni Budapesten: van, akit feltölt az önállóság és a szabadság, van, akinek magányos és sok teher.' },
  'dani-d01-b': { keys: ['eletero', 'egeszseg'], prompt: 'Napi 3 óra ingázás és a család közelsége: van, akinek ez olvasási idő és biztonság, van, akit kifáraszt.' },
  'dani-d01-c': { keys: ['egyensuly', 'egeszseg'], prompt: 'Lakótárssal élni: van, akinek ez társaság és jó hangulat, van, akit kimerít a kevés privát tér.' },
  'dani-d02-b': { keys: ['eletero', 'egyensuly'], prompt: 'Félreteszel, de jut élményekre is: van, akinek ez a legjobb arány, van, aki inkább az egyik oldalra billenne.' },
  'dani-d03-a': { keys: ['egeszseg'], prompt: 'Extra törlesztés szűk kerettel: van, akit megnyugtat a fogyó tartozás, van, akit feszít a szoros büdzsé.' },
  'dani-d04-b': { keys: ['egeszseg'], prompt: 'A kripto ingadozása: van, akit izgalommal tölt el a kilengés, van, akinek álmatlan éjszakákat okoz.' },
  'dani-d04-c': { keys: ['eletero'], prompt: 'Előbb tanulni, aztán befektetni: van, akit lelkesít az új tudás, van, akit türelmetlenné tesz a várakozás.' },
  'dani-d05-b': { keys: ['eletero', 'egeszseg'], prompt: 'Startupba váltani: van, akit feldob az izgalmas projekt, van, akit megvisel a bizonytalan próbaidő.' },
  'dani-d05-c': { keys: ['eletero'], prompt: 'Esti képzés munka mellett: van, akit energiával tölt fel a fejlődés, van, akinek elfogy tőle a pihenőidő.' },
  'dani-d06-a': { keys: ['eletero'], prompt: 'Szigorú büdzsé a lakás-önerőért: van, akit motivál a cél, van, akinek hiányoznak az apró örömök.' },

  // ==========================================================================
  // Dani - Maraton/Ultra kiterjesztés
  // ==========================================================================
  'dani-ext-01-a': { keys: ['eletero', 'egyensuly'], prompt: 'Erős spórolás a saját lakásért: van, akit hajt a közeli cél, van, akit megvisel a sok lemondás.' },
  'dani-ext-01-b': { keys: ['egyensuly', 'egeszseg'], prompt: 'Családtervezés hosszú hitellel: van, akinek ez biztonság és közös cél, van, akit nyomaszt a kötelezettség.' },
  'dani-ext-01-c': { keys: ['eletero'], prompt: 'Albérletben maradni: van, akit felszabadít a rugalmasság, van, akinek hiányzik a saját otthon biztonsága.' },
  'dani-ext-02-a': { keys: ['egyensuly'], prompt: 'Teljes közös kassza: van, akinek ez összetartozás és egyszerűség, van, akinek túl kevés önállóságot hagy.' },
  'dani-ext-02-c': { keys: ['eletero', 'egyensuly'], prompt: 'Teljesen külön pénzügyek: van, akinek ez szabadság és tisztaság, van, aki hiányolja a közös tervezést.' },
  'dani-ext-03-a': { keys: ['egeszseg'], prompt: 'Senior szerep az ismerős csapatban: van, akit megnyugtat a kiszámíthatóság, van, aki beleun.' },
  'dani-ext-03-b': { keys: ['eletero', 'egeszseg'], prompt: 'Tech lead egy új cégnél: van, akit feldob az új kihívás, van, akit megvisel a bizonyítási nyomás.' },
  'dani-ext-03-c': { keys: ['eletero', 'egeszseg'], prompt: 'Szabadúszó munka: van, akit a szabadság tölt fel, van, akit a bizonytalan ügyfélkör nyugtalanít.' },
  'dani-ext-04-a': { keys: ['eletero', 'egeszseg'], prompt: 'Teljes idejű vállalkozás: van, akit a saját álom hajt, van, akit kimerít a sok munka és a kockázat.' },
  'dani-ext-04-b': { keys: ['eletero'], prompt: 'Vállalkozás állás mellett: van, akit lendületben tart a két lábon állás, van, akit tartósan lefáraszt.' },
  'dani-ext-04-c': { keys: ['eletero', 'egeszseg'], prompt: 'Az ügyfélkör eladása: van, akit felszabadít a több szabadidő, van, akinek hiányozni fog a saját projekt.' },
  'dani-ext-05-b': { keys: ['egeszseg'], prompt: 'Kiadott lakás hitelből: van, akit megnyugtat a kézzelfogható vagyon, van, akit nyomaszt a hitel és a bérlő.' },
  'dani-ext-05-c': { keys: ['egeszseg'], prompt: 'Kockázatos portfólió: van, akit nem zavar az árfolyamok hullámzása, van, aki folyton aggódik miatta.' },

  // ==========================================================================
  // Zsófi (fresh_start) - Sprint
  // ==========================================================================
  'fs-d01-a': { keys: ['eletero', 'egyensuly'], prompt: 'Nappali egyetem: van, akit feltölt a közösség és a tanulás, van, akinek nyomasztó még évekig tanulni.' },
  'fs-d01-b': { keys: ['eletero'], prompt: 'Szakmatanulás: van, akit lelkesít a gyorsan látható eredmény, van, aki másfajta pályáról álmodik.' },
  'fs-d01-c': { keys: ['eletero', 'egeszseg'], prompt: 'Azonnali munkába állás műszakban: van, akinek jólesik a fizikai munka és a saját pénz, van, akit kifáraszt.' },
  'fs-d03-c': { keys: ['eletero', 'egeszseg'], prompt: 'Diákmunka tanulás mellett: van, akit lendületben tart és önállóságot ad, van, akinek kevés marad a pihenésre.' },
  'fs-d05-a': { keys: ['egyensuly', 'egeszseg'], prompt: 'Kollégium: van, akinek ez pezsgő közösség, van, akit kimerít a zsúfoltság és a zaj.' },
  'fs-d05-b': { keys: ['eletero', 'egyensuly'], prompt: 'Albérlet lakótárssal: van, akit feltölt az önállóság és a társaság, van, akit megterhel a sok új feladat.' },
  'fs-d05-c': { keys: ['egyensuly'], prompt: 'Otthon maradni a családdal: van, akinek ez biztonság és meghittség, van, akit zavarnak az otthoni kötöttségek.' },
  'fs-d05b-a': { keys: ['eletero'], prompt: 'Saját használt autó: van, akit felszabadít a rugalmas közlekedés, van, akit terhel a vezetés és a szervizgond.' },
  'fs-d05b-c': { keys: ['egeszseg'], prompt: 'Tömegközlekedés: van, akinek jólesik a séta és a gondtalanság, van, akit fáraszt a várakozás és a zsúfoltság.' },
  'fs-d06-b': { keys: ['eletero'], prompt: 'Nyelvvizsga vagy jogosítvány: van, akinek önbizalmat ad a tanulás, van, akinek most inkább teher.' },

  // ==========================================================================
  // Zsófi (fresh_start) - Maraton/Ultra kiterjesztés
  // ==========================================================================
  'fs-ext-01-a': { keys: ['eletero'], prompt: 'Mesterképzés: van, akit lelkesít a további tanulás, van, akit megvisel még két év szűkös keretből.' },
  'fs-ext-01-b': { keys: ['eletero'], prompt: 'Munkába állás a diploma után: van, akit feltölt a saját bevétel, van, akinek hiányozni fog a diákélet.' },
  'fs-ext-01-c': { keys: ['eletero', 'egyensuly'], prompt: 'Gap year külföldön: van, akit feltölt az élmény és a nyitás, van, akinek nagyon hiányoznak az otthoniak.' },
  'fs-ext-02-a': { keys: ['egeszseg'], prompt: 'Multinacionális cég: van, akinek jó a kiszámítható rend, van, akit fáraszt a hosszú bejárás és a kötöttség.' },
  'fs-ext-02-b': { keys: ['egyensuly'], prompt: 'Magyar kkv: van, akinek jólesik a rugalmas, közvetlen légkör, van, aki egy nagyobb cég rendjét hiányolja.' },
  'fs-ext-02-c': { keys: ['eletero', 'egeszseg'], prompt: 'Startup: van, akit feldob a lendületes közeg, van, akit megvisel a bizonytalanság és a hajtás.' },
  'fs-ext-03-a': { keys: ['eletero', 'egyensuly'], prompt: 'Egyedül albérletben: van, akit feltölt a teljes szabadság, van, akinek magányos.' },
  'fs-ext-03-b': { keys: ['egyensuly', 'egeszseg'], prompt: 'Közös lakás hitelből a pároddal: van, akinek ez stabil otthon, van, akit nyomaszt a hosszú távú teher.' },
  'fs-ext-03-c': { keys: ['egyensuly', 'egeszseg'], prompt: 'Lakótársakkal élni: van, akinek ez jó társaság, van, akit kifáraszt a sok kompromisszum és a kevés nyugalom.' },
  'fs-ext-04-a': { keys: ['egyensuly'], prompt: 'Közös kassza a pároddal: van, akinek ez összetartozás, van, akinek túl kevés önállóságot hagy.' },
  'fs-ext-04-b': { keys: ['egyensuly'], prompt: 'Jövedelemarányos megosztás: van, aki igazságosnak érzi, van, akinek bonyolult vagy távolságtartó.' },
  'fs-ext-04-c': { keys: ['eletero', 'egyensuly'], prompt: 'Teljesen külön pénzügyek: van, akinek ez függetlenség, van, aki hiányolja a közös tervezést.' },
  'fs-ext-05-a': { keys: ['eletero', 'egyensuly'], prompt: 'Posztgraduális képzés munka mellett: van, akit lelkesít, van, akinek kevés ideje marad a kapcsolataira.' },
  'fs-ext-05-b': { keys: ['eletero', 'egeszseg'], prompt: 'Iparágváltás: van, akit feldob az új szakmai lendület, van, akit megvisel a meredek tanulási görbe.' },
  'fs-ext-05-c': { keys: ['eletero', 'egeszseg'], prompt: 'Vezetői pozíció: van, akit feltölt az elismerés, van, akit megterhel a nagyobb felelősség.' },

  // ==========================================================================
  // Generikus döntések
  // ==========================================================================
  'gen-career-a': { keys: ['eletero', 'egeszseg'], prompt: 'Munkahelyváltás: van, akit feldob az új kihívás, van, akit nyugtalanít a próbaidő bizonytalansága.' },
  'gen-career-b': { keys: ['eletero'], prompt: 'Maradni és emelést kérni: van, akinek jólesik a stabilitás és az elismerés, van, aki már újra vágyik.' },
  'gen-invest-a': { keys: ['egeszseg'], prompt: 'Részvényalapú befektetés: van, akit nem zavar a piaci ingadozás, van, aki sokat aggódik miatta.' },
  'gen-invest-c': { keys: ['egeszseg'], prompt: 'Óvatos megtakarítás: van, akit megnyugtat, hogy nem kell árfolyamot figyelni, van, akit zavar a kisebb hozam.' },
  'gen-life-a': { keys: ['eletero', 'egeszseg'], prompt: 'Drágább, nagyobb albérlet: van, akinek a tágasabb tér pihenést ad, van, akit nyomaszt a magasabb lakbér.' },
  'gen-side-b': { keys: ['eletero'], prompt: 'Online mellékprojekt építése: van, akit lelkesít az alkotás, van, akit kifáraszt a lassú eredmény.' },
  'gen-side-c': { keys: ['eletero', 'egyensuly'], prompt: 'Nem vállalsz mellékállást: van, akit feltölt a szabadidő, van, akit zavar a kihagyott bevétel.' },
  'gen-edu-a': { keys: ['eletero'], prompt: 'Online szakmai tanfolyam: van, akit feltölt az új tudás, van, akinek most csak plusz teher.' },
  'gen-edu-b': { keys: ['eletero', 'egeszseg'], prompt: 'Nyelvvizsga: van, akit motivál a cél, van, akit megvisel a vizsgadrukk és a plusz terhelés.' },
  'gen-house-a': { keys: ['egyensuly', 'egeszseg'], prompt: 'Saját lakás hitelből: van, akinek ez stabilitás és otthon, van, akit nyomaszt a hosszú távú hitelteher.' },
  'gen-house-b': { keys: ['egyensuly'], prompt: 'Olcsóbb albérlet máshol: van, akit felvillanyoz az új környék, van, akinek hiányzik a megszokott környezet.' },

  // ==========================================================================
  // Petra (inheritance) - Sprint
  // ==========================================================================
  'inh-d01-c': { keys: ['egeszseg'], prompt: 'Kivárni a döntéssel: van, akit megnyugtat, hogy nem kapkod, van, akit nyugtalanít a függőben lévő kérdés.' },
  'inh-d03-a': { keys: ['egyensuly'], prompt: 'A telek eladása: van, akinek ez felszabadító lezárás, van, akinek fáj a családi emlékhely elengedése.' },
  'inh-d03-b': { keys: ['egyensuly'], prompt: 'A telek megtartása: van, akinek fontos, hogy a családi örökség megmaradjon, van, akinek csak teher.' },
  'inh-d03-c': { keys: ['eletero', 'egeszseg'], prompt: 'Mobilház és kiadás: van, akit feldob a projekt és a vendéglátás, van, akit kimerít a sok szervezés.' },
  'inh-d04-a': { keys: ['egeszseg'], prompt: 'Konzervatív portfólió: van, akinek nyugodt alvást ad, van, akit bosszant az alacsonyabb várható hozam.' },
  'inh-d04-c': { keys: ['egeszseg'], prompt: 'Agresszív portfólió: van, akit nem zavar a nagy ingadozás, van, akit folyamatosan stresszel.' },
  'inh-d05-a': { keys: ['eletero', 'egeszseg'], prompt: 'Társas vállalkozás: van, akit a saját álom hajt, van, akit megvisel a sok munka és a kockázat.' },
  'inh-d05-c': { keys: ['egyensuly'], prompt: 'Passzív befektetés vállalkozás helyett: van, akinek jólesik a több magánidő, van, aki hiányolja a kihívást.' },
  'inh-d06-a': { keys: ['egyensuly', 'egeszseg'], prompt: 'Saját lakás: van, akinek ez biztonság és gyökerek, van, akit a nagy hitelteher nyomaszt.' },
  'inh-d06-c': { keys: ['eletero', 'egeszseg'], prompt: 'Karrierváltás: van, akit feldob az új irány, van, akit megvisel az átmeneti bizonytalanság.' },

  // ==========================================================================
  // Petra (inheritance) - Maraton/Ultra kiterjesztés
  // ==========================================================================
  'inh-ext-01-a': { keys: ['egyensuly', 'egeszseg'], prompt: 'Gyermekvállalás most: van, akinek ez a legnagyobb öröm, van, akit megvisel a kialvatlanság és a szűkebb keret.' },
  'inh-ext-01-b': { keys: ['eletero', 'egyensuly'], prompt: 'Karrierfókusz, családalapítás később: van, akit lendületben tart, van, akinél hiányzik a magánélet.' },
  'inh-ext-01-c': { keys: ['eletero'], prompt: 'Gyerek nélküli, kétkeresős életmód: van, akit feltölt a több szabad idő, van, aki másfajta családra vágyik.' },
  'inh-ext-02-a': { keys: ['eletero'], prompt: 'Felújítás és eladás: van, akit lelkesít egy hónapokig tartó projekt, van, akit kifáraszt.' },
  'inh-ext-02-c': { keys: ['egeszseg', 'eletero'], prompt: 'Apartmanház építése: van, akit feldob a nagy projekt, van, akit megvisel az építkezés stressze.' },
  'inh-ext-03-a': { keys: ['egeszseg'], prompt: 'Kötvénylétra és állampapír: van, akit megnyugtat a kiszámítható hozam, van, akit untat vagy bosszant.' },
  'inh-ext-04-a': { keys: ['eletero', 'egeszseg'], prompt: 'Felsővezetői pozíció: van, akit feltölt a presztízs, van, akit megvisel a stressz és a kevés szabadidő.' },
  'inh-ext-04-b': { keys: ['eletero', 'egeszseg'], prompt: 'Saját tanácsadó cég: van, akit felszabadít az önállóság, van, akit nyugtalanít a jövedelem ingadozása.' },
  'inh-ext-04-c': { keys: ['egyensuly', 'eletero'], prompt: 'Részmunkaidő: van, akinek a több szabadidő a legjobb, van, akinek hiányzik a munka lendülete.' },
  'inh-ext-05-a': { keys: ['eletero', 'egyensuly'], prompt: 'Korai pénzügyi függetlenség erős spórolással: van, akit hajt a cél, van, akit megvisel a sok lemondás.' },
  'inh-ext-05-b': { keys: ['egyensuly', 'egeszseg'], prompt: 'Félnyugdíj: van, akinek a lassabb tempó egyensúlyt ad, van, aki hiányolja a munka lendületét.' },
  'inh-ext-05-c': { keys: ['eletero', 'egeszseg'], prompt: 'Maximális aktív jövedelem: van, aki szereti a sok munkát, van, akit tartósan kimerít.' },

  // ==========================================================================
  // Döntéses sorskártyák (kulcs: '<sorskártya-id>:<opcióindex>')
  // ==========================================================================
  'fate-dani-07:1': { keys: ['eletero'], prompt: 'Pihenős hétvége túlóra helyett: van, akit feltölt, van, akit zavar a kihagyott plusz pénz.' },
  'fate-dani-10:0': { keys: ['eletero'], prompt: 'Drasztikus költségvágás: van, akit megnyugtat a rend, van, akinek hiányoznak az apró örömök.' },
  'fate-dani-11:0': { keys: ['eletero', 'egeszseg'], prompt: 'AI-tanfolyam munka mellett: van, akit lelkesít az új tudás, van, akinek a tanulás plusz terhet jelent.' },
  'fate-dani-11:1': { keys: ['egeszseg'], prompt: 'Kivárni, hogy érint-e az AI: van, aki nyugodtan várja, van, akit folyamatosan nyugtalanít a bizonytalanság.' },
  'fate-fs-07:0': { keys: ['egeszseg'], prompt: 'Otthoni főzés: van, akinek kikapcsolódás és jobb étkezés, van, akinek csak egy újabb házimunka.' },
  'fate-story-friend-loan:0': { keys: ['egyensuly'], prompt: 'Kölcsön egy barátnak: van, akinek jólesik segíteni, van, akit nyugtalanít, hogy visszakapja-e a pénzt.' },
  'fate-story-side-gig:1': { keys: ['eletero'], prompt: 'Mellékállás helyett pihenés: van, akit feltölt a szabad hétvége, van, akit zavar a kihagyott bevétel.' },
  'fate-inh-06:0': { keys: ['egyensuly', 'egeszseg'], prompt: 'Nagyobb kölcsön a rokonnak: van, akinek fontos a segítség, van, akit nyomaszt a nagy összeg sorsa.' },
  'fate-inh-06:1': { keys: ['egyensuly'], prompt: 'Kisebb kölcsön a rokonnak: van, akinek ez a vállalható segítség, van, akinek kínos a félig igen.' },
};
