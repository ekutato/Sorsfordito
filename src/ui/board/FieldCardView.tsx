'use client';

import { useEffect, useRef, useState } from 'react';

import { canAfford, optionCost, type FieldCard, type FieldOption } from '@/data/field-cards';
import { FIELD_LABELS } from '@/data/board';
import { formatEffectAmount, formatHUF } from '@/engine/financial-calculator';
import { FIELD_STYLE } from './fieldStyle';
import { WellbeingReflection } from '@/ui/components/WellbeingReflection';
import type { SubjectiveWellbeing } from '@/data/wellbeing-effects';
import { createRng, seedFromString, shuffle } from '@/engine/rng';

interface Props {
  card: FieldCard;
  /** Megvan-e a csapdához illő tudáskártya (ekkor a vészjelek kiemelve látszanak) */
  hasKnowledge: boolean;
  /** A játékos egyenlege: fedezet nélküli opció nem választható */
  balance: number;
  /** Csapdaóra másodpercben (0 = nincs óra; a "Megállok és utánanézek" ekkor is elérhető) */
  trapSeconds?: number;
  onChoose: (option: FieldOption) => void;
}

/** Csapdánál a sürgetés a valóságban is a csalás eszköze - ezt érzékelteti az óra */
export const TRAP_SECONDS = 20;

const TIMEOUT_OPTION: FieldOption = {
  label: 'Nem döntöttél időben',
  effects: [{ target: 'wellbeing.egeszseg', amount: -1 }],
  outcome: 'Nem döntöttél időben: a hívó letette, a pénzed megmaradt, de a nyugtalanság veled marad. A sürgetés maga is vészjel - legközelebb nyugodtan szakítsd meg, és nézz utána.',
};

const isGood = (target: string, amount: number) =>
  target === 'balance' || target === 'salary' || target.startsWith('wellbeing.') ? amount >= 0 : amount <= 0;

