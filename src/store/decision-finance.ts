// A döntések pénzügyi szerkezete: valódi befektetés, hitel, előtörlesztés, hitelkiváltás, vagyontárgy.
// Minden egyenlegmozgás a kör naplójába kerül, így a kör összegzése kiadja az egyenlegváltozást.
import { useGameStore } from './game-store';
import { INVESTMENT_OPTIONS } from '@/data/investment-options';
import { monthlyInvestmentIncome, investmentTarget } from '@/engine/investment-income';
import { makeDebt, resolveLoan } from '@/engine/loans';
import { formatHUF } from '@/engine/financial-calculator';
import { TIME_SCALE_CONFIGS, type DecisionCard, type DecisionOption } from '@/types/game';
import { isWellbeingTarget, wellbeingKeyOf } from '@/types/wellbeing';
import { adjustTopDebt, scheduleEffect } from './board-actions';
import type { Debt, Investment } from '@/types/financial';

/** A befektetés havi hatása tetszőleges összegre (a kártya ára arányában) */
export function scaledMonthlyIncome(optionId: string, amount: number): number {
  const o = INVESTMENT_OPTIONS.find((x) => x.id === optionId);
  if (!o) return 0;
  return monthlyInvestmentIncome({ ...o, entryPrice: amount, monthlyPassiveIncome: Math.round((o.monthlyPassiveIncome * amount) / o.entryPrice) });
}

/** A legdrágább (legnagyobb kamatú) megfelelő hitel */
function pickDebt(debts: Debt[], type?: Debt['type']): Debt | undefined {
  return [...debts].filter((d) => !type || d.type === type).sort((a, b) => b.interestRate - a.interestRate)[0];
}

export function applyDecisionFinance(option: DecisionOption, label: string): void {
  const st = useGameStore.getState();
  const game = st.game;
  if (!game) return;
  const pid = game.players[game.activePlayerIndex].playerId;
  const round = game.currentRound;
  const sheet = () => useGameStore.getState().game!.players[useGameStore.getState().game!.activePlayerIndex].financialSheet;

  for (const inv of option.invests ?? []) {
    const o = INVESTMENT_OPTIONS.find((x) => x.id === inv.optionId);
    if (!o || inv.amount <= 0) continue;
    const investment: Investment = {
      optionId: o.id, purchasePrice: inv.amount, purchasedAtRound: round, currentValue: inv.amount,
      totalIncomeGenerated: 0, monthlyIncome: scaledMonthlyIncome(o.id, inv.amount), incomeTarget: investmentTarget(o),
    };
    st.addInvestment(pid, investment);
    st.logEvent({ type: 'investment', description: `Befektetés (${label}): ${o.name}`, financialImpact: -inv.amount });
  }

  let principal = 0;
  if (option.takesLoan) {
    const debt = makeDebt(option.takesLoan, `debt-${option.id}-${round}`);
    principal = debt.originalAmount;
    st.addDebt(pid, debt, !!option.takesLoan.disburse);
    if (option.takesLoan.disburse) st.logEvent({ type: 'decision', description: `Hitel folyósítva: ${debt.name}`, financialImpact: debt.originalAmount });
    st.logEvent({ type: 'decision', description: `Új tartozás: ${debt.name} - ${debt.originalAmount.toLocaleString('hu-HU')} Ft, ${debt.interestRate.toLocaleString('hu-HU')}%, ${debt.monthlyPayment.toLocaleString('hu-HU')} Ft/hó`, financialImpact: 0 });
  }

  if (option.acquiresAsset) {
    const a = option.acquiresAsset;
    // A vagyontárgy a nettó vagyonban szerepel; a kifizetett önerő a döntés egyenleghatása, a többi a hitel
    const value = a.value + (a.plusLoanPrincipal ? principal : 0);
    st.addInvestment(pid, {
      optionId: `asset:${a.id}`, assetName: a.name, purchasePrice: value, purchasedAtRound: round, currentValue: value, totalIncomeGenerated: 0,
      ...(a.monthlyIncome ? { monthlyIncome: a.monthlyIncome, incomeTarget: 'passive' as const } : {}),
    });
    // Az addInvestment levonja a vételárat; a ténylegesen kifizetett rész a döntés egyenleghatása, a többi a hitel
    st.modifyBalance(pid, value, 'Vagyontárgy (nem készpénz)');
  }

  if (option.paysOffLoan) {
    const d = pickDebt(sheet().debts, option.paysOffLoan.type);
    if (d) {
      const paid = Math.min(option.paysOffLoan.amount ?? d.remainingAmount, d.remainingAmount, Math.max(0, sheet().balance));
      if (paid > 0) {
        st.payDebt(pid, d.id, paid);
        st.logEvent({ type: 'decision', description: paid >= d.remainingAmount ? `Végtörlesztés: ${d.name}` : `Előtörlesztés: ${d.name}`, financialImpact: -paid });
      }
    }
  }

  if (option.adjustsLoan) {
    const d = pickDebt(sheet().debts, option.adjustsLoan.type);
    if (d) {
      st.adjustDebtPayment(pid, d.id, option.adjustsLoan.paymentDelta, option.adjustsLoan.ratePct);
      st.logEvent({ type: 'decision', description: `${d.name}: új törlesztő ${(d.monthlyPayment + option.adjustsLoan.paymentDelta).toLocaleString('hu-HU')} Ft/hó`, financialImpact: 0 });
    }
  }
}

