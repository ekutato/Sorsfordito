# Pénzügyi Sorsfordító - háttérkutatás

Készült: 2026. október 5. Minden állítás mellett a forrás linkje szerepel. Ahol egy adatot nem sikerült megerősíteni, ott ez szerepel: "nem ellenőrzött - próbáltam: ...".

Módszertani megjegyzés: több hivatalos oldal (mnb.hu, oecd.org, sciencedirect.com) közvetlenül nem volt letölthető a kutatási környezetből, ezért ezeknél a keresőtalálatok kivonatára, illetve az eredeti adatokat idéző másodlagos forrásra (pl. Pénz7, Index, Portfolio) támaszkodtam. Ezeket érdemes élesítés előtt az eredeti oldalon is megnézni.

**Eltérések a projekt CLAUDE.md referenciaértékeitől (javítandó):**

- A minimálbér (322 800 Ft) és a garantált bérminimum (373 200 Ft) a CLAUDE.md-ben már helyes ([berfigyelo.hu](https://berfigyelo.hu/minimalber), [Pénzcentrum](https://www.penzcentrum.hu/karrier/20251209/minimalber-2026-ennyivel-emelkedik-a-garantalt-berminimum-szakmunkas-minimalber-1190153)). Ha a kódban vagy a régi szövegekben még a korábbi 423 000 Ft szerepel, azt javítani kell.
- A bankbetét kamatára 2023. július 1. óta 15% szja mellett **13% szocho** is terhel, összesen 28%; a lakossági állampapír kamata és a TBSZ hozama ez alól mentes ([money.hu](https://tudastar.money.hu/ismerteto/megtakaritasi-ado-szocho/), [allampapirkalkulator.hu](https://allampapirkalkulator.hu/allampapir-adozas)). Az "EHO nincs" állítás igaz, de a 15% önmagában nem teljes kép.
- Babaváró: a felső korhatárról ellentmondó adatokat találtam (35 év az egyik forrásban, [money.hu](https://tudastar.money.hu/ismerteto/babavaro-hitel/) és a [keresőkivonat](https://biztosdontes.hu/cikkek/babavaro-hitel-2026-ban-kik-es-milyen-feltetelekkel-vehetik-fel) alapján) - nem ellenőrzött - próbáltam: money.hu, biztosdontes.hu keresőkivonatát; a jogszabályszöveget (net.jogtar.hu) nem nyitottam meg. A 11 millió Ft és a 3 év TB-jogviszony megerősítve.
- A GYES 28 500 Ft/hó 2027-ben is marad, mert már nem a nyugdíjminimumhoz kötött, miközben a nyugdíjminimum 2027-től 120 000 Ft-ra emelkedik ([Pénzcentrum, kapcsolódó cikklista](https://www.penzcentrum.hu/nyugdij/20260630/sulyos-tevedesben-el-rengeteg-magyar-emiatt-bukhatnak-szazezreket-1201362)). A CLAUDE.md "GYES = nyugdíjminimum" megfogalmazása 2027-től félrevezető lesz.

---

## 1. Pénzügyi tudatossági játékok hatása

### 1.1 Mit mutatnak a metaanalízisek?

- **A pénzügyi oktatás működik, de nem csodaszer.** Kaiser, Lusardi, Menkhoff és Urban 76 randomizált kísérletet (több mint 160 000 résztvevő, 33 ország) összesítő metaanalízise szerint a pénzügyi oktatásnak pozitív oksági hatása van a tudásra és a viselkedésre (költségvetés, megtakarítás, hitel), és ez a hatás legalább háromszor akkora, mint a korábbi irodalomban mért átlag ([GFLEC összefoglaló](https://gflec.org/metaanalysis/), [Journal of Financial Economics, RePEc](https://ideas.repec.org/a/eee/jfinec/v145y2022i2p255-272.html)).
- **Intenzitás és lecsengés.** Ugyanez a tanulmány szerint a hatás nő az intenzitással, de csökkenő határhaszonnal; már egy egyórás beavatkozás is szignifikáns; hat hónapnál későbbi mérésnél van némi lecsengés, de azon túl nem találtak további jelentős csökkenést ([NBER working paper](https://www.nber.org/system/files/working_papers/w27057/w27057.pdf), [GFLEC working paper](https://gflec.org/wp-content/uploads/2020/04/Working-Paper-Financial-education-affects-financial-knowledge-and-downstream-behaviors-April_2020.pdf)).
- **A korábbi, pesszimistább kép.** Fernandes, Lynch és Netemeyer (Management Science, 2014; 168 tanulmány, 201 vizsgálat) szerint a beavatkozások a viselkedés varianciájának csak 0,1%-át magyarázták, és a hatás hónapok alatt lecseng: még a sokórás programoknak is elhanyagolható a hatása 20 hónap után ([ResearchGate](https://www.researchgate.net/publication/259763070_Financial_Literacy_Financial_Education_and_Downstream_Financial_Behaviors), [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2333898)). Ebből következik a "just-in-time" oktatás ajánlása: a tudást egy konkrét döntéshez kötve érdemes átadni ([NGPF](https://www.ngpf.org/blog/personal-finance/question-whats-wrong-with-just-in-time-finance-education/)).
- **Játékalapú pénzügyi oktatás.** Egy négy országban (Belgium, Észtország, Olaszország, Szlovákia) 2220 diákkal végzett randomizált kísérletben egy online pénzügyi oktatójáték 0,313 szórásnyival javította a pénzügyi tudást; a hatás országonként 0,182 és 0,618 között szórt ([Journal of Comparative Economics, Open Universiteit](https://research.ou.nl/en/publications/the-impact-of-an-online-game-based-financial-education-course-mul/), [RePEc](https://ideas.repec.org/a/eee/jcecon/v52y2024i4p825-847.html)). Ez a hagyományos oktatással összemérhető hatás.
- **Játékosítás általában.** Sailer és Homner metaanalízise szerint a játékosítás kis-közepes pozitív hatású a kognitív (g = 0,49), motivációs (g = 0,36) és viselkedési (g = 0,25) tanulási eredményekre ([ERIC](https://eric.ed.gov/?id=EJ1245270)).
- **Az aktív tanulás többet ér, mint az előadás.** Ugandai terepkísérletben (1291 kiskereskedő, azonos tartalom, tanár és időtartam) az aktív tanulásos program hat hónap után pozitív hatással volt a megtakarításra és a befektetésre, az előadásos alig; négy év után az aktív csoportnál például 60%-kal nagyobb volt a befektetés ([CESifo/RePEc](https://ideas.repec.org/p/ces/ceswps/_9661.html), [EconStor PDF](https://www.econstor.eu/bitstream/10419/260791/1/cesifo1_wp9661.pdf)).
- **OECD/INFE ajánlás.** Az OECD Tanácsának 2020-as ajánlása a pénzügyi kultúráról a viselkedési betekintések, a digitális eszközök használatát és a beavatkozások értékelését is kéri ([OECD Legal Instruments](https://legalinstruments.oecd.org/en/instruments/OECD-LEGAL-0461), [Digital Delivery of Financial Education, OECD 2021](https://www.oecd.org/content/dam/oecd/en/publications/reports/2021/01/digital-delivery-of-financial-education_e9c6655c/d02549e7-en.pdf)).

### 1.2 Mi teszi tartóssá a tudást?

| Elv | Bizonyíték | Játékbeli megfelelő |
|---|---|---|
| **Ismétlés időben elosztva** | Cepeda és mtsai. 317 kísérletet összesítő metaanalízise szerint az elosztott gyakorlás felülmúlja a tömbösítettet, és minél hosszabb a megőrzési idő, annál nagyobb optimális szünet kell ([Psychological Bulletin 2006, PDF](https://augmentingcognition.com/assets/Cepeda2006.pdf)) | Ugyanaz a fogalom több körben, más helyzetben tér vissza |
| **Előhívás (tesztelés)** | Roediger és Karpicke: az előhívást gyakorlók egy hét után a szöveg 61%-ára emlékeztek, az újraolvasók 40%-ára ([Psychological Science 2006, PDF](https://colinallen.dnsalias.org/Readings/2006_Roediger_Karpicke_PsychSci.pdf)) | Kvíz a döntés előtt, nem utána |
| **Reflexió (debriefing)** | Crookall szerint a szimulációs játékokban a feldolgozó megbeszélés a mélyebb és tartósabb tanulás feltétele ([Simulation & Gaming 2010, PDF](http://www.unice.fr/sg/authors/docs/Crookall-2010_Serious-Gs-debrief-discipline_898-920.pdf)) | Körvégi "Mi történt és miért?" panel |
| **Valós lépés megtervezése** | A "ha-akkor" megvalósítási szándékok közepes-nagy hatásúak a célelérésre (d = 0,65, 94 vizsgálat) - újabb, nagyobb vizsgálatokban kisebb a hatás ([KOPS, Uni Konstanz](https://kops.uni-konstanz.de/handle/123456789/10973)) | "Valós lépés" blokk konkrét dátummal és linkkel |
| **Utánkövetés, emlékeztető** | Három ország banki terepkísérleteiben a célra hivatkozó emlékeztető üzenetek növelték a megtakarítási cél elérését és a megtakarított összeget ([NBER](https://www.nber.org/papers/w16205)) | Opcionális emlékeztető a játék után (pl. 2 hét múlva) |

---

## 2. A magyar lakosság tipikus pénzügyi hibái és hiányosságai

### 2.1 Tudás jó, viselkedés gyenge (OECD/INFE 2023)

A Pénziránytű Alapítvány közreműködésével készült OECD/INFE 2023 felmérés szerint ([Pénz7 összefoglaló](https://www.penz7.hu/hir-reszlet.cshtml?hirId=137)):

- A komplex pénzügyi kultúra mutató Magyarországon **58 pont** (39 ország átlaga 60, OECD átlag 63), ezzel 23. hely.
- **Pénzügyi tudásban 4. hely** a 39 országból; a megkérdezettek háromnegyede legalább 5 kérdésre jól válaszolt a 7-ből.
- Az egyszerű kamat kérdésre 2018-ban a válaszadók fele, 2023-ban 66%-a, a **kamatos kamatra 2018-ban 18,3%-a, 2023-ban 33%-a** válaszolt helyesen. Az infláció fogalmát is érdemben többen értették.
- **Pénzügyi magatartásban a mezőny utolsó negyedében** vagyunk. A leggyengébb területek: a bevételek és kiadások rövid távú követése (25%), pénzügyi termékek összehasonlítása több szolgáltató között (8%), független tanácsadó véleményének kikérése (6%).
- Költségvetést 2018-ban minden ötödik, 2023-ban minden negyedik háztartás készített.

Ugyanezt a "tudás-viselkedés szakadékot" emeli ki az MNB és a Bankszövetség szakértőinek áttekintése is ([Hitelintézeti Szemle 2024/1](https://hitelintezetiszemle.mnb.hu/hsz-23-1-je1-hergar-kovacs-nemeth)).

### 2.2 Tartalékképzés (MNB Pénzügyi Egészség Index, 2024)

Az MNB 1500 fős reprezentatív felmérése ([Index](https://index.hu/gazdasag/2024/10/25/mnb-magyar-nemzeti-bank-felmeres-kutatas-penzugyi-egeszseg-tudatossag-takarekossag/), [Telex](https://telex.hu/gazdasag/2024/10/24/kozvelemeny-kutatas-felmeres-penzugyi-egeszseg-tudatossag-mnb), [MNB Pénzügyi Egészség oldal](https://www.mnb.hu/fogyasztovedelem/penzugyi-egeszseg)):

- Az index 53 pont a 100-ból; a lakosság 14%-a kritikus (0-29 pont), 29%-a sérülékeny (30-49 pont).
- **40% nem tudna egy hónapnál tovább megélni**, ha megszűnne a fő jövedelme - ezek fele egy hétig sem.
- A magyarok **kevesebb mint harmadának** van fél havi jövedelemnek megfelelő tartaléka; 47% számít krízisben rokoni, ismerősi segítségre.
- 60% feletti arány figyeli a havi költéseit, de csak 44% készít havi elszámolást.
- 20%-nak nehézséget okoz a törlesztés, 5% nem tud időben fizetni.

### 2.3 Hitelfelvétel és THM-értés

- A COFIDIS Hitel Monitor szerint a magyarok negyede nem tudja, mit jelent a THM, és csak 48% állította, hogy teljesen érti; 79% úgy vélte, nem lehet 30% alatti THM-mel személyi kölcsönt felvenni ([Privátbankár, 2012](https://privatbankar.hu/cikkek/penzugyi_szektor/a-magyarok-negyede-nem-tudja-mit-jelent-a-thm-243904.html)). **Figyelem: ez 2012-es adat** - friss, THM-értésre vonatkozó reprezentatív magyar adatot nem találtam (nem ellenőrzött - próbáltam: "THM ismerete felmérés MNB" keresés, mabisz.hu, privatbankar.hu).
- Az összehasonlítás hiánya friss adattal is igazolt: csak 8% hasonlít össze pénzügyi termékeket több szolgáltatónál ([Pénz7/OECD 2023](https://www.penz7.hu/hir-reszlet.cshtml?hirId=137)).

### 2.4 Öngondoskodás

- Az MNB felmérése szerint csak a magyarok 19%-a érzi úgy, hogy pénzügyileg fel tud készülni a nyugdíjas éveire, 53% egyáltalán nem; 30% nem is próbál félretenni; hosszú távú kiadásokra 33% takarékoskodik ([Index](https://index.hu/gazdasag/2024/10/25/mnb-magyar-nemzeti-bank-felmeres-kutatas-penzugyi-egeszseg-tudatossag-takarekossag/)).
- Az ÖPOSZ 2026-os reprezentatív kutatása szerint a válaszadók közel negyedének van nyugdíjpénztári megtakarítása; a 2025-ös 8,8%-os átlaghozamról kétharmaduk nem volt képben, a harmaduk tévesen azt hitte, hogy az állam semmilyen támogatást nem ad, és csak tízből négyen tudták pontosan az adó-visszatérítés feltételeit ([Pénzcentrum](https://www.penzcentrum.hu/nyugdij/20260630/sulyos-tevedesben-el-rengeteg-magyar-emiatt-bukhatnak-szazezreket-1201362)).
- Biztató trend: 2025-ben az önkéntes nyugdíjpénztárak 40 028 új tagot regisztráltak (+21%), az új belépők 40%-a 16-34 éves ([Index](https://index.hu/gazdasag/2025/11/20/ongondoskodas-megtakaritas-fiatalok-nyugdijpenztar-egeszsegpenztar-penzugyi-tudatossag-ongondoskodasi-index-otp-oposz)).

### 2.5 Infláció-értés

- Az infláció fogalmát a 2023-as OECD/INFE mérésben érdemben többen értették, mint 2018-ban, ami a szerzők szerint összefügghet a magas inflációs környezettel ([Pénz7](https://www.penz7.hu/hir-reszlet.cshtml?hirId=137)).
- A pontos magyar százalékos arányt az inflációs kérdésre nem találtam (nem ellenőrzött - próbáltam: OECD 2023 PDF - a kutatási környezetből nem volt elérhető).
- A nyugdíjpénztári hozamok alulbecslése (a válaszadók 40%-a alábecsülte a 20 éves 6,36%-os átlaghozamot) arra utal, hogy a reálhozam fogalma sem tiszta ([Pénzcentrum](https://www.penzcentrum.hu/nyugdij/20260630/sulyos-tevedesben-el-rengeteg-magyar-emiatt-bukhatnak-szazezreket-1201362)).

---

## 3. Magyar csalástipológia 2025-2026 (a "Csapda" kártyák alapja)

### 3.1 A helyzet számokban

- 2025-ben a banki csalások kárértéke meghaladta a 28,7 milliárd Ft-ot, a sikeresen ellopott összeg 19,5 milliárd Ft volt; az átutalásos csalásoknál egy eset átlagosan több mint 1,6 millió Ft ([Forbes.hu](https://www.forbes.hu/hirek/lopas-banki-csalok-mnb/), keresőkivonat alapján).
- 2026 II. negyedévében az átutalásos visszaélések száma 8,4%-kal, értéke 27,9%-kal nőtt az előző negyedévhez képest (5,4 milliárd Ft), de ez teljes egészében a vállalati szektorhoz kötődött; a lakossági átutalásos károk 15,4%-kal csökkentek ([Origo](https://www.origo.hu/gazdasag/2026/09/banki-atutalas-csalas-mnb-telefon), keresőkivonat alapján). 2026 I. negyedévében a leggyakoribb típus a telefonos adathalászat volt.
- Az MNB honlapján 2025 novemberében mintegy 43 ezer figyelmeztetés szerepelt engedély nélküli vagy külföldi hatóságok által kifogásolt szereplőkről ([MNB külföldi figyelmeztetések](https://mnb.hu/kulfoldi-figyelmeztetesek), keresőkivonat).

### 3.2 Típusok, vészjelek, ellenőrző lépés

Minden csapda ugyanarra a három pszichológiai fogásra épül: **sürgetés, tekintély, titkolózás**. Az MNB szerint "minél sürgetőbb egy hívás vagy üzenet, annál gyanúsabb", és ami túl szép, hogy igaz legyen, az szinte biztosan csalás ([MNB - Védekezés a kibercsalások ellen](https://www.mnb.hu/fogyasztovedelem/digitalis-biztonsag/vedekezes-a-kibercsalasok-ellen)).

#### A) Telefonos "bankbiztonsági" csalás (vishing, "biztonsági számla")

- **Forgatókönyv:** a hívó banki, MNB-s, "KiberPajzs biztonsági szolgálat"-os vagy rendőrségi munkatársnak adja ki magát, gyanús tranzakcióra hivatkozik, és arra kér, hogy az ügyfél utaljon egy "biztonsági számlára", hagyjon jóvá egy tranzakciót vagy telepítsen távelérési programot ([MNB sajtóközlemény - KiberPajzs névvel visszaélés](https://www.mnb.hu/sajtoszoba/sajtokozlemenyek/2025-evi-sajtokozlemenyek/csalok-elnek-vissza-a-kiberpajzs-es-egy-elelmiszeraruhaz-lanc-nevevel), [Portfolio](https://www.portfolio.hu/bank/20250715/figyelmeztetest-adott-ki-az-mnb-a-jegybank-neveben-hivogatjak-aldozataikat-a-csalok-774427), [Pénzcentrum 2026. szept.](https://www.penzcentrum.hu/megtakaritas/20260921/elkepeszto-csalassorozat-tarol-magyarorszagon-egyetlen-mondat-miatt-bukhatod-az-osszes-megtakaritasodat-1205847)).
- **Vészjelek:**
  - "Biztonsági számla" - ilyen a banki gyakorlatban nem létezik ([ATV, 2026. szept.](https://www.atv.hu/belfold/20260921/csalas-telefonhivas-biztonsagi-szamla/)).
  - Jelszót, PIN-t, CVC-t, SMS-kódot kér; alkalmazás letöltését kéri; átkapcsol "a rendőrséghez" vagy másik bankhoz ([KiberPajzs](https://kiberpajzs.hu/hirek/igy-nem-valunk-telefonos-adathalaszat-aldozatava-tippek-es-tanacsok)).
  - Rákérdez a nevedre (a valódi bank tudja, kit hív) ([KiberPajzs](https://kiberpajzs.hu/hirek/igy-nem-valunk-telefonos-adathalaszat-aldozatava-tippek-es-tanacsok)).
  - A kijelzett szám hivatalosnak tűnik - a hívószám hamisítható ([Economx](https://www.economx.hu/gazdasag/mnb-kibercsalas-csalok.817046.html)). Az NMHH kezdeményezésére 2025 októbere óta a külföldről érkező, hamis magyar vezetékes azonosítójú hívásokat szűrik, mobilszámokra 2026 nyarától terjesztették ki a szűrést ([Portfolio](https://www.portfolio.hu/gazdasag/20260311/hatalmas-valtozas-jon-a-mobilszamoknal-magyarorszagon-823786), [HWSW](https://www.hwsw.hu/hirek/70304/nmhh-hivoszam-azonositas-maszkolas-hamisitas-csalas-jogszabalyvaltozas-szolgaltato.html)) - a szűrés nem teljes védelem.
- **Valós ellenőrző lépés:** tedd le, majd **te magad hívd vissza a bankot** a kártyád hátoldalán vagy a bank hivatalos honlapján szereplő számon (sok banknál külön menüpont van a csalásnak) ([KiberPajzs](https://kiberpajzs.hu/hirek/igy-nem-valunk-telefonos-adathalaszat-aldozatava-tippek-es-tanacsok)). Az MNB telefonon vagy elektronikusan soha nem kér banki vagy kártyaadatot ([Index](https://index.hu/belfold/2025/07/15/csalok-mnb-figyelmeztetes-telefonhivas-jegybank-visszaeles/)).

#### B) Hamis befektetési platformok és deepfake hirdetések

- **Forgatókönyv:** közösségi médiás hirdetés hírportál arculatát utánzó oldalra visz, ahol ismert közszereplő "titkos befektetését" vagy egy "MNB által garantált" programot reklámoznak; utána "tanácsadó" hív, aki távelérésen keresztül "segít" ([MNB sajtóközlemény 2024](https://www.mnb.hu/sajtoszoba/sajtokozlemenyek/2024-evi-sajtokozlemenyek/csalok-hirdetnek-befektetesi-programot-garanciat-az-mnb-nevevel)). A Nemzeti Kibervédelmi Intézet szerint 2026. február 9. és március 5. között mintegy 310 ilyen Meta-hirdetéskampány futott, 15-nél több nyelven; tipikus motívumok a hírességek "végrendelete" és a megrendezett "botrányinterjú" ([NKI](https://nki.gov.hu/it-biztonsag/hirek/facebook-hirdetesekben-terjedo-manipulalt-videok-iranyitjak-a-felhasznalokat-befektetesi-csalasok-fele/), [KiberPajzs](https://kiberpajzs.hu/hirek/facebook-hirdetesekben-terjedo-manipulalt-videok-terelik-a-felhasznalokat-befektetesi-csalasok-fele)). Az MNB azonosított csalássorozatai között szerepelt pl. az EG Investment Group, a GasPipe AI és a Stellar Ace ([Privátbankár](https://privatbankar.hu/cikkek/szemelyes_penzugyek/egyre-durvabb-modszerekkel-probalkoznak-a-csalok-mar-a-mesterseges-intelligenciat-is-bevetik.html), keresőkivonat).
- **Vészjelek:** garantált vagy kiugró hozam; közszereplő "ajánlása"; "csak ma", "titkos lehetőség"; távelérési program telepítése; kriptós vagy külföldi számlára utalás.
- **Valós ellenőrző lépés:** keresd meg a céget az **MNB Piaci szereplők keresőjében** / Intézménykeresőben: szerepeljen, legyen aktív, és az adott tevékenységre legyen engedélye ([MNB Piaci szereplők keresése](https://www.mnb.hu/felugyelet/engedelyezes-es-intezmenyfelugyeles/piaci-szereplok-keresese), [Intézménykereső](https://intezmenykereso.mnb.hu/), [money.hu útmutató](https://tudastar.money.hu/ismerteto/befektetesi-szolgaltato-mnb-engedely-ellenorzes/)); nézd meg az **MNB figyelmeztető listáját** ([MNB figyelmeztetések](https://www.mnb.hu/figyelmeztetesek?query=M)) és az ESMA nyilvántartását.

#### C) Adathalász SMS és e-mail (smishing, phishing)

- **Forgatókönyv:** a NAV nevében "jóváhagyott adó-visszatérítésről" (pl. 102 ezer Ft) szóló SMS vagy levél, illetve a Magyar Posta / csomagküldők nevében "vámfizetésre váró csomag" üzenet linkkel ([Pénzcentrum - NAV SMS, 2026. szept.](https://www.penzcentrum.hu/tech/20260902/azonnal-torold-ha-ilyen-sms-t-kapsz-a-nav-tol-szazezres-csapdaval-fosztjak-ki-a-magyarokat-1204792), [Pénzcentrum - Posta](https://www.penzcentrum.hu/vasarlas/20250526/csalok-elnek-vissza-a-magyar-posta-nevevel-nehogy-bedolj-visszatertek-az-sms-ek-1179359)).
- **Vészjelek:** link az üzenetben; magyartalan szöveg; a feladó címe nem `nav.gov.hu` végű; kis összegű "vám" vagy "szállítási díj"; kártyaadat kérése ([Zaol](https://www.zaol.hu/helyi-kozelet/2025/03/nav-kamuuzenetek-level-sms-adathalasz)). A NAV jelszót, belépési vagy kártyaadatot sem SMS-ben, sem e-mailben nem kér.
- **Valós ellenőrző lépés:** ne kattints; a NAV-os ügyet az **eSZJA/Ügyfélkapu+** felületen nézd meg a címet kézzel beírva; a csomagot a fuvarozó hivatalos alkalmazásában a nyomkövetési számmal ellenőrizd.

#### D) Hamis webshop

- **Vészjelek** ([MNB - Így ismerhetjük fel a hamis webshopokat](https://www.mnb.hu/fogyasztovedelem/karacsony-kiberbunozok-nelkul/igy-ismerhetjuk-fel-a-hamis-webshopokat), [NMHH - 5 tipp](https://nmhh.hu/cikk/257513/5_tipp_a_biztonsagos_online_vasarlashoz), [Origo 2026. ápr.](https://www.origo.hu/techbazis/2026/04/hamis-webaruhazak-igy-ismerhetjuk-fel)):
  - elírt domain (pl. "rn" az "m" helyett);
  - hiányzó cégnév, adószám, ügyfélszolgálat;
  - csak egyforma, ötcsillagos értékelések;
  - a piaci ár töredéke;
  - csak átutalás vagy kripto, nincs kártyás fizetés vagy utánvét.
- **Valós ellenőrző lépés:** **WHOIS-lekérdezés** - ha a domain pár hetes, az komoly vészjel; a cégnév és az adószám ellenőrzése az ingyenes céginformációs szolgálatnál (e-cegjegyzek.hu - nem ellenőrzött - próbáltam: a fenti forrásokban nem szerepelt név szerint); kártyás fizetés, mert az visszaterhelhető.

#### E) Online piactér, "hamis vevő"

- **Forgatókönyv:** a "vevő" a Jófogáson, a Vinteden vagy a Marketplace-en futárlinket küld, amely a piactér vagy a bank oldalát utánozza, és a kártyaadatokat kéri ([NKI](https://nki.gov.hu/it-biztonsag/tanacsok/online-piacteres-csalasok-%E2%94%80-keszulj-fel-hogy-ne-erjen-meglepetes/), [police.hu](https://www.police.hu/hu/hirek-es-informaciok/legfrissebb-hireink/bunugyek/naponta-aldozatul-esik-valaki)).
- **Vészjelek:** a vevő a platformon kívülre (WhatsApp, e-mail) terel; "a pénz fogadásához" kártyaadat kell.
- **Valós ellenőrző lépés:** eladóként elég a számlaszám; maradj a platformon belül, és jelentsd a profilt.

#### F) Romantikus csalás

- **Forgatókönyv:** a csaló hónapokig építi a bizalmat társkeresőn vagy közösségi oldalon, gyakran külföldi katonának, mérnöknek vagy üzletembernek adja ki magát, majd pénzt kér (gyógykezelés, repülőjegy, vízum, "vámkezelés"). Egy pápai férfi így több mint 2 millió Ft-ot utalt el ([police.hu - Újra támadnak a romantikus csalók](https://www.police.hu/hu/hirek-es-informaciok/legfrissebb-hireink/matrix-projekt/ujra-tamadnak-a-romantikus-csalok), [police.hu - Romantikus ígéretből milliós veszteség](https://www.police.hu/hu/hirek-es-informaciok/legfrissebb-hireink/matrix-projekt/romantikus-igeretbol-millios-veszteseg)).
- **Vészjelek:** személyes vagy élő videós találkozó folyamatos elmaradása; egyre növekvő "adminisztratív" költségek; titoktartás kérése.
- **Valós ellenőrző lépés:** soha ne utalj olyannak, akivel személyesen nem találkoztál; a profilképet fordított képkereséssel ellenőrizd (nem ellenőrzött - próbáltam: a police.hu oldalak ezt nem írják, általános gyakorlat); beszéld meg egy bizalmi személlyel.

#### G) Unokázós csalás (a telefonos csalás családi változata)

- **Forgatókönyv:** a hívó szerint a hozzátartozó balesetet szenvedett vagy bajba került, ezért azonnal pénz vagy ékszer kell; a csalók gyakran rendőrnek is kiadják magukat ([police.hu - Unokázós csalások](https://www.police.hu/hu/hirek-es-informaciok/bunmegelozes/aktualis/unokazos-csalasok)).
- **Vészjelek:** síró hang, időnyomás, készpénz vagy ékszer átadása futárnak.
- **Valós ellenőrző lépés:** tedd le, és **hívd fel közvetlenül a hozzátartozót**. A rendőrség telefonon soha nem kér pénzt; bűncselekmény gyanújánál hívd a 112-t.

#### H) Piramisjáték, Ponzi-séma

- **Jellemzők:** nincs mögötte valós gazdasági tevékenység; a bevétel az új belépők befizetéseiből jön; belépési díj és tagtoborzás ([police.hu - MNB-szakértő cikke, PDF](https://www.police.hu/sites/default/files/Piramisj%C3%A1t%C3%A9k%20r%C3%A9szese.pdf), [MNB - Hyperverse figyelmeztetés](https://www.mnb.hu/sajtoszoba/sajtokozlemenyek/2022-evi-sajtokozlemenyek/piramisjatek-gyanus-mlm-termek-jelent-meg-hyperverse-neven)).
- **Vészjelek:** a jutalom a toborzásért jár, nem a termékért; irreális hozam - egy szakmai összefoglaló szerint az évi 15-20% feletti ígéret már irreális ([bank360](https://bank360.hu/blog/uj-piramisepitesre-figyelmeztet-az-mnb-ne-hagyd-magad-bepalizni), keresőkivonat); a bemutatók csak zárt körben terjeszthetők.
- **Valós ellenőrző lépés:** ellenőrizd az MNB figyelmeztető listáján és az Intézménykeresőben; tedd fel a kérdést: "miből termelődik a hozam?" - ha a válasz "az új tagokból", az piramis.

### 3.3 Közös "pajzs" szabályok a kártyákhoz

1. Bank, NAV, MNB, rendőrség soha nem kér jelszót, PIN-t, SMS-kódot vagy utalást "biztonsági számlára" ([MNB](https://www.mnb.hu/fogyasztovedelem/digitalis-biztonsag/vedekezes-a-kibercsalasok-ellen), [KiberPajzs](https://kiberpajzs.hu/hirek/igy-nem-valunk-telefonos-adathalaszat-aldozatava-tippek-es-tanacsok)).
2. Megszakítás + visszahívás a saját magad által megkeresett hivatalos számon.
3. Engedély-ellenőrzés az MNB-nyilvántartásban, mielőtt bárkinek pénzt adnál.
4. Ha baj történt: azonnal hívd a bankot (kártya, számla letiltása), majd a rendőrséget ([MNB - Teendők adathalász csalás esetén](https://www.mnb.hu/fogyasztovedelem/digitalis-biztonsag/teendok-adathalasz-csalas-eseten)).

---

## 4. Társasjáték-tervezési elvek az ismétlődés, az unalom és a várakozás ellen

### 4.1 Alapelvek a szakirodalomból

- **Az unalom a tanulás vége.** Raph Koster szerint a játék öröme a mintázatok megtanulásából fakad; ha a játékos már mindent megtanult, a játék unalmassá válik ([A Theory of Fun - Game Studies Wiki](https://game-studies.fandom.com/wiki/A_Theory_of_Fun_for_Game_Design)). Következmény: a Sorsfordítónak körről körre új mintát kell adnia, nem csak új számokat.
- **Érdekes döntések.** Sid Meier szerint egy döntés akkor érdekes, ha van benne kompromisszum, helyzetfüggő, személyes és tartós következménye van; ha a játékos mindig az első opciót választja, vagy a kimenet véletlen, a döntés nem érdekes ([Game Developer - GDC 2012](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)).
- **Érdeklődési görbe.** Jesse Schell szerint az élménynek horoggal kell indulnia, fokozódnia, és a végén csúcsra jutnia; a görbe fraktálszerű, minden körnek is lehet saját íve ([Interest Curve - Game Studies Wiki](https://game-studies.fandom.com/wiki/Interest_Curve)).
- **Szakirodalmi keret.** Elias, Garfield és Gutschera "Characteristics of Games" (MIT Press, 2012) c. könyve külön fejezetet szán a várakozási időnek (downtime) és a "hógolyó vs. felzárkózás" (snowball and catch-up) feszültségnek: a játékosnak a végéig éreznie kell, hogy nyerhet ([Google Books](https://books.google.com/books/about/Characteristics_of_Games.html?id=QVP8AQAAQBAJ), [Entrogames recenzió](https://entrogames.substack.com/p/book-review-characteristics-of-games-george-skaff-elias-richard-garfield-k-robert-gutschera)). Engelstein és Shalev mechanizmus-enciklopédiája az egyidejű akcióválasztást önálló mechanizmusként írja le (TRN-09) ([ResearchGate](https://www.researchgate.net/publication/334354229_Building_Blocks_of_Tabletop_Game_Design_An_Encyclopedia_of_Mechanisms)).

### 4.2 Konkrét technikák

| Technika | Forrás, példa | Alkalmazás a Sorsfordítóban |
|---|---|---|
| **Egyidejű fordulók** | Stegmaier: "a várakozási idő gyilkos; a megoldás az, hogy a játékos akkor is el legyen foglalva, amikor nem ő következik" ([Stonemaier Games](https://stonemaiergames.com/the-top-10-things-i-learned-about-game-design-in-2013/)); a Quacks of Quedlinburg főzési fázisát mindenki egyszerre játssza ([Tabletop Bellhop](https://tabletopbellhop.com/game-reviews/quacks-of-quedlinburg/)) | Mindenki egyszerre dönt a saját telefonján, a felfedés közös |
| **"Húzózsák" keverés** | A Tetris 7-es zsákja minden darabot egyszer ad ki egy körben, így nincsenek "aszályok", és a játék igazságosnak hat ([TetrisWiki](https://tetris.wiki/Random_Generator)); a Quacks zsákja a játékos saját döntéseitől függően változik ([Tabletop Bellhop](https://tabletopbellhop.com/game-reviews/quacks-of-quedlinburg/)) | Eseménytípus-zsák: minden 6-8 körben minden típus (csapda, tudáspróba, piaci hír, életesemény, lehetőség) egyszer jön, ismétlés nélkül |
| **Késleltetett következmények** | Meier "tartós" döntései ([Game Developer](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)) | A hitelfelvétel vagy a biztosítás kihagyása 2-4 körrel később "érik be" |
| **Felzárkózási mechanika** | Power Grid: az élen álló licitál elsőként, és utolsóként vásárol nyersanyagot és épít ([BGG wiki](https://boardgamegeek.com/wiki/page/Power_Grid_FAQ), [Wikipedia](https://en.wikipedia.org/wiki/Power_Grid)); Quacks "patkányfarok": a lemaradók a különbséggel arányos bónuszt kapnak ([Tabletop Bellhop](https://tabletopbellhop.com/game-reviews/quacks-of-quedlinburg/)) | A lemaradó választ elsőként a piaci ajánlatokból, vagy ingyenes tudáskártyát kap |
| **Változatos eseménytípusok** | Koster: új minta kell, nem új szám ([Game Studies Wiki](https://game-studies.fandom.com/wiki/A_Theory_of_Fun_for_Game_Design)) | Kvíz, rejtvény, blöff/csapda, licit, közös döntés, valós adat |
| **Sikerélmény "nem mindenáron"** | Juul "kudarc-paradoxona": a játékosok a részleges kudarcot is tartalmazó élményt értékelik többre, és a kudarcból tanulva kompetensebbnek érzik magukat ([Big Think](https://bigthink.com/neuropsych/play-video-games-to-fail/), [Goodreads](https://www.goodreads.com/book/show/15926280-the-art-of-failure)) | A kudarc legyen érthető és visszafordítható; mindig mutassa meg, melyik tudás védett volna meg |

---

## 5. Naptári életszerűség Magyarországon (havi bontás)

| Hónap | Esemény | Forrás |
|---|---|---|
| **Január** | Minimálbér 322 800 Ft (+11%), garantált bérminimum 373 200 Ft (+7%) | [berfigyelo.hu](https://berfigyelo.hu/minimalber) |
| | Nyugdíjemelés 2026: 3,6% | [Pénzcentrum](https://www.penzcentrum.hu/nyugdij/20251201/nyugdijemeles-2026-itt-a-kalkulator-pontosan-ennyi-penzt-kapnak-a-magyar-nyugdijasok-januarban-1189628) |
| | 2026. január 1-jétől a 40 év alatti kétgyermekes anyák szja-mentesek (a háromgyermekes anyák 2025. október 1. óta, korhatár nélkül) | [NAV](https://nav.gov.hu/sajtoszoba/hirek/Januartol_a_40_ev_alatti_ketgyerekes_anyak_is_csatlakoznak_az_szja-mentesseghez), [csalad.hu](https://csalad.hu/tamogatas/ketgyermekes-anyak-szja-mentessege) |
| **Február** | 13. havi nyugdíj + a 14. havi nyugdíj első részlete (2026-ban a havi ellátás 25%-a), 2026. február 12-én | [Magyar Nemzet](https://magyarnemzet.hu/gazdasag/2026/01/nyugdij-13-es-14-havi-valtozo-szabalyok), [berkalkulator.com](https://berkalkulator.com/nyugdij/2026/nyugdij-kifizetesi-valtozasok-2026) |
| **Március** | Március 15.: elérhető az eSZJA bevallási tervezet; március 16.: a helyi adók (építmény-, telekadó) első részletének határideje 2026-ban | [VG](https://www.vg.hu/vilaggazdasag-magyar-gazdasag/2026/04/szja-tervezetet-veglegesitettek-nav), [Eger önkormányzat](https://www.onlineado.eger.hu/hu/adougyek/hirek-aktualitasok/c/befizetesi-hatarido-2026-marcius-16-) |
| | Március első hete: PÉNZ7 témahét az iskolákban | [money.hu](https://tudastar.money.hu/hir/20260303/rekordszamu-diak-tanul-a-penzugyekrol-penz7/) |
| **Április** | Gépjárműadó 2026-ban egy összegben, április 15-ig | [Adózóna](https://adozona.hu/helyi_ado/Gepjarmuado_helyi_adok_nyakunkon_a_hatarido_3JSS45), [alon.hu](https://www.alon.hu/gazdasag/2026/04/gepjarmuado-befizetes-2026-hatarido-szamlaszam-es-egyeb-tudnivalok-) |
| | Az adó-visszatérítés a NAV-tól jellemzően a feldolgozástól számított 30 napon belül érkezik | [szjabevallas2026.hu](https://szjabevallas2026.hu/blog/adobevallas-2026-hatarido) - nem hivatalos oldal; a NAV-oldalon nem ellenőrzött |
| **Május** | Május 20.: szja-bevallás határideje; ha a tervezetet nem fogadod el, ekkor automatikusan bevallássá válik | [VG](https://www.vg.hu/vilaggazdasag-magyar-gazdasag/2026/04/szja-tervezetet-veglegesitettek-nav) |
| | Május 15.: a jogszabály szerinti fűtési idény vége | [676/2023. Korm. rendelet](https://net.jogtar.hu/jogszabaly?docid=a2300676.kor), [miho.hu](https://miho.hu/hirek/tavhodijak-futesinditas-takarekossag) |
| **Június-augusztus** | Nyári szabadság: a tervezett összköltés egy felmérés szerint átlagosan kb. 500 ezer Ft, a többség fejenként 200 ezer Ft-nál kevesebbet tud szánni rá; 39% tervez külföldi nyaralást | [VG](https://www.vg.hu/vilaggazdasag-magyar-gazdasag/2026/06/nyaralas-balaton-draga-tengerpart-turistak-magyarok), [Pénzcentrum](https://www.penzcentrum.hu/utazas/20260604/igy-utaznak-2026-ban-a-magyarok-te-gondoltad-volna-hogy-a-tobbseg-ennyit-rakolt-egy-nyaralasra-1199888) |
| | Diákmunka az iskolai szünetben (15 évestől) | ld. 7. fejezet |
| **Július** | 2026. július 1.: 4,4%-os inflációkövető díjemelés a Telekomnál és a Yettelnél (a One-nál szeptember 1-jétől) | [VG](https://www.vg.hu/vilaggazdasag-magyar-gazdasag/2026/05/aremeles-mobilszolgatatok-telefon-inflacio-arkorlatozas), [Telex](https://telex.hu/gazdasag/2026/06/18/arat-emel-a-magyar-telekom-a-yettel-es-a-one) |
| **Augusztus** | Iskolakezdés: a tervezett kiadás mediánja gyerekenként 60 ezer Ft, elsősnél 100 ezer Ft | [Eduline](https://eduline.hu/kozoktatas/20260811_iskolakezdes-koltsegek-elso-osztaly-tamogatas-tanszerek-vasarlas), [Pénzcentrum](https://www.penzcentrum.hu/oktatas/20260811/kiderult-a-szomoru-igazsag-ennyibe-faj-2026-ban-az-iskolakezdes-a-tobbseg-semmilyen-tamogatast-nem-kap-1203743/amp) |
| | 2026-tól rászorultsági alapú, 100 000 Ft-os iskolakezdési támogatás: 50 000 Ft augusztus 24-ig, 50 000 Ft november 30-ig, igénylés nélkül | [112/2026. Korm. rendelet](https://net.jogtar.hu/jogszabaly?docid=a2600112.kor), [Bankmonitor](https://bankmonitor.hu/mediatar/cikk/100-000-forintos-iskolakezdesi-tamogatas-2026-ban-kinek-jar-mikor-erkezik-es-mit-kell-ellenorizni/) |
| **Szeptember** | Szeptember 15.: helyi adók második részlete; a fűtési idény jogi kezdete (ez még nem automatikus fűtésindítás) | [Gyál](https://gyal.hu/adofizetesi-hataridok-2026-ban/), [676/2023. Korm. rendelet](https://net.jogtar.hu/jogszabaly?docid=a2300676.kor) |
| **Október** | Fűtésindítás a hőmérséklettől függően; a fűtési szezon költségei | [miho.hu](https://miho.hu/hirek/tavhodijak-futesinditas-takarekossag) |
| **November** | Nyugdíjkorrekció csak akkor jár, ha az infláció legalább 1 százalékponttal meghaladja a januári emelést - 2026-ban várhatóan nem lesz | [Hóvége](https://hovege.hu/nyugdij/2026/09/14/novemberi-nyugdijemeles-korrekcio-2026/) |
| | Black Friday: a Kantar szerint 2025-ben a tervezett átlagos online költés kb. 130 ezer Ft volt, és csak 17% készült tudatosan | [VG](https://www.vg.hu/vilaggazdasag-magyar-gazdasag/2025/11/black-friday-akcio-karacsony), [Pénzcentrum](https://www.penzcentrum.hu/vasarlas/20251127/lehullt-a-lepel-a-vasarlas-unneperol-valodi-akciozasi-domping-vagy-bolondok-aranya-a-black-friday-1189034) |
| **December** | Karácsony: 2025-ben az átlagos tervezett ünnepi keret 129 ezer Ft volt (+26%); az ajándékköltésre a felmérések 46 és 100 ezer Ft közötti átlagokat mértek | [Index (Cofidis)](https://index.hu/gazdasag/2025/11/26/karacsony-ajandek-vasarlas-koltes-felmeres-cofidis-hitel/), [Népszava](https://nepszava.hu/3306150_karacsony-ajandek-magyarok-100-ezer-forint-felmeres-keszulodes), [PwC](https://www.pwc.com/hu/hu/sajtoszoba/2025/mennyit_koltunk_iden_karacsonyra.html) |
| | December 31.: eddig kell beérkeznie a nyugdíjpénztári befizetésnek, hogy a 20%-os (max. 150 000 Ft) adó-visszatérítés járjon | [onadozo.hu](https://www.onadozo.hu/hirek/szja-visszaterites-onkentes-penztari-befizetesek-utan-12524), [Generali Pénztár](https://nyp.generalipenztar.hu/penztartagoknak/adokedvezmeny/) |

Megjegyzés: 2026 első hét hónapjában a KSH szerint az átlagos infláció 1,7% volt ([Hóvége](https://hovege.hu/nyugdij/2026/09/14/novemberi-nyugdijemeles-korrekcio-2026/), keresőkivonat), a 2025-ös átlag 4,4% ([VG](https://www.vg.hu/vilaggazdasag-magyar-gazdasag/2026/05/aremeles-mobilszolgatatok-telefon-inflacio-arkorlatozas)). A KSH-oldalon nem ellenőriztem (nem ellenőrzött - próbáltam: másodlagos forrás).

---

## 6. Valós lépések - hivatalos, ingyenes magyar források

| Forrás | Egy mondatban |
|---|---|
| [allampapir.hu](https://www.allampapir.hu/) | Az ÁKK hivatalos oldala a lakossági állampapírokról (MÁP Plusz, Kincstári Takarékjegy, PMÁP, FixMÁP, BMÁP), aktuális kamatokkal ([hvg a 2026. májusi kamatcsökkentésről](https://hvg.hu/gazdasag/20260518_csokkennek-a-lakossagi-allampapirok-kamatai-fixmap-mapplusz)). |
| [MNB Pénzügyi Navigátor mobilapp](https://www.mnb.hu/fogyasztovedelem/penzugyi-navigator/penzugyi-navigator-mobilapplikacio) | Ingyenes, reklámmentes, regisztráció nélküli app betét-, hitel- és költségvetés-kalkulátorral, pénzügyi szótárral ([napi.hu](https://www.napi.hu/magyar_gazdasag/mobilos-app-pal-allt-elo-az-mnb---ez-sokaknak-segitseg-lehet.669917.html)). |
| [MNB Pénzügyi Navigátor Tanácsadó Irodahálózat](https://www.mnb.hu/letoltes/penzugyi-navigator-tanacsado-irodahalozat.pdf) | Ingyenes, független személyes tanácsadás minden megyeszékhelyen, szerződésértelmezéssel és beadványírással. |
| [MNB Piaci szereplők keresése](https://www.mnb.hu/felugyelet/engedelyezes-es-intezmenyfelugyeles/piaci-szereplok-keresese) / [Intézménykereső](https://intezmenykereso.mnb.hu/) | Itt ellenőrizhető, van-e egy cégnek vagy közvetítőnek MNB-engedélye. |
| [MNB figyelmeztetések](https://www.mnb.hu/figyelmeztetesek?query=M) | Az engedély nélküli és külföldi hatóságok által kifogásolt szolgáltatók listája. |
| [MNB Digitális biztonság](https://www.mnb.hu/fogyasztovedelem/digitalis-biztonsag/vedekezes-a-kibercsalasok-ellen) | Csalástípusok leírása és teendők adathalászat esetén. |
| [Pénzügyi Békéltető Testület](https://www.mnb.hu/bekeltetes/hogyan-kezdemenyezheti-az-eljarast) | Ingyenes, bíróságon kívüli vitarendezés pénzügyi szolgáltatóval, legfeljebb 90 (+30) nap alatt, ha előbb a szolgáltatónál panaszt tettél ([biztosdontes.hu](https://biztosdontes.hu/cikkek/penzugyi-bekelteto-testulet-vitarendezes-peren-kivul)). |
| [KiberPajzs](https://kiberpajzs.hu/hasznos-tippeket-olvasnek) | A hatóságok és a bankok közös csalásmegelőzési programja, aktuális figyelmeztetésekkel. |
| [police.hu bűnmegelőzés](https://www.police.hu/hu/hirek-es-informaciok/bunmegelozes/aktualis/unokazos-csalasok) | A rendőrség aktuális csalási figyelmeztetései és tanácsai. |
| [NAV eSZJA](https://www.vg.hu/vilaggazdasag-magyar-gazdasag/2026/04/szja-tervezetet-veglegesitettek-nav) | Március 15-től elérhető bevallási tervezet, amelyet május 20-ig lehet elfogadni vagy javítani (közvetlen NAV-link nem ellenőrzött). |
| [magyarorszag.hu - Nyugdíj](https://regi.ugyintezes.magyarorszag.hu/szolgaltatasok/nyugdijugyintezes.html) | Ügyfélkapu+ vagy Digitális Állampolgár alkalmazás segítségével lekérhető a szolgálati idő és a TB-nyilvántartás ([Economx](https://www.economx.hu/magyar-gazdasag/nyugdij-tb-egyeni-szamla-nyugdijszamitas.759911.html)). |
| [Magyar Államkincstár nyugdíjkalkulátor](https://nyugdijbiztositas.tcs.allamkincstar.gov.hu/hu/alkalmazás-linkek/1879-nyugdíj-kalkulátor.html) | Hivatalos kalkulátor a várható öregségi nyugdíj becsléséhez. |
| [KHR / BISZ Saját Hiteljelentés](https://bankinfo.hu/cikkek/khr-lekerdezes/) | Az Ügyfélkapun keresztül ingyen és korlátlanul lekérhető, milyen hitelekkel szerepelsz a KHR-ben (bankfiókban évente egyszer ingyenes). |
| [BÉT Akadémia](https://www.bet.hu/Befektetok/bet-akademia/bet-akademia-lakossagi-tozsdetanfolyam) | A Budapesti Értéktőzsde ingyenes, regisztrációhoz kötött lakossági tőzsdetanfolyama. |
| [Diákhitel Központ](https://diakhitel.hu/diakhitel1/) | A Diákhitel1 és a Diákhitel2 hivatalos feltételei és kalkulátora. |
| [csalad.hu](https://csalad.hu/tamogatas/otthon-start-program) | Kormányzati összefoglaló a családtámogatásokról (Otthon Start, CSOK Plusz, anyák szja-mentessége). |
| [Pénziránytű / MoneySim](https://penziranytu.hu/moneysim) | Ingyenes magyar pénzügyi szimulációs játék tizenéveseknek, tanári követéssel. |

---

## 7. Életpálya 15-16 évestől a pénzügyi függetlenségig

### 7.1 Reális magyar mérföldkövek

| Életszakasz | Szabály, program | Forrás |
|---|---|---|
| **15-17 év: diákmunka** | Főszabály szerint 16 évtől lehet munkát vállalni; 15 évesen nappali tagozatos tanuló az iskolai szünetben dolgozhat. 18 év alatt a törvényes képviselő hozzájárulása kell. Napi legfeljebb 8 óra, 16 év alatt 6 óra; éjszakai munka és túlóra nem rendelhető el. Gyámhatósági engedély nem kell, de a kezdést legalább 15 nappal előbb be kell jelenteni a gyámhatóságnak (ez utóbbi a keresőkivonat szerint). | [HKIK](https://www.hkik.hu/nyari-diakmunka-foglalkoztatasi-szabalyok/), [NAV információs füzet 2026](https://nav.gov.hu/pfile/file?path=%2Fugyfeliranytu%2Fnezzen-utana%2Finf_fuz%2Frejtett%2FInformacios-fuzetek---Aktualis%2F72_A_diakok_munkavallalasa) |
| | Iskolaszövetkezeten keresztüli munka is lehetséges; ennek külön járulékszabályait nem ellenőriztem (nem ellenőrzött - próbáltam: a fenti keresés találatai nem részletezték) | [Üzletem](https://uzletem.hu/munkaeropiac/a-diakmunka-szabalyai) |
| **18-25 év: továbbtanulás** | Diákhitel1: havi 15 000-150 000 Ft, változó kamat (új szerződésre 8,69%, a 2024. december 31-ig kötöttekre 7,99%); a törlesztés első szakaszában az előző évi minimálbér 6%-a, 2026-ban 17 448 Ft/hó. Diákhitel2: legfeljebb a tandíj összege, 0% kamattal | [money.hu](https://tudastar.money.hu/hir/20260604/diakhitel-kamatok-torlesztes-szuneteltetes/), [diakhitel.hu - Diákhitel2](https://diakhitel.hu/diakhitel2/), [bank360](https://bank360.hu/diakhitel) |
| **Első munkahely** | Minimálbér 2026-ban bruttó 322 800 Ft (nettó 214 662 Ft), garantált bérminimum 373 200 Ft (nettó 248 178 Ft) | [berfigyelo.hu](https://berfigyelo.hu/minimalber) |
| **Első lakás** | Otthon Start (2025 szeptember óta): fix, legfeljebb 3%-os kamat, max. 50 millió Ft, max. 25 év, min. 10% önerő; lakásnál 100, háznál 150 millió Ft-os vételár-korlát; az nem jogosult, akinek az előző 10 évben volt belterületi lakóingatlana | [227/2025. Korm. rendelet](https://net.jogtar.hu/jogszabaly?docid=a2500227.kor), [Origo](https://www.origo.hu/gazdasag/2025/07/fix-3-szazalek-otthon-start) |
| **Családalapítás** | CSOK Plusz: max. 3%-os fix kamat; 1 gyermeknél 15, 2-nél 30, 3-nál 50 millió Ft; a második gyermektől 10 millió Ft tartozáselengedés | [Bankmonitor](https://bankmonitor.hu/csok-plusz/), [biztosdontes.hu](https://biztosdontes.hu/csok-plusz) |
| | Babaváró: max. 11 millió Ft, 3 év TB-jogviszony; ha 5 éven belül gyermek születik, kamatmentes marad (korhatár: ld. a bevezető megjegyzését) | [money.hu](https://tudastar.money.hu/ismerteto/babavaro-hitel/) |
| | A 2026 tavaszi kormányváltás után a szakértők 2026-ra nem vártak érdemi változást ezekben a programokban; ezt 2026 őszén újra ellenőrizni kell | [Pénzcentrum, 2026. máj.](https://www.penzcentrum.hu/hitel/20260512/marad-az-otthon-start-babavaro-csok-a-tisza-kormany-alatt-nagy-valtozas-johet-a-tamogatott-hiteleknel-1198456) |
| **Nyugdíj-előtakarékosság** | Önkéntes nyugdíjpénztár: 20%, max. 150 000 Ft/év adó-visszatérítés (ehhez 750 000 Ft befizetés kell; a három pénztártípusra együtt érvényes a plafon) | [onadozo.hu](https://www.onadozo.hu/hirek/adovisszateritesi-lehetosegek--nyugdij--es-egeszsegpenztari-megtakaritasok-utan-13854) |
| | NYESZ: 20%, max. 100 000 Ft/év adó-visszatérítés (500 000 Ft befizetésnél) | [money.hu](https://tudastar.money.hu/ismerteto/nyesz-nyugdij-elotakarekossagi-szamla/), [bank360](https://bank360.hu/nyesz) |
| | TBSZ: 5 éves lekötés után a hozam adómentes, és szochót sem kell fizetni; 2026 I. negyedévében 580 ezer számla volt | [money.hu](https://tudastar.money.hu/ismerteto/megtakaritasi-ado-szocho/), [Pénzcentrum](https://www.penzcentrum.hu/vilag/20260507/tomegesen-nyitjak-az-adomentes-szamlakat-az-elelmes-magyarok-az-mnb-is-a-masodik-legnagyobb-negyedeves-ugrast-merte-1198266) |

Megjegyzés: 2027-től az önkéntes nyugdíjrendszer átalakítását célzó reformcsomagot nyújtott be a kormány ([Pénzcentrum - kapcsolódó cikklista](https://www.penzcentrum.hu/nyugdij/20260630/sulyos-tevedesben-el-rengeteg-magyar-emiatt-bukhatnak-szazezreket-1201362)); a részleteket nem ellenőriztem (nem ellenőrzött - próbáltam: csak a címet láttam).

### 7.2 Mennyi idő alatt érhető el a pénzügyi függetlenség?

- **A megtakarítási ráta a kulcs.** Mr. Money Mustache közismert táblázata 5% reálhozammal, 4%-os kivétellel és nulláról indulva számol: 10%-os megtakarítási rátával 51, 20%-kal 36, 30%-kal 28, 50%-kal 17, 70%-kal 9 munkaév kell a függetlenséghez ([Mr. Money Mustache](https://www.mrmoneymustache.com/2012/01/13/the-shockingly-simple-math-behind-early-retirement/)). Az Early Retirement Now szerint a valóságban a hozamok sorrendje miatt ez a számítás jelentősen szóródik ([ERN](https://earlyretirementnow.com/2017/11/01/shockingly-simple-complicated-random-math-behind-early-retirement/)).
- **A 4%-os szabály és kritikája.** Bengen 1994-ben, a Trinity-tanulmány 1998-ban népszerűsítette; Pfau 17 fejlett ország 1900-2008-as adatain 50/50-es portfólióval 4% helyett csak 2,86%-os biztonságos kivételi rátát talált ([Wikipedia - 4% rule](https://en.wikipedia.org/wiki/4%25_rule), [Bogleheads](https://www.bogleheads.org/wiki/Trinity_study_update)). Korai nyugdíjba vonulóknak 60 éves időtávon az ERN szerint 3,25% alatti, legfeljebb 3,5%-os kivétel ad magas sikerességet ([ERN SWR Part 1](https://earlyretirementnow.com/2016/12/07/the-ultimate-guide-to-safe-withdrawal-rates-part-1-intro/)). Ez 4% helyett 25-ször helyett 29-31-szeres éves kiadásnyi vagyont jelent (saját számítás: 1/0,035 ≈ 28,6; 1/0,0325 ≈ 30,8).
- **Magyar hozamkörnyezet.** A BUX 1991 óta forintban évi átlagosan kb. 14-15%-os nominális hozamot ért el, de euróban vagy dollárban számolva ez jóval kevesebb, mert a forint gyengült ([Privátbankár](https://privatbankar.hu/cikkek/reszveny/mi-az-a-bux-index-es-miert-volt-nagyszeru-befektetes-294232.html), [BÉT](https://www.bet.hu/Rolunk/Sajtoszoba/Sajtokozlemenyek/ujabb-tortenelmi-merfoldko-150.000-pont-folott-zart-a-bux)). Az önkéntes nyugdíjpénztárak 20 éves nettó átlaghozama 6,36%, 2025-ben 8,8% ([Pénzcentrum](https://www.penzcentrum.hu/nyugdij/20260630/sulyos-tevedesben-el-rengeteg-magyar-emiatt-bukhatnak-szazezreket-1201362)). Lakossági állampapírok 2026-ban: MÁP Plusz 5-6%, Kincstári Takarékjegy 4,5-5% ([money.hu](https://tudastar.money.hu/ismerteto/legjobb-allampapir-kamat/), keresőkivonat). A reálhozamot a magyar inflációval kell szemben állítani, amely 2025-ben 4,4% volt (ld. 5. fejezet). Hosszú távú magyar reálhozam-idősort nem találtam (nem ellenőrzött - próbáltam: BUX és inflációs keresések).
- **Következtetés a játékhoz:** egy magyar átlagkeresetből a 30% feletti megtakarítási ráta is ritka (ld. 2. fejezet: 36% nem tud rendszeresen félretenni - [Telex](https://telex.hu/gazdasag/2024/10/24/kozvelemeny-kutatas-felmeres-penzugyi-egeszseg-tudatossag-mnb)). A "pénzügyi függetlenség" helyett reálisabb, több fokozatú célt érdemes kitűzni: (1) 1 havi tartalék, (2) 3-6 havi tartalék, (3) adósságmentesség, (4) "részleges függetlenség" (a passzív jövedelem fedezi a fix költségek egy részét).

### 7.3 Mi hagyható ki vagy egyszerűsíthető úgy, hogy a tanulság megmaradjon?

| Egyszerűsítés | Mi marad meg | Indoklás |
|---|---|---|
| A jogszabályi részletek (gyámhatósági bejelentés, járulékok) helyett egyetlen "Diákmunka: nettó X Ft, max. 8 óra/nap" kártya | Az első saját jövedelem és a munka-szabadidő kompromisszum | Meier: a döntés legyen kompromisszum, nem adminisztráció ([Game Developer](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)) |
| A támogatott hitelek összes feltétele helyett 2-3 kulcsfeltétel (kamat, összeg, gyerekvállalási kötelezettség, büntetőkamat) | A "kötöttség ára" | A támogatások szabályai gyakran változnak (ld. [Portfolio 2025. aug.](https://www.portfolio.hu/bank/20250826/belenyult-a-kormany-az-otthon-start-es-a-csok-szabalyaiba-itt-vannak-a-nagy-valtozasok-781943)); a játékban ezeket adatfájlból kell kezelni |
| Nyugdíjszámítás helyett "nyugdíjrés" mutató | Az öngondoskodás szükségessége | A lakosság 53%-a egyáltalán nem érzi felkészültnek magát ([Index](https://index.hu/gazdasag/2024/10/25/mnb-magyar-nemzeti-bank-felmeres-kutatas-penzugyi-egeszseg-tudatossag-takarekossag/)) |
| Adók: csak a kamatadó és a szocho különbsége (betét 28% vs. állampapír/TBSZ 0%) | Az adókedvező számla értéke | Egyetlen, jól látható különbség, valós adattal ([money.hu](https://tudastar.money.hu/ismerteto/megtakaritasi-ado-szocho/)) |
| **Nem hagyható ki:** tartalékképzés, kamatos kamat, THM, csapdák | A legnagyobb magyar hiányosságok | ld. 2. és 3. fejezet |

---

## 8. Hasonló játékok és alkalmazások - piaci kitekintés

### 8.1 Nemzetközi példák

| Termék | Mi működik | Mit kritizálnak | Forrás |
|---|---|---|---|
| **Cashflow 101** (Kiyosaki, társasjáték) | A passzív jövedelem fogalma; az alacsony fizetésű karakter gyakran előbb lép ki a "mókuskerékből", mert alacsonyabbak a kiadásai | Játékként gyenge; elavult kivitel; a kockázatot alulmodellezi (az üzletek szinte "ingyenpénzek"); vitatott a szerző üzleti modellje | [Wikipedia](https://en.wikipedia.org/wiki/Cashflow_101), [hexagamers](https://hexagamers.com/cashflow-review/), [onproperty](https://onproperty.com.au/cashflow-101-boardgame-review-limited-replay-value/), [Motley Fool](https://www.fool.com/investing/2016/08/10/is-cashflow-101-a-good-game-for-helping-kids-learn.aspx) |
| **SPENT** (online, Urban Ministries of Durham) | Egy hónap 1000 dollárból: kellemetlen választások közt kell dönteni; több mint 1 millió játék 196 országban, tankönyvekbe is bekerült | Egyszemélyes, egyszer játszható narratíva | [Wikipedia](https://en.wikipedia.org/wiki/Spent_(video_game)), [NPR](https://www.npr.org/2011/03/01/134162898/online-survival-game-all-too-real-for-many-americans) |
| **Zogo** (app) | Rövid leckék + kvíz, jutalompont ajándékutalványért | Fizetős falak, csökkenő jutalmak; a tudás nem feltétlenül vált át viselkedésbe | [The Ways To Wealth](https://www.thewaystowealth.com/zogo-review/), [App Store vélemények](https://apps.apple.com/us/app/zogo-learn-and-earn/id1474636588?see-all=reviews&platform=iphone) |
| **BitLife** (életszimulátor app) | Teljes életút, véletlen életesemények | A szélsőséges döntéseknek gyakran nincs következményük; pénzügyi realizmusát oktatási célra nem igazolták | [Common Sense Media](https://d8.commonsensemedia.org/app-reviews/bitlife-life-simulator), [Google Play](https://play.google.com/store/apps/details?id=com.candywriter.bitlife&hl=en_US) |
| **Google Interland** (csalásfelismerés gyerekeknek) | Ismétlés és azonnali visszajelzés; a "Reality River" pálya az adathalászatról szól | Nem mutat valós adathalász üzenetet, gyenge a valóságkapcsolat | [Medium kritika](https://medium.com/@yiweiwan/game-critique-interland-be-internet-awesome-f9d851e584a0), [Better Internet for Kids](https://better-internet-for-kids.europa.eu/en/resource-directory/adventure-packed-online-game-interland) |
| **Jigsaw Phishing Quiz** (Google) | Valós esetekből készült 8 e-mail, minden kör után magyarázat | Csak e-mail, angol nyelvű, egyszemélyes | [Vice](https://www.vice.com/en/article/google-jigsaw-phishing-quiz/), [WeLiveSecurity](https://www.welivesecurity.com/2019/01/24/spot-phish-take-googles-test/) |
| **Quacks of Quedlinburg** (nem pénzügyi, de mechanikai minta) | Egyidejű játék, zsákhúzás, beépített felzárkózás | - | [Tabletop Bellhop](https://tabletopbellhop.com/game-reviews/quacks-of-quedlinburg/) |

A "Payday" társasjátékról nem találtam érdemi kritikai forrást (nem ellenőrzött - próbáltam: nem kerestem rá külön, a Cashflow-keresés nem hozta).

### 8.2 Magyar példák

- **PÉNZ7** - pénzügyi és vállalkozói témahét: 2026-ban 1200-1400 iskola, 218 ezer diák, 822 önkéntes; az indulás óta 1,9 millió diák vett részt ([Economx](https://www.economx.hu/gazdasag/2026/03/02/uj-rekord-a-penz7-en-218-ezer-diak-1212-iskola-europai-szinten-is-kiemelkedo-program-824723/), [penz7.hu](https://www.penz7.hu/)). Évente egyszer, egy hétre koncentrál - a 1. fejezet alapján a lecsengés ellen utánkövetés kellene.
- **Pénziránytű Alapítvány - MoneySim**: ingyenes, karakteralapú szimuláció tizenéveseknek (8. évfolyamtól), 2-12 szituációs játékokkal; a tanár követi az eredményeket, és osztályversenyt is rendezhet ([Pénziránytű](https://penziranytu.hu/moneysim)). További eszközök: PénzFutam szabadtéri játék, csapatjátékok, Kahoot-kvízek, társasjátékok kisebbeknek ([Pénziránytű - Online játékok](https://penziranytu.hu/online-jatekok-kiadvanyok), [Pénziránytű - társasjátékok](https://penziranytu.hu/jatszva-okosodunk-penziranytu-alapitvany-tarsasjatekai-otthonra-es-iskolaba)).
- **MNB Pénzügyi Navigátor app**: kalkulátorok, árfolyamok, szótár - eszköz, nem játék ([MNB](https://www.mnb.hu/fogyasztovedelem/penzugyi-navigator/penzugyi-navigator-mobilapplikacio)).
- **KiberPajzs**: figyelmeztetések és tippek, szöveges formában ([KiberPajzs](https://kiberpajzs.hu/hasznos-tippeket-olvasnek)).
- **Privátbankár "Legyél Te is Pénzügyi Junior Klasszis!"**: pénzügyi verseny technikumi és szakképző iskolás diákoknak ([Privátbankár, kapcsolódó cikk](https://privatbankar.hu/cikkek/penzugyi_szektor/a-magyarok-negyede-nem-tudja-mit-jelent-a-thm-243904.html)).

### 8.3 Rés a piacon - mit adhat a Sorsfordító?

1. **Valódi többjátékos, telefonon játszható, egyidejű mód** - a talált magyar eszközök egyszemélyesek (MoneySim) vagy tanórához kötött csapatjátékok; élő többjátékos online pénzügyi játékot nem találtam (nem ellenőrzött - próbáltam: Pénziránytű, PÉNZ7, MNB oldalak; célzott "magyar online többjátékos pénzügyi játék" keresést nem futtattam).
2. **Élő, valós adat** (árfolyam, BUX, állampapírkamat, hírek) - a vizsgált játékok statikus adatokkal dolgoznak.
3. **Csalásfelismerés pénzügyi játékba ágyazva, magyar esetekkel** - a nemzetközi csalásos játékok (Interland, Jigsaw) angol nyelvűek és pénzügyi kontextus nélküliek; a magyar KiberPajzs csak szöveges.
4. **Valós lépés és utánkövetés** - a Zogo-kritika is mutatja, hogy a kvíz önmagában nem elég a viselkedésváltozáshoz ([The Ways To Wealth](https://www.thewaystowealth.com/zogo-review/)).
5. **Hiteles kockázatmodell** - a Cashflow-kritika fő pontja ([hexagamers](https://hexagamers.com/cashflow-review/)).

---

## 9. Javaslatok a játékhoz

1. **"Csapda" kártyák 3.2 szerinti nyolc típussal, mindegyik kivédhető egy konkrét tudással.** A kártya felfedése előtt a játékos a "pajzs" szabályok közül választ (megszakítás + visszahívás, MNB-keresés, WHOIS, platformon belül maradás). A helyes választás teljes védelmet ad. *Indoklás:* a magyar kár fő forrása a megtévesztéses átutalás ([Forbes.hu](https://www.forbes.hu/hirek/lopas-banki-csalok-mnb/)), és minden típushoz van valós, megtanulható ellenőrző lépés.
2. **Valós dokumentum-utánzatok a csapdákban** (SMS, hirdetés, webshop-képernyő) a jelekkel együtt, de "MINTA" vízjellel és kitalált márkanevekkel. *Indoklás:* az Interland fő kritikája, hogy nem mutat valós adathalász üzenetet ([Medium](https://medium.com/@yiweiwan/game-critique-interland-be-internet-awesome-f9d851e584a0)); a vízjel és a kitalált név megakadályozza, hogy a mintát valódi csalásra lehessen használni.
3. **Egyidejű döntési fázis, minden játékos a saját telefonján, közös felfedéssel; körönként legfeljebb 60-90 másodperces döntési idő.** *Indoklás:* a várakozási idő a fő élményromboló ([Stonemaier](https://stonemaiergames.com/the-top-10-things-i-learned-about-game-design-in-2013/)).
4. **Eseménytípus-zsák (7-bag elv):** 6-8 körönként minden eseménytípus egyszer jön, a csapdatípusok külön zsákból, ismétlés nélkül. Ez kiváltja a jelenlegi `fillFateGaps()` fix ritmusát (minden 5./3./2. kör). *Indoklás:* a fix ritmus kiszámítható, a tiszta véletlen "aszályokat" okoz ([TetrisWiki](https://tetris.wiki/Random_Generator)).
5. **Késleltetett következmények:** a hitel, a biztosítás kihagyása vagy egy csapda "utóhatása" 2-4 kör múlva jelentkezik, és ezt a körvégi panel visszakapcsolja az eredeti döntéshez. *Indoklás:* Meier "tartós" döntései; Crookall: a feldolgozás teszi tartóssá a tanulást ([Game Developer](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions), [Crookall](http://www.unice.fr/sg/authors/docs/Crookall-2010_Serious-Gs-debrief-discipline_898-920.pdf)).
6. **Felzárkózás tudással, nem pénzzel:** a lemaradó elsőként választ a piaci ajánlatokból (Power Grid-elv), és ingyenes tudáskártyát kap; a vezető nem kap büntetést, de utolsóként választ. *Indoklás:* a játékosnak a végéig éreznie kell, hogy nyerhet ([Elias és mtsai.](https://entrogames.substack.com/p/book-review-characteristics-of-games-george-skaff-elias-richard-garfield-k-robert-gutschera), [Power Grid](https://en.wikipedia.org/wiki/Power_Grid)).
7. **Tudáspróba a döntés ELŐTT, és ugyanaz a fogalom 3-5 körrel később más helyzetben újra.** *Indoklás:* az előhívás és az elosztott ismétlés a legerősebb emlékezeti hatású ([Roediger és Karpicke](https://colinallen.dnsalias.org/Readings/2006_Roediger_Karpicke_PsychSci.pdf), [Cepeda és mtsai.](https://augmentingcognition.com/assets/Cepeda2006.pdf)).
8. **Kiemelt tananyag a három leggyengébb magyar terület: (a) költségkövetés, (b) ajánlatok összehasonlítása, (c) tartalék.** Például: a "Hitel" döntésnél kötelező két THM-et összevetni. *Indoklás:* ezekben vagyunk a leggyengébbek (25%, 8%; a tartalék 1/3 alatt) ([Pénz7/OECD](https://www.penz7.hu/hir-reszlet.cshtml?hirId=137), [Index/MNB](https://index.hu/gazdasag/2024/10/25/mnb-magyar-nemzeti-bank-felmeres-kutatas-penzugyi-egeszseg-tudatossag-takarekossag/)).
9. **"Tartalék-teszt" sorsfordító:** váratlan 1 havi jövedelemkiesés; aki nem tudja fedezni, "drága" hitelt kénytelen felvenni. *Indoklás:* a lakosság 40%-a egy hónapot sem bírna ki ([Index](https://index.hu/gazdasag/2024/10/25/mnb-magyar-nemzeti-bank-felmeres-kutatas-penzugyi-egeszseg-tudatossag-takarekossag/)).
10. **Naptárhű eseménymotor:** a körök hónapjai szerint jönnek a valós események (május 20. szja, augusztus iskolakezdés, december 31. pénztári befizetés, február 13. havi nyugdíj stb.), az 5. fejezet táblázatából, adatfájlban. *Indoklás:* a just-in-time elv - a tudás a döntés pillanatához kötődik ([NGPF](https://www.ngpf.org/blog/personal-finance/question-whats-wrong-with-just-in-time-finance-education/)).
11. **"Valós lépés" blokk a játék végén:** egyetlen, legfeljebb 10 perces, linkkel ellátott lépés a 6. fejezet listájából, "ha-akkor" formában ("Ha vasárnap este leülök, akkor lekérem a KHR-jelentésemet"), opcionális emlékeztetővel 14 nap múlva. *Indoklás:* a megvalósítási szándék és az emlékeztető bizonyítottan segít ([Gollwitzer és Sheeran](https://kops.uni-konstanz.de/handle/123456789/10973), [Karlan és mtsai.](https://www.nber.org/papers/w16205)).
12. **Fokozatos célok a "pénzügyi függetlenség" helyett:** 1 havi tartalék, 3-6 havi tartalék, adósságmentesség, részleges függetlenség; az epilógus ezek alapján értékel. A FIRE-modulban 3,5%-os kivétellel számoljon, ne 4%-kal. *Indoklás:* a 4% nemzetközi adatokon és hosszú időtávon túl optimista ([Pfau - Wikipedia](https://en.wikipedia.org/wiki/4%25_rule), [ERN](https://earlyretirementnow.com/2016/12/07/the-ultimate-guide-to-safe-withdrawal-rates-part-1-intro/)).
13. **Reális kockázatmodell:** minden befektetésnél legyen veszteséges év, a hozamok a magyar adatokhoz igazodjanak (állampapír 4,5-6%, pénztár 20 éves átlaga 6,36%, BUX nagy szórással), a betétkamatra 28% adó, az állampapírra és a TBSZ-re 0%. *Indoklás:* a Cashflow fő kritikája az "ingyenpénz"-üzlet ([hexagamers](https://hexagamers.com/cashflow-review/)); valós magyar adóhatás ([money.hu](https://tudastar.money.hu/ismerteto/megtakaritasi-ado-szocho/)).
14. **Kudarc, ami tanít:** a csapdába esés ne ejtse ki a játékost; a vesztesség legyen érezhető (pl. a vagyon 10-20%-a), de mindig derüljön ki, melyik jel és melyik lépés védett volna meg, és egy későbbi körben legyen "visszavágó" ugyanazzal a típussal. *Indoklás:* Juul kudarc-paradoxona ([Big Think](https://bigthink.com/neuropsych/play-video-games-to-fail/)).
15. **Tanári/csoportvezetői mód a PÉNZ7 hetére**, eredménykövetéssel (a MoneySim mintájára), és egy rövid, 2-4 héttel későbbi "visszatérő" küldetéssel. *Indoklás:* a PÉNZ7 évente 218 ezer diákot ér el egy hét alatt ([Economx](https://www.economx.hu/gazdasag/2026/03/02/uj-rekord-a-penz7-en-218-ezer-diak-1212-iskola-europai-szinten-is-kiemelkedo-program-824723/)), a lecsengés ellen pedig utánkövetés kell ([Kaiser és mtsai.](https://www.nber.org/system/files/working_papers/w27057/w27057.pdf)).

---

## Nem ellenőrzött vagy pontosítandó pontok (összesítés)

- Babaváró korhatára 2026-ban (forrásellentmondás).
- Friss (2020 utáni) magyar adat a THM-értésről - csak 2012-es COFIDIS-adatot találtam.
- Az OECD/INFE 2023 magyar infláció-kérdésének pontos aránya (az OECD PDF nem volt elérhető).
- A 2025-ös csalási kárérték és a 2026. II. negyedéves adatok az MNB eredeti kiadványában (csak sajtókivonat).
- Az iskolaszövetkezeti diákmunka járulékszabályai; a gyámhatósági bejelentés szabálya (csak keresőkivonat).
- A 2027-es önkéntes nyugdíjrendszer-reform részletei.
- Az e-cegjegyzek.hu és a fordított képkeresés mint ellenőrző lépés (általános gyakorlat, hivatalos magyar forrásban nem találtam).
- Payday társasjáték kritikája; magyar élő többjátékos pénzügyi játék léte (célzott keresés nem történt).
- KSH inflációs adatok közvetlenül a KSH-oldalon.
