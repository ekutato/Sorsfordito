'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { TIME_SCALE_CONFIGS } from '@/types/game';
import { FinancialDashboard } from '@/ui/components/FinancialDashboard';
import { DecisionView } from '@/ui/components/DecisionView';
import { FateEventView } from '@/ui/components/FateEventView';
import { RoundSummaryView } from '@/ui/components/RoundSummaryView';
import { INVESTMENT_OPTIONS } from '@/data/investment-options';
import { KNOWLEDGE_CARDS } from '@/data/knowledge-cards';
import { formatHUF } from '@/engine/financial-calculator';
import { GlossaryText } from '@/ui/components/GlossaryTerm';
import { LIFE_SITUATION_PRESETS } from '@/data/character-presets';
import type { LifeSituationId } from '@/types/game';
import type { Investment } from '@/types/financial';
import type { GameState } from '@/types/game';
import { BOARD, FIELD_LABELS } from '@/data/board';
import { cardForField, FIELD_HINTS } from '@/data/field-cards';
import { rollBoard, resolveFieldCard, emptyBoard, continueBoard } from '@/store/board-actions';
import { BoardFull, BoardStrip, DiceButton } from '@/ui/board/BoardView';
import { FieldCardView } from '@/ui/board/FieldCardView';
import { createRng, seedFromString, shuffle } from '@/engine/rng';

const MARKET_INVEST_OFFERS = 3;
const MARKET_KNOWLEDGE_OFFERS = 2;

