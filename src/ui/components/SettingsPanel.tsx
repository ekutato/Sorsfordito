'use client';

import { useState, type ReactNode } from 'react';
import { useSettingsStore, gameRules } from '@/store/settings-store';
import { useGameStore } from '@/store/game-store';
import { testJumpTo, testSkipRound } from '@/store/board-actions';
import { FIELD_LABELS, type FieldType } from '@/data/board';
import { LIFE_SITUATION_PRESETS } from '@/data/character-presets';
import { formatHUF } from '@/engine/financial-calculator';
import { VersionTag } from './AppVersion';
import type { GameRules } from '@/types/game';

const JUMP_FIELDS: FieldType[] = ['trap', 'temptation', 'encounter', 'recharge', 'office', 'market_news', 'decision', 'fate', 'investment', 'knowledge', 'payday'];

function Toggle({ label, hint, checked, onChange }: { label: string; hint: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 py-3 border-b border-white/5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 w-5 h-5 accent-amber-400 shrink-0" />
      <span>
        <span className="block text-base font-semibold">{label}</span>
        <span className="block text-sm text-[var(--color-text-muted)] leading-snug mt-0.5">{hint}</span>
      </span>
    </label>
  );
}

function Choice<T extends string | number>({ label, hint, value, options, onChange }: {
  label: string; hint: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void;
}) {
  return (
    <div className="py-3 border-b border-white/5">
      <span className="block text-base font-semibold">{label}</span>
      <span className="block text-sm text-[var(--color-text-muted)] leading-snug mt-0.5">{hint}</span>
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map((o) => (
          <button key={String(o.value)} onClick={() => onChange(o.value)}
            className={`h-10 px-3 rounded-lg text-sm font-semibold border ${o.value === value ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-white/10 bg-white/5'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const capsText = Object.values(LIFE_SITUATION_PRESETS)
  .map((p) => `${p.name.split(',')[0]} ${formatHUF(p.maxStartBalance ?? p.startingFinancials.balance)}`)
  .join(', ');

/** Játékmesteri beállítások: a következő játék szabályai (+ tesztmódban teszteszközök) */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useSettingsStore();
  const game = useGameStore((st) => st.game);
  const current = game ? gameRules(game.config) : undefined;
  const patch = (p: Partial<GameRules>) => s.set(p);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div role="dialog" aria-label="Játékmesteri beállítások" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#172036] border border-white/10 p-5 safe-bottom">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Játékmesteri beállítások</h2>
          <button onClick={onClose} aria-label="Bezárás" className="w-10 h-10 rounded-lg bg-white/5 text-xl">×</button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {game ? 'A változás a következő játéktól érvényes, a mostani játék szabályai rögzítettek.' : 'Ezek a szabályok az induló játékra érvényesek.'}
        </p>

        <Toggle label="Egyéni kezdő egyenleg" checked={s.customStartBalance} onChange={(v) => patch({ customStartBalance: v })}
          hint={<>Alapból mindenki a karaktere kezdő egyenlegével indul (egyenlő esélyek). Bekapcsolva a karakter felső határáig állítható: {capsText}.</>} />
        <Toggle label="Valós helyzet modellezése" checked={s.allowIncomeExpenseEdit} onChange={(v) => patch({ allowIncomeExpenseEdit: v })}
          hint="A bevétel és a kiadás játék közben szerkeszthető - a saját helyzeted kipróbálásához hasznos, egyenlő esélyű játékhoz nem." />
        <Choice label="Csapdaóra" hint="A sürgető csapdáknál ennyi idő van dönteni. A sürgetés a valóságban is a csalás eszköze."
          value={s.trapTimerSeconds} onChange={(v) => patch({ trapTimerSeconds: v })}
          options={[{ value: 0, label: 'Ki' }, { value: 10, label: '10 mp' }, { value: 20, label: '20 mp' }, { value: 30, label: '30 mp' }]} />
        <Choice label="Kocka" hint="Az app a készülék kriptográfiai véletlenjéből dob. Saját kockánál te dobsz, és beírod az értéket."
          value={s.diceSource} onChange={(v) => patch({ diceSource: v })}
          options={[{ value: 'app', label: 'Az app dob' }, { value: 'physical', label: 'Saját kockával dobok' }]} />

        {s.testMode && (
          <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-amber-200">Tesztmód</span>
              <button onClick={() => patch({ testMode: false })} className="h-9 px-3 rounded-lg text-sm bg-white/10">Kikapcsolás</button>
            </div>
            <p className="text-sm text-amber-100/80">Korlátlan kezdő egyenleg (20 000 000 Ft-ig), kézi kockaérték, mezőre ugrás, kör átugrása. Az eredményen "Tesztjáték" jelölés látszik.</p>
            {game && current?.testMode && (
              <div className="space-y-2">
                <span className="block text-sm font-semibold">Ugrás mezőre (ebben a körben):</span>
                <div className="flex flex-wrap gap-1.5">
                  {JUMP_FIELDS.map((f) => (
                    <button key={f} onClick={() => { testJumpTo(f); onClose(); }} className="h-9 px-2.5 rounded-lg text-sm bg-white/10">{FIELD_LABELS[f]}</button>
                  ))}
                </div>
                <button onClick={() => { testSkipRound(); onClose(); }} className="w-full h-10 rounded-lg text-sm font-semibold bg-white/10">Kör átugrása (a kör összegzésére)</button>
              </div>
            )}
            {game && !current?.testMode && <p className="text-sm">A teszteszközök a következő, tesztmódban indított játékban érhetők el.</p>}
          </div>
        )}

        <div className="pt-4 text-center"><VersionTag /></div>
      </div>
    </div>
  );
}

/** Fogaskerék gomb a kezdőképernyőre */
export function SettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Játékmesteri beállítások"
        className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>
      {open && <SettingsPanel onClose={() => setOpen(false)} />}
    </>
  );
}
