'use client';

// Mínusz egyenleg: a kör nem zárható le, amíg a hiány nincs rendezve. A lehetőségek a játékos helyzetéhez igazodnak.
import { useGameStore } from '@/store/game-store';
import { crisisChoices, resolveCrisis } from '@/store/crisis-actions';
import { formatHUF } from '@/engine/financial-calculator';

export function CrisisPanel() {
  const game = useGameStore((s) => s.game);
  if (!game) return null;
  const sheet = game.players[game.activePlayerIndex].financialSheet;
  if (sheet.balance >= 0) return null;
  const choices = crisisChoices(game);
  const income = sheet.income.salary + sheet.income.passive;
  const expenses = Object.values(sheet.expenses).reduce((a, b) => a + b, 0);
  return (
    <div className="game-card card-type-fate space-y-3" role="alert">
      <h3 className="font-display text-lg font-semibold text-card-fate">⚠️ Hiányzik {formatHUF(-sheet.balance)}</h3>
      <p className="text-sm text-[var(--color-text-muted)]">
        A bankszámla nem mehet mínuszba: a számlákat, a lakbért és a részleteket ki kell fizetni. Döntsd el, honnan lesz rá pénz - addig nem zárhatod le a kört.
      </p>
      {expenses > income && (
        <p className="text-sm rounded-lg bg-money-negative/10 px-3 py-2">
          A havi kiadásod ({formatHUF(expenses)}) több, mint a bevételed ({formatHUF(income)}): a hiány minden hónapban újra jön, amíg nem csökkented a kiadást vagy nem nő a bevétel.
        </p>
      )}
      <div className="space-y-2">
        {choices.map((c) => (
          <button key={c.id} disabled={!c.available} onClick={() => resolveCrisis(c.id)}
            className={`w-full text-left rounded-xl border px-3 py-2.5 ${c.available ? 'border-white/15 bg-white/5 hover:bg-white/10' : 'border-white/5 opacity-50 cursor-not-allowed'}`}>
            <span className="block font-semibold">{c.title}</span>
            <span className="block text-sm text-[var(--color-text-muted)]">{c.available ? c.text : c.reason}</span>
            {c.available && <span className="block text-xs mt-1 text-amber-300">{c.consequence}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
