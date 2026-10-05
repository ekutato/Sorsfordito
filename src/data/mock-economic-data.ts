// ============================================================================
// PENZUGYI SORSFORDITO - Mock Economic Data
// Fejlesztesi / offline mod adatok - 2026 Q1 magyar gazdasagi adatok
// ============================================================================

import type { EconomicData, NewsItem } from '@/types/data-sources';

/**
 * Valós adatokon alapuló mock dataset (2026 márc.)
 * Források: KSH, MNB, ÁKK, ingatlan.com, TradingView chartok
 *
 * Frissítve 2026-03-13 15:30 UTC+1 (élő chart adatokból):
 * - MNB alapkamat: 6.25% (feb. 2026-ban csökkentette 6.5%-ról)
 * - EUR/HUF: 390.6 (TradingView OANDA, 2026-03-13)
 * - USD/HUF: 340.7 (TradingView OANDA, 2026-03-13)
 * - Brent olaj: ~$100/hordó (csúcs $120, iráni háború miatt felfutás)
 * - Arany: $5,091/oz (+73% YoY!) — menedékeszköz a geopolitikai válságban
 * - Ezüst: $82.46/oz
 * - Infláció: 2.1% (jan. 2026), de emelkedhet az energiaárak miatt
 * - Bruttó átlagbér: 789 223 Ft (dec. 2025, KSH)
 */
export const MOCK_ECONOMIC_DATA_2026_Q1: EconomicData = {
  lastUpdated: '2026-03-13T15:30:00+01:00',

  mnb: {
    baseRate: 6.25,
    eurHufRate: 390.6,     // TradingView OANDA 2026-03-13 15:28
    usdHufRate: 340.7,     // TradingView OANDA 2026-03-13 15:28
    lastUpdated: '2026-03-13',
  },

  ksh: {
    annualInflation: 2.1,     // Jan. 2026 (KSH), de emelkedhet iráni háború miatt
    monthlyInflation: 0.2,
    grossAverageWage: 789_223, // Dec. 2025 (KSH)
    netAverageWage: 548_700,
    netMedianWage: 427_500,
    minimumWage: 322_800,      // 2026. jan. 1-től (+11%)
    guaranteedMinimumWage: 373_200, // 2026. jan. 1-től (+7%)
    unemploymentRate: 4.2,
    lastUpdated: '2026-03-01',
  },

  akk: {
    pmapYield: 6.5,
    mapPlusYield: 5.8,
    dkjYield: 6.2,
    oneYearBondYield: 6.0,
    fiveYearBondYield: 6.8,
    lastUpdated: '2026-03-01',
  },

  realEstate: {
    budapestRentAvg: 250_000,
    budapestRent2Room: 320_000,
    ruralRentAvg: 140_000,
    budapestSqmPrice: 1_050_000,
    ruralSqmPrice: 450_000,
    lastUpdated: '2026-02-15',
  },

  stockMarket: {
    buxIndex: 78_500,
    buxDailyChange: 0.45,
    buxYearlyChange: 12.3,
    lastUpdated: '2026-03-01',
  },
};

/**
 * Eloirott hiresemenyek a mock modhoz
 * Minden Sprint jatek 12 korbol all - 12 hirunk van elorekeszitve
 */
