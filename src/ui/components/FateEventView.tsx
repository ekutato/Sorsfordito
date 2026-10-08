'use client';

import { useState, useEffect, useMemo } from 'react';
import { SUBJECTIVE_WELLBEING } from '@/data/wellbeing-effects';
import { fillDeep } from '@/data/live/vars';
import { WellbeingReflection } from './WellbeingReflection';
import { ScrollTarget } from './ScrollTarget';
import { play } from '@/audio/sfx';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { formatHUF } from '@/engine/financial-calculator';
import { RENT_THRESHOLD } from '@/data/decisions';
import type { FateEventEntry } from '@/data/decisions';
import { GlossaryText } from '@/ui/components/GlossaryTerm';
import { KNOWLEDGE_CARDS } from '@/data/knowledge-cards';
import type { PendingStoryline } from '@/types/financial';
import { isWellbeingTarget, wellbeingKeyOf } from '@/types/wellbeing';
import { RULESETS, DEFAULT_RULESET_ID } from '@/rulesets';
import { adjustTopDebt } from '@/store/board-actions';
import { EffectAmount } from '@/ui/components/Money';
import { fateCardForRound } from '@/engine/fate-deck';
import { withWellbeingFate } from '@/data/wellbeing-merge';
import { FATE_MONTHS } from '@/data/fate-themes';
import { BOARD, districtOf } from '@/data/board';

type KnowledgeCheckPhase =
  | 'idle'           // Nincs tudáspróba, normál sorsfordító
  | 'no_knowledge'   // Nincs meg a szükséges tudáskártya
  | 'showing_quiz'   // Kvíz kérdés megjelenítés
  | 'answer_shown'   // Válasz + magyarázat
  | 'success'        // Helyes válasz, jutalom
  | 'failure';       // Helytelen válasz, lemaradás

