# PÉNZÜGYI SORSFORDÍTÓ

**Game Design Document v1.0**

*Pénzügyi tudatossági kártyajáték*

1–6 fő  |  30–60 perc  |  16+ év

2026\. március

*Ez a dokumentum a játék teljes mechanikáját, kártyarendszerét, narratív kereteit és prototípus-specifikációját tartalmazza. A játék a jelenlegi magyarországi pénzügyi valóságra épül, valós adatokkal.*

---

## 1. Koncepció és vízió

### 1.1 Egyedi értékajánlat (USP)

A Pénzügyi Sorsfordító az első magyar nyelvű, kompakt kártyajáték, amely a kalandjáték-hagyomány (elágazó döntésfa) és a pénzügyi szimuláció (egyenlegkövetés, befektetési pontozás) ötvözése – a jelenlegi magyar gazdasági valóságra (2025–2026) építve. A játék nem pénzügyi tanácsadás, de valós tudást közvetít a PMÁP-tól a TBSZ-en át a diákhitelig.

### 1.2 Alappillérek

- **Elágazó történet:** minden döntésnek következménye van, nincs «jó» vagy «rossz» út – csak trade-off-ok.
- **Numerikus rendszer:** a játékos végig látja az egyenlegét, bevételét, kiadásait és passzív jövedelmét egy személyes Pénzügyi Lapon.
- **Befektetési pontozás:** 6 szempont (Hozam, Likviditás, Biztonság, Infláció állóság, Megtérülési sebesség, Piaci hozzáférhetőség) minden befektetési kártyán.
- **Időnyomás:** hónapról hónapra halad az idő – a játékos választja a távot (rövid: 1 év / közép: 5 év / hosszú: 10 év).
- **Kés a csontig, de szelíden:** a játék végén őszinte, humoros, de empatikus értékelés.

### 1.3 Magyar piaci valóság – a játék adatbázisa

A játék összes számadata valós, 2025–2026-os KSH-, MNB- és piaci forrásokon alapul:

| Mutató | Érték | Forrás |
|---|---|---|
| Bruttó átlagkereset (2025.dec.) | 789 200 Ft/hó | KSH 2026.02.20. |
| Nettó átlagkereset (2025.dec.) | 548 700 Ft/hó (kedv.-kel) | KSH |
| Nettó mediánkereset (2025.dec.) | 427 500 Ft/hó | KSH |
| Minimálbér 2026 (bruttó) | 322 800 Ft/hó | Korm. rendelet |
| Garantált bérminimum 2026 | 373 200 Ft/hó | Korm. rendelet |
| Bp. átlagos albérlet 2026 | 250–280 000 Ft/hó | KSH-ingatlan.com |
| Vidéki albérlet átlag | 100–180 000 Ft/hó | KSH-ingatlan.com |
| Infláció (2025 dec. éves) | 3,8% | KSH |
| PMÁP hozam (2025) | ~6–7% (inflációkövető) | ÁKK |
| Diákhitel 2 kamat | 0% (tanulmányok alatt) | Diákhitel Központ |

---

## 2. Játékosok és karakter-presetek

### 2.1 Játékosszám és módok

| Mód | Játékosok | Időtartam | Leírás |
|---|---|---|---|
| Szóló kaland | 1 fő | 30–45 perc | Gamebook-élmény: a játékos egyedül halad a döntésfán, saját Pénzügyi Lappal. |
| Verseny | 2–6 fő | 45–60 perc | Mindenki párhuzamosan halad; azonos Sorsfordító kártyákat húznak, de eltérő döntéseket hozhatnak. |
| Együttműködő | 2–4 fő | 45–60 perc | «Háztartás-mód»: közös Pénzügyi Lap, közös döntések, vitázzatok! |

### 2.2 A három karakter-preset

A játékos az alábbi három kiindulópont közül választ. Mindegyik más pénzügyi tudatossági kihívást modellez:

#### «A» – Zsófi, 18 éves – Érettségi utáni útelágazás

