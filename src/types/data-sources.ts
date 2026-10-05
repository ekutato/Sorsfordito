// ============================================================================
// PENZUGYI SORSFORDITO - External Data Source Types
// Kulso adatforrasok (MNB, KSH, AKK, hirek) tipusai
// ============================================================================

import type { HUF, Percentage } from './financial';

// --- Aggregalt gazdasagi adatok ---

/** A jatek altal hasznalt osszes kulso adat egyetlen objektumban */
export interface EconomicData {
  /** Utolso frissites idopontja */
  lastUpdated: string;

  /** MNB adatok */
  mnb: MNBData;

  /** KSH adatok */
  ksh: KSHData;

  /** AKK adatok (allampapir hozamok) */
  akk: AKKData;

  /** Ingatlanpiaci adatok */
  realEstate: RealEstateData;

  /** Tozsde (BUX) */
  stockMarket: StockMarketData;
}

export interface MNBData {
  /** Alapkamat (%) */
  baseRate: Percentage;

  /** EUR/HUF arfolyam */
  eurHufRate: number;

  /** USD/HUF arfolyam */
  usdHufRate: number;

  /** Utolso frissites */
  lastUpdated: string;
}

export interface KSHData {
  /** Eves inflacio (%) */
  annualInflation: Percentage;

  /** Havi inflacio (%) */
  monthlyInflation: Percentage;

  /** Brutto atlagkereset */
  grossAverageWage: HUF;

  /** Netto atlagkereset */
  netAverageWage: HUF;

  /** Netto mediankereset */
  netMedianWage: HUF;

  /** Minimalber (brutto) */
  minimumWage: HUF;

  /** Garantalt berminimum (brutto) */
  guaranteedMinimumWage: HUF;

  /** Munkanelkulisegi rata (%) */
  unemploymentRate: Percentage;

  /** Utolso frissites */
  lastUpdated: string;
}

export interface AKKData {
  /** PMAP (Prémium Magyar Allampapir) hozam */
  pmapYield: Percentage;

  /** MAP+ (Magyar Allampapir Plusz) hozam */
  mapPlusYield: Percentage;

  /** DKJ (Diszkont Kincstarjegy) hozam */
  dkjYield: Percentage;

  /** 1 eves allamkotveny hozam */
  oneYearBondYield: Percentage;

  /** 5 eves allamkotveny hozam */
  fiveYearBondYield: Percentage;

  /** Utolso frissites */
  lastUpdated: string;
}

export interface RealEstateData {
  /** Budapesti atllagos alberlet (1 szobas) */
  budapestRentAvg: HUF;

  /** Budapesti atllagos alberlet (2 szobas) */
  budapestRent2Room: HUF;

  /** Videki varosok atllagos alberlet */
  ruralRentAvg: HUF;

  /** Budapesti ingatlan m2 ar (vetel) */
  budapestSqmPrice: HUF;

  /** Videki ingatlan m2 ar (vetel) */
  ruralSqmPrice: HUF;

  /** Utolso frissites */
  lastUpdated: string;
}

export interface StockMarketData {
  /** BUX index aktualis ertek */
  buxIndex: number;

  /** BUX valtozas napi (%) */
  buxDailyChange: Percentage;

  /** BUX valtozas eves (%) */
  buxYearlyChange: Percentage;

  /** Utolso frissites */
  lastUpdated: string;
}

// --- Hir esemenyek ---

export interface NewsItem {
  /** Egyedi azonosito */
  id: string;

  /** Cim */
  title: string;

  /** Forras (pl. "Portfolio.hu", "MNB") */
  source: string;

  /** Eredeti URL */
  url: string;

  /** Publikalas datuma */
  publishedAt: string;

  /** Kategoria */
  category: NewsCategory;

  /** Rovid osszefoglalo (max 2 mondat) */
  summary: string;
}

export type NewsCategory =
  | 'interest_rates'     // Kamatdontesek
  | 'inflation'          // Inflacios adatok
  | 'wages'              // Ber, foglalkoztatas
  | 'real_estate'        // Ingatlanpiac
  | 'stock_market'       // Tozsde
  | 'crypto'             // Kriptovaluta
  | 'tax_policy'         // Adopolitika
  | 'banking'            // Banki szolgaltatasok
  | 'consumer'           // Fogyasztoi arak, rezsi
  | 'general_economy';   // Altalanos gazdasag

/** Hirbol generalt jatek-esemeny (a hirgenenerator kimenete) */
export interface GeneratedFateEvent {
  /** Az eredeti hir */
  sourceNews: NewsItem;

  /** Relevancia pontszam (0-100) - mennyire erinti a jatekost */
  relevanceScore: number;

  /** Jatekeseménnyé forditott adatok */
  gameEvent: {
    title: string;
    description: string;
    type: 'positive' | 'negative' | 'decision';
    financialEffects: Array<{
      target: string;
      amount: HUF;
      description: string;
    }>;
    /** Ha decision tipus: valasztasi lehetosegek */
    options?: Array<{
      label: string;
      description: string;
      effects: Array<{
        target: string;
        amount: HUF;
      }>;
    }>;
  };

  /** Moderacios flag-ek */
  moderation: {
    isPolitical: boolean;
    isPanic: boolean;
    isAppropriate: boolean;
  };
}

// --- Adatforras konfiguracio ---

export interface DataSourceConfig {
  id: string;
  name: string;
  type: 'api' | 'rss' | 'scraper' | 'manual';
  url: string;
  updateFrequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
  isReliable: boolean;
  requiresAuth: boolean;
  fallbackDataKey?: string; // Mock adat kulcs, ha a forras nem elerheto
}

// --- Mock adatok (offline mod / fejlesztes) ---

export interface MockDataSet {
  /** Mock adatok neve (pl. "2026-Q1 baseline") */
  name: string;

  /** Gazdasagi adatok */
  economicData: EconomicData;

  /** Eloirott hir-esemenyek */
  scriptedNews: NewsItem[];

  /** Leiras */
  description: string;
}
