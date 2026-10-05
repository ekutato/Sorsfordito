'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BOARD, BOARD_SIZE, FIELD_LABELS } from '@/data/board';
import { FIELD_STYLE, BOARD_PAPER } from './fieldStyle';

// A tábla alapgeometriája 358 px széles; a konténer szélességére skálázzuk.
const BASE_W = 358;
const TILE = 52;
const STEP_X = 58;

function layout(expanded: boolean) {
  const step = expanded ? 150 : 110;
  const gap = expanded ? 88 : 52;
  const rowsY = [10, 10 + step, 10 + 2 * step, 10 + 3 * step];
  const tiles = BOARD.map((f, i) => {
    const row = Math.floor(i / 6);
    let col = i % 6;
    if (row % 2 === 1) col = 5 - col;
    return { x: 7 + col * STEP_X, y: rowsY[row], field: f };
  });
  const dy = (r: number) => rowsY[r] + TILE + 2;
  const districts = [
    { x: 7, y: dy(0), w: 168, label: 'Munkahely' }, { x: 183, y: dy(0), w: 150, label: 'Bankutca' },
    { x: 25, y: dy(1), w: 150, label: 'Piactér' }, { x: 183, y: dy(1), w: 168, label: 'Tőzsde' },
    { x: 7, y: dy(2), w: 168, label: 'Hivatal' }, { x: 183, y: dy(2), w: 150, label: 'Közösségi tér' },
  ];
  const connectors = [{ x: 334, y: dy(0) - 4 }, { x: 26, y: dy(1) - 4 }, { x: 334, y: dy(2) - 4 }];
  return { tiles, districts, connectors, gap, height: rowsY[3] + TILE + 12 };
}

interface FullProps {
  position: number;
  /** Kiemelt célmező (dobás után) */
  highlight?: number;
  pawnColor?: string;
  pawnLabel?: string;
}

/** A teljes városi tábla - dobáskor nagyobb (kinyílik) */
export function BoardFull({ position, highlight, pawnColor = '#F2A33A', pawnLabel = 'Te' }: FullProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1.3, e.contentRect.width / BASE_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const L = layout(true);
  const pawn = L.tiles[position % BOARD_SIZE];

  return (
    <div ref={ref} className="w-full">
      <div style={{ height: L.height * scale }} className="relative">
        <div
          className="absolute left-0 top-0 origin-top-left rounded-2xl overflow-hidden"
          style={{ width: BASE_W, height: L.height, transform: `scale(${scale})`, background: BOARD_PAPER }}
          role="img"
          aria-label={`Tábla, a bábud a(z) ${position + 1}. mezőn áll: ${FIELD_LABELS[BOARD[position].type]}`}
        >
          {L.districts.map((d) => (
            <div key={d.label} className="absolute rounded-lg flex items-center justify-center font-bold text-[13px]"
              style={{ left: d.x, top: d.y, width: d.w, height: L.gap, background: '#DCCDAA', color: '#4A3F2C' }}>
              {d.label}
            </div>
          ))}
          {L.connectors.map((c, i) => (
            <div key={i} className="absolute rounded" style={{ left: c.x, top: c.y, width: 14, height: L.gap + 8, background: '#CDBB93' }} />
          ))}
          {L.tiles.map((t) => {
            const st = FIELD_STYLE[t.field.type];
            const hl = highlight === t.field.index;
            return (
              <div key={t.field.index} className="absolute rounded-[10px] flex flex-col items-center justify-center gap-0.5"
                style={{ left: t.x, top: t.y, width: TILE, height: TILE, background: '#FBF7EE',
                  boxShadow: hl ? '0 0 0 3px #F2A33A, 0 2px 0 #C9B78F' : '0 2px 0 #C9B78F' }}
                title={FIELD_LABELS[t.field.type]}>
                <span className="rounded-md flex items-center justify-center font-extrabold text-[13px]"
                  style={{ width: 30, height: 22, background: st.color, color: st.ink }}>{st.glyph}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#6B5D43' }}>{t.field.month ?? ''}</span>
              </div>
            );
          })}
          <motion.div
            className="absolute rounded-full flex items-center justify-center text-[10px] font-extrabold"
            style={{ width: 24, height: 24, background: pawnColor, color: '#0E1525', border: '2px solid #FBF7EE', boxShadow: '0 2px 4px rgba(0,0,0,.35)' }}
            initial={false}
            animate={{ left: pawn.x + 28, top: pawn.y - 8 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          >
            {pawnLabel.slice(0, 1).toUpperCase()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface StripProps {
  position: number;
  onExpand: () => void;
}

/** Keskeny sáv a kör többi részére: a bábu környéke, a teljes tábla egy gombnyomásra */
export function BoardStrip({ position, onExpand }: StripProps) {
  const around = [-2, -1, 0, 1, 2, 3].map((d) => BOARD[(position + d + BOARD_SIZE) % BOARD_SIZE]);
  return (
    <div className="flex items-center gap-2 rounded-xl px-2 py-2" style={{ background: BOARD_PAPER }}>
      <div className="flex gap-1.5 flex-1 min-w-0">
        {around.map((f) => {
          const st = FIELD_STYLE[f.type];
          const here = f.index === position;
          return (
            <div key={f.index} className="relative flex-1 min-w-0 h-10 rounded-lg flex items-center justify-center"
              style={{ background: '#FBF7EE', boxShadow: here ? '0 0 0 2px #F2A33A' : '0 1px 0 #C9B78F' }}
              title={FIELD_LABELS[f.type]}>
              <span className="rounded px-1 text-[11px] font-extrabold" style={{ background: st.color, color: st.ink }}>{st.glyph}</span>
              {here && <span className="absolute -top-2 -right-1 w-4 h-4 rounded-full border-2" style={{ background: '#F2A33A', borderColor: '#FBF7EE' }} />}
            </div>
          );
        })}
      </div>
      <button onClick={onExpand} className="shrink-0 h-10 px-3 rounded-lg text-xs font-semibold"
        style={{ background: '#0E1525', color: '#F4F1EA' }}>
        Tábla
      </button>
    </div>
  );
}

/** Kockadobás gomb rövid "gurulás" animációval */
export function DiceButton({ onRoll, disabled }: { onRoll: () => number | undefined; disabled?: boolean }) {
  const [face, setFace] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const roll = () => {
    if (rolling || disabled) return;
    setRolling(true);
    let n = 0;
    const id = setInterval(() => {
      setFace(1 + Math.floor(Math.random() * 6)); // csak animáció; az érvényes dobás a rollBoard()-ból jön
      if (++n >= 8) {
        clearInterval(id);
        const v = onRoll();
        setFace(v ?? null);
        setRolling(false);
      }
    }, 70);
  };
  return (
    <button onClick={roll} disabled={disabled || rolling}
      className="w-full h-14 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 disabled:opacity-60"
      style={{ background: '#F2A33A', color: '#0E1525' }}>
      <span className="w-9 h-9 rounded-lg flex items-center justify-center text-xl" style={{ background: '#FBF7EE' }}>
        {face ?? '?'}
      </span>
      {rolling ? 'Gurul…' : 'Dobok'}
    </button>
  );
}
