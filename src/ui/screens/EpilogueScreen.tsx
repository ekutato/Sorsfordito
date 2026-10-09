'use client';

import { shareImage } from '@/ui/share';
import { EndMoneyComparison } from '@/ui/components/MoneyOverview';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { determineEpilogue } from '@/data/epilogues';
import { formatHUF } from '@/engine/financial-calculator';
import { LIFE_SITUATION_PRESETS } from '@/data/character-presets';
import type { LifeSituationId } from '@/types/game';

import { gameRules } from '@/store/settings-store';
import { useTableStore } from '@/store/table-store';
import { Leaderboard } from '@/ui/table/TableBar';

export function EpilogueScreen() {
  const game = useGameStore((s) => s.game);
  const resetGame = useGameStore((s) => s.resetGame);
  const table = useTableStore((s) => s.table);
  const leaveTable = useTableStore((s) => s.leave);
  const [shareState, setShareState] = useState<'idle' | 'generating' | 'done' | 'downloaded' | 'failed'>('idle');

  if (!game) return null;

  const player = game.players[game.activePlayerIndex];
  const sheet = player.financialSheet;

  const epilogue = determineEpilogue({
    balance: sheet.balance,
    netWorth: sheet.computed.netWorth,
    passiveIncome: sheet.income.passive,
    totalExpenses: sheet.computed.totalExpenses,
    totalDebt: sheet.computed.totalDebt,
    knowledgeCount: sheet.acquiredKnowledge.length,
    hasInvestments: sheet.investments.length > 0,
  });

  const preset = LIFE_SITUATION_PRESETS[player.lifeSituation as LifeSituationId];
  const generateShareImage = useCallback(async (): Promise<Blob> => {
    const W = 600;
    const H = 800;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Háttér gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Keret
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Cím
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('Pénzügyi Sorsfordító', W / 2, 70);

    // Eredmény szint
    const victoryText = epilogue.victoryLevel === 'gold' ? 'Arany'
      : epilogue.victoryLevel === 'silver' ? 'Ezüst'
      : epilogue.victoryLevel === 'bronze' ? 'Bronz' : 'Bukás';
    const victoryEmoji = epilogue.victoryLevel === 'gold' ? '\uD83E\uDD47'
      : epilogue.victoryLevel === 'silver' ? '\uD83E\uDD48'
      : epilogue.victoryLevel === 'bronze' ? '\uD83E\uDD49' : '\u274C';
    ctx.font = '48px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(epilogue.emoji, W / 2, 130);

    // Epilógus cím
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillStyle = '#c084fc';
    ctx.fillText(epilogue.title, W / 2, 175);

    // Győzelmi szint
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${victoryEmoji} ${victoryText} szint`, W / 2, 205);

    // Karakter info
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${player.name} · ${preset?.name ?? ''} (${preset?.age ?? ''} év) · ${game.config.timeScale === 'sprint' ? 'Sprint' : game.config.timeScale === 'marathon' ? 'Maraton' : 'Ultra'}`, W / 2, 235);

    // Elválasztó vonal
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 260);
    ctx.lineTo(W - 60, 260);
    ctx.stroke();

    // Pénzügyi adatok
    ctx.textAlign = 'left';
    const stats = [
      { label: 'Egyenleg', value: formatHUF(sheet.balance), positive: sheet.balance >= 0 },
      { label: 'Nettó vagyon', value: formatHUF(sheet.computed.netWorth), positive: sheet.computed.netWorth >= 0 },
      { label: 'Havi bevétel', value: formatHUF(sheet.computed.totalIncome), positive: true },
      { label: 'Havi kiadás', value: formatHUF(sheet.computed.totalExpenses), positive: false },
      { label: 'Szabad cashflow', value: formatHUF(sheet.computed.freeCashflow), positive: sheet.computed.freeCashflow >= 0 },
      { label: 'Passzív jövedelem', value: formatHUF(sheet.income.passive), positive: true },
      { label: 'Befektetések', value: `${sheet.investments.length} db` },
      { label: 'Tudás kártyák', value: `${sheet.acquiredKnowledge.length} db` },
      { label: 'Pénzügyi szabadság', value: `${sheet.computed.financialFreedomPercent}%` },
    ];

    let y = 290;
    for (const stat of stats) {
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(stat.label, 60, y);

      ctx.textAlign = 'right';
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = stat.positive === undefined ? '#e2e8f0'
        : stat.positive ? '#4ade80' : '#f87171';
      ctx.fillText(stat.value, W - 60, y);
      ctx.textAlign = 'left';

      // Elválasztó
      if (stat !== stats[stats.length - 1]) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.moveTo(60, y + 10);
        ctx.lineTo(W - 60, y + 10);
        ctx.stroke();
      }
      y += 38;
    }

    // Tanulság box
    y += 10;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    const boxH = 90;
    ctx.fillRect(40, y, W - 80, boxH);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(40, y, W - 80, boxH);

    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = '#22d3ee';
    ctx.textAlign = 'left';
    ctx.fillText('Tanulság', 60, y + 22);

    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    // Word wrap a tanulságra
    const words = epilogue.lesson.split(' ');
    let line = '';
    let lineY = y + 42;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > W - 140) {
        ctx.fillText(line.trim(), 60, lineY);
        line = word + ' ';
        lineY += 16;
        if (lineY > y + boxH - 6) break;
      } else {
        line = test;
      }
    }
    if (lineY <= y + boxH - 6) ctx.fillText(line.trim(), 60, lineY);

    // Lábléc
    ctx.textAlign = 'center';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('nexai.hu/sorsfordito · Valós adatok. Valós döntések.', W / 2, H - 35);

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  }, [epilogue, sheet, player, preset, game]);

  const handleShare = useCallback(async () => {
    setShareState('generating');
    const blob = await generateShareImage().catch(() => null);
    const result = blob
      ? await shareImage(blob, 'penzugyi-sorsfordito-eredmeny.png', `Pénzügyi Sorsfordító — ${epilogue.title}`,
          `${epilogue.emoji} ${epilogue.title} | Vagyon: ${formatHUF(sheet.computed.netWorth)} | Szabadság: ${sheet.computed.financialFreedomPercent}% | nexai.hu/sorsfordito`)
      : 'failed';
    setShareState(result === 'failed' ? 'failed' : result === 'downloaded' ? 'downloaded' : result === 'shared' ? 'done' : 'idle');
    if (result !== 'failed') setTimeout(() => setShareState('idle'), 2500);
  }, [generateShareImage, epilogue, sheet]);

  return (
    <div className="flex flex-col min-h-screen p-6">
      {game.config.table && table && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h2 className="text-lg font-bold">Az asztal eredménye{table.phase !== 'finished' ? ' (még játszanak)' : ''}</h2>
          <Leaderboard table={table} final />
          <button onClick={() => { leaveTable(); resetGame(); }} className="w-full h-11 rounded-xl text-sm font-semibold bg-white/10">Kilépés az asztalról</button>
        </div>
      )}
      {gameRules(game.config).testMode && (
        <div role="note" className="mb-4 rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200">
          Tesztjáték - tesztmódban (kézi beállításokkal) játszott eredmény
        </div>
      )}
      {/* Epilogus kartya */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="game-card card-type-epilogue text-center py-8 mb-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-6xl mb-4"
        >
          {epilogue.emoji}
        </motion.div>

        <h1 className="font-display text-2xl font-bold text-card-epilogue mb-2">
          {epilogue.title}
        </h1>

        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Eredmény: {
            epilogue.victoryLevel === 'gold' ? '🥇 Arany' :
            epilogue.victoryLevel === 'silver' ? '🥈 Ezüst' :
            epilogue.victoryLevel === 'bronze' ? '🥉 Bronz' :
            '❌ Bukás'
          }
        </p>

        <p className="text-base leading-relaxed mb-6">
          {epilogue.text}
        </p>

        <div className="bg-white/5 rounded-xl p-4 text-left">
          <h3 className="font-semibold text-sm text-card-knowledge mb-2">
            💡 Tanulság
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {epilogue.lesson}
          </p>
        </div>
      </motion.div>

      {/* Pénz: befektetések nélkül és befektetésekkel, egymás mellett */}
      <div className="game-card">
        <h3 className="font-display text-lg font-semibold mb-3">💼 Mit hoztak a befektetéseid?</h3>
        <EndMoneyComparison game={game} />
      </div>

      {/* Penzugyi osszesites */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="game-card mb-6"
      >
        <h2 className="font-display text-lg font-semibold mb-4">
          📊 Pénzügyi mérleg
        </h2>

        <div className="space-y-3">
          <StatRow
            label="Egyenleg"
            value={formatHUF(sheet.balance)}
            isPositive={sheet.balance >= 0}
          />
          <StatRow
            label="Nettó vagyon"
            value={formatHUF(sheet.computed.netWorth)}
            isPositive={sheet.computed.netWorth >= 0}
          />
          <StatRow
            label="Havi bevétel"
            value={formatHUF(sheet.computed.totalIncome)}
            isPositive
          />
          <StatRow
            label="Havi kiadás"
            value={formatHUF(-sheet.computed.totalExpenses)}
            isPositive={false}
          />
          <StatRow
            label="Szabad cashflow"
            value={formatHUF(sheet.computed.freeCashflow)}
            isPositive={sheet.computed.freeCashflow >= 0}
          />
          <StatRow
            label="Passzív jövedelem"
            value={formatHUF(sheet.income.passive)}
            isPositive
          />
          <StatRow
            label="Befektetések"
            value={`${sheet.investments.length} db`}
          />
          <StatRow
            label="Tudás kártyák"
            value={`${sheet.acquiredKnowledge.length} db`}
          />
          <StatRow
            label="Pénzügyi szabadság"
            value={`${sheet.computed.financialFreedomPercent}%`}
          />
        </div>
      </motion.div>

      {/* Jovokep */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="game-card card-type-knowledge mb-6"
      >
        <h2 className="font-display text-lg font-semibold mb-3">
          🔮 Jövőkép
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          {epilogue.futureVision}
        </p>
      </motion.div>

      {/* Gombok */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="space-y-3 mt-auto"
      >
        <button
          onClick={resetGame}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white
                     font-bold py-3.5 rounded-xl transition-colors"
        >
          🔄 Új játék indítása
        </button>
        <button
          onClick={handleShare}
          disabled={shareState === 'generating'}
          className="w-full bg-[var(--color-bg-card)] border border-white/10
                     hover:bg-white/5 disabled:opacity-50 text-white py-3.5 rounded-xl transition-colors"
        >
          {shareState === 'generating' ? '⏳ Kép készítése...'
            : shareState === 'done' ? '✅ Megosztva'
            : shareState === 'downloaded' ? '✅ A kép letöltődött'
            : shareState === 'failed' ? '⚠️ Nem sikerült - próbáld újra'
            : '📤 Eredmény megosztása'}
        </button>
      </motion.div>
    </div>
  );
}

function StatRow({
  label,
  value,
  isPositive,
}: {
  label: string;
  value: string;
  isPositive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <span
        className={`font-mono text-sm font-semibold ${
          isPositive === undefined
            ? 'text-white'
            : isPositive
              ? 'text-money-positive'
              : 'text-money-negative'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
