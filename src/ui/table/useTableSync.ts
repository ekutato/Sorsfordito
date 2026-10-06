'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/game-store';
import { useTableStore } from '@/store/table-store';
import { computeIndices } from '@/engine/indices';
import { RULESETS, DEFAULT_RULESET_ID } from '@/rulesets';
import { livePreGameContext } from '@/data/live';
import type { PlayerReport } from '@/engine/table/state';
import type { CharacterPresetId } from '@/types/game';

/** A saját játék állapotát jelenti az asztalnak (kör, pozíció, mutatók) - csak változáskor */
export function useTableReporter() {
  const game = useGameStore((s) => s.game);
  const report = useTableStore((s) => s.report);
  const status = useTableStore((s) => s.status);
  // Minden (újra)kapcsolódás után újra jelentünk, akkor is, ha a játék nem változott
  const connSeq = useTableStore((s) => s.connSeq);
  const last = useRef('');
  useEffect(() => {
    if (!game?.config.table || status !== 'connected') return;
    const sheet = game.players[game.activePlayerIndex].financialSheet;
    const idx = computeIndices(sheet, RULESETS[DEFAULT_RULESET_ID]);
    const ended = game.phase === 'epilogue' || game.phase === 'report';
    const r: PlayerReport = {
      finishedRound: Math.max(game.tableDoneRound ?? 0, ended ? game.currentRound : 0),
      currentRound: game.currentRound,
      position: game.board?.position ?? 0,
      balance: Math.round(sheet.balance),
      netWorth: Math.round(sheet.computed.netWorth),
      wellbeing: idx.wellbeing,
      freedom: idx.financialFreedom,
      safety: idx.safetyCircle,
      ended,
    };
    const key = `${connSeq}:${JSON.stringify(r)}`;
    if (key === last.current) return;
    last.current = key;
    report(r);
  }, [game, report, status, connSeq]);
}

/** Ha az asztal elindult, és ehhez a szobához még nincs saját játék, elindítja a saját játékot */
export function useTableAutoStart() {
  const table = useTableStore((s) => s.table);
  const playerId = useTableStore((s) => s.playerId);
  const game = useGameStore((s) => s.game);
  const startNewGame = useGameStore((s) => s.startNewGame);
  useEffect(() => {
    if (!table || table.phase === 'lobby' || !playerId) return;
    if (game?.config.table?.roomCode === table.roomCode) return;
    const me = table.players.find((p) => p.id === playerId);
    if (!me?.profileId) return;
    const now = new Date();
    startNewGame(
      {
        timeScale: table.config.timeScale ?? 'sprint',
        mode: 'competitive',
        playerCount: table.players.length,
        useLiveData: true,
        startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        rules: table.config.rules,
        table: { roomCode: table.roomCode },
      },
      me.profileId as CharacterPresetId,
      me.name,
      livePreGameContext(),
    );
  }, [table, playerId, game, startNewGame]);
}
