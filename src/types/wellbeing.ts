// ============================================================================
// PENZUGYI SORSFORDITO - Jólléti index
// Három jelölő -5..+5 skálán. A belső kulcsok semlegesek; a megjelenített
// feliratok a szabálycsomagból jönnek (Sorsfordító: életerő, egészség,
// egyensúly; Milion-paraméterezés esetén azok fogalmai).
// ============================================================================

export type WellbeingKey = 'eletero' | 'egeszseg' | 'egyensuly';

export const WELLBEING_KEYS: readonly WellbeingKey[] = ['eletero', 'egeszseg', 'egyensuly'];

export type Wellbeing = Record<WellbeingKey, number>;

export const WELLBEING_MIN = -5;
export const WELLBEING_MAX = 5;

/** Hatás-célpont a döntésekben és sorskártyákon, pl. 'wellbeing.egyensuly' */
export type WellbeingTarget = `wellbeing.${WellbeingKey}`;

export function isWellbeingTarget(target: string): target is WellbeingTarget {
  return target.startsWith('wellbeing.') && WELLBEING_KEYS.includes(target.slice(10) as WellbeingKey);
}

export function wellbeingKeyOf(target: WellbeingTarget): WellbeingKey {
  return target.slice(10) as WellbeingKey;
}

export function neutralWellbeing(): Wellbeing {
  return { eletero: 0, egeszseg: 0, egyensuly: 0 };
}

export function clampWellbeing(value: number): number {
  return Math.max(WELLBEING_MIN, Math.min(WELLBEING_MAX, Math.round(value)));
}

export function applyWellbeingDelta(w: Wellbeing | undefined, key: WellbeingKey, delta: number): Wellbeing {
  const base = w ?? neutralWellbeing();
  return { ...base, [key]: clampWellbeing(base[key] + delta) };
}

/** Jólléti index 0-100: a három jelölő átlaga a -5..+5 skáláról átskálázva */
export function wellbeingIndex(w: Wellbeing | undefined): number {
  const b = w ?? neutralWellbeing();
  const avg = (b.eletero + b.egeszseg + b.egyensuly) / 3;
  return Math.round(((avg - WELLBEING_MIN) / (WELLBEING_MAX - WELLBEING_MIN)) * 100);
}

/** Kiegyensúlyozott-e: egyik jelölő sem negatív (az arany szint feltétele) */
export function isBalanced(w: Wellbeing | undefined): boolean {
  const b = w ?? neutralWellbeing();
  return WELLBEING_KEYS.every((k) => b[k] >= 0);
}
