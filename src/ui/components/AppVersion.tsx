'use client';

import { useEffect, useState } from 'react';

export const APP_VERSION = `v${process.env.NEXT_PUBLIC_BUILD_DATE ?? ''} · ${process.env.NEXT_PUBLIC_BUILD_ID ?? 'helyi'}`;

/** Kis verziófelirat: így látszik, melyik változat fut (böngészőben és az APK-ban is) */
export function VersionTag({ className = '' }: { className?: string }) {
  return <span className={`text-xs text-[var(--color-text-muted)] font-mono ${className}`}>{APP_VERSION}</span>;
}

/**
 * Frissítési sáv: ha a háttérben új service worker vette át az irányítást,
 * a már megnyitott oldal még a régi kódot futtatja - egy kattintással újratölthető.
 * A mentett játék a localStorage-ban marad, a frissítés után folytatható.
 */
export function UpdateBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const sw = navigator.serviceWorker;
    const hadController = !!sw.controller;
    const onChange = () => { if (hadController) setShow(true); };
    const check = () => { sw.getRegistration().then((r) => r?.update()).catch(() => {}); };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    sw.addEventListener('controllerchange', onChange);
    document.addEventListener('visibilitychange', onVisible);
    check();
    return () => {
      sw.removeEventListener('controllerchange', onChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  if (!show) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 safe-bottom">
      <div className="mx-auto max-w-md flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl"
        style={{ background: '#F2A33A', color: '#0E1525' }}>
        <span className="flex-1 text-base font-semibold">Új verzió érhető el</span>
        <button onClick={() => window.location.reload()} className="h-11 px-4 rounded-xl text-base font-extrabold"
          style={{ background: '#0E1525', color: '#F2A33A' }}>
          Frissítés
        </button>
      </div>
    </div>
  );
}
