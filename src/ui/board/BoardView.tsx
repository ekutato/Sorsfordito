'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BOARD, BOARD_SIZE, DISTRICTS, FIELD_EXPLAIN, FIELD_LABELS, FIELD_SHORT, districtOf, type FieldType } from '@/data/board';
import { FIELD_STYLE, BOARD_PAPER } from './fieldStyle';
import { DieFace, CyclingDieIcon } from './Die';
import { play } from '@/audio/sfx';

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
  /** Honnan lépett a bábu: ekkor mezőről mezőre lép, nyomvonallal */
  from?: number;
  /** A célmezőből kiemelkedő kártya (dobás után) */
  reveal?: { field: FieldType; hasCard: boolean };
  /** A tábla férjen ki a képernyőn (fejléc + dobógomb mellett) */
  fitViewport?: boolean;
  /** A bábu megérkezett a célmezőre */
  onArrived?: () => void;
  /** A kiemelkedő kártyára koppintva (ugyanaz, mint a "Felfordítom" / "Tovább" gomb) */
  onRevealClick?: () => void;
  pawnColor?: string;
  pawnLabel?: string;
  /** A többi játékos bábuja (asztali játék) */
  others?: Array<{ position: number; color: string; label: string }>;
}

/** Fejléc + dobó/tovább gombok helye a képernyőn, amikor a tábla nyitva van */
const RESERVED_H = 250;

