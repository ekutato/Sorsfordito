'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTableStore, inviteLink } from '@/store/table-store';
import { isCatchingUp } from '@/engine/table/state';
import { formatHUF } from '@/engine/financial-calculator';
import type { TableState } from '@/engine/table/state';

const REACTIONS = ['👍 Szép!', '⏰ Gyerünk, várunk rád!', '🤔 Gondolkodom…', '😂', '🎉 Gratulálok!'];

/** Asztalsáv a játék tetején: ki hol tart, kész-e a fordulóval, reakciók */
export function TableBar() {
  const { table, playerId, react, reactions } = useTableStore();
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
        <span className="flex items-center gap-3">
          <InviteButton code={table.roomCode} />
          <button onClick={() => setOpen((o) => !o)} className="text-sm underline" aria-expanded={open}>{open ? 'Bezár' : 'Ranglista'}</button>
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {table.players.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', opacity: p.connected ? 1 : 0.5 }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            {p.name}{p.id === playerId ? ' (te)' : ''} {!p.connected ? '(kiesett)' : isCatchingUp(table, p) ? `· felzárkózik (${p.report?.currentRound ?? 1}. kör)` : p.done ? '✓ kész' : '· játszik'}
          </span>
        ))}
      </div>
      {open && <Leaderboard table={table} />}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {REACTIONS.map((r) => (
          <button key={r} onClick={() => react(r)} className="shrink-0 h-8 px-2.5 rounded-lg text-xs font-semibold bg-white/10">{r}</button>
        ))}
      </div>
      <ConnectionBanner />
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

/** Meghívó játék közben is: később érkezők a kóddal / linkkel beszállhatnak */
function InviteButton({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const link = inviteLink(code);
    try {
      if (navigator.share) await navigator.share({ title: 'Pénzügyi Sorsfordító', text: `Szállj be a játékba! Szobakód: ${code}`, url: link });
      else { await navigator.clipboard.writeText(link); setDone(true); setTimeout(() => setDone(false), 2000); }
    } catch { /* megszakítva */ }
  };
  return <button onClick={share} className="text-sm underline">{done ? 'Kimásolva ✓' : 'Meghívó'}</button>;
}

/** Kapcsolat állapota: újracsatlakozás folyamatban / sikerült; kiesett játékosok */
export function ConnectionBanner() {
  const { status, attempt, error, justReconnected, reconnectNow, table, role } = useTableStore();
  const dropped = table?.players.filter((p) => !p.connected) ?? [];
  return (
    <>
      {(status === 'reconnecting' || status === 'connecting') && (
        <div role="status" className="rounded-lg px-3 py-2 space-y-2" style={{ background: '#FEF3C7', color: '#1C1A16' }}>
          <p className="text-sm font-semibold">
            {status === 'connecting' ? 'Kapcsolódás…' : `Kapcsolat megszakadt - újracsatlakozás…${attempt > 1 ? ` (${attempt}. próbálkozás)` : ''}`}
          </p>
          {error && !/Újracsatlakozás…$/.test(error) && <p className="text-xs">{error}</p>}
          {status === 'reconnecting' && (
            <button onClick={reconnectNow} className="w-full h-10 rounded-lg text-sm font-bold" style={{ background: '#0E1525', color: '#F2A33A' }}>
              Újracsatlakozás most
            </button>
          )}
        </div>
      )}
      {justReconnected && status === 'connected' && (
        <div role="status" className="rounded-lg px-3 py-1.5 text-sm font-semibold bg-emerald-500/20 text-emerald-200">Újra kapcsolódva ✓</div>
      )}
      {role === 'host' && dropped.length > 0 && status === 'connected' && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Kiesett: {dropped.map((p) => p.name).join(', ')} - a forduló nélküle is továbbmehet; ha visszajön, a helyéről folytatja.
        </p>
      )}
    </>
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
              <td className="py-1"><span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: p.color }} />{p.name}{p.lateJoinRound !== undefined ? <span className="text-xs text-[var(--color-text-muted)]"> (később csatlakozott)</span> : null}</td>
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
