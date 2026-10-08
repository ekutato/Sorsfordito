// A játék végi tételes kimutatás a naplóból: kezdő tőke → készpénz (kategóriánként),
// mennyi lenne befektetések nélkül, és a befektetések tételesen. A napló összege = egyenlegváltozás
// (lásd rollover.test.ts), így a két oldal és a nettó vagyon egyezik.
import type { GameState } from '@/types/game';
import type { Investment } from '@/types/financial';
import { INVESTMENT_OPTIONS } from '@/data/investment-options';

export interface CashLine { key: string; label: string; amount: number }
export interface InvestmentLine { name: string; invested: number; value: number; income: number; result: number; round: number }

export interface EndSummary {
  startBalance: number;
  cashLines: CashLine[];
  balance: number;
  /** Befektetésekre fordított készpénz (a portfólióba ment, nem veszett el) */
  investedCash: number;
  /** A befektetések által jóváírt hozam / béremelés / rezsimegtakarítás (benne van a bevételben) */
  investmentIncome: number;
  /** Befektetések nélkül ennyi lenne a pénzed */
  withoutInvesting: number;
  growthWithout: number;
  investments: InvestmentLine[];
  investmentsValue: number;
  investmentResult: number;
  assets: Array<{ name: string; value: number }>;
  debts: Array<{ name: string; remaining: number }>;
  netWorth: number;
  growthTotal: number;
}

const nameOf = (inv: Investment) => inv.assetName ?? INVESTMENT_OPTIONS.find((o) => o.id === inv.optionId)?.name ?? inv.optionId;

export function endSummary(game: GameState): EndSummary {
  const sheet = game.players[game.activePlayerIndex].financialSheet;
  const startBalance = sheet.startBalance ?? 0;
  const log = game.eventLog.filter((e) => e.financialImpact);
  const sum = (f: (e: (typeof log)[number]) => boolean) => log.filter(f).reduce((a, e) => a + (e.financialImpact ?? 0), 0);
  const isKnowledge = (d: string) => d.startsWith('Tudás kártya:');
  const isInvestBuy = (d: string) => d.startsWith('Befektetés');
  const investedCash = -sum((e) => e.type === 'investment' && isInvestBuy(e.description));

  const cashLines: CashLine[] = [
    { key: 'income', label: 'Bevételek (bér, hozam)', amount: sum((e) => e.type === 'income') },
    { key: 'expense', label: 'Megélhetési kiadások és törlesztők', amount: sum((e) => e.type === 'expense') },
    { key: 'decision', label: 'Döntések (önerő, hitel, előtörlesztés)', amount: sum((e) => e.type === 'decision') },
    { key: 'fate', label: 'Sorskártyák', amount: sum((e) => e.type === 'fate' || e.type === 'crisis') },
    { key: 'field', label: 'Mezőkártyák (csapda, kísértés, találkozás…)', amount: sum((e) => e.type === 'field') },
    { key: 'knowledge', label: 'Tudáskártyák', amount: sum((e) => e.type === 'investment' && isKnowledge(e.description)) },
    { key: 'invested', label: 'Befektetésre fordítva (a portfólióba került)', amount: -investedCash },
  ].filter((l) => l.amount !== 0);

  const financial = sheet.investments.filter((i) => !i.optionId.startsWith('asset:'));
  const investmentIncome = financial.reduce((a, i) => a + (i.totalIncomeGenerated ?? 0), 0);
  const investments: InvestmentLine[] = financial.map((i) => ({
    name: nameOf(i), invested: i.purchasePrice, value: i.currentValue, income: i.totalIncomeGenerated ?? 0,
    result: i.currentValue - i.purchasePrice + (i.totalIncomeGenerated ?? 0), round: i.purchasedAtRound,
  }));
  const investmentsValue = financial.reduce((a, i) => a + i.currentValue, 0);
  const withoutInvesting = sheet.balance + investedCash - investmentIncome;
  const assets = sheet.investments.filter((i) => i.optionId.startsWith('asset:')).map((i) => ({ name: nameOf(i), value: i.currentValue }));
  const debts = sheet.debts.map((d) => ({ name: d.name, remaining: d.remainingAmount }));
  const netWorth = sheet.computed.netWorth;
  return {
    startBalance, cashLines, balance: sheet.balance, investedCash, investmentIncome, withoutInvesting,
    growthWithout: withoutInvesting - startBalance,
    investments, investmentsValue, investmentResult: investments.reduce((a, l) => a + l.result, 0),
    assets, debts, netWorth, growthTotal: netWorth - startBalance,
  };
}
