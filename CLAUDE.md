# Pénzügyi Sorsfordító — Projekt Memória (CLAUDE.md)

> Ez a fájl a projekt kontextusát őrzi session-ök között. Claude Code minden session elején automatikusan olvassa.

## Projekt áttekintés

**Név:** Pénzügyi Sorsfordító
**Típus:** Magyar pénzügyi tudatossági szimulációs játék
**GDD:** v1.0 (2026. március) — `C:\Users\zombo\Downloads\PÜI-tudatosság_játék\Penzugyi_Sorsfordito_GDD_v1.md`
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
| `fresh_start` | Zsófi, 18 | Érettségi utáni útelágazás, 0 Ft jövedelem, 120K megtakarítás |
| `career_start` | Dani, 24 | Pályakezdő junior fejlesztő, 320K nettó (DH2 opcionális, döntés alapú) |
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
| M4 | Tesztelés | ❌ 0% | Nem kezdődött |
| M5 | Bővítés | ⚠️ 30% | 3 karakter + Maraton/Ultra kész, multiplayer nincs |
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
3. **Freemium:** Ingyenes = 1 karakter (Dani) + Sprint. Prémium = mind 3 preset + Maraton/Ultra + "Mi lett volna ha" + saját adat.

---

## Tartalmi szabályok (MINDIG betartandó!)

> Ezek a szabályok minden tartalomírásra vonatkoznak — döntések, kvízek, sorsfordítók, leírások.
> ⚠️ Ha új tartalom készül, SOHA NE térj el ezektől, még ha "alapértelmezett" minta is lenne kényelmesebb.

1. **Kvíz helyes válasz eloszlás:** A helyes válasz NE legyen mindig B. Az A/B/C válaszok között **egyenletesen oszoljon el** a helyes válasz (~33% mindegyik). Soha ne legyen 3+ egymást követő kérdésnél ugyanaz a helyes válasz.
2. **Válasz hosszúság:** A helyes válasz NE legyen mindig a leghosszabb opció. Legyenek rövid helyes válaszok is. A hosszúság ne legyen "tipp" a helyes válaszra.
3. **Diákhitel (DH2):** NEM alapértelmezett — a játékos a `dani-d03` döntésnél választja, hogy felvette-e. A preset-ben nincs DH2 adósság.
4. **Adatok valóssága:** Minden pénzügyi adat 2026-os magyar valóság. Ha nem biztos, ellenőrizd online. Főbb referencia értékek:
   - Minimálbér: bruttó 322 800 Ft, garantált bérminimum: 423 000 Ft
   - SZJA: 15%, TB: 18.5%, SZOCHO: 13%
   - CSOK Plusz: max 3% kamat, 1 gyerek: 15M, 2 gyerek: 30M, 3 gyerek: 50M Ft
   - Babaváró: 11M Ft, 0%, feltétel: 3 év TB jogviszony
   - GYES: 28 500 Ft/hó (nyugdíjminimum), GYED: fizetés 70%-a, max ~330k/hó
   - Kamatjövedelem adó: 15% SZJA (nincs EHO 2019 óta)
5. **Epilógus értékelés:** Negatív nettó vagyon és rossz gazdálkodás NEM kaphat bronz szintet sem. A legalacsonyabb szint legyen „Tanulópénz" (nem fém), nem „Bronz".
6. **Glossary kiemelés:** Ha egy szó (pl. „infláció") többször előfordul egy szövegben, csak az ELSŐ előfordulásnál legyen kiemelve/klikkelhető.
7. **Páros mód:** Későbbi milestone — még NEM implementálandó, de a döntésfák figyelembe veszik a lehetőséget.

---

## Architekturális Döntések

### Állapotkezelés
- **Zustand** `persist` middleware → localStorage
- `GameState` tartalmazza: config, phase, currentRound, players[], eventLog[]
- `FinancialSheet` tartalmazza: balance, income, expenses, investments[], debts[], acquiredKnowledge[], pendingStorylines[]

### Adatforrások (M1)
- `/api/data/mnb` — MNB SOAP proxy (árfolyamok)
- `/api/data/news` — RSS aggregátor (Portfolio.hu, 24.hu, Index.hu)
- `/api/data/bet` — BUX index (BÉT / Stooq.com fallback)
- `/api/data/rent` — Albérletárak (ingatlan.com, alberlet.hu scraping)
- `/api/data/pregame` — Orchestrátor (T-90 összesítés)
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
- Per-round purchase limits: max 1 befektetés + max 2 tudáskártya / kör

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
