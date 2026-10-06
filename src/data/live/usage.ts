// Hol használja a játék az egyes heti értékeket? A tartalmi szövegekben lévő
// {{változókból}} számolva (+ a kezdőképernyő gazdasági összefoglalója).
import { getDecisionsFor, getScriptedFateEvents, GENERIC_LATE_GAME_DECISIONS, GENERIC_FATE_EVENTS, STORYLINE_FATE_EVENTS } from '@/data/decisions';
import { KNOWLEDGE_CARDS } from '@/data/knowledge-cards';
import { INVESTMENT_OPTIONS } from '@/data/investment-options';
import { FINANCIAL_GLOSSARY } from '@/data/financial-glossary';
import { EPILOGUE_CARDS } from '@/data/epilogues';
import { TRAP_CARDS, TEMPTATION_CARDS, RECHARGE_CARDS, ENCOUNTER_CARDS, OFFICE_CARDS } from '@/data/field-cards';
import type { LifeSituationId, TimeScale } from '@/types/game';
import { liveKeysOfVar, varsIn } from './vars';

const HEADLINE_KEYS = ['mnb.baseRate', 'ksh.annualInflation', 'mnb.eurHufRate', 'stockMarket.buxIndex', 'ksh.netAverageWage', 'realEstate.budapestRentAvg'];

function strings(o: unknown, acc: string[] = []): string[] {
  if (typeof o === 'string') acc.push(o);
  else if (Array.isArray(o)) o.forEach((x) => strings(x, acc));
  else if (o && typeof o === 'object') Object.values(o).forEach((x) => strings(x, acc));
  return acc;
}

/** Minden tartalmi elem: megjelenített név + az összes szövege */
export function contentItems(): Array<{ label: string; texts: string[] }> {
  const items: Array<{ label: string; texts: string[] }> = [];
  const seen = new Set<string>();
  const add = (id: string, label: string, o: unknown) => {
    if (seen.has(id)) return;
    seen.add(id);
    items.push({ label, texts: strings(o) });
  };
  const sits: LifeSituationId[] = ['fresh_start', 'career_start', 'inheritance'];
  const scales: TimeScale[] = ['sprint', 'marathon', 'ultra'];
  for (const s of sits) for (const t of scales) {
    for (const d of getDecisionsFor(s, t)) add(`d:${d.id}`, `Döntés: ${d.title}`, d);
    for (const f of getScriptedFateEvents(s, t)) add(`f:${f.id}`, `Sorsfordító: ${f.title}`, f);
  }
  for (const d of GENERIC_LATE_GAME_DECISIONS) add(`d:${d.id}`, `Döntés: ${d.title}`, d);
  for (const f of [...GENERIC_FATE_EVENTS, ...STORYLINE_FATE_EVENTS]) add(`f:${f.id}`, `Sorsfordító: ${f.title}`, f);
  for (const k of KNOWLEDGE_CARDS) add(`k:${k.id}`, `Tudás: ${k.name}`, k);
  for (const i of INVESTMENT_OPTIONS) add(`i:${i.id}`, `Befektetés: ${i.name}`, i);
  for (const g of FINANCIAL_GLOSSARY) add(`g:${g.term}`, `Szótár: ${g.term}`, g);
  for (const e of EPILOGUE_CARDS) add(`e:${e.id}`, `Epilógus: ${e.title}`, e);
  for (const c of [...TRAP_CARDS, ...TEMPTATION_CARDS, ...RECHARGE_CARDS, ...ENCOUNTER_CARDS, ...OFFICE_CARDS]) add(`m:${c.id}`, `Mezőkártya: ${c.title}`, c);
  return items;
}

/** Heti kulcs → a játékelemek listája, amelyek használják */
export function liveUsage(): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  const push = (key: string, label: string) => (map[key] ??= new Set()).add(label);
  for (const it of contentItems()) {
    for (const t of it.texts) for (const v of varsIn(t)) for (const k of liveKeysOfVar(v)) push(k, it.label);
  }
  for (const k of HEADLINE_KEYS) push(k, 'Kezdés: gazdasági helyzet');
  return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s)]));
}
