// ============================================================================
// PENZUGYI SORSFORDITO - Szabálycsomagok
// A feliratok és a szabályok csomagból jönnek, így egy jövőbeli együttműködés
// (pl. Milion-szemléletű ág) kódmódosítás nélkül paraméterezhető.
// ============================================================================

import type { WellbeingKey } from '@/types/wellbeing';

export type RulesetId = 'sorsfordito-alap' | 'milion-szemlelet';

export interface Ruleset {
  id: RulesetId;
  name: string;
  /** Élesíthető-e a nyilvános oldalon */
  enabledInProduction: boolean;
  labels: {
    wellbeing: Record<WellbeingKey, string>;
    wellbeingIndex: string;
    financialFreedom: string;
    safetyCircle: string;
  };
  /** Biztonsági kör: készpénz >= havi kiadás × ennyi */
  safetyCircleMonths: number;
}

export const RULESETS: Record<RulesetId, Ruleset> = {
  'sorsfordito-alap': {
    id: 'sorsfordito-alap',
    name: 'Sorsfordító',
    enabledInProduction: true,
    labels: {
      wellbeing: { eletero: 'Életerő', egeszseg: 'Egészség', egyensuly: 'Egyensúly' },
      wellbeingIndex: 'Jólléti index',
      financialFreedom: 'Pénzügyi szabadság',
      safetyCircle: 'Biztonsági kör',
    },
    safetyCircleMonths: 12,
  },
  // Kikapcsolt, nem élesített ág - csak megállapodás és SZTNH-ellenőrzés után aktiválható.
  // A jelölők sorrendje a felhasználó által megadott megfeleltetést követi
  // (harmónia → életerő, vitalitás → egészség, közösség → egyensúly).
  'milion-szemlelet': {
    id: 'milion-szemlelet',
    name: 'Milion-szemlélet (előkészítve)',
    enabledInProduction: false,
    labels: {
      wellbeing: { eletero: 'Harmónia', egeszseg: 'Vitalitás', egyensuly: 'Közösség' },
      wellbeingIndex: 'Jólléti index',
      financialFreedom: 'RFA',
      safetyCircle: 'Biztonság köre',
    },
    safetyCircleMonths: 12,
  },
};

export const DEFAULT_RULESET_ID: RulesetId = 'sorsfordito-alap';

/** Aktív szabálycsomag: élesben csak engedélyezett csomag választható */
export function resolveRuleset(requested?: string | null, isProduction = process.env.NODE_ENV === 'production'): Ruleset {
  const r = requested && requested in RULESETS ? RULESETS[requested as RulesetId] : RULESETS[DEFAULT_RULESET_ID];
  if (isProduction && !r.enabledInProduction) return RULESETS[DEFAULT_RULESET_ID];
  return r;
}
