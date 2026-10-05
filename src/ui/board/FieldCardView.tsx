'use client';

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

const isGood = (target: string, amount: number) =>
  target === 'balance' || target === 'salary' || target.startsWith('wellbeing.') ? amount >= 0 : amount <= 0;

/** Mezőkártya: csapda, kísértés, feltöltődés, találkozás, hivatal, piaci hír */
export function FieldCardView({ card, hasKnowledge, onChoose }: Props) {
  const st = FIELD_STYLE[card.field];
  // A helyes válasz ne mindig ugyanott álljon (kártyánként állandó, de vegyes sorrend)
  const options = card.field === 'market_news' ? card.options : shuffle(card.options, createRng(seedFromString(card.id)));
  return (
    <article className="rounded-2xl overflow-hidden" style={{ background: '#FBF7EE', color: '#1C1A16' }}>
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

        {card.redFlags && hasKnowledge && (
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: '#FFF4E0' }}>
            <span className="text-xs font-bold">A tudásod alapján gyanús:</span>
            {card.redFlags.map((f) => (
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
