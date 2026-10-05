'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { formatHUF } from '@/engine/financial-calculator';
import { getDecisionsFor, getDecisionForRound } from '@/data/decisions';
import { GlossaryText } from '@/ui/components/GlossaryTerm';
import type { DecisionOption, LifeSituationId, TimeScale } from '@/types/game';

export function DecisionView() {
  const game = useGameStore((s) => s.game);
  const setPhase = useGameStore((s) => s.setPhase);
  const modifyBalance = useGameStore((s) => s.modifyBalance);
  const modifyExpenses = useGameStore((s) => s.modifyExpenses);
  const modifyIncome = useGameStore((s) => s.modifyIncome);
  const logEvent = useGameStore((s) => s.logEvent);
  const addKnowledge = useGameStore((s) => s.addKnowledge);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showDidYouKnow, setShowDidYouKnow] = useState(false);

  if (!game) return null;

  const player = game.players[game.activePlayerIndex];

  // Az élethelyzethez tartozó döntésfát kérdezzük le
  const lifeSituation = player.lifeSituation as LifeSituationId;
  const decisions = getDecisionsFor(lifeSituation, game.config.timeScale);

  // Már meghozott döntések ID-i (ne ismétlődjenek!)
  // Elsődleges: details.decisionCardId alapján (új logolás)
  // Fallback: ha régi eseménynél nincs details, a leírásból próbáljuk kikövetkeztetni
  const completedDecisionIds: string[] = [];
  for (const e of game.eventLog ?? []) {
    if (e.type !== 'decision') continue;
    if (e.details?.decisionCardId) {
      completedDecisionIds.push(e.details.decisionCardId as string);
    } else if (e.description) {
      // Régi formátum: "Döntéscím: Választott opció" — a címből keressük meg a kártya ID-t
      const title = e.description.split(':')[0]?.trim();
      const match = decisions.find((d) => d.title === title);
      if (match) completedDecisionIds.push(match.id);
    }
  }

  const decision = getDecisionForRound(decisions, game.currentRound, completedDecisionIds);

  if (!decision) {
    // Ha nincs dontes ehhez a korhoz, tovabblep
    return (
      <div className="game-card card-type-decision">
        <h3 className="font-display text-lg font-semibold mb-2">
          🤔 Nyugodt hónap
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Ebben a hónapban nincs nagy döntés. Mennek tovább a dolgok.
        </p>
        <button
          onClick={() => setPhase('round_invest')}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white
                     font-semibold py-3 rounded-xl transition-colors"
        >
          Tovább →
        </button>
      </div>
    );
  }

  // Dinamikus változó feloldás: path → formázott érték
  const resolvedVars: Record<string, string> = {};
  if (decision.dynamicVariables) {
    for (const [key, path] of Object.entries(decision.dynamicVariables)) {
      let raw: any;
      if (path.startsWith('player.')) {
        // player.balance → financialSheet.balance
        // player.computed.netWorth → financialSheet.computed.netWorth
        // player.income.salary → financialSheet.income.salary
        const field = path.replace('player.', '');
        raw = getNestedValue(player.financialSheet, field);
      } else if (path.startsWith('economicData.')) {
        // Valós gazdasági adatok PreGameContext-ből, fallback mock értékekkel
        const pgc = game.preGameContext?.currentData;
        const econLookup: Record<string, number> = {
          'economicData.interestRates.dh1': 0,
          'economicData.interestRates.pmapYield': pgc?.pmapYield ?? 7.5,
          'economicData.inflation.latest': pgc?.inflation ?? 4.2,
          'economicData.realEstate.budapestRentAvg': pgc?.avgRentBudapest ?? 200_000,
        };
        raw = econLookup[path];
      }
      resolvedVars[key] = raw != null
        ? typeof raw === 'number' ? raw.toLocaleString('hu-HU') : String(raw)
        : '?';
    }
  }

  // Gazdasági értékek: valós PreGameContext adatokból, vagy fallback mock
  const cd = game.preGameContext?.currentData;
  const economicDefaults: Record<string, number> = {
    inflation: cd?.inflation ?? 4.2,
    pmap_yield: cd?.pmapYield ?? 7.5,
    dh1_rate: 0,
    rent_bp: cd?.avgRentBudapest ?? 200_000,
    rent_rural: cd?.avgRentRural ?? 140_000,
    bux_index: cd?.buxIndex ?? 72_500,
    avg_wage: cd?.avgNetWage ?? 380_000,
    base_rate: cd?.baseRate ?? 6.5,
  };

  /** Szövegben lévő {{változók}} cseréje */
  const replaceVars = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      // 1. Regisztrált dynamicVariables-ből
      if (resolvedVars[varName] != null) return resolvedVars[varName];
      // 2. Gazdasági mock-értékek
      if (economicDefaults[varName] != null) return economicDefaults[varName].toLocaleString('hu-HU');
      // 3. FinancialSheet-ből (balance, income.salary, stb.)
      const sheet = player.financialSheet;
      const guess = getNestedValue(sheet, varName) ?? getNestedValue(sheet.computed, varName);
      if (guess != null && typeof guess === 'number') return guess.toLocaleString('hu-HU');
      return match; // ismeretlen → meghagyjuk
    });
  };

  const situationText = replaceVars(decision.situation);

  const handleSelect = (option: DecisionOption) => {
    setSelectedOptionId(option.id);

    // Penzugyi hatasok alkalmazasa
    for (const effect of option.financialEffects) {
      const pid = player.playerId;
      switch (effect.target) {
        case 'balance':
          modifyBalance(pid, effect.amount, effect.description);
          break;
        case 'salary':
          modifyIncome(pid, 'salary', effect.amount);
          break;
        case 'housing':
        case 'utilities':
        case 'food':
        case 'transport':
        case 'loanPayments':
        case 'other':
          modifyExpenses(pid, effect.target, effect.amount);
          break;
      }
    }

    // Tartós hatások (ongoingEffects) alkalmazása
    if (option.ongoingEffects && option.ongoingEffects.length > 0) {
      const pid = player.playerId;
      for (const oe of option.ongoingEffects) {
        if (oe.target === 'salary') {
          modifyIncome(pid, 'salary', oe.monthlyAmount);
        } else if (oe.target === 'debt_reduction') {
          modifyExpenses(pid, 'loanPayments', -oe.monthlyAmount);
        } else if (['housing', 'utilities', 'food', 'transport', 'loanPayments', 'other'].includes(oe.target)) {
          modifyExpenses(pid, oe.target as any, oe.monthlyAmount);
        }

        logEvent({
          type: 'income',
          description: `Tartós hatás: ${oe.description} (${oe.monthlyAmount > 0 ? '+' : ''}${oe.monthlyAmount.toLocaleString('hu-HU')} Ft/hó)`,
          financialImpact: 0,
        });
      }
    }

    // Tudas kartyak feloldasa
    if (option.unlocksKnowledge) {
      for (const kid of option.unlocksKnowledge) {
        addKnowledge(player.playerId, kid);
      }
    }

    // Log — a decisionCardId-t mentjük, hogy ne ismétlődjön
    logEvent({
      type: 'decision',
      description: `${decision.title}: ${option.label}`,
      financialImpact: option.financialEffects
        .filter((e) => e.target === 'balance')
        .reduce((sum, e) => sum + e.amount, 0),
      details: { decisionCardId: decision.id, optionId: option.id },
    });

    // Mutasd a "Tudtad?" panelt
    if (option.didYouKnow) {
      setShowDidYouKnow(true);
    } else {
      // Ha nincs didYouKnow, azonnal tovabb
      setTimeout(() => setPhase('round_invest'), 800);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Szituacio */}
      <div className="game-card card-type-decision">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-card-decision/20 text-card-decision px-2 py-0.5 rounded-full">
            {decision.category}
          </span>
        </div>
        <h3 className="font-display text-lg font-semibold mb-3">
          {decision.title}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
          <GlossaryText text={situationText} />
        </p>

        {/* Valasztasi lehetosegek — a kártyán belül */}
        {!selectedOptionId && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <p className="text-xs text-brand-400 font-semibold mb-1">Válassz:</p>
            {decision.options.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                onClick={() => handleSelect(option)}
                className="decision-button w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg font-bold text-brand-400 mt-0.5">
                    {String.fromCharCode(65 + index)})
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold block mb-1">{option.label}</span>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                      <GlossaryText text={replaceVars(option.description)} />
                    </p>
                    {/* Jelzés: ha a feloldandó tudás már megvan */}
                    {option.unlocksKnowledge && option.unlocksKnowledge.some(
                      (kid) => player.financialSheet.acquiredKnowledge.includes(kid)
                    ) && (
                      <p className="text-[10px] text-card-knowledge mt-1">
                        ✅ Ezt a tudást már megszerezted — választhatsz más opciót is
                      </p>
                    )}
                    {/* Penzugyi hatasok elozetese */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {option.financialEffects.map((effect, i) => {
                        const isIncomeTarget = ['balance', 'salary'].includes(effect.target);
                        const isGood = isIncomeTarget
                          ? effect.amount >= 0
                          : effect.amount <= 0;
                        return (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isGood
                                ? 'bg-money-positive/10 text-money-positive'
                                : 'bg-money-negative/10 text-money-negative'
                            }`}
                          >
                            {effect.amount >= 0 ? '+' : ''}{formatHUF(effect.amount)}
                            {!isIncomeTarget ? '/hó' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Valasztas utani visszajelzes */}
      {selectedOptionId && (() => {
        const chosenOption = decision.options.find((o) => o.id === selectedOptionId);
        if (!chosenOption) return null;
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="game-card border-money-positive/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">✅</span>
              <span className="font-semibold">
                {chosenOption.label}
              </span>
            </div>

            {/* Pénzügyi hatások összefoglaló */}
            {chosenOption.financialEffects.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-white/5 rounded-lg p-2.5 mt-2 space-y-1"
              >
                <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider mb-1">
                  Pénzügyi hatás
                </p>
                {chosenOption.financialEffects.map((effect, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {effect.description || translateEffectTarget(effect.target)}
                    </span>
                    <span className={`font-mono text-xs font-bold ${
                      effect.amount >= 0
                        ? effect.target === 'balance' || effect.target === 'salary'
                          ? 'text-money-positive'
                          : 'text-money-negative'
                        : effect.target === 'balance' || effect.target === 'salary'
                          ? 'text-money-negative'
                          : 'text-money-positive'
                    }`}>
                      {effect.amount >= 0 ? '+' : ''}{formatHUF(effect.amount)}
                      {!['balance'].includes(effect.target) ? '/hó' : ''}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Tudtad? panel */}
            {showDidYouKnow && chosenOption.didYouKnow && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.3 }}
                className="bg-card-knowledge/10 rounded-lg p-3 mt-3"
              >
                <h4 className="text-xs font-semibold text-card-knowledge mb-1">
                  💡 Tudtad?
                </h4>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  <GlossaryText text={chosenOption.didYouKnow} />
                </p>
              </motion.div>
            )}

            <button
              onClick={() => setPhase('round_invest')}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white
                         font-semibold py-3 rounded-xl transition-colors mt-4"
            >
              Tovább →
            </button>
          </motion.div>
        );
      })()}
    </motion.div>
  );
}

// Segédfüggvény: nested object érték kiolvasása ("financialSheet.balance")
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

/** Pénzügyi target mező → magyar felirat (ha nincs description az effectben) */
function translateEffectTarget(target: string): string {
  const labels: Record<string, string> = {
    balance: 'Egyenleg',
    salary: 'Fizetés/hó',
    housing: 'Lakhatás/hó',
    utilities: 'Rezsi/hó',
    food: 'Élelmiszer/hó',
    transport: 'Közlekedés/hó',
    loanPayments: 'Törlesztő/hó',
    other: 'Egyéb kiadás/hó',
  };
  return labels[target] ?? target;
}