| Paraméter | Érték |
|---|---|
| Kor | 18 év |
| Megtakarítás | 120 000 Ft (diákmunkából) |
| Havi jövedelem | 0 Ft (egyelőre) |
| Havi kiadás | 0 Ft (szülőknél lakik) |
| Adósság | 0 Ft |
| Döntési helyzet | Egyetem (diákhitel?) / Szakma / Munka / Gap year? |

*Zsófi a «clean slate»: nulla adósság, nulla jövedelem. A játékos első döntése a pályaválasztás, ami az egész játék hozam- és kockázati görbéjét meghatározza.*

#### «B» – Dani, 24 éves – Első fizetés, albérlet, diákhitel

| Paraméter | Érték |
|---|---|
| Kor | 24 év |
| Megtakarítás | 85 000 Ft |
| Havi nettó jövedelem | 320 000 Ft (junior pozíció) |
| Havi kiadás | 285 000 Ft (albérlet 180e + rezsi 35e + kaja 50e + közl. 20e) |
| Adósság | Diákhitel 2: 3 200 000 Ft (törlesztés hamarosan indul) |
| Döntési helyzet | Hogyan osztja be az első «szabad» pénzét? Spórol, befektet, élvezi? |

*Dani a «tipikus pályakezdő»: pozitív cashflow-ja minimális (35e Ft/hó), de a diákhitel-törlesztés beindulása hamarosan csökkenti. A játék fő kérdése: hogyan csinál ebből valamit?*

#### «C» – Petra, 30 éves – Váratlan örökség, nehéz döntés

| Paraméter | Érték |
|---|---|
| Kor | 30 év |
| Megtakarítás | 650 000 Ft |
| Havi nettó jövedelem | 420 000 Ft (közepes pozíció) |
| Havi kiadás | 370 000 Ft (bp. albérlet 220e + rezsi 40e + élet 110e) |
| Adósság | Személyi kölcsön: 1 800 000 Ft (havi 42 000 Ft törlesztés) |
| Különleges elem | Váratlan örökség: 5 000 000 Ft + egy vidéki telek (ért.: ~8M Ft) |
| Döntési helyzet | Mit kezd az 5M-mal? Adósságtörlesztés? Befektetés? Lakás-önerő? Vállalkozás? |

*Petra a «kritikus tömeg»: van miből dönteni, de rossz döntéssel könnyen elpazarolhatja. A telek külön döntési ág (eladni vs. fejleszteni vs. megtartani).*

---

## 3. Kártyarendszer – a játék szíve

A játék 5 kártyatípusból áll, összesen 120–150 kártya. Minden kártyatípusnak saját hátoldal-színe van.

### 3.1 Kártyatípusok áttekintése

| Típus | Szín | Darab | Funkció |
|---|---|---|---|
| DÖNTÉS | Kék | 30–40 | Elágazó történet-kártyák: helyzet + 2–3 választási lehetőség |
| BEFEKTETÉS | Zöld | 24 | Megvásárolható eszközök (a 6 szempont pontozásával) |
| SORSFORDÍTÓ | Piros | 30–40 | Váratlan események: pozitív és negatív élethelyzetek |
| TUDÁS | Sárga | 18 | Tanulási lehetőségek, amelyek tartós bónuszt adnak |
| EPILÓGUS | Lila | 12 | Végállapot-kártyák: a játék végi értékelés és jövőkép |

### 3.2 DÖNTÉS kártyák (kék) – a narratív gerinc

Minden Döntés kártya egy szituációt ír le, amelyben a játékosnak 2–3 opció közül kell választania. Az opciók számértékű következményekkel járnak (egyenleg, bevétel, kiadás változás) ÉS narratív elágazást okoznak (más Döntés kártyára irányítanak).

#### Példa Döntés kártya – «D-07: Albérlet vagy maradás?»

