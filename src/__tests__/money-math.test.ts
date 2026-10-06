import { describe, it, expect } from 'vitest';
import { amortizeDebts, applyInflation } from '@/engine/financial-calculator';
import { monthlyInvestmentIncome, investmentTarget } from '@/engine/investment-income';
import { INVESTMENT_OPTIONS } from '@/data/investment-options';
import { LIVE_DATA } from '@/data/live';
import { useGameStore } from '@/store/game-store';
import { netAfterTurning25, netFromGross, grossFromNet, round25 } from '@/data/tax-2026';
import { DEFAULT_RULES } from '@/types/game';
import { getDecisionsFor, getDecisionForRound } from '@/data/decisions';
import { CHARACTER_PRESETS } from '@/data/character-presets';
import type { Debt } from '@/types/financial';

const petraLoan: Debt = {
  id: 'd', type: 'personal_loan', name: 'Személyi kölcsön', originalAmount: 1_800_000, remainingAmount: 1_800_000,
  interestRate: 12.5, monthlyPayment: 42_000, remainingMonths: 60, isInterestFree: false,
};

describe('hiteltörlesztés', () => {
  it('a részletből a kamat feletti rész csökkenti a tartozást', () => {
    const r = amortizeDebts([petraLoan], 1, 1);
    // kamat: 1 800 000 × 12,5% / 12 = 18 750; tőke: 42 000 - 18 750 = 23 250
    expect(r.interestPaid).toBe(18_750);
    expect(r.debts[0].remainingAmount).toBe(1_776_750);
    expect(r.refund).toBe(0);
  });

  it('negyedéves körben három havi lépés, kamatos alapon', () => {
    const r = amortizeDebts([petraLoan], 3, 1);
    let rem = 1_800_000;
    for (let m = 0; m < 3; m++) rem -= 42_000 - Math.round(rem * 0.125 / 12);
    expect(r.debts[0].remainingAmount).toBe(rem);
  });

  it('a hitel elfogy: a túlfizetés visszajár, a törlesztő megszűnik', () => {
    const small = { ...petraLoan, remainingAmount: 50_000 };
    const r = amortizeDebts([small], 3, 1);
    // 1. hó: kamat 521, tőke 41 479 → marad 8 521; 2. hó: kamat 89, a teljes maradék 8 521 + 89 = 8 610
    // a 2. havi részletből 42 000 - 8 610 = 33 390 visszajár, a 3. havi részlet (42 000) egészben
    expect(r.debts).toHaveLength(0);
    expect(r.loanPaymentsDrop).toBe(42_000);
    expect(r.refund).toBe(33_390 + 42_000);
  });

  it('kamatmentes, még nem induló hitelnél nincs mozgás', () => {
    const dh = { ...petraLoan, interestRate: 0, isInterestFree: true, repaymentStartsAtRound: 6 };
    expect(amortizeDebts([dh], 1, 2).debts[0].remainingAmount).toBe(1_800_000);
  });
});

describe('befektetési jövedelem', () => {
  const opt = (id: string) => INVESTMENT_OPTIONS.find((o) => o.id === id)!;
  it('állampapír: a heti PMÁP-kamatból, adómentesen', () => {
    const y = LIVE_DATA.ertekek['akk.pmapYield'].value;
    expect(monthlyInvestmentIncome(opt('inv-pmap'))).toBe(Math.round(opt('inv-pmap').entryPrice * y / 100 / 12));
  });
  it('bankbetét: a heti betéti kamatból, 28% kamatadó után', () => {
    const y = LIVE_DATA.ertekek['bank.depositRate'].value;
    expect(monthlyInvestmentIncome(opt('inv-bank-deposit'))).toBe(Math.round(opt('inv-bank-deposit').entryPrice * y * 0.72 / 100 / 12));
  });
  it('a képzés és a távmunka a fizetést emeli, a napelem a rezsit csökkenti', () => {
    expect(investmentTarget(opt('inv-language'))).toBe('salary');
    expect(investmentTarget(opt('inv-solar-panel'))).toBe('utilities');
    expect(investmentTarget(opt('inv-room-rent'))).toBe('passive');
  });
});

describe('infláció', () => {
  it('éves ütem a teljes évre, a törlesztő nem drágul', () => {
    const e = applyInflation({ housing: 100_000, utilities: 0, food: 50_000, transport: 0, loanPayments: 42_000, other: 0 }, 4, 12);
    expect(e.housing).toBe(104_000);
    expect(e.food).toBe(52_000);
    expect(e.loanPayments).toBe(42_000);
  });
});

