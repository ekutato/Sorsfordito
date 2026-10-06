// ============================================================================
// PENZUGYI SORSFORDITO - Mock Economic Data
// Fejlesztesi / offline mod adatok - 2026 Q1 magyar gazdasagi adatok
// ============================================================================

import type { EconomicData, NewsItem } from '@/types/data-sources';
import { LIVE_ECONOMIC_DATA } from '@/data/live';

/**
 * Korábban kézzel frissített mock adatkészlet - mostantól a heti élő adatcsomag
 * (src/data/live/heti.json) az egyetlen igazságforrás.
 */
export const MOCK_ECONOMIC_DATA_2026_Q1: EconomicData = LIVE_ECONOMIC_DATA;

/**
 * Eloirott hiresemenyek a mock modhoz
 * Minden Sprint jatek 12 korbol all - 12 hirunk van elorekeszitve
 */
export const MOCK_NEWS_EVENTS: NewsItem[] = [
  {
    id: 'news-mock-01',
    title: 'Kamatdöntés: az MNB változatlanul hagyta az alapkamatot',
    source: 'MNB',
    url: 'https://www.mnb.hu',
    publishedAt: '2026-04-01',
    category: 'interest_rates',
    summary: 'A monetáris tanács a várakozásoknak megfelelően tartotta a kamatot.',
  },
  {
    id: 'news-mock-02',
    title: 'Tovább emelkedtek az albérleti díjak Budapesten',
    source: 'KSH',
    url: 'https://www.ksh.hu',
    publishedAt: '2026-05-01',
    category: 'real_estate',
    summary: 'Az átlagos fővárosi albérlet ára tovább nőtt az előző negyedévhez képest (példahír, offline mód).',
  },
  {
    id: 'news-mock-03',
    title: 'Emelkedett a BUX, a magyar tőzsdeindex',
    source: 'BÉT',
    url: 'https://www.bet.hu',
    publishedAt: '2026-06-01',
    category: 'stock_market',
    summary: 'A legnagyobb súlyú részvények emelkedése húzta felfelé az indexet (példahír, offline mód).',
  },
  {
    id: 'news-mock-04',
    title: 'SZÉP-kártya: érdemes ellenőrizni az aktuális kereteket',
    source: 'NAV',
    url: 'https://www.nav.gov.hu',
    publishedAt: '2026-07-01',
    category: 'tax_policy',
    summary: 'A SZÉP-kártya alszámláinak éves kereteit jogszabály határozza meg (példahír, offline mód).',
  },
  {
    id: 'news-mock-05',
    title: 'Energiaárak: az átlagfogyasztás feletti rész drágább',
    source: 'KSH',
    url: 'https://www.ksh.hu',
    publishedAt: '2026-08-01',
    category: 'consumer',
    summary: 'Az átlagfogyasztást meghaladó energiahasználat piaci áron számlázódik (példahír, offline mód).',
  },
  {
    id: 'news-mock-06',
    title: 'Az IT szektorban az átlagnál gyorsabban nőnek a bérek',
    source: 'KSH',
    url: 'https://www.ksh.hu',
    publishedAt: '2026-09-01',
    category: 'wages',
    summary: 'A technológiai szektor továbbra is a legjobban fizető ágazat Magyarországon.',
  },
  {
    id: 'news-mock-07',
    title: 'Nagyot mozdult a kriptopiac',
    source: 'MNB',
    url: 'https://www.mnb.hu',
    publishedAt: '2026-10-01',
    category: 'crypto',
    summary: 'A kriptoeszközök árfolyama rövid idő alatt is nagyot mozoghat - mindkét irányba (példahír, offline mód).',
  },
  {
    id: 'news-mock-08',
    title: 'Élelmiszerárak: drágultak a tejtermékek',
    source: 'KSH',
    url: 'https://www.ksh.hu',
    publishedAt: '2026-11-01',
    category: 'consumer',
    summary: 'Egyes élelmiszerek ára gyorsabban nő, mint az általános árszínvonal (példahír, offline mód).',
  },
  {
    id: 'news-mock-09',
    title: 'Diákhitel: érdemes ellenőrizni az aktuális feltételeket',
    source: 'Diákhitel Központ',
    url: 'https://www.diakhitel.hu',
    publishedAt: '2026-12-01',
    category: 'banking',
    summary: 'A diákhitelek összegét és kamatát a Diákhitel Központ teszi közzé (példahír, offline mód).',
  },
  {
    id: 'news-mock-10',
    title: 'Minimálbér: tárgyalások a következő évi emelésről',
    source: 'Kormány.hu',
    url: 'https://www.kormany.hu',
    publishedAt: '2027-01-01',
    category: 'wages',
    summary: 'A minimálbér és a garantált bérminimum emeléséről a kormány és a szociális partnerek egyeztetnek (példahír, offline mód).',
  },
  {
    id: 'news-mock-11',
    title: 'Budapesti lakásárak: lassul a drágulás üteme',
    source: 'KSH',
    url: 'https://www.ksh.hu',
    publishedAt: '2027-02-01',
    category: 'real_estate',
    summary: 'Az éves lakásár-emelkedés üteme mérséklődött (példahír, offline mód).',
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
