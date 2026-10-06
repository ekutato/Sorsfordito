'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTableStore } from '@/store/table-store';
import { formatHUF } from '@/engine/financial-calculator';
import type { TableState } from '@/engine/table/state';

const REACTIONS = ['👍 Szép!', '⏰ Gyerünk, várunk rád!', '🤔 Gondolkodom…', '😂', '🎉 Gratulálok!'];

/** Asztalsáv a játék tetején: ki hol tart, kész-e a fordulóval, reakciók */
export function TableBar() {
  const { table, playerId, status, error, react, reactions } = useTableStore();
  const [open, setOpen] = useState(false);
  if (!table) return null;
  const doneCount = table.players.filter((p) => p.done && p.connected).length;
  const active = table.players.filter((p) => p.connected).length;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 space-y-2" aria-label="Asztal">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          Asztal {table.roomCode} · {table.phase === 'finished' ? 'vége' : `${table.round}. forduló`} · {doneCount}/{active} kész
        </span>
        <button onClick={() => setOpen((o) => !o)} className="text-sm underline" aria-expanded={open}>{open ? 'Bezár' : 'Ranglista'}</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {table.players.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', opacity: p.connected ? 1 : 0.5 }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            {p.name}{p.id === playerId ? ' (te)' : ''} {p.done ? '✓ kész' : p.connected ? '· játszik' : '(kiesett)'}
          </span>
        ))}
      </div>
      {open && <Leaderboard table={table} />}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {REACTIONS.map((r) => (
          <button key={r} onClick={() => react(r)} className="shrink-0 h-8 px-2.5 rounded-lg text-xs font-semibold bg-white/10">{r}</button>
        ))}
      </div>
      {status !== 'connected' && error && <p className="text-xs text-rose-300">{error}</p>}
      <div className="fixed left-0 right-0 bottom-24 z-40 flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
              className="rounded-full px-4 py-2 text-base font-semibold shadow-lg" style={{ background: '#172036', border: '1px solid rgba(255,255,255,.15)' }}>
              <b>{r.from}:</b> {r.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Ranglista: nem csak a pénz - mindhárom index látszik */
export function Leaderboard({ table, final }: { table: TableState; final?: boolean }) {
  const rows = table.players.filter((p) => p.report);
  const best = (f: (r: NonNullable<(typeof rows)[number]['report']>) => number) =>
    rows.length ? rows.reduce((a, b) => (f(b.report!) > f(a.report!) ? b : a)) : undefined;
  const richest = best((r) => r.netWorth);
  const balanced = best((r) => r.wellbeing);
  const safest = best((r) => r.safety);
  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-[var(--color-text-muted)]"><th>Játékos</th><th>Vagyon</th><th>Jóllét</th><th>Bizt. kör</th></tr></thead>
        <tbody>
          {[...rows].sort((a, b) => b.report!.netWorth - a.report!.netWorth).map((p) => (
            <tr key={p.id} className="border-t border-white/5">
              <td className="py-1"><span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: p.color }} />{p.name}</td>
              <td className="font-mono">{formatHUF(p.report!.netWorth)}</td>
              <td>{p.report!.wellbeing}/100</td>
              <td>{p.report!.safety}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {final && rows.length > 0 && (
        <ul className="text-sm space-y-1">
          {richest && <li>💰 Legnagyobb vagyon: <b>{richest.name}</b></li>}
          {balanced && <li>🌿 Legkiegyensúlyozottabb: <b>{balanced.name}</b></li>}
          {safest && <li>🛡️ Legbiztosabb tartalék: <b>{safest.name}</b></li>}
        </ul>
      )}
    </div>
  );
}
