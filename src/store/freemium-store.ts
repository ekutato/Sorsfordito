// ============================================================================
// PENZUGYI SORSFORDITO - Freemium Store
// Elofizetes kezelese - mi ingyenes, mi premium
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserTier = 'free' | 'premium';

export interface FreemiumFeature {
  id: string;
  name: string;
  description: string;
  tier: UserTier;
  category: 'character' | 'mode' | 'feature' | 'investment' | 'analytics';
}

/**
 * Minden feature definicioja es hogy melyik tier-hez tartozik
 */
export const FREEMIUM_FEATURES: FreemiumFeature[] = [
  // --- Karakterek ---
  { id: 'char-dani', name: 'Dani (24 éves)', description: 'Pályakezdő karakter', tier: 'free', category: 'character' },
  { id: 'char-zsofi', name: 'Zsófi (18 éves)', description: 'Érettségi utáni karakter', tier: 'premium', category: 'character' },
  { id: 'char-petra', name: 'Petra (30 éves)', description: 'Örökség karakter', tier: 'premium', category: 'character' },
  { id: 'char-custom', name: 'Saját karakter', description: 'Saját adatok megadása', tier: 'premium', category: 'character' },

  // --- Játékmódok ---
  { id: 'mode-sprint', name: 'Sprint (1 év)', description: '12 kör, havi döntések', tier: 'free', category: 'mode' },
  { id: 'mode-marathon', name: 'Maraton (5 év)', description: '20 kör, negyedéves léptékek', tier: 'premium', category: 'mode' },
  { id: 'mode-ultra', name: 'Ultra (10 év)', description: '10 kör, éves nagystratégia', tier: 'premium', category: 'mode' },
  { id: 'mode-daily', name: 'Napi Kihívás', description: 'Napi 1 döntés, valós hírből', tier: 'free', category: 'mode' },

  // --- Funkciók ---
  { id: 'feat-live-data', name: 'Élő gazdasági adatok', description: 'Valós MNB/KSH/ÁKK adatok', tier: 'free', category: 'feature' },
  { id: 'feat-news', name: 'Hír-Sorsfordítók', description: 'Valós hírből generált események', tier: 'free', category: 'feature' },
  { id: 'feat-whatif', name: '„Mi lett volna, ha…"', description: 'Alternatív kimenetek összehasonlítása', tier: 'premium', category: 'feature' },
  { id: 'feat-detailed-report', name: 'Részletes Riportkártya', description: 'Radar diagram, trend, személyre szabott tanácsok', tier: 'premium', category: 'feature' },
  { id: 'feat-multiplayer', name: 'Multiplayer', description: 'WiFi/Bluetooth többjátékos mód', tier: 'premium', category: 'feature' },

  // --- Analitika ---
  { id: 'analytics-basic', name: 'Alap Epilógus', description: 'Végállapot kártya + alap összesítés', tier: 'free', category: 'analytics' },
  { id: 'analytics-full', name: 'Pénzügyi IQ + cselekvési terv', description: '0-100 pontos értékelés + 3 konkrét teendő', tier: 'premium', category: 'analytics' },
  { id: 'analytics-history', name: 'Játéktörténet', description: 'Korábbi játékok összehasonlítása', tier: 'premium', category: 'analytics' },
];

interface FreemiumState {
  /** Jelenlegi felhasznaloi szint */
  userTier: UserTier;

  /** Premium vasarlas datuma (ha van) */
  premiumPurchasedAt: string | null;

  /** Premium feloldasa (vasarlas utan) */
  upgradeToPremium: () => void;

  /** Visszaallitas free-re (teszteleshez) */
  resetToFree: () => void;

  /** Ellenorzes: egy feature elerheto-e */
  isFeatureAvailable: (featureId: string) => boolean;

  /** Az osszes elerheto feature ID-k */
  getAvailableFeatureIds: () => string[];

  /** Premium funkciok listaja (upsell-hez) */
  getPremiumFeatures: () => FreemiumFeature[];
}

export const useFreemiumStore = create<FreemiumState>()(
  persist(
    (set, get) => ({
      userTier: 'premium',  // TODO: élesben 'free' — teszteléshez 'premium'
      premiumPurchasedAt: null,

      upgradeToPremium: () =>
        set({
          userTier: 'premium',
          premiumPurchasedAt: new Date().toISOString(),
        }),

      resetToFree: () =>
        set({
          userTier: 'free',
          premiumPurchasedAt: null,
        }),

      isFeatureAvailable: (featureId: string) => {
        const { userTier } = get();
        const feature = FREEMIUM_FEATURES.find((f) => f.id === featureId);
        if (!feature) return false;

        // Free felhasznalo: csak free feature-ok
        if (userTier === 'free') return feature.tier === 'free';

        // Premium felhasznalo: minden
        return true;
      },

      getAvailableFeatureIds: () => {
        const { userTier } = get();
        return FREEMIUM_FEATURES
          .filter((f) => userTier === 'premium' || f.tier === 'free')
          .map((f) => f.id);
      },

      getPremiumFeatures: () =>
        FREEMIUM_FEATURES.filter((f) => f.tier === 'premium'),
    }),
    {
      name: 'penzugyi-sorsfordito-freemium-v2',  // v2: premium default teszteléshez
    }
  )
);
