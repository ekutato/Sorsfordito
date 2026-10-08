'use client';

// Egységes pénzmegjelenítés: előjel és szín a hatás iránya szerint (lásd engine/money-sign.ts)
import { effectDirection, signedEffect, DIRECTION_CLASS } from '@/engine/money-sign';

/** Hatás (egyenleg, bér, kiadás, jóllét): "+12 000 Ft", "−5 000 Ft/hó" - zöld, ha javít, piros, ha ront */
export function EffectAmount({ target, amount, durationMonths, className = '' }: { target: string; amount: number; durationMonths?: number; className?: string }) {
  return <span className={`font-mono ${DIRECTION_CLASS[effectDirection(target, amount)]} ${className}`}>{signedEffect(target, amount, { durationMonths })}</span>;
}

/** Egyenlegváltozás: + zöld, − piros, 0 szürke */
export function MoneyDelta({ amount, className = '' }: { amount: number; className?: string }) {
  return <EffectAmount target="balance" amount={Math.round(amount)} className={className} />;
}
