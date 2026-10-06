// ============================================================================
// PENZUGYI SORSFORDITO - Investment Options
// Befektetési lehetosegek - valós magyar piacra kalibrálva
// ============================================================================

import type { InvestmentOption } from '@/types/financial';
import { fillDeep } from '@/data/live/vars';

/** Nyers tartalom {{változókkal}} - a megjelenítéshez a lenti, kitöltött INVESTMENT_OPTIONS-t használd */
export const INVESTMENT_OPTIONS_RAW: InvestmentOption[] = [

  // === ERTEKPAPIR kategoria ===

  {
    id: 'inv-pmap',
    name: 'Prémium Magyar Állampapír (PMÁP)',
    category: 'securities',
    description:
      'Az állam által garantált, inflációkövető állampapír: a kamata minden évben az előző évi ' +
      'átlagos inflációhoz igazodik (most {{pmap_yield}}%), és évente egyszer fizet kamatot. A kamat adómentes.',
    entryPrice: 100_000,
    monthlyPassiveIncome: 580,  // Dinamikusan felulirodik
    scores: {
      returnPotential: 40,
      liquidity: 70,
      safety: 95,
      inflationResistance: 75,
      returnSpeed: 60,
      accessibility: 90,
      volatility: 5,
    },
    realWorldSource: 'https://www.akk.hu',
    realWorldInfo:
      'A PMÁP az egyik legkedveltebb lakossági állampapír. ' +
      'Kincstári számlán (WebKincstár) vásárolható, min. 10 000 Ft-tól.',
    isDynamic: true,
    dynamicDataKey: 'akk.pmapYield',
    tier: 'free',
  },

  {
    id: 'inv-tbsz-etf',
    name: 'TBSZ + ETF portfólió',
    category: 'securities',
    description:
      'Tartós Befektetési Számlán (TBSZ) tartott tőzsdeindex-követő ETF. ' +
      '5 év után az összes hozam adómentes! Globálisan diverzifikált. ' +
      'A hozam árfolyam-növekedésből jön — nincs havi kifizetés, a hozam évről évre ingadozik.',
    entryPrice: 200_000,
    monthlyPassiveIncome: 0,  // ETF: tőke-növekedés, NEM havi jövedelem! Hosszú távon ~8-10%/év, de nem havi kifizetés.
    scores: {
      returnPotential: 65,
      liquidity: 80,
      safety: 50,
      inflationResistance: 60,
      returnSpeed: 45,
      accessibility: 65,
      volatility: 45,
    },
    requiredKnowledge: 'know-tbsz',
    realWorldSource: 'https://www.bet.hu',
    realWorldInfo:
      'A TBSZ (Tartós Befektetési Számla) Magyarország legnagyobb adóelőnye: ' +
      '5 év után 0% adó a hozamra. Bankoknál és online brókereknél is nyitható. ' +
      'FONTOS: az ETF hozama tőke-növekedés (árfolyamemelkedés), nem havi kifizetés!',
    isDynamic: true,
    dynamicDataKey: 'stockMarket.buxYearlyChange',
    tier: 'free',
  },

  {
    id: 'inv-stock-hu',
    name: 'Magyar részvény (BÉT)',
    category: 'securities',
    description:
      'Egyedi részvény a Budapesti Értéktőzsdéről, pl. Pannon Bankcsoport Nyrt., Duna Energia Nyrt., Tisza Gyógyszer Nyrt. (kitalált cégek). ' +
      'Magas hozampotenciál, de egyedi kockázat.',
    entryPrice: 150_000,
    monthlyPassiveIncome: 0,  // Arfolyamnyereseg, nem havi jovedelem
    scores: {
      returnPotential: 70,
      liquidity: 85,
      safety: 35,
      inflationResistance: 55,
      returnSpeed: 40,
      accessibility: 60,
      volatility: 65,
    },
    requiredKnowledge: 'know-tbsz',
    realWorldSource: 'https://www.bet.hu',
    realWorldInfo:
      'A BÉT-en a legnagyobb súlyú részvények egy bank, egy energiacég és egy gyógyszergyártó - a játékban: Pannon Bankcsoport (PBX), Duna Energia (DNE), Tisza Gyógyszer (TGY). ' +
      'TBSZ-en tartva 5 év után adómentes.',
    isDynamic: true,
    dynamicDataKey: 'stockMarket.buxDailyChange',
    tier: 'premium',
  },

  // === PENZ kategoria ===

  {
    id: 'inv-bank-deposit',
    name: 'Bankbetét (lekötött, 1 év)',
    category: 'cash',
    description:
      'Banki lekötött betét, fix kamattal. Alacsony hozam (most átlagosan {{deposit_rate}}% körül), ' +
      'de az OBA védi 100 000 EUR-ig. A legegyszerűbb megtakarítás.',
    entryPrice: 50_000,
    monthlyPassiveIncome: 190,  // ~4.5% éves kamat (game mechanic)
    scores: {
      returnPotential: 25,
      liquidity: 45,
      safety: 85,
      inflationResistance: 20,
      returnSpeed: 60,
      accessibility: 95,
      volatility: 0,
    },
    realWorldSource: 'https://www.mnb.hu',
    realWorldInfo:
      'A bankbetétet az OBA (Országos Betétbiztosítási Alap) védi személyenként ' +
      'és bankonként 100 000 EUR-ig (most kb. {{oba_huf}} Ft). Az átlagos betéti kamat most {{deposit_rate}}%, akciós ajánlatokkal több is lehet. ' +
      'A kamatból a bank levonja a 15% SZJA-t és a 13% szochót (2023. július óta), összesen 28%-ot. Az állampapír és az 5 évet kitöltött TBSZ hozama ez alól mentes.',
    isDynamic: true,
    dynamicDataKey: 'mnb.baseRate',
    tier: 'free',
  },

  {
    id: 'inv-crypto',
    name: 'Kriptovaluta (BTC/ETH)',
    category: 'cash',
    description:
      'Bitcoin vagy Ethereum vásárlás. Extrém volatilitás, szabályozatlan piac. ' +
      'Magas hozampotenciál, de a veszteség is lehet teljes.',
    entryPrice: 50_000,
    monthlyPassiveIncome: 0,  // Spekulativ, nincs stabil hozam
    scores: {
      returnPotential: 85,
      liquidity: 75,
      safety: 10,
      inflationResistance: 45,
      returnSpeed: 60,
      accessibility: 70,
      volatility: 95,
    },
    realWorldSource: 'https://www.mnb.hu',
    realWorldInfo:
      'Magyarországon a kriptó-nyereség 15% SZJA-köteles. Egy Bitcoin most kb. {{btc_huf}} Ft. ' +
      'Nincs betétbiztosítás, nincs felügyelet. Csak annyit fektess, amennyit hajlandó vagy elveszíteni.',
    isDynamic: false,
    tier: 'free',
  },

  // === INGATLAN kategoria ===

  {
    id: 'inv-garage',
    name: 'Garázs (kiadásra)',
    category: 'real_estate',
    description:
      'Garázs vásárlás és bérbeadás. Relatíve alacsony belépési küszöb az ' +
      'ingatlanpiacon, stabil havi bevétel.',
    entryPrice: 4_000_000,
    monthlyPassiveIncome: 25_000,
    scores: {
      returnPotential: 50,
      liquidity: 30,
      safety: 65,
      inflationResistance: 55,
      returnSpeed: 35,
      accessibility: 40,
      volatility: 15,
    },
    realWorldSource: 'https://www.ksh.hu',
    realWorldInfo:
      'Budapesten egy garázs ára több millió forint, a bérleti díj havi néhány tízezer forint. ' +
      'Kevés karbantartás, de nehéz eladni gyorsan.',
    isDynamic: true,
    dynamicDataKey: 'realEstate.budapestSqmPrice',
    tier: 'premium',
  },

  {
    id: 'inv-room-rent',
    name: 'Szoba kiadása (albérlő / rövid távú kiadás)',
    category: 'real_estate',
    description:
      'Ha van egy szabad szobád, kiadhatod albérlőnek vagy rövid távra (online szállásplatformon). ' +
      'Nincs ingatlanvásárlás, de berendezés kell (ágy, textil, konyha).',
    entryPrice: 200_000,  // Alapvető berendezés: ágy, matrac, textil, konyhai felszerelés, takarítóeszközök
    monthlyPassiveIncome: 60_000,
    scores: {
      returnPotential: 55,
      liquidity: 90,
      safety: 60,
      inflationResistance: 50,
      returnSpeed: 80,
      accessibility: 85,
      volatility: 30,
    },
    realWorldSource: 'https://info.ntak.hu',
    realWorldInfo:
      'Az albérlőből származó jövedelem adóköteles. Rövid távú kiadásnál szálláshely-szolgáltatási ' +
      'bejelentés kell az önkormányzatnál.',
    isDynamic: false,
    tier: 'premium',
  },

  // === VALLALKOZAS kategoria ===

  {
    id: 'inv-online-biz',
    name: 'Online vállalkozás',
    category: 'business',
    description:
      'Webshop, freelance szolgáltatás vagy digitális termék. ' +
      'Alacsony induló költség, de időigényes és bizonytalan bevétel.',
    entryPrice: 300_000,
    monthlyPassiveIncome: 0,  // Változó, a döntésfában derül ki
    scores: {
      returnPotential: 75,
      liquidity: 30,
      safety: 25,
      inflationResistance: 60,
      returnSpeed: 55,
      accessibility: 80,
      volatility: 70,
    },
    requiredKnowledge: 'know-business',
    realWorldSource: 'https://www.nav.gov.hu',
    realWorldInfo:
      'Egyéni vállalkozás indítása ingyenes (online, Webes Ügysegéden). ' +
      'Átalányadó: egyszerűsített adózás az éves minimálbér tízszereséig terjedő bevételig, általában 45% költséghányad.',
    isDynamic: false,
    tier: 'free',
  },

  // === TARGY kategoria ===

  {
    id: 'inv-gold',
    name: 'Befektetési arany',
    category: 'commodity',
    description:
      'Fizikai arany (érme vagy tömb) vagy "papír arany" (ETF). ' +
      'Értékmegőrző, válságálló – most kb. {{gold_usd}} USD/uncia. ' +
      'Nem termel jövedelmet, de geopolitikai válságban menedékeszköz.',
    entryPrice: 200_000,
    monthlyPassiveIncome: 0,  // Ertekmegorzo, nem jovedelemtermelo
    scores: {
      returnPotential: 55,
      liquidity: 65,
      safety: 70,
      inflationResistance: 90,
      returnSpeed: 25,
      accessibility: 60,
      volatility: 35,
    },
    realWorldSource: 'https://www.mnb.hu',
    realWorldInfo:
      'Az arany ára most kb. {{gold_usd}} USD/uncia, azaz kb. {{gold_huf_g}} Ft/gramm. ' +
      'Az MNB saját aranytömbje (1g, 5g, 10g) a bankfiókokban vásárolható. ' +
      'Befektetési aranyra 0% ÁFA. Válságban értéke jellemzően nő.',
    isDynamic: false,
    tier: 'premium',
  },

  {
    id: 'inv-silver',
    name: 'Befektetési ezüst',
    category: 'commodity',
    description:
      'Fizikai ezüst vagy ezüst ETF. Olcsóbb belépés, mint az arany, ' +
      'de volatilisebb. Ipari felhasználás (elektronika, napelem) is hajtja az árat.',
    entryPrice: 50_000,
    monthlyPassiveIncome: 0,
    scores: {
      returnPotential: 50,
      liquidity: 55,
      safety: 55,
      inflationResistance: 75,
      returnSpeed: 25,
      accessibility: 65,
      volatility: 50,
    },
    realWorldSource: 'https://www.mnb.hu',
    realWorldInfo:
      'Az ezüst ára most kb. {{silver_usd}} USD/uncia. Az aranynál volatilisebb, ' +
      'de ipari kereslet is támogatja (napelem, EV, elektronika). ' +
      'Fizikai ezüstre 27% ÁFA van Magyarországon (aranyra 0%)!',
    isDynamic: false,
    tier: 'premium',
  },

  // === DEVIZA kategoria ===

  {
    id: 'inv-forex-eur',
    name: 'Deviza: EUR tartás',
    category: 'cash',
    description:
      'Euró vásárlás és tartás (bankszámlán vagy fintech devizaszámlán). ' +
      'Forintgyengülés ellen véd — ha az EUR/HUF emelkedik, nyersz. ' +
      'Nincs kamat (hacsak nem lekötöd), de árfolyamnyereség lehet.',
    entryPrice: 50_000,
    monthlyPassiveIncome: 0,
    scores: {
      returnPotential: 30,
      liquidity: 95,
      safety: 55,
      inflationResistance: 60,
      returnSpeed: 50,
      accessibility: 90,
      volatility: 30,
    },
    realWorldSource: 'https://www.mnb.hu/arfolyamok',
    realWorldInfo:
      'Egy euró most {{eur_huf}} Ft. Váltás előtt hasonlítsd össze a bankok és a fintech-szolgáltatók díjait, a devizaváltási és a hétvégi felárat. ' +
      'Online befektetési platformon EUR-ban ETF-ekbe is fektethetsz. ' +
      'Devizaárfolyam-nyereség 15% SZJA-köteles.',
    isDynamic: true,
    dynamicDataKey: 'mnb.eurHufRate',
    tier: 'free',
  },

  {
    id: 'inv-forex-usd',
    name: 'Deviza: USD tartás',
    category: 'cash',
    description:
      'Amerikai dollár vásárlás és tartás. A világ tartalékvalutája — ' +
      'ha a forint gyengül, a dollárod többet ér. ' +
      'USD-s ETF-ek, részvények, kötvények alapvalutája.',
    entryPrice: 50_000,
    monthlyPassiveIncome: 0,
    scores: {
      returnPotential: 35,
      liquidity: 95,
      safety: 50,
      inflationResistance: 55,
      returnSpeed: 50,
      accessibility: 90,
      volatility: 35,
    },
    realWorldSource: 'https://www.mnb.hu/arfolyamok',
    realWorldInfo:
      'Egy dollár most {{usd_huf}} Ft. Az átváltás költsége szolgáltatónként eltér - ' +
      'a fintech-szolgáltatóknál hétvégén gyakran felár van. ' +
      'A dollár árfolyama mindkét irányba mozoghat, a forinthoz képest is.',
    isDynamic: true,
    dynamicDataKey: 'mnb.usdHufRate',
    tier: 'free',
  },

  // === TUDAS/KEPZES kategoria (befekteteskent) ===

  {
    id: 'inv-professional-cert',
    name: 'Szakmai képzés / OKJ',
    category: 'education',
    description:
      'Szakmai továbbképzés, ami tartósan megemeli a fizetésedet. ' +
      'Nem klasszikus befektetés, de a legmagasabb megtérülésű.',
    entryPrice: 150_000,
    monthlyPassiveIncome: 30_000,  // Beremelkedes
    scores: {
      returnPotential: 60,
      liquidity: 5,
      safety: 75,
      inflationResistance: 65,
      returnSpeed: 55,
      accessibility: 75,
      volatility: 5,
    },
    realWorldSource: 'https://www.felvi.hu',
    realWorldInfo:
      'A KSH adatai szerint a felsőfokú végzettség átlagosan 80%-kal magasabb ' +
      'bért eredményez az érettségihez képest Magyarországon.',
    isDynamic: false,
    tier: 'free',
  },

  {
    id: 'inv-language',
    name: 'Nyelvtanulás (angol/német)',
    category: 'education',
    description:
      'Nyelvvizsga megszerzése. Azonnali bérnövelő hatás, kinyitja a ' +
      'nemzetközi lehetőségeket (remote munka, külföldi cégek).',
    entryPrice: 200_000,
    monthlyPassiveIncome: 40_000,  // Beremelkedes
    scores: {
      returnPotential: 55,
      liquidity: 5,
      safety: 80,
      inflationResistance: 70,
      returnSpeed: 45,
      accessibility: 85,
      volatility: 0,
    },
    realWorldSource: 'https://www.ksh.hu',
    realWorldInfo:
      'Angoltudás átlagosan 15-25%-kal magasabb fizetést jelent Magyarországon. ' +
      'Némettudás különösen értékes a nyugat-magyarországi régióban.',
    isDynamic: false,
    tier: 'free',
  },

  // ============================================================================
  // ÚJ BEFEKTETÉSEK — Tartalombővítés (Marathon/Ultra módhoz)
  // ============================================================================

  {
    id: 'inv-onkentes-penztar',
    name: 'Önkéntes nyugdíjpénztár',
    category: 'securities',
    description:
      'Befizetésed 20%-a adójóváírásként visszajön (max évi 150 000 Ft). ' +
      'A nyugdíjpénztár befektet helyetted — válaszhatsz konzervatív, kiegyensúlyozott vagy növekedési portfóliót.',
    entryPrice: 50_000,
    monthlyPassiveIncome: 0, // 20% adójóváírás = évi max 150k, nem havi passzív
    scores: {
      returnPotential: 45,
      liquidity: 15,
      safety: 80,
      inflationResistance: 55,
      returnSpeed: 20,
      accessibility: 75,
      volatility: 10,
    },
    requiredKnowledge: 'know-pension',
    realWorldSource: 'https://www.mnb.hu/fogyasztovedelem/penzugyi-navigacio/megfelelo-nyugdijcelu-megtakaritas',
    realWorldInfo:
      'Az önkéntes nyugdíjpénztári befizetés 20%-a visszajár adójóváírásként, max évi 150 000 Ft. ' +
      'A nyugdíjkorhatár elérése előtti kivét bünteti: 10 éven belül büntetőadó. ' +
      'Több önkéntes nyugdíjpénztár közül választhatsz - a díjakat és a hozamokat az MNB oldalán hasonlíthatod össze.',
    isDynamic: false,
    tier: 'free',
  },

  {
    id: 'inv-solar-panel',
    name: 'Napelem rendszer',
    category: 'real_estate',
    description:
      'Napelem telepítése saját ingatlanra. A megtermelt áram csökkenti a rezsit, ' +
      'a felesleg visszatáplálható a hálózatba. 7-10 éves megtérülés, 25+ év élettartam.',
    entryPrice: 2_500_000,
    monthlyPassiveIncome: 18_000, // Havi rezsicsökkentés
    scores: {
      returnPotential: 40,
      liquidity: 5,
      safety: 75,
      inflationResistance: 80,
      returnSpeed: 30,
      accessibility: 45,
      volatility: 5,
    },
    realWorldSource: 'https://www.mekh.hu',
    realWorldInfo:
      'Magyarországon a szaldós elszámolás 2024-től bruttó elszámolásra váltott, ' +
      'de a megtakarítás még mindig évi 200-300 000 Ft. ' +
      'Pályázatok: Napenergia Plusz (max 50% támogatás, 5 kWp rendszerre).',
    isDynamic: false,
    tier: 'free',
  },

  {
    id: 'inv-dividend-stock',
    name: 'Osztalék-részvény portfólió',
    category: 'securities',
    description:
      'Magyar és nemzetközi osztalékfizető részvények. ' +
      'Negyedévente/félévente osztalékot kapsz — valódi passzív jövedelem. ' +
      'TBSZ-en tartva 5 év után adómentes!',
    entryPrice: 300_000,
    monthlyPassiveIncome: 3_000, // ~12% éves osztalékhozam a portfólión
    scores: {
      returnPotential: 55,
      liquidity: 75,
      safety: 40,
      inflationResistance: 50,
      returnSpeed: 40,
      accessibility: 55,
      volatility: 50,
    },
    requiredKnowledge: 'know-tbsz',
    realWorldSource: 'https://www.bet.hu',
    realWorldInfo:
      'Osztalékfizető részvények pl. a játékban: Pannon Bankcsoport Nyrt., Duna Energia Nyrt., Tisza Gyógyszer Nyrt. (kitalált cégek). ' +
      'Az osztalékhozam évről évre változik; nemzetközi piacon is vannak stabil osztaléknövelő cégek. ' +
      'TBSZ-en tartva az osztalék is adómentes 5 év után!',
    isDynamic: false,
    tier: 'free',
  },

  {
    id: 'inv-bond-ladder',
    name: 'Kötvénylétra (államkötvények)',
    category: 'securities',
    description:
      'Különböző lejáratú államkötvények kombinációja (1, 2, 3, 5 éves). ' +
      'Minden évben lejár egy — újrabefektetheted magasabb kamaton. ' +
      'Stabilitás + rugalmasság egyben.',
    entryPrice: 500_000,
    monthlyPassiveIncome: 2_800, // game mechanic
    scores: {
      returnPotential: 35,
      liquidity: 50,
      safety: 90,
      inflationResistance: 60,
      returnSpeed: 50,
      accessibility: 80,
      volatility: 5,
    },
    realWorldSource: 'https://www.akk.hu',
    realWorldInfo:
      'A kötvénylétra stratégia: 500k-t 5 részre osztva 1-5 éves ÁKK kötvényekbe fektetsz. ' +
      'Minden évben lejár egy, amit újra befektetsz. ' +
      'Így mindig van likvid részed, és átlagolod a kamatokat.',
    isDynamic: true,
    dynamicDataKey: 'akk.pmapYield',
    tier: 'free',
  },

  {
    id: 'inv-freelance-platform',
    name: 'Freelance platform',
    category: 'business',
    description:
      'Regisztráció és profil-építés freelance platformon. ' +
      'A bevétel változó — a tudásodtól és az időráfordítástól függ. ' +
      'EUR/USD-ben fizet → forintgyengülés ellen is véd.',
    entryPrice: 100_000, // Profil, portfolio, kezdő projektek
    monthlyPassiveIncome: 0, // Változó, nem garantált
    scores: {
      returnPotential: 65,
      liquidity: 50,
      safety: 30,
      inflationResistance: 55,
      returnSpeed: 60,
      accessibility: 70,
      volatility: 55,
    },
    requiredKnowledge: 'know-freelance',
    realWorldSource: 'https://www.nav.gov.hu',
    realWorldInfo:
      'Magyar freelancerek átlagosan 15-40 EUR/órát keresnek IT/design területen. ' +
      'A bevétel átalányadóval adózható (45% költséghányad 2026-ban). ' +
      'A kifizetésekhez EUR-számla (bank vagy fintech devizaszámla) jól jöhet - nézd meg a díjakat és a felügyeletet!',
    isDynamic: false,
    tier: 'free',
  },

  {
    id: 'inv-health-fund',
    name: 'Egészségpénztár',
    category: 'education',
    description:
      'Befizetésed 20%-a adójóváírásként visszajön (max 150k/év, az ÖNYP-vel összesen!). ' +
      'Felhasználható: gyógyszer, szemüveg, fogorvos, magánorvos, gyógytorna.',
    entryPrice: 30_000,
    monthlyPassiveIncome: 0, // Adójóváírás, nem havi hozam
    scores: {
      returnPotential: 35,
      liquidity: 30,
      safety: 90,
      inflationResistance: 30,
      returnSpeed: 70,
      accessibility: 85,
      volatility: 0,
    },
    requiredKnowledge: 'know-insurance-advanced',
    realWorldSource: 'https://www.mnb.hu',
    realWorldInfo:
      'Az egészségpénztári befizetés 20%-a visszajár adójóváírásként. ' +
      'Több egészségpénztár közül választhatsz - a díjakat érdemes összehasonlítani. ' +
      'Kártyával közvetlenül fizethetsz patikában, optikusnál, fogorvosnál.',
    isDynamic: false,
    tier: 'premium',
  },

  {
    id: 'inv-remote-eur',
    name: 'Távmunka EUR fizetéssel',
    category: 'business',
    description:
      'Külföldi cégnek dolgozol remote, EUR-ban kapsz fizetést. ' +
      'A forint gyengülése automatikus béremelés — de a 183 napos adószabályra figyelj!',
    entryPrice: 200_000, // Képzés, portfolio, tech stack frissítés
    monthlyPassiveIncome: 80_000, // Extra a HUF fizetéshez képest
    scores: {
      returnPotential: 70,
      liquidity: 40,
      safety: 35,
      inflationResistance: 75,
      returnSpeed: 50,
      accessibility: 50,
      volatility: 40,
    },
    requiredKnowledge: 'know-eu-travel',
    realWorldSource: 'https://www.nav.gov.hu',
    realWorldInfo:
      'Magyar fejlesztők remote fizetése: 2 000-5 000 EUR/hó (egy euró most {{eur_huf}} Ft). ' +
      'Fontos: ha Magyarországon laksz, itt adózol. ' +
      'Átalányadóval optimalizálható (45% költséghányad EV-ként).',
    isDynamic: false,
    tier: 'premium',
  },

  {
    id: 'inv-coworking',
    name: 'Coworking bérlet (hálózatépítés)',
    category: 'education',
    description:
      'Coworking irodabérlet: nem csak munkahely, hanem hálózatépítési lehetőség. ' +
      'Startup események, networking esték, mentor programok.',
    entryPrice: 60_000, // 2-3 havi bérlet
    monthlyPassiveIncome: 0, // Közvetett hatás: networking → lehetőségek
    scores: {
      returnPotential: 30,
      liquidity: 90,
      safety: 85,
      inflationResistance: 20,
      returnSpeed: 50,
      accessibility: 80,
      volatility: 5,
    },
    realWorldSource: 'https://www.nav.gov.hu',
    realWorldInfo:
      'Budapesti coworking irodák havidíja jellemzően néhány tízezer forint. ' +
      'Vidéken olcsóbb: 15-40k Ft/hó. ' +
      'A bérlet költségként elszámolható vállalkozóként.',
    isDynamic: false,
    tier: 'free',
  },

  {
    id: 'inv-p2p-lending',
    name: 'P2P hitelezési platform',
    category: 'cash',
    description:
      'Peer-to-peer hitelezés: közvetlenül hitelezel más magánszemélyeknek vagy kisvállalkozásoknak. ' +
      'Magasabb hozam mint bankbetét, de nem garantált a visszafizetés.',
    entryPrice: 100_000,
    monthlyPassiveIncome: 800, // ~10% éves hozam átlagban
    scores: {
      returnPotential: 50,
      liquidity: 40,
      safety: 30,
      inflationResistance: 35,
      returnSpeed: 55,
      accessibility: 60,
      volatility: 40,
    },
    realWorldSource: 'https://www.mnb.hu',
    realWorldInfo:
      'Az EU-ban több P2P hitelezési platform működik. ' +
      'A meghirdetett hozam magas lehet, de kockázatos (hitelnemfizetés, a platform csődje). Nincs OBA-védelem! ' +
      'EU-ban ECSP szabályozás alatt áll. A hozam 15% SZJA-köteles.',
    isDynamic: false,
    tier: 'free',
  },

  {
    id: 'inv-rental-apartment',
    name: 'Kiadó lakás (befektetési célú)',
    category: 'real_estate',
    description:
      'Lakásvásárlás és bérbeadás. Magas belépési küszöb, de stabil havi jövedelem ' +
      'és hosszú távú értéknövekedés. A bérleti hozam a vételártól és a lakbértől függ.',
    entryPrice: 8_000_000, // Önerő + járulékos költségek
    monthlyPassiveIncome: 120_000,
    scores: {
      returnPotential: 55,
      liquidity: 15,
      safety: 60,
      inflationResistance: 70,
      returnSpeed: 25,
      accessibility: 20,
      volatility: 20,
    },
    requiredKnowledge: 'know-real-estate',
    realWorldSource: 'https://www.ksh.hu',
    realWorldInfo:
      'Budapesten a használt lakások átlagos ára most {{sqm_bp}} Ft/m². ' +
      'Egy kétszobás lakás átlagos bérleti díja {{rent_bp_2room}} Ft/hó. ' +
      'Bérleti jövedelem 15% SZJA-köteles (tételes vagy 10% átalány költségelszámolás). ' +
      'Rövid távú kiadáshoz NTAK regisztráció kötelező.',
    isDynamic: true,
    dynamicDataKey: 'realEstate.budapestRentAvg',
    tier: 'premium',
  },
];

/** A szövegekben a {{változók}} a heti élő adatokból kapják az értéküket (src/data/live/vars.ts) */
export const INVESTMENT_OPTIONS: InvestmentOption[] = fillDeep(INVESTMENT_OPTIONS_RAW);

/** Ingyenes befektetesek */
export const FREE_INVESTMENTS = INVESTMENT_OPTIONS.filter(
  (inv) => inv.tier === 'free'
);

/** Premium befektetesek */
export const PREMIUM_INVESTMENTS = INVESTMENT_OPTIONS.filter(
  (inv) => inv.tier === 'premium'
);

/** Befektetesek kategoria szerint */
export const INVESTMENTS_BY_CATEGORY = INVESTMENT_OPTIONS.reduce(
  (acc, inv) => {
    if (!acc[inv.category]) acc[inv.category] = [];
    acc[inv.category].push(inv);
    return acc;
  },
  {} as Record<string, InvestmentOption[]>
);