/** Mezőkártya: csapda, kísértés, feltöltődés, találkozás, hivatal, piaci hír */
export function FieldCardView({ card, hasKnowledge, balance, trapSeconds = TRAP_SECONDS, onChoose }: Props) {
  const st = FIELD_STYLE[card.field];
  const isTrap = card.field === 'trap';
  const timed = isTrap && trapSeconds > 0;
  const [left, setLeft] = useState(trapSeconds);
  const [checked, setChecked] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    setLeft(trapSeconds);
    setChecked(false);
    ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [card.id, trapSeconds]);
  useEffect(() => {
    if (!timed || checked) return;
    if (left <= 0) { onChoose(TIMEOUT_OPTION); return; }
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timed, checked, left, onChoose]);
  const showFlags = !!card.redFlags && (hasKnowledge || checked);
  // A helyes válasz ne mindig ugyanott álljon (kártyánként állandó, de vegyes sorrend)
  const options = card.field === 'market_news' ? card.options : shuffle(card.options, createRng(seedFromString(card.id)));
  return (
    <article ref={ref} className="rounded-2xl overflow-hidden scroll-mt-24" style={{ background: '#FBF7EE', color: '#1C1A16' }}>
      {card.field === 'trap' ? (
        <div className="h-3" style={{ background: 'repeating-linear-gradient(135deg,#1A1A1A 0 12px,#F2A33A 12px 24px)' }} />
      ) : (
        <div className="h-11 flex items-center justify-between px-4 font-extrabold text-sm uppercase tracking-wide"
          style={{ background: st.color, color: st.ink }}>
          <span>{FIELD_LABELS[card.field]}</span><span>{st.glyph}</span>
        </div>
      )}
      <div className="p-4 space-y-3">
        {card.field === 'trap' && <span className="text-sm font-bold tracking-wider" style={{ color: '#8A4B0B' }}>AJÁNLAT ÉRKEZETT</span>}
        <h2 className="text-xl font-extrabold leading-tight">{card.title}</h2>
        <p className="text-base leading-relaxed" style={{ color: '#3D3628' }}>{card.body}</p>

        {isTrap && !checked && (
          <div className="space-y-2" role="timer" aria-live="polite">
            {timed && (
              <>
                <div className="flex items-center justify-between text-sm font-bold" style={{ color: left <= 5 ? '#A8332A' : '#3D3628' }}>
                  <span>A hívó sürget…</span><span className="font-mono">{left} mp</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E8DDC6' }}>
                  <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${(left / trapSeconds) * 100}%`, background: left <= 5 ? '#C93C30' : '#F2A33A' }} />
                </div>
              </>
            )}
            <button onClick={() => setChecked(true)} className="pulse-cta w-full h-12 rounded-xl text-base font-bold" style={{ background: '#1A1A1A', color: '#F2A33A' }}>
              Megállok és utánanézek
            </button>
          </div>
        )}

        {showFlags && (
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: '#FFF4E0' }}>
            <span className="text-sm font-bold">{hasKnowledge ? 'A tudásod alapján gyanús:' : 'Utánanéztél - ezt találtad:'}</span>
            {(card.redFlags ?? []).map((f) => (
              <div key={f} className="flex gap-2 text-base leading-snug">
                <span className="shrink-0 w-5 h-5 mt-0.5 rounded-full text-xs font-extrabold text-white flex items-center justify-center" style={{ background: '#B4441F' }}>!</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {options.map((o) => {
            const ok = canAfford(o, balance);
            return (
              <button key={o.label} onClick={() => ok && onChoose(o)} disabled={!ok} aria-disabled={!ok}
                className="w-full text-left rounded-xl border px-4 py-3.5 text-base leading-snug disabled:cursor-not-allowed"
                style={{ borderColor: '#D9CCB0', background: ok ? '#FFFFFF' : '#EFE9DC', color: ok ? undefined : '#8A8170' }}>
                <span className="block font-medium">{o.label}</span>
                {(o.effects.length > 0 || o.reflection) && card.field !== 'trap' && (
                  <span className="flex flex-wrap gap-1.5 mt-2">
                    {o.effects.map((e, i) => <EffectChip key={i} target={e.target} amount={e.amount} />)}
                    {o.reflection && (
                      <span className="text-sm font-semibold px-2 py-0.5 rounded-md" style={{ background: '#E6F0FA', color: '#1D4F7A' }}>
                        Jóllét: te mérlegeled
                      </span>
                    )}
                  </span>
                )}
                {!ok && (
                  <span className="block mt-1.5 text-sm font-semibold" style={{ color: '#A8332A' }}>
                    Nincs rá fedezeted (hiányzik: {formatHUF(optionCost(o) - Math.max(0, balance))})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-sm leading-relaxed border-t border-dashed pt-3" style={{ borderColor: '#CDBB93', color: '#4A3F2C' }}>
          <span className="font-bold">Valós lépés: </span>{card.realStep}
          {card.sourceUrl && <> · <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">forrás</a></>}
        </p>
      </div>
    </article>
  );
}

function EffectChip({ target, amount, big }: { target: string; amount: number; big?: boolean }) {
  const good = isGood(target, amount);
  return (
    <span className={big ? 'text-base font-bold px-3 py-1.5 rounded-lg' : 'text-sm font-semibold px-2 py-0.5 rounded-md'}
      style={{ background: good ? '#EAF5EE' : '#FBEAE7', color: good ? '#1F7A4D' : '#A8332A' }}>
      {amount >= 0 ? '+' : ''}{formatEffectAmount(target, amount)}
    </span>
  );
}

interface OutcomeProps {
  result: { field: string; title: string; choice: string; effects: Array<{ target: string; amount: number }>; realStep: string; sourceUrl?: string; reflection?: SubjectiveWellbeing };
  outcome: string;
  onContinue: () => void;
}

/** Nagy eredménylap a kártya helyén: mi lett a választásod következménye */
export function FieldOutcomeView({ result, outcome, onContinue }: OutcomeProps) {
  const st = FIELD_STYLE[result.field as keyof typeof FIELD_STYLE] ?? FIELD_STYLE.office;
  const ref = useRef<HTMLElement>(null);
  const [reflected, setReflected] = useState(!result.reflection);
  useEffect(() => { ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, []);
  return (
    <article ref={ref} role="status" className="rounded-2xl overflow-hidden scroll-mt-24" style={{ background: '#FBF7EE', color: '#1C1A16' }}>
      <div className="h-11 flex items-center justify-between px-4 font-extrabold text-sm uppercase tracking-wide" style={{ background: st.color, color: st.ink }}>
        <span>Eredmény</span><span>{st.glyph}</span>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: '#6B604B' }}>{result.title}</p>
          <p className="text-base font-bold mt-1">A döntésed: {result.choice}</p>
        </div>
        <p className="text-lg leading-relaxed font-medium">{outcome}</p>
        {result.effects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {result.effects.map((e, i) => <EffectChip key={i} target={e.target} amount={e.amount} big />)}
          </div>
        )}
        <p className="text-sm leading-relaxed border-t border-dashed pt-3" style={{ borderColor: '#CDBB93', color: '#4A3F2C' }}>
          <span className="font-bold">Valós lépés: </span>{result.realStep}
          {result.sourceUrl && <> · <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">forrás</a></>}
        </p>
        {!reflected && result.reflection ? (
          <div style={{ background: '#0E1525', color: '#F4F1EA' }} className="rounded-xl">
            <WellbeingReflection reflection={result.reflection} onDone={() => setReflected(true)} />
          </div>
        ) : (
          <button onClick={onContinue} className="pulse-cta w-full h-14 rounded-2xl font-extrabold text-lg" style={{ background: '#F2A33A', color: '#0E1525' }}>
            Tovább
          </button>
        )}
      </div>
    </article>
  );
}