| Elem | Tartalom |
|---|---|
| **Helyzet** | Megkaptad az első állásodat! Nettó 320 000 Ft/hó. A szüleid szívesen látnak otthon, de a munkahely Budapesten van, Te pedig Kecskeméten laksz. |
| **A) Kiköltözöl** | Albérlet: –180 000 Ft/hó kiadás. Rezsi: –35 000 Ft/hó. Kaució: –360 000 Ft (egyszeri). DE: – ingázás idő, +önállóság, +networking. → Húzz D-12-t. |
| **B) Otthon maradsz** | Kiadás: –40 000 Ft/hó (háztartásba beteszel). Ingázás: –45 000 Ft/hó + napi 3 óra vonat. Megtakarítás: +95 000 Ft/hó az albérlethez képest. → Húzz D-14-t. |
| **C) Lakótársat keresel** | Megosztott albérlet: –110 000 Ft/hó. Rezsi megosztva: –20 000 Ft/hó. Kompromisszum: kevesebb privát tér. → Húzz D-13-t. |

### 3.3 BEFEKTETÉS kártyák (zöld) – az eszköztár

24 kártya, 6 kategóriában (Értékpapír, Pénz, Ingatlan, Vállalkozás, Tárgy, Tudás), mindegyik a 6 szempontos pontozással – a valós magyar piacra kalibrálva. A játékos a Döntés kártyák során «nyit» befektetési lehetőségeket, amelyeket megvásárolhat (egyenlegből), és amelyek passzív jövedelmet vagy jövőbeli hozamot generálnak.

#### Példa Befektetés kártyák (válogatás)

| Kártya | Kategória | Belépési ár | Havi passzív jöv. | Hozam | Likv. | Bizt. | Infl.á. | Megt. | Hozzáf. |
|---|---|---|---|---|---|---|---|---|---|
| Magyar Állampapír Plusz (PMÁP) | Értékpapír | 100 000 Ft | ~580 Ft/hó* | 40 | 70 | 90 | 70 | 60 | 90 |
| TBSZ + ETF portfólió | Értékpapír | 200 000 Ft | ~1200 Ft/hó* | 65 | 80 | 50 | 60 | 45 | 65 |
| Bankbetét (lekötött, 1 év) | Pénz | 50 000 Ft | ~290 Ft/hó | 25 | 45 | 85 | 20 | 60 | 95 |
| Kriptovaluta (BTC/ETH) | Pénz | 50 000 Ft | 0 (spekulatív) | 85 | 75 | 10 | 45 | 60 | 70 |
| Garázs (kiadásra) | Ingatlan | 4 000 000 Ft | 25 000 Ft/hó | 50 | 50 | 65 | 55 | 35 | 65 |
| Online vállalkozás | Vállalkozás | 300 000 Ft | változó | 75 | 30 | 25 | 60 | 55 | 80 |
| Arany (befektetési) | Tárgy | 200 000 Ft | 0 (értékmegőrző) | 40 | 65 | 70 | 85 | 25 | 60 |
| Szakmai képzés / OKJ | Tudás | 150 000 Ft | +30 000 Ft/hó bér | 60 | 5 | 75 | 65 | 55 | 75 |

*\*A havi passzív jövedelem a játékban egyszerűsített: éves hozam / 12. A valós hozamok a kártya hátoldalán szerepelnek részletesen.*

### 3.4 SORSFORDÍTÓ kártyák (piros) – az élet közbeszól

Minden kör végén (= minden «hónap») a játékos húz egy Sorsfordító kártyát. Ezek a valós magyar élet meglepetései – pozitívak és negatívak egyaránt:

#### Példák Sorsfordító kártyákra

