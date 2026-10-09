'use client';

import { TIME_SCALE_CONFIGS } from '@/types/game';
import { elapsedText } from '@/engine/situation';
import { situationOfGame } from '@/engine/situation';
import { useState } from 'react';
import { SUBJECTIVE_WELLBEING } from '@/data/wellbeing-effects';
import { liveVar } from '@/data/live/vars';
import { WellbeingReflection } from './WellbeingReflection';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { formatHUF } from '@/engine/financial-calculator';
import { getDecisionsFor, getDecisionForField, fittingOptions } from '@/data/decisions';
import { BOARD } from '@/data/board';
import { GlossaryText } from '@/ui/components/GlossaryTerm';
import type { DecisionOption, LifeSituationId, TimeScale } from '@/types/game';
import { liveCurrentData, LIVE_DATA } from '@/data/live';
import { applyDecisionOption, affordableOptions, decisionCost, financeNotes, skipDecision } from '@/store/decision-finance';
import { EffectAmount } from '@/ui/components/Money';

const LIVE = liveCurrentData();
// A Diákhitel1 kamata a heti csomagból (Diákhitel Központ)
const LIVE_DATA_DH1 = LIVE_DATA.ertekek['diakhitel.dh1Rate']?.value ?? 0;

export function DecisionView() {
  const game = useGameStore((s) => s.game);
  const setPhase = useGameStore((s) => s.setPhase);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showDidYouKnow, setShowDidYouKnow] = useState(false);
  const [reflected, setReflected] = useState(false);

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

  // A játékos ága és helyzete: korábbi választások, fennálló tartozások
  const decisionCtx = {
    chosen: (game.eventLog ?? []).map((e) => e.details?.optionId as string | undefined).filter((x): x is string => !!x),
    debtTypes: player.financialSheet.debts.map((d) => d.type),
    salary: player.financialSheet.income.salary,
    situation: situationOfGame(game),
  };
  // Körönként egy döntés: ha ebben a körben már döntöttél, az marad a képernyőn (a "Tudtad?" panellel)
  const decidedNow = (game.eventLog ?? []).find((e) => e.type === 'decision' && e.round === game.currentRound && e.details?.decisionCardId);
  const decidedCard = decidedNow ? decisions.find((d) => d.id === decidedNow.details!.decisionCardId) : undefined;
  // Döntés mezőn a következő esedékes döntés előrejöhet
  const onDecisionField = BOARD[game.board?.position ?? 0]?.type === 'decision';
  const found = decidedCard
    ? { decision: decidedCard, broughtForward: !decidedCard.availableAtRounds.includes(game.currentRound) }
    : getDecisionForField(decisions, game.currentRound, completedDecisionIds, player.financialSheet.expenses.housing, onDecisionField, decisionCtx);
  const { decision, broughtForward } = found;
  // Újratöltés után is a meghozott döntés látszik (nem lehet kétszer dönteni)
  const chosenId = selectedOptionId ?? (decidedNow?.details?.optionId as string | undefined) ?? null;

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
          className="pulse-cta w-full bg-brand-600 hover:bg-brand-500 text-white
                     font-semibold py-3 rounded-xl transition-colors"
        >
          Tovább →
        </button>
      </div>
    );
  }

  // Dinamikus változó feloldás: path → formázott érték
  const resolvedVars: Record<string, string> = {
    // A játék kezdete óta eltelt idő (a mód léptéke szerint: Sprintben hónap, Maratonban negyedév)
    elapsed: elapsedText(Math.max(1, (game.currentRound - 1) * (TIME_SCALE_CONFIGS[game.config.timeScale]?.monthsPerRound ?? 1))),
  };
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
          'economicData.interestRates.dh1': LIVE_DATA_DH1,
          'economicData.interestRates.pmapYield': pgc?.pmapYield ?? LIVE.pmapYield,
          'economicData.inflation.latest': pgc?.inflation ?? LIVE.inflation,
          'economicData.realEstate.budapestRentAvg': pgc?.avgRentBudapest ?? LIVE.avgRentBudapest,
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
    inflation: cd?.inflation ?? LIVE.inflation,
    pmap_yield: cd?.pmapYield ?? LIVE.pmapYield,
    dh1_rate: LIVE_DATA_DH1,
    rent_bp: cd?.avgRentBudapest ?? LIVE.avgRentBudapest,
    rent_rural: cd?.avgRentRural ?? LIVE.avgRentRural,
    bux_index: cd?.buxIndex ?? LIVE.buxIndex,
    avg_wage: cd?.avgNetWage ?? LIVE.avgNetWage,
    base_rate: cd?.baseRate ?? LIVE.baseRate,
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
      // 4. Heti élő adatok (közös változólista: src/data/live/vars.ts)
      return liveVar(varName) ?? 'n. a.';
    });
  };

  const situationText = replaceVars(decision.situation);
  // Csak az ágadhoz illő opciók látszanak (pl. kollégium csak tanulónak)
  const shownOptions = fittingOptions(decision, decisionCtx);
  const affordable = affordableOptions(shownOptions, player.financialSheet.balance);

  const handleSelect = (option: DecisionOption) => {
    if (decidedNow || chosenId) return; // körönként egy döntés
    setSelectedOptionId(option.id);
    // Hatások, tartós hatások, befektetés/hitel, tudás és napló - egy helyen (store/decision-finance)
    applyDecisionOption(decision, option);

    // Mutasd a "Tudtad?" panelt; személyes mérlegelésnél a játékos maga lép tovább
    if (option.didYouKnow) {
      setShowDidYouKnow(true);
    } else if (!SUBJECTIVE_WELLBEING[option.id]) {
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
          {broughtForward && <span className="text-xs bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded-full">Döntés mező: előrehozott döntés</span>}
        </div>
        <h3 className="font-display text-lg font-semibold mb-3">
          {replaceVars(decision.title)}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
          <GlossaryText text={situationText} />
        </p>

        {/* Valasztasi lehetosegek — a kártyán belül */}
        {!chosenId && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <p className="text-xs text-brand-400 font-semibold mb-1">Válassz:</p>
            {shownOptions.map((option, index) => {
              const can = affordable.has(option.id);
              const cost = decisionCost(option);
              return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                onClick={() => can && handleSelect(option)}
                disabled={!can}
                aria-disabled={!can}
                className={`decision-button w-full text-left ${can ? '' : 'opacity-50 cursor-not-allowed'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg font-bold text-brand-400 mt-0.5">
                    {String.fromCharCode(65 + index)})
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold block mb-1">{replaceVars(option.label)}</span>
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
                      {option.financialEffects.map((effect, i) => (
                        <EffectAmount key={i} target={effect.target} amount={effect.amount} className="text-xs px-1.5 py-0.5 rounded bg-white/5" />
                      ))}
                      {financeNotes(option).map((n, i) => (
                        <span key={`f${i}`} className={`text-xs px-1.5 py-0.5 rounded ${n.tone === 'bad' ? 'bg-money-negative/10 text-money-negative' : n.tone === 'good' ? 'bg-money-positive/10 text-money-positive' : 'bg-sky-500/10 text-sky-300'}`}>{n.text}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {!can && <p className="mt-2 text-xs font-semibold text-money-negative">Nincs rá fedezeted: {formatHUF(cost)} kellene, az egyenleged {formatHUF(player.financialSheet.balance)}.</p>}
              </motion.button>
              );
            })}
            {affordable.size === 0 && (
              <button onClick={() => { skipDecision(decision); setPhase('round_invest'); }}
                className="pulse-cta w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm font-semibold">
                Most egyik sem fér bele - kihagyom ezt a döntést
              </button>
            )}
          </div>
        )}
      </div>

      {/* Valasztas utani visszajelzes */}
      {chosenId && (() => {
        const chosenOption = decision.options.find((o) => o.id === chosenId);
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
                {replaceVars(chosenOption.label)}
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
                    <EffectAmount target={effect.target} amount={effect.amount} className="text-xs font-bold" />
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
                  <GlossaryText text={replaceVars(chosenOption.didYouKnow)} />
                </p>
              </motion.div>
            )}

            {SUBJECTIVE_WELLBEING[chosenOption.id] && !reflected ? (
              <div className="mt-4">
                <WellbeingReflection reflection={SUBJECTIVE_WELLBEING[chosenOption.id]} onDone={() => setReflected(true)} />
              </div>
            ) : (
              <button
                onClick={() => setPhase('round_invest')}
                className="pulse-cta w-full bg-brand-600 hover:bg-brand-500 text-white
                           font-semibold py-3 rounded-xl transition-colors mt-4"
              >
                Tovább →
              </button>
            )}
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
