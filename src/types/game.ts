// ============================================================================
// PENZUGYI SORSFORDITO - Game State & Mechanics Types
// A jatek allapota, korok, dontesek, sorsforditok
// ============================================================================

import type { DebtType, FinancialSheet, HUF, Percentage } from './financial';
import type { WellbeingTarget } from './wellbeing';
import type { Requires } from '@/engine/situation';

// --- Jatek allapot ---

export type GamePhase =
  | 'setup'           // Karakter- es modvalasztas
  | 'playing'         // Aktiv jatek
  | 'round_income'    // Kor eleji bevetel
  | 'round_expenses'  // Kiadások levonasa
  | 'round_decision'  // Dontes kartya
  | 'round_invest'    // Opcionalis befektetes/tudas
  | 'round_fate'      // Sorsfordito kartya
  | 'round_summary'   // Kor osszesites
  | 'crisis'          // Valsagkezeles (egyenleg < 0)
  | 'epilogue'        // Jatek vege, ertekeles
  | 'report';         // Penzugyi riportkartya

export type TimeScale = 'sprint' | 'marathon' | 'ultra';

export type GameMode = 'solo' | 'competitive' | 'cooperative';

export interface GameConfig {
  timeScale: TimeScale;
  mode: GameMode;
  playerCount: number;

  /** Elo adatok hasznalata (true) vagy mock adatok (false) */
  useLiveData: boolean;

  /** A jatek kezdo datuma (valoságos, pl. "2026-03") */
  startDate: string;

  /** Játékmesteri szabályok - indításkor rögzülnek, a játék alatt nem változnak */
  rules?: GameRules;

  /** Asztali játék: a szoba, és a közös mezőkártya-pakli adatai */
  table?: { roomCode: string; deckSeed?: number; slot?: number };

  /** Saját helyzet (játékmesteri engedéllyel): életkor, induló tőke, havi bevétel és kiadás */
  customProfile?: CustomProfile;
}

/** A játékos saját helyzete; a választott karakter története (döntései) adja a játékmenetet */
export interface CustomProfile {
  age: number;
  balance: number;
  salary: number;
  housing: number;
  utilities: number;
  food: number;
  transport: number;
  other: number;
}

export interface GameRules {
  /** Egyéni kezdő egyenleg a karakter felső határáig */
  customStartBalance: boolean;
  /** "Valós helyzet modellezése": a bevétel és a kiadás szerkeszthető */
  allowIncomeExpenseEdit: boolean;
  /** Csapdaóra másodpercben (0 = kikapcsolva) */
  trapTimerSeconds: 0 | 10 | 20 | 30;
  /** A kocka forrása: az app kriptográfiai véletlenje vagy saját, fizikai kocka */
  diceSource: 'app' | 'physical';
  /** Tesztmód: korlátlan egyenleg, kézi kockaérték, mezőugrás, körátugrás */
  testMode: boolean;
  /** Saját helyzet megadása (életkor, induló tőke, bevétel, kiadás); asztalnál a játékmester hagyja jóvá */
  customProfile?: boolean;
}

export const DEFAULT_RULES: GameRules = {
  customStartBalance: false,
  allowIncomeExpenseEdit: false,
  trapTimerSeconds: 20,
  diceSource: 'app',
  testMode: false,
  customProfile: false,
};

/** Tesztmódban a kezdő egyenleg felső határa */
export const TEST_MODE_MAX_BALANCE = 20_000_000;

export interface TimeScaleConfig {
  /** Hany kort tartalmaz */
  totalRounds: number;

  /** Egy kor hany honapot fed le */
  monthsPerRound: number;

  /** Megjelenitett nev */
  displayName: string;

  /** Rovid leiras */
  description: string;

  /** Inflaciot szamolunk-e */
  applyInflation: boolean;

  /** Karrieriv esemenyeket szamolunk-e */
  applyCareerProgression: boolean;
}

export const TIME_SCALE_CONFIGS: Record<TimeScale, TimeScaleConfig> = {
  sprint: {
    totalRounds: 12,
    monthsPerRound: 1,
    displayName: 'Sprint (1 év)',
    description: 'Gyors, intenzív, taktikai. 12 hónap, havi döntések.',
    applyInflation: false,
    applyCareerProgression: false,
  },
  marathon: {
    totalRounds: 20,
    monthsPerRound: 3,
    displayName: 'Maraton (5 év)',
    description: 'Stratégiai. A befektetések elkezdik kitermelni magukat.',
    applyInflation: true,
    applyCareerProgression: true,
  },
  ultra: {
    totalRounds: 20,
    monthsPerRound: 6,
    displayName: 'Ultra (10 év)',
    description: 'Nagystratégia. Kamatos kamat, karrierváltás, féléves döntések.',
    applyInflation: true,
    applyCareerProgression: true,
  },
};

