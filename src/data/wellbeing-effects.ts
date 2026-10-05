// Jólléti hatások döntési opciónként (-2..+2 pont jelölőnként; hiányzó kulcs = 0)
//
// Kulcsok:
// - Döntési kártyák opciói: az opció saját `id`-ja (pl. 'dani-d01-a').
// - Döntéses sorskártyák opciói: a forrásfájlokban ezeknek nincs saját `id`-juk,
//   ezért a kulcs `<sorskártya-id>:<opció 0-tól számolt indexe>` (pl. 'fate-dani-07:0').
//
// Elv: nincs „jó" vagy „rossz" út – a pénzügyileg erős döntéseknek is lehet
// jólléti ára, és fordítva. Ahol nincs életszerű hatás, ott nincs bejegyzés.
import type { Wellbeing } from '@/types/wellbeing';

export const WELLBEING_EFFECTS: Record<string, Partial<Wellbeing>> = {
  // ==========================================================================
  // Dani – Sprint
  // ==========================================================================
  'dani-d01-a': { eletero: 1, egyensuly: 1 }, // önálló élet, nincs ingázás, több idő a társas életre
  'dani-d01-b': { eletero: -1, egeszseg: -1 }, // napi 3 óra ingázás fáraszt, de a család közel marad
  'dani-d01-c': { egyensuly: 1, egeszseg: -1 }, // társaság van, de kevés a privát tér, súrlódások
  'dani-d02-a': { egeszseg: 1, eletero: -1 }, // a tartalék nyugalmat ad, de kevés a feltöltődés
  'dani-d02-b': { eletero: 1, egyensuly: 1 }, // jut élményekre is, kiegyensúlyozott beosztás
  'dani-d02-c': { eletero: 1, egeszseg: -1 }, // sok élmény, de a bulizás és a részletfizetés megterhel
  'dani-d03-a': { egeszseg: -1 }, // szigorú törlesztés: szűkebb keret, több feszültség
  'dani-d03-c': { egeszseg: 1 }, // nincs tartozás, kevesebb anyagi szorongás
  'dani-d04-b': { egeszseg: -1 }, // a kripto ingadozása stresszel jár
  'dani-d04-c': { eletero: 1 }, // a tanulás magabiztosságot ad
  'dani-d05-b': { eletero: 1, egeszseg: -1 }, // izgalmas projekt, de bizonytalan próbaidő
  'dani-d05-c': { eletero: -1 }, // esti képzés munka mellett: kevesebb pihenés
  'dani-d06-a': { eletero: -1 }, // szigorú büdzsé, kevés lazítás
  'dani-d06-c': { eletero: -1, egeszseg: -1 }, // szabadidőben végzett munka, kevesebb alvás

  // ==========================================================================
  // Dani – Maraton/Ultra kiterjesztés
  // ==========================================================================
  'dani-ext-01-a': { eletero: -1, egyensuly: -1 }, // lemondás a szórakozásról, ritkább közös programok
  'dani-ext-01-b': { egyensuly: 1, egeszseg: -1 }, // közös családtervezés, de nagy, hosszú kötelezettség
  'dani-ext-01-c': { eletero: 1 }, // nem kell mindenről lemondani a lakásért
  'dani-ext-02-a': { egyensuly: 1 }, // közös gazdálkodás, erős összetartozás
  'dani-ext-02-c': { eletero: 1, egyensuly: -1 }, // nagy önállóság, de kevesebb közös tervezés
  'dani-ext-03-a': { egeszseg: 1 }, // ismerős csapat, kiszámítható terhelés
  'dani-ext-03-b': { eletero: 1, egeszseg: -1 }, // új kihívás, de bizonyítási nyomás
  'dani-ext-03-c': { eletero: 1, egeszseg: -1 }, // szabadság, de bizonytalan ügyfélkör
  'dani-ext-04-a': { eletero: 1, egeszseg: -1, egyensuly: -1 }, // a saját álom hajt, de sok munka és kockázat
  'dani-ext-04-b': { eletero: -1 }, // két lábon állás, tartósan magas terhelés
  'dani-ext-04-c': { eletero: 1, egeszseg: 1 }, // felszabaduló idő és energia
  'dani-ext-05-b': { egeszseg: -1 }, // hitel és bérlőkezelés: több teendő, több aggodalom
  'dani-ext-05-c': { egeszseg: -1 }, // magas kockázat, folyamatos árfolyamfigyelés

  // ==========================================================================
  // Zsófi (fresh_start) – Sprint
  // ==========================================================================
  'fs-d01-a': { eletero: 1, egyensuly: 1 }, // egyetemi közösség, fejlődés
  'fs-d01-b': { eletero: 1 }, // gyakorlati tanulás, hamar látható eredmény
  'fs-d01-c': { eletero: -1, egeszseg: -1 }, // gyártósori műszakok, fizikai terhelés
  'fs-d02-a': { egeszseg: 1 }, // a kiszámíthatóság csökkenti a pénzügyi stresszt
  'fs-d02-b': { eletero: 1, egeszseg: -1 }, // szabad költés, de hó végi szorongás
  'fs-d02-c': { eletero: 1, egyensuly: 1, egeszseg: -1 }, // sok társas program, de állandó anyagi szorítás
  'fs-d03-a': { eletero: 1, egeszseg: -1 }, // kényelmesebb mindennapok, de nyomasztó jövőbeli adósság
  'fs-d03-c': { eletero: -1, egeszseg: -1 }, // munka és tanulás együtt: kevés pihenés
  'fs-d05-a': { egyensuly: 1, egeszseg: -1 }, // közösség, de zsúfolt, zajos környezet
  'fs-d05-b': { eletero: 1, egyensuly: 1 }, // önállóság, saját társasági élet
  'fs-d05-c': { egyensuly: -1 }, // kevesebb önállóság, otthoni kötöttségek
  'fs-d05b-a': { eletero: 1 }, // rugalmas közlekedés, kevesebb utazási idő
  'fs-d05b-b': { eletero: 1, egeszseg: -1 }, // kényelem, de nagy havi törlesztési teher
  'fs-d05b-c': { egeszseg: 1 }, // több séta, nincs szervizgond
  'fs-d06-a': { eletero: -1, egeszseg: -1 }, // mellékállás: kevesebb pihenés
  'fs-d06-b': { eletero: 1 }, // új készség, nagyobb önbizalom

  // ==========================================================================
  // Zsófi (fresh_start) – Maraton/Ultra kiterjesztés
  // ==========================================================================
  'fs-ext-01-a': { eletero: -1 }, // még két év tanulás szűkös keretből
  'fs-ext-01-b': { eletero: 1 }, // saját bevétel, önállóság
  'fs-ext-01-c': { eletero: 2, egyensuly: -1 }, // nagy élmény és nyitás, de távol a megszokott kapcsolatoktól
  'fs-ext-02-a': { egeszseg: -1 }, // hosszabb bejárás, kötöttebb munkarend
  'fs-ext-02-b': { egyensuly: 1 }, // rugalmasabb munkaidő, közvetlen légkör
  'fs-ext-02-c': { eletero: 1, egeszseg: -1 }, // lendületes közeg, de bizonytalanság és hajtás
  'fs-ext-03-a': { eletero: 1, egyensuly: -1 }, // teljes szabadság, de egyedül
  'fs-ext-03-b': { egyensuly: 1, egeszseg: -1 }, // közös otthon, de hosszú távú teher
  'fs-ext-03-c': { egyensuly: 1, egeszseg: -1 }, // társaság, de kompromisszumok és kevés nyugalom
  'fs-ext-04-a': { egyensuly: 1 }, // közös gazdálkodás, összetartozás
  'fs-ext-04-b': { egyensuly: 1 }, // átlátható, mindkét félnek vállalható megosztás
  'fs-ext-04-c': { eletero: 1, egyensuly: -1 }, // függetlenség, de kevesebb közös tervezés
  'fs-ext-05-a': { eletero: -1, egyensuly: -1 }, // munka melletti képzés, kevesebb idő a kapcsolatokra
  'fs-ext-05-b': { eletero: 1, egeszseg: -1 }, // új szakmai lendület, meredek tanulási görbe
  'fs-ext-05-c': { eletero: 1, egeszseg: -1 }, // elismerés, de nagyobb felelősség és stressz

  // ==========================================================================
  // Generikus döntések
  // ==========================================================================
  'gen-career-a': { eletero: 1, egeszseg: -1 }, // új kihívás, de bizonytalan próbaidő
  'gen-career-b': { eletero: 1 }, // sikeres tárgyalás, elismerés
  'gen-invest-a': { egeszseg: -1 }, // piaci ingadozás, több aggódás
  'gen-invest-c': { egeszseg: 1 }, // nyugodt alvás, nincs árfolyamfigyelés
  'gen-life-a': { eletero: 1, egeszseg: 1 }, // nagyobb tér, jobb pihenés
  'gen-insurance-b': { egeszseg: 1 }, // védettség, kevesebb aggodalom
  'gen-side-a': { eletero: -1, egeszseg: -1 }, // hétvégi munka, kevesebb pihenés
  'gen-side-b': { eletero: -1 }, // sok befektetett idő, lassú eredmény
  'gen-side-c': { eletero: 1, egyensuly: 1 }, // pihenés, fejlődés, kapcsolatok
  'gen-debt-a': { egeszseg: 1 }, // gyorsabban csökkenő teher, kevesebb stressz
  'gen-edu-a': { eletero: 1 }, // fejlődés, új tudás
  'gen-edu-b': { eletero: 1, egeszseg: -1 }, // fejlődés, de vizsgadrukk és plusz terhelés
  'gen-house-a': { egyensuly: 1, egeszseg: -1 }, // saját otthon, stabilitás, de hosszú távú hitelteher
  'gen-house-b': { egyensuly: -1 }, // költözéssel távolabb kerülhetsz a megszokott környezettől

  // ==========================================================================
  // Petra (inheritance) – Sprint
  // ==========================================================================
  'inh-d01-a': { egeszseg: 1 }, // megszűnő havi teher, nyugodtabb mindennapok
  'inh-d01-b': { egeszseg: -1 }, // hitel és piaci kockázat egyszerre: több feszültség
  'inh-d01-c': { egeszseg: 1 }, // nincs kapkodás, átgondolt döntés
  'inh-d02-a': { egeszseg: 1, eletero: 1 }, // adósságmentesség, felszabadultság
  'inh-d02-b': { egeszseg: -1 }, // kettős kockázat, aggódás
  'inh-d03-a': { egyensuly: -1 }, // a családi emlékhely elengedése
  'inh-d03-b': { egyensuly: 1 }, // a családi örökség megmarad
  'inh-d03-c': { eletero: 1, egeszseg: -1 }, // izgalmas projekt, de sok szervezés, vendégkezelés
  'inh-d04-a': { egeszseg: 1 }, // „éjjel nyugodtan alszol"
  'inh-d04-c': { egeszseg: -1 }, // erős volatilitás, stressz
  'inh-d05-a': { eletero: 1, egeszseg: -1, egyensuly: -1 }, // saját álom, de sok munka, kockázat, kevés szabadidő
  'inh-d05-b': { eletero: -1 }, // munka melletti vállalkozás, kevesebb pihenés
  'inh-d05-c': { egyensuly: 1 }, // nincs extra munka, több idő a magánéletre
  'inh-d06-a': { egyensuly: 1, egeszseg: -1 }, // saját otthon, de nagy hitelteher
  'inh-d06-c': { eletero: 1, egeszseg: -1 }, // új lendület, de átmeneti bizonytalanság

  // ==========================================================================
  // Petra (inheritance) – Maraton/Ultra kiterjesztés
  // ==========================================================================
  'inh-ext-01-a': { egyensuly: 1, egeszseg: -1 }, // családalapítás, de kialvatlanság és szűkebb jövedelem
  'inh-ext-01-b': { eletero: 1, egyensuly: -1 }, // szakmai lendület, de a magánélet háttérbe szorul
  'inh-ext-01-c': { eletero: 1 }, // több idő utazásra, hobbikra
  'inh-ext-02-a': { eletero: -1 }, // hónapokig tartó felújítási projekt
  'inh-ext-02-c': { egeszseg: -1, eletero: -1 }, // nagy beruházás, építkezési stressz
  'inh-ext-03-a': { egeszseg: 1 }, // kiszámítható hozam, kevés aggodalom
  'inh-ext-04-a': { eletero: 1, egeszseg: -1, egyensuly: -1 }, // presztízs, de stressz és kevesebb szabadidő
  'inh-ext-04-b': { eletero: 1, egeszseg: -1 }, // önállóság, de jövedelemkiesés és bizonytalanság
  'inh-ext-04-c': { egyensuly: 1, eletero: 1 }, // négynapos munkahét, több szabadidő
  'inh-ext-05-a': { eletero: -1, egyensuly: -1 }, // erős lemondás, kevesebb közös élmény
  'inh-ext-05-b': { egyensuly: 1, egeszseg: 1 }, // kevesebb munka, kiegyensúlyozott tempó
  'inh-ext-05-c': { eletero: 1, egeszseg: -1 }, // szereti a munkát, de tartósan magas terhelés

  // ==========================================================================
  // Döntéses sorskártyák (kulcs: '<sorskártya-id>:<opcióindex>')
  // ==========================================================================
  'fate-dani-07:0': { eletero: -1, egeszseg: -1 }, // hétvégi túlóra: pénz, de elmarad a pihenés
  'fate-dani-07:1': { eletero: 1 }, // pihenéssel töltött hétvége
  'fate-dani-10:0': { eletero: -1 }, // drasztikus vágás: kevesebb apró öröm
  'fate-dani-11:0': { eletero: 1, egeszseg: -1 }, // fejlődés, de tanulás munka mellett
  'fate-dani-11:1': { egeszseg: -1 }, // a bizonytalanság miatti aggodalom megmarad
  'fate-fs-07:0': { egeszseg: 1 }, // otthoni főzés: kiegyensúlyozottabb étkezés
  'fate-story-friend-loan:0': { egyensuly: 1 }, // segítség egy barátnak szorult helyzetben
  'fate-story-invest-tip:0': { egeszseg: -1 }, // bizonytalan tipp, izgulás a pénz miatt
  'fate-story-side-gig:0': { eletero: -1 }, // két hónapig foglalt hétvégék
  'fate-story-side-gig:1': { eletero: 1 }, // megmarad a hétvégi pihenés
  'fate-inh-06:0': { egyensuly: 1, egeszseg: -1 }, // családi segítség, de nagy összeg miatti aggodalom
  'fate-inh-06:1': { egyensuly: 1 }, // segítség vállalható mértékben
};