/** Egy azonnali vagy tartós hatás a megfelelő mezőre */
function applyTarget(pid: string, target: string, amount: number, description: string) {
  const st = useGameStore.getState();
  if (target === 'balance') st.modifyBalance(pid, amount, description);
  else if (target === 'salary' || target === 'passive') st.modifyIncome(pid, target, amount);
  else if (target === 'loanPayments') adjustTopDebt(amount); // a törlesztő a hitelekből adódik
  else if (['housing', 'utilities', 'food', 'transport', 'other'].includes(target)) st.modifyExpenses(pid, target as 'housing', amount);
  else if (isWellbeingTarget(target)) st.modifyWellbeing(pid, wellbeingKeyOf(target), amount);
}

/** Egy döntés teljes alkalmazása: hatások, tartós hatások, befektetés/hitel, tudás, napló */
export function applyDecisionOption(decision: Pick<DecisionCard, 'id' | 'title'>, option: DecisionOption): void {
  const st = useGameStore.getState();
  const game = st.game;
  if (!game) return;
  const pid = game.players[game.activePlayerIndex].playerId;

  if (option.setsSalary) {
    const current = game.players[game.activePlayerIndex].financialSheet.income.salary;
    applyTarget(pid, 'salary', option.setsSalary.amount - current, option.setsSalary.description);
  }
  if (option.raisesSalaryPct) {
    const current = useGameStore.getState().game!.players[game.activePlayerIndex].financialSheet.income.salary;
    applyTarget(pid, 'salary', Math.round((current * option.raisesSalaryPct) / 100 / 1000) * 1000, `Fizetésemelés (+${option.raisesSalaryPct}%)`);
  }
  for (const e of option.financialEffects) applyTarget(pid, e.target, e.amount, e.description);

  // Tartós hatások: azonnal vagy késleltetve indulnak, és ha van időtartamuk, lejárnak
  const months = TIME_SCALE_CONFIGS[game.config.timeScale].monthsPerRound;
  for (const oe of option.ongoingEffects ?? []) {
    const delay = oe.startAfterRounds ?? (oe.startAfterMonths ? Math.ceil(oe.startAfterMonths / months) : 0);
    const startRound = game.currentRound + delay;
    if (delay > 0) scheduleEffect(startRound, oe.target, oe.monthlyAmount, `Indul: ${oe.description}`);
    else applyTarget(pid, oe.target, oe.monthlyAmount, oe.description);
    const duration = oe.durationMonths ? Math.max(1, Math.ceil(oe.durationMonths / months)) : oe.durationRounds;
    if (duration > 0) scheduleEffect(startRound + duration, oe.target, -oe.monthlyAmount, `Lejárt: ${oe.description}`);
    st.logEvent({
      type: 'income',
      description: `Tartós hatás: ${oe.description} (${oe.monthlyAmount > 0 ? '+' : '−'}${Math.abs(oe.monthlyAmount).toLocaleString('hu-HU')} Ft/hó${delay > 0 ? `, a ${startRound}. körtől` : ''}${duration > 0 ? `, ${duration} körig` : ''})`,
      financialImpact: 0,
    });
  }

  applyDecisionFinance(option, decision.title);

  for (const kid of option.unlocksKnowledge ?? []) st.addKnowledge(pid, kid);

  // A döntés naplója (a decisionCardId alapján nem ismétlődik); a befektetés/hitel külön sorban szerepel
  st.logEvent({
    type: 'decision',
    description: `${decision.title}: ${option.label}`,
    financialImpact: option.financialEffects.filter((e) => e.target === 'balance').reduce((sum, e) => sum + e.amount, 0),
    details: { decisionCardId: decision.id, optionId: option.id },
  });
}

