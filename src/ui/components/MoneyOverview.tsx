'use client';

// Átlátható pénzmozgás: kiemelt egyenleg (előző → most) és a befektetések tételes táblája.
import { INVESTMENT_OPTIONS } from '@/data/investment-options';
import { formatHUF } from '@/engine/financial-calculator';
import { signedHUF } from '@/engine/money-sign';
import { endSummary } from '@/engine/end-summary';
import { computeIndices } from '@/engine/indices';
import { RULESETS, DEFAULT_RULESET_ID } from '@/rulesets';
import { MoneyDelta } from '@/ui/components/Money';
import type { GameState } from '@/types/game';
import type { FinancialSheet } from '@/types/financial';

const nameOf = (id: string, assetName?: string) => assetName ?? INVESTMENT_OPTIONS.find((o) => o.id === id)?.name ?? id;
const signed = (n: number) => signedHUF(n);
const tone = (n: number) => (n > 0 ? 'text-money-positive' : n < 0 ? 'text-money-negative' : 'text-money-neutral');

/** Kiemelt egyenlegkártya: honnan hová jutottál ebben a hónapban */
export function BalanceHighlight({ label, before, after, note }: { label: string; before?: number; after: number; note?: string }) {
  const diff = before === undefined ? undefined : after - before;
  return (
    <div className="rounded-2xl p-4 text-center border-2" style={{ borderColor: '#F2A33A', background: 'rgba(242,163,58,.08)' }}>
      <p className="text-sm font-semibold text-[var(--color-text-muted)]">{label}</p>
      <p className="font-mono text-3xl font-extrabold mt-1" style={{ color: after < 0 ? '#F87171' : '#FBF7EE' }}>{formatHUF(after)}</p>
      {diff !== undefined && (
        <p className="text-sm mt-1">
          <span className="text-[var(--color-text-muted)]">előtte {formatHUF(before!)} · </span>
          <b className={tone(diff)}>{signed(diff)}</b>
        </p>
      )}
      {note && <p className="text-xs text-[var(--color-text-muted)] mt-1">{note}</p>}
    </div>
  );
}

