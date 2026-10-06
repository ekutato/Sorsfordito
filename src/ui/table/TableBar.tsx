'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTableStore, inviteLink } from '@/store/table-store';
import { isCatchingUp, displayColor, rankPlayers } from '@/engine/table/state';
import { PRESETS_BY_DIFFICULTY } from '@/data/character-presets';
import { formatHUF } from '@/engine/financial-calculator';
import type { TableState } from '@/engine/table/state';
import { useDiag, diagText } from '@/net/diag';
import { wakeLockSupported, wakeLockEnabled, setWakeLockEnabled } from '@/net/wake-lock';

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
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: displayColor(p) }} />
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
      <ConnectionBanner details />
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
export function ConnectionBanner({ details = false }: { details?: boolean }) {
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
      {(details || (status !== 'connected' && status !== 'idle')) && <ConnectionDetails />}
      {role === 'host' && dropped.length > 0 && status === 'connected' && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Kiesett: {dropped.map((p) => p.name).join(', ')} - a forduló nélküle is továbbmehet; ha visszajön, a helyéről folytatja.
        </p>
      )}
    </>
  );
}

const SIGNAL_LABEL: Record<string, string> = {
  nincs: '-', kapcsolódik: 'kapcsolódik…', kapcsolódva: 'elérhető', leszakadt: 'leszakadt, visszakapcsolódás…', hiba: 'hiba',
};

/** Kapcsolat részletei: lépésenkénti napló, kimásolható hibabejelentéshez; képernyő ébren tartása */
export function ConnectionDetails({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const { entries, signal, ice, turn } = useDiag();
  const role = useTableStore((s) => s.role);
  const [open, setOpen] = useState(initiallyOpen);
  const [copied, setCopied] = useState(false);
  const [awake, setAwake] = useState(() => wakeLockEnabled());
  const copy = async () => {
    try { await navigator.clipboard.writeText(diagText()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ }
  };
  return (
    <div className="text-xs space-y-1.5">
      <button onClick={() => setOpen((o) => !o)} className="underline text-[var(--color-text-muted)]" aria-expanded={open}>
        {open ? 'Részletek elrejtése' : 'Kapcsolat részletei'}
      </button>
      {open && (
        <div className="rounded-lg bg-black/30 p-2 space-y-1.5">
          <p>{role === 'host' ? 'A szoba a szobaszerveren' : 'Szobaszerver'}: <b>{SIGNAL_LABEL[signal] ?? signal}</b> · Közvetlen kapcsolat: <b>{ice}</b> · TURN: <b>{turn ? 'van' : 'nincs'}</b></p>
          <ol className="max-h-40 overflow-y-auto font-mono space-y-0.5">
            {entries.slice(-20).map((e, i) => (
              <li key={i}>{new Date(e.at).toLocaleTimeString('hu-HU')} {e.text}</li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3 items-center">
            <button onClick={copy} className="underline">{copied ? 'Kimásolva ✓' : 'Napló másolása'}</button>
            {wakeLockSupported() && (
              <label className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={awake} onChange={(e) => { setAwake(e.target.checked); setWakeLockEnabled(e.target.checked); }} />
                Képernyő ébren tartása
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Ranglista: nem csak a pénz - mindhárom index látszik */
export function Leaderboard({ table, final }: { table: TableState; final?: boolean }) {
  const rows = rankPlayers(table.players);
  const best = (f: (r: NonNullable<(typeof rows)[number]['report']>) => number) =>
    rows.length ? rows.reduce((a, b) => (f(b.report!) > f(a.report!) ? b : a)) : undefined;
  const balanced = best((r) => r.wellbeing);
  const safest = best((r) => r.safety);
  const avatar = (id?: string) => PRESETS_BY_DIFFICULTY.find((x) => x.id === id)?.avatar ?? '';
  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-[var(--color-text-muted)]"><th>#</th><th>Játékos</th><th>Függetl.</th><th>Bizt. kör</th><th>Jóllét</th><th>Vagyon</th></tr></thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.id} className="border-t border-white/5">
              <td className="py-1 pr-1 font-bold">{i + 1}.</td>
              <td className="py-1 whitespace-nowrap max-w-[7.5rem] truncate"><span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: displayColor(p) }} />{avatar(p.profileId)} {p.name}{p.lateJoinRound !== undefined ? <span className="text-xs text-[var(--color-text-muted)]"> (később csatlakozott)</span> : null}</td>
              <td className="font-bold">{p.report!.freedom}%</td>
              <td>{p.report!.safety}%</td>
              <td>{p.report!.wellbeing}/100</td>
              <td className="font-mono text-xs">{formatHUF(p.report!.netWorth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-[var(--color-text-muted)]">
        Rangsor: pénzügyi függetlenség (a passzív jövedelem a havi kiadás hány százalékát fedezi), holtversenyben a biztonsági kör, majd a jóllét.
        {table.config.sameProfile ? ' Mindenki ugyanazzal a karakterrel indult.' : ' A vagyon csak tájékoztató: a karakterek különböző helyzetből indulnak.'}
      </p>
      {final && rows.length > 0 && (
        <ul className="text-sm space-y-1">
          <li>🗝️ Legközelebb a pénzügyi függetlenséghez: <b>{rows[0].name}</b></li>
          {balanced && <li>🌿 Legkiegyensúlyozottabb: <b>{balanced.name}</b></li>}
          {safest && <li>🛡️ Legbiztosabb tartalék: <b>{safest.name}</b></li>}
        </ul>
      )}
    </div>
  );
}
