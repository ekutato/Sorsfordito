'use client';

import { useState } from 'react';
import { secureDieRoll, readRollStats } from '@/store/board-actions';
import type { DiceRollSource } from '@/types/game';

const SOURCE_NOTE: Record<DiceRollSource, string> = { app: '', physical: 'saját kocka', test: 'teszt' };

function Bars({ counts, title }: { counts: number[]; title: string }) {
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...counts);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{total} dobás</span>
      </div>
      <div className="flex items-end gap-2 h-28" role="img" aria-label={`${title}: ${counts.map((c, i) => `${i + 1}: ${c}`).join(', ')}`}>
        {counts.map((c, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span className="text-xs font-mono">{c}</span>
            <div className="w-full rounded-t-md" style={{ height: `${(c / max) * 100}%`, minHeight: 2, background: '#F2A33A' }} />
            <span className="text-sm font-bold">{i + 1}</span>
          </div>
        ))}
      </div>
      {total > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Elvárt érték: oldalanként {(total / 6).toLocaleString('hu-HU', { maximumFractionDigits: 1 })} ({(100 / 6).toLocaleString('hu-HU', { maximumFractionDigits: 1 })}%)
        </p>
      )}
    </div>
  );
}

/** "Honnan jön a véletlen?" - a dobás forrása, a dobásnapló és az eloszlás, saját próbával */
export function DiceInfo({ rolls, onClose }: { rolls: Array<{ value: number; source: DiceRollSource }>; onClose: () => void }) {
  const [trial, setTrial] = useState<number[] | null>(null);
  const stats = readRollStats();
  const runTrial = () => {
    const c = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 100; i++) c[secureDieRoll() - 1] += 1;
    setTrial(c);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div role="dialog" aria-label="Honnan jön a véletlen?" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#172036] border border-white/10 p-5 space-y-4 safe-bottom">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Honnan jön a véletlen?</h2>
          <button onClick={onClose} aria-label="Bezárás" className="w-10 h-10 rounded-lg bg-white/5 text-xl">×</button>
        </div>
        <div className="space-y-2 text-base leading-relaxed">
          <p>A dobás a készüléked <b>kriptográfiai véletlenforrásából</b> jön (<code className="text-sm">crypto.getRandomValues</code>) - ugyanabból, amelyből a böngésző a titkosítási kulcsokat készíti. Nincs előre beállított sorrend, és a játék sem "dönti el" előre.</p>
          <p className="text-sm text-[var(--color-text-muted)]">Torzítás nélkül: a gép 0 és 255 közötti számot húz; a 252-255 közöttit eldobja és újrahúz, a többiből a 6-tal vett maradék + 1 a dobás. Így mind a hat érték pontosan 42/252 = 1/6 eséllyel jön.</p>
          <p className="text-sm text-[var(--color-text-muted)]">A gurulás közben villogó számok csak díszítés - a végső szám a valódi dobás.</p>
          <p className="text-sm">Ha ezt nem hiszed el: a Beállításokban válaszd a <b>"Saját kockával dobok"</b> lehetőséget, és üsd be, amit dobtál.</p>
        </div>

        <div className="space-y-1">
          <span className="text-sm font-semibold">Ebben a játékban dobtad:</span>
          <p className="font-mono text-base break-words">
            {rolls.length ? rolls.map((r, i) => <span key={i} className="mr-2">{r.value}{r.source !== 'app' && <sup className="text-[var(--color-text-muted)]"> {SOURCE_NOTE[r.source]}</sup>}</span>) : 'még nincs dobás'}
          </p>
        </div>

        <Bars counts={stats} title="Az app összes dobása ezen a készüléken" />
        <p className="text-sm text-[var(--color-text-muted)]">Kevés dobásnál nagy az ingadozás: 10-20 dobásnál könnyen jön háromszor ugyanaz, vagy marad ki egy szám. Sok dobásnál az oszlopok kiegyenlítődnek.</p>

        <div className="rounded-xl bg-white/5 p-3 space-y-3">
          <button onClick={runTrial} className="w-full h-12 rounded-xl text-base font-bold" style={{ background: '#F2A33A', color: '#0E1525' }}>
            {trial ? 'Újabb 100 próbadobás' : '100 próbadobás'}
          </button>
          {trial && <Bars counts={trial} title="Próbadobások (nem számítanak a játékba)" />}
        </div>
      </div>
    </div>
  );
}