export interface GameState {
  /** Egyedi jatek azonosito */
  gameId: string;

  /** Jatek konfiguracio */
  config: GameConfig;

  /** Aktualis fazis */
  phase: GamePhase;

  /** Aktualis kor (1-tol indul) */
  currentRound: number;

  /** Aktualis jatek-datum (pl. "2026-05") */
  currentGameDate: string;

  /** Jatekosok penzugyi lapjai */
  players: PlayerState[];

  /** Aktiv jatekos indexe (solo modban mindig 0) */
  activePlayerIndex: number;

  /** Jatek soran bekovetkezo esemenyek logja */
  eventLog: GameEvent[];

  /** Aktualis dontes (ha a fazis 'round_decision') */
  currentDecision?: DecisionCard;

  /** Aktualis sorsfordito (ha a fazis 'round_fate') */
  currentFateEvent?: FateEvent;

  /** Valsagkezelo allapot (ha a fazis 'crisis') */
  crisisState?: CrisisState;

  /** Jatek vege eredmeny */
  result?: GameResult;

  /** Táblás mód (egyjátékos): bábu helyzete, dobás, mezőkártya */
  board?: SoloBoardState;

  /** A körök húzott sorskártyái (kör → kártya), hogy újratöltéskor ne változzon és ne ismétlődjön */
  fateDraws?: Record<number, string>;

  /** Asztali játékban: melyik fordulót jelentette késznek a játékos (a közös körzáráshoz) */
  tableDoneRound?: number;

  /** T-90 gazdasagi kontextus (elo adatok, hir-generalt sorsforditok) */
  preGameContext?: import('../data-sources/types').PreGameContext;
}

export interface PlayerState {
  /** Jatekos ID */
  playerId: string;

  /** Jatekos altal megadott nev (a jatek soran ezt hasznaljuk) */
  name: string;

  /** Valasztott elethelyzet preset (vagy 'custom' sajat adatokkal) */
  lifeSituation: LifeSituationId | 'custom';

  /** Penzugyi Lap */
  financialSheet: FinancialSheet;

  /** Freemium szint */
  tier: 'free' | 'premium';
}

// --- Karakter presetek ---

/** Regi alias – kompatibilitas */
export type CharacterPresetId = LifeSituationId;

/** Elethelyzet preset azonositok */
export type LifeSituationId = 'fresh_start' | 'career_start' | 'inheritance';

export interface CharacterPreset {
  id: CharacterPresetId;
  name: string;
  age: number;
  /** Hány hónap múlva van a következő születésnapja a játék kezdetétől (1-12); a 25.-nél megszűnik a fiatalok SZJA-kedvezménye */
  nextBirthdayInMonths?: number;
  tagline: string;
  description: string;
  avatar: string; // emoji or image path

  /** Lakóhely és munkahely – a játék kezdő kontextusának része */
  location: {
    homeCity: string;          // Jelenlegi lakóhely: "Budapest"
    homeDetail: string;        // pl. "albérletben lakik" vagy "szülőknél lakik"
    homeCounty: string;        // pl. "Budapest" vagy "Bács-Kiskun"
    homeDistrict?: string;     // pl. "XI. kerület" (ha Bp.)
    originCity?: string;       // Szülők lakóhelye (ha ≠ homeCity): "Kecskemét"
    originCounty?: string;     // pl. "Bács-Kiskun"
    workCity?: string;         // pl. "Budapest" (undefined ha nincs munka)
    workDistrict?: string;     // pl. "IX. kerület" (csak ha Budapest)
    workDetail?: string;       // pl. "tech startup"
    commuteMinutes?: number;   // egy irány, percben
    commuteMethod?: string;    // pl. "vonat (InterCity)" vagy "BKK (metró + busz)"
  };

  /** Induló penzugyi adatok */
  startingFinancials: {
    balance: HUF;
    salary: HUF;
    housing: HUF;
    utilities: HUF;
    food: HUF;
    transport: HUF;
    other: HUF;
    debts: Array<{
      type: string;
      amount: HUF;
      interestRate: Percentage;
      monthlyPayment: HUF;
    }>;
  };

