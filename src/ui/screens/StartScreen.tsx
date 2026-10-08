'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { useFreemiumStore } from '@/store/freemium-store';
import { PRESETS_BY_DIFFICULTY, LIFE_SITUATION_PRESETS } from '@/data/character-presets';
import { fetchPreGameContext } from '@/data-sources';
import { formatHUF } from '@/engine/financial-calculator';
import { useSettingsStore } from '@/store/settings-store';
import { SettingsButton } from '@/ui/components/SettingsPanel';
import { VersionTag } from '@/ui/components/AppVersion';
import { LiveDataButton } from '@/ui/components/LiveDataPanel';
import { useTableStore } from '@/store/table-store';
import { loadPlayerName, savePlayerName } from '@/store/player-name';
import { TEST_MODE_MAX_BALANCE } from '@/types/game';
import type { CustomProfile, LifeSituationId, TimeScale } from '@/types/game';
import { presetAsCustom } from '@/engine/custom-profile';
import { CustomProfileForm, CustomSummary } from '@/ui/components/CustomProfileForm';

type SetupStep = 'name' | 'situation' | 'timeScale' | 'ready';

export function StartScreen() {
  const [step, setStep] = useState<SetupStep>('name');
  const [playerName, setPlayerNameState] = useState('');
  // A mentett név a kliensen töltődik (statikus export: nincs hidratálási eltérés)
  useEffect(() => { setPlayerNameState((n) => n || loadPlayerName()); }, []);
  const setPlayerName = (n: string) => { setPlayerNameState(n); savePlayerName(n); };
  const [selectedSituation, setSelectedSituation] = useState<LifeSituationId | null>(null);
  const [selectedTimeScale, setSelectedTimeScale] = useState<TimeScale>('sprint');
  const [customBalance, setCustomBalance] = useState<number | null>(null);
  const [custom, setCustom] = useState<CustomProfile | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const startNewGame = useGameStore((s) => s.startNewGame);
  const isFeatureAvailable = useFreemiumStore((s) => s.isFeatureAvailable);
  const allowCustomBalance = useSettingsStore((s) => s.customStartBalance);
  const testMode = useSettingsStore((s) => s.testMode);
  const allowCustomProfile = useSettingsStore((s) => !!s.customProfile);

  const handleStart = async () => {
    if (!selectedSituation || !playerName.trim()) return;

    setIsLoading(true);

    try {
      // Élő gazdasági adatok lekérdezése (30 sec timeout, automatikus fallback mock-ra)
      const preGameContext = await fetchPreGameContext(true);
      const hasLiveData = (preGameContext.fateEventPool?.length ?? 0) > 0;

      // Aktuális dátum meghatározása (pl. "2026-03")
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      startNewGame(
        {
          timeScale: selectedTimeScale,
          mode: 'solo',
          playerCount: 1,
          useLiveData: hasLiveData,
          startDate,
          rules: useSettingsStore.getState().rules(),
          customProfile: allowCustomProfile && custom ? custom : undefined,
        },
        selectedSituation,
        playerName.trim(),
        preGameContext,
        customBalance ?? undefined
      );
    } catch {
      // Ha minden csődöt mond, mock adatokkal indulunk
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      startNewGame(
        {
          timeScale: selectedTimeScale,
          mode: 'solo',
          playerCount: 1,
          useLiveData: false,
          startDate,
          rules: useSettingsStore.getState().rules(),
          customProfile: allowCustomProfile && custom ? custom : undefined,
        },
        selectedSituation,
        playerName.trim(),
        undefined,
        customBalance ?? undefined
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-12 pb-8"
      >
        <h1 className="font-display text-4xl font-bold text-brand-400 mb-2">
          💰 Pénzügyi Sorsfordító
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm">
          Valós adatok. Valós döntések. Valós tanulságok.
        </p>
        <LiveDataButton className="mt-3 text-sm underline text-brand-300" />
        <div className="mt-4">
          <button onClick={() => useTableStore.getState().openEntry()}
            className="h-12 px-5 rounded-2xl text-base font-extrabold" style={{ background: '#F2A33A', color: '#0E1525' }}>
            Asztali játék társasággal
          </button>
        </div>
      </motion.div>

      <div className="absolute right-4 top-4 safe-top"><SettingsButton /></div>

      <AnimatePresence mode="wait">
        {/* 1. lepes: Nev megadasa */}
        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="font-display text-xl font-semibold mb-6">
              Hogy hívnak? 👋
            </h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="A neved..."
              maxLength={20}
              className="w-full bg-[var(--color-bg-card)] border border-white/10 rounded-xl
                         px-4 py-3 text-lg text-white placeholder:text-white/30
                         focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400
                         transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) setStep('situation');
              }}
            />
            <p className="text-[var(--color-text-muted)] text-xs mt-2">
              Ezt a nevet fogja használni a játék a szituációkban.
            </p>

            {/* Játék leírás */}
            <div className="mt-8 space-y-3">
              <div className="bg-[var(--color-bg-card)] border border-white/5 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Pénzügyi tudatosságot fejlesztő szimulációs játék, amelyben
                  három különböző korosztály és élethelyzet közül választhatsz.
                </p>
                <p className="text-sm text-slate-400 leading-relaxed mt-2">
                  Egy éven keresztül navigálsz a magyar gazdaság valós
                  viszontagságai között: döntéseket hozol, tanulsz, befektetsz
                  — és közben valódi pénzügyi ismeretekre teszel szert.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[var(--color-bg-card)] border border-white/5 rounded-lg py-2.5 px-2">
                  <span className="text-lg">🎭</span>
                  <p className="text-[10px] text-slate-400 mt-1">3 élethelyzet</p>
                </div>
                <div className="bg-[var(--color-bg-card)] border border-white/5 rounded-lg py-2.5 px-2">
                  <span className="text-lg">📊</span>
                  <p className="text-[10px] text-slate-400 mt-1">Valós adatok</p>
                </div>
                <div className="bg-[var(--color-bg-card)] border border-white/5 rounded-lg py-2.5 px-2">
                  <span className="text-lg">📚</span>
                  <p className="text-[10px] text-slate-400 mt-1">Tanulj & hasznosítsd</p>
                </div>
              </div>
            </div>

            <div className="flex-1" />
            <button
              onClick={() => setStep('situation')}
              disabled={!playerName.trim()}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-white/10
                         disabled:text-white/30 text-white font-semibold py-3.5 rounded-xl
                         transition-colors mt-8"
            >
              Tovább →
            </button>
          </motion.div>
        )}

        {/* 2. lepes: Elethelyzet valasztas */}
        {step === 'situation' && (
          <motion.div
            key="situation"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="font-display text-xl font-semibold mb-2">
              Üdv, {playerName}! 🎯
            </h2>
            <p className="text-[var(--color-text-muted)] text-sm mb-6">
              Válaszd ki az indulóhelyzetedet:
            </p>

            <div className="space-y-3">
              {PRESETS_BY_DIFFICULTY.map((preset) => {
                const isAvailable =
                  preset.tier === 'free' ||
                  isFeatureAvailable(`char-${preset.id}`);
                const isSelected = selectedSituation === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => { if (isAvailable) { setSelectedSituation(preset.id as LifeSituationId); setCustomBalance(null); setCustom(null); } }}
                    disabled={!isAvailable}
                    className={`
                      w-full text-left p-4 rounded-xl border transition-all
                      ${isSelected
                        ? 'border-brand-400 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                        : isAvailable
                          ? 'border-white/10 bg-[var(--color-bg-card)] hover:border-white/20'
                          : 'border-white/5 bg-[var(--color-bg-card)] opacity-50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{preset.avatar}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{preset.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            ({preset.age} év)
                          </span>
                          {!isAvailable && (
                            <span className="text-xs bg-card-epilogue/20 text-card-epilogue px-2 py-0.5 rounded-full">
                              ⭐ Prémium
                            </span>
                          )}
                          {preset.difficulty === 1 && (
                            <span className="text-xs bg-card-investment/20 text-card-investment px-2 py-0.5 rounded-full">
                              Könnyű
                            </span>
                          )}
                          {preset.difficulty === 2 && (
                            <span className="text-xs bg-card-knowledge/20 text-card-knowledge px-2 py-0.5 rounded-full">
                              Közepes
                            </span>
                          )}
                          {preset.difficulty === 3 && (
                            <span className="text-xs bg-card-fate/20 text-card-fate px-2 py-0.5 rounded-full">
                              Nehéz
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                          {preset.tagline}
                        </p>
                        <div className="flex gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
                          <span>💰 {preset.startingFinancials.balance.toLocaleString('hu-HU')} Ft</span>
                          <span>📊 {preset.startingFinancials.salary.toLocaleString('hu-HU')} Ft/hó</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Kezdő egyenleg: alapból csak kijelzés; egyéni állítás csak játékmesteri engedéllyel */}
            {selectedSituation && allowCustomProfile && (
              <div className="mt-4 bg-[var(--color-bg-card)] border border-amber-400/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold">Saját helyzetem</span>
                  {custom && <button onClick={() => { setCustom(null); setCustomOpen(false); }} className="text-sm text-brand-400 underline">A karakter alapértékei</button>}
                </div>
                {custom && !customOpen && (
                  <>
                    <CustomSummary c={custom} />
                    <button onClick={() => setCustomOpen(true)} className="text-sm text-brand-400 underline">Módosítás</button>
                  </>
                )}
                {!custom && !customOpen && (
                  <button onClick={() => setCustomOpen(true)} className="w-full h-11 rounded-xl text-base font-semibold border border-white/15 bg-white/5">
                    Megadom a saját életkorom, tőkém, bevételem és kiadásaim
                  </button>
                )}
                {customOpen && (
                  <CustomProfileForm initial={custom ?? presetAsCustom(selectedSituation)} submitLabel="Ezzel indulok"
                    onSubmit={(c) => { setCustom(c); setCustomOpen(false); }} />
                )}
              </div>
            )}

            {selectedSituation && !custom && (() => {
              const p = LIFE_SITUATION_PRESETS[selectedSituation];
              const defaultBal = p.startingFinancials.balance;
              const editable = allowCustomBalance || testMode;
              const maxBal = testMode ? TEST_MODE_MAX_BALANCE : Math.max(defaultBal, p.maxStartBalance ?? defaultBal);
              const current = Math.min(customBalance ?? defaultBal, maxBal);
              return (
                <div className="mt-4 bg-[var(--color-bg-card)] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">Kezdő egyenleg</span>
                    <span className={`font-mono text-base font-semibold ${current >= 0 ? 'text-money-positive' : 'text-money-negative'}`}>
                      {formatHUF(editable ? current : defaultBal)}
                    </span>
                  </div>
                  {editable && (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={maxBal}
                        step={10_000}
                        value={current}
                        aria-label="Kezdő egyenleg"
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomBalance(val === defaultBal ? null : val);
                        }}
                        className="w-full accent-brand-400 mt-3"
                      />
                      {testMode && (
                        <input type="number" min={0} max={maxBal} step={1000} value={current} aria-label="Pontos kezdő egyenleg"
                          onChange={(e) => setCustomBalance(Math.min(maxBal, Math.max(0, Number(e.target.value) || 0)))}
                          className="mt-2 w-full bg-[var(--color-bg)] border border-white/10 rounded-lg px-3 py-2 font-mono text-sm" />
                      )}
                      <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                        <span>0 Ft</span>
                        <button onClick={() => setCustomBalance(null)} className="text-brand-400 hover:text-brand-300">
                          Alap: {formatHUF(defaultBal)}
                        </button>
                        <span>{formatHUF(maxBal)}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            <div className="flex-1" />
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep('name')}
                className="px-6 py-3.5 rounded-xl border border-white/10 text-[var(--color-text-muted)]
                           hover:bg-white/5 transition-colors"
              >
                ← Vissza
              </button>
              <button
                onClick={() => setStep('timeScale')}
                disabled={!selectedSituation}
                className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:bg-white/10
                           disabled:text-white/30 text-white font-semibold py-3.5 rounded-xl
                           transition-colors"
              >
                Tovább →
              </button>
            </div>
          </motion.div>
        )}

        {/* 3. lepes: Idotav valasztas */}
        {step === 'timeScale' && (
          <motion.div
            key="timeScale"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="font-display text-xl font-semibold mb-2">
              Mennyi időd van? ⏱️
            </h2>
            <p className="text-[var(--color-text-muted)] text-sm mb-6">
              Válaszd ki a játék hosszát:
            </p>

            <div className="space-y-3">
              {([
                {
                  id: 'sprint' as TimeScale,
                  emoji: '🏃',
                  name: 'Sprint – 1 év',
                  desc: '12 kör, havi döntések. Gyors, taktikai.',
                  time: '~20 perc',
                  available: true,
                },
                {
                  id: 'marathon' as TimeScale,
                  emoji: '🏃‍♂️',
                  name: 'Maraton – 5 év',
                  desc: '20 kör, negyedéves. Stratégiai.',
                  time: '~40 perc',
                  available: isFeatureAvailable('mode-marathon'),
                },
                {
                  id: 'ultra' as TimeScale,
                  emoji: '🏔️',
                  name: 'Ultra – 10 év',
                  desc: '20 kör, féléves döntések. Nagystratégia.',
                  time: '~50 perc',
                  available: isFeatureAvailable('mode-ultra'),
                },
              ]).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => mode.available && setSelectedTimeScale(mode.id)}
                  disabled={!mode.available}
                  className={`
                    w-full text-left p-4 rounded-xl border transition-all
                    ${selectedTimeScale === mode.id
                      ? 'border-brand-400 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                      : mode.available
                        ? 'border-white/10 bg-[var(--color-bg-card)] hover:border-white/20'
                        : 'border-white/5 bg-[var(--color-bg-card)] opacity-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mode.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{mode.name}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{mode.time}</span>
                        {!mode.available && (
                          <span className="text-xs bg-card-epilogue/20 text-card-epilogue px-2 py-0.5 rounded-full">
                            ⭐ Prémium
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{mode.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex-1" />
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep('situation')}
                className="px-6 py-3.5 rounded-xl border border-white/10 text-[var(--color-text-muted)]
                           hover:bg-white/5 transition-colors"
              >
                ← Vissza
              </button>
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="flex-1 bg-card-investment hover:bg-card-investment/80
                           disabled:bg-card-investment/50 disabled:cursor-wait
                           text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                {isLoading ? '📡 Gazdasági adatok betöltése...' : '🎮 Játék indítása!'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
