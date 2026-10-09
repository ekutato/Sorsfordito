// ============================================================================
// PENZUGYI SORSFORDITO - Core Financial Types
// A jatekos penzugyi allapotat leiro tipusok
// ============================================================================

import type { Wellbeing } from './wellbeing';

/** Penznem - minden osszeg Ft-ban */
export type HUF = number;

/** Szazalek (0-100) */
export type Percentage = number;

/** Pontszam (0-100) a befektetesi ertekelesi rendszerben */
export type Score = number;

// --- Penzugyi Lap (Financial Sheet) ---

/** A jatekos teljes penzugyi allapota - a jatek kozponti state-je */
export interface FinancialSheet {
  /** Jatekos azonosito */
  playerId: string;

  /** Aktualis egyenleg (keszpenz + szamlan levo penz) */
  balance: HUF;

  /** Bevetel reszletezve */
  income: Income;

  /** Kiadas reszletezve */
  expenses: Expenses;

  /** Befektetesi portfolio */
  investments: Investment[];

  /** Adossagok */
  debts: Debt[];

  /** Megszerzett Tudas kartyak ID-i */
  acquiredKnowledge: string[];

  /** Függőben lévő sztorivonalak (pl. barát kölcsönkér → visszafizet vagy sem) */
  pendingStorylines: PendingStoryline[];

  /** Aktív tartós hatások (döntésekből származó havi bevétel/kiadás változások) */
  activeOngoingEffects: ActiveOngoingEffect[];

  /** Jólléti jelölők (-5..+5); régi mentésekben hiányozhat */
  wellbeing?: Wellbeing;

  /** Induló egyenleg (a játék elején, a kimutatásokhoz) */
  startBalance?: HUF;

  /** Betöltötte a 25. évét a játék alatt: a fiatalok SZJA-kedvezménye megszűnt (egyszer fut le) */
  youthTaxEnded?: boolean;

  /** Szamitott ertekek (minden kor vegen ujraszamolva) */
  computed: ComputedFinancials;

  /** Penzugyi tortenelem (minden kor vegen snapshot) */
  history: FinancialSnapshot[];
}

export interface Income {
  /** Havi netto munkaberbol */
  salary: HUF;

  /** Passziv jovedelem (befektetesekbol, automatikusan szamolva) */
  passive: HUF;

  /** Alkalmi / egyszeri bevetelek (Sorsforditobol, doentesbol) */
  oneTime: HUF;
}

export interface Expenses {
  /** Lakhatas (alberlet VAGY hiteltorleszto VAGY szuloknel lako hozzajarulas) */
  housing: HUF;

  /** Rezsi (viz, gaz, aram, internet) */
  utilities: HUF;

  /** Elelmiszer */
  food: HUF;

  /** Kozlekedes */
  transport: HUF;

  /** Hiteltorlesztes (kulon a lakhatastol - szemelyi kolcson, diakhitel) */
  loanPayments: HUF;

  /** Egyeb (telefon, szorakozas, ruha) */
  other: HUF;
}

export interface ComputedFinancials {
  /** Havi bevetelek osszege */
  totalIncome: HUF;

  /** Havi kiadasok osszege */
  totalExpenses: HUF;

  /** Szabad cashflow = bevetelek - kiadasok */
  freeCashflow: HUF;

  /** Befektetesek teljes erteke (aktualis piaci arfolyamon) */
  investmentValue: HUF;

  /** Adossagok teljes osszege */
  totalDebt: HUF;

  /** Netto vagyon = egyenleg + befektetesek - adossagok */
  netWorth: HUF;

  /** Penzugyi szabadsag szazalek = passziv jovedelem / kiadasok * 100 */
  financialFreedomPercent: Percentage;

  /** Veszhelyzeti alap honapokban = egyenleg / havi kiadasok */
  emergencyFundMonths: number;
}

export interface FinancialSnapshot {
  /** Melyik korben keszult */
  round: number;

  /** Idopont a jatekban (pl. "2026-03") */
  gameDate: string;

  /** Egyenleg a kor vegen */
  balance: HUF;

  /** Netto vagyon a kor vegen */
  netWorth: HUF;

  /** Szabad cashflow ebben a korben */
  freeCashflow: HUF;

  /** Passziv jovedelem ebben a korben */
  passiveIncome: HUF;

  /** Befektetések tételesen a kör végén (régi mentésekben hiányozhat) */
  investments?: Array<{ optionId: string; invested: HUF; value: HUF; change: HUF; monthlyIncome: HUF; reason?: string }>;
}

// --- Befektetesek ---

export type InvestmentCategory =
  | 'securities'    // Ertekpapir (PMAP, ETF, reszveny)
  | 'cash'          // Penz (bankbetet, kripto)
  | 'real_estate'   // Ingatlan
  | 'business'      // Vallalkozas
  | 'commodity'     // Targy (arany, mukincs)
  | 'education';    // Tudas (kepzes, tanfolyam - befekteteskent)

/** Befektetesi lehetoseg leirasa */
export interface InvestmentOption {
  id: string;
  name: string;
  category: InvestmentCategory;
  description: string;

  /** Beleptesi ar (mennyibe kerul megvasarolni) */
  entryPrice: HUF;

  /** Havi passziv jovedelem (fix vagy becsult) */
  monthlyPassiveIncome: HUF;

  /** 6 szempontos pontozas */
  scores: InvestmentScores;

