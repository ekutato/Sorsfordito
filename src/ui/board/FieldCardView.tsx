'use client';

import { useEffect, useRef, useState } from 'react';

import type { FieldCard, FieldOption } from '@/data/field-cards';
import { FIELD_LABELS } from '@/data/board';
import { formatEffectAmount } from '@/engine/financial-calculator';
import { FIELD_STYLE } from './fieldStyle';
import { createRng, seedFromString, shuffle } from '@/engine/rng';

interface Props {
  card: FieldCard;
  /** Megvan-e a csapdához illő tudáskártya (ekkor a vészjelek kiemelve látszanak) */
  hasKnowledge: boolean;
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
export function FieldCardView({ card, hasKnowledge, onChoose }: Props) {
  const st = FIELD_STYLE[card.field];
  const isTrap = card.field === 'trap';
  const [left, setLeft] = useState(TRAP_SECONDS);
  const [checked, setChecked] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    setLeft(TRAP_SECONDS);
    setChecked(false);
    ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [card.id]);
  useEffect(() => {
    if (!isTrap || checked) return;
    if (left <= 0) { onChoose(TIMEOUT_OPTION); return; }
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [isTrap, checked, left, onChoose]);
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
        {card.field === 'trap' && <span className="text-xs font-bold tracking-wider" style={{ color: '#8A4B0B' }}>AJÁNLAT ÉRKEZETT</span>}
        <h2 className="text-xl font-extrabold leading-tight">{card.title}</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D3628' }}>{card.body}</p>

        {isTrap && !checked && (
          <div className="space-y-2" role="timer" aria-live="polite">
            <div className="flex items-center justify-between text-sm font-bold" style={{ color: left <= 5 ? '#A8332A' : '#3D3628' }}>
              <span>A hívó sürget…</span><span className="font-mono">{left} mp</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E8DDC6' }}>
              <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${(left / TRAP_SECONDS) * 100}%`, background: left <= 5 ? '#C93C30' : '#F2A33A' }} />
            </div>
            <button onClick={() => setChecked(true)} className="pulse-cta w-full h-11 rounded-xl text-sm font-bold" style={{ background: '#1A1A1A', color: '#F2A33A' }}>
              Megállok és utánanézek
            </button>
          </div>
        )}

        {showFlags && (
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: '#FFF4E0' }}>
            <span className="text-xs font-bold">{hasKnowledge ? 'A tudásod alapján gyanús:' : 'Utánanéztél - ezt találtad:'}</span>
            {(card.redFlags ?? []).map((f) => (
              <div key={f} className="flex gap-2 text-sm leading-snug">
                <span className="shrink-0 w-[18px] h-[18px] rounded-full text-[11px] font-extrabold text-white flex items-center justify-center" style={{ background: '#B4441F' }}>!</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {options.map((o) => (
            <button key={o.label} onClick={() => onChoose(o)}
              className="w-full text-left rounded-xl border px-3 py-3 text-[15px] leading-snug"
              style={{ borderColor: '#D9CCB0', background: '#FFFFFF' }}>
              <span className="block">{o.label}</span>
              {o.effects.length > 0 && card.field !== 'trap' && (
                <span className="flex flex-wrap gap-1.5 mt-1.5">
                  {o.effects.map((e, i) => (
                    <span key={i} className="text-[11px] px-1.5 py-0.5 rounded"
                      style={{ background: isGood(e.target, e.amount) ? '#EAF5EE' : '#FBEAE7', color: isGood(e.target, e.amount) ? '#1F7A4D' : '#A8332A' }}>
                      {e.amount >= 0 ? '+' : ''}{formatEffectAmount(e.target, e.amount)}
                    </span>
                  ))}
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs leading-relaxed border-t border-dashed pt-2" style={{ borderColor: '#CDBB93', color: '#4A3F2C' }}>
          <span className="font-bold">Valós lépés: </span>{card.realStep}
          {card.sourceUrl && <> · <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">forrás</a></>}
        </p>
      </div>
    </article>
  );
}
