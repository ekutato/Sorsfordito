'use client';

import { useMemo, useState } from 'react';
import { LIVE_DATA } from '@/data/live';
import { LIVE_VAR_DEFS } from '@/data/live/vars';
import { liveUsage } from '@/data/live/usage';

const EXTRA_LABELS: Record<string, string> = {
  'ksh.monthlyInflation': 'Havi infláció',
  'ksh.grossAverageWage': 'Bruttó átlagkereset',
  'ksh.netMedianWage': 'Nettó mediánkereset',
  'ksh.unemploymentRate': 'Munkanélküliségi ráta',
  'akk.oneYearBondYield': '1 éves állampapír-hozam',
  'akk.fiveYearBondYield': '5 éves állampapír-hozam',
  'stockMarket.buxDailyChange': 'BUX napi változása',
};

export function liveKeyLabel(key: string): string {
  const v = Object.values(LIVE_VAR_DEFS).find((d) => d.key === key);
  return v?.label ?? EXTRA_LABELS[key] ?? key;
}

const GROUPS: Array<[string, string]> = [
  ['mnb.', 'Jegybank és árfolyamok'], ['ksh.', 'Árak és keresetek'], ['akk.', 'Állampapírok'],
  ['bank.', 'Banki kamatok'], ['diakhitel.', 'Diákhitel'], ['realEstate.', 'Lakhatás'],
  ['stockMarket.', 'Tőzsde'], ['metals.', 'Nemesfémek'], ['crypto.', 'Kriptoeszközök'],
];

const fmt = (n: number) => n.toLocaleString('hu-HU', { maximumFractionDigits: 2 });

/** A következő hétfő a frissítés napja után */
function nextUpdate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const add = ((8 - d.getDay()) % 7) || 7;
  d.setDate(d.getDate() + add);
  return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function weekLabel(): string {
  const [y, w] = LIVE_DATA.het.split('-W');
  return `${y}. ${Number(w)}. hét`;
}

/** "Heti adatok": minden élő érték forrással, dátummal; a változás sárgán */
export function LiveDataPanel({ onClose }: { onClose: () => void }) {
  const usage = useMemo(() => liveUsage(), []);
  const [open, setOpen] = useState<string | null>(null);
  const entries = Object.entries(LIVE_DATA.ertekek);
  const changed = entries.filter(([, e]) => e.elozo && e.elozo.value !== e.value).length;
  const unverified = entries.filter(([, e]) => !e.verified).length;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div role="dialog" aria-label="Heti adatok" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#172036] border border-white/10 p-4 safe-bottom">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Heti adatok - {weekLabel()}</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Frissítve: {new Date(`${LIVE_DATA.frissitve}T12:00:00`).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })} · következő: {nextUpdate(LIVE_DATA.frissitve)}
            </p>
          </div>
          <button onClick={onClose} aria-label="Bezárás" className="w-10 h-10 shrink-0 rounded-lg bg-white/5 text-xl">×</button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 text-sm">
          <span className="px-2 py-1 rounded-md" style={{ background: '#FEF3C7', color: '#713F12' }}>{changed} érték változott az előző közzétett értékhez képest</span>
          {unverified > 0 && <span className="px-2 py-1 rounded-md bg-rose-500/20 text-rose-200">{unverified} nem ellenőrzött</span>}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">Minden érték mellett ott a forrás. A sárga sor az előző közzétett értékhez képest megváltozott értéket jelöli (régi → új); a havi és negyedéves adatok csak megjelenésükkor változnak. Koppints egy sorra: megmutatja, hol használja a játék.</p>

        {GROUPS.map(([prefix, title]) => {
          const rows = entries.filter(([k]) => k.startsWith(prefix));
          if (!rows.length) return null;
          return (
            <section key={prefix} className="mt-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">{title}</h3>
              <div className="space-y-1.5">
                {rows.map(([k, e]) => {
                  const isChanged = !!e.elozo && e.elozo.value !== e.value;
                  const used = usage[k] ?? [];
                  return (
                    <div key={k} className="rounded-lg px-3 py-2 cursor-pointer"
                      style={isChanged ? { background: '#FEF3C7', color: '#1C1A16' } : { background: 'rgba(255,255,255,0.05)' }}
                      onClick={() => setOpen(open === k ? null : k)}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold">{liveKeyLabel(k)}</span>
                        <span className="font-mono text-base font-bold whitespace-nowrap">
                          {isChanged && <span className="opacity-60 line-through mr-1">{fmt(e.elozo!.value)}</span>}
                          {isChanged && '→ '}{fmt(e.value)} {e.unit}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs mt-0.5" style={{ opacity: 0.85 }}>
                        <span>{e.asOf}</span>
                        <span>·</span>
                        {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline" onClick={(ev) => ev.stopPropagation()}>{e.source}</a> : <span>{e.source}</span>}
                        {!e.verified && <span className="font-bold" style={{ color: isChanged ? '#A8332A' : '#FDA4AF' }}>· nem ellenőrzött</span>}
                      </div>
                      {open === k && (
                        <p className="text-xs mt-1.5 leading-snug">
                          <b>Hol használja a játék:</b> {used.length ? used.join(', ') : 'jelenleg háttéradat (számításokhoz)'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {LIVE_DATA.hirek.length > 0 && (
          <section className="mt-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">A hét hírei a játékban</h3>
            <ul className="space-y-1.5">
              {LIVE_DATA.hirek.map((h) => (
                <li key={h.url} className="text-sm rounded-lg px-3 py-2 bg-white/5">
                  {h.title} · <a href={h.url} target="_blank" rel="noopener noreferrer" className="underline">{h.source}</a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/** Gomb a panel megnyitásához */
export function LiveDataButton({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>Heti adatok - {weekLabel()}</button>
      {open && <LiveDataPanel onClose={() => setOpen(false)} />}
    </>
  );
}