  /** A fő dontesi temak */
  mainThemes: string[];

  /** Nehezsegi szint (1-3) */
  difficulty: 1 | 2 | 3;

  /** Egyéni kezdő egyenleg felső határa (ha a játékmester engedi) */
  maxStartBalance?: HUF;

  /** Freemium tier */
  tier: 'free' | 'premium';
}

// --- Dontes kartyak ---

export interface DecisionCard {
  id: string;

  /** Kor / fő tema (pl. "Lakhatas", "Karriervaltas") */
  category: string;

  /** Cim */
  title: string;

  /** Szituacio leiras */
  situation: string;

  /** Dinamikus valtozok ({{city_rent}} -> valos adattal helyettesitodik) */
  dynamicVariables?: Record<string, string>;

  /** Valasztasi lehetosegek (2-3 db) */
  options: DecisionOption[];

  /** Melyik karakter presetekhez tartozik */
  characterPresets: CharacterPresetId[];

  /** Melyik kor(ok)ben jelenik meg */
  /** Feltétel: a játékos helyzete (engine/situation.ts, közös a kártyákkal) */
  requires?: Requires;
  availableAtRounds: number[];

  /** Elofeltetelek (korabbi dontesek) */
  prerequisites?: {
    /** Szukseges korabbi dontes ID-k */
    requiredDecisions?: string[];
    /** Szukseges Tudas kartya ID-k */
    requiredKnowledge?: string[];
    /** Minimum egyenleg */
    minimumBalance?: HUF;
  };
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;

  /** Azonnali penzugyi hatasok */
  financialEffects: FinancialEffect[];

  /** Tartos hatasok (tobb koron at) */
  ongoingEffects?: OngoingEffect[];

  /** Kovetkezo Dontes kartya ID (ha van elagazas) */
  nextDecisionId?: string;

  /** Befektetesi lehetoseg feloldasa */
  unlocksInvestment?: string[];

  /** Tudas kartya feloldasa */
  unlocksKnowledge?: string[];

  /** Valódi befektetés a döntésből (a portfólióba kerül, az összeg az egyenlegből megy) */
  invests?: Array<{ optionId: string; amount: HUF }>;

  /** Hitelfelvétel valódi tartozásként (a törlesztő a tartozásból jön, lejáratkor megszűnik) */
  takesLoan?: LoanSpec;

  /** Százalékos fizetésemelés a mostani fizetésből (pl. 20 = +20%) */
  raisesSalaryPct?: number;

  /** Az eddigi fizetés helyére lép (munkahelyváltás, felmondás: 0) - nem adódik hozzá a régihez */
  setsSalary?: { amount: HUF; description: string };

  /** Hitel előtörlesztése (amount nélkül: teljes végtörlesztés) */
  paysOffLoan?: { type?: DebtType; amount?: HUF };

  /** Hitel módosítása (pl. kiváltás: alacsonyabb törlesztő) */
  adjustsLoan?: { type?: DebtType; paymentDelta: HUF; ratePct?: number };

  /** Csak akkor választható, ha korábban ezek egyikét választotta (pl. kollégium: tanuló) */
  requires?: Requires;

  /** Tartós vagyontárgy (lakás, autó, üzletrész): a nettó vagyonban szerepel */
  acquiresAsset?: {
    id: string; name: string; value: HUF;
    /** Az érték a hitel tőkéjével nő (önerő + hitel = vételár) */
    plusLoanPrincipal?: boolean;
    /** Havi passzív bevétel (pl. kiadás) */
    monthlyIncome?: HUF;
  };

  /** Rovid „Tudtad?" szoveg (valos tudasblokk) */
  didYouKnow?: string;
}

/**
 * Hitel a döntésből. A három közül kettő megadása elég (a harmadik annuitással számolódik):
 * tőke (principal), havi törlesztő (monthlyPayment), futamidő (months). A kamat fix vagy a heti csomagból (rateKey).
 */
export interface LoanSpec {
  name: string;
  type: DebtType;
  principal?: HUF;
  monthlyPayment?: HUF;
  months?: number;
  /** Éves kamat / THM (%) */
  ratePct?: number;
  /** Heti élő adat kulcsa (pl. 'bank.mortgageThm') - elsőbbséget élvez a ratePct-vel szemben */
  rateKey?: string;
  /** A hitelösszeg a számlára érkezik (személyi kölcsön, Babaváró); lakás/autó esetén az eladóhoz megy */
  disburse?: boolean;
  /** Havonta folyósított hitel (pl. Diákhitel1): a tartozás a folyósítással nő, a törlesztés később indul */
  monthlyDraw?: HUF;
}

