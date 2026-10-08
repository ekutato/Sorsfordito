// Saját helyzet: a játékos maga adja meg az életkorát, induló tőkéjét, havi bevételét és kiadásait.
// A bemenet korlátozva (a host sem bízik vakon a kliens számaiban); a karakter története adja a döntéseket.
import type { CustomProfile } from '@/types/game';
import { CHARACTER_PRESETS } from '@/data/character-presets';
import type { CharacterPresetId } from '@/types/game';

export const CUSTOM_LIMITS: Record<keyof CustomProfile, [number, number]> = {
  age: [16, 70],
  balance: [0, 20_000_000],
  salary: [0, 5_000_000],
  housing: [0, 2_000_000],
  utilities: [0, 500_000],
  food: [0, 500_000],
  transport: [0, 500_000],
  other: [0, 1_000_000],
};

export function sanitizeCustomProfile(raw: unknown): CustomProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const out = {} as CustomProfile;
  for (const k of Object.keys(CUSTOM_LIMITS) as Array<keyof CustomProfile>) {
    const v = o[k];
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    const [lo, hi] = CUSTOM_LIMITS[k];
    out[k] = Math.min(hi, Math.max(lo, Math.round(v)));
  }
  return out;
}

/** A karakter alapértékei a saját helyzet űrlapjához */
export function presetAsCustom(id: CharacterPresetId): CustomProfile {
  const p = CHARACTER_PRESETS[id];
  const f = p.startingFinancials;
  return { age: p.age, balance: f.balance, salary: f.salary, housing: f.housing, utilities: f.utilities, food: f.food, transport: f.transport, other: f.other };
}

export const CUSTOM_LABELS: Record<keyof CustomProfile, string> = {
  age: 'Életkor (év)', balance: 'Induló tőke (Ft)', salary: 'Havi nettó bevétel (Ft)', housing: 'Lakhatás (Ft/hó)',
  utilities: 'Rezsi (Ft/hó)', food: 'Élelmiszer (Ft/hó)', transport: 'Közlekedés (Ft/hó)', other: 'Egyéb kiadás (Ft/hó)',
};
