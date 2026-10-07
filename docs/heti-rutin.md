# Heti adatfrissítő rutin (Sorsfordító)

Minden hétfőn 06:47-kor (Europe/Budapest) egy Claude-rutin frissíti a játék élő adatait, élesít, és e-mailt küld a változásokról.

## Lépések

1. **Repók:** `ekutato/Sorsfordito` (forrás) és `ekutato/nexai-hu` (élesítés: a `sorsfordito/` mappa, a Netlify innen élesít).
   - **Ág:** az ekutato/nexai-hu#1 merge-ölve (2026-10-07), ezért mindkét repóban az alapértelmezett (`main`) ágon dolgozik. A heti adatfrissítés így közvetlenül élesít (a játékvezető döntése: automatikus élesítés + e-mail).
2. **Új hét:** `node scripts/heti-set.mjs --het <ÉÉÉÉ-Www> <ÉÉÉÉ-HH-NN>`
3. **Értékek:** minden kulcsot friss, elsődleges forrásból ellenőriz, és így ír be:
   `node scripts/heti-set.mjs <kulcs> <érték> <asOf> <true|false> "<forrás>" <url>`

   A szkript a régi értéket automatikusan az `elozo` mezőbe teszi.

   | Kulcs | Forrás |
   |---|---|
   | `mnb.eurHufRate`, `mnb.usdHufRate`, `mnb.chfHufRate` | MNB hivatalos árfolyam (mnb.hu/arfolyamok) |
   | `mnb.baseRate` | MNB Monetáris Tanács |
   | `ksh.*` | KSH gyorstájékoztatók (infláció havonta, keresetek havonta, minimálbér évente) |
   | `akk.*` | ÁKK / allampapir.hu |
   | `realEstate.*` | KSH-ingatlan.com lakbérindex, KSH lakásárak |
   | `stockMarket.*` | BÉT záróérték |
   | `metals.*` | arany és ezüst azonnali árfolyam (például gold-api.com, Swissquote) |
   | `bank.*` | MNB kamatstatisztika (havi PDF); a `bank.carLoanThm` a játékvezető döntése szerint az áruhitelek átlagos THM-je (autóhitel-közelítés) |
   | `diakhitel.dh1Rate` | diakhitel.hu |
   | `crypto.*` | CoinGecko |

   - **Ha egy érték nem erősíthető meg:** a régi marad, `verified=false` jelöléssel.
   - **Ha a szkript 10%-nál nagyobb ugrást jelez:** a rutin megáll (lásd 7. pont).
4. **Hírek és Közlöny:**
   - A Gmail "MK figyelő" piszkozatából és a hét gazdasági híreiből legfeljebb 5 hír kerül a `hirek` tömbbe.
   - A hír szövege saját megfogalmazás, mellette a forráslink. Pártpolitikai állásfoglalás nincs.
   - Játékhatás (`jatekEsemeny`) csak kis, semleges hatással kerülhet egy hírhez.
5. **Ellenőrzés:** `npx tsc --noEmit -p .`, `npx vitest run` (a tartalomfrissességi teszttel) és `npm run build`.
6. **Élesítés:**
   - commit és push a Sorsfordito repóba (a CI frissíti a teszt-APK-t);
   - az `out/` tartalma a nexai-hu repó `sorsfordito/` mappájába kerül, a `.htaccess` megtartásával;
   - végül commit és push a nexai-hu repóba.
7. **E-mail** az ekutato@gmail.com címre, "Sorsfordító - heti adatok, <hét>" tárggyal.
   - **A törzs:** `node scripts/heti-email.mjs --allapot "Élesítve"` kimenete (HTML-táblázat, a változott sorok sárga háttérrel, régi → új).
   - **Nem élesít, ha:** van nem ellenőrzött új érték, 10%-nál nagyobb ugrás, vagy hibás teszt vagy build.
   - **Ilyenkor:** nincs push, az állapot "Nem élesítve: <ok>", és az e-mail megkérdezi, mi legyen.

## Szabályok

A rutin a `CLAUDE.md` tartalmi szabályait követi:
- minden adat ellenőrzött forrásból jön (1. szabály);
- semlegesség, márkanév nincs (11. szabály);
- minden számnak a `{{változó}}` rendszerből kell jönnie, fixen beírt érték nem lehet.