export interface FinancialEffect {
  /** Melyik mezot modositja */
  target:
    | 'balance'          // Egyszeri egyenleg valtozas
    | 'salary'           // Havi fizetes valtozas
    | 'housing'          // Lakhatasi koltseg valtozas
    | 'utilities'        // Rezsi valtozas
    | 'food'             // Elelmiszer valtozas
    | 'transport'        // Kozlekedes valtozas
    | 'loanPayments'     // Hiteltorlesztes valtozas
    | 'other'            // Egyeb kiadas valtozas
    | WellbeingTarget;   // Jólléti jelölő (pont, nem Ft)

  /** Valtozas osszege (pozitiv = novekmeny, negativ = csokkenes) */
  amount: HUF;

  /** Dinamikus-e? Ha igen, valos adatbol szamolodik */
  isDynamic?: boolean;
  dynamicDataKey?: string;

  /** Leiras a jatekosnak */
  description: string;
}

export interface OngoingEffect {
  /** Melyik mezot erinti */
  target: string;

  /** Havi valtozas */
  monthlyAmount: HUF;

  /** Hany korig tart (-1 = jatek vegeig) */
  durationRounds: number;

  /** Leiras */
  description: string;

  /** Hany kor mulva lep eletbe (opcionalis) */
  startAfterRounds?: number;
  /** Késleltetés hónapban (a kör hosszához igazítva) */
  startAfterMonths?: number;
  /** Időtartam hónapban (a kör hosszához igazítva; a durationRounds helyett) */
  durationMonths?: number;
}

// --- Sorsfordito esemenyek ---

export type FateEventType = 'positive' | 'negative' | 'decision';

export type FateEventSource = 'scripted' | 'news_generated';

export interface FateEvent {
  id: string;
  title: string;
  description: string;
  type: FateEventType;
  source: FateEventSource;

  /** Ha hir-generalt: az eredeti hir forras URL */
  newsSourceUrl?: string;

  /** Ha hir-generalt: a hir rovid osszefoglalasa */
  newsSummary?: string;

  /** Penzugyi hatasok */
  financialEffects: FinancialEffect[];

  /** Ha 'decision' tipusu: valasztasi lehetosegek */
  decisionOptions?: FateDecisionOption[];

  /** Tudáspróba: a játékos csak akkor kapja meg a jutalmat, ha helyesen válaszol */
  knowledgeCheck?: {
    /** Szükséges tudáskártya ID (pl. 'know-tax') */
    requiredKnowledgeId: string;
    /** Kvíz kérdés (más, mint a kártya-vásárláskori!) */
    quiz: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    };
    /** Jutalom helyes válasz esetén */
    successEffects: FinancialEffect[];
    /** Üzenet, ha nincs meg a tudáskártya */
    noKnowledgeMessage: string;
    /** Üzenet, ha rosszul válaszol */
    failureMessage: string;
  };
}

export interface FateDecisionOption {
  id: string;
  label: string;
  description: string;
  financialEffects: FinancialEffect[];
}

// --- Valsagkezeles ---

export interface CrisisState {
  /** Mennyi a hiany */
  deficit: HUF;

  /** Elerheto valszagkezelesi opciok */
  options: CrisisOption[];
}

export interface CrisisOption {
  id: string;
  name: string;
  description: string;

  /** Azonnali penz (a hiany fedezesere) */
  immediateRelief: HUF;

  /** Ara (havi torleszto, veszitett ido, stb.) */
  cost: FinancialEffect[];

  /** Tanulsag */
  lesson: string;
}

// --- Jatek vege ---

export type EpilogueId =
  | 'financial_ninja'    // Passziv jov > kiadás → GOLD
  | 'smart_squirrel'     // Netto vagyon > 5M, aktiv > passziv → SILVER
  | 'wise_owl'           // Vagyon kozepes, 4+ Tudas kartya → SILVER
  | 'survivor'           // Egyenleg > 0, nincs befektetes → BRONZE
  | 'debt_trap_knight'   // Adossag > netto vagyon → FAIL
  | 'yolo_champion'      // Egyenleg < 0, netto vagyon < 0 → FAIL
  | 'bankruptcy';        // Sulyos csőd: egyenleg < -1M VAGY nettó vagyon < -3M → FAIL