export function FateEventView() {
  const game = useGameStore((s) => s.game);
  const setPhase = useGameStore((s) => s.setPhase);
  const modifyBalance = useGameStore((s) => s.modifyBalance);
  const modifyIncome = useGameStore((s) => s.modifyIncome);
  const modifyExpenses = useGameStore((s) => s.modifyExpenses);
  const modifyWellbeing = useGameStore((s) => s.modifyWellbeing);
  const logEvent = useGameStore((s) => s.logEvent);
  const addStoryline = useGameStore((s) => s.addStoryline);
  const resolveStorylineAction = useGameStore((s) => s.resolveStoryline);

  const [kcPhase, setKcPhase] = useState<KnowledgeCheckPhase>('idle');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  // Személyes mérlegelésre váró opció (életmódbeli döntés: a játékos dönti el a jólléti hatást)
  const [reflecting, setReflecting] = useState<number | null>(null);

  if (!game) return null;

  const player = game.players[game.activePlayerIndex];

  // A kör sorskártyája a dobásból (lépett negyed, Sorsfordító mező, naptár) - egyszer húzva, mentve
  const setFateDraw = useGameStore((st) => st.setFateDraw);
  const drawnCard = fateCardForRound(game);
  const rawFateEvent = useMemo(
    () => (drawnCard ? fillDeep(withWellbeingFate(drawnCard)) : undefined),
    [drawnCard?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { if (drawnCard && game.fateDraws?.[game.currentRound] !== drawnCard.id) setFateDraw(game.currentRound, drawnCard.id); }, [drawnCard?.id, game.currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  // Feltétel-ellenőrzés: ha az eseménynek van `requires` mezője, ellenőrizzük
  const fateEvent = (() => {
    if (!rawFateEvent?.requires) return rawFateEvent;
    const req = rawFateEvent.requires;
    const sheet = player.financialSheet;
    if (req.hasSalary && sheet.income.salary <= 0) return undefined;
    if (req.hasHighTransport && sheet.expenses.transport < 25_000) return undefined;
    if (req.rentsHome && sheet.expenses.housing < RENT_THRESHOLD) return undefined;
    return rawFateEvent;
  })();

  // Sztorivonal feloldás ellenőrzés
  const pendingStorylines = player.financialSheet.pendingStorylines ?? [];
  const resolvingStoryline = pendingStorylines.find(
    (s) => s.resolveAtRound === game.currentRound && !s.resolved
  );

  // Tudáspróba inicializálás
  const hasKnowledgeCheck = !!fateEvent?.knowledgeCheck;
  const playerKnowledge = player.financialSheet.acquiredKnowledge;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { if (kcPhase === 'success') play('success'); else if (kcPhase === 'failure') play('warning'); }, [kcPhase]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { if (fateEvent || resolvingStoryline) play('card'); }, [fateEvent?.id, resolvingStoryline?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!hasKnowledgeCheck || !fateEvent) {
      setKcPhase('idle');
      setSelectedAnswer(null);
      return;
    }
    const hasRequired = playerKnowledge.includes(fateEvent.knowledgeCheck!.requiredKnowledgeId);
    setKcPhase(hasRequired ? 'showing_quiz' : 'no_knowledge');
    setSelectedAnswer(null);
  }, [fateEvent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Sztorivonal feloldás megjelenítés ---
  if (resolvingStoryline) {
    const resolution = fillDeep(getStorylineResolution(resolvingStoryline));

    const handleStorylineResolve = () => {
      const pid = player.playerId;

      // Jutalom/hatások alkalmazása
      for (const effect of resolution.effects) {
        if (effect.target === 'balance') {
          modifyBalance(pid, effect.amount, `Sztorivonal: ${resolution.title}`);
        } else if (effect.target === 'salary') {
          modifyIncome(pid, 'salary', effect.amount);
        } else if (isWellbeingTarget(effect.target)) {
          modifyWellbeing(pid, wellbeingKeyOf(effect.target), effect.amount);
        } else if (effect.target === 'loanPayments') {
          adjustTopDebt(effect.amount);
        } else if (['housing', 'food', 'utilities', 'transport', 'other'].includes(effect.target)) {
          modifyExpenses(pid, effect.target as any, effect.amount);
        }
      }

      // Sztorivonal lezárás
      resolveStorylineAction(pid, resolvingStoryline.id);
      logEvent({
        type: 'fate',
        description: `Sztorivonal: ${resolution.title}`,
        financialImpact: resolution.effects
          .filter((e) => e.target === 'balance')
          .reduce((sum, e) => sum + e.amount, 0),
      });

      // Ha van normál sorsfordító is → a component újrarenderelődik és azt mutatja
      // Ha nincs → egyből round_summary
      if (!fateEvent) {
        setPhase('round_summary');
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`game-card card-type-fate border ${resolution.isPositive ? 'border-green-500/30' : 'border-red-500/30'}`}
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-5xl mb-3"
          >
            {resolution.isPositive ? '🎊' : '😔'}
          </motion.div>

          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
            📖 Korábbi döntésed eredménye
          </span>

          <h3 className="font-display text-xl font-bold mt-3 mb-2">
            {resolution.title}
          </h3>

          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
            {resolution.description}
          </p>

          {/* Pénzügyi hatás */}
          {resolution.effects.length > 0 && (
            <div className={`${resolution.isPositive ? 'bg-money-positive/10' : 'bg-money-negative/10'} rounded-lg p-3 mb-4`}>
              {resolution.effects.map((effect, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {translateTarget(effect.target)}
                  </span>
                  <EffectAmount target={effect.target} amount={effect.amount} className="text-sm font-bold" />
                </div>
              ))}
            </div>
          )}

          {/* Nincs pénzügyi hatás (pl. barát nem fizetett, a veszteség már korábban volt) */}
          {resolution.effects.length === 0 && !resolution.isPositive && (
            <div className="bg-money-negative/10 rounded-lg p-3 mb-4">
              <p className="text-xs text-money-negative font-semibold">
                A korábban elveszített összeg sajnos nem jön vissza.
              </p>
            </div>
          )}

          {/* Tudtad? */}
          {resolution.didYouKnow && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.4 }}
              className="bg-card-knowledge/10 rounded-lg p-3 mb-4 text-left"
            >
              <h4 className="text-xs font-semibold text-card-knowledge mb-1">
                💡 Tudtad?
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                {resolution.didYouKnow}
              </p>
            </motion.div>
          )}

          <button
            onClick={handleStorylineResolve}
            className={`pulse-cta w-full ${resolution.isPositive ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600/80 hover:bg-red-500/80'} text-white
                       font-semibold py-3 rounded-xl transition-colors`}
          >
            {fateEvent ? 'Tovább a sorsfordítóhoz →' : 'Kör lezárása →'}
          </button>
        </div>
      </motion.div>
    );
  }

  if (!fateEvent) {
    return (
      <div className="game-card card-type-fate">
        <p className="text-sm text-[var(--color-text-muted)]">
          Ebben a hónapban nem történt semmi váratlan.
        </p>
        <button
          onClick={() => setPhase('round_summary')}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white
                     font-semibold py-3 rounded-xl transition-colors mt-4"
        >
          Kör lezárása →
        </button>
      </div>
    );
  }

  /** Effektek alkalmazása és logolás */
  const applyEffects = (effects: typeof fateEvent.effects, label?: string) => {
    const pid = player.playerId;

    for (const effect of effects) {
      if (effect.target === 'balance') {
        modifyBalance(pid, effect.amount, fateEvent.title);
      } else if (effect.target === 'salary') {
        modifyIncome(pid, 'salary', effect.amount);
      } else if (isWellbeingTarget(effect.target)) {
        modifyWellbeing(pid, wellbeingKeyOf(effect.target), effect.amount);
      } else if (effect.target === 'loanPayments') {
          adjustTopDebt(effect.amount);
        } else if (['housing', 'food', 'utilities', 'transport', 'other'].includes(effect.target)) {
        modifyExpenses(pid, effect.target as any, effect.amount);
      }
    }

    logEvent({
      type: 'fate',
      description: label
        ? `Sorsfordító: ${fateEvent.title} – ${label}`
        : `Sorsfordító: ${fateEvent.title}`,
      financialImpact: effects
        .filter((e) => e.target === 'balance')
        .reduce((sum, e) => sum + e.amount, 0),
    });

    setPhase('round_summary');
  };

  const handleAccept = () => applyEffects(fateEvent.effects);

  const handleOptionSelect = (option: {
    label: string;
    effects: typeof fateEvent.effects;
    storylineTrigger?: {
      type: 'friend_loan' | 'side_gig' | 'investment_result' | 'generic';
      resolveAfterRounds: number;
      data: Record<string, unknown>;
    };
  }) => {
    // Sztorivonal indítás, ha az opciónak van trigger-je
    if (option.storylineTrigger) {
      const trigger = option.storylineTrigger;
      const storylineId = `story-${trigger.type}-r${game.currentRound}`;

      // Outcome meghatározás előre (a feloldáskor determinisztikus legyen)
      let outcome: string;
      const rand = Math.random();
      switch (trigger.type) {
        case 'friend_loan':
          outcome = rand > 0.3 ? 'success' : 'failure'; // 70% visszafizet
          break;
        case 'investment_result':
          outcome = rand > 0.5 ? 'success' : 'failure'; // 50-50
          break;
        case 'side_gig':
          outcome = rand > 0.15 ? 'success' : 'partial'; // 85% teljes siker
          break;
        default:
          outcome = 'success';
      }

      addStoryline(player.playerId, {
        id: storylineId,
        type: trigger.type as PendingStoryline['type'],
        originRound: game.currentRound,
        resolveAtRound: game.currentRound + trigger.resolveAfterRounds,
        resolved: false,
        data: { ...trigger.data, outcome },
      });
    }

    applyEffects(option.effects, option.label);
  };

  // --- Tudáspróba kezelők ---

  const handleQuizAnswer = (answerIdx: number) => {
    setSelectedAnswer(answerIdx);
    setKcPhase('answer_shown');
  };

  const handleQuizResult = () => {
    const kc = fateEvent.knowledgeCheck!;
    const isCorrect = selectedAnswer === kc.quiz.correctIndex;
    setKcPhase(isCorrect ? 'success' : 'failure');
  };

  const handleKnowledgeCheckComplete = (wasSuccessful: boolean) => {
    const pid = player.playerId;
    const kc = fateEvent.knowledgeCheck!;

    // Alap effektek mindig alkalmazódnak
    for (const effect of fateEvent.effects) {
      if (effect.target === 'balance') {
        modifyBalance(pid, effect.amount, fateEvent.title);
      } else if (effect.target === 'salary') {
        modifyIncome(pid, 'salary', effect.amount);
      } else if (isWellbeingTarget(effect.target)) {
        modifyWellbeing(pid, wellbeingKeyOf(effect.target), effect.amount);
      } else if (effect.target === 'loanPayments') {
          adjustTopDebt(effect.amount);
        } else if (['housing', 'food', 'utilities', 'transport', 'other'].includes(effect.target)) {
        modifyExpenses(pid, effect.target as any, effect.amount);
      }
    }

    // Sikeres válasz → jutalom effektek is
    if (wasSuccessful) {
      for (const effect of kc.successEffects) {
        if (effect.target === 'balance') {
          modifyBalance(pid, effect.amount, `${fateEvent.title} – Tudáspróba jutalom`);
        } else if (effect.target === 'salary') {
          modifyIncome(pid, 'salary', effect.amount);
        } else if (isWellbeingTarget(effect.target)) {
          modifyWellbeing(pid, wellbeingKeyOf(effect.target), effect.amount);
        } else if (effect.target === 'loanPayments') {
          adjustTopDebt(effect.amount);
        } else if (['housing', 'food', 'utilities', 'transport', 'other'].includes(effect.target)) {
          modifyExpenses(pid, effect.target as any, effect.amount);
        }
      }
    }

    const allEffects = wasSuccessful
      ? [...fateEvent.effects, ...kc.successEffects]
      : fateEvent.effects;

    logEvent({
      type: 'fate',
      description: wasSuccessful
        ? `Sorsfordító: ${fateEvent.title} – Tudáspróba sikeres!`
        : `Sorsfordító: ${fateEvent.title} – Tudáspróba sikertelen`,
      financialImpact: allEffects
        .filter((e) => e.target === 'balance')
        .reduce((sum, e) => sum + e.amount, 0),
    });

    setPhase('round_summary');
  };

  const handleNoKnowledgeContinue = () => {
    // Alap effektek alkalmazása (ha vannak negatívak)
    if (fateEvent.effects.length > 0) {
      applyEffects(fateEvent.effects, 'Tudás hiányzott');
    } else {
      logEvent({
        type: 'fate',
        description: `Sorsfordító: ${fateEvent.title} – Tudás hiányzott, lehetőség kihagyva`,
        financialImpact: 0,
      });
      setPhase('round_summary');
    }
  };

  // --- Vizuális konfiguráció ---

  const typeConfig = {
    positive: {
      emoji: '🎉', bg: 'bg-money-positive/10', border: 'border-money-positive/30', label: 'Pozitív',
      btn: 'bg-green-600 hover:bg-green-500', badge: 'bg-green-500/20 text-green-400',
    },
    negative: {
      emoji: '⚡', bg: 'bg-money-negative/10', border: 'border-money-negative/30', label: 'Negatív',
      btn: 'bg-red-600/80 hover:bg-red-500/80', badge: 'bg-red-500/20 text-red-400',
    },
    decision: {
      emoji: '🤔', bg: 'bg-card-knowledge/10', border: 'border-card-knowledge/30', label: 'Döntéses',
      btn: 'bg-brand-600 hover:bg-brand-500', badge: 'bg-card-fate/20 text-card-fate',
    },
  };

  const config = typeConfig[fateEvent.type];

  // --- Tudáspróbás sorsfordító renderelés ---

  if (hasKnowledgeCheck) {
    const kc = fateEvent.knowledgeCheck!;
    const requiredCard = KNOWLEDGE_CARDS.find((k) => k.id === kc.requiredKnowledgeId);
    const requiredCardName = requiredCard?.name ?? kc.requiredKnowledgeId;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="game-card card-type-fate border border-purple-500/30"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-5xl mb-3"
          >
            {kcPhase === 'success' ? '🏆' : kcPhase === 'failure' ? '📚' : kcPhase === 'no_knowledge' ? '🔒' : '🧠'}
          </motion.div>

          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            {kcPhase === 'no_knowledge' ? 'Tudás szükséges' : 'Tudáspróba'}
          </span>

          <h3 className="font-display text-xl font-bold mt-3 mb-2">
            {fateEvent.title}
          </h3>

          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
            <GlossaryText text={fateEvent.description} />
          </p>

          <AnimatePresence mode="wait">
            {/* --- Nincs meg a szükséges tudás --- */}
            {kcPhase === 'no_knowledge' && (
              <motion.div
                key="no-knowledge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4 mb-4 text-left">
                  <p className="text-sm text-yellow-300 font-semibold mb-1">
                    Tudás szükséges: „{requiredCardName}"
                  </p>
                  <p className="text-xs text-yellow-400/80">
                    {kc.noKnowledgeMessage}
                  </p>
                </div>

                {/* Alap negatív hatások megmutatása, ha vannak */}
                {fateEvent.effects.length > 0 && (
                  <div className="bg-money-negative/10 rounded-lg p-3 mb-4">
                    {fateEvent.effects.map((effect, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {translateTarget(effect.target)}
                        </span>
                        <EffectAmount target={effect.target} amount={effect.amount} className="text-sm font-bold" />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleNoKnowledgeContinue}
                  className="w-full bg-yellow-600/80 hover:bg-yellow-500/80 text-white
                             font-semibold py-3 rounded-xl transition-colors"
                >
                  Kár, tovább →
                </button>
              </motion.div>
            )}

            {/* --- Kvíz kérdés --- */}
            {kcPhase === 'showing_quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 mb-4 text-left">
                  <p className="text-xs text-purple-400 mb-2 font-semibold">
                    Tudáspróba — válaszolj helyesen a jutalomért!
                  </p>
                  <p className="text-sm text-white font-semibold mb-3">
                    {kc.quiz.question}
                  </p>
                  <div className="space-y-2">
                    {kc.quiz.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuizAnswer(i)}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm
                                   bg-white/5 border border-white/10 hover:bg-purple-800/30
                                   hover:border-purple-400/40 transition-colors text-white"
                      >
                        <span className="font-semibold text-purple-400 mr-2">
                          {String.fromCharCode(65 + i)})
                        </span>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- Válasz megmutatás + magyarázat --- */}
            {kcPhase === 'answer_shown' && selectedAnswer !== null && (
              <motion.div
                key="answer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 mb-4 text-left">
                  <p className="text-xs text-purple-400 mb-2 font-semibold">
                    {kc.quiz.question}
                  </p>
                  <div className="space-y-2 mb-3">
                    {kc.quiz.options.map((option, i) => {
                      const isCorrect = i === kc.quiz.correctIndex;
                      const isSelected = i === selectedAnswer;
                      let bg = 'bg-white/5 border-white/10';
                      if (isCorrect) bg = 'bg-green-900/40 border-green-500/50';
                      else if (isSelected && !isCorrect) bg = 'bg-red-900/40 border-red-500/50';

                      return (
                        <div
                          key={i}
                          className={`px-3 py-2.5 rounded-lg text-sm border ${bg} text-white`}
                        >
                          <span className={`font-semibold mr-2 ${isCorrect ? 'text-green-400' : isSelected ? 'text-red-400' : 'text-purple-400'}`}>
                            {String.fromCharCode(65 + i)})
                          </span>
                          {option}
                          {isCorrect && <span className="ml-2">✅</span>}
                          {isSelected && !isCorrect && <span className="ml-2">❌</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                      💡 {kc.quiz.explanation}
                    </p>
                  </div>
                </div>

                <ScrollTarget>
                  <button
                    onClick={handleQuizResult}
                    className="pulse-cta w-full bg-purple-600 hover:bg-purple-500 text-white
                               font-semibold py-3 rounded-xl transition-colors"
                  >
                    Eredmény →
                  </button>
                </ScrollTarget>
              </motion.div>
            )}

            {/* --- Sikeres tudáspróba --- */}
            {kcPhase === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-green-900/30 border border-green-500/40 rounded-xl p-4 mb-4 text-left">
                  <p className="text-sm text-green-400 font-bold mb-2">
                    Helyes válasz! Megkaptad a jutalmat!
                  </p>
                  <div className="space-y-1">
                    {kc.successEffects.map((effect, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-xs text-green-300/80">
                          {translateTarget(effect.target)}
                        </span>
                        <EffectAmount target={effect.target} amount={effect.amount} className="text-sm font-bold" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alap effektek is, ha vannak */}
                {fateEvent.effects.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Alap hatás:</p>
                    {fateEvent.effects.map((effect, i) => (
                      <div key={i} className="flex items-center justify-between py-0.5">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {translateTarget(effect.target)}
                        </span>
                        <EffectAmount target={effect.target} amount={effect.amount} className="text-xs font-bold" />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleKnowledgeCheckComplete(true)}
                  className="w-full bg-green-600 hover:bg-green-500 text-white
                             font-semibold py-3 rounded-xl transition-colors"
                >
                  Szuper! →
                </button>
              </motion.div>
            )}

            {/* --- Sikertelen tudáspróba --- */}
            {kcPhase === 'failure' && (
              <motion.div
                key="failure"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-4 text-left">
                  <p className="text-sm text-red-400 font-bold mb-1">
                    Sajnos nem sikerült...
                  </p>
                  <p className="text-xs text-red-300/80">
                    {kc.failureMessage}
                  </p>
                </div>

                {/* Alap negatív effektek, ha vannak */}
                {fateEvent.effects.length > 0 && (
                  <div className="bg-money-negative/10 rounded-lg p-3 mb-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Alap hatás megmarad:</p>
                    {fateEvent.effects.map((effect, i) => (
                      <div key={i} className="flex items-center justify-between py-0.5">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {translateTarget(effect.target)}
                        </span>
                        <EffectAmount target={effect.target} amount={effect.amount} className="text-xs font-bold" />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleKnowledgeCheckComplete(false)}
                  className="w-full bg-red-600/80 hover:bg-red-500/80 text-white
                             font-semibold py-3 rounded-xl transition-colors"
                >
                  Sajnos... →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // --- Normál sorsfordító (változatlan logika) ---

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`game-card card-type-fate ${config.border} border`}
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="text-5xl mb-3"
        >
          {config.emoji}
        </motion.div>

        <span className={`text-xs ${config.badge} px-2 py-0.5 rounded-full`}>
          Sorsfordító · {fateOrigin(game, fateEvent.id)}
        </span>

        {/* Hír-alapú esemény attribúció */}
        {fateEvent.newsSource && (
          <div className="mt-2">
            <a
              href={fateEvent.newsSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300
                         px-2 py-0.5 rounded-full hover:bg-blue-500/30 transition-colors"
            >
              📰 Valós hír alapján
            </a>
          </div>
        )}

        <h3 className="font-display text-xl font-bold mt-3 mb-2">
          {fateEvent.title}
        </h3>

        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
          <GlossaryText text={fateEvent.description} />
        </p>

        {/* Hatások (csak nem-döntéses típusnál, ahol vannak globális effektek) */}
        {fateEvent.type !== 'decision' && fateEvent.effects.length > 0 && (
          <div className={`${config.bg} rounded-lg p-3 mb-4`}>
            {fateEvent.effects.map((effect, i) => {
              const isExpenseTarget = ['housing', 'utilities', 'food', 'transport', 'loanPayments', 'other'].includes(effect.target);
              const isGood = isExpenseTarget
                ? effect.amount < 0
                : effect.amount >= 0;

              return (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {translateTarget(effect.target)}
                  </span>
                  <EffectAmount target={effect.target} amount={effect.amount} className="text-sm font-bold" />
                </div>
              );
            })}
          </div>
        )}

        {/* Döntéses sorsfordító: választási gombok */}
        {fateEvent.type === 'decision' && fateEvent.options && fateEvent.options.length > 0 ? (
          <div className="space-y-2">
            {fateEvent.options.map((option, i) => {
              const balanceImpact = option.effects
                .filter((e) => e.target === 'balance')
                .reduce((sum, e) => sum + e.amount, 0);
              const hasImpact = balanceImpact !== 0;

              return (
                <button
                  key={i}
                  onClick={() => (SUBJECTIVE_WELLBEING[`${fateEvent.id}:${i}`] ? setReflecting(i) : handleOptionSelect(option))}
                  disabled={reflecting !== null}
                  className={`w-full text-left p-3 rounded-xl transition-colors border ${
                    hasImpact && balanceImpact < 0
                      ? 'bg-money-negative/10 border-money-negative/30 hover:bg-money-negative/20'
                      : hasImpact && balanceImpact > 0
                      ? 'bg-money-positive/10 border-money-positive/30 hover:bg-money-positive/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">{option.label}</span>
                  </div>
                  {option.effects.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {option.effects.map((e, j) => (
                        <span key={j} className="text-xs text-[var(--color-text-muted)]">
                          {translateTarget(e.target)}: <EffectAmount target={e.target} amount={e.amount} className="font-bold" />
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
        {reflecting !== null && fateEvent.options?.[reflecting] && (
          <div className="mt-3">
            <p className="text-sm mb-2">A döntésed: <b>{fateEvent.options[reflecting].label}</b></p>
            <WellbeingReflection reflection={SUBJECTIVE_WELLBEING[`${fateEvent.id}:${reflecting}`]}
              onDone={() => handleOptionSelect(fateEvent.options![reflecting])} />
          </div>
        )}
        {fateEvent.type === 'decision' && fateEvent.options && fateEvent.options.length > 0 ? null : fateEvent.type !== 'decision' ? (
          <button
            onClick={handleAccept}
            className={`w-full ${config.btn} text-white
                       font-semibold py-3 rounded-xl transition-colors`}
          >
            Elfogadom →
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

/** Sztorivonal feloldás: az outcome alapján generálja a megjelenítendő eredményt */
function getStorylineResolution(storyline: PendingStoryline): {
  title: string;
  description: string;
  isPositive: boolean;
  effects: Array<{ target: string; amount: number }>;
  didYouKnow: string;
} {
  const outcome = storyline.data.outcome as string;

  switch (storyline.type) {
    case 'friend_loan': {
      const amount = (storyline.data.amount as number) ?? 50_000;
      const friendName = (storyline.data.friendName as string) ?? 'A barátod';

      if (outcome === 'success') {
        return {
          title: `${friendName} visszafizette a kölcsönt!`,
          description:
            `${friendName} betartotta az ígéretét és visszaadta a ${amount.toLocaleString('hu-HU')} Ft-ot. ` +
            `Sőt, hálából meghív egy vacsorára is!`,
          isPositive: true,
          effects: [{ target: 'balance', amount: amount + 5_000 }],
          didYouKnow:
            'Kutatások szerint a baráti kölcsönök ~40%-a sosem kerül visszafizetésre. ' +
            'Ha mégis segítenél, mindig annyi pénzt adj kölcsön, amennyit „el tudsz veszíteni" – ' +
            'így nem fáj, ha nem jön vissza, és a barátság is megmarad.',
        };
      } else {
        return {
          title: `${friendName} nem fizette vissza...`,
          description:
            `${friendName} elkerül, nem válaszol az üzeneteidre. ` +
            `A kölcsönadott ${amount.toLocaleString('hu-HU')} Ft-ot valószínűleg nem kapod vissza.`,
          isPositive: false,
          effects: [],
          didYouKnow:
            'Aranyszabály: Soha ne adj kölcsön több pénzt, mint amennyit ajándékként is odaadnál. ' +
            'Ha mégis kölcsönadnál nagyobb összeget, írjatok egyszerű kötelezvényt – ' +
            'ez jogilag érvényes és védi a barátságot is.',
        };
      }
    }

    case 'investment_result': {
      const amount = (storyline.data.amount as number) ?? 30_000;
      const name = (storyline.data.investmentName as string) ?? 'befektetés';

      if (outcome === 'success') {
        return {
          title: `A ${name} kifizetődött!`,
          description:
            `A kolléga tippje bejött! A befektetésed megduplázódott: ` +
            `visszakaptad a ${amount.toLocaleString('hu-HU')} Ft-ot, plusz ugyanennyit nyertél!`,
          isPositive: true,
          effects: [{ target: 'balance', amount: amount * 2 }],
          didYouKnow:
            'A „biztos tippek" az esetek többségében nem biztos tippek. ' +
            'A magyar startupok ~80%-a az első 3 évben megszűnik. ' +
            'Mindig végezz saját kutatást, és soha ne fektess be többet, mint amit elveszíthetsz!',
        };
      } else {
        return {
          title: `A ${name} bukta lett...`,
          description:
            `A startup csődöt jelentett, a befektetett ` +
            `${amount.toLocaleString('hu-HU')} Ft elúszott. Sajnos nem jön vissza.`,
          isPositive: false,
          effects: [],
          didYouKnow:
            'Befektetési tanács ismerőstől? Mindig legyél szkeptikus! ' +
            'A szabályozott piacok (BÉT, külföldi tőzsdék) átláthatóbbak és biztonságosabbak. ' +
            'Diverzifikálj: ne tedd az összes pénzed egy helyre.',
        };
      }
    }

    case 'side_gig': {
      const payment = (storyline.data.totalPayment as number) ?? 80_000;
      const name = (storyline.data.gigName as string) ?? 'mellékállás';

      if (outcome === 'success') {
        return {
          title: `${name}: sikeresen teljesítetted!`,
          description:
            `Két hónapig keményen dolgoztál hétvégente, de megérte! ` +
            `Megkaptad a teljes fizetséget: ${payment.toLocaleString('hu-HU')} Ft.`,
          isPositive: true,
          effects: [{ target: 'balance', amount: payment }],
          didYouKnow:
            'A mellékállás (side gig) egyre népszerűbb: a munkavállalók ~15%-a végez kiegészítő munkát. ' +
            'Fontos: évi 1 millió Ft felett vállalkozói adózás szükséges (KATA vagy egyéni vállalkozás). ' +
            'Munkáltatóddal is érdemes egyeztetni, mert sok munkaszerződés korlátozza a mellékállást.',
        };
      } else {
        return {
          title: `${name}: csak részben sikerült`,
          description:
            `Az ismerősöd boltja nem ment annyira jól, csak a munka felét tudtad elvégezni. ` +
            `Részfizetés: ${Math.round(payment / 2).toLocaleString('hu-HU')} Ft.`,
          isPositive: true,
          effects: [{ target: 'balance', amount: Math.round(payment / 2) }],
          didYouKnow:
            'Mellékállásnál mindig kérj írásos megállapodást (akár egyszerű e-mail) ' +
            'a feladatról és a fizetésről. Ez véd, ha vita merül fel a díjazásról.',
        };
      }
    }

    default:
      return {
        title: 'Sztorivonal lezárult',
        description: 'Egy korábbi döntésed eredménye megérkezett.',
        isPositive: true,
        effects: [],
        didYouKnow: '',
      };
  }
}

/** Pénzügyi target mező → magyar felirat */
function translateTarget(target: string): string {
  const labels: Record<string, string> = {
    balance: 'Egyenleg',
    salary: 'Fizetés',
    housing: 'Lakhatás',
    utilities: 'Rezsi',
    food: 'Élelmiszer',
    transport: 'Közlekedés',
    loanPayments: 'Törlesztő',
    other: 'Egyéb kiadás',
    passive: 'Passzív jövedelem',
    oneTime: 'Egyszeri bevétel',
    'wellbeing.eletero': RULESETS[DEFAULT_RULESET_ID].labels.wellbeing.eletero,
    'wellbeing.egeszseg': RULESETS[DEFAULT_RULESET_ID].labels.wellbeing.egeszseg,
    'wellbeing.egyensuly': RULESETS[DEFAULT_RULESET_ID].labels.wellbeing.egyensuly,
  };
  return labels[target] ?? target;
}

const MONTH_NAMES = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];

/** Honnan jött a lap: a hónap (naptári kártya), a saját történet (Sorsfordító mező) vagy a lépett negyed */
function fateOrigin(game: NonNullable<ReturnType<typeof useGameStore.getState>['game']>, id: string): string {
  const months = FATE_MONTHS[id.replace(/b$/, '')];
  if (months) {
    const m = Number(game.currentGameDate.split('-')[1]);
    return MONTH_NAMES[(months.includes(m) ? m : months[0]) - 1];
  }
  const field = BOARD[game.board?.position ?? 0];
  if (field?.type === 'fate') return 'a saját történeted';
  return districtOf(field?.index ?? 0).label;
}
