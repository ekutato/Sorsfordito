// Mínusz egyenleg: kötelező rendezés, a helyzethez illő megoldásokkal; a napló egyezik az egyenlegváltozással.
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/game-store';
import { crisisChoices, resolveCrisis } from '@/store/crisis-actions';
import { DEFAULT_RULES, type LifeSituationId } from '@/types/game';

const game = () => useGameStore.getState().game!;
const sheet = () => game().players[0].financialSheet;
const pid = () => game().players[0].playerId;
function start(preset: LifeSituationId) {
  useGameStore.getState().resetGame();
  useGameStore.getState().startNewGame({ timeScale: 'sprint', mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, preset, 'T');
}
const avail = () => Object.fromEntries(crisisChoices(game()).map((c) => [c.id, c.available]));
const logSum = () => game().eventLog.reduce((s, e) => s + (e.financialImpact ?? 0), 0);

describe('mínusz egyenleg: válságkezelés', () => {
  beforeEach(() => useGameStore.getState().resetGame());

  it('18 éves, otthon, jövedelem nélkül: a szülők segítenek vagy késedelem; bankhitel nincs', () => {
    start('fresh_start');
    useGameStore.getState().modifyBalance(pid(), -sheet().balance - 50_000, 'teszt');
    expect(avail()).toMatchObject({ family: true, loan: false, overdue: true, sell: false });
    const before = sheet().balance, log0 = logSum();
    expect(resolveCrisis('family')).toBe(true);
    expect(sheet().balance).toBe(0);
    expect(logSum() - log0).toBe(sheet().balance - before);
    expect(sheet().debts.length).toBe(0); // jövedelem nélkül nem kölcsön, hanem segítség
  });

  it('dolgozó pályakezdő: személyi kölcsön valódi hitelként; késedelemnél tartozás és stressz', () => {
    start('career_start');
    useGameStore.getState().modifyBalance(pid(), -sheet().balance - 120_000, 'teszt');
    expect(avail().loan).toBe(true);
    resolveCrisis('loan');
    expect(sheet().balance).toBeGreaterThanOrEqual(0);
    expect(sheet().debts.some((d) => d.type === 'personal_loan' && d.monthlyPayment > 0)).toBe(true);
    useGameStore.getState().modifyBalance(pid(), -sheet().balance - 30_000, 'teszt');
    const wb = { ...sheet().wellbeing };
    resolveCrisis('overdue');
    expect(sheet().debts.some((d) => d.type === 'overdue')).toBe(true);
    expect(sheet().wellbeing!.egyensuly).toBe((wb.egyensuly ?? 0) - 1);
  });

  it('befektetés eladása csak akkor, ha fedezi a hiányt', () => {
    start('inheritance');
    useGameStore.getState().addInvestment(pid(), { optionId: 'inv-pmap', purchasePrice: 300_000, purchasedAtRound: 1, currentValue: 300_000, totalIncomeGenerated: 0, monthlyIncome: 0, incomeTarget: 'passive' });
    useGameStore.getState().modifyBalance(pid(), -sheet().balance - 200_000, 'teszt');
    expect(avail().sell).toBe(true);
    resolveCrisis('sell');
    expect(sheet().balance).toBe(100_000);
    expect(sheet().investments.some((i) => i.optionId === 'inv-pmap')).toBe(false);
  });

  it('nincs mínusz: nincs teendő', () => {
    start('career_start');
    expect(crisisChoices(game()).some((c) => c.available)).toBe(false);
  });
});
