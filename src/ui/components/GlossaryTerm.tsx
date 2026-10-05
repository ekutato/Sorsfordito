'use client';

import { useState, Fragment, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FINANCIAL_GLOSSARY,
  findGlossaryEntry,
  type GlossaryEntry,
} from '@/data/financial-glossary';

// ============================================================================
// GlossaryTerm — Egyetlen kattintható fogalom
// ============================================================================

interface GlossaryTermProps {
  /** A pénzügyi fogalom (pl. "TBSZ", "ETF", "PMÁP") */
  term: string;
  /** Opcionális: a megjelenő szöveg (ha más, mint a term) */
  display?: string;
}

export function GlossaryTerm({ term, display }: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const entry = findGlossaryEntry(term);

  if (!entry) {
    // Ismeretlen fogalom → sima szöveg
    return <span>{display ?? term}</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center gap-0.5 border-b border-dashed border-card-knowledge/60
                   text-card-knowledge hover:text-card-knowledge/80 transition-colors cursor-help"
        title={entry.fullName}
      >
        {display ?? term}
        <span className="text-[9px] opacity-70">&#9432;</span>
      </button>

      <AnimatePresence>
        {open && (
          <GlossaryPopup entry={entry} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// GlossaryPopup — Felugró magyarázó kártya
// ============================================================================

function GlossaryPopup({
  entry,
  onClose,
}: {
  entry: GlossaryEntry;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const popup = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 flex items-end sm:items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      {/* Háttér overlay — erős sötét háttér */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Kártya — teljesen opaque háttér */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl p-5
                   shadow-2xl border border-card-knowledge/30"
        style={{ zIndex: 10000, backgroundColor: '#1E293B' }}
      >
        {/* Bezáró gomb */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-white
                     text-lg leading-none w-7 h-7 flex items-center justify-center
                     rounded-full hover:bg-white/10 transition-colors"
        >
          &times;
        </button>

        {/* Fejléc */}
        <div className="mb-3">
          <span className="text-xs bg-card-knowledge/20 text-card-knowledge px-2 py-0.5 rounded-full">
            Fogalomtár
          </span>
          <h4 className="font-display text-lg font-bold mt-2">
            {entry.term}
          </h4>
          <p className="text-xs text-[var(--color-text-muted)]">
            {entry.fullName}
          </p>
        </div>

        {/* Leírás */}
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-3">
          {entry.description}
        </p>

        {/* Előnyök / Hátrányok */}
        <div className="space-y-2 mb-3">
          {entry.pros.length > 0 && (
            <div className="bg-money-positive/5 rounded-lg p-2.5">
              <h5 className="text-xs font-semibold text-money-positive mb-1">
                ✅ Előnyök
              </h5>
              {entry.pros.map((pro, i) => (
                <p key={i} className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  + {pro}
                </p>
              ))}
            </div>
          )}

          {entry.cons.length > 0 && (
            <div className="bg-money-negative/5 rounded-lg p-2.5">
              <h5 className="text-xs font-semibold text-money-negative mb-1">
                ❌ Hátrányok
              </h5>
              {entry.cons.map((con, i) => (
                <p key={i} className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  - {con}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Kockázat + Forrás */}
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          {entry.risk !== '—' && (
            <span>
              Kockázat:{' '}
              <span className={`font-semibold ${
                entry.risk === 'minimális' ? 'text-green-400'
                : entry.risk === 'alacsony' ? 'text-green-300'
                : entry.risk === 'közepes' ? 'text-yellow-400'
                : 'text-red-400'
              }`}>
                {entry.risk}
              </span>
            </span>
          )}
          {entry.sourceName && (
            <span className="text-card-knowledge/70">
              Forrás: {entry.sourceName}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  // Portal: render a document.body-ra, hogy ne legyen overflow/z-index probléma
  if (mounted && typeof document !== 'undefined') {
    return createPortal(popup, document.body);
  }

  return popup;
}

// ============================================================================
// GlossaryText — Szöveg automatikus fogalomkiemeléssel
// ============================================================================

/**
 * Egy szöveget feldolgoz és a benne talált pénzügyi fogalmakat
 * kattintható GlossaryTerm komponensekre cseréli.
 *
 * Használat: <GlossaryText text="A TBSZ adómentes 5 év után." />
 */
export function GlossaryText({ text }: { text: string }) {
  // Építünk egy regex-et az összes ismert fogalomból
  const terms = FINANCIAL_GLOSSARY
    .map((e) => e.term)
    .sort((a, b) => b.length - a.length);

  if (terms.length === 0) return <>{text}</>;

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(pattern);

  // Csak az első előfordulást emeljük ki fogalmanként
  const seen = new Set<string>();

  return (
    <>
      {parts.map((part, i) => {
        const entry = findGlossaryEntry(part);
        if (entry) {
          const key = entry.term.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            return <GlossaryTerm key={i} term={entry.term} display={part} />;
          }
          // Már ki volt emelve → sima szöveg
          return <Fragment key={i}>{part}</Fragment>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
