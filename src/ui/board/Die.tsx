'use client';

import { motion } from 'framer-motion';

// A pöttyök helye a 3×3-as rácson (0..8), a valódi dobókocka mintájára
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Dobókocka-lap pöttyökkel (SVG) */
export function DieFace({ value, size = 48, label = true }: { value: number | null; size?: number; label?: boolean }) {
  const pips = value ? PIPS[value] ?? [] : [];
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" role={label ? 'img' : undefined}
      aria-label={label ? (value ? `Dobókocka: ${value}` : 'Dobókocka') : undefined} aria-hidden={label ? undefined : true}>
      <rect x="2" y="2" width="56" height="56" rx="12" fill="#FBF7EE" stroke="#C9B78F" strokeWidth="2" />
      <rect x="5" y="5" width="50" height="50" rx="10" fill="none" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth="1.5" />
      {value === null && <text x="30" y="40" textAnchor="middle" fontSize="28" fontWeight="800" fill="#6B5D43">?</text>}
      {pips.map((p) => (
        <circle key={p} cx={15 + (p % 3) * 15} cy={15 + Math.floor(p / 3) * 15} r="5.2" fill={value === 1 ? '#C93C30' : '#1C1A16'} />
      ))}
    </svg>
  );
}

/** A dobás eredménye: a kocka "begurul" és megáll a dobott értéken */
export function LandingDie({ value, size = 56 }: { value: number; size?: number }) {
  return (
    <motion.span className="inline-flex" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.4))' }}
      initial={{ rotate: -280, scale: 0.3, x: -40, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 13 }}>
      <DieFace value={value} size={size} />
    </motion.span>
  );
}

/** Kis kockaikon a "Dobok" gombra (nyugalmi állapot): sötét keret, két pötty */
export function DieIcon({ size = 26, color = '#0E1525' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke={color} strokeWidth="2.4" />
      <circle cx="8.5" cy="8.5" r="1.9" fill={color} />
      <circle cx="15.5" cy="15.5" r="1.9" fill={color} />
    </svg>
  );
}