| Kártya neve | Hatás | Típus |
|---|---|---|
| Rezsicsökkentés vége | Gázszámla +15 000 Ft/hó (piaci ár feletti fogyasztás) | Negatív |
| Adó-visszatérítés | NAV visszautal 87 000 Ft-ot. Jól adtad be a bevallást! | Pozitív |
| Autó műszaki vizsga | Váratlan kiadás: –120 000 Ft (fékcsere + vizsga) | Negatív |
| Fizetésemelés! | Havi nettó jövedelem +35 000 Ft. Jó munkát végeztél! | Pozitív |
| Infláció-sokk | Élelmiszerárak +8%. Havi kajapénz +12 000 Ft. | Negatív |
| Freelance megbízás | Egyszeri bevétel: +180 000 Ft (hétvégi projekt) | Pozitív |
| Lakbéremelés | Az albérleted drágul: +20 000 Ft/hó (szerződésmegújítás) | Negatív |
| SZÉP-kártya bónusz | Munkaadód 20 000 Ft-ot utalt a SZÉP-kártyádra. | Pozitív |
| Diákhitel-törlesztés indul | Havi kiadás +30 000 Ft (DH2 törlesztés) | Negatív |
| Bitcoin +40% | A kriptód felértékelődött! Eladod? → Ha igen: nyereség. Ha nem: kockázat. | Döntéses |
| Betegség | 2 hét táppénz: jövedelem –70% erre a hónapra. | Negatív |
| Barát kölcsönkér | 150 000 Ft-ot kér kölcsön. Adsz? → Döntés: kapcsolat vs. pénz. | Döntéses |

### 3.5 TUDÁS kártyák (sárga)

A Tudás kártyák tartós bónuszt adnak: ha a játékos «megszerzi» (befizeti az árát), akkor a játék végéig élvezi az előnyét. Ezek a magyar pénzügyi rendszer valós ismereteit tanítják:

| Kártya | Ár | Tartós hatás | Valós tudás |
|---|---|---|---|
| Adóoptimalizálás 101 | 80 000 Ft | Éves adó-visszaigénylés: +45 000 Ft/év | Családi adókedvezmény, 25 év alatti SZJA-mentesség |
| TBSZ titkai | 0 Ft (online) | Befektetési hozam adómentes 5 év után | Tartós Befektetési Számla működése |
| Első lakás program | 50 000 Ft | CSOK/Otthonteremtési kedvezmény elérhető | Falusi CSOK, kamattámogatott hitelek |
| Vállalkozás alapok | 120 000 Ft | Online vállalkozás nyitható | KATA/átalányadó, egyéni vállalkozás indítása |
| Tőzsdei alapismeret | 60 000 Ft | ETF és részvény befektetés elérhető | BÉT, TBSZ, brókerszámla-nyitás |
| Biztosítás-tudatosság | 0 Ft (PÉNZ7) | Váratlan események költsége –50% | Lakás-, élet-, CASCO biztosítás alapjai |

### 3.6 EPILÓGUS kártyák (lila) – a mérleg

A játék végén a játékos összesíti a Pénzügyi Lapját, és annak alapján kap egy Epilógus kártyát. Ezek a «kés a csontig, de szelíden» értékelések – humorosan, de őszintén:

| Epilógus | Feltétel | Szöveg (kivonat) |
|---|---|---|
| A Pénzügyi Ninja | Passzív jöv. > kiadás | Gratulálunk! A pénz neked dolgozik. Most már te döntöd el, reggel felkelsz-e. (De azért kelj fel.) |
| Az Okos Mókus | Nettó vagyon > 5M, de aktív jöv. > passzív | Szorgalmasan gyűjtögetsz, és okosan. Még nem vagy szabad, de az úton vagy. A mókuskerékben legalább te választod a sebességet. |
| A Túlélő | Egyenleg > 0, de nincs befektetés | Túlélted a hónapot (és a játékot). De a pénzed a párnád alatt van, az infláció meg a szekrényed tetején ül és vigyorog. |
| A Hitelcsapda Lovagja | Adósság > nettó vagyon | Houston, van egy kis probléma. Az adósságod nőtt, a vagyonod nem. De nem vagy egyedül – Magyarország fele ezt csinálja. Ideje megfordítani! |
| Az YOLO Bajnok | Egyenleg < 0 | Minden pénzt elköltöttél, cserébe van élményed. Sajnos az élmény nem fizeti a rezsit. De holnap új nap, és most már tudod, mit NE csinálj. |
| A Bölcs Bagoly | Vagyon közepes, de 4+ Tudás kártya | Nem vagy a leggazdagabb a szobában, de te vagy a legokosabb. A tudás kamatos kamattal fizet vissza – csak lassabban, mint szeretnéd. |

