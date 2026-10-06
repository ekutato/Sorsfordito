'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { StartScreen } from '@/ui/screens/StartScreen';
import { GameScreen } from '@/ui/screens/GameScreen';
import { EpilogueScreen } from '@/ui/screens/EpilogueScreen';
import { TIME_SCALE_CONFIGS } from '@/types/game';
import { VersionTag } from '@/ui/components/AppVersion';
import { useTableStore, loadSession } from '@/store/table-store';
import { TableEntry, TableLobby } from '@/ui/table/TableLobby';
import { useTableAutoStart, useTableReporter } from '@/ui/table/useTableSync';

export default function Home() {
  const game = useGameStore((s) => s.game);
  const resetGame = useGameStore((s) => s.resetGame);
  // Indításkor (vagy frissítés után) mentett játéknál előbb rákérdezünk: folytatás vagy új játék
  const [resumeAnswered, setResumeAnswered] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) setHydrated(true);
    return useGameStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  // Ha betöltéskor nem volt mentett játék, a most induló játéknál nem kell kérdezni
  useEffect(() => {
    if (hydrated && !game) setResumeAnswered(true);
  }, [hydrated, game]);

  // Asztali játék: meghívólink (?szoba=ABCD), korábbi szoba folytatása, saját játék indítása és jelentése
  const tableRole = useTableStore((s) => s.role);
  const table = useTableStore((s) => s.table);
  const entry = useTableStore((s) => s.entry);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('szoba');
    if (code && !loadSession()) useTableStore.getState().openEntry(code.toUpperCase().slice(0, 4));
    else useTableStore.getState().resume();
  }, []);
  useTableAutoStart();
  useTableReporter();
  const inTableGame = !!game?.config.table && game.config.table.roomCode === table?.roomCode;

  if (tableRole && table?.phase === 'lobby') return <TableLobby />;
  if (tableRole && !table) return <TableLobby />;
  if (!tableRole && entry) return <TableEntry initialCode={entry.code} onBack={() => useTableStore.getState().closeEntry()} />;
  if (tableRole && table && table.phase !== 'lobby' && !inTableGame) {
    return <div className="flex-1 flex items-center justify-center p-6 text-lg">A játék indul…</div>;
  }

  // Ha nincs jatek → Kezdokepernyo
  if (!game) {
    return <StartScreen />;
  }

  if (!resumeAnswered && !inTableGame) {
    const player = game.players[game.activePlayerIndex];
    const total = TIME_SCALE_CONFIGS[game.config.timeScale].totalRounds;
    return (
      <div className="flex-1 flex flex-col justify-center px-6 py-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold">Van egy mentett játékod</h1>
          <p className="text-base text-[var(--color-text-muted)]">
            {player?.name} · {Math.min(game.currentRound, total)}/{total}. kör
          </p>
        </div>
        <div className="space-y-3">
          <button onClick={() => setResumeAnswered(true)} className="pulse-cta w-full h-14 rounded-2xl font-extrabold text-lg"
            style={{ background: '#F2A33A', color: '#0E1525' }}>
            Folytatás
          </button>
          <button onClick={() => { resetGame(); setResumeAnswered(true); }}
            className="w-full h-14 rounded-2xl font-bold text-lg border border-white/15 bg-white/5">
            Új játék
          </button>
        </div>
        <VersionTag className="block text-center" />
      </div>
    );
  }

  // Ha epilogus → Vegeredmeny kepernyo
  if (game.phase === 'epilogue' || game.phase === 'report') {
    return <EpilogueScreen />;
  }

  // Egyebkent → Aktiv jatek
  return <GameScreen />;
}
