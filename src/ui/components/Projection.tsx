'use client';

// Mennyit érhet a befektetés 5, 10, 20 év múlva (tájékoztató; a ranglistán nem számít)
import { projectInvestment } from '@/engine/projection';
import { formatHUF } from '@/engine/financial-calculator';

const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('hu-HU', { maximumFractionDigits: 1 })} M Ft` : formatHUF(n));

export function ProjectionRow({ optionId, value, monthlyIncome }: { optionId: string; value: number; monthlyIncome?: number }) {
  const p = projectInvestment({ optionId, currentValue: value, monthlyIncome });
  if (p.kind === 'none') return <p className="text-xs mt-1 text-[var(--color-text-muted)]">🔭 {p.note}</p>;
  return (
    <div className="mt-1.5 rounded-lg bg-sky-500/10 px-2 py-1.5">
      <p className="text-xs font-semibold text-sky-300">🔭 Ha megtartod:</p>
      <div className="grid grid-cols-3 gap-1 text-center mt-0.5">
        {p.points.map((pt) => (
          <div key={pt.years}>
            <div className="text-[11px] text-[var(--color-text-muted)]">{pt.years} év múlva</div>
            <div className="font-mono text-xs font-semibold">{p.kind === 'market' ? '~' : ''}{short(pt.mid)}</div>
            {p.kind === 'market' && <div className="font-mono text-[11px] text-[var(--color-text-muted)]">{short(pt.low)}-{short(pt.high)}</div>}
            <div className="text-[11px] text-[var(--color-text-muted)]">mai pénzben {short(pt.real)}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] mt-1 text-[var(--color-text-muted)]">{p.note} Tájékoztató, a játék értékelésébe nem számít bele.</p>
    </div>
  );
}
