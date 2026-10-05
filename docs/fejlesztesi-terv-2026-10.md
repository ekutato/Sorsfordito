# Pénzügyi Sorsfordító - frissítés + többjátékos online táblajáték

## Kontextus

A nexai.hu/sorsfordito/ jelenleg egy egyszemélyes Next.js 14 webapp (3 karakter, Sprint / Maraton / Ultra mód, kb. 130 döntés, 78 sorskártya, 20+ tudáskártya). A nexai-hu repóban csak a lefordított export van; a forrás (`C:\Users\zombo\Git4Claude\penzugyi-sorsfordito\`) git nélkül, csak a gépen létezik.

A cél:
1. **Frissítés:** a tartalom és az adatok frissítése, és az auditban talált hibák javítása.
2. **Továbbfejlesztés:** okostelefonon játszható, táblajáték kinézetű, többjátékos változat (2-10 fő), amely egy asztalnál és egymástól távoli helyekről, interneten át is játszható, szobakóddal, QR-kóddal vagy meghívólinkkel. Van próbajáték, illetve tesztalkalom mód is.
3. **Önálló megvalósítás, de együttműködésre készen:** a Sorsfordító saját arculattal és saját szabályokkal halad. Az architektúra viszont eleve fogad egy Milion-arculatot és Milion-szemléletű leágazásokat (szabálycsomag), hogy a jövőbeli együttműködés ne igényeljen átírást.

Források:
- **GDD v1 (2026. március):** Verseny (2-6 fő) és Együttműködő mód, multiplayer.
- **"Milion tréning & Okt.14." Drive-dokumentum:** tapasztalatok, a három index és a 12 alkalmas folyamat. A feldolgozását lásd lent.

## A Drive-dokumentum feldolgozása - mi kerül be a játékba

| A dokumentum pontja | Megvalósítás a Sorsfordítóban |
|---|---|
| A három index: RFA, biztonsági kör, jólléti index | Három élő mutató a Pénzügyi Lapon és az asztali ranglistán: **Pénzügyi szabadság %** (passzív jövedelem / kiadás; Milion-arculatban "RFA" a felirata), **Biztonsági kör** (készpénz ≥ 12 × havi kiadás, haladásjelzővel), **Jólléti index** (életerő + egészség + egyensúly). |
| A jóllét eszközként van jelen, nem célként. "Megvan az RFA, de idegroncs" | A jólléti index **önálló győzelmi feltétel** lesz. Az arany szinthez a pénzügyi szabadság mellé kiegyensúlyozott jóllét is kell (például az életerő, az egészség és az egyensúly is legalább 0 a -5…+5 skálán). Az Epilógus kártyák a kettő kombinációjára reagálnak (új epilógus például: "A kiégett milliomos"). |
| Egyensúly: aki hatalommal gyűri le a másikat, azt ez lelkileg megterhelheti | **Interakciós kártyák** a többjátékos módban: felvásárlás, kiszorítás, kemény alku, illetve társulás, kölcsön, közös befektetés. A kizsákmányoló döntés pénzt hoz, de az egyensúlyt és az életerőt rontja. Az együttműködő döntés lassabb, de az egyensúlyt építi. Nincs tiltás, csak látható ár. |
| Nem indul mindenki 21 évesként, ne legyen fűnyíróelv | A meglévő 18, 24 és 30 éves karakter mellé az egyéni karakter bővül. A **felkészítő kvíz** (tudáskapuk) eredménye alapján a játék a kezdőprofilt (életkor, élethelyzet, induló tőke és adósság) javasolja. A host ezek szerint asztalt vagy szintet állíthat be. |
| Nincs elég tudás a kezdéshez (például a vállalkozáskártyát senki nem húzta) | Rövid **bevezető kör** (próbajáték): mezőnként egy mondatos "mi ez, mikor éri meg" súgó, a tudáskártyák a döntés előtt is elérhetők. Nincs rábeszélő mentor: a játék semleges magyarázatot ad, ajánlást nem. |
| Öt óra körmölés, várakozás a többiekre | **Digitális könyvelés** (automatikus pénztárkönyv és mérleg) + **egyidejű fordulók**. Időtáv: 30-60 perc. |
| Hiányos eleje és vége, nincs reflexió | **Kezdés:** célkitűzés rögzítése (saját "felhő" cél). **Vége:** egyéni riport + 3 reflexiós kérdés ("Mit viszel tovább?") + a csoport összesítése. |
| 12 alkalmas éves folyamat, utánkövetés | Előkészítve, nem az első kiadás része: a riport menthető, a későbbi "Hol állsz?" alkalmon a saját valós bevétel-kiadás felmérése a három index szerint, összevetés a kiinduló értékkel. |
| Semlegesség (16-18 évesek), adatkezelés, hozzájárulás | Nincs termékajánlás és pénzügyi szolgáltató neve sem. Csak becenév utazik, a riport helyben marad. Az `adatvedelem.html` kiegészül. |
| Szabadalom, SZTNH | A Milion-specifikus elemek (tábla-elrendezés, adomány, mentordíj, életcélmezők) csak **kikapcsolt szabálycsomagként** készülnek. Ez addig nem élesíthető, amíg a megállapodás és az SZTNH-ellenőrzés meg nem történt. |

A jólléti index a te fejlesztésed, ezért a Sorsfordító alapjátékában van, nem a Milion-csomagban. A jelölői a Sorsfordítóban: **életerő, egészség, egyensúly**. A feliratok a szabálycsomagból jönnek, így együttműködés esetén paraméterezéssel a Milion fogalmaira (harmónia, vitalitás, közösség) cserélhetők, kódmódosítás nélkül.

## 0. lépés - KÉSZ

A forrás felkerült az `ekutato/Sorsfordito` repóba (`ad5090e`, 69 fájl). Klónozva: `/home/user/sorsfordito`.

Ami újrahasznosítható:
- **Motor:** `src/engine/round-processor.ts`, `financial-calculator.ts`, `crisis-handler.ts`.
- **Állapot:** `src/store/game-store.ts` (Zustand + persist).
- **Adatadapterek:** `src/data-sources/*-adapter.ts` (MNB SOAP, BÉT/Stooq, albérlet, hírek) és `pregame-processor.ts`.
- **Sorsesemény-kitöltés:** `fillFateGaps()`, amely már tud hírből generált sorseseményt kezelni.

Fontos: az `output: 'export'` miatt az `api/data/*` route-ok csak build időben futnak. A "heti frissítés" tehát heti újrabuildet jelent, és a lenti mechanizmus erre épül.

A `CLAUDE.md` két szabálya módosul:
- A 7. szabály szerint a páros vagy többjátékos mód "még nem implementálandó". Ez a mostani döntéssel érvényét veszti.
- Az 5. szabály szerint a legalsó szint "Tanulópénz", nem bronz. A győzelmi szintek ehhez igazodnak: Tanulópénz → Bronz → Ezüst → Arany.

A GDD v1 és a Drive-dokumentum a `docs/` mappába kerül.

## 1. fázis - frissítés (gyors, önálló érték)

- **Adatok:** a KSH, MNB és ÁKK legfrissebb (2026 őszi) értékei kerülnek be forrásmegjelöléssel: nettó átlagkereset, minimálbér, infláció, alapkamat, PMÁP-hozam és albérletárak. A jelenlegi `pregame` JSON 380 000 Ft-os nettóbért mutat, a GDD 548 700 Ft-ot, ezt az ellentmondást fel kell oldani. Az áprilisi statikus `api/data/*` fájlokat build idejű adatfájl váltja.
- **Audithibák javítása:**
  - A manifest abszolút úton van, ezért 404-et ad: relatív útra cseréljük, a `start_url` értéke `/sorsfordito/` lesz, és létrehozzuk a hiányzó `icon-192` és `icon-512` ikonokat.
  - A service worker scope-ját a `/sorsfordito/` útvonalra szűkítjük.
  - A viewportból kivesszük a `user-scalable=no` beállítást.
  - Az `api/data/bet` és `api/data/news` fájlokat eltávolítjuk, illetve a játéklogika fallback értékekre áll át.
- **Jólléti réteg a szóló módban is:**
  - Az életerő, az egészség és az egyensúly jelölő (-5…+5) bekerül a Pénzügyi Lapra.
  - A döntések és a sorskártyák hatásai jólléti értékkel bővülnek.
  - A tartalmi bővítéshez a Vitest a meglévő kártyák számértékeit ellenőrzi.
- **A deploy rendje:** a Netlify a nexai-hu repóból élesít (`netlify.toml`), FTP már nincs. A build kimenete a nexai-hu repó `sorsfordito/` mappájába kerül, a `claude/amazing-goodall-iosnm8` ágon.

## 1/B fázis - élő adatok, hetente frissülve

A játék a valós, aktuális magyar helyzetben zajlik. Az adatok és a belőlük készülő "heti helyzetkártyák" hetente automatikusan frissülnek.

**Mechanizmus: heti Claude-rutin** (ütemezett felhős munkamenet, hétfő hajnalban; nem kell hozzá külön API-kulcs):
1. Lefuttatja a meglévő adatadaptereket és az új forrásokat.
2. A Gmail-kapcsolaton át beolvassa a Cowork **"MK figyelő" piszkozatát**, ebből lesznek a Közlöny-kártyák.
3. A megerősített adatokat a `data/heti/AAAA-HH.json` fájlba írja, ebből elkészíti a heti helyzet- és csapdakártyákat, majd újrabuildel.
4. Pull requestet nyit a nexai-hu repóba. **Te hagyod jóvá a merge-dzsel**: ez teljesíti a `CLAUDE.md` 1. szabályát, vagyis minden adat ember által ellenőrzött, és a politikai, gazdasági szövegek semlegességét is ember ellenőrzi.
5. A merge után a Netlify élesít.

Ha egy forrás aznap nem elérhető, a játék az előző heti értékkel fut, és ezt kiírja.

**Kártyaszöveg:** a heti kártyák szövegét a rutin írja meg, a számokból és a hírcímekből. A szabályok:
- saját megfogalmazás, a forrás linkjével;
- cikk szövege nem kerül át (szerzői jogi kockázat);
- nincs pártpolitikai állásfoglalás, csak a döntés gazdasági hatása.

**Források** (az elérhetőségüket és a felhasználási feltételeiket a megvalósításkor egyenként ellenőrzöm):

| Terület | Forrás | Mire jó a játékban |
|---|---|---|
| Alapkamat, devizaárfolyamok (EUR, USD, CHF) | MNB (árfolyam-webszolgáltatás), EKB | Hitelkamatok, devizás döntések, utazás |
| Infláció, keresetek, minimálbér | KSH STADAT | Bérek, kiadások, a karakterek induló értékei |
| Állampapírhozamok (PMÁP, MÁP+, DKJ) | ÁKK | Befektetési kártyák hozama |
| BÉT-részvények (OTP, MOL, Richter, Telekom, 4iG), BUX | késleltetett árfolyam (a korábbi BÉT-scraper hibás volt, ezért új forrás kell) | Részvénykártyák |
| Nemzetközi indexek, nyersanyagok (arany, olaj, gáz), kriptó (BTC, ETH) | nyilvános, késleltetett adatforrások | Spekulatív és értékmegőrző eszközök |
| Jogszabályváltozások | Magyar Közlöny (új számok címei) + a Cowork "MK figyelő" Gmail-piszkozata | "Változik a szabály" kártyák (például új adókedvezmény, támogatás) |
| Csalásfigyelmeztetések | MNB fogyasztói figyelmeztetések | A csalafinta ajánlatok ihletője |

## 1/C fázis - csalafinta ajánlatok ("Csapda" kártyák)

Új kártyatípus: valós mintájú, csábító ajánlatok. Néhány minta:
- "garantált havi 20%";
- piramisjáték;
- telefonos "bankbiztonsági" csalás;
- magas THM-ű áruhitel;
- túlárazott befektetési biztosítás;
- influenszer kriptotippje;
- MLM-rendszer.

Minden kártyán vannak vészjelek, ezeket a játékos észreveheti:
- a THM;
- az MNB-engedély hiánya;
- a sürgetés;
- az irreális hozam.

A játékmenet:
- **Ellenőrzés:** a játékos "Ellenőrzöm" lépést tehet. Ez időbe vagy pénzbe kerül, és az MNB-nyilvántartás mintájára működik.
- **Tudással:** ha a játékosnak megvan a hozzá illő Tudás kártyája (például "Hitelek és THM" vagy "Befektetési csalások"), a vészjelek kiemelve jelennek meg.
- **Ha bedől:** pénzt veszít, és csökken az egyensúlya.
- **Ha felismeri és kivédi:** tudáspontot kap.
- **Ha figyelmezteti a többieket:** az egyensúlya nő.

A heti adatok közé valós MNB-figyelmeztetések alapján is kerülhet új csapda.

**Hamisítványok és félrevezetés:** a csapdák egy része hamis anyagot mutat. Például:
- másolt banki weboldal, egy betűben eltérő domainnel;
- hamis MNB-engedélyszám;
- deepfake "hírességes" hirdetés;
- hamisított "hivatalos" levél;
- valós kamat, de rejtett díjjal.

A kivédés szabályai:
- **Mindig van kivédési út:** minden csapdán legalább egy ellenőrizhető vészjel van, és van egy valós ellenőrző lépés (URL vizsgálata, MNB-keresés, THM-számítás, visszahívás a hivatalos számon).
- **Tudás és figyelem, nem szerencse:** a kimenetel kizárólag a játékos tudásán és figyelmén múlik, véletlenen soha. Ezt teszt ellenőrzi: minden csapdakártyán van `defensePath`.
- **Tanulság a végén:** utólag minden csapda megmutatja, mi volt a jel, és hogyan kell ezt a valóságban ellenőrizni.

## 1/D fázis - életszerűség és játékélmény (kutatás + tartalom)

**Kutatás a megvalósítás elején,** eredménye: `docs/kutatas.md`, forrásokkal. Témák:
- a pénzügyi tudatossági játékok hatásvizsgálatai;
- az MNB és az OECD/INFE pénzügyi kultúra felméréseinek tipikus magyar hibái;
- a magyar csalástipológia (MNB, rendőrség);
- a társasjáték-tervezés gyakorlata: újrajátszhatóság, a "catch-up" mechanika, a downtime csökkentése.

Az alábbi eszközökkel indulok, a kutatás finomítja őket:
- **Ismétlődés ellen:**
  - "húzózsák" keverés, vagyis egy kártya nem jön újra, amíg a pakli el nem fogy;
  - heti friss kártyák;
  - karakterenként és életkoronként szűrt események;
  - változók a szövegekben (`{{salary}}` és társai);
  - késleltetett következmények: egy döntés 3-6 hónap múlva üt vissza vagy fizet.
- **Naptár-realizmus:**
  - tavasszal az SZJA-bevallás;
  - nyáron a nyaralás;
  - szeptemberben az iskolakezdés;
  - télen a fűtés;
  - decemberben az ajándékok;
  - januárban a béremelés és a minimálbér-változás.
- **Apró kísértések** (saját mechanika, nem a Milion "Vacak" paklijának mása): lassan "szivárgó" előfizetések, a "most vedd meg, később fizesd" (BNPL) ajánlat, impulzusvásárlás. Mindig van választás (elfogad, alkuszik, lemond), és a halmozódás látszik a Pénzügyi Lapon.
- **Sikerélmény, de nem mindenáron:**
  - minden csapda kikerülhető;
  - a lemaradónak van felzárkózási lehetőség, például tudásba fektetés vagy segítségkérés egy társtól;
  - van mérföldkő-ünneplés (első biztonsági tartalék, első passzív jövedelem);
  - a győzelmet nem ajándékozzuk: a "Tanulópénz" szint megmarad.
- **Valós tudás, valós lépések:**
  - minden tudás- és befektetési kártyán van egy "Valós lépés" blokk (például TBSZ nyitása, SZJA-bevallás az ügyfélkapun, MNB-nyilvántartás keresése, THM kiszámítása), a hivatalos forrás linkjével;
  - a játék végén egyéni, letölthető **cselekvési terv** készül, benne azokkal a lépésekkel, amelyeket a játékos a játékban megtett vagy kihagyott;
  - termékajánlás nincs.

## 1/E fázis - dizájn a Claude Design vásznon (a felületek kódolása előtt)

A fiókodban elérhető a Claude Design ("Design" típusú artifact: élő artboardok egy vásznon). Saját design system még nincs, ezért elsőként ez készül el.

1. **Sorsfordító design system** (Design System artifact):
   - színek, tipográfia, kártyakeretek, a hat kártyatípus színkódja;
   - ikonok, bábuk, dobókocka;
   - világos és sötét téma.

   Erre épül később a Milion-"bőr" mint második téma.
2. **Design vászon, artboardonként:**
   - a városi táblaútvonal telefonon (390×844) és tableten;
   - a lobby (szobakód, QR, meghívólink);
   - a kezdőkvíz és a profilválasztás;
   - a Pénzügyi Lap a három indexszel;
   - kártyamintánként egy darab: Döntés, Befektetés, Sorsfordító, Tudás, Csapda (hamisítvánnyal), Hivatal / Közlöny, Kísértés;
   - az interakciós ajánlat;
   - az eredmény- és cselekvési terv képernyő;
   - a tesztalkalom-vezérlő.
3. **Jóváhagyás:** a vásznat megosztom veled, és megjegyzésben jelezheted a javításokat. Csak a jóváhagyott dizájn alapján kódolok. A színeket és a méreteket a design system tokenjeiből veszem át a Tailwind configba és a `src/themes/` fájlokba.

## 2. fázis - többjátékos asztali mód ("Asztal")

### Táblajáték-megjelenítés (a Milion táblájától eltérően)
- **Kanyargós útvonal egy illusztrált városon át, nem koncentrikus körök.** A mezők negyedeken át vezetnek: Munkahely, Piactér, Bankutca, Tőzsde, Otthon, Közösségi tér, Hivatal (a Közlöny-kártyák helye). Egy kör egy évnek felel meg, a hónapot az útvonal mentén futó naptársáv jelzi.
- **A tábla közepe:** a kártyapaklik kártyacsomagként látszanak, mellettük a dobókocka és a heti helyzetkártya.
- **Bábuk:** minden játékosnak saját színe van, a lépés animált.
- **Telefonon:** a tábla a képernyő felső részén van, csippentéssel nagyítható, és a kamera követi a soron lévő bábut. Alul a saját Pénzügyi Lap látszik.
- **Tableten vagy laptopon:** a közös kijelzőn az egész tábla látszik.
- **Grafika:** saját SVG-illusztráció. A Milion-téma később "bőrként" cserélhető, a tábla geometriája ugyanaz marad.

### Kapcsolat: egy asztalnál ÉS távoli helyekről, interneten át
- **Host-központú architektúra:** a szobát nyitó játékos eszköze futtatja a játékmotort, és ez tárolja a hiteles állapotot. A többiek akciókat küldenek, és állapotfrissítést kapnak.
- **Átvitel:** WebRTC DataChannel PeerJS-szel, STUN-nal, és **TURN-relével** a különböző hálózatok (mobilnet, otthoni router, céges tűzfal) közötti megbízható kapcsolathoz.
  - A rövid élettartamú TURN-hitelesítőt egy Netlify Function adja ki (például Cloudflare TURN), így a kulcs nem kerül a böngészőbe.
  - Ehhez neked egy Cloudflare-fiók és egy kulcs kell a Netlify környezeti változói közé. A lépéseket a megvalósításkor leírom.
  - Ha TURN nincs beállítva, a játék STUN-nal próbálkozik, és hiba esetén ezt jelzi.
- `Transport` interfész, így a megoldás később cserélhető, például Supabase Realtime-ra.
- **Csatlakozás:** 4 betűs szobakóddal, QR-kóddal (egy asztalnál) vagy **meghívólinkkel** (távoli játékosnak, Messengeren vagy e-mailben elküldve): `/sorsfordito/asztal?szoba=ABCD`.
- **Távoli játékhoz:**
  - gyors reakciók és rövid szöveges üzenetek a játékon belül (hang nincs; ehhez mellé futhat egy Meet vagy Messenger-hívás);
  - látszik, ki van online, és ki "gondolkodik";
  - időtúllépésnél automatikus "passz".
- **Újracsatlakozás és mentés:**
  - a játékos `playerId` tokent kap, amelyet a `localStorage` őriz;
  - a host az állapotot automatikusan menti, így a játék folytatható;
  - ha a host kiesik, a játék szünetel, és a host visszatérésekor onnan folytatódik.
- **CSP (`netlify.toml`, `/sorsfordito/*`):** a `connect-src` kiegészül a PeerJS broker és a TURN-hitelesítő function címével. A `.htaccess` ezzel szinkronban marad.

### Próbajáték és tesztalkalom mód
- **Próbajáték:**
  - 1 hónap, tanulós súgóval, egyedül vagy együtt;
  - egyedül 10 perc alatt végigjátszható.
- **Tesztalkalom:** a host egy alkalomra beállítja a távot:
  - 12 hónap havi lépésben;
  - vagy X év (1-10) negyedéves vagy éves lépésben;
  - a cél egy 45-90 perces alkalom.
- **Játékvezetői eszközök:**
  - szünet;
  - fordulóidő;
  - kör átugrása vagy gyorsítása;
  - egy kártya kézi kiosztása demonstrációhoz.
- **Teszt-visszajelzés:**
  - a végén 3-5 kérdéses értékelés (mit tanultál, mi volt unalmas, mi volt nehéz);
  - a host egyetlen anonim JSON- vagy CSV-fájlba exportálja a játéknaplót és a válaszokat;
  - ebből hangoljuk az egyensúlyt.

### Játékmenet
- **Lobby:**
  1. A host nyitja a szobát.
  2. A játékosok csatlakoznak.
  3. Mindenki kitölti a rövid kvízt: ennek alapján a játék javasol egy kezdőprofilt, de másikat is lehet választani.
  4. Mindenki rögzíti a saját célját.
  5. A host beállítja az időtávot.
- **Tábla:**
  - A tábla a fenti városi útvonal.
  - Mezőtípusok: Fizetésnap, Csapda (csalafinta ajánlat), Hivatal (Közlöny-változás), Döntés (kék), Befektetés (zöld), Sorsfordító (piros), Tudás (sárga), Piaci hír (valós adat), **Találkozás** (interakciós kártya egy másik játékossal) és **Feltöltődés** (jóllét-befektetés: idő vagy pénz az életerőre, az egészségre, az egyensúlyra).
- **Egyidejű fordulók:**
  1. A forduló közös Sorsfordító kártyával indul, mindenki ugyanazt húzza.
  2. Ezután mindenki a saját telefonján dob, lép, dönt, és vásárol.
  3. Az interakciós ajánlatot a másik fél a saját telefonján fogadja el vagy utasítja el.
  4. A forduló akkor zárul, ha mindenki "kész". Fordulóidőt a host állíthat be.
- **Telefonnézet:**
  - Felül a közös tábla az összes bábuval.
  - Alul a saját Pénzügyi Lap a három indexszel.
  - Kártyaflip animáció és 3D dobókocka.
  - "Asztal" fül a ranglistával: mindhárom index látszik, nem csak a pénz.
- **Opcionális közös kijelző:** `/sorsfordito/asztal/tabla?szoba=ABCD`, csak nézetként.
- **Vége:**
  - Mindenki megkapja a saját Epilógus kártyáját és Riportkártyáját: pénzügyi és jólléti mérleg.
  - Reflexiós kérdések.
  - Csoportösszesítő: nemcsak a leggazdagabb kerül kiemelésre, hanem a legkiegyensúlyozottabb és a legjobb társ is.
- **Létszám:** 2-10 fő. Az Együttműködő ("Háztartás") mód későbbi fázis.

### Arculat és szabálycsomag - előkészítés a Milion-együttműködéshez
- **Téma (theme):**
  - A színek, betűtípusok, logó, táblakeret és a mutatók feliratai egy témafájlból jönnek (`src/themes/`).
  - Alapértelmezett téma: `sorsfordito`.
  - A `milion` téma csak váz (helykitöltő színek és feliratok, például "RFA"), Milion-logó és -grafika nélkül, amíg nincs engedély.
- **Szabálycsomag (ruleset):**
  - A mezőkiosztás, a paklik, a könyvelési rovatok, a győzelmi feltételek és a fizetésemelési szabályok egy csomagleíróból jönnek (`src/rulesets/`).
  - `sorsfordito-alap`: élesítve.
  - `milion-szemlelet`: kikapcsolt, nem élesített ág. Tartalmazza az adomány és mentordíj rovatot, a "fizetés +10%, ha képzettség 5 és harmónia + vitalitás ≥ 8" szabályt, a jelölők Milion-feliratait (harmónia, vitalitás, közösség), valamint a biztonsági kör → függetlenségi kör → életcél haladást.
  - A csomag a megállapodás után egy kapcsolóval aktiválható.
- **Kapcsoló:** URL- vagy buildparaméter (`?csomag=milion`), alapból tiltva az éles oldalon.

### Kódszerkezet (forrásrepó; a meglévő `src/engine`, `src/store`, `src/data` újrahasznosításával)
- `src/engine/`: a meglévő akciók tiszta `applyAction(state, action, ruleset)` függvénybe kerülnek, ezt a szóló mód és a host is használja. A buildben már megvan a `players[]` tömb és a `currentPlayerIndex`.
- `src/engine/wellbeing.ts`: a jólléti jelölők (életerő, egészség, egyensúly; a feliratok a szabálycsomagból jönnek) és az index számítása.
- `src/engine/deck.ts`: húzózsák, késleltetett következmények.
- `netlify/functions/turn-credentials.ts` (a nexai-hu repóban).
- `src/app/asztal/teszt/`: próbajáték, tesztalkalom, visszajelzés és export.
- `src/engine/indices.ts`: a három index.
- `src/engine/table.ts`: a szoba állapota.
- `src/data/interactions.ts`: az interakciós kártyák.
- `src/net/`: `transport.ts`, `protocol.ts` (típusos, verziózott), `host.ts`, `client.ts`.
- `src/themes/`, `src/rulesets/`, `src/data/board.ts`.
- `src/ui/board/`: `BoardTrack` (SVG, témázható), `Pawn`, `Die`, `CardFlip`, `PlayerStrip`, `IndexGauge`.
- `src/app/asztal/`: lobby, kvíz, játék és eredmény; a kezdőképernyőn új gomb: "Asztali játék társasággal".
- `CLAUDE.md`: új tartalmi szabályok (semlegesség, jóllét-hatás minden döntésnél, a Milion-elemek csak a csomagban).

## Ellenőrzés
- **Vitest:**
  - `applyAction` determinisztikus (seedelt véletlen);
  - a három index számítása;
  - a kizsákmányoló interakció jólléti költsége;
  - a forduló zárása;
  - a protokoll kódolása és dekódolása;
  - újracsatlakozás;
  - csomagváltáskor a mezők és a szabályok cserélődnek.
- **Playwright (előtelepített Chromium):** 1 host és 5 kliens mobil viewporttal (390×844). Egy teljes Sprint-játék végigfut, legalább egy interakcióval, majd képernyőkép készül a tábláról, a ranglistáról és az eredményekről.
- `next build` hibátlan, TypeScript strict módban. A kimenetet `npx serve`-vel az alútvonalon is ellenőrizzük (manifest, service worker scope, CSP).
- A push után a Netlify deploy preview-ban valódi telefonokon próbáljuk ki: egy asztalnál, egy wifin, illetve távolról, mobilnet és otthoni wifi között. Ezt a részt neked kell elvégezned.
- **Tartalmi tesztek:**
  - minden csapdán van kivédési út;
  - ugyanaz a kártya nem ismétlődik, amíg a pakli el nem fogy;
  - a jelölőfeliratok a szabálycsomagból jönnek.

## Kockázatok
- A heti adatfrissítés ingyenes, nyilvános forrásokra épül, és ezek formátuma változhat. Minden forráshoz fallback érték és hibajelzés tartozik a PR-ben.
- A heti rutin a Gmail-kapcsolatot használja. Ha a rutinnál a kapcsoló nincs bekapcsolva, a Közlöny-kártyák kimaradnak, a rutin ezt jelzi a PR-ben, a többi adat ettől frissül.
- Távoli játékhoz TURN kell. Az ingyenes keret 10 fős szöveges játékra várhatóan bőven elég (kis adatforgalom), ezt a megvalósításkor ellenőrzöm.
- A PeerJS nyilvános broker külső függőség: ha leáll, nincs szobanyitás. Ez a transport-réteg mögött cserélhető.
- A jóllét-hatások kalibrálása tesztjátékot igényel, mert az első értékek becslések lesznek.
