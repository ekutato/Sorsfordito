'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { RULESETS, DEFAULT_RULESET_ID } from '@/rulesets';
import type { SubjectiveWellbeing } from '@/data/wellbeing-effects';
import type { WellbeingKey } from '@/types/wellbeing';

const LABELS = RULESETS[DEFAULT_RULESET_ID].labels.wellbeing;
const CHOICES = [
  { delta: 1, label: 'Feltölt', style: 'border-emerald-400/50 bg-emerald-400/10' },
  { delta: 0, label: 'Semleges', style: 'border-white/15 bg-white/5' },
  { delta: -1, label: 'Megterhel', style: 'border-rose-400/50 bg-rose-400/10' },
] as const;

/**
 * Személyes mérlegelés: életmódbeli döntésnél nincs univerzális jólléti hatás,
 * a játékos maga dönti el, mit jelent neki (+1 / 0 / -1 jelölőnként).
 */
export function WellbeingReflection({ reflection, onDone }: { reflection: SubjectiveWellbeing; onDone: () => void }) {
  const game = useGameStore((s) => s.game);
  const modifyWellbeing = useGameStore((s) => s.modifyWellbeing);
  const logEvent = useGameStore((s) => s.logEvent);
  const [answers, setAnswers] = useState<Partial<Record<WellbeingKey, number>>>({});
  if (!game) return null;
  const pid = game.players[game.activePlayerIndex].playerId;
  const done = reflection.keys.every((k) => answers[k] !== undefined);

  const submit = () => {
    for (const k of reflection.keys) {
      const d = answers[k] ?? 0;
      if (d !== 0) modifyWellbeing(pid, k, d);
    }
    logEvent({
      type: 'decision',
      description: `Személyes mérlegelés: ${reflection.keys.map((k) => `${LABELS[k]} ${(answers[k] ?? 0) > 0 ? '+' : ''}${answers[k] ?? 0}`).join(', ')}`,
      financialImpact: 0,
    });
    onDone();
  };

  return (
    <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-4 space-y-3" role="group" aria-label="Személyes mérlegelés">
      <p className="text-sm font-bold uppercase tracking-wide text-sky-200">Neked ez inkább…</p>
      <p className="text-base leading-relaxed">{reflection.prompt}</p>
      {reflection.keys.map((k) => (
        <div key={k} className="space-y-1.5">
          <span className="text-sm font-semibold">{LABELS[k]}</span>
          <div className="grid grid-cols-3 gap-2">
            {CHOICES.map((c) => (
              <button key={c.delta} onClick={() => setAnswers((a) => ({ ...a, [k]: c.delta }))} aria-pressed={answers[k] === c.delta}
                className={`h-11 rounded-lg text-sm font-bold border ${c.style} ${answers[k] === c.delta ? 'ring-2 ring-amber-400' : 'opacity-80'}`}>
                {c.label} {c.delta > 0 ? '+1' : c.delta < 0 ? '-1' : '0'}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-[var(--color-text-muted)]">Nincs jó vagy rossz válasz: ami az egyiknek teher, a másiknak erőforrás.</p>
      <button onClick={submit} disabled={!done}
        className={`w-full h-12 rounded-xl text-base font-extrabold disabled:opacity-40 ${done ? 'pulse-cta' : ''}`}
        style={{ background: '#F2A33A', color: '#0E1525' }}>
        Rögzítem
      </button>
    </div>
  );
}
