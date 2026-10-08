# Pénzügyi Sorsfordító — Projekt Memória (CLAUDE.md)

> Ez a fájl a projekt kontextusát őrzi session-ök között. Claude Code minden session elején automatikusan olvassa.

## Projekt áttekintés

**Név:** Pénzügyi Sorsfordító
**Típus:** Magyar pénzügyi tudatossági szimulációs játék
**GDD:** v1.0 (2026. március) — `docs/Penzugyi_Sorsfordito_GDD_v1.md`
**Fejlesztési terv (2026-10):** `docs/fejlesztesi-terv-2026-10.md` — többjátékos online táblajáték, heti élő adatok, csapdakártyák, jólléti index
**Repo:** `ekutato/Sorsfordito` (GitHub). Deploy: a `out/` tartalma a `ekutato/nexai-hu` repó `sorsfordito/` mappájába kerül, a Netlify élesít. Fejlesztés: csomagonként új PR a nexai-hu-ba (előnézettel, a felhasználó hagyja jóvá); a heti adatfrissítés a `main` ágakon közvetlenül élesít.
**Platform:** Mobile-first PWA (böngészőben, installálható)

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **State:** Zustand + persist middleware (localStorage)
- **UI:** Tailwind CSS + Framer Motion
- **Típusok:** TypeScript strict
- **Grafikonok:** Recharts
- **PWA:** next-pwa (Workbox service worker)
- **Futtatás:** Windows — `C:\PROGRA~1\nodejs\npm.cmd run dev`

### Karakter-presetek (3 élethelyzet)
| ID | Név | Leírás |
|----|-----|--------|
| `fresh_start` | Zsófi, 18 | Érettségi utáni útelágazás, 0 Ft jövedelem, 80K megtakarítás (nyári diákmunka) |
| `career_start` | Dani, 24 | Pályakezdő junior fejlesztő, 320K nettó, 220K megtakarítás, a szüleinél indul Kecskeméten (a lakhatás a `dani-d01` döntésből jön, a budapesti albérlet a heti `rent_bp` adatból); DH2 opcionális |
| `inheritance` | Petra, 30 | Váratlan örökség (5M Ft + telek), 420K nettó, 1.8M személyi kölcsön |

### Játékmódok
| Mód | Körök | Lépték | Infláció |
|-----|-------|--------|----------|
| Sprint | 12 | havi | nem |
| Maraton | 20 | negyedéves | igen |
| Ultra | 20 | féléves | igen |

---

## Mérföldkövek — Állapot

| MK | Név | Állapot | Részletek |
|----|-----|---------|-----------|
| M0 | Alapozás | ✅ KÉSZ | Repo, TypeScript típusok, freemium store, CI/CD |
| M1 | Adatmotor | ✅ KÉSZ | API-k + PreGameContext bekötve a játékba (StartScreen async fetch, DecisionView/FateEventView valós adatok, GameScreen banner) |
| M2 | Játékmotor | ⚠️ 75% | 3 karakter döntésfája kész, értékelő motor részleges |
| M3 | Frontend | ⚠️ 85% | Fő képernyők kész, hírfolyam nézet hiányzik |
| M4 | Tesztelés | ⚠️ 10% | Vitest elindult (`npm test`): jólléti index, szabálycsomag, élő adatcsomag |
| M5 | Bővítés | ⚠️ 50% | 3 karakter + Maraton/Ultra kész; asztali többjátékos mód (lobby, közös körzárás, ranglista) első változat |
| M6 | Launch | ❌ 0% | Nem kezdődött |

Részletek: `.claude/milestones/M0.md` – `M6.md`

### Gantt-diagram
```
Hét:  1    2    3    4    5    6    7    8-12
      ─────────────────────────────────────────
M0:   ████
M1:        ████████████
M2:        ████████████████
M3:                  ████████████
M4:                            ████████
M5:                                 ████████████████
M6:                                          ████████
```

---

## Standing Instructions

