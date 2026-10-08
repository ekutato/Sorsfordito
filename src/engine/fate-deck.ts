// A kör sorskártyája a dobásból: a lépett mező és negyed, valamint a naptár dönti el.
// Sorrend: 1) erre a hónapra eső naptári kártya; 2) a Sorsfordító mezőn a karakter saját története
// (eredeti sorrendben); 3) a negyed témájának paklija (karakterkártya → tudáspróba → általános → sztori);
// 4) bármely téma. Egy kártya egy játékban egyszer jön; a feltételes párok (pl. forint erősödik/gyengül)
// egy kártyának számítanak, a heti adat dönti el a változatot. A húzás determinisztikus (seed).
import type { FateEventEntry } from '@/data/decisions';
import type { DistrictId } from '@/data/board';
import type { FinancialSheet } from '@/types/financial';
import { FATE_MONTHS, FATE_THEME } from '@/data/fate-themes';
import { liveConditionHolds } from '@/data/live/vars';
import { createRng, seedFromString, shuffle } from './rng';

export const RENT_THRESHOLD_FATE = 100_000;

export interface FatePool {
  /** A karakter saját kártyái (eredeti körrel) */
  scripted: FateEventEntry[];
  generic: FateEventEntry[];
  knowledge: FateEventEntry[];
  storyline: FateEventEntry[];
}

export interface DrawInput {
  pool: FatePool;
  /** A kör valós hónapjai (1-12) */
  months: number[];
  district?: DistrictId;
  onFateField: boolean;
  /** Eddig húzott kártyák (azonosító vagy csoportkulcs) */
  drawn: string[];
  sheet: Pick<FinancialSheet, 'income' | 'expenses' | 'acquiredKnowledge'>;
  seed: string;
}

/** A feltételes párok közös kulcsa (fate-dani-02 és fate-dani-02b ugyanaz a kártya) */
export const groupKey = (e: Pick<FateEventEntry, 'id'>) => e.id.replace(/b$/, '');

function fits(e: FateEventEntry, sheet: DrawInput['sheet']): boolean {
  // A hatásból adódó feltétel: lakbér csak albérlőt, fizetés csak keresőt érint
  const rents = sheet.expenses.housing >= RENT_THRESHOLD_FATE;
  if (!rents && e.effects.some((x) => x.target === 'housing' && x.amount > 0)) return false;
  if (sheet.income.salary <= 0 && e.effects.some((x) => x.target === 'salary')) return false;
  const r = e.requires;
  if (!r) return true;
  if (r.hasSalary && sheet.income.salary <= 0) return false;
  if (r.hasHighTransport && sheet.expenses.transport < 25_000) return false;
  if (r.rentsHome && sheet.expenses.housing < RENT_THRESHOLD_FATE) return false;
  return true;
}

/** A csoport (feltételes pár) aktuális változata */
function variant(group: FateEventEntry[]): FateEventEntry | undefined {
  return group.find((e) => e.liveCondition && liveConditionHolds(e.liveCondition)) ?? group.find((e) => !e.liveCondition) ?? group[0];
}

function groups(list: FateEventEntry[]): FateEventEntry[] {
  const by = new Map<string, FateEventEntry[]>();
  for (const e of list) by.set(groupKey(e), [...(by.get(groupKey(e)) ?? []), e]);
  return [...by.values()].map(variant).filter((e): e is FateEventEntry => !!e);
}

export function drawFateCard(i: DrawInput): FateEventEntry | undefined {
  const drawn = new Set(i.drawn.map((d) => d.replace(/b$/, '')));
  const ok = (e: FateEventEntry) => !drawn.has(groupKey(e)) && fits(e, i.sheet);
  const scripted = groups(i.pool.scripted).filter(ok).sort((a, b) => a.round - b.round);
  const owned = new Set(i.sheet.acquiredKnowledge);
  const quiz = groups(i.pool.knowledge).filter(ok)
    .sort((a, b) => Number(owned.has(b.knowledgeCheck?.requiredKnowledgeId ?? '')) - Number(owned.has(a.knowledgeCheck?.requiredKnowledgeId ?? '')));
  const generic = shuffle(groups(i.pool.generic).filter(ok), createRng(seedFromString(`${i.seed}-sors`)));
  const story = groups(i.pool.storyline).filter(ok);
  const ordered = [...scripted, ...quiz, ...generic, ...story];

  // 1. Naptár
  const calendar = ordered.find((e) => (FATE_MONTHS[groupKey(e)] ?? FATE_MONTHS[e.id])?.some((m) => i.months.includes(m)));
  if (calendar) return calendar;
  // A naptári kártya csak a saját hónapjában jöhet
  const free = ordered.filter((e) => !(FATE_MONTHS[groupKey(e)] ?? FATE_MONTHS[e.id]));
  // 2. Sorsfordító mező: a karakter története
  if (i.onFateField) {
    const own = free.find((e) => scripted.includes(e));
    if (own) return own;
  }
  // 3. A negyed témája
  if (i.district) {
    const themed = free.find((e) => (FATE_THEME[e.id] ?? FATE_THEME[groupKey(e)]) === i.district);
    if (themed) return themed;
  }
  // 4. Bármi
  return free[0];
}

/** A kör valós hónapjai a játék kezdő dátumából */
export function roundMonths(startDate: string, round: number, monthsPerRound: number): number[] {
  const m0 = Number(startDate.split('-')[1]) - 1;
  return Array.from({ length: monthsPerRound }, (_, k) => ((m0 + (round - 1) * monthsPerRound + k) % 12) + 1);
}

import { GENERIC_FATE_EVENTS, GENERIC_KNOWLEDGE_FATE_EVENTS, STORYLINE_FATE_EVENTS, getScriptedFateEvents } from '@/data/decisions';
import { BOARD } from '@/data/board';
import { TIME_SCALE_CONFIGS, type GameState, type LifeSituationId } from '@/types/game';

/** A játékos sorspaklija */
export function fatePoolFor(game: Pick<GameState, 'players' | 'activePlayerIndex' | 'config'>): FatePool {
  const p = game.players[game.activePlayerIndex];
  return {
    scripted: getScriptedFateEvents(p.lifeSituation as LifeSituationId, game.config.timeScale),
    generic: GENERIC_FATE_EVENTS,
    knowledge: GENERIC_KNOWLEDGE_FATE_EVENTS,
    storyline: STORYLINE_FATE_EVENTS,
  };
}

/** A kör sorskártyája: a mentett húzás, vagy most húzott (determinisztikus) */
export function fateCardForRound(game: GameState): FateEventEntry | undefined {
  const pool = fatePoolFor(game);
  const saved = game.fateDraws?.[game.currentRound];
  const all = [...pool.scripted, ...pool.generic, ...pool.knowledge, ...pool.storyline];
  if (saved) return all.find((e) => e.id === saved);
  const field = BOARD[game.board?.position ?? 0];
  const ts = TIME_SCALE_CONFIGS[game.config.timeScale];
  const drawn = Object.entries(game.fateDraws ?? {}).filter(([r]) => Number(r) !== game.currentRound).map(([, id]) => id);
  return drawFateCard({
    pool, months: roundMonths(game.config.startDate, game.currentRound, ts.monthsPerRound),
    district: field?.district, onFateField: field?.type === 'fate', drawn,
    sheet: game.players[game.activePlayerIndex].financialSheet, seed: game.gameId,
  });
}