---

## 4. Játékmechanika

### 4.1 A Pénzügyi Lap – a játékos «dashboardja»

Minden játékos kap egy Pénzügyi Lapot (kinyomtatható A5-ös kártya ceruzával kitöltendő, vagy a web appban automatikusan frissül). Ez a Cashflow 101 «financial statement»-jének egyszerűsített, magyar verziója.

| BEVÉTEL rovatai | KIADÁS rovatai |
|---|---|
| Havi nettó jövedelem (munka) | Lakhatás (albérlet/törlesztő) |
| Passzív jövedelem (befektetésekből) | Rezsi (víz, gáz, áram, net) |
| Alkalmi bevétel (Sorsfordítókból) | Élelmiszer |
| | Közlekedés |
| | Hiteltörlesztés |
| | Egyéb (telefon, szórakozás, ruha) |

#### Alapképlet

**Szabad cashflow = Havi bevétel – Havi kiadás**

**Nettó vagyon = Megtakarítás + Befektetések értéke – Adósság**

**Pénzügyi szabadság = Passzív jövedelem ≥ Havi kiadás**

### 4.2 Időrendszer – flexibilis táv

| Mód | Időtáv | Körök száma | Léptékek | Jellemzés |
|---|---|---|---|---|
| Sprint | 1 év | 12 kör | havi | Gyors, intenzív, taktikai. Mennyi pénzt tudsz összeszedni 12 hónap alatt? |
| Maraton | 5 év | 20 kör | negyedéves | Stratégiai. Befektetések elkezdik kitermelni magukat. Élethelyzetek változnak. |
| Ultra | 10 év | 10 kör | éves | Nagystratégia. Kamatos kamat, ingatlanérték-növekedés, karrierváltás. |

Minden kör struktúrája azonos:

1. Bevétel beérkezik (jövedelem + passzív).
2. Kiadások levonása.
3. Döntés kártya húzása – szituáció, választás.
4. Opcionális: Befektetés vagy Tudás kártya vásárlása.
5. Sorsfordító kártya húzása – az élet közbeszól.
6. Pénzügyi Lap frissítése.

### 4.3 Győzelmi feltétel – háromszintű

| Szint | Feltétel | Jutalom |
|---|---|---|
| Bronz: Túlélés | Egyenleg > 0 a játék végén | Epilógus kártya + Pénzügyi Riportkártya |
| Ezüst: Stabilitás | Nettó vagyon > induló vagyon × 2 | Epilógus + Riportkártya + «Tanács a jövőből» szöveg |
| Arany: Szabadság | Passzív jövedelem ≥ Havi kiadás | Epilógus + Riportkártya + «Pénzügyi Ninja» cím |

### 4.4 Pénzügyi Riportkártya

A játék végén minden játékos kap egy vizualizált mérleget – a web appban automatikus infografika, a fizikai játékban a Pénzügyi Lap összesítése:

- Nettó vagyon grafikon (induló vs. végső)
- Bevétel–kiadás arány (hányadát költöd el a jövedelmednek?)
- Diverzifikáció score (hány különböző befektetésed van?)
- Tudás score (hány Tudás kártyát szereztél meg?)
- Kockázati profil (mennyire agresszívan fektettél be?)
- Az «Összesített Pénzügyi IQ»: 0–100 pont, amely az összes fenti szempont súlyozott átlaga.

---

## 5. Narratív tervezés – a döntésfa

### 5.1 A döntésfa struktúrája

