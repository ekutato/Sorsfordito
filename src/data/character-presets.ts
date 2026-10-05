// ============================================================================
// PENZUGYI SORSFORDITO - Life Situation Presets
// A harom elethelyzet induloallapota, valos magyar adatokra kalibrálva
//
// FONTOS: Ezek NEM fix karakterek - a játékos maga adja meg a nevét.
// A presetek életheyzeteket definiálnak (pályakezdő, diák, örökség),
// a játékos pedig a saját nevével és avatarjával játszik.
// ============================================================================

import type { CharacterPreset } from '@/types/game';

/**
 * A preset NEM = karakter. A játékos a sajat nevet adja meg,
 * es valaszt egy indulo elethelyzetet.
 *
 * A UI-ban pl.:
 * "Üdv, [NÉV]! Válaszd ki az indulóhelyzetedet:"
 * - 🎓 Érettségi után (18 év, nulláról indulsz)
 * - 💼 Pályakezdő (24 év, első fizetés, diákhitel)
 * - 🏠 Örökség (30 év, 5M Ft + telek, személyi kölcsön)
 */
export const LIFE_SITUATION_PRESETS: Record<string, CharacterPreset> = {

  // --- 18 eves, erettsegi utani utelagazas ---
  fresh_start: {
    id: 'fresh_start',
    name: 'Érettségi után',       // Ez a preset neve, NEM a jatekos neve
    age: 18,
    tagline: 'Tiszta lappal indulsz',
    description:
      'Nulla adósság, nulla jövedelem. ' +
      'Az első döntésed a pályaválasztás, ami az egész játék hozam- és kockázati görbéjét meghatározza.',
    avatar: '🎓',
    location: {
      homeCity: 'Győr',
      homeDetail: 'Szülőknél lakik, családi ház',
      homeCounty: 'Győr-Moson-Sopron',
      // Még nincs munkahelye – a pályaválasztás az 1. döntés
    },
    startingFinancials: {
      balance: 120_000,     // Diakamunkabol
      salary: 0,            // Egyelore nincs
      housing: 0,           // Szuloknel lakik
      utilities: 0,
      food: 0,
      transport: 0,
      other: 15_000,        // Minimalis (telefon, szemelyes)
      debts: [],
    },
    mainThemes: [
      'Pályaválasztás (egyetem vs. szakma vs. munka)',
      'Diákhitel döntés',
      'Első megtakarítás stratégia',
      'Szülőktől való anyagi függetlenedés',
    ],
    difficulty: 1,
    tier: 'free',  // TODO: premium a véglegesben
  },

  // --- 24 eves, elso fizetes, alberlet, diakhitel ---
  career_start: {
    id: 'career_start',
    name: 'Pályakezdő',
    age: 24,
    tagline: 'Első fizetés, albérlet, pályakezdés',
    description:
      'Junior fejlesztőként dolgozol, a bevételed pozitív, de szűkös. ' +
      'A játék fő kérdése: hogyan csinálsz ebből valamit?',
    avatar: '💼',
    location: {
      homeCity: 'Budapest',
      homeDetail: 'Albérletben lakik (egyedül)',
      homeCounty: 'Budapest',
      homeDistrict: 'VIII. kerület',
      originCity: 'Kecskemét',         // Szülők háza — az 1. döntés: maradás vs. visszaköltözés
      originCounty: 'Bács-Kiskun',
      workCity: 'Budapest',
      workDistrict: 'IX. kerület',
      workDetail: 'Junior fejlesztő, tech startup',
      commuteMinutes: 25,              // Bp-n belül: VIII. → IX. kerület
      commuteMethod: 'BKK (villamos + metró)',
    },
    startingFinancials: {
      balance: 85_000,
      salary: 320_000,          // Junior pozicio netto
      housing: 180_000,         // Albérlet
      utilities: 35_000,        // Rezsi
      food: 50_000,             // Élelmiszer
      transport: 20_000,        // Közlekedés
      other: 30_000,            // Telefon, szórakozás, ruha
      debts: [],  // DH2 nem alapértelmezett — a játékos a dani-d03 döntésnél választja
    },
    mainThemes: [
      'Szűkös cashflow kezelése',
      'Diákhitel-törlesztés stratégia',
      'Első befektetések',
      'Karrierépítés vs. életminőség',
    ],
    difficulty: 2,
    tier: 'free', // Ez az ingyenes preset
  },

  // --- 30 eves, varatlan orokseg, nehez dontes ---
  inheritance: {
    id: 'inheritance',
    name: 'Váratlan örökség',
    age: 30,
    tagline: 'Nagy összeg, nagy felelősség',
    description:
      'Van miből dönteni, de rossz döntéssel könnyen elpazarolhatod. ' +
      'A telek külön döntési ág (eladni vs. fejleszteni vs. megtartani).',
    avatar: '🏠',
    location: {
      homeCity: 'Budapest',
      homeDetail: 'Albérletben lakik (egyedül)',
      homeCounty: 'Budapest',
      homeDistrict: 'XI. kerület',     // Újbuda
      workCity: 'Budapest',
      workDistrict: 'V. kerület',      // Belváros
      workDetail: 'Marketinges, közepes cégnél',
      commuteMinutes: 25,
      commuteMethod: 'BKK (4-es metró + séta)',
    },
    startingFinancials: {
      balance: 5_650_000,       // 650K megtakaritas + 5M orokseg
      salary: 420_000,          // Közepes pozicio netto
      housing: 220_000,         // Bp. albérlet
      utilities: 40_000,        // Rezsi
      food: 60_000,             // Élelmiszer
      transport: 25_000,        // Közlekedés
      other: 25_000,            // Egyéb
      debts: [
        {
          type: 'personal_loan',
          amount: 1_800_000,
          interestRate: 12.5,    // Piaci szemelyi kolcson kamat
          monthlyPayment: 42_000,
        },
      ],
    },
    mainThemes: [
      'Lump-sum befektetési döntés (5M Ft)',
      'Adósságtörlesztés vs. befektetés',
      'Ingatlan (vidéki telek) kezelése',
      'Vállalkozás indítása',
    ],
    difficulty: 3,
    tier: 'free',  // TODO: premium a véglegesben
  },
};

// Alias az atallashoz (regebb tipusok kompatibilitas)
export const CHARACTER_PRESETS = LIFE_SITUATION_PRESETS;

/** Ingyenes presetek */
export const FREE_PRESETS = Object.values(LIFE_SITUATION_PRESETS).filter(
  (p) => p.tier === 'free'
);

/** Premium presetek */
export const PREMIUM_PRESETS = Object.values(LIFE_SITUATION_PRESETS).filter(
  (p) => p.tier === 'premium'
);

/** Nehezseg szerint rendezve (UI-hoz) */
export const PRESETS_BY_DIFFICULTY = Object.values(LIFE_SITUATION_PRESETS).sort(
  (a, b) => a.difficulty - b.difficulty
);