1. **Adatellenőrzés:** "Fontos, hogy minden adatot a felhasználás előtt ellenőrizz online. Ha nem jutsz friss adathoz, kérj meg engem minden esetben, hogy mi legyen."
2. **Nyelv:** A játék szövegei MAGYAR nyelvűek, a kód kommentek (inline) lehetnek angol/magyar mix, de a TypeScript típusnevek angolok.
3. **Átadás:** minden feltöltés után egyetlen üzenetben: mi változott, a verzió (commit), az előnézet linkje ÉS a teszt-APK állapota + közvetlen letöltési linkje (https://github.com/ekutato/Sorsfordito/releases/download/teszt-apk/sorsfordito-teszt.apk). Az APK-ra ne kelljen külön rákérdezni: ha még épül, ezt írd, és amikor elkészül, szólj magadtól.
4. **Freemium:** Ingyenes = 1 karakter (Dani) + Sprint. Prémium = mind 3 preset + Maraton/Ultra + "Mi lett volna ha" + saját adat.

---

## Tartalmi szabályok (MINDIG betartandó!)

> Ezek a szabályok minden tartalomírásra vonatkoznak — döntések, kvízek, sorsfordítók, leírások.
> ⚠️ Ha új tartalom készül, SOHA NE térj el ezektől, még ha "alapértelmezett" minta is lenne kényelmesebb.

1. **Kvíz helyes válasz eloszlás:** A helyes válasz NE legyen mindig B. Az A/B/C válaszok között **egyenletesen oszoljon el** a helyes válasz (~33% mindegyik). Soha ne legyen 3+ egymást követő kérdésnél ugyanaz a helyes válasz.
2. **Válasz hosszúság:** A helyes válasz NE legyen mindig a leghosszabb opció. Legyenek rövid helyes válaszok is. A hosszúság ne legyen "tipp" a helyes válaszra.
3. **Diákhitel (DH2):** NEM alapértelmezett — a játékos a `dani-d03` döntésnél választja, hogy felvette-e. A preset-ben nincs DH2 adósság.
4. **Adatok valóssága:** Minden pénzügyi adat 2026-os magyar valóság. Ha nem biztos, ellenőrizd online. Főbb referencia értékek:
   - Minimálbér: bruttó 322 800 Ft, garantált bérminimum: 373 200 Ft
   - SZJA: 15%, TB: 18.5%, SZOCHO: 13%
   - CSOK Plusz: max 3% kamat, 1 gyerek: 15M, 2 gyerek: 30M, 3 gyerek: 50M Ft
   - Babaváró: 11M Ft, 0%, feltétel: 3 év TB jogviszony
   - GYES: 28 500 Ft/hó (nyugdíjminimum), GYED: fizetés 70%-a, max ~330k/hó
   - Kamatjövedelem: bankbetétnél 15% SZJA + 13% szocho (2023. júl. óta, összesen 28%); lakossági állampapír és 5 éves TBSZ: mentes. Forrás: docs/kutatas.md
5. **Epilógus értékelés:** Negatív nettó vagyon és rossz gazdálkodás NEM kaphat bronz szintet sem. A legalacsonyabb szint legyen „Tanulópénz" (nem fém), nem „Bronz".
6. **Glossary kiemelés:** Ha egy szó (pl. „infláció") többször előfordul egy szövegben, csak az ELSŐ előfordulásnál legyen kiemelve/klikkelhető.
7. **Többjátékos mód:** 2026-10-től fejlesztés alatt (2-10 fő, egy asztalnál és távolról is). Ld. `docs/fejlesztesi-terv-2026-10.md`.
8. **Jólléti index:** három jelölő -5..+5 skálán, belső kulcsok: `eletero`, `egeszseg`, `egyensuly` (feliratok: Életerő, Egészség, Egyensúly). A feliratok a szabálycsomagból (`src/rulesets/`) jönnek — Milion-paraméterezésnél ott cserélhetők. Hatás-célpont: `wellbeing.<kulcs>` (pont, nem Ft).
   - **Nincsenek univerzális igazságok:** életmódbeli döntés (lakhatás, együttélés, család, pályairány, szabadidő, ingázás, kockázatvállalás) jólléti hatását a játékos mérlegeli (`SUBJECTIVE_WELLBEING`, feltölt +1 / semleges 0 / megterhel -1). Fix hatás (`WELLBEING_EFFECTS`) csak megalapozott esetben: adósság/tartalékhiány → szorongás, csalás → stressz, tartós túlmunka → kimerülés.
9. **Milion-függetlenség:** a Milion-specifikus elemek (koncentrikus körök, életcélmezők, "Vacak" pakli, adomány, mentordíj) csak a kikapcsolt `milion-szemlelet` csomagban lehetnek, élesben nem aktiválhatók.
10. **Csapdakártyák:** minden csaló ajánlatnak legyen ellenőrizhető vészjele és kivédési útja; a kimenetel a játékos tudásán múljon, ne szerencsén.
11. **Semlegesség:** nincs termékajánlás, nincs pártpolitikai állásfoglalás; hírből csak saját megfogalmazás + forráslink.
   - **Márkanevek:** csak állami és intézményi név maradhat (MNB, KSH, ÁKK, NAV, BÉT/BUX, Magyar Közlöny, WebKincstár, Ügyfélkapu, SZÉP-kártya, Diákhitel Központ, OBA). Minden más általános megnevezés vagy kitalált cég: Pannon Bankcsoport Nyrt. (PBX), Duna Energia Nyrt. (DNE), Tisza Gyógyszer Nyrt. (TGY), Hármashatár Távközlés Nyrt. (HTK), Kárpát Technológia Nyrt. (KTE) - első említéskor "(kitalált cég)" jelöléssel.
12. **Élő adatok a szövegben:** időérzékeny számot (árfolyam, kamat, hozam, ár, bér, infláció) soha nem írunk be fixen - a `{{változó}}` a heti csomagból jön (`src/data/live/vars.ts`, lista: `LIVE_VAR_DEFS`). Történeti adat csak évszámmal. A `content-freshness` teszt ezt ellenőrzi. Heti frissítés: `docs/heti-rutin.md`.

---

## Architekturális Döntések

### Állapotkezelés
- **Zustand** `persist` middleware → localStorage
- `GameState` tartalmazza: config, phase, currentRound, players[], eventLog[]
- `FinancialSheet` tartalmazza: balance, income, expenses, investments[], debts[], acquiredKnowledge[], pendingStorylines[]

### Adatforrások
- **Heti élő adatcsomag:** `src/data/live/heti.json` — az egyetlen igazságforrás (érték + forrás + url + `verified`). A `src/data/live/index.ts` ebből építi a `LIVE_ECONOMIC_DATA`-t és a `livePreGameContext()`-et. A hírekhez tartozó játékhatás (`jatekEsemeny`) ember által jóváhagyott.
- `verified: false` = nem sikerült friss forrásból megerősíteni → a játékvezetőt meg kell kérdezni (1. szabály).
- `/api/data/pregame` — statikus kimenet a heti csomagból (a kliens közvetlenül importálja, nincs fetch).
- A korábbi `mnb`/`news`/`bet`/`rent` route-ok törölve (szerzői jogi kockázat, elavult fallback); az adapterek (`src/data-sources/`) a heti frissítő rutinhoz megmaradtak.
- `PreGameContext` típus: economicSummary + fateEventPool + currentData

### Döntésfa rendszer
- `DecisionCard` — Elágazó döntési kártyák (`availableAtRounds`, `nextDecisionId`)
- `FateEventEntry` — Sorsfordító események (szkriptelt + generikus + tudáspróbás + hír-generált)
- `fillFateGaps()` — Üres köröket tölt ki: minden 5. → storyline, 3. → knowledge, 2. → generic
- `getDecisionForRound()` — `.find()` logikával az első nem-teljesített döntést adja vissza

### Sorsfordító típusok
- **Szkriptelt:** Karakterenként 12 db (fresh-start, dani, inheritance sprint fájlok)
- **Generikus:** 16 db alap + 6 db tudáspróbás + storyline események
- **Hír-generált:** `PreGameContext.fateEventPool`-ból (bekötve: StartScreen → GameStore)

### Táblás mód (egyjátékos, 2026-10)
- `src/data/board.ts` — 24 mezős városi útvonal; `src/data/field-cards.ts` — csapda, kísértés, feltöltődés, találkozás, hivatal, piaci hír kártyák
- `src/store/board-actions.ts` — `rollBoard()` (kriptográfiai kocka), `continueBoard()`, `resolveFieldCard()`; állapot: `GameState.board`
- `src/ui/board/` — `BoardFull` (dobáskor nagy tábla), `BoardStrip` (sáv a kör többi részére), `DiceButton`, `FieldCardView`
- Menet: kör eleje → dobás → célmező kiemelve → (mezőkártya) → a kör megszokott fázisai

### Asztali (többjátékos) mód (2026-10)
- Mindenki a saját telefonján a saját (táblás) játékát játssza; a szobát nyitó telefon az "asztal" (host).
- `src/engine/table/state.ts` — `reduceTable` (lobby, indítás, `report` → közös körzárás, ranglista), `sanitizeReport` (a host nem bízik vakon a kliens számaiban), `publicView` (a seed nem megy ki)
- `src/net/` — PeerJS (WebRTC) a `0.peerjs.com` jelzőszerverrel + STUN; `?halo=helyi` = BroadcastChannel tesztcsatorna (több lap, internet nélkül; ilyenkor a mentés sessionStorage-ba megy)
- `src/store/table-store.ts` — szoba nyitása/csatlakozás/újracsatlakozás (munkamenet a localStorage-ban), reakciók
- `src/ui/table/` — `TableEntry`, `TableLobby` (kód, meghívólink, karakterválasztás, időtáv), `TableBar` (ki hol tart, reakciók, `Leaderboard`), `useTableSync` (saját játék indítása és jelentése)
- Szín: a játékos maga választja a lobbyban (`setColor`, foglalt szín nem választható); az indítás erre is vár. A kezdőképernyő neve az asztali belépésbe is átkerül (`src/store/player-name.ts`).
- Rangsor (`rankPlayers`): pénzügyi függetlenség %, holtversenyben biztonsági kör, majd jóllét; a vagyon csak tájékoztató. Host-kapcsoló: "Mindenki ugyanazzal a karakterrel" (`config.sameProfile`).
- Közös mezőkártya-pakli (asztal): `TableState.deckSeed` + játékosonkénti `slot`; a lap indexe `látogatás × játékosszám + slot` a közösen kevert pakliban (`cardForField` `shared` paramétere) - a pakli első körbejárásáig garantáltan különböző. Mezőkártyák: típusonként 10 (`src/data/field-cards-extra.ts`; hivatal- és csapdalapok forrással).
- Körzárás: a kör végén "Kész vagyok a fordulóval" → a következő forduló, ha minden csatlakozott játékos kész. A host szabályai (`GameConfig.rules`) mindenkire érvényesek.
- Késői csatlakozás: elindult játékba is be lehet szállni (`lateJoinRound`); a késői játékos karaktert választ (`LateJoin`), az 1. körtől a saját tempójában játszik, és amíg nem éri utol az asztali fordulót (`isCatchingUp`), nem tartja fel a körzárást. Teli szoba / befejezett játék: `NotAdmitted`. A "Szobát nyitok" mindig friss szobát kezd (`fresh`), a mentés csak újracsatlakozáskor jön vissza.
- Automatikus újracsatlakozás (`src/net/heartbeat.ts`, `table-store.ts`): a kliens 10 mp-enként pingel, 25 mp csend után újracsatlakozik (1-2-4-8-15 mp visszalépéssel); előtérbe kerüléskor (`visibilitychange`/`online`/`pageshow`) azonnal ellenőriz. A host 30 mp csend után kiesettnek jelöli a játékost (nem tartja fel a kört), és a szobát ugyanazzal a kóddal újranyitja, ha a peer megszűnt; a mentett asztalállapot visszajön. Újracsatlakozás után a jelentés azonnal újra kimegy (`connSeq`).
- Kapcsolat-generáció (`gen`, `table-store.ts`): minden kísérlet és lebontás növeli; a régi peer késve érkező close/error eseménye nem bonthatja le az új kapcsolatot (ez okozta a 1-2 mp-es villogást). Kísérletenként 15 mp időkorlát; két új peer között min. 3 mp. Host-őr: ha a szoba 15 mp-ig nem érhető el a szobaszerveren (`isAlive` = nincs megszűnve és nincs leszakadva), ugyanazzal a kóddal újranyit.
- Diagnosztika (`src/net/diag.ts`): "Kapcsolat részletei" a lobbyban és az asztalsávban, kimásolható napló (szobaszerver, ICE-állapot, TURN). Képernyő ébren tartása (`src/net/wake-lock.ts`), kikapcsolható.
- CSP (nexai-hu `netlify.toml` és `sorsfordito/.htaccess`): `connect-src` engedi a `0.peerjs.com`-ot. TURN: Cloudflare, a nexai-hu `netlify/functions/turn-credentials.mjs` (`/sorsfordito/api/turn-credentials`, env: `CF_TURN_KEY_ID`, `CF_TURN_API_TOKEN`); kulcs nélkül 503 → csak STUN. Az APK az éles URL-t hívja.

### UI Komponensek
- `GameScreen.tsx` — Fő játékképernyő + InvestPhase (tudáskártyák + befektetések)
- `DecisionView.tsx` — Döntési kártyák renderelése + `replaceVars()` dinamikus változókkal
- `FateEventView.tsx` — Sorsfordítók + tudáspróba állapotgép (idle→quiz→success/failure)
- `StartScreen.tsx` — Karakter/idő választás + játék indítás

---

## Konvenciók

### Kód
- `formatHUF(amount)` — Magyar Ft formázás (pl. "1 250 000 Ft")
- `GlossaryText` — Szövegben lévő pénzügyi kifejezések automatikus tooltip-je
- `{{variable}}` szintaxis — Dinamikus változók döntési szövegekben (pl. `{{salary}}`, `{{pmap_yield}}`)
- Per-round purchase limits: max 1 befektetés + max 2 tudáskártya / kör, "heti piac": körönként 3 húzott befektetési és 3 tudásajánlat (a játéknaplóból számolva)
- Csapdakártyán 20 mp-es "sürgetés" óra + "Megállok és utánanézek" gomb (megállítja, megmutatja a vészjeleket); lejáratkor: egészség -1, pénzveszteség nincs
- A soron következő gombon `pulse-cta` (prefers-reduced-motion esetén kikapcsol)
- Játékmesteri beállítások (`src/store/settings-store.ts`, `SettingsPanel`): egyéni kezdő egyenleg (karakterenkénti `maxStartBalance`), "Valós helyzet modellezése" (bevétel/kiadás szerkesztése), csapdaóra, kocka forrása. Indításkor a `GameConfig.rules`-ba másolódnak; a `clampStartBalance` a motorban is véd.
- Tesztmód: a verziófeliratra 5 koppintás; korlátlan egyenleg (20 M Ft), kézi kockaérték, mezőre ugrás, körátugrás, "Tesztjáték" jelölés
- Kocka: `secureDieRoll` (crypto + elutasításos mintavétel); "Honnan jön a véletlen?" lap dobásnaplóval és eloszlással; "Saját kockával dobok" lehetőség
- Pénzmatek: a hitel törlesztőjéből a kamat feletti rész csökkenti a tartozást (`amortizeDebts`, lejáratkor a törlesztő megszűnik); a befektetés vásárláskor rögzített havi hatása (`src/engine/investment-income.ts`: PMÁP a heti hozamból, betét 28% kamatadó után; képzés/távmunka → fizetés, napelem → rezsi) eladáskor visszavonódik; Maraton/Ultra: évente egyszer az éves infláció; a bevétel/kiadás előnézet a kör hónapjaival szoroz. 25. születésnap (`src/data/tax-2026.ts`, preset `nextBirthdayInMonths`): a következő hónaptól a fiatalok SZJA-mentessége megszűnik, a nettó a 2026-os kulcsokkal (SZJA 15%, TB 18,5%, határ 715 765 Ft) csökken; Dani Sprintben a 7. körtől 320 000 → 261 104 Ft. Teszt: `money-math.test.ts`.
- Hangok (`src/audio/sfx.ts`: valódi CC0 hangfájlok a `public/sounds/`-ban - Kenney, UI SFX; eredet: `public/sounds/LICENSE.txt`; tartalékként Web Audio szintézis) és rezgés: alapból némítva, kapcsoló a Játékmesteri beállítások "Kijelzés" részében és a menüben. Állapotfigyelő hangok (pénz, mérföldkő, forduló, reakció, vége): `src/audio/SoundBridge.tsx`; kocka/lépés/kártya/csapdaóra a komponensekben `play()`-jel.
- Befektetések értéke (`src/engine/investment-value.ts`): az árfolyamos eszközök (EUR/USD, BUX-hoz kötött részvény/ETF, arany) havonta a `src/data/live/history.json` valós havi mozgását követik (12 hónap, ciklikusan, évszámmal jelölve; csak `verified` sorozat). A kamatozók értéke állandó, a kamat havi jövedelemként jön (nincs dupla számolás). A hónap első hétfőjén a heti rutin bővíti az adatsort.
- Pénzmozgás átláthatóan (`src/ui/components/MoneyOverview.tsx`): `BalanceHighlight` (induló egyenleg az 1. körben, havi egyenleg a kör összegzésén), `InvestmentTable` (tételesen: befektetett, mostani érték, havi változás és oka), `EndMoneyComparison` a játék végén (befektetések nélkül vs. befektetésekkel, tételesen).
- Mezőbónusz (`src/data/bonus-cards.ts`): Tudás mező → 3 tudáskártya-keret + egy ingyenes tudáskártya; Befektetés mező → 2 befektetés, 5 lapos heti piac. A mezőkártya hátlappal jelenik meg, koppintásra felnagyul és felfordul (`CardFlip` a `FieldCardView`-ban).
- Saját helyzet (`src/engine/custom-profile.ts`, `CustomProfileForm`): játékmesteri kapcsolóval (`GameRules.customProfile`) a játékos megadja az életkorát, induló tőkéjét, havi bevételét és kiadásait; a karakter története és tartozásai maradnak. Asztalnál `setCustom` → a host `approveCustom`-mal jóváhagyja vagy elutasítja (a hosté automatikusan jóváhagyott); az indítás addig vár (`pendingCustoms`). Késői játékosnál a jóváhagyás a játékmester asztalsávjában jelenik meg.
- Döntések pénzügyi szerkezete (`src/store/decision-finance.ts`, `applyDecisionOption`): `invests` (valódi portfólióelem), `takesLoan` (`src/engine/loans.ts`, annuitás; kamat fix vagy heti kulcs, pl. `bank.mortgageThm`), `paysOffLoan`, `adjustsLoan`, `acquiresAsset` (lakás, autó, üzletrész a nettó vagyonban). A törlesztő mindig a hitelrekordokból adódik (`loanPayments` = Σ részlet); `loanPayments`-hatás a legdrágább hitelt módosítja. Tartós hatás: `startAfterMonths`/`durationMonths` ütemezve (`scheduleEffect`, `board.reverts`). Fedezet nélküli döntés nem választható (`affordableOptions`).
- Körönkénti könyvelés: `src/engine/round-money.ts` (`planRoundIncome`/`planRoundExpenses`) - ugyanezt használja a könyvelés és az előnézet. Minden egyenlegmozgás naplózva (mezőkártya: `type: 'field'`); teszt: `rollover.test.ts` (napló összege = egyenlegváltozás, vagyon = egyenleg + befektetés − tartozás, a végső kimutatás egyezik).
- Előjel és szín (`src/engine/money-sign.ts`, `src/ui/components/Money.tsx`): valódi mínuszjel (−), az előjel a pénzmozgás iránya (a kiadás növekedése −, piros; csökkenése +, zöld), havi tételnél "/hó".
- Játék végi összegző (`src/engine/end-summary.ts`, `EndMoneyComparison`): kezdő tőke → tételek (bevétel, kiadás, döntések, sorskártyák, mezőkártyák, tudás) → befektetések nélkül; mellette befektetésenként; alatta vagyontárgyak, tartozások, nettó vagyon, pénzügyi szabadság és jóllét.
- Piac ↔ Tudás fül (`knowledgeLinks` az `src/engine/offers.ts`-ben): a zárt befektetésen megnevezve a kellő tudáskártya (és az alapja), a Tudás gomb és a kapcsolódó kártya pulzál ("Feloldja a Heti piacon"), megszerzés után a Heti piac jelez.
- Tudásfa (`src/data/knowledge-tree.ts`): szintek (Alap/Eszközök/Haladó) és előfeltételek; a kártyán a valós hatás (`knowledgeEffects`). Heti kínálat (`src/engine/offers.ts`, `drawOffers`): a zárt befektetés feltétele, a kör döntésének témája, a nem kivédett csapda, a negyed témája szerint, előfeltétel nélküli lap nem kínálható. Csapdán a hozzá illő tudással nincs sürgető óra és minden vészjel látszik; tudás nélkül az utánanézés a felüket mutatja.
- Sorskártya a dobásból (`src/engine/fate-deck.ts`, `src/data/fate-themes.ts`): naptári kártya (pl. karácsony decemberben, SZJA-tervezet március-május) → Sorsfordító mezőn a karakter saját története → a negyed témájának paklija; játékonként nincs ismétlés, mentve: `GameState.fateDraws`. Döntés mezőn a következő esedékes döntés előrejön (`getDecisionForField`). Mezőkártya-szűrés: `FieldCard.requires` (karakter, albérlet, meglévő befektetés).
- Látható keverés (`CardFlip`): új paklikörnél teljes keverés, egyébként emelés, "N lapos pakli, ebből még M lap vár"; asztalnál a közös pakli helye.
- Tábla: 6 tematikus negyed × 4 mező (`DISTRICTS` a `src/data/board.ts`-ben), mezőnként rövid felirat és jelmagyarázat

### Fájl struktúra
```
src/
├── app/                    # Next.js App Router
│   └── api/data/           # Adatforrás API routes (mnb, news, bet, rent, pregame)
├── data/
│   ├── decisions/          # Döntésfák + sorsfordítók (index.ts, fresh-start-sprint.ts, dani-sprint.ts, inheritance-sprint.ts)
│   ├── character-presets.ts # 14 karakter preset (3 fő + 11 extra)
│   ├── knowledge-cards.ts  # 10 tudáskártya (5 ingyenes + 5 fizetős)
│   └── investments.ts      # Befektetési opciók
├── data-sources/           # Adatforrás adapterek + PreGameContext
├── engine/                 # Játékmotor (financial-calculator, round-processor)
├── store/                  # Zustand store-ok (game-store, freemium-store)
├── types/                  # TypeScript típusok (game.ts, financial.ts, data-sources.ts)
└── ui/
    ├── components/         # Újrahasználható UI komponensek
    └── screens/            # Fő képernyők (StartScreen, GameScreen, EndScreen)
```