export const MOCK_NEWS_EVENTS: NewsItem[] = [
  {
    id: 'news-mock-01',
    title: 'Az MNB változatlanul hagyta az alapkamatot 6,5%-on',
    source: 'MNB',
    url: 'https://www.mnb.hu',
    publishedAt: '2026-04-01',
    category: 'interest_rates',
    summary: 'A monetáris tanács a várakozásoknak megfelelően tartotta a kamatot.',
  },
  {
    id: 'news-mock-02',
    title: 'Tovább emelkedtek az albérleti díjak Budapesten',
    source: 'Portfolio.hu',
    url: 'https://www.portfolio.hu',
    publishedAt: '2026-05-01',
    category: 'real_estate',
    summary: 'Az átlagos fővárosi albérlet 5%-kal drágult az előző negyedévhez képest.',
  },
  {
    id: 'news-mock-03',
    title: 'Rekord BUX: átlépte a 80 000 pontot a magyar tőzsdeindex',
    source: 'Portfolio.hu',
    url: 'https://www.portfolio.hu',
    publishedAt: '2026-06-01',
    category: 'stock_market',
    summary: 'Az OTP és a Mol részvények hajtották az indexet történelmi csúcsra.',
  },
  {
    id: 'news-mock-04',
    title: 'Megjelent az új SZÉP-kártya szabályozás: magasabb keretek',
    source: '24.hu',
    url: 'https://www.24.hu',
    publishedAt: '2026-07-01',
    category: 'tax_policy',
    summary: 'Szálláshely: évi 450e Ft, vendéglátás: 200e Ft, szabadidő: 200e Ft.',
  },
  {
    id: 'news-mock-05',
    title: 'Drágul a gáz: októbertől emelkedik a rezsiplafon feletti ár',
    source: 'HVG',
    url: 'https://www.hvg.hu',
    publishedAt: '2026-08-01',
    category: 'consumer',
    summary: 'A piaci áras gáz 15%-kal drágult. Az átlagfogyasztást meghaladó használat érinti.',
  },
  {
    id: 'news-mock-06',
    title: 'IT szektorban 8%-os átlagos béremelkedés várható',
    source: 'Profession.hu',
    url: 'https://www.profession.hu',
    publishedAt: '2026-09-01',
    category: 'wages',
    summary: 'A technológiai szektor továbbra is a legjobban fizető ágazat Magyarországon.',
  },
  {
    id: 'news-mock-07',
    title: 'Bitcoin ismét 100 000 dollár felett',
    source: 'Portfolio.hu',
    url: 'https://www.portfolio.hu',
    publishedAt: '2026-10-01',
    category: 'crypto',
    summary: 'Az intézményi befektetők visszatértek a piacra, erős rally indult.',
  },
  {
    id: 'news-mock-08',
    title: 'Élelmiszerárak: a tejtermékek 10%-kal drágultak',
    source: 'KSH',
    url: 'https://www.ksh.hu',
    publishedAt: '2026-11-01',
    category: 'consumer',
    summary: 'Az élelmiszer-infláció továbbra is meghaladja az általános inflációt.',
  },
  {
    id: 'news-mock-09',
    title: 'Új diákhitel-feltételek 2027-től: maximális összeg emelkedik',
    source: 'Diákhitel Központ',
    url: 'https://www.diakhitel.hu',
    publishedAt: '2026-12-01',
    category: 'banking',
    summary: 'A Diákhitel 2 maximális összege havi 250 000 Ft-ra emelkedik.',
  },
  {
    id: 'news-mock-10',
    title: 'Minimálbér-emelés 2027: bruttó 350 000 Ft',
    source: 'Kormány.hu',
    url: 'https://www.kormany.hu',
    publishedAt: '2027-01-01',
    category: 'wages',
    summary: 'A minimálbér 8,4%-kal emelkedik, a garantált bérminimum is arányosan nő.',
  },
  {
    id: 'news-mock-11',
    title: 'Budapesti lakásárak: lassul a drágulás üteme',
    source: 'KSH',
    url: 'https://www.ksh.hu',
    publishedAt: '2027-02-01',
    category: 'real_estate',
    summary: 'Az éves lakásár-emelkedés 5%-ra mérséklődött a korábbi 12%-ról.',
  },
  {
    id: 'news-mock-12',
    title: 'NAV: március 15-ig kell beadni az SZJA-bevallást',
    source: 'NAV',
    url: 'https://www.nav.gov.hu',
    publishedAt: '2027-03-01',
    category: 'tax_policy',
    summary: 'A személyi jövedelemadó bevallás határideje közeleg. Online, pár perc.',
  },
];
