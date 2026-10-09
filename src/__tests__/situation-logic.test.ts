// Logikai következetesség: minden karakterrel, minden első ágon és módban végigjátszva egyetlen
// sors-, mező- vagy döntéskártya sem feltételezhet olyat, ami nem igaz a játékosra
// (hitel, autó, munkahely, SZJA, lakhatás, egyetem), és a pénzügyi állapot sem lehet képtelen.
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/game-store';
import { rollBoard, resolveFieldCard, acknowledgeOutcome } from '@/store/board-actions';
import { applyDecisionOption } from '@/store/decision-finance';
import { getDecisionsFor, getDecisionForRound, fittingOptions } from '@/data/decisions';
import { cardForField, canAfford } from '@/data/field-cards';
import { fateCardForRound } from '@/engine/fate-deck';
import { chosenOf, situationOfGame, type Situation } from '@/engine/situation';
import { SITUATION_REQUIRES } from '@/data/situation-requires';
import { BOARD } from '@/data/board';
import { DEFAULT_RULES, TIME_SCALE_CONFIGS, type LifeSituationId, type TimeScale } from '@/types/game';

const game = () => useGameStore.getState().game!;
const sheet = () => game().players[game().activePlayerIndex].financialSheet;

/** Szöveg → helyzet: ha a kártya ezt állítja, igaznak kell lennie */
const GUARDS: Array<{ re: RegExp; ok: (s: Situation) => boolean; why: string }> = [
  { re: /hiteled|átütemez|hitelkiváltás|refinansz/i, ok: (s) => s.hasDebt, why: 'hitel nélkül' },
  { re: /autód|műszaki vizsga|parkolási bírság|gyorshajt|CASCO|KGFB/i, ok: (s) => s.ownsCar, why: 'autó nélkül' },
  { re: /kollégád|kolléga hív|főnököd|munkahelyeden|céged|munkáltatód/i, ok: (s) => s.employed, why: 'munkahely nélkül' },
  { re: /adó-visszaigénylés|családi adókedvezmény|családi kedvezmény/i, ok: (s) => s.paysSzja, why: 'SZJA nélkül' },
  { re: /régen voltál otthon/i, ok: (s) => !s.livesWithParents, why: 'otthon lakónak' },
];

function check(kind: string, id: string, text: string, s: Situation, out: string[]) {
  for (const g of GUARDS) if (g.re.test(text) && !g.ok(s)) out.push(`${kind} ${id}: ${g.why} (${s.preset}, ${s.round}. kör, ágak: ${s.chosen.join(',')})`);
}

