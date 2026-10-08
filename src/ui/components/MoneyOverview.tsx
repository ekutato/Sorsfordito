'use client';

// Átlátható pénzmozgás: kiemelt egyenleg (előző → most) és a befektetések tételes táblája.
import { INVESTMENT_OPTIONS } from '@/data/investment-options';
import { formatHUF } from '@/engine/financial-calculator';
import type { FinancialSheet } from '@/types/financial';

const nameOf = (id: string) => INVESTMENT_OPTIONS.find((o) => o.id === id)?.name ?? id;
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '-' : ''}${formatHUF(Math.abs(n))}`;

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
          <b className={diff >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{signed(diff)}</b>
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
                <b>{nameOf(r.optionId)}</b>
                <span className="font-mono">{formatHUF(r.currentValue)}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs text-[var(--color-text-muted)] mt-0.5">
                <span>befektetve: {formatHUF(r.purchasePrice)} ({r.purchasedAtRound}. kör)</span>
                <span className={r.currentValue - r.purchasePrice >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{signed(r.currentValue - r.purchasePrice)}</span>
              </div>
              {(change !== 0 || r.lastChangeRound === round) && (
                <p className="text-xs mt-0.5">Ebben a körben: <b className={change >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{signed(change)}</b>{r.lastReason ? ` - ${r.lastReason}` : ''}</p>
              )}
              {income > 0 && (
                <p className="text-xs mt-0.5">
                  {r.incomeTarget === 'salary' ? 'Béremelés' : r.incomeTarget === 'utilities' ? 'Rezsimegtakarítás' : 'Hozam (az egyenlegedre)'}:
                  {' '}<b className="text-emerald-300">+{formatHUF(income)}</b>{monthsInRound > 1 ? ` (${monthsInRound} hónap)` : ' / hó'}
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
 * A játék vége: két lap egymás mellett.
 * Bal: a pénzed, és mennyi lenne befektetések nélkül (a befektetett összeg nálad maradt volna, a hozamuk nem jött volna).
 * Jobb: a befektetések tételesen (befektetve → most + eddigi hozam).
 */
export function EndMoneyComparison({ sheet }: { sheet: FinancialSheet }) {
  const inv = sheet.investments;
  const invested = inv.reduce((a, r) => a + r.purchasePrice, 0);
  const valueNow = inv.reduce((a, r) => a + r.currentValue, 0);
  const incomeAll = inv.reduce((a, r) => a + (r.totalIncomeGenerated ?? 0), 0);
  const withoutInvesting = sheet.balance + invested - incomeAll;
  const withInvesting = sheet.balance + valueNow;
  const gain = withInvesting - withoutInvesting;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3 border border-white/15 bg-white/5">
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">Befektetések nélkül</p>
          <p className="font-mono text-xl font-extrabold mt-1">{formatHUF(withoutInvesting)}</p>
          <ul className="text-xs mt-2 space-y-1 text-[var(--color-text-muted)]">
            <li>Mostani egyenleg: {formatHUF(sheet.balance)}</li>
            <li>+ amit befektettél: {formatHUF(invested)}</li>
            <li>− a befektetések hozama: {formatHUF(incomeAll)}</li>
          </ul>
        </div>
        <div className="rounded-2xl p-3 border-2" style={{ borderColor: '#25865A', background: 'rgba(37,134,90,.10)' }}>
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">Befektetésekkel</p>
          <p className="font-mono text-xl font-extrabold mt-1">{formatHUF(withInvesting)}</p>
          <ul className="text-xs mt-2 space-y-1">
            <li className="text-[var(--color-text-muted)]">Egyenleg: {formatHUF(sheet.balance)}</li>
            {inv.map((r) => (
              <li key={r.optionId}>
                <b>{nameOf(r.optionId)}</b>: {formatHUF(r.purchasePrice)} → {formatHUF(r.currentValue)}
                {(r.totalIncomeGenerated ?? 0) > 0 && <span className="text-emerald-300"> + hozam {formatHUF(r.totalIncomeGenerated ?? 0)}</span>}
              </li>
            ))}
            {!inv.length && <li className="text-[var(--color-text-muted)]">Nem fektettél be.</li>}
          </ul>
        </div>
      </div>
      <p className="text-sm text-center">
        A befektetéseid {gain >= 0 ? 'nyeresége' : 'vesztesége'}: <b className={gain >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{signed(gain)}</b>
        {sheet.computed.totalDebt > 0 && <> · tartozás: {formatHUF(sheet.computed.totalDebt)}, így a nettó vagyon {formatHUF(sheet.computed.netWorth)}</>}
      </p>
    </div>
  );
}
