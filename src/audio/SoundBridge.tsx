'use client';

// Állapotfigyelő hangok: pénz be/ki, mérföldkövek, epilógus és az asztali események.
// A tárolókra iratkozik fel, így a játéklogikát nem kell hangokkal teletűzdelni.
import { useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { useTableStore } from '@/store/table-store';
import { computeIndices } from '@/engine/indices';
import { RULESETS, DEFAULT_RULESET_ID } from '@/rulesets';
import { play, makeThrottle, crossed } from './sfx';

export function SoundBridge() {
  useEffect(() => {
    const coin = makeThrottle(300);
    let gameId: string | undefined;
    let balance: number | undefined;
    let safety: number | undefined;
    let passive: number | undefined;
    let phase: string | undefined;
    const unGame = useGameStore.subscribe((s) => {
      const g = s.game;
      if (!g) { gameId = undefined; return; }
      const sheet = g.players[g.activePlayerIndex]?.financialSheet;
      if (!sheet) return;
      const idx = computeIndices(sheet, RULESETS[DEFAULT_RULESET_ID]);
      if (g.gameId !== gameId) {
        // Új vagy betöltött játék: kiinduló értékek, hang nélkül
        gameId = g.gameId; balance = sheet.balance; safety = idx.safetyCircle; passive = sheet.income.passive; phase = g.phase;
        return;
      }
      if (balance !== undefined && sheet.balance !== balance && coin()) play(sheet.balance > balance ? 'coinIn' : 'coinOut');
      if (crossed(safety, idx.safetyCircle, 100) || crossed(passive, sheet.income.passive, 1)) play('milestone');
      if (g.phase !== phase && g.phase === 'epilogue') play('gameEnd');
      balance = sheet.balance; safety = idx.safetyCircle; passive = sheet.income.passive; phase = g.phase;
    });

    let round: number | undefined;
    let tablePhase: string | undefined;
    let lastReaction = 0;
    const unTable = useTableStore.subscribe((s) => {
      const t = s.table;
      if (!t) { round = undefined; tablePhase = undefined; return; }
      if (round !== undefined && t.round > round && t.phase === 'playing') play('roundReady');
      if (tablePhase !== undefined && tablePhase !== 'finished' && t.phase === 'finished') play('gameEnd');
      round = t.round; tablePhase = t.phase;
      const me = t.players.find((p) => p.id === s.playerId)?.name;
      const fresh = s.reactions.filter((r) => r.id > lastReaction);
      if (fresh.length) {
        lastReaction = Math.max(...fresh.map((r) => r.id));
        if (fresh.some((r) => r.from !== me)) play('reaction');
      }
    });
    return () => { unGame(); unTable(); };
  }, []);
  return null;
}
