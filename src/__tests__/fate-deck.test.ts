import { describe, it, expect } from 'vitest';
import { drawFateCard, roundMonths, groupKey, type FatePool } from '@/engine/fate-deck';
import { GENERIC_FATE_EVENTS, GENERIC_KNOWLEDGE_FATE_EVENTS, STORYLINE_FATE_EVENTS, getScriptedFateEvents } from '@/data/decisions';
import { FATE_THEME, FATE_MONTHS } from '@/data/fate-themes';
import { DISTRICTS } from '@/data/board';
import type { DistrictId } from '@/data/board';

const pool = (p: 'fresh_start' | 'career_start' | 'inheritance', t: 'sprint' | 'marathon' = 'sprint'): FatePool => ({
  scripted: getScriptedFateEvents(p, t), generic: GENERIC_FATE_EVENTS, knowledge: GENERIC_KNOWLEDGE_FATE_EVENTS, storyline: STORYLINE_FATE_EVENTS,
});
const sheet = (housing = 0) => ({ income: { salary: 320_000, passive: 0, oneTime: 0 }, expenses: { housing, utilities: 0, food: 0, transport: 0, loanPayments: 0, other: 0 }, acquiredKnowledge: [] as string[] });

function play(p: Parameters<typeof pool>[0], districts: DistrictId[], start = '2026-10') {
  const drawn: string[] = [];
  return districts.map((d, i) => {
    const e = drawFateCard({ pool: pool(p), months: roundMonths(start, i + 1, 1), district: d, onFateField: false, drawn, sheet: sheet(), seed: 'g1' })!;
    drawn.push(e.id);
    return e;
  });
}

describe('sorskártya a dobásból', () => {
  it('minden sorskártyának van témája', () => {
    const all = [...['fresh_start', 'career_start', 'inheritance'].flatMap((p) => getScriptedFateEvents(p as never, 'sprint')), ...GENERIC_FATE_EVENTS, ...GENERIC_KNOWLEDGE_FATE_EVENTS, ...STORYLINE_FATE_EVENTS];
    for (const e of all) expect(FATE_THEME[e.id] ?? FATE_THEME[groupKey(e)], e.id).toBeDefined();
  });

  it('eltérő negyed → eltérő kártya; a lap a negyed témájából jön', () => {
    const a = drawFateCard({ pool: pool('career_start'), months: [11], district: 'munkahely', onFateField: false, drawn: [], sheet: sheet(), seed: 'g' })!;
    const b = drawFateCard({ pool: pool('career_start'), months: [11], district: 'piacter', onFateField: false, drawn: [], sheet: sheet(), seed: 'g' })!;
    expect(a.id).not.toBe(b.id);
    expect(FATE_THEME[a.id]).toBe('munkahely');
    expect(FATE_THEME[b.id] ?? FATE_THEME[groupKey(b)]).toBe('piacter');
  });

  it('egy játékban nincs ismétlés (a feltételes párok egy kártyának számítanak)', () => {
    const ids = play('inheritance', Array.from({ length: 20 }, (_, i) => DISTRICTS[i % 6].id)).map(groupKey);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('októberi kezdésnél a 3. kör (december) karácsonyi kártyát hoz, más hónapban nem', () => {
    const cards = play('career_start', ['munkahely', 'bankutca', 'tozsde', 'piacter', 'hivatal']);
    expect(cards[2].id).toBe('fate-dani-12');
    for (const [i, c] of cards.entries()) expect(FATE_MONTHS[c.id]?.includes(roundMonths('2026-10', i + 1, 1)[0]) ?? true, c.id).toBe(true);
    expect(cards.filter((c) => c.id === 'fate-dani-12')).toHaveLength(1);
  });

  it('Maraton: a negyedéves kör hónapjai számítanak', () => {
    expect(roundMonths('2026-10', 1, 3)).toEqual([10, 11, 12]);
    expect(roundMonths('2026-10', 2, 3)).toEqual([1, 2, 3]);
  });

  it('a Sorsfordító mezőn a karakter saját története jön, sorrendben', () => {
    const e = drawFateCard({ pool: pool('fresh_start'), months: [10], district: 'tozsde', onFateField: true, drawn: [], sheet: sheet(), seed: 'g' })!;
    expect(e.id).toBe('fate-fs-01');
  });

  it('a feltételhez kötött lap nem jön, ha nem illik (otthon lakva nincs lakbéremelés)', () => {
    const drawn: string[] = [];
    for (let r = 1; r <= 30; r++) {
      const e = drawFateCard({ pool: pool('career_start'), months: [((r + 8) % 12) + 1], district: 'piacter', onFateField: false, drawn, sheet: sheet(30_000), seed: 'g' });
      if (!e) break;
      expect(e.id).not.toBe('fate-dani-08');
      drawn.push(e.id);
    }
  });
});
