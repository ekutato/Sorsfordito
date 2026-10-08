// Befektetések havi értékváltozása valós adatokból.
// - Árfolyamos eszközök (deviza, részvény/BUX, arany): az utolsó 12 hónap valós havi mozgása,
//   a játék k-adik hónapja az adatsor k-adik havi változása (a végén elölről kezdve), évszámmal jelölve.
// - Kamatozó és jövedelemtermelő eszközök: az értékük nem változik, a hozam havonta jóváíródik
//   (lásd investment-income.ts) - így nincs kétszeres számolás.
import history from '@/data/live/history.json';
import type { Investment } from '@/types/financial';

interface Series { source?: string; url?: string; verified?: boolean; values: Record<string, number | null> }
interface History { months: string[]; series: Record<string, Series> }
const H = history as unknown as History;

/** Melyik adatsor mozgatja az eszköz értékét */
export const VALUE_DRIVER: Record<string, 'eurHuf' | 'usdHuf' | 'bux' | 'goldHuf'> = {
  'inv-forex-eur': 'eurHuf',
  'inv-forex-usd': 'usdHuf',
  'inv-stock-hu': 'bux',
  'inv-tbsz-etf': 'bux',
  'inv-dividend-stock': 'bux',
  'inv-gold': 'goldHuf',
};

/** Csak a jóváhagyott (verified) adatsor mozgat értéket (CLAUDE.md 1. szabály) */
const ok = (name: string) => H.series[name]?.verified !== false;

function point(driver: string, month: string): number | null {
  if (driver === 'goldHuf') {
    if (!ok('goldUsdOz') || !ok('usdHuf')) return null;
    const g = H.series.goldUsdOz?.values[month], u = H.series.usdHuf?.values[month];
    return g && u ? g * u : null;
  }
  if (!ok(driver)) return null;
  return H.series[driver]?.values[month] ?? null;
}

/** A havi változások (arány) sorban: [{ month: '2025-11', ratio: 1.012 }, …] */
export function monthlyMoves(driver: string): Array<{ month: string; ratio: number }> {
  const out: Array<{ month: string; ratio: number }> = [];
  for (let i = 1; i < H.months.length; i++) {
    const a = point(driver, H.months[i - 1]), b = point(driver, H.months[i]);
    if (a && b) out.push({ month: H.months[i], ratio: b / a });
  }
  return out;
}

const HU_MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${y}. ${HU_MONTHS[m - 1]}`;
}

export interface Revaluation { optionId: string; before: number; after: number; reason: string }

/**
 * Egy kör értékváltozása. gameMonth: a kör első játékhónapjának sorszáma (0-tól), months: a kör hossza.
 * A kör hónapjainak valós mozgásait összeszorozza (Maraton: 3, Ultra: 6 hónap).
 */
export function revalue(inv: Investment, gameMonth: number, months: number, moves = (d: string) => monthlyMoves(d)): Revaluation | null {
  const driver = VALUE_DRIVER[inv.optionId];
  if (!driver) return null;
  const list = moves(driver);
  if (!list.length) return null;
  let ratio = 1;
  const used: string[] = [];
  for (let k = 0; k < months; k++) {
    const mv = list[(gameMonth + k) % list.length];
    ratio *= mv.ratio;
    used.push(mv.month);
  }
  const after = Math.round(inv.currentValue * ratio);
  const pct = (ratio - 1) * 100;
  const what = driver === 'eurHuf' ? 'EUR/HUF' : driver === 'usdHuf' ? 'USD/HUF' : driver === 'bux' ? 'BUX' : 'arany (forintban)';
  const when = used.length === 1 ? monthLabel(used[0]) : `${monthLabel(used[0])} - ${monthLabel(used[used.length - 1])}`;
  return { optionId: inv.optionId, before: inv.currentValue, after, reason: `${what} ${pct >= 0 ? '+' : ''}${pct.toLocaleString('hu-HU', { maximumFractionDigits: 1 })}% (${when} valós mozgása)` };
}

export function historySources(): Array<{ name: string; source?: string; url?: string }> {
  return Object.entries(H.series).map(([name, s]) => ({ name, source: s.source, url: s.url }));
}
