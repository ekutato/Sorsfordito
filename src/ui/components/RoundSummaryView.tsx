'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { useTableStore } from '@/store/table-store';
import { isCatchingUp } from '@/engine/table/state';
import { TIME_SCALE_CONFIGS } from '@/types/game';
import { formatHUF } from '@/engine/financial-calculator';
import { MoneyDelta } from '@/ui/components/Money';
import { BalanceHighlight, InvestmentTable } from './MoneyOverview';

export function RoundSummaryView() {
  const game = useGameStore((s) => s.game);
  const advanceRound = useGameStore((s) => s.advanceRound);
  const takeFinancialSnapshot = useGameStore((s) => s.takeFinancialSnapshot);
  const endGame = useGameStore((s) => s.endGame);
  const table = useTableStore((s) => s.table);

  if (!game) return null;

  const player = game.players[game.activePlayerIndex];
  const sheet = player.financialSheet;
  const tsConfig = TIME_SCALE_CONFIGS[game.config.timeScale];
  const isLastRound = game.currentRound >= tsConfig.totalRounds;

  // Ebben a korben tortent esemenyek
  const roundEvents = game.eventLog.filter(
    (e) => e.round === game.currentRound
  );

  const totalImpact = roundEvents.reduce(
    (sum, e) => sum + (e.financialImpact ?? 0),
    0
  );

  // Asztali játék: a következő forduló csak akkor indul, ha mindenki kész
  const inTable = !!game.config.table && !!table;
  const iAmDone = (game.tableDoneRound ?? 0) >= game.currentRound;
  const tableMovedOn = !!table && (table.phase === 'finished' || table.round > game.currentRound);
  const others = table ? table.players.filter((p) => p.connected && !isCatchingUp(table, p)) : [];
  const doneCount = others.filter((p) => p.done || (p.report?.finishedRound ?? 0) >= game.currentRound).length;
  const markDone = () => useGameStore.setState((st) => (st.game ? { game: { ...st.game, tableDoneRound: st.game.currentRound } } : st));

  const handleNext = () => {
    takeFinancialSnapshot();
    if (isLastRound) {
      endGame();
    } else {
      advanceRound();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Kor osszefoglalo fejlec */}
      <div className="game-card text-center">
        <h3 className="font-display text-lg font-semibold mb-1">
          📋 {game.currentRound}. kör összefoglaló
        </h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          {formatGameDate(game.currentGameDate)}
        </p>

        <div className="money-display text-2xl mt-3">
          <MoneyDelta amount={totalImpact} />
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          Összesített hatás
        </span>
      </div>

      {/* Kiemelt egyenleg: előző kör vége → most, és a befektetések tételesen */}
      <BalanceHighlight
        label={tsConfig.monthsPerRound > 1 ? `Egyenleg a(z) ${game.currentRound}. kör (${tsConfig.monthsPerRound} hónap) végén` : 'Egyenleg a hónap végén'}
        before={sheet.history.length ? sheet.history[sheet.history.length - 1].balance : sheet.startBalance}
        after={sheet.balance}
        note={sheet.investments.length ? `Befektetésekben: ${formatHUF(sheet.computed.investmentValue)} · Teljes vagyon: ${formatHUF(sheet.computed.netWorth)}` : undefined}
      />
      <InvestmentTable sheet={sheet} round={game.currentRound} monthsInRound={tsConfig.monthsPerRound} />

      {/* Esemenyek lista */}
      <div className="game-card">
        <h4 className="text-sm font-semibold mb-3">Események ebben a körben:</h4>
        <div className="space-y-2">
          {roundEvents.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {event.type === 'income' ? '💰' :
                   event.type === 'expense' ? '💸' :
                   event.type === 'decision' ? '🔵' :
                   event.type === 'fate'
                     ? ((event.financialImpact ?? 0) > 0 ? '🟢' : (event.financialImpact ?? 0) < 0 ? '🔴' : '🔵')
                     :
                   event.type === 'investment' ? '📈' :
                   event.type === 'knowledge' ? '📚' :
                   event.type === 'crisis' ? '⚠️' :
                   event.type === 'field' ? '🎲' : '📌'}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {event.description}
                </span>
              </div>
              {event.financialImpact !== undefined && event.financialImpact !== 0 && (
                <MoneyDelta amount={event.financialImpact} className="text-xs font-semibold" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Figyelmeztetesek */}
      {sheet.balance < 0 && (
        <div className="game-card card-type-fate">
          <p className="text-sm text-card-fate font-semibold">
            ⚠️ Negatív egyenleg! A következő körben válságkezelés vár.
          </p>
        </div>
      )}

      {sheet.computed.emergencyFundMonths < 1 && sheet.balance > 0 && (
        <div className="game-card border-card-knowledge/30 border">
          <p className="text-xs text-card-knowledge">
            💡 Tipp: Az egyenleged kevesebb mint 1 havi kiadást fedez.
            Próbálj vészhelyzeti alapot építeni!
          </p>
        </div>
      )}

      {/* Asztali játék: közös körzárás */}
      {inTable && !iAmDone && (
        <button onClick={markDone} className="pulse-cta w-full font-bold py-3.5 rounded-xl text-[#0E1525]" style={{ background: '#F2A33A' }}>
          ✓ Kész vagyok a fordulóval
        </button>
      )}
      {inTable && iAmDone && !tableMovedOn && (
        <div className="game-card text-center space-y-1" role="status">
          <p className="text-base font-semibold">Várunk a többiekre… ({doneCount}/{others.length} kész)</p>
          <p className="text-sm text-[var(--color-text-muted)]">A következő forduló akkor indul, ha mindenki végzett. Addig noszogathatod őket a fenti reakciókkal.</p>
        </div>
      )}

      {/* Tovabb gomb */}
      {(!inTable || (iAmDone && tableMovedOn)) && <button
        onClick={handleNext}
        className={`pulse-cta w-full font-bold py-3.5 rounded-xl transition-colors ${
          isLastRound
            ? 'bg-card-epilogue hover:bg-card-epilogue/80 text-white'
            : 'bg-brand-600 hover:bg-brand-500 text-white'
        }`}
      >
        {isLastRound ? '🏁 Játék vége – Eredmények!' : `→ ${game.currentRound + 1}. kör`}
      </button>}
    </motion.div>
  );
}

function formatGameDate(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const months = [
    'január', 'február', 'március', 'április', 'május', 'június',
    'július', 'augusztus', 'szeptember', 'október', 'november', 'december',
  ];
  return `${year}. ${months[parseInt(month) - 1]}`;
}
