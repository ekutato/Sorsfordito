// Körről körre görgetett számítás: minden körben az előző záró egyenleg + a napló összege = az új egyenleg,
// és a nettó vagyon = egyenleg + befektetések értéke − tartozás. Mindhárom karakter, Sprint és Maraton.
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/game-store';
import { rollBoard, resolveFieldCard, acknowledgeOutcome } from '@/store/board-actions';
import { applyDecisionOption } from '@/store/decision-finance';
import { endSummary } from '@/engine/end-summary';
import { getDecisionsFor, getDecisionForRound } from '@/data/decisions';
import { cardForField, canAfford } from '@/data/field-cards';
import { BOARD } from '@/data/board';
import { DEFAULT_RULES, TIME_SCALE_CONFIGS, type LifeSituationId, type TimeScale } from '@/types/game';

const sheetOf = () => { const g = useGameStore.getState().game!; return g.players[g.activePlayerIndex].financialSheet; };
const roundImpact = (round: number) => useGameStore.getState().game!.eventLog
  .filter((e) => e.round === round).reduce((s, e) => s + (e.financialImpact ?? 0), 0);

function playGame(preset: LifeSituationId, timeScale: TimeScale, pick: number) {
  const st = useGameStore.getState();
  st.startNewGame({ timeScale, mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, preset, 'Teszt');
  const decisions = getDecisionsFor(preset, timeScale);
  const total = TIME_SCALE_CONFIGS[timeScale].totalRounds;
  const problems: string[] = [];
  for (let r = 1; r <= total; r++) {
    const before = sheetOf().balance;
    rollBoard({ value: ((r * 7 + pick) % 6) + 1, source: 'test' });
    const g = useGameStore.getState().game!;
    const field = BOARD[g.board!.position];
    const card = cardForField(field.type, g.board!.visits[field.type] ?? 0, g.gameId);
    if (card) {
      const affordable = card.options.filter((o) => canAfford(o, sheetOf().balance));
      resolveFieldCard(field.type, affordable[(r + pick) % affordable.length], card);
      acknowledgeOutcome?.();
    } else resolveFieldCard(field.type);
    st.processRoundIncome();
    st.processRoundExpenses();
    const done = useGameStore.getState().game!.eventLog.map((e) => e.details?.decisionCardId).filter(Boolean) as string[];
    const d = getDecisionForRound(decisions, r, done, sheetOf().expenses.housing);
    if (d) applyDecisionOption(d, d.options[(r + pick) % d.options.length]);
    const after = sheetOf().balance;
    const logged = roundImpact(r);
    if (Math.round(after - before) !== Math.round(logged)) problems.push(`${preset}/${timeScale} ${r}. kör: egyenleg ${after - before}, napló ${logged}`);
    const s = sheetOf();
    const nw = s.balance + s.investments.reduce((a, i) => a + i.currentValue, 0) - s.debts.reduce((a, d) => a + d.remainingAmount, 0);
    if (Math.round(nw) !== Math.round(s.computed.netWorth)) problems.push(`${preset} ${r}. kör: nettó vagyon ${s.computed.netWorth} ≠ ${nw}`);
    if (s.expenses.loanPayments !== s.debts.reduce((a, d) => a + d.monthlyPayment, 0)) problems.push(`${preset} ${r}. kör: törlesztő ${s.expenses.loanPayments} ≠ hitelek ${s.debts.reduce((a, d) => a + d.monthlyPayment, 0)}`);
    st.takeFinancialSnapshot();
    st.advanceRound();
  }
  // A játék végi kimutatás egyezik: kezdő tőke + tételek = egyenleg; egyenleg + befektetés + vagyontárgy − tartozás = nettó vagyon
  const sum = endSummary(useGameStore.getState().game!);
  const cash = sum.startBalance + sum.cashLines.reduce((a, l) => a + l.amount, 0);
  if (Math.round(cash) !== Math.round(sum.balance)) problems.push(`${preset}/${timeScale} végső kimutatás: ${cash} ≠ ${sum.balance}`);
  const nw = sum.balance + sum.investmentsValue + sum.assets.reduce((a, x) => a + x.value, 0) - sum.debts.reduce((a, d) => a + d.remaining, 0);
  if (Math.round(nw) !== Math.round(sum.netWorth)) problems.push(`${preset}/${timeScale} végső nettó vagyon: ${nw} ≠ ${sum.netWorth}`);
  const log = useGameStore.getState().game!.eventLog;
  stats.decisions += log.filter((e) => e.type === 'decision' && e.details?.decisionCardId).length;
  stats.field += log.filter((e) => e.type === 'field').length;
  stats.debts += log.filter((e) => /Új tartozás|törlesztés/.test(e.description)).length;
  stats.invests += log.filter((e) => e.description.startsWith('Befektetés (')).length;
  return problems;
}
export const stats = { decisions: 0, field: 0, debts: 0, invests: 0 };

describe('körről körre: napló = egyenlegváltozás, vagyon = egyenleg + befektetés − tartozás', () => {
  beforeEach(() => useGameStore.getState().resetGame());
  for (const preset of ['fresh_start', 'career_start', 'inheritance'] as LifeSituationId[]) {
    for (const ts of ['sprint', 'marathon'] as TimeScale[]) {
      it(`${preset} / ${ts}`, () => {
        const problems = [0, 1, 2].flatMap((pick) => { useGameStore.getState().resetGame(); return playGame(preset, ts, pick); });
        expect(problems).toEqual([]);

      });
    }
  }
  it('a szimuláció valóban érint döntést, mezőkártyát, hitelt és befektetést', () => {
    expect(stats.decisions).toBeGreaterThan(50);
    expect(stats.field).toBeGreaterThan(10);
    expect(stats.debts).toBeGreaterThan(0);
    expect(stats.invests).toBeGreaterThan(0);
  });
});

describe('hitelek a döntésekből', () => {
  beforeEach(() => useGameStore.getState().resetGame());
  const start = (preset: LifeSituationId, ts: TimeScale = 'sprint') =>
    useGameStore.getState().startNewGame({ timeScale: ts, mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, preset, 'Teszt');
  const decision = (preset: LifeSituationId, id: string, ts: TimeScale = 'sprint') => {
    const d = getDecisionsFor(preset, ts).find((x) => x.options.some((o) => o.id === id))!;
    return { d, o: d.options.find((o) => o.id === id)! };
  };

  it('Petra végtörlesztése: a hitelrekord megszűnik, a vagyon nem csökken kétszer', () => {
    start('inheritance');
    const nw0 = sheetOf().computed.netWorth;
    const { d, o } = decision('inheritance', 'inh-d01-a');
    applyDecisionOption(d, o);
    const s = sheetOf();
    expect(s.debts).toHaveLength(0);
    expect(s.expenses.loanPayments).toBe(0);
    expect(s.computed.netWorth).toBe(nw0);
  });

  it('DH2 extra törlesztéssel: valódi tartozás, a havi kiadás nem csökken', () => {
    start('career_start');
    const exp0 = sheetOf().computed.totalExpenses;
    const { d, o } = decision('career_start', 'dani-d03-a');
    applyDecisionOption(d, o);
    const s = sheetOf();
    expect(s.debts.find((x) => x.type === 'student_loan')?.remainingAmount).toBe(3_200_000);
    expect(s.computed.totalExpenses).toBe(exp0 + 50_000);
  });

  it('PMÁP a döntésből a portfólióba kerül, a vagyon nem csökken', () => {
    start('career_start');
    const nw0 = sheetOf().computed.netWorth;
    const { d, o } = decision('career_start', 'dani-d04-a');
    applyDecisionOption(d, o);
    const s = sheetOf();
    expect(s.investments.map((i) => i.optionId)).toContain('inv-pmap');
    expect(s.computed.netWorth).toBe(nw0);
    expect(s.income.passive).toBeGreaterThan(0);
  });

  it('lakásvásárlás hitelből: lakás + tartozás, a vagyon csak a díjakkal változik', async () => {
    const { annuityPayment } = await import('@/engine/loans');
    start('inheritance');
    const nw0 = sheetOf().computed.netWorth;
    const { d, o } = decision('inheritance', 'inh-d06-a');
    applyDecisionOption(d, o);
    const s = sheetOf();
    const loan = s.debts.find((x) => x.type === 'mortgage')!;
    expect(Math.abs(annuityPayment(loan.originalAmount, loan.interestRate, 240) - 120_000)).toBeLessThan(200);
    expect(s.investments.find((i) => i.optionId === 'asset:lakas')?.currentValue).toBe(3_000_000 + loan.originalAmount);
    expect(s.computed.netWorth).toBe(nw0);
  });
});
