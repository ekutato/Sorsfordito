'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BOARD, BOARD_SIZE, DISTRICTS, FIELD_EXPLAIN, FIELD_LABELS, FIELD_SHORT, districtOf, type FieldType } from '@/data/board';
import { FIELD_STYLE, BOARD_PAPER } from './fieldStyle';

// A tábla alapgeometriája 358 px széles; a konténer szélességére skálázzuk.
// Soronként egy negyed (4 mező), kígyózó útvonal; a negyed neve és témája a sor elején.
const BASE_W = 358;
const TILE = 56;
const STEP_X = 61;
const ROW_H = 74;
const LABEL_W = 98;
const TILES_X = 106;

function layout() {
  const tiles = BOARD.map((f, i) => {
    const row = Math.floor(i / 4);
    let col = i % 4;
    if (row % 2 === 1) col = 3 - col;
    return { x: TILES_X + col * STEP_X, y: 10 + row * ROW_H, field: f };
  });
  const rows = DISTRICTS.map((d, r) => ({ ...d, y: 10 + r * ROW_H }));
  // Összekötők a sorok végén (jobbra, balra váltakozva)
  const connectors = rows.slice(0, -1).map((_, r) => ({ x: (r % 2 === 0 ? TILES_X + 3 * STEP_X : TILES_X) + TILE / 2 - 6, y: 10 + r * ROW_H + TILE }));
  return { tiles, rows, connectors, height: 10 + DISTRICTS.length * ROW_H };
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
  const L = layout();
  const pawn = L.tiles[position % BOARD_SIZE];
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div ref={ref} className="w-full">
      <div style={{ height: L.height * scale }} className="relative">
        <div
          className="absolute left-0 top-0 origin-top-left rounded-2xl overflow-hidden"
          style={{ width: BASE_W, height: L.height, transform: `scale(${scale})`, background: BOARD_PAPER }}
          role="img"
          aria-label={`Tábla, a bábud a(z) ${position + 1}. mezőn áll: ${FIELD_LABELS[BOARD[position].type]}`}
        >
          {L.rows.map((d) => (
            <div key={d.id} className="absolute rounded-lg px-2 flex flex-col justify-center"
              style={{ left: 6, top: d.y, width: LABEL_W - 4, height: TILE, background: '#DCCDAA', color: '#4A3F2C' }}>
              <span className="font-extrabold text-xs leading-tight">{d.label}</span>
              <span className="text-[11px] leading-tight mt-0.5" style={{ color: '#6B5D43' }}>{d.tag}</span>
            </div>
          ))}
          {L.connectors.map((c, i) => (
            <div key={i} className="absolute rounded" style={{ left: c.x, top: c.y, width: 12, height: ROW_H - TILE, background: '#CDBB93' }} />
          ))}
          {L.tiles.map((t) => {
            const st = FIELD_STYLE[t.field.type];
            const hl = highlight === t.field.index;
            return (
              <div key={t.field.index} onClick={() => setPicked(picked === t.field.index ? null : t.field.index)}
                className="absolute rounded-[10px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                style={{ left: t.x, top: t.y, width: TILE, height: TILE, background: '#FBF7EE',
                  boxShadow: hl ? '0 0 0 3px #F2A33A, 0 2px 0 #C9B78F' : picked === t.field.index ? '0 0 0 2px #4A3F2C' : '0 2px 0 #C9B78F' }}
                title={`${FIELD_LABELS[t.field.type]} - ${FIELD_EXPLAIN[t.field.type]}`}>
                <span className="rounded-md flex items-center justify-center font-extrabold text-[13px]"
                  style={{ width: 30, height: 22, background: st.color, color: st.ink }}>{st.glyph}</span>
                <span className="text-xs font-bold leading-none" style={{ color: "#4A3F2C" }}>{FIELD_SHORT[t.field.type]}</span>
              </div>
            );
          })}
          <motion.div
            className="absolute rounded-full flex items-center justify-center text-[10px] font-extrabold"
            style={{ width: 24, height: 24, background: pawnColor, color: '#0E1525', border: '2px solid #FBF7EE', boxShadow: '0 2px 4px rgba(0,0,0,.35)' }}
            initial={false}
            animate={{ left: pawn.x + TILE - 16, top: pawn.y - 8 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          >
            {pawnLabel.slice(0, 1).toUpperCase()}
          </motion.div>
        </div>
      </div>
      {picked !== null && (
        <div className="mt-2 rounded-lg px-2 py-1.5" style={{ background: BOARD_PAPER }}>
          <FieldInfoLine type={BOARD[picked].type} index={picked} />
        </div>
      )}
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
  const [picked, setPicked] = useState<number | null>(null);
  const info = picked !== null ? BOARD[picked] : undefined;
  return (
    <div className="rounded-xl px-2 py-2 space-y-1.5" style={{ background: BOARD_PAPER }}>
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 flex-1 min-w-0">
          {around.map((f) => {
            const st = FIELD_STYLE[f.type];
            const here = f.index === position;
            return (
              <button key={f.index} onClick={() => setPicked(picked === f.index ? null : f.index)}
                className="relative flex-1 min-w-0 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5"
                style={{ background: '#FBF7EE', boxShadow: here ? '0 0 0 2px #F2A33A' : picked === f.index ? '0 0 0 2px #4A3F2C' : '0 1px 0 #C9B78F' }}
                aria-label={`${FIELD_LABELS[f.type]} (${districtOf(f.index).label})`}>
                <span className="rounded px-1 text-xs font-extrabold" style={{ background: st.color, color: st.ink }}>{st.glyph}</span>
                <span className="text-[10px] font-bold leading-none truncate max-w-full" style={{ color: '#4A3F2C' }}>{FIELD_SHORT[f.type]}</span>
                {here && <span className="absolute -top-2 -right-1 w-4 h-4 rounded-full border-2" style={{ background: '#F2A33A', borderColor: '#FBF7EE' }} />}
              </button>
            );
          })}
        </div>
        <button onClick={onExpand} className="shrink-0 h-12 px-3 rounded-lg text-sm font-semibold"
          style={{ background: '#0E1525', color: '#F4F1EA' }}>
          Tábla
        </button>
      </div>
      {info && <FieldInfoLine type={info.type} index={info.index} />}
    </div>
  );
}

/** Egy mező neve, negyede és egymondatos magyarázata */
export function FieldInfoLine({ type, index }: { type: FieldType; index: number }) {
  return (
    <p className="text-sm leading-snug px-1" style={{ color: '#1C1A16' }}>
      <b>{FIELD_LABELS[type]}</b> <span style={{ color: '#6B5D43' }}>({districtOf(index).label})</span>: {FIELD_EXPLAIN[type]}
    </p>
  );
}

/** Jelmagyarázat: mit jelentenek a mezők és a negyedek (összecsukható) */
export function BoardLegend() {
  const [open, setOpen] = useState(false);
  const types = Object.keys(FIELD_LABELS) as FieldType[];
  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between px-4 h-11 text-sm font-semibold">
        <span>Mit jelentenek a mezők?</span><span aria-hidden>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <ul className="space-y-2">
            {types.map((t) => {
              const st = FIELD_STYLE[t];
              return (
                <li key={t} className="flex gap-2.5 text-sm leading-snug">
                  <span className="shrink-0 rounded-md w-8 h-6 flex items-center justify-center text-xs font-extrabold" style={{ background: st.color, color: st.ink }}>{st.glyph}</span>
                  <span><b>{FIELD_LABELS[t]}</b> - {FIELD_EXPLAIN[t]}</span>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-white/10 pt-3 space-y-1.5">
            <p className="text-sm font-semibold">Negyedek</p>
            {DISTRICTS.map((d) => (
              <p key={d.id} className="text-sm leading-snug"><b>{d.label}</b>: {d.hint}</p>
            ))}
          </div>
        </div>
      )}
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
      className={`w-full h-14 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 disabled:opacity-60 ${rolling ? '' : 'pulse-cta'}`}
      style={{ background: '#F2A33A', color: '#0E1525' }}>
      <span className="w-9 h-9 rounded-lg flex items-center justify-center text-xl" style={{ background: '#FBF7EE' }}>
        {face ?? '?'}
      </span>
      {rolling ? 'Gurul…' : 'Dobok'}
    </button>
  );
}