describe('kör: bevétel - kiadás = egyenlegváltozás', () => {
  it('Pályakezdő, 3 kör döntés nélkül: pontosan a havi szabad pénz gyűlik', () => {
    const st = useGameStore.getState();
    st.startNewGame({ timeScale: 'sprint', mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, 'career_start', 'Teszt');
    const sheet0 = useGameStore.getState().game!.players[0].financialSheet;
    const free = sheet0.income.salary + sheet0.income.passive - sheet0.computed.totalExpenses;
    expect(sheet0.computed.totalExpenses).toBe(40_000 + 0 + 18_900 + 30_000);
    for (let r = 0; r < 3; r++) { useGameStore.getState().processRoundIncome(); useGameStore.getState().processRoundExpenses(); }
    expect(useGameStore.getState().game!.players[0].financialSheet.balance).toBe(sheet0.balance + 3 * free);
  });

  it('Petra: a törlesztő levonódik, és a tartozás is csökken', () => {
    const st = useGameStore.getState();
    st.startNewGame({ timeScale: 'sprint', mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, 'inheritance', 'Teszt');
    const before = useGameStore.getState().game!.players[0].financialSheet;
    useGameStore.getState().processRoundExpenses();
    const after = useGameStore.getState().game!.players[0].financialSheet;
    expect(after.balance).toBe(before.balance - before.computed.totalExpenses);
    expect(after.debts[0].remainingAmount).toBe(1_776_750);
    // nettó vagyon: a kiadás csökkenti, a tőketörlesztés (23 250) visszahozza
    expect(after.computed.netWorth).toBe(before.computed.netWorth - before.computed.totalExpenses + 23_250);
  });
});

describe('25. születésnap: megszűnik a fiatalok SZJA-mentessége', () => {
  it('a bér nettója a 2026-os kulcsokkal', () => {
    // 320 000 nettó 25 év alatt = 392 638 bruttó; 25 felett 392 638 × (1 - 0,185 - 0,15) = 261 104
    expect(netAfterTurning25(320_000)).toBe(261_104);
    expect(Math.round(netFromGross(392_638, true))).toBe(320_000);
    // a határ fölött 25 alatt is van SZJA a határ feletti részre
    expect(Math.round(netFromGross(800_000, true))).toBe(Math.round(800_000 * 0.815 - (800_000 - 715_765) * 0.15));
    expect(Math.round(grossFromNet(netFromGross(800_000, true), true))).toBe(800_000);
  });

  it('melyik körtől: Sprint 7., Maraton 3., Ultra 2.; Zsófi csak Ultrában', () => {
    expect(round25(24, 5, 1, 12)).toBe(7);
    expect(round25(24, 5, 3, 20)).toBe(3);
    expect(round25(24, 5, 6, 20)).toBe(2);
    expect(round25(18, 11, 3, 20)).toBeUndefined();
    expect(round25(18, 11, 6, 20)).toBe(15);
    expect(round25(30, 5, 1, 12)).toBeUndefined();
  });

  it('Pályakezdő Sprint: a 7. körben egyszer csökken a nettó', () => {
    useGameStore.getState().startNewGame({ timeScale: 'sprint', mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, 'career_start', 'Teszt');
    const sal = () => useGameStore.getState().game!.players[0].financialSheet.income.salary;
    for (let r = 1; r <= 8; r++) {
      useGameStore.setState((s) => ({ game: { ...s.game!, currentRound: r } }));
      useGameStore.getState().processRoundIncome();
      expect(sal()).toBe(r < 7 ? 320_000 : 261_104);
    }
  });
});

describe('Pályakezdő lakhatási döntés: nincs dupla költség', () => {
  it('kiköltözés: a lakhatás = budapesti átlag, az otthoni hozzájárulás kiesik; étkezés + rezsi jön', () => {
    const d01 = getDecisionsFor('career_start', 'sprint').find((d) => d.id === 'dani-d01')!;
    const base = CHARACTER_PRESETS.career_start.startingFinancials;
    const rent = LIVE_DATA.ertekek['realEstate.budapestRentAvg'].value;
    const sum = (id: string, t: string) => d01.options.find((o) => o.id === id)!.financialEffects.filter((e) => e.target === t).reduce((a, e) => a + e.amount, 0);
    expect(base.housing + sum('dani-d01-a', 'housing')).toBe(rent);
    expect(base.housing + sum('dani-d01-c', 'housing')).toBe(Math.round(rent / 2));
    expect(base.food + sum('dani-d01-a', 'food')).toBe(27_100);
    expect(sum('dani-d01-b', 'housing') + sum('dani-d01-b', 'food')).toBe(0);
  });

  it('albérletes döntés otthon lakónak nem jön; a kiadás nem mehet 0 alá', () => {
    const fake = [{ id: 'x', availableAtRounds: [3], requires: { rentsHome: true } }, { id: 'y', availableAtRounds: [3] }] as never;
    expect(getDecisionForRound(fake, 3, [], 40_000)!.id).toBe('y');
    expect(getDecisionForRound(fake, 3, [], 260_000)!.id).toBe('x');
    useGameStore.getState().startNewGame({ timeScale: 'sprint', mode: 'solo', playerCount: 1, useLiveData: false, startDate: '2026-10', rules: DEFAULT_RULES }, 'career_start', 'Teszt');
    const pid = useGameStore.getState().game!.players[0].playerId;
    useGameStore.getState().modifyExpenses(pid, 'housing', -100_000);
    expect(useGameStore.getState().game!.players[0].financialSheet.expenses.housing).toBe(0);
  });
});