/** A teljes városi tábla - dobáskor kinyílik, a bábu mezőről mezőre lép */
export function BoardFull({ position, highlight, from, reveal, fitViewport, onArrived, onRevealClick, pawnColor = '#F2A33A', pawnLabel = 'Te', others = [] }: FullProps) {
  const ref = useRef<HTMLDivElement>(null);
  const L = layout();
  const [box, setBox] = useState({ w: BASE_W, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: window.innerHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  const byWidth = Math.min(1.3, box.w / BASE_W);
  const byHeight = fitViewport && box.h ? Math.max(0.62, (box.h - RESERVED_H) / L.height) : Infinity;
  const scale = Math.min(byWidth, byHeight);
  const offsetX = Math.max(0, (box.w - BASE_W * scale) / 2);

  // Útvonal: a kiinduló mezőtől a célig, lépésenként
  const steps = from !== undefined ? (position - from + BOARD_SIZE) % BOARD_SIZE : 0;
  const path = Array.from({ length: steps }, (_, i) => (from! + i + 1) % BOARD_SIZE);
  const perStep = steps ? Math.min(0.32, 2.2 / steps) : 0;
  const pawnAt = (i: number) => ({ left: L.tiles[i].x + TILE - 16, top: L.tiles[i].y - 8 });
  const [arrived, setArrived] = useState(steps === 0);
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => {
    if (steps === 0) { setArrived(true); onArrived?.(); return; }
    setArrived(false);
    const t = setTimeout(() => { setArrived(true); onArrived?.(); }, (steps * perStep + 0.15) * 1000);
    // Lépésenként egy koppanás, a bábu mozgásával egy ütemben
    const ticks = Array.from({ length: steps }, (_, i) => setTimeout(() => play('step'), (i + 1) * perStep * 1000));
    return () => { clearTimeout(t); ticks.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, position]);

  const target = L.tiles[position % BOARD_SIZE];
  const pawnKeys = steps ? [pawnAt(from!), ...path.map(pawnAt)] : [pawnAt(position)];
  const revealSt = reveal ? FIELD_STYLE[reveal.field] : undefined;
  const cardW = 230, cardH = 186;
  // A kártya ne takarja a megtett utat: felső félnél a célsor alá, alsó félnél fölé kerül
  const cardTop = target.y < L.height / 2
    ? Math.min(L.height - cardH - 8, target.y + TILE + 22)
    : Math.max(8, target.y - cardH - 22);

  return (
    <div ref={ref} className="w-full">
      <div style={{ height: L.height * scale }} className="relative">
        <div
          className="absolute top-0 origin-top-left rounded-2xl overflow-hidden"
          style={{ left: offsetX, width: BASE_W, height: L.height, transform: `scale(${scale})`, background: BOARD_PAPER }}
          role="group"
          aria-label={`Tábla, a bábud a(z) ${position + 1}. mezőn áll: ${FIELD_LABELS[BOARD[position].type]}${steps ? `, ${steps} mezőt lépett` : ''}`}
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
            const hl = highlight === t.field.index && arrived;
            const isStart = steps > 0 && t.field.index === from;
            const stepNo = path.indexOf(t.field.index);
            return (
              <div key={t.field.index} onClick={() => setPicked(picked === t.field.index ? null : t.field.index)}
                className="absolute rounded-[10px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                style={{ left: t.x, top: t.y, width: TILE, height: TILE, background: '#FBF7EE',
                  outline: isStart ? '2px dashed #6B5D43' : undefined, outlineOffset: 2,
                  boxShadow: hl ? '0 0 0 3px #F2A33A, 0 0 14px 4px rgba(242,163,58,.7)' : picked === t.field.index ? '0 0 0 2px #4A3F2C' : '0 2px 0 #C9B78F' }}
                title={`${FIELD_LABELS[t.field.type]} - ${FIELD_EXPLAIN[t.field.type]}`}>
                <span className="rounded-md flex items-center justify-center font-extrabold text-[13px]"
                  style={{ width: 30, height: 22, background: st.color, color: st.ink }}>{st.glyph}</span>
                <span className="text-xs font-bold leading-none" style={{ color: '#4A3F2C' }}>{FIELD_SHORT[t.field.type]}</span>
                {isStart && <span className="absolute -bottom-2 left-1 text-[10px] font-bold px-1 rounded" style={{ background: '#6B5D43', color: '#FBF7EE' }}>innen</span>}
                {stepNo >= 0 && (
                  <motion.span className="absolute -bottom-2 -left-1 w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center"
                    style={{ background: '#F2A33A', color: '#0E1525', border: '2px solid #FBF7EE' }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: (stepNo + 1) * perStep }}>
                    {stepNo + 1}
                  </motion.span>
                )}
              </div>
            );
          })}
          {others.map((o, i) => {
            const t = L.tiles[o.position % BOARD_SIZE];
            return (
              <div key={`${o.label}-${i}`} title={o.label} aria-label={`${o.label} bábuja`}
                className="absolute rounded-full flex items-center justify-center text-[9px] font-extrabold z-[5]"
                style={{ width: 18, height: 18, left: t.x + 2 + (i % 3) * 12, top: t.y + TILE - 14, background: o.color, color: '#0E1525', border: '2px solid #FBF7EE' }}>
                {o.label.slice(0, 1).toUpperCase()}
              </div>
            );
          })}
          <motion.div
            key={`${from ?? 'x'}-${position}`}
            className="absolute rounded-full flex items-center justify-center text-[10px] font-extrabold z-10"
            style={{ width: 24, height: 24, background: pawnColor, color: '#0E1525', border: '2px solid #FBF7EE', boxShadow: '0 2px 4px rgba(0,0,0,.35)' }}
            initial={pawnKeys[0]}
            animate={steps ? { left: pawnKeys.map((k) => k.left), top: pawnKeys.map((k) => k.top) } : pawnKeys[0]}
            transition={steps ? { duration: steps * perStep, ease: 'linear' } : { duration: 0 }}
          >
            {pawnLabel.slice(0, 1).toUpperCase()}
          </motion.div>

          {/* A célmezőből kiemelkedő kártya */}
          {reveal && revealSt && arrived && (
            <motion.button
              type="button"
              onClick={onRevealClick}
              aria-label={reveal.hasCard ? `${FIELD_LABELS[reveal.field]} kártya - koppints a felfordításhoz` : `${FIELD_LABELS[reveal.field]} mező - koppints a továbblépéshez`}
              className="absolute z-20 rounded-2xl overflow-hidden flex flex-col text-left cursor-pointer"
              style={{ background: '#FBF7EE', boxShadow: '0 12px 30px rgba(0,0,0,.45)', border: `3px solid ${revealSt.color}` }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              initial={{ left: target.x, top: target.y, width: TILE, height: TILE, opacity: 0.4 }}
              animate={{ left: (BASE_W - cardW) / 2, top: cardTop, width: cardW, height: cardH, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.25 }}
            >
              <div className="h-10 flex items-center justify-between px-3 font-extrabold text-sm uppercase tracking-wide shrink-0"
                style={{ background: revealSt.color, color: revealSt.ink }}>
                <span>{FIELD_LABELS[reveal.field]}</span><span>{revealSt.glyph}</span>
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center" style={{ color: '#1C1A16' }}>
                <p className="text-base font-extrabold leading-tight">
                  {reveal.hasCard ? `${FIELD_LABELS[reveal.field]} kártyát húztál` : `${FIELD_LABELS[reveal.field]} mezőre léptél`}
                </p>
                <p className="text-[13px] leading-snug mt-1" style={{ color: '#4A3F2C' }}>{FIELD_EXPLAIN[reveal.field]}</p>
                {onRevealClick && (
                  <p className="text-xs font-bold mt-1.5" style={{ color: '#8A4B0B' }}>
                    {reveal.hasCard ? 'Koppints rá: felfordul ↻' : 'Koppints rá: tovább →'}
                  </p>
                )}
              </div>
            </motion.button>
          )}
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

/** Kockadobás gomb: a kocka pörög, gurul, közben váltakoznak a lapjai */
export function DiceButton({ onRoll, disabled }: { onRoll: () => number | undefined; disabled?: boolean }) {
  const [face, setFace] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const roll = () => {
    if (rolling || disabled) return;
    setRolling(true);
    play('roll');
    let n = 0;
    const id = setInterval(() => {
      setFace(1 + Math.floor(Math.random() * 6)); // csak animáció; az érvényes dobás a rollBoard()-ból jön
      if (++n >= 12) {
        clearInterval(id);
        const v = onRoll();
        play('land');
        setFace(v ?? null);
        setRolling(false);
      }
    }, 75);
  };
  return (
    <button onClick={roll} disabled={disabled || rolling}
      className={`w-full h-16 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-4 disabled:opacity-90 ${rolling ? '' : 'pulse-cta'}`}
      style={{ background: '#F2A33A', color: '#0E1525' }}>
      {rolling ? (
        <motion.span className="inline-flex"
          animate={{ rotate: [0, 120, 260, 400, 560, 720], y: [0, -10, 0, -6, 0, 0], scale: [1, 1.15, 1, 1.1, 1, 1] }}
          transition={{ duration: 0.9, ease: 'easeOut' }}>
          <DieFace value={face} size={44} label={false} />
        </motion.span>
      ) : (
        <CyclingDieIcon size={28} />
      )}
      {rolling ? 'Gurul…' : 'Dobok'}
    </button>
  );
}
