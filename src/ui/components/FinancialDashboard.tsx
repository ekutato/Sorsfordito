'use client';

import { motion } from 'framer-motion';
import type { FinancialSheet } from '@/types/financial';
import { formatHUF, getAmountColor } from '@/engine/financial-calculator';
import { useGameStore } from '@/store/game-store';
import { TIME_SCALE_CONFIGS } from '@/types/game';
import { WellbeingStrip, WellbeingMini } from './WellbeingStrip';

interface Props {
  sheet: FinancialSheet;
  compact?: boolean;
}

export function FinancialDashboard({ sheet, compact = false }: Props) {
  const { balance, computed } = sheet;
  const gameState = useGameStore((s) => s.game);
  const tsConfig = gameState?.config ? TIME_SCALE_CONFIGS[gameState.config.timeScale] : null;
  const months = tsConfig?.monthsPerRound ?? 1;
  const isMultiMonth = months > 1;

  if (compact) {
    return (
      <div className="game-card py-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--color-text-muted)]">Egyenleg</span>
            <div className={`money-display text-lg ${getAmountColor(balance)}`}>
              {formatHUF(balance)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[var(--color-text-muted)]">
              {isMultiMonth ? `Szabad/kör (${months} hó)` : 'Szabad/hó'}
            </span>
            <div className={`font-mono text-sm font-semibold ${getAmountColor(computed.freeCashflow)}`}>
              {computed.freeCashflow >= 0 ? '+' : ''}{formatHUF(isMultiMonth ? computed.freeCashflow * months : computed.freeCashflow)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[var(--color-text-muted)]">Vagyon</span>
            <div className={`font-mono text-sm font-semibold ${getAmountColor(computed.netWorth)}`}>
              {formatHUF(computed.netWorth)}
            </div>
            {computed.totalDebt > 0 && (
              <span className="text-[9px] text-[var(--color-text-muted)]">
                (adósság: {formatHUF(computed.totalDebt)})
              </span>
            )}
          </div>
        </div>
        <WellbeingMini sheet={sheet} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="game-card"
    >
      {/* Fo egyenleg */}
      <div className="text-center mb-4">
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
          Egyenleg
        </span>
        <motion.div
          key={balance}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className={`money-display text-3xl ${getAmountColor(balance)}`}
        >
          {formatHUF(balance)}
        </motion.div>
      </div>

      {/* Bevétel - Kiadás bar */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-money-positive/10 rounded-lg p-3">
          <span className="text-xs text-money-positive block mb-1">
            {isMultiMonth ? `📈 Bevétel/kör (${months} hó)` : '📈 Bevétel/hó'}
          </span>
          <span className="font-mono text-sm font-semibold text-money-positive">
            {formatHUF(isMultiMonth ? computed.totalIncome * months : computed.totalIncome)}
          </span>
          {isMultiMonth && (
            <span className="text-[10px] text-money-positive/60 block mt-0.5">
              {formatHUF(computed.totalIncome)}/hó
            </span>
          )}
        </div>
        <div className="bg-money-negative/10 rounded-lg p-3">
          <span className="text-xs text-money-negative block mb-1">
            {isMultiMonth ? `📉 Kiadás/kör (${months} hó)` : '📉 Kiadás/hó'}
          </span>
          <span className="font-mono text-sm font-semibold text-money-negative">
            {formatHUF(isMultiMonth ? computed.totalExpenses * months : computed.totalExpenses)}
          </span>
          {isMultiMonth && (
            <span className="text-[10px] text-money-negative/60 block mt-0.5">
              {formatHUF(computed.totalExpenses)}/hó
            </span>
          )}
        </div>
      </div>

      {/* Reszletes statisztikok */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat
          label={isMultiMonth ? `Szabad/kör` : 'Szabad/hó'}
          value={formatHUF(isMultiMonth ? computed.freeCashflow * months : computed.freeCashflow)}
          color={getAmountColor(computed.freeCashflow)}
          subLabel={isMultiMonth ? `${formatHUF(computed.freeCashflow)}/hó` : undefined}
        />
        <MiniStat
          label="Nettó vagyon"
          value={formatHUF(computed.netWorth)}
          color={getAmountColor(computed.netWorth)}
          subLabel={
            computed.totalDebt > 0
              ? `${formatHUF(balance)} egyenleg − ${formatHUF(computed.totalDebt)} adósság`
              : sheet.investments.length > 0
                ? `${formatHUF(balance)} + ${sheet.investments.length} befektetés`
                : undefined
          }
        />
        <MiniStat
          label="Szabadság"
          value={`${computed.financialFreedomPercent}%`}
          color={
            computed.financialFreedomPercent >= 100
              ? 'text-money-positive'
              : computed.financialFreedomPercent > 30
                ? 'text-card-knowledge'
                : 'text-[var(--color-text-muted)]'
          }
        />
      </div>

      <WellbeingStrip sheet={sheet} />

      {/* Befektetesek + Adossag jelzo */}
      {(sheet.investments.length > 0 || sheet.debts.length > 0) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
          {sheet.investments.length > 0 && (
            <span className="text-xs bg-card-investment/20 text-card-investment px-2 py-1 rounded-full">
              📊 {sheet.investments.length} befektetés
            </span>
          )}
          {sheet.debts.length > 0 && (
            <span className="text-xs bg-card-fate/20 text-card-fate px-2 py-1 rounded-full">
              💳 {sheet.debts.length} adósság
            </span>
          )}
          {sheet.acquiredKnowledge.length > 0 && (
            <span className="text-xs bg-card-knowledge/20 text-card-knowledge px-2 py-1 rounded-full">
              📚 {sheet.acquiredKnowledge.length} tudás
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function MiniStat({
  label,
  value,
  color,
  subLabel,
}: {
  label: string;
  value: string;
  color: string;
  subLabel?: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <span className="text-[10px] text-[var(--color-text-muted)] block">{label}</span>
      <span className={`font-mono text-xs font-semibold ${color}`}>{value}</span>
      {subLabel && (
        <span className="text-[9px] text-[var(--color-text-muted)] block mt-0.5">{subLabel}</span>
      )}
    </div>
  );
}
