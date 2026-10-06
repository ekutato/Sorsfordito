'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Megjelenéskor a képernyő ide gördül (pl. a kvíz válasza után a "Tovább" gomb), hogy ne kelljen keresni */
export function ScrollTarget({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // kis késleltetés: a magyarázat kinyílása után számoljuk a helyet
    const t = setTimeout(() => ref.current?.scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' }), 150);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref} className={`scroll-mb-24 ${className ?? ''}`}>{children}</div>;
}
