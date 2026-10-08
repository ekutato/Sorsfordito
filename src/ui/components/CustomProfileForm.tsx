'use client';

// Saját helyzet: életkor, induló tőke, havi bevétel és kiadás. A kezdőképernyőn és az asztali
// lobbyban is ezt használjuk; asztalnál a játékmester a CustomSummary alapján hagyja jóvá.
import { useEffect, useState } from 'react';
import { CUSTOM_LABELS, CUSTOM_LIMITS, sanitizeCustomProfile } from '@/engine/custom-profile';
import { formatHUF } from '@/engine/financial-calculator';
import type { CustomProfile } from '@/types/game';

const FIELDS = Object.keys(CUSTOM_LABELS) as Array<keyof CustomProfile>;
const EXPENSES: Array<keyof CustomProfile> = ['housing', 'utilities', 'food', 'transport', 'other'];

export const customExpenses = (c: CustomProfile) => EXPENSES.reduce((sum, k) => sum + c[k], 0);

export function CustomProfileForm({ initial, onSubmit, submitLabel, note }: {
  initial: CustomProfile;
  onSubmit: (c: CustomProfile) => void;
  submitLabel: string;
  note?: string;
}) {
  const [draft, setDraft] = useState<Record<keyof CustomProfile, string>>(() => toDraft(initial));
  // Másik karakter választásakor az alapértékek frissülnek (tartalom szerint, nem objektum-azonosság szerint)
  const initialKey = JSON.stringify(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft(toDraft(initial)); }, [initialKey]);
  const parsed = sanitizeCustomProfile(Object.fromEntries(FIELDS.map((k) => [k, Number(draft[k].replace(/\s/g, ''))])));
  const free = parsed ? parsed.salary - customExpenses(parsed) : 0;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((k) => (
          <label key={k} className="block">
            <span className="block text-xs text-[var(--color-text-muted)]">{CUSTOM_LABELS[k]}</span>
            <input inputMode="numeric" value={draft[k]} aria-label={CUSTOM_LABELS[k]}
              onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value.replace(/[^\d\s]/g, '') }))}
              className="mt-0.5 w-full bg-[var(--color-bg)] border border-white/10 rounded-lg px-3 py-2 font-mono text-base" />
          </label>
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        Határok: {CUSTOM_LIMITS.age[0]}-{CUSTOM_LIMITS.age[1]} év, tőke legfeljebb {formatHUF(CUSTOM_LIMITS.balance[1])}, bevétel legfeljebb {formatHUF(CUSTOM_LIMITS.salary[1])}/hó. A karakter története (döntései, tartozásai) marad.
      </p>
      {parsed && (
        <p className={`text-sm font-semibold ${free >= 0 ? 'text-money-positive' : 'text-money-negative'}`}>
          Szabad pénz havonta: {formatHUF(free)}
        </p>
      )}
      {note && <p className="text-sm text-[var(--color-text-muted)]">{note}</p>}
      <button disabled={!parsed} onClick={() => parsed && onSubmit(parsed)}
        className="w-full h-11 rounded-xl text-base font-bold disabled:opacity-40" style={{ background: '#F2A33A', color: '#0E1525' }}>
        {submitLabel}
      </button>
    </div>
  );
}

function toDraft(c: CustomProfile): Record<keyof CustomProfile, string> {
  return Object.fromEntries(FIELDS.map((k) => [k, String(c[k])])) as Record<keyof CustomProfile, string>;
}

/** Tömör összefoglaló (a játékmester jóváhagyásához és a játékos visszajelzéséhez) */
export function CustomSummary({ c }: { c: CustomProfile }) {
  return (
    <span className="block text-sm leading-snug">
      {c.age} év · tőke {formatHUF(c.balance)} · bevétel {formatHUF(c.salary)}/hó · kiadás {formatHUF(customExpenses(c))}/hó
      <span className="block text-xs text-[var(--color-text-muted)]">
        lakhatás {formatHUF(c.housing)}, rezsi {formatHUF(c.utilities)}, élelmiszer {formatHUF(c.food)}, közlekedés {formatHUF(c.transport)}, egyéb {formatHUF(c.other)}
      </span>
    </span>
  );
}