A játék nem lineáris, hanem «rhizóma»-szerű: a Döntés kártyák hálózatot alkotnak, ahol bizonyos útvonalak találkoznak, mások végleg szétválnak. Ez biztosítja az újrajátszhatóságot.

#### Döntésfa fő ágai (karakter-preset szerint)

| Preset | Fő döntési ágak | Végállapot-lehetőségek |
|---|---|---|
| Zsófi (18) | Egyetem → Diákhitel → Gyakornok / Szakma → Azonnali munka → Megtakarítás / Gap year → Külföldi tapasztalat → Visszatérés | 6–8 lehetséges végállapot |
| Dani (24) | Spórolás → Befektetés → Lakás-önerő / Karrierváltás → Magasabb fizetés / Vállalkozás → Kockázat vs. biztonság | 6–8 lehetséges végállapot |
| Petra (30) | Örökség befektetése → Ingatlan / Adósságtörlesztés → Szabadság / Vállalkozás indítása → Siker vs. kudarc / Telek fejlesztése → Hosszú táv | 6–8 lehetséges végállapot |

### 5.2 A hangvétel – «Kés a csontig, de szelíden»

A játék szövegei a következő elveket követik:

- **Őszinteség:** nem szépítjük a pénzügyi hibák következményeit. Ha valaki az egész fizetését elveri, azt a játék is megmutatja.
- **Empátia:** nem szégyen hibázni. A Sorsfordító kártyák emlékeztetnek, hogy a pénzügyi helyzet nem mindig a saját döntéseink eredménye.
- **Humor:** a szövegek tartalmaznak finom humort, öniróniát. Pl.: «Gratulálunk, sikeresen befektettél kriptóba. Most várj 3 évet, vagy pánikban eladod holnap. (Spoiler: valószínűleg holnap eladod.)»
- **Konkrétság:** nem «fektess be okosan», hanem «nyiss TBSZ-számlát, vegyél PMÁP-ot, és ne nyúlj hozzá 5 évig».

---

## 6. Fizikai prototípus-specifikáció

### 6.1 Komponenslista

| Komponens | Mennyiség | Méret | Megjegyzés |
|---|---|---|---|
| Döntés kártyák (kék) | 36 db | 63×88 mm (standard) | Kétoldalas: elöl szituáció, hátul opciók hatásai |
| Befektetés kártyák (zöld) | 24 db | 63×88 mm | Elöl: kép + alap infó. Hátul: 6 szempont radar + valós tudás |
| Sorsfordító kártyák (piros) | 36 db | 63×88 mm | Egyoldalas szituáció + azonnali hatás |
| Tudás kártyák (sárga) | 18 db | 63×88 mm | Elöl: képzés neve + ár. Hátul: tartós hatás + valós tipp |
| Epilógus kártyák (lila) | 12 db | 63×88 mm | Végállapot-leírás + jövőkép + tanulság |
| Pénzügyi Lap (kitölthető) | 6 db + 20 pótlap | A5 | Ceruzával kitölthető, laminált alappal |
| Játékpénz (papír tokenek) | 120 db | 30 mm kör | 10e/50e/100e/500e címletekben |
| Szabályfüzet | 1 db | A5, 12 oldal | Szabályok + gyors referencia + QR-kód web appra |
| Doboz | 1 db | 150×100×40 mm | Kompakt, hordozható – zsebméret |

### 6.2 Kártyaelrendezés – Befektetés kártya layout

Minden Befektetés kártya egységes layouttal rendelkezik:

- Felső sáv: kategória szín + ikon (Értékpapír/Pénz/Ingatlan/Vállalkozás/Tárgy/Tudás)
- Középső blokk: kártya neve + illusztráció
- Alsó sáv: belépési ár + havi passzív jövedelem
- Hátoldal: 6 szempont pontozás radar-diagramon + 2–3 mondatos «valós tudás» blokk

### 6.3 Gyártási szint