/** A befektetések tételesen: befektetett összeg, mostani érték, a kör változása és a havi hozam */
export function InvestmentTable({ sheet, round, monthsInRound, title = 'Befektetéseid' }: { sheet: FinancialSheet; round: number; monthsInRound: number; title?: string }) {
  const rows = sheet.investments;
  if (!rows.length) return null;
  const totalIn = rows.reduce((a, r) => a + r.purchasePrice, 0);
  const totalVal = rows.reduce((a, r) => a + r.currentValue, 0);
  return (
    <div className="game-card">
      <h4 className="text-sm font-semibold mb-2">📈 {title}</h4>
      <ul className="space-y-2">
        {rows.map((r) => {
          const change = r.lastChangeRound === round ? r.lastChange ?? 0 : 0;
          const income = (r.monthlyIncome ?? 0) * monthsInRound;
          return (
            <li key={r.optionId} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
              <div className="flex justify-between gap-2">
                <b>{nameOf(r.optionId, r.assetName)}</b>
                <span className="font-mono">{formatHUF(r.currentValue)}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs text-[var(--color-text-muted)] mt-0.5">
                <span>befektetve: {formatHUF(r.purchasePrice)} ({r.purchasedAtRound}. kör)</span>
                <span className={tone(r.currentValue - r.purchasePrice)}>{signed(r.currentValue - r.purchasePrice)}</span>
              </div>
              {(change !== 0 || r.lastChangeRound === round) && (
                <p className="text-xs mt-0.5">Ebben a körben: <b className={tone(change)}>{signed(change)}</b>{r.lastReason ? ` - ${r.lastReason}` : ''}</p>
              )}
              {income > 0 && (
                <p className="text-xs mt-0.5">
                  {r.incomeTarget === 'salary' ? 'Béremelés' : r.incomeTarget === 'utilities' ? 'Rezsimegtakarítás' : 'Hozam (az egyenlegedre)'}:
                  {' '}<b className="text-money-positive">+{formatHUF(income)}</b>{monthsInRound > 1 ? ` (${monthsInRound} hónap)` : ' / hó'}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex justify-between text-sm font-semibold border-t border-white/10 mt-2 pt-2">
        <span>Összesen ({formatHUF(totalIn)} befektetve)</span>
        <span className="font-mono">{formatHUF(totalVal)}</span>
      </div>
    </div>
  );
}

/**
 * A játék vége, tételesen, két lap egymás mellett:
 * bal: kezdő tőke → növekmény befektetések nélkül; jobb: ugyanez a befektetésekkel, befektetésenként.
 * Alatta a vagyontárgyak, tartozások, a nettó vagyon, a pénzügyi szabadság és a jóllét.
 */
export function EndMoneyComparison({ game }: { game: GameState }) {
  const s = endSummary(game);
  const sheet = game.players[game.activePlayerIndex].financialSheet;
  const pct = (n: number) => (s.startBalance > 0 ? ` (${n >= 0 ? '+' : '\u2212'}${Math.abs(Math.round((n / s.startBalance) * 100)).toLocaleString('hu-HU')}%)` : '');
  const withInvesting = s.withoutInvesting + s.investmentResult;
  const wb = computeIndices(sheet, RULESETS[DEFAULT_RULESET_ID]).wellbeing;
  const row = (label: string, amount: number, key?: string) => (
    <li key={key ?? label} className="flex justify-between gap-2"><span className="text-[var(--color-text-muted)]">{label}</span><MoneyDelta amount={amount} /></li>
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl p-3 border border-white/15 bg-white/5 text-xs">
          <p className="font-semibold text-[var(--color-text-muted)]">Befektetések nélkül</p>
          <ul className="mt-2 space-y-1">
            <li className="flex justify-between gap-2"><span>Kezdő tőke</span><span className="font-mono">{formatHUF(s.startBalance)}</span></li>
            {s.cashLines.filter((l) => l.key !== 'invested').map((l) => row(l.label, l.key === 'income' ? l.amount - s.investmentIncome : l.amount, l.key))}
          </ul>
          <p className="mt-2 pt-2 border-t border-white/10 flex justify-between"><b>Ennyi lenne</b><b className="font-mono">{formatHUF(s.withoutInvesting)}</b></p>
          <p className="flex justify-between"><span>Növekmény</span><span><MoneyDelta amount={s.growthWithout} />{pct(s.growthWithout)}</span></p>
        </div>
        <div className="rounded-2xl p-3 border-2 text-xs" style={{ borderColor: '#25865A', background: 'rgba(37,134,90,.10)' }}>
          <p className="font-semibold text-[var(--color-text-muted)]">Befektetésekkel</p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex justify-between gap-2"><span>Befektetések nélkül</span><span className="font-mono">{formatHUF(s.withoutInvesting)}</span></li>
            {s.investments.map((l, i) => (
              <li key={i}>
                <span className="flex justify-between gap-2"><b>{l.name}</b><MoneyDelta amount={l.result} /></span>
                <span className="block text-[var(--color-text-muted)]">{formatHUF(l.invested)} → {formatHUF(l.value)}{l.income > 0 ? ` + hozam ${formatHUF(l.income)}` : ''} · {l.round}. kör</span>
              </li>
            ))}
            {!s.investments.length && <li className="text-[var(--color-text-muted)]">Nem fektettél be.</li>}
          </ul>
          <p className="mt-2 pt-2 border-t border-white/10 flex justify-between"><b>Összesen</b><b className="font-mono">{formatHUF(withInvesting)}</b></p>
          <p className="flex justify-between"><span>Növekmény</span><span><MoneyDelta amount={withInvesting - s.startBalance} />{pct(withInvesting - s.startBalance)}</span></p>
        </div>
      </div>
      <div className="rounded-xl bg-white/5 p-3 text-sm space-y-1">
        <p className="flex justify-between"><span>A befektetéseid eredménye</span><MoneyDelta amount={s.investmentResult} className="font-bold" /></p>
        {s.assets.map((a, i) => <p key={`a${i}`} className="flex justify-between text-[var(--color-text-muted)]"><span>+ {a.name}</span><span className="font-mono">{formatHUF(a.value)}</span></p>)}
        {s.debts.map((d, i) => <p key={`d${i}`} className="flex justify-between text-[var(--color-text-muted)]"><span>\u2212 {d.name}</span><span className="font-mono text-money-negative">{formatHUF(-d.remaining)}</span></p>)}
        <p className="flex justify-between border-t border-white/10 pt-1"><b>Nettó vagyon</b><b className="font-mono">{formatHUF(s.netWorth)}</b></p>
        <p className="flex justify-between"><span>Kezdő tőkéhez képest</span><span><MoneyDelta amount={s.growthTotal} />{pct(s.growthTotal)}</span></p>
        <p className="text-xs text-[var(--color-text-muted)] pt-1">
          Pénzügyi szabadság: <b className="text-white">{sheet.computed.financialFreedomPercent}%</b> (a passzív jövedelem ennyit fedez a havi kiadásból) · Jóllét: <b className="text-white">{wb}/100</b>. A cél a kettő együtt: minél nagyobb fedezet, egyensúlyban a testi és lelki egészséggel.
        </p>
      </div>
    </div>
  );
}