  /** Szukseges Tudas kartya ID (ha van) - nelkule nem vasarolhato */
  requiredKnowledge?: string;

  /** Valos magyar forras URL */
  realWorldSource: string;

  /** Rovid valos tudasblokk a kartya hatuljahoz */
  realWorldInfo: string;

  /** Dinamikus-e? Ha igen, az adat valós forrasbol jon */
  isDynamic: boolean;

  /** Ha dinamikus: milyen adat-kulcsot hasznal */
  dynamicDataKey?: string;

  /** Freemium: ingyenes vagy premium? */
  tier: 'free' | 'premium';
}

export interface InvestmentScores {
  /** Hozam(potencial) - mennyit kereshet rajta */
  returnPotential: Score;

  /** Likviditas - milyen gyorsan tudja penzzé tenni */
  liquidity: Score;

  /** Biztonsag - mennyire kockazatos */
  safety: Score;

  /** Inflacioallossag - mennyire vedi az erteket inflacio ellen */
  inflationResistance: Score;

  /** Megterulesi sebesseg - milyen gyorsan jon vissza a befektetes */
  returnSpeed: Score;

  /** Piaci hozzaferhetoseg - mennyire konnyu hozzajutni */
  accessibility: Score;

  /** Volatilitas - mennyire ingadozik az ertek (uj szempont!) */
  volatility: Score;
}

/** A jatekos altal birtokolt konkret befektetes */
export interface Investment {
  /** A befektetesi lehetoseg ID-ja */
  optionId: string;

  /** Vasarlasi ar */
  purchasePrice: HUF;

  /** Vasarlas idopontja (jatek kor) */
  purchasedAtRound: number;

  /** Aktualis piaci ertek (dinamikusan szamolva) */
  currentValue: HUF;

  /** Eddig termelt osszesitett jovedelem */
  totalIncomeGenerated: HUF;

  /** Havi hatás vásárláskor rögzítve (eladáskor ugyanennyit vonunk vissza) */
  monthlyIncome?: HUF;
  /** Hová hat: passzív jövedelem, fizetés vagy rezsi (csökkentés) */
  incomeTarget?: 'passive' | 'salary' | 'utilities';

  /** Tartós vagyontárgy neve (lakás, autó, üzletrész) - nem a piaci kínálatból */
  assetName?: string;

  /** Az utolsó értékváltozás (Ft), oka és köre - a havi kimutatáshoz */
  lastChange?: HUF;
  lastReason?: string;
  lastChangeRound?: number;
}

// --- Adossagok ---

export type DebtType =
  | 'student_loan'     // Diakhitel (DH1/DH2)
  | 'personal_loan'    // Szemelyi kolcson
  | 'mortgage'         // Lakashitel
  | 'credit_card'      // Hitelkartya
  | 'family_loan'      // Csaladi kolcson
  | 'business_loan'    // Vallalkozasi hitel
  | 'car_loan'         // Autohitel
  | 'baby_loan'        // Babavaro
  | 'overdue';         // Késedelmes tartozás (ki nem fizetett számlák)

export interface Debt {
  id: string;
  type: DebtType;
  name: string;

  /** Eredeti osszeg */
  originalAmount: HUF;

  /** Fennallo tartozas */
  remainingAmount: HUF;

  /** Eves kamatlab */
  interestRate: Percentage;

  /** Havi torlesztoeszlet */
  monthlyPayment: HUF;

  /** Hany honap van hatra */
  remainingMonths: number;

  /** Kulonleges: 0% kamat (pl. DH2 tanulmanyi idoszakban) */
  isInterestFree: boolean;

  /** Mikor indul a torlesztes (jatek kor, DH2-nel kesobbi) */
  repaymentStartsAtRound?: number;

  /** Havi folyósítás (pl. Diákhitel1): minden hónapban ennyivel nő a tartozás és a számlád */
  monthlyDraw?: HUF;
}

// --- Sztorivonalak (többkörös eseménylánc) ---

export interface PendingStoryline {
  /** Egyedi ID (pl. 'story-friend-loan-r5') */
  id: string;

  /** Sztorivonal típus (milyen eseménylánc) */
  type: 'friend_loan' | 'side_gig' | 'investment_result' | 'generic';

  /** Eredeti kör (mikor indult) */
  originRound: number;

  /** Melyik körben oldódik fel */
  resolveAtRound: number;

  /** Már feloldódott-e */
  resolved: boolean;

  /** Extra adatok (pl. kölcsönadott összeg, barát neve stb.) */
  data: Record<string, unknown>;
}

// --- Aktív tartós hatások (döntésekből) ---

export interface ActiveOngoingEffect {
  /** Egyedi ID (pl. 'ongoing-airbnb-r5') */
  id: string;

  /** Melyik mezőt érinti ('salary' | 'housing' | 'other' stb.) */
  target: string;

  /** Havi összeg (pozitív = bevétel/csökkentés, negatív = kiadás/növekedés) */
  monthlyAmount: HUF;

  /** Melyik körben indult */
  startedAtRound: number;

  /** Hány körig tart (-1 = játék végéig) */
  durationRounds: number;

  /** Hány kör van még hátra (0 = lejárt, -1 = végtelen) */
  remainingRounds: number;

  /** Leírás a játékosnak */
  description: string;

  /** Melyik döntésből származik */
  sourceDecisionId?: string;
}