| Szint | Becsült költség (100 pld.) | Jellemzők |
|---|---|---|
| Print & Play (DIY) | ~3 000 Ft/pld. | PDF letöltés, otthoni nyomtatás, kartonra vágás |
| Prototípus (MPC/DriveThru) | ~8 000 Ft/pld. | Online print-on-demand, profi kártyaminőség |
| Kis széria (hazai nyomda) | ~5 000 Ft/pld. (500+ pld.) | 330g karton, matt laminálás, dobozzal |
| Kereskedelmi (Cartamundi) | ~2 500 Ft/pld. (3000+ pld.) | Linen finish, tuck box, shrink wrap |

---

## 7. Webalkalmazás-specifikáció

### 7.1 Technológia

| Réteg | Technológia | Megjegyzés |
|---|---|---|
| Frontend | React + Tailwind CSS | SPA, mobile-first, offline-képes (PWA) |
| State management | useReducer / Zustand | Pénzügyi Lap mint központi state |
| Adatbázis | localStorage + opcionális Supabase | Játékmentés, leaderboard |
| Vizualizáció | Recharts / D3.js | Pénzügyi Riportkártya radar-diagram, vonalgrafikon |
| Kártyamotor | Egyedi JSON döntésfa | Kártyák mint JSON objektumok, elágazások referenciákkal |

### 7.2 Felhasználói élmény (UX) folyamat

1. Kezdőképernyő: játéknév + «Kezdd el az utad!»
2. Karakter-választás: Zsófi / Dani / Petra kártya megjelenik, pöccintéssel váltható.
3. Időtáv-választás: Sprint (1 év) / Maraton (5 év) / Ultra (10 év).
4. Játék: Döntés kártya → választás → Pénzügyi Lap frissül → Sorsfordító → következő kör.
5. Befektetés bolt: bármikor elérhető, a feloldott befektetések listájával.
6. Végeredmény: animált Pénzügyi Riportkártya + Epilógus szöveg + megosztás gomb.

### 7.3 Fizikai–digitális híd

A fizikai kártyákon QR-kód található, amely:

- Megnyitja a web appot az adott kártya részletes magyarázatával.
- A Befektetés kártyáknál linkeli az adott eszköz valós magyar forrását (pl. ÁKK, BÉT, MNB).
- Az Epilógus kártyáknál megnyitja a Pénzügyi Riportkártya generátort, ahol a játékos beírhatja a végső számait.

---

## 8. Ütemterv és következő lépések

| Fázis | Időszak | Kimenet |
|---|---|---|
| 1. GDD véglegesítés | 2026 Q1 | Ez a dokumentum + visszajelzések feldolgozása |
| 2. Kártya-tartalom írás | 2026 Q2 | Teljes 120–150 kártya szöveg + döntésfa véglegesítés |
| 3. Illusztráció + design | 2026 Q2–Q3 | Kártya layout, illusztrációk, Pénzügyi Lap design |
| 4. Print & Play prototípus | 2026 Q3 | PDF letöltés, tesztelés 20–30 fős csoporttal |
| 5. Web app MVP | 2026 Q3 | Szóló mód, 1 karakter, Sprint időtáv |
| 6. Playtesting + iteráció | 2026 Q3–Q4 | Egyensúly-tesztelés, szövegfinomítás, UX javítás |
| 7. Fizikai kis széria | 2026 Q4 | 500 pld. hazai nyomda, PÉNZ7-kompatibilis |
| 8. Web app teljes verzió | 2027 Q1 | Mind 3 karakter, mind 3 időtáv, multiplayer |

### 8.1 Azonnali következő lépés

A GDD jóváhagyása után az első konkrét feladat a teljes döntésfa megírása – karakterenként 30–40 Döntés kártya szövegével, hatásaival és elágazásaival. Ez a játék gerince, és a fizikai prototípus és a web app is ebből építkezik.

---

*──── DOKUMENTUM VÉGE ────*

*Pénzügyi Sorsfordító © 2026 – Game Design Document v1.0*