function play(preset: LifeSituationId, ts: TimeScale, pick: number): string[] {
  const st = useGameStore.getState();
  st.startNewGame({ timeScale: ts, mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, preset, 'Teszt');
  const decisions = getDecisionsFor(preset, ts);
  const out: string[] = [];
  for (let r = 1; r <= TIME_SCALE_CONFIGS[ts].totalRounds; r++) {
    rollBoard({ value: ((r * 5 + pick) % 6) + 1, source: 'test' });
    const field = BOARD[game().board!.position];
    let s = situationOfGame(game());
    const ctx = { preset, housing: sheet().expenses.housing, investments: sheet().investments.map((i) => i.optionId), salary: sheet().income.salary, chosen: chosenOf(game()), situation: s };
    const card = cardForField(field.type, game().board!.visits[field.type] ?? 0, game().gameId, undefined, ctx);
    if (card) {
      check('mezőkártya', card.id, `${card.title} ${card.body}`, s, out);
      const affordable = card.options.filter((o) => canAfford(o, sheet().balance));
      resolveFieldCard(field.type, affordable[(r + pick) % Math.max(1, affordable.length)], card);
      acknowledgeOutcome?.();
    } else resolveFieldCard(field.type);
    const fate = fateCardForRound(game());
    if (fate) {
      check('sorskártya', fate.id, `${fate.title} ${fate.description}`, s, out);
      if (fate.effects.concat(fate.knowledgeCheck?.successEffects ?? []).some((e) => e.target === 'loanPayments' && e.amount < 0) && !s.hasDebt) out.push(`sorskártya ${fate.id}: törlesztő-csökkentés hitel nélkül`);
      useGameStore.getState().setFateDraw?.(game().currentRound, fate.id);
    }
    st.processRoundIncome();
    st.processRoundExpenses();
    s = situationOfGame(game());
    const done = game().eventLog.map((e) => e.details?.decisionCardId).filter(Boolean) as string[];
    const dctx = { chosen: s.chosen, debtTypes: s.debtTypes, salary: s.salary, situation: s };
    const d = getDecisionForRound(decisions, r, done, sheet().expenses.housing, dctx);
    if (d) {
      check('döntés', d.id, `${d.title} ${d.situation}`, s, out);
      if (s.livesWithParents === false && /szülőknél|otthon laksz/i.test(d.situation) && /még mindig/i.test(d.situation)) out.push(`döntés ${d.id}: otthon lakást feltételez`);
      const opts = fittingOptions(d, dctx);
      applyDecisionOption(d, opts[(r + pick) % opts.length]);
    }
    const after = situationOfGame(game());
    if (sheet().income.salary < 0) out.push(`${preset} ${r}. kör: negatív fizetés ${sheet().income.salary}`);
    // Szakma vagy munka ágon nincs egyetemi tartalom
    if (preset === 'fresh_start' && !after.chosen.some((c) => c === 'fs-d01-a' || c === 'fs-ext-01-a') && d && /egyetem/i.test(`${d.title} ${d.situation}`)) out.push(`döntés ${d.id}: egyetem nem egyetemistának`);
    st.takeFinancialSnapshot();
    st.advanceRound();
  }
  return out;
}

describe('logikai következetesség: a kártyák a játékos valós helyzetéhez illenek', () => {
  beforeEach(() => useGameStore.getState().resetGame());
  for (const preset of ['fresh_start', 'career_start', 'inheritance'] as LifeSituationId[]) {
    for (const ts of ['sprint', 'marathon', 'ultra'] as TimeScale[]) {
      it(`${preset} / ${ts}`, () => {
        const problems = [0, 1, 2, 3, 4, 5].flatMap((pick) => { useGameStore.getState().resetGame(); return play(preset, ts, pick); });
        expect([...new Set(problems)]).toEqual([]);
      });
    }
  }

  it('a felhasználó esete: 18 éves, hitel nélkül, Adósságkezelés tudással a Bankutcán nem kap hitelkiváltást', () => {
    const st = useGameStore.getState();
    st.startNewGame({ timeScale: 'sprint', mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, 'fresh_start', 'Tom');
    st.addKnowledge(game().players[0].playerId, 'know-debt');
    for (let v = 1; v <= 6; v++) {
      useGameStore.getState().resetGame();
      useGameStore.getState().startNewGame({ timeScale: 'sprint', mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, 'fresh_start', 'Tom');
      useGameStore.getState().addKnowledge(game().players[0].playerId, 'know-debt');
      rollBoard({ value: v, source: 'test' });
      expect(fateCardForRound(game())?.id).not.toBe('fate-know-04');
    }
  });

  it('a helyzet-feltételek létező kártyákra mutatnak', async () => {
    const D = await import('@/data/decisions');
    const F = await import('@/data/field-cards');
    const ids = new Set<string>([
      ...D.GENERIC_FATE_EVENTS, ...D.GENERIC_KNOWLEDGE_FATE_EVENTS, ...D.STORYLINE_FATE_EVENTS,
      ...(['fresh_start', 'career_start', 'inheritance'] as LifeSituationId[]).flatMap((p) => [...D.getScriptedFateEvents(p, 'ultra'), ...D.getDecisionsFor(p, 'ultra')]),
      ...D.GENERIC_LATE_GAME_DECISIONS, ...F.ALL_FIELD_CARDS,
    ].map((x) => x.id));
    for (const id of Object.keys(SITUATION_REQUIRES)) expect(ids.has(id), id).toBe(true);
  });
});