export type VictoryLevel = 'fail' | 'bronze' | 'silver' | 'gold';

export interface GameResult {
  /** Gyozelmi szint */
  victoryLevel: VictoryLevel;

  /** Epilogus azonosito */
  epilogueId: EpilogueId;

  /** Epilogus szoveg */
  epilogueText: string;

  /** Penzugyi Riportkartya */
  reportCard: ReportCard;

  /** Személyre szabott tanacsok */
  personalizedAdvice: string[];

  /** Valos cselekvesi terv (3 konkret lepes) */
  actionPlan: ActionStep[];
}

export interface ReportCard {
  /** Osszes Penzugyi IQ (0-100) */
  financialIQ: number;

  /** Reszpontszamok */
  scores: {
    /** Netto vagyon novekedes */
    wealthGrowth: number;
    /** Bevetel-kiadas arany */
    incomeExpenseRatio: number;
    /** Diverzifikacio (hany kul. befektetes) */
    diversification: number;
    /** Tudas (hany Tudas kartya) */
    knowledgeScore: number;
    /** Kockazati profil */
    riskProfile: number;
    /** Valsagkezelesi kepesseg */
    crisisManagement: number;
  };

  /** Indulo vs vegso osszehasonlitas */
  comparison: {
    startingNetWorth: HUF;
    endingNetWorth: HUF;
    startingIncome: HUF;
    endingIncome: HUF;
    startingPassiveIncome: HUF;
    endingPassiveIncome: HUF;
  };
}

export interface ActionStep {
  /** Sorszam (1-3) */
  order: number;
  /** Mit csináljon holnap a jatekos */
  title: string;
  /** Reszletes leiras */
  description: string;
  /** Valos link (pl. akk.hu, bet.hu) */
  url?: string;
}

// --- Jatek esemenyek log ---

export interface GameEvent {
  /** Kor szama */
  round: number;
  /** Idopont */
  gameDate: string;
  /** Esemeny tipusa */
  type: 'income' | 'expense' | 'decision' | 'investment' | 'fate' | 'crisis' | 'knowledge' | 'field';
  /** Leiras */
  description: string;
  /** Penzugyi hatas (ha volt) */
  financialImpact?: HUF;
  /** Reszletek */
  details?: Record<string, unknown>;
}


// --- Táblás mód (egyjátékos) ---

/** app = kriptográfiai véletlen, physical = saját kocka, test = tesztmódban kézzel választott */
export type DiceRollSource = 'app' | 'physical' | 'test';

export interface SoloBoardState {
  /** A bábu mezője (0-23) */
  position: number;
  /** Az utolsó dobás */
  lastRoll?: number;
  /** Honnan lépett a bábu az utolsó dobásnál (a lépésanimációhoz) */
  from?: number;
  /** Melyik körben dobott utoljára (körönként egy dobás) */
  rolledRound?: number;
  /** Dobás után a nagy tábla nyitva marad, amíg a játékos a "Tovább" gombra nem nyom */
  awaitingContinue?: boolean;
  /** A játék összes dobása sorrendben, a forrással együtt */
  rolls?: Array<{ value: number; source: DiceRollSource }>;
  /** A mezőkártya lezárva ebben a körben */
  resolvedRound?: number;
  /** Mezőtípusonként hányszor járt ott (a kártyák ismétlés nélkül körbejárnak) */
  visits: Record<string, number>;
  /** A mezőkártya választásának eredménye (a kártyán megjelenítve) */
  lastOutcome?: string;
  /** A választás részletei a nagy eredménylaphoz */
  lastResult?: {
    field: string;
    title: string;
    choice: string;
    effects: Array<{ target: string; amount: number }>;
    realStep: string;
    sourceUrl?: string;
    reflection?: { keys: import('./wellbeing').WellbeingKey[]; prompt: string };
  };
  /** Az eredménylap nyitva, amíg a játékos a "Tovább" gombra nem nyom */
  awaitingOutcomeAck?: boolean;
  /** Időleges kiadás-hatások visszaállítása (pl. részletfizetés vége) */
  /** Ütemezett hatások (lejáró időleges kiadás, késleltetett béremelés, lejáró ellátás) - a kör elején */
  reverts: Array<{ atRound: number; target: string; amount: number; label?: string }>;
}
