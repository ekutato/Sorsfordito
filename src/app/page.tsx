'use client';

import { useGameStore } from '@/store/game-store';
import { StartScreen } from '@/ui/screens/StartScreen';
import { GameScreen } from '@/ui/screens/GameScreen';
import { EpilogueScreen } from '@/ui/screens/EpilogueScreen';

export default function Home() {
  const game = useGameStore((s) => s.game);

  // Ha nincs jatek → Kezdokepernyo
  if (!game) {
    return <StartScreen />;
  }

  // Ha epilogus → Vegeredmeny kepernyo
  if (game.phase === 'epilogue' || game.phase === 'report') {
    return <EpilogueScreen />;
  }

  // Egyebkent → Aktiv jatek
  return <GameScreen />;
}