export function GameScreen() {
  const game = useGameStore((s) => s.game);

  if (!game) return null;

  const player = game.players[game.activePlayerIndex];
  const tsConfig = TIME_SCALE_CONFIGS[game.config.timeScale];
  const progressPercent = (game.currentRound / tsConfig.totalRounds) * 100;
  // A kör tartalma csak a dobás és a mezőkártya után jön (táblás mód)
  const boardDone = isBoardDone(game);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar: kor es progressz */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg)]/95 backdrop-blur-sm px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-[var(--color-text-muted)]">
            <span className="font-semibold text-white">{player.name}</span>
            {' · '}
            {game.currentRound}/{tsConfig.totalRounds}. kör
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-mono">
              📅 {formatGameDate(game.currentGameDate)}
            </div>
            <GameMenu />
          </div>
        </div>
        <div className="round-progress">
          <div
            className="round-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Fo tartalom - fazis szerint */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Induló kontextus: lokáció + gazdasági helyzet (1. kör, bevétel fázis) */}
        {game.currentRound === 1 && game.phase === 'round_income' && (() => {
          const preset = LIFE_SITUATION_PRESETS[player.lifeSituation as LifeSituationId];
          const loc = preset?.location;
          return (
            <div className="space-y-2">
              {/* Lokáció banner */}
              {loc && (
                <div className="bg-slate-800/60 border border-slate-600/30 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">📍</span>
                    <span className="text-xs font-semibold text-slate-300">Kiindulási helyzet</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>
                      🏠 {loc.homeCity}{loc.homeDistrict ? `, ${loc.homeDistrict}` : ''}{' '}
                      <span className="text-slate-500">({loc.homeDetail})</span>
                    </span>
                    {loc.workCity && (
                      <span>
                        💼 {loc.workCity}{loc.workDistrict ? `, ${loc.workDistrict}` : ''}{' '}
                        <span className="text-slate-500">({loc.workDetail})</span>
                      </span>
                    )}
                    {loc.originCity && (
                      <span>
                        👨‍👩‍👦 Szülők: {loc.originCity}{' '}
                        <span className="text-slate-500">({loc.originCounty})</span>
                      </span>
                    )}
                    {loc.commuteMinutes != null && loc.commuteMinutes > 0 && (
                      <span>
                        🚌 Ingázás: {loc.commuteMinutes} perc{' '}
                        <span className="text-slate-500">({loc.commuteMethod})</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Gazdasági összefoglaló */}
              {game.preGameContext && (
                <div className="bg-blue-900/30 border border-blue-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">📊</span>
                    <span className="text-xs font-semibold text-blue-300">
                      Jelenlegi gazdasági helyzet
                    </span>
                    {game.config.useLiveData && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                        ÉLŐ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    {game.preGameContext.economicSummary.headline}
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Táblás mód: dobás → mezőkártya → a kör megszokott menete */}
        <BoardLayer />

        {/* Penzugyi dashboard (mindig latszik) */}
        <FinancialDashboard
          sheet={player.financialSheet}
          compact={!boardDone || (game.phase !== 'round_income' && game.phase !== 'round_summary')}
        />

        {/* Fazis-specifikus tartalom */}
        {boardDone && (game.phase === 'round_income' || game.phase === 'round_expenses') && (
          <IncomeExpensePhase />
        )}

        {game.phase === 'round_decision' && (
          <DecisionView key={`decision-r${game.currentRound}`} />
        )}

        {game.phase === 'round_invest' && (
          <InvestPhase />
        )}

        {game.phase === 'round_fate' && (
          <FateEventView />
        )}

        {game.phase === 'round_summary' && (
          <RoundSummaryView />
        )}

        {game.phase === 'crisis' && (
          <CrisisPhase />
        )}
      </div>
    </div>
  );
}

// --- Seged komponensek ---

function IncomeExpensePhase() {
  const game = useGameStore((s) => s.game);
  const setPhase = useGameStore((s) => s.setPhase);
  const processRoundIncome = useGameStore((s) => s.processRoundIncome);
  const processRoundExpenses = useGameStore((s) => s.processRoundExpenses);
  const modifyIncome = useGameStore((s) => s.modifyIncome);
  const modifyExpenses = useGameStore((s) => s.modifyExpenses);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});

  if (!game) return null;

  const player = game.players[game.activePlayerIndex];
  const sheet = player.financialSheet;
  const isIncome = game.phase === 'round_income';

  // Minimum bér (nettó, 2026)
  const MIN_WAGE_NET = 214_000;

  // Előző kör egyszeri tranzakciói (döntések, sorsfordítók, befektetések)
  const prevRoundEvents = isIncome && game.currentRound > 1
    ? (game.eventLog ?? []).filter(
        (e) =>
          e.round === game.currentRound - 1 &&
          (e.type === 'decision' || e.type === 'fate' || e.type === 'investment' || e.type === 'knowledge') &&
          e.financialImpact !== undefined &&
          e.financialImpact !== 0
      )
    : [];

  // Szerkeszthető mezők
  type EditableIncomeField = { key: 'salary'; label: string; current: number; min: number };
  type EditableExpenseField = { key: keyof typeof sheet.expenses; label: string; current: number; min: number };

  const editableIncomeFields: EditableIncomeField[] = [
    { key: 'salary', label: 'Munkabér (nettó)', current: sheet.income.salary, min: sheet.income.salary > 0 ? MIN_WAGE_NET : 0 },
  ];

  const editableExpenseFields: EditableExpenseField[] = [
    { key: 'housing', label: 'Lakhatás', current: sheet.expenses.housing, min: 0 },
    { key: 'utilities', label: 'Rezsi', current: sheet.expenses.utilities, min: 0 },
    { key: 'food', label: 'Élelmiszer', current: sheet.expenses.food, min: 0 },
    { key: 'transport', label: 'Közlekedés', current: sheet.expenses.transport, min: 0 },
    { key: 'other', label: 'Egyéb', current: sheet.expenses.other, min: 0 },
  ];

  const handleStartEdit = () => {
    // Alapértékek betöltése a jelenlegi értékekből
    if (isIncome) {
      const vals: Record<string, number> = {};
      editableIncomeFields.forEach((f) => { vals[f.key] = f.current; });
      setEditValues(vals);
    } else {
      const vals: Record<string, number> = {};
      editableExpenseFields.forEach((f) => { vals[f.key] = f.current; });
      setEditValues(vals);
    }
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const pid = player.playerId;
    if (isIncome) {
      for (const field of editableIncomeFields) {
        const newVal = editValues[field.key] ?? field.current;
        const clamped = Math.max(field.min, Math.round(newVal));
        const delta = clamped - field.current;
        if (delta !== 0) {
          modifyIncome(pid, field.key, delta);
        }
      }
    } else {
      for (const field of editableExpenseFields) {
        const newVal = editValues[field.key] ?? field.current;
        const clamped = Math.max(field.min, Math.round(newVal));
        const delta = clamped - field.current;
        if (delta !== 0) {
          modifyExpenses(pid, field.key, delta);
        }
      }
    }
    setIsEditing(false);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({});
  };

  const handleNext = () => {
    if (isIncome) {
      processRoundIncome();
      setPhase('round_expenses');
    } else {
      processRoundExpenses();
      setPhase('round_decision');
    }
  };

  // Bevétel tételek
  const incomeItems = [
    { label: 'Munkabér (nettó)', amount: sheet.income.salary },
    { label: 'Passzív jövedelem', amount: sheet.income.passive },
    ...(sheet.income.oneTime > 0
      ? [{ label: 'Egyszeri bevétel', amount: sheet.income.oneTime }]
      : []),
  ].filter((item) => item.amount > 0);

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);

  // Kiadás tételek
  const expenseItems = [
    { label: 'Lakhatás', amount: sheet.expenses.housing },
    { label: 'Rezsi', amount: sheet.expenses.utilities },
    { label: 'Élelmiszer', amount: sheet.expenses.food },
    { label: 'Közlekedés', amount: sheet.expenses.transport },
    { label: 'Hiteltörlesztés', amount: sheet.expenses.loanPayments },
    { label: 'Egyéb', amount: sheet.expenses.other },
  ].filter((item) => item.amount > 0);

  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  const items = isIncome ? incomeItems : expenseItems;
  const total = isIncome ? totalIncome : totalExpenses;

  return (
    <div className={`game-card ${isIncome ? 'border-money-positive/30 border' : 'border-money-negative/30 border'}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-lg font-semibold">
          {isIncome ? '💰 Bevételek' : '💸 Kiadások'}
        </h3>
        {/* Testreszabás gomb — csak az 1. körben, vagy ha nincs editing */}
        {game.currentRound <= 2 && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors
                       flex items-center gap-1"
          >
            ✏️ Testreszabás
          </button>
        )}
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Egyenleg: <span className="font-mono font-semibold text-white">{formatHUF(sheet.balance)}</span>
      </p>

      {/* Előző kör egyszeri tranzakciói */}
      {prevRoundEvents.length > 0 && (
        <div className="rounded-xl p-3 mb-3 bg-white/5 border border-white/10">
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">
            📋 Előző kör tranzakciói
          </h4>
          {prevRoundEvents.map((evt, i) => {
            const amount = evt.financialImpact!;
            const isPositive = amount > 0;
            return (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <span className="text-xs text-[var(--color-text-muted)] flex-1 pr-2">
                  {evt.description}
                </span>
                <span className={`font-mono text-xs font-semibold whitespace-nowrap ${
                  isPositive ? 'text-money-positive' : 'text-money-negative'
                }`}>
                  {isPositive ? '+' : ''}{formatHUF(amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Szerkesztő mód */}
      {isEditing && (
        <div className="rounded-xl p-3 mb-3 bg-brand-600/10 border border-brand-500/30">
          <h4 className="text-xs font-semibold text-brand-400 mb-2">
            ✏️ Írd be a saját {isIncome ? 'bevételeidet' : 'kiadásaidat'}
          </h4>
          <p className="text-[10px] text-[var(--color-text-muted)] mb-3">
            {isIncome
              ? `Módosítsd a havi nettó fizetésedet (min. ${formatHUF(MIN_WAGE_NET)} nettó minimálbér)`
              : 'Írd be a tényleges havi kiadásaidat, hogy a játék a valóságodat tükrözze'}
          </p>

          <div className="space-y-2">
            {(isIncome ? editableIncomeFields : editableExpenseFields).map((field) => (
              <div key={field.key} className="flex items-center gap-2">
                <label className="text-xs text-[var(--color-text-muted)] flex-1 min-w-0">
                  {field.label}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={editValues[field.key] ?? field.current}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditValues((prev) => ({ ...prev, [field.key]: val }));
                    }}
                    min={field.min}
                    step={1000}
                    className="w-28 bg-[var(--color-bg)] border border-white/20 rounded-lg px-2 py-1.5
                               text-right text-sm font-mono text-white
                               focus:border-brand-500 focus:outline-none transition-colors"
                  />
                  <span className="text-[10px] text-[var(--color-text-muted)]">Ft</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSaveEdit}
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white
                         font-semibold py-2 rounded-xl transition-colors text-sm"
            >
              ✅ Mentés
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)]
                         font-semibold py-2 rounded-xl transition-colors text-sm"
            >
              Mégse
            </button>
          </div>
        </div>
      )}

      {/* Tételes lista */}
      {!isEditing && (
        <div className={`rounded-xl p-3 mb-3 ${isIncome ? 'bg-money-positive/5' : 'bg-money-negative/5'}`}>
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <span className="text-sm text-[var(--color-text-muted)]">{item.label}</span>
              <span className={`font-mono text-sm font-semibold ${
                isIncome ? 'text-money-positive' : 'text-money-negative'
              }`}>
                {isIncome ? '+' : '-'}{formatHUF(item.amount)}
              </span>
            </div>
          ))}

          {/* Összesítő sor */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/20">
            <span className="text-sm font-semibold text-white">Összesen</span>
            <span className={`font-mono text-base font-bold ${
              isIncome ? 'text-money-positive' : 'text-money-negative'
            }`}>
              {isIncome ? '+' : '-'}{formatHUF(total)}
            </span>
          </div>
        </div>
      )}

      {/* Új egyenleg előnézet */}
      {!isEditing && (
        <>
          <div className="text-center text-xs text-[var(--color-text-muted)] mb-3">
            Új egyenleg: <span className="font-mono font-semibold text-white">
              {formatHUF(isIncome ? sheet.balance + total : sheet.balance - total)}
            </span>
          </div>

          <button
            onClick={handleNext}
            className={`pulse-cta w-full font-semibold py-3 rounded-xl transition-colors text-white ${
              isIncome
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-red-600/80 hover:bg-red-500/80'
            }`}
          >
            {isIncome ? '✅ Bevétel jóváírása →' : '📋 Kiadások levonása →'}
          </button>
        </>
      )}
    </div>
  );
}

function InvestPhase() {
  const game = useGameStore((s) => s.game);
  const setPhase = useGameStore((s) => s.setPhase);
  const addInvestment = useGameStore((s) => s.addInvestment);
  const addKnowledge = useGameStore((s) => s.addKnowledge);
  const modifyBalance = useGameStore((s) => s.modifyBalance);
  const logEvent = useGameStore((s) => s.logEvent);

  const [tab, setTab] = useState<'invest' | 'knowledge'>('invest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);
  // Körönkénti limit: 1 befektetés + 1 tudáskártya (a játéknaplóból számolva, így elnavigálással sem kijátszható)
  const MAX_KNOWLEDGE_PER_ROUND = 1;
  const MAX_INVEST_PER_ROUND = 1;

  // MiFID kvíz állapot
  const [quizState, setQuizState] = useState<{
    cardId: string;
    currentQ: number;
    selectedAnswer: number | null;
    showExplanation: boolean;
    correctCount: number;
    wrongCount: number;
    finished: boolean;
  } | null>(null);

  if (!game) return null;

  const player = game.players[game.activePlayerIndex];
  const balance = player.financialSheet.balance;
  const ownedInvestmentIds = player.financialSheet.investments.map((i) => i.optionId);
  const ownedKnowledgeIds = player.financialSheet.acquiredKnowledge;

  const roundLog = (game.eventLog ?? []).filter((e) => e.round === game.currentRound && e.type === 'investment');
  const investBoughtThisRound = roundLog.filter((e) => e.description.startsWith('Befektetés:')).length;
  const knowledgeBoughtThisRound = roundLog.filter((e) => e.description.startsWith('Tudás kártya:')).length;

  // Mint egy táblajátékban: nem a teljes piac látszik, hanem körönként néhány húzott lap.
  // A húzás körönként állandó (a játék és a kör azonosítójából), így újratöltéskor sem változik.
  const deckInvest = INVESTMENT_OPTIONS.filter((inv) => !ownedInvestmentIds.includes(inv.id) && inv.tier === 'free');
  const deckKnowledge = KNOWLEDGE_CARDS.filter((k) => !ownedKnowledgeIds.includes(k.id) && k.tier === 'free');
  const drawRng = createRng(seedFromString(`${game.gameId}-r${game.currentRound}`));
  const availableInvestments = shuffle(deckInvest, drawRng).slice(0, MARKET_INVEST_OFFERS);
  const availableKnowledge = shuffle(deckKnowledge, drawRng).slice(0, MARKET_KNOWLEDGE_OFFERS);

  const handleBuyInvestment = (optionId: string) => {
    const option = INVESTMENT_OPTIONS.find((o) => o.id === optionId);
    if (!option || balance < option.entryPrice) return;
    // Védelem: tudáskártya nélkül nem vásárolható
    if (option.requiredKnowledge && !ownedKnowledgeIds.includes(option.requiredKnowledge)) return;
    // Per-round limit
    if (investBoughtThisRound >= MAX_INVEST_PER_ROUND) return;

    const investment: Investment = {
      optionId: option.id,
      purchasePrice: option.entryPrice,
      purchasedAtRound: game.currentRound,
      currentValue: option.entryPrice,
      totalIncomeGenerated: 0,
    };

    addInvestment(player.playerId, investment);
    logEvent({
      type: 'investment',
      description: `Befektetés: ${option.name}`,
      financialImpact: -option.entryPrice,
    });

    setJustBought(option.name);
    setSelectedId(null);
    setTimeout(() => setJustBought(null), 2000);
  };

  const handleBuyKnowledge = (cardId: string) => {
    const card = KNOWLEDGE_CARDS.find((k) => k.id === cardId);
    if (!card || (card.price > 0 && balance < card.price)) return;
    // Per-round limit
    if (knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND) return;

    // Ha van kvíz, indítsuk el a kvízt a vásárlás előtt
    if (card.quiz && card.quiz.length > 0 && !quizState?.finished) {
      setQuizState({
        cardId: card.id,
        currentQ: 0,
        selectedAnswer: null,
        showExplanation: false,
        correctCount: 0,
        wrongCount: 0,
        finished: false,
      });
      return;
    }

    // Kvíz nélkül (vagy kvíz után) azonnal megvesszük
    completeBuyKnowledge(card.id);
  };

  const completeBuyKnowledge = (cardId: string) => {
    const card = KNOWLEDGE_CARDS.find((k) => k.id === cardId);
    if (!card) return;
    // Per-round limit
    if (knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND) return;

    addKnowledge(player.playerId, card.id);
    if (card.price > 0) {
      modifyBalance(player.playerId, -card.price, `Tudás kártya: ${card.name}`);
    }
    logEvent({
      type: 'investment',
      description: `Tudás kártya: ${card.name}`,
      financialImpact: -card.price,
    });

    setQuizState(null);
    setJustBought(card.name);
    setSelectedId(null);
    setTimeout(() => setJustBought(null), 2000);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (!quizState || quizState.showExplanation) return;
    setQuizState({ ...quizState, selectedAnswer: answerIndex, showExplanation: true });
  };

  const handleQuizNext = () => {
    if (!quizState) return;
    const card = KNOWLEDGE_CARDS.find((k) => k.id === quizState.cardId);
    if (!card?.quiz) return;

    const wasCorrect = quizState.selectedAnswer === card.quiz[quizState.currentQ].correctIndex;
    const newCorrect = quizState.correctCount + (wasCorrect ? 1 : 0);
    const newWrong = quizState.wrongCount + (wasCorrect ? 0 : 1);
    const nextQ = quizState.currentQ + 1;

    if (nextQ >= card.quiz.length) {
      // Kvíz vége — mindenképp megkapja a tudást (tanulás!)
      setQuizState({ ...quizState, correctCount: newCorrect, wrongCount: newWrong, finished: true });
    } else {
      setQuizState({
        ...quizState,
        currentQ: nextQ,
        selectedAnswer: null,
        showExplanation: false,
        correctCount: newCorrect,
        wrongCount: newWrong,
      });
    }
  };

  const selectedInvestment = tab === 'invest'
    ? INVESTMENT_OPTIONS.find((o) => o.id === selectedId)
    : null;
  const selectedKnowledge = tab === 'knowledge'
    ? KNOWLEDGE_CARDS.find((k) => k.id === selectedId)
    : null;

  return (
    <div className="game-card card-type-investment">
      <h3 className="font-display text-lg font-semibold mb-1">
        📈 Befektetési lehetőség
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Egyenleg: <span className="font-mono font-semibold text-white">{formatHUF(balance)}</span>
      </p>

      {/* Sikeres vásárlás visszajelzés */}
      {justBought && (
        <div className="bg-green-900/40 border border-green-500/30 rounded-xl px-3 py-2 mb-3 text-sm text-green-300">
          ✅ Megvásárolva: {justBought}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => { setTab('invest'); setSelectedId(null); setQuizState(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'invest'
              ? 'bg-brand-600 text-white'
              : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
          }`}
        >
          💰 Heti piac ({availableInvestments.length})
        </button>
        <button
          onClick={() => { setTab('knowledge'); setSelectedId(null); setQuizState(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'knowledge'
              ? 'bg-brand-600 text-white'
              : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
          }`}
        >
          📚 Tudás ({availableKnowledge.length})
        </button>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Ebben a körben ezeket a lapokat húztad. A paklikban még {Math.max(0, deckInvest.length - availableInvestments.length)} befektetés és {Math.max(0, deckKnowledge.length - availableKnowledge.length)} tudáskártya vár. Körönként 1 befektetést és 1 tudást szerezhetsz.
      </p>

      {/* Investment options list */}
      {tab === 'invest' && (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {investBoughtThisRound >= MAX_INVEST_PER_ROUND && (
            <div className="bg-brand-600/10 border border-brand-500/30 rounded-xl px-3 py-2 mb-1 text-xs text-brand-300">
              📦 Ebben a körben már befektettél. Legközelebb újra tudsz vásárolni!
            </div>
          )}
          {availableInvestments.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              Nincs elérhető új befektetés
            </p>
          ) : (
            availableInvestments.map((inv) => {
              const canAfford = balance >= inv.entryPrice;
              const needsKnowledge = inv.requiredKnowledge && !ownedKnowledgeIds.includes(inv.requiredKnowledge);
              const isSelected = selectedId === inv.id;

              return (
                <div key={inv.id}>
                  <button
                    onClick={() => setSelectedId(isSelected ? null : inv.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 border border-brand-500/50'
                        : 'bg-[var(--color-bg-elevated)] hover:bg-white/5 border border-transparent'
                    } ${!canAfford || needsKnowledge ? 'opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-semibold text-sm"><GlossaryText text={inv.name} /></span>
                        {needsKnowledge && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTab('knowledge');
                              setSelectedId(inv.requiredKnowledge ?? null);
                            }}
                            className="ml-2 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded
                                       hover:bg-yellow-500/30 transition-colors cursor-pointer"
                            title="Kattints a szükséges tudáskártyához"
                          >
                            🔒 Tudás kell →
                          </button>
                        )}
                      </div>
                      <span className={`text-xs font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                        {formatHUF(inv.entryPrice)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {inv.monthlyPassiveIncome > 0
                        ? `+${formatHUF(inv.monthlyPassiveIncome)}/hó hozam`
                        : 'Árfolyam alapú hozam'}
                      {' · '}
                      Biztonság: {inv.scores.safety}/100
                      {inv.scores.volatility > 20 && (
                        <span className={`ml-1 ${
                          inv.scores.volatility >= 70 ? 'text-red-400'
                          : inv.scores.volatility >= 40 ? 'text-yellow-400'
                          : 'text-green-400'
                        }`}>
                          {' · '}⚡ {inv.scores.volatility}/100
                        </span>
                      )}
                    </p>
                  </button>

                  {/* Expanded detail */}
                  {isSelected && selectedInvestment && (
                    <div className="mt-1 p-3 bg-[var(--color-bg)]/50 rounded-xl border border-white/5 text-xs space-y-2">
                      <p className="text-[var(--color-text-muted)]"><GlossaryText text={selectedInvestment.description} /></p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[var(--color-text-muted)]">Hozam</div>
                          <div className="font-semibold text-green-400">{selectedInvestment.scores.returnPotential}/100</div>
                        </div>
                        <div>
                          <div className="text-[var(--color-text-muted)]">Biztonság</div>
                          <div className="font-semibold text-blue-400">{selectedInvestment.scores.safety}/100</div>
                        </div>
                        <div>
                          <div className="text-[var(--color-text-muted)]">Volatilitás</div>
                          <div className={`font-semibold ${
                            selectedInvestment.scores.volatility >= 70 ? 'text-red-400'
                            : selectedInvestment.scores.volatility >= 40 ? 'text-yellow-400'
                            : selectedInvestment.scores.volatility >= 15 ? 'text-green-300'
                            : 'text-green-400'
                          }`}>{selectedInvestment.scores.volatility}/100</div>
                        </div>
                      </div>
                      {/* Volatilitás magyarázat */}
                      {selectedInvestment.scores.volatility > 20 && (
                        <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-2">
                          <p className="text-yellow-300 text-[10px] leading-relaxed">
                            ⚡ <span className="font-semibold">Volatilitás ({selectedInvestment.scores.volatility}/100):</span>{' '}
                            {selectedInvestment.scores.volatility >= 70
                              ? 'Extrém árfolyam-ingadozás! Az érték akár 50%-ot is zuhanhat rövid idő alatt. Csak annyit fektess, amennyit hajlandó vagy elveszíteni.'
                              : selectedInvestment.scores.volatility >= 40
                              ? 'Közepes ingadozás. Az árfolyam rövid távon 10-20%-ot is mozoghat, de hosszú távon (5+ év) általában emelkedik.'
                              : 'Enyhe ingadozás. Az érték viszonylag stabil, de kisebb kilengések előfordulhatnak.'}
                          </p>
                        </div>
                      )}
                      <div className="bg-blue-900/30 border border-blue-500/20 rounded-lg p-2">
                        <p className="text-blue-300">💡 <GlossaryText text={selectedInvestment.realWorldInfo} /></p>
                      </div>
                      <button
                        onClick={() => handleBuyInvestment(selectedInvestment.id)}
                        disabled={!canAfford || !!needsKnowledge || investBoughtThisRound >= MAX_INVEST_PER_ROUND}
                        className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700 disabled:text-gray-500
                                   text-white font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        {investBoughtThisRound >= MAX_INVEST_PER_ROUND
                          ? '📦 Ebben a körben már befektettél'
                          : !canAfford
                          ? 'Nincs elég pénzed'
                          : needsKnowledge
                          ? '🔒 Tudás kártya szükséges — kattints a fenti badge-re'
                          : `Megveszem: ${formatHUF(selectedInvestment.entryPrice)}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Knowledge cards list */}
      {tab === 'knowledge' && (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND && (
            <div className="bg-brand-600/10 border border-brand-500/30 rounded-xl px-3 py-2 mb-1 text-xs text-brand-300">
              📚 Ebben a körben már szereztél tudást. A következő körben új lapokat húzol!
            </div>
          )}
          {availableKnowledge.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              Minden tudás kártya megvan!
            </p>
          ) : (
            availableKnowledge.map((card) => {
              const canAfford = card.price === 0 || balance >= card.price;
              const isSelected = selectedId === card.id;

              return (
                <div key={card.id}>
                  <button
                    onClick={() => { setSelectedId(isSelected ? null : card.id); if (!isSelected) setQuizState(null); }}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 border border-brand-500/50'
                        : 'bg-[var(--color-bg-elevated)] hover:bg-white/5 border border-transparent'
                    } ${!canAfford ? 'opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm"><GlossaryText text={card.name} /></span>
                      <span className={`text-xs font-mono ${card.price === 0 ? 'text-green-400' : canAfford ? 'text-green-400' : 'text-red-400'}`}>
                        {card.price === 0 ? 'INGYENES' : formatHUF(card.price)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {card.ongoingEffect}
                    </p>
                    {card.unlocks.length > 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        🔓 Feloldja: {card.unlocks.map((id) => resolveUnlockName(id)).join(', ')}
                      </p>
                    )}
                  </button>

                  {/* Expanded detail */}
                  {isSelected && selectedKnowledge && (
                    <div className="mt-1 p-3 bg-[var(--color-bg)]/50 rounded-xl border border-white/5 text-xs space-y-2">
                      <div className="bg-blue-900/30 border border-blue-500/20 rounded-lg p-2">
                        <p className="text-blue-300">📖 <GlossaryText text={selectedKnowledge.realWorldKnowledge} /></p>
                      </div>

                      {/* MiFID kvíz */}
                      {quizState && quizState.cardId === selectedKnowledge.id && !quizState.finished && selectedKnowledge.quiz && (
                        <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-purple-300 font-semibold text-xs">
                              📝 Tudáspróba ({quizState.currentQ + 1}/{selectedKnowledge.quiz.length})
                            </p>
                            <span className="text-[10px] text-[var(--color-text-muted)]">
                              Mint a valós MiFID teszt!
                            </span>
                          </div>
                          <p className="text-white text-sm font-medium">
                            {selectedKnowledge.quiz[quizState.currentQ].question}
                          </p>
                          <div className="space-y-2">
                            {selectedKnowledge.quiz[quizState.currentQ].options.map((opt, idx) => {
                              const isCorrect = idx === selectedKnowledge.quiz![quizState.currentQ].correctIndex;
                              const isChosen = quizState.selectedAnswer === idx;
                              const showResult = quizState.showExplanation;

                              let btnClass = 'bg-[var(--color-bg-elevated)] hover:bg-white/10 border-white/10';
                              if (showResult && isCorrect) {
                                btnClass = 'bg-green-900/40 border-green-500/50 text-green-300';
                              } else if (showResult && isChosen && !isCorrect) {
                                btnClass = 'bg-red-900/40 border-red-500/50 text-red-300';
                              }

                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleQuizAnswer(idx)}
                                  disabled={quizState.showExplanation}
                                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${btnClass}
                                    ${!showResult ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                  <span className="font-mono mr-2 opacity-50">{String.fromCharCode(65 + idx)})</span>
                                  {opt}
                                  {showResult && isCorrect && ' ✅'}
                                  {showResult && isChosen && !isCorrect && ' ❌'}
                                </button>
                              );
                            })}
                          </div>

                          {/* Magyarázat a válasz után */}
                          {quizState.showExplanation && (
                            <div className="bg-blue-900/30 border border-blue-500/20 rounded-lg p-2.5">
                              <p className="text-blue-300 text-xs leading-relaxed">
                                💡 {selectedKnowledge.quiz[quizState.currentQ].explanation}
                              </p>
                            </div>
                          )}

                          {/* Következő kérdés gomb */}
                          {quizState.showExplanation && (
                            <button
                              onClick={handleQuizNext}
                              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
                            >
                              {quizState.currentQ + 1 < (selectedKnowledge.quiz?.length ?? 0)
                                ? 'Következő kérdés →'
                                : 'Eredmény megtekintése'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Kvíz eredmény */}
                      {quizState?.finished && quizState.cardId === selectedKnowledge.id && selectedKnowledge.quiz && (
                        <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-3 space-y-2">
                          <p className="text-green-300 font-semibold">
                            📊 Eredmény: {quizState.correctCount}/{selectedKnowledge.quiz.length} helyes válasz
                          </p>
                          {quizState.correctCount === selectedKnowledge.quiz.length ? (
                            <p className="text-green-200 text-xs">🎉 Tökéletes! Minden kérdésre helyesen válaszoltál!</p>
                          ) : quizState.correctCount >= selectedKnowledge.quiz.length / 2 ? (
                            <p className="text-yellow-200 text-xs">👍 Jó eredmény! A magyarázatokból sokat tanulhattál.</p>
                          ) : (
                            <p className="text-orange-200 text-xs">📚 Nem baj! A lényeg, hogy tanultál — a valódi tudás a magyarázatokban van.</p>
                          )}
                          <button
                            onClick={() => completeBuyKnowledge(selectedKnowledge.id)}
                            disabled={!canAfford || knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500
                                       text-white font-semibold py-2.5 rounded-xl transition-colors"
                          >
                            {knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND
                              ? '📚 Ebben a körben már eleget tanultál'
                              : selectedKnowledge.price === 0
                              ? '✅ Megtanultam! (ingyenes)'
                              : `✅ Megszerzem a tudást: ${formatHUF(selectedKnowledge.price)}`}
                          </button>
                        </div>
                      )}

                      {/* Normál vásárlás gomb (ha nincs kvíz vagy nincs aktív kvíz) */}
                      {!(quizState && quizState.cardId === selectedKnowledge.id) && (
                        <button
                          onClick={() => handleBuyKnowledge(selectedKnowledge.id)}
                          disabled={!canAfford || knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND}
                          className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700 disabled:text-gray-500
                                     text-white font-semibold py-2.5 rounded-xl transition-colors"
                        >
                          {knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND
                            ? '📚 Ebben a körben már eleget tanultál'
                            : !canAfford
                            ? 'Nincs elég pénzed'
                            : selectedKnowledge.quiz && selectedKnowledge.quiz.length > 0
                            ? `📝 Tudáspróba indítása (${selectedKnowledge.price === 0 ? 'ingyenes' : formatHUF(selectedKnowledge.price)})`
                            : selectedKnowledge.price === 0
                            ? 'Megtanulom (ingyenes)'
                            : `Megveszem: ${formatHUF(selectedKnowledge.price)}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Skip button */}
      <button
        onClick={() => setPhase('round_fate')}
        className="pulse-cta w-full mt-3 bg-brand-600 hover:bg-brand-500
                   text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        Tovább a Sorsfordítóhoz →
      </button>
    </div>
  );
}

function CrisisPhase() {
  const setPhase = useGameStore((s) => s.setPhase);

  return (
    <div className="game-card card-type-fate">
      <h3 className="font-display text-lg font-semibold mb-2 text-card-fate">
        ⚠️ Pénzügyi válság!
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Az egyenleged 0 alá ment. Döntened kell, hogyan oldod meg.
      </p>
      <button
        onClick={() => setPhase('round_summary')}
        className="w-full bg-card-fate hover:bg-card-fate/80 text-white
                   font-semibold py-3 rounded-xl transition-colors"
      >
        Válságkezelés →
      </button>
    </div>
  );
}

/** Unlock ID-ból olvasható nevet csinál */
function resolveUnlockName(id: string): string {
  // Befektetés ID → név
  const inv = INVESTMENT_OPTIONS.find((o) => o.id === id);
  if (inv) return inv.name;

  // Ismert döntés-kulcsok
  const decisionNames: Record<string, string> = {
    'decision-csok': 'CSOK pályázat',
    'decision-home-purchase': 'Lakásvásárlás',
  };
  if (decisionNames[id]) return decisionNames[id];

  // Fallback: ID-ból csinál olvashatót
  return id.replace(/^(inv-|decision-)/, '').replace(/-/g, ' ');
}

function formatGameDate(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const months = [
    'jan.', 'feb.', 'márc.', 'ápr.', 'máj.', 'jún.',
    'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.',
  ];
  return `${year}. ${months[parseInt(month) - 1]}`;
}


// --- Táblás mód ---

function isBoardDone(game: GameState): boolean {
  if (game.board?.awaitingContinue) return false;
  const b = game.board ?? emptyBoard();
  if (b.rolledRound !== game.currentRound) return false;
  const field = BOARD[b.position].type;
  const card = cardForField(field, b.visits[field] ?? 0);
  return !card || b.resolvedRound === game.currentRound;
}

function BoardLayer() {
  const game = useGameStore((s) => s.game);
  const [expanded, setExpanded] = useState(false);
  if (!game) return null;
  const player = game.players[game.activePlayerIndex];
  const b = game.board ?? emptyBoard();
  const rolledNow = b.rolledRound === game.currentRound;
  const field = BOARD[b.position];
  const visit = b.visits[field.type] ?? 0;
  const card = rolledNow ? cardForField(field.type, visit) : undefined;
  const cardOpen = !!card && b.resolvedRound !== game.currentRound;

  // 1) Dobás előtt és közvetlenül utána: a tábla kinyílik, a bábu lép, a célmező kiemelt
  if (!rolledNow || b.awaitingContinue) {
    return (
      <section className="space-y-3" aria-label="Tábla">
        <BoardFull position={b.position} highlight={rolledNow ? b.position : undefined} pawnLabel={player.name} />
        <div className="sticky bottom-3 z-10 space-y-2">
          {!rolledNow ? (
            <DiceButton onRoll={rollBoard} />
          ) : (
            <>
              <div className="rounded-xl px-3 py-2 text-sm border border-white/10" style={{ background: "#0E1525" }}>
                Dobtál: <b>{b.lastRoll}</b> → <b>{FIELD_LABELS[field.type]}</b> mező
              </div>
              <button onClick={continueBoard} className="pulse-cta w-full h-14 rounded-2xl font-extrabold text-lg"
                style={{ background: '#F2A33A', color: '#0E1525' }}>
                Tovább
              </button>
            </>
          )}
        </div>
      </section>
    );
  }

  // 2) Mezőkártya: a szöveg kerül előre, a tábla sávvá zsugorodik
  if (cardOpen && card) {
    const hasKnowledge = !!card.highlightWithKnowledge && player.financialSheet.acquiredKnowledge.includes(card.highlightWithKnowledge);
    return (
      <section className="space-y-3">
        {expanded ? <BoardFull position={b.position} highlight={b.position} pawnLabel={player.name} /> : <BoardStrip position={b.position} onExpand={() => setExpanded(true)} />}
        <p className="text-xs text-[var(--color-text-muted)]">Dobtál: <b>{b.lastRoll}</b></p>
        <FieldCardView card={card} hasKnowledge={hasKnowledge} onChoose={(o) => { resolveFieldCard(field.type, o); setExpanded(false); }} />
      </section>
    );
  }

  // 3) A kör többi része: keskeny sáv + a mező üzenete
  return (
    <section className="space-y-2">
      {expanded
        ? <div className="space-y-2"><BoardFull position={b.position} highlight={b.position} pawnLabel={player.name} />
            <button onClick={() => setExpanded(false)} className="w-full h-10 rounded-lg text-sm font-semibold bg-white/5">Tábla bezárása</button></div>
        : <BoardStrip position={b.position} onExpand={() => setExpanded(true)} />}
      {b.lastOutcome
        ? <div role="status" className="rounded-xl px-4 py-3 text-base leading-snug font-medium border border-amber-400/40 bg-amber-400/10">{b.lastOutcome}</div>
        : FIELD_HINTS[field.type] && <div className="rounded-xl px-3 py-2 text-xs bg-white/5">Dobtál: <b>{b.lastRoll}</b> · {FIELD_HINTS[field.type]}</div>}
    </section>
  );
}


/** Játékmenü: új játék indítása (teszteléshez is), megerősítéssel */
function GameMenu() {
  const resetGame = useGameStore((s) => s.resetGame);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="relative">
      <button aria-label="Menü" aria-expanded={open} onClick={() => { setOpen((o) => !o); setConfirm(false); }}
        className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-60 rounded-xl border border-white/10 bg-[#172036] p-2 shadow-xl">
          {!confirm ? (
            <button onClick={() => setConfirm(true)} className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 text-sm font-semibold">
              Új játék indítása
            </button>
          ) : (
            <div className="p-2 space-y-2">
              <p className="text-sm">Biztosan újrakezded? A mostani játék elvész.</p>
              <div className="flex gap-2">
                <button onClick={() => { resetGame(); setOpen(false); }} className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-bold">Igen, újra</button>
                <button onClick={() => setConfirm(false)} className="flex-1 h-10 rounded-lg bg-white/10 text-sm">Mégse</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
