// Játékmesteri beállítások: a következő játék szabályai. Indításkor a GameConfig.rules-ba
// másolódnak, így a futó játék szabálya menet közben nem változik (többjátékos módban a
// host ugyanezt küldi a szobának). Külön kulcson tárolódik, az "Új játék" nem törli.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_RULES, type GameRules } from '@/types/game';

interface SettingsStore extends GameRules {
  set: (patch: Partial<GameRules>) => void;
  toggleTestMode: () => boolean;
  rules: () => GameRules;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_RULES,
      set: (patch) => set(patch),
      toggleTestMode: () => {
        const next = !get().testMode;
        set({ testMode: next });
        return next;
      },
      rules: () => {
        const { customStartBalance, allowIncomeExpenseEdit, trapTimerSeconds, diceSource, testMode, customProfile } = get();
        return { customStartBalance, allowIncomeExpenseEdit, trapTimerSeconds, diceSource, testMode, customProfile };
      },
    }),
    { name: 'sorsfordito-beallitasok' },
  ),
);

/** A futó játék szabályai (régi mentésnél az alapértékek) */
export function gameRules(config: { rules?: GameRules } | undefined): GameRules {
  return { ...DEFAULT_RULES, ...(config?.rules ?? {}) };
}