/** A döntés azonnali készpénzigénye (befizetés, önerő, befektetés) - a fedezet ellenőrzéséhez */
export function decisionCost(option: DecisionOption): number {
  const balance = option.financialEffects.filter((e) => e.target === 'balance').reduce((sum, e) => sum + e.amount, 0);
  const disbursed = option.takesLoan?.disburse ? (option.takesLoan.principal ?? 0) : 0;
  const invested = (option.invests ?? []).reduce((sum, i) => sum + i.amount, 0);
  return Math.max(0, invested - balance - disbursed);
}

/** Választható-e: fedezet kell; ha egyik sem fizethető ki, a legolcsóbb választható (nincs zsákutca) */
export function affordableOptions(options: DecisionOption[], balance: number): Set<string> {
  const ok = options.filter((o) => decisionCost(o) <= Math.max(0, balance));
  if (ok.length) return new Set(ok.map((o) => o.id));
  const cheapest = [...options].sort((a, b) => decisionCost(a) - decisionCost(b))[0];
  return new Set(cheapest ? [cheapest.id] : []);
}

/** A döntés pénzügyi szerkezete röviden (előnézethez): befektetés, hitel, előtörlesztés, vagyontárgy */
export function financeNotes(option: DecisionOption): Array<{ text: string; tone: 'info' | 'bad' | 'good' }> {
  const out: Array<{ text: string; tone: 'info' | 'bad' | 'good' }> = [];
  for (const i of option.invests ?? []) {
    out.push({ text: `Befektetés: ${INVESTMENT_OPTIONS.find((o) => o.id === i.optionId)?.name ?? i.optionId}, ${formatHUF(i.amount)}`, tone: 'info' });
  }
  if (option.takesLoan) {
    const l = resolveLoan(option.takesLoan);
    out.push({ text: `Hitel: ${formatHUF(l.principal)}, ${l.ratePct.toLocaleString('hu-HU')}%, törlesztő ${formatHUF(l.monthlyPayment)}/hó`, tone: 'bad' });
  }
  if (option.raisesSalaryPct) out.push({ text: `Fizetésemelés: +${option.raisesSalaryPct}% a mostani fizetésedből`, tone: 'good' });
  if (option.setsSalary) out.push({ text: option.setsSalary.amount > 0 ? `Új fizetés: ${formatHUF(option.setsSalary.amount)}/hó (a mostani helyett)` : 'A mostani fizetésed megszűnik', tone: option.setsSalary.amount > 0 ? 'info' : 'bad' });
  if (option.acquiresAsset) out.push({ text: `Vagyontárgy: ${option.acquiresAsset.name}`, tone: 'info' });
  if (option.paysOffLoan) out.push({ text: option.paysOffLoan.amount ? `Előtörlesztés: ${formatHUF(option.paysOffLoan.amount)}` : 'Végtörlesztés: a hitel megszűnik', tone: 'good' });
  if (option.adjustsLoan) out.push({ text: `Hitelkiváltás: törlesztő ${option.adjustsLoan.paymentDelta < 0 ? '\u2212' : '+'}${formatHUF(Math.abs(option.adjustsLoan.paymentDelta))}/hó`, tone: 'good' });
  return out;
}
