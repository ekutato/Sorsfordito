'use client';

import { useEffect, useRef, useState } from 'react';
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
import { BOARD, FIELD_LABELS, FIELD_EXPLAIN, districtOf, type FieldType } from '@/data/board';
import { cardForField, FIELD_HINTS, type SharedDeck } from '@/data/field-cards';
import { bonusCardFor, fieldBonus, type FieldBonus } from '@/data/bonus-cards';
import { rollBoard, resolveFieldCard, emptyBoard, continueBoard, acknowledgeOutcome } from '@/store/board-actions';
import { BoardFull, BoardStrip, BoardLegend, DiceButton } from '@/ui/board/BoardView';
import { FieldCardView, FieldOutcomeView, CardFlip } from '@/ui/board/FieldCardView';
import { VersionTag } from '@/ui/components/AppVersion';
import { gameRules } from '@/store/settings-store';
import { fillDeep } from '@/data/live/vars';
import { DiceInfo } from '@/ui/board/DiceInfo';
import { DieFace, LandingDie } from '@/ui/board/Die';
import type { GameRules, DiceRollSource, SoloBoardState } from '@/types/game';
import { SettingsPanel, SoundQuickToggle } from '@/ui/components/SettingsPanel';
import { ScrollTarget } from '@/ui/components/ScrollTarget';
import { BalanceHighlight } from '@/ui/components/MoneyOverview';
import { monthlyInvestmentIncome, investmentTarget } from '@/engine/investment-income';
import { LiveDataPanel, weekLabel } from '@/ui/components/LiveDataPanel';
import { TableBar } from '@/ui/table/TableBar';
import { useTableStore } from '@/store/table-store';
import { displayColor } from '@/engine/table/state';
import { getDecisionsFor } from '@/data/decisions';
import { planRoundIncome, planRoundExpenses } from '@/engine/round-money';
import { MoneyDelta } from '@/ui/components/Money';
import { drawOffers, knowledgeLinks, type OfferContext } from '@/engine/offers';
import { cardDrawInfo } from '@/data/field-cards';
import { LEVEL_LABEL, levelOf, knowledgeEffects } from '@/data/knowledge-tree';


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
      <div className="sticky sticky-safe z-20 backdrop-blur-sm px-4 pt-3 pb-2" style={{ background: 'var(--color-bg)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-[var(--color-text-muted)]">
            {gameRules(game.config).testMode && <span className="mr-1.5 text-xs font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-[#0E1525]">TESZT</span>}
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
        {/* Asztali játék: ki hol tart, reakciók */}
        {game.config.table && <TableBar />}

        {/* Táblás mód: dobás → mezőkártya → a kör megszokott menete */}
        <BoardLayer />

        {/* Induló kontextus: lokáció + gazdasági helyzet (1. kör, bevétel fázis) */}
        {game.currentRound === 1 && game.phase === 'round_income' && boardDone && (() => {
          const preset = LIFE_SITUATION_PRESETS[player.lifeSituation as LifeSituationId];
          const loc = preset?.location;
          const fs = player.financialSheet;
          return (
            <div className="space-y-2">
              <BalanceHighlight label="Induló egyenleged" after={fs.startBalance ?? fs.balance}
                note={`Havi bevétel: ${formatHUF(fs.computed.totalIncome)} · havi kiadás: ${formatHUF(fs.computed.totalExpenses)} · szabad pénz: ${formatHUF(fs.computed.freeCashflow)}/hó`} />
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
  const rules = gameRules(game.config);
  const canEditIncomeExpense = rules.allowIncomeExpenseEdit || rules.testMode;

  // Minimum bér (nettó, 2026)
  const MIN_WAGE_NET = 214_000;

  // Előző kör egyszeri tranzakciói (döntések, sorsfordítók, befektetések)
  const prevRoundEvents = isIncome && game.currentRound > 1
    ? (game.eventLog ?? []).filter(
        (e) =>
          e.round === game.currentRound - 1 &&
          (e.type === 'decision' || e.type === 'fate' || e.type === 'investment' || e.type === 'knowledge' || e.type === 'field') &&
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

  // A kör terve: pontosan ezt könyveli a játék (éves emelés, 25. születésnap, infláció, lejáró hitel)
  const incomePlan = planRoundIncome(game);
  const expensePlan = planRoundExpenses(game);
  const incomeItems = [
    {
      label: incomePlan.raise > 0 ? 'Munkabér (nettó, +5% éves emeléssel)' : incomePlan.birthdayDelta !== 0 ? 'Munkabér (nettó, 25 évesen már SZJA-val)' : 'Munkabér (nettó)',
      amount: incomePlan.salary,
    },
    { label: 'Passzív jövedelem', amount: incomePlan.passive },
  ].filter((item) => item.amount > 0);
  const totalIncome = incomePlan.salary + incomePlan.passive;

  const ex = expensePlan.expenses;
  const expenseItems = [
    { label: 'Lakhatás', amount: ex.housing },
    { label: 'Rezsi', amount: ex.utilities },
    { label: 'Élelmiszer', amount: ex.food },
    { label: 'Közlekedés', amount: ex.transport },
    { label: 'Hiteltörlesztés', amount: ex.loanPayments },
    { label: 'Egyéb', amount: ex.other },
  ].filter((item) => item.amount > 0);
  const totalExpenses = expensePlan.monthly;

  const items = isIncome ? incomeItems : expenseItems;
  // A kör ennyi hónapot fed le (Maraton: 3, Ultra: 6) - a levonás és az előnézet ugyanezzel számol
  const monthsInRound = TIME_SCALE_CONFIGS[game.config.timeScale].monthsPerRound;
  const monthly = isIncome ? totalIncome : totalExpenses;
  const total = monthly * monthsInRound;
  const refund = isIncome ? 0 : expensePlan.refund;

  return (
    <div className={`game-card ${isIncome ? 'border-money-positive/30 border' : 'border-money-negative/30 border'}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-lg font-semibold">
          {isIncome ? '💰 Bevételek' : '💸 Kiadások'}
        </h3>
        {/* Testreszabás gomb - csak játékmesteri engedéllyel ("Valós helyzet modellezése") vagy tesztmódban */}
        {canEditIncomeExpense && game.currentRound <= 2 && !isEditing && (
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
        Egyenleg: <span className={`font-mono font-semibold ${sheet.balance < 0 ? 'text-money-negative' : 'text-white'}`}>{formatHUF(sheet.balance)}</span>
      </p>
      {!canEditIncomeExpense && game.currentRound === 1 && (
        <p className="text-xs text-[var(--color-text-muted)] -mt-2 mb-3">
          Egyenlő esélyű játék: a {isIncome ? 'bevételed' : 'kiadásod'} a döntéseidből alakul.
        </p>
      )}

      {/* Előző kör egyszeri tranzakciói */}
      {prevRoundEvents.length > 0 && (
        <div className="rounded-xl p-3 mb-3 bg-white/5 border border-white/10">
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">
            📋 Előző kör tranzakciói
          </h4>
          {prevRoundEvents.map((evt, i) => {
            const amount = evt.financialImpact!;
            return (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <span className="text-xs text-[var(--color-text-muted)] flex-1 pr-2">
                  {evt.description}
                </span>
                <MoneyDelta amount={amount} className="text-xs font-semibold whitespace-nowrap" />
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
                {isIncome ? '+' : '\u2212'}{formatHUF(item.amount)}
              </span>
            </div>
          ))}

          {/* Összesítő sor */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/20">
            <span className="text-sm font-semibold text-white">{monthsInRound > 1 ? `Összesen (${monthsInRound} hónap × ${formatHUF(monthly)})` : 'Összesen'}</span>
            <span className={`font-mono text-base font-bold ${
              isIncome ? 'text-money-positive' : 'text-money-negative'
            }`}>
              {isIncome ? '+' : '\u2212'}{formatHUF(total)}
            </span>
          </div>
        </div>
      )}

      {/* Új egyenleg előnézet */}
      {!isEditing && (
        <>
          {isIncome && incomePlan.loanDraw > 0 && (
            <p className="text-center text-xs text-amber-300 mb-1">Diákhitel-folyósítás: +{formatHUF(incomePlan.loanDraw)} a számládra - ez nem bevétel, ennyivel nő a tartozásod.</p>
          )}
          {refund > 0 && (
            <p className="text-center text-xs text-money-positive mb-1">Lejár egy hitel: a túlfizetett részlet visszajár, +{formatHUF(refund)}</p>
          )}
          <div className="text-center text-xs text-[var(--color-text-muted)] mb-3">
            Új egyenleg: <span className="font-mono font-semibold text-white">
              {formatHUF(isIncome ? sheet.balance + total + incomePlan.loanDraw : sheet.balance - total + refund)}
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
  // Ebben a körben megszerzett tudások (a megnyílt befektetés jelzéséhez)
  const [unlockedHere, setUnlockedHere] = useState<string[]>([]);
  // Körönkénti limit: 1 befektetés + 2 tudáskártya (a játéknaplóból számolva, így elnavigálással sem kijátszható)
  // A mező bónuszt ad: Tudás mezőn +1 tudás, Befektetés mezőn +1 befektetés és bővebb piac
  const bonus = game ? roundBonus(game) : fieldBonus(undefined);
  const MAX_KNOWLEDGE_PER_ROUND = bonus.knowledgeLimit;
  const MAX_INVEST_PER_ROUND = bonus.investLimit;

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

  // Mint egy táblajátékban: nem a teljes piac látszik, hanem körönként néhány húzott lap - a kör helyzetéhez igazítva
  // (a lépett negyed, a kör döntése, a döntésekkel feloldott befektetések, a nem kivédett csapda).
  // A húzás körönként állandó (a játék és a kör azonosítójából), így újratöltéskor sem változik.
  const deckInvest = INVESTMENT_OPTIONS.filter((inv) => !ownedInvestmentIds.includes(inv.id) && inv.tier === 'free');
  const deckKnowledge = KNOWLEDGE_CARDS.filter((k) => !ownedKnowledgeIds.includes(k.id) && k.tier === 'free');
  const offers = drawOffers({
    gameId: game.gameId, round: game.currentRound,
    ownedInvestments: ownedInvestmentIds, ownedKnowledge: ownedKnowledgeIds,
    investOffers: bonus.investOffers, knowledgeOffers: bonus.knowledgeOffers,
    ...offerContext(game),
  });
  const availableInvestments = offers.investments;
  const availableKnowledge = offers.knowledge;
  // A piac és a Tudás fül összekötése: a zárt befektetéshez vezető tudás a másik fülön kiemelve
  const links = knowledgeLinks(offers, ownedKnowledgeIds);
  const knowledgeLimitLeft = knowledgeBoughtThisRound < MAX_KNOWLEDGE_PER_ROUND;
  // Csak az számít most elérhetőnek, amire van keret és fedezet
  const canLearn = (id: string) => {
    const k = availableKnowledge.find((x) => x.id === id);
    return !!k && knowledgeLimitLeft && (k.price === 0 || balance >= k.price);
  };
  const linkedKnowledgeCount = Object.keys(links.unlocks).filter(canLearn).length;
  // Ha a Tudás fülön épp megnyílt egy befektetés, a Heti piac gomb jelez
  const investLimitLeft = investBoughtThisRound < MAX_INVEST_PER_ROUND;
  const openedNow = investLimitLeft ? availableInvestments.filter((inv) => inv.requiredKnowledge && unlockedHere.includes(inv.requiredKnowledge) && ownedKnowledgeIds.includes(inv.requiredKnowledge)) : [];
  const goToKnowledge = (id: string) => {
    setTab('knowledge'); setSelectedId(id); setQuizState(null);
    setTimeout(() => document.getElementById(`know-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const goToInvestment = (id: string) => {
    setTab('invest'); setSelectedId(id); setQuizState(null);
    setTimeout(() => document.getElementById(`inv-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

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
      monthlyIncome: monthlyInvestmentIncome(option),
      incomeTarget: investmentTarget(option),
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
    setUnlockedHere((u) => [...u, card.id]);
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
        Egyenleg: <span className={`font-mono font-semibold ${balance < 0 ? 'text-money-negative' : 'text-white'}`}>{formatHUF(balance)}</span>
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
          } ${tab !== 'invest' && openedNow.length > 0 ? 'pulse-cta ring-1 ring-yellow-400/70' : ''}`}
        >
          💰 Heti piac ({availableInvestments.length}){tab !== 'invest' && openedNow.length > 0 && <span className="text-yellow-300"> 🔓{openedNow.length}</span>}
        </button>
        <button
          onClick={() => { setTab('knowledge'); setSelectedId(null); setQuizState(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'knowledge'
              ? 'bg-brand-600 text-white'
              : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
          } ${tab !== 'knowledge' && linkedKnowledgeCount > 0 ? 'pulse-cta ring-1 ring-yellow-400/70' : ''}`}
          title={linkedKnowledgeCount > 0 ? 'Itt szerezheted meg a piac zárt befektetéséhez kellő tudást' : undefined}
        >
          📚 Tudás ({availableKnowledge.length}){tab !== 'knowledge' && linkedKnowledgeCount > 0 && <span className="text-yellow-300"> 🔓{linkedKnowledgeCount}</span>}
        </button>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Ebben a körben ezeket a lapokat húztad. A paklikban még {Math.max(0, deckInvest.length - availableInvestments.length)} befektetés és {Math.max(0, deckKnowledge.length - availableKnowledge.length)} tudáskártya vár. Ebben a körben {MAX_INVEST_PER_ROUND} befektetést és {MAX_KNOWLEDGE_PER_ROUND} tudást szerezhetsz{bonus.investLimit > 1 ? ' (Befektetés mező bónusz)' : bonus.knowledgeLimit > 2 ? ' (Tudás mező bónusz)' : ''}.
      </p>

      {/* Investment options list */}
      {tab === 'invest' && (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {investBoughtThisRound >= MAX_INVEST_PER_ROUND && (
            <div className="bg-brand-600/10 border border-brand-500/30 rounded-xl px-3 py-2 mb-1 text-xs text-brand-300">
              📦 Ebben a körben ennyi befektetés lehetséges. A következő körben újra vásárolhatsz.
            </div>
          )}
          {availableInvestments.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              Nincs elérhető új befektetés
            </p>
          ) : (
            availableInvestments.map((inv, i) => {
              const canAfford = balance >= inv.entryPrice;
              const needsKnowledge = inv.requiredKnowledge && !ownedKnowledgeIds.includes(inv.requiredKnowledge);
              const isSelected = selectedId === inv.id;
              const buyable = canAfford && !needsKnowledge && investBoughtThisRound < MAX_INVEST_PER_ROUND && !isSelected;
              // A tudáshoz vezető sáv ne halványuljon el (az a teendő)
              const lockStep = links.locks[inv.id] ? (links.locks[inv.id].stepId ?? links.locks[inv.id].needId) : '';
              const liveLock = !!needsKnowledge && !!links.locks[inv.id]?.offered && canLearn(lockStep);

              return (
                <div key={inv.id} id={`inv-${inv.id}`}>
                  <button
                    onClick={() => setSelectedId(isSelected ? null : inv.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 border border-brand-500/50'
                        : 'bg-[var(--color-bg-elevated)] hover:bg-white/5 border border-transparent'
                    } ${(!canAfford || needsKnowledge) && !liveLock ? 'opacity-60' : ''} ${buyable ? 'pulse-card' : ''}`}
                    style={buyable ? { animationDelay: `${i * 0.4}s` } : undefined}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-semibold text-sm"><GlossaryText text={inv.name} /></span>
                      </div>
                      <span className="text-xs font-mono text-right">
                        <span className="text-white">Ár: {formatHUF(inv.entryPrice)}</span>
                        {!canAfford && <span className="block text-money-negative">nincs fedezet</span>}
                      </span>
                    </div>
                    {offers.reasons[inv.id] && <p className="text-xs text-sky-300 mt-1">{offers.reasons[inv.id]}</p>}
                    {needsKnowledge && (() => {
                      const lock = links.locks[inv.id];
                      if (!lock) return null;
                      const target = lock.stepId ?? lock.needId;
                      const live = liveLock;
                      const stepCard = availableKnowledge.find((x) => x.id === target);
                      return (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); if (lock.offered) goToKnowledge(target); }}
                          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && lock.offered) { e.preventDefault(); e.stopPropagation(); goToKnowledge(target); } }}
                          className={`mt-2 block rounded-lg border px-2.5 py-1.5 text-xs leading-snug ${
                            live ? 'border-yellow-400/60 bg-yellow-500/15 text-yellow-200 pulse-cta cursor-pointer' : 'border-white/10 bg-white/5 text-[var(--color-text-muted)]'
                          }`}
                        >
                          🔒 Kell hozzá ez a tudáskártya: <b>„{lock.needName}”</b>
                          {lock.stepName && <>; előbb az alapja: <b>„{lock.stepName}”</b></>}
                          <span className="block">
                            {!lock.offered
                              ? 'Ebben a körben nincs a Tudás fülön, egy későbbi körben jöhet.'
                              : !knowledgeLimitLeft
                              ? 'A Tudás fülön van, de ebben a körben már nem tanulhatsz többet.'
                              : !live && stepCard
                              ? `A Tudás fülön van (${formatHUF(stepCard.price)}), de most nincs rá fedezeted →`
                              : 'Most megszerezheted a 📚 Tudás fülön →'}
                          </span>
                        </span>
                      );
                    })()}
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {(() => {
                        const m = monthlyInvestmentIncome(inv);
                        if (m <= 0) return 'Árfolyam alapú hozam (havi jövedelmet nem ad)';
                        const t = investmentTarget(inv);
                        return t === 'salary' ? `+${formatHUF(m)}/hó a fizetésedhez`
                          : t === 'utilities' ? `+${formatHUF(m)}/hó (ennyivel kisebb a rezsi)`
                          : `+${formatHUF(m)}/hó passzív jövedelem${inv.id === 'inv-bank-deposit' ? ' (28% kamatadó után)' : ''}`;
                      })()}
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
                          ? '📦 Ebben a körben ennyi befektetés lehetséges'
                          : !canAfford
                          ? 'Nincs elég pénzed'
                          : needsKnowledge
                          ? `🔒 Előbb szerezd meg: ${links.locks[selectedInvestment.id]?.stepName ?? links.locks[selectedInvestment.id]?.needName ?? 'a tudáskártyát'}`
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
          {openedNow.map((inv) => (
            <button key={inv.id} onClick={() => goToInvestment(inv.id)}
              className="pulse-cta w-full text-left bg-green-900/40 border border-green-500/40 rounded-xl px-3 py-2 text-sm text-green-200">
              🔓 Megnyílt a Heti piacon: <b>{inv.name}</b> - megnézem →
            </button>
          ))}
          {knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND && (
            <div className="bg-brand-600/10 border border-brand-500/30 rounded-xl px-3 py-2 mb-1 text-xs text-brand-300">
              📚 Ebben a körben ennyi tanulás lehetséges. A következő körben új lapokat húzol.
            </div>
          )}
          {availableKnowledge.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              Minden tudás kártya megvan!
            </p>
          ) : (
            availableKnowledge.map((card, i) => {
              const canAfford = card.price === 0 || balance >= card.price;
              const isSelected = selectedId === card.id;
              const buyable = canAfford && knowledgeBoughtThisRound < MAX_KNOWLEDGE_PER_ROUND && !isSelected;
              const opens = links.unlocks[card.id] ?? [];

              return (
                <div key={card.id} id={`know-${card.id}`}>
                  <button
                    onClick={() => { setSelectedId(isSelected ? null : card.id); if (!isSelected) setQuizState(null); }}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 border border-brand-500/50'
                        : opens.length > 0 ? 'bg-[var(--color-bg-elevated)] hover:bg-white/5 border border-yellow-400/60'
                        : 'bg-[var(--color-bg-elevated)] hover:bg-white/5 border border-transparent'
                    } ${!canAfford ? 'opacity-60' : ''} ${buyable ? 'pulse-card' : ''}`}
                    style={buyable ? { animationDelay: `${i * 0.4}s` } : undefined}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm"><GlossaryText text={card.name} /></span>
                      <span className="text-xs font-mono text-right">
                        <span className={card.price === 0 ? 'text-money-positive' : 'text-white'}>{card.price === 0 ? 'INGYENES' : `Ár: ${formatHUF(card.price)}`}</span>
                        {card.price > 0 && !canAfford && <span className="block text-money-negative">nincs fedezet</span>}
                      </span>
                    </div>
                    <p className="text-xs mt-1">
                      <span className="rounded px-1.5 py-0.5 mr-1 font-bold bg-white/10">{LEVEL_LABEL[levelOf(card.id)]}</span>
                      {opens.length === 0 && offers.reasons[card.id] && <span className="text-sky-300">{offers.reasons[card.id]}</span>}
                    </p>
                    {opens.length > 0 && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); goToInvestment(opens[0].investmentId); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); goToInvestment(opens[0].investmentId); } }}
                        className="mt-1.5 block rounded-lg border border-yellow-400/60 bg-yellow-500/15 px-2.5 py-1.5 text-xs leading-snug text-yellow-200 cursor-pointer"
                      >
                        🔓 {opens.every((o) => o.direct) ? 'Feloldja a Heti piacon' : 'Az első lépés ehhez a Heti piacon'}: <b>{opens.map((o) => o.name).join(', ')}</b> ←
                      </span>
                    )}
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {knowledgeEffects(card.id).join(' · ') || 'Alapismeret: a sorskártyák tudáspróbáin és a döntéseidnél segít.'}
                    </p>
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
                            <ScrollTarget key={`q-${quizState.currentQ}`}>
                              <button
                                onClick={handleQuizNext}
                                className="pulse-cta w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
                              >
                                {quizState.currentQ + 1 < (selectedKnowledge.quiz?.length ?? 0)
                                  ? 'Következő kérdés →'
                                  : 'Eredmény megtekintése'}
                              </button>
                            </ScrollTarget>
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
                          <ScrollTarget>
                          <button
                            onClick={() => completeBuyKnowledge(selectedKnowledge.id)}
                            disabled={!canAfford || knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND}
                            className="pulse-cta w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500
                                       text-white font-semibold py-2.5 rounded-xl transition-colors"
                          >
                            {knowledgeBoughtThisRound >= MAX_KNOWLEDGE_PER_ROUND
                              ? '📚 Ebben a körben ennyi tanulás lehetséges'
                              : selectedKnowledge.price === 0
                              ? '✅ Megtanultam! (ingyenes)'
                              : `✅ Megszerzem a tudást: ${formatHUF(selectedKnowledge.price)}`}
                          </button>
                          </ScrollTarget>
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
                            ? '📚 Ebben a körben ennyi tanulás lehetséges'
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

function formatGameDate(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const months = [
    'jan.', 'feb.', 'márc.', 'ápr.', 'máj.', 'jún.',
    'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.',
  ];
  return `${year}. ${months[parseInt(month) - 1]}`;
}


// --- Táblás mód ---

/** Asztali játékban a közös pakli adatai (a játékosszám az asztalról, élőben) */
function sharedDeckOf(game: GameState): SharedDeck | undefined {
  const t = game.config.table;
  if (!t || t.deckSeed === undefined || t.slot === undefined) return undefined;
  const players = useTableStore.getState().table?.players.length ?? game.config.playerCount;
  return { seed: t.deckSeed, slot: t.slot, players };
}

/** A heti piac helyzete: lépett negyed, a kör döntésének témája, feloldott befektetések, nem kivédett csapdák */
function offerContext(game: GameState): Pick<OfferContext, 'district' | 'decisionCategory' | 'unlockedInvestments' | 'missedTrapKnowledge'> {
  const player = game.players[game.activePlayerIndex];
  const decisions = getDecisionsFor(player.lifeSituation as LifeSituationId, game.config.timeScale);
  const chosen = game.eventLog.filter((e) => e.type === 'decision' && e.details?.decisionCardId);
  const thisRound = chosen.filter((e) => e.round === game.currentRound).map((e) => decisions.find((d) => d.id === e.details!.decisionCardId)).find(Boolean);
  const unlockedInvestments = chosen.flatMap((e) => {
    const d = decisions.find((x) => x.id === e.details!.decisionCardId);
    return d?.options.find((o) => o.id === e.details!.optionId)?.unlocksInvestment ?? [];
  });
  const missedTrapKnowledge = game.eventLog
    .filter((e) => e.type === 'field' && (e.financialImpact ?? 0) < 0 && typeof e.details?.knowledge === 'string')
    .map((e) => e.details!.knowledge as string);
  return { district: BOARD[game.board?.position ?? 0]?.district, decisionCategory: thisRound?.category, unlockedInvestments, missedTrapKnowledge };
}

/** A kör lapja a lépett mezőn: mezőkártya, vagy a Tudás/Befektetés mező bónuszlapja */
function roundCardFor(game: GameState, field: FieldType, visit: number) {
  const owned = game.players[game.activePlayerIndex]?.financialSheet.acquiredKnowledge ?? [];
  const sheet = game.players[game.activePlayerIndex]?.financialSheet;
  const ctx = sheet ? { preset: game.players[game.activePlayerIndex].lifeSituation, housing: sheet.expenses.housing, investments: sheet.investments.map((i) => i.optionId), salary: sheet.income.salary } : undefined;
  return cardForField(field, visit, game.gameId, sharedDeckOf(game), ctx) ?? bonusCardFor(field, visit, game.gameId, owned, BOARD[game.board?.position ?? 0]?.district);
}

/** A kör mezőbónusza (a tudás- és befektetési keretekhez) */
function roundBonus(game: GameState): FieldBonus {
  const b = game.board;
  return fieldBonus(b && b.rolledRound === game.currentRound ? BOARD[b.position].type : undefined);
}

function isBoardDone(game: GameState): boolean {
  if (game.board?.awaitingContinue || game.board?.awaitingOutcomeAck) return false;
  const b = game.board ?? emptyBoard();
  if (b.rolledRound !== game.currentRound) return false;
  const field = BOARD[b.position].type;
  const card = roundCardFor(game, field, b.visits[field] ?? 0);
  return !card || b.resolvedRound === game.currentRound;
}

/** A többi játékos bábuja a táblán (asztali játékban) */
function useOtherPawns() {
  const table = useTableStore((s) => s.table);
  const me = useTableStore((s) => s.playerId);
  return (table?.players ?? []).filter((p) => p.id !== me && p.report).map((p) => ({ position: p.position, color: displayColor(p), label: p.name }));
}

/** A saját bábu színe: asztalnál a lobbyban választott szín, egyébként az alapszín */
function useMyPawnColor(): string | undefined {
  const table = useTableStore((s) => s.table);
  const me = useTableStore((s) => s.playerId);
  const p = table?.players.find((x) => x.id === me);
  return p?.color || undefined;
}

function BoardLayer() {
  const game = useGameStore((s) => s.game);
  const others = useOtherPawns();
  const myColor = useMyPawnColor();
  const [expanded, setExpanded] = useState(false);
  if (!game) return null;
  const rules = gameRules(game.config);
  const player = game.players[game.activePlayerIndex];
  const b = game.board ?? emptyBoard();
  const rolledNow = b.rolledRound === game.currentRound;
  const field = BOARD[b.position];
  const visit = b.visits[field.type] ?? 0;
  const rawCard = rolledNow ? roundCardFor(game, field.type, visit) : undefined;
  const card = rawCard ? fillDeep(rawCard) : undefined;
  const cardOpen = !!card && b.resolvedRound !== game.currentRound;

  // 1) Dobás előtt és közvetlenül utána: a tábla kinyílik (egy képernyőn), a bábu mezőről
  //    mezőre lép, a célmezőből kiemelkedik a kártya
  if (!rolledNow || b.awaitingContinue) {
    return (
      <BoardOpen key={`${game.currentRound}-${b.rolledRound ?? 'x'}-${b.position}`}
        rolledNow={rolledNow} b={b} field={field} hasCard={!!card} playerName={player.name} rules={rules} others={others} />
    );
  }

  // 2) Mezőkártya: a szöveg kerül előre, a tábla sávvá zsugorodik
  if (cardOpen && card) {
    const hasKnowledge = !!card.highlightWithKnowledge && player.financialSheet.acquiredKnowledge.includes(card.highlightWithKnowledge);
    return (
      <section className="space-y-3">
        {expanded ? <BoardFull others={others} pawnColor={myColor} position={b.position} highlight={b.position} pawnLabel={player.name} /> : <BoardStrip pawnColor={myColor} position={b.position} onExpand={() => setExpanded(true)} />}
        {b.lastRoll ? <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]"><DieFace value={b.lastRoll} size={28} /> Dobtál: <b>{b.lastRoll}</b> · {FIELD_LABELS[field.type]}, {districtOf(field.index).label}</p> : null}
        <CardFlip key={`flip-${game.currentRound}-${card.id}`} field={card.field} district={districtOf(field.index).label}
          deck={cardDrawInfo(field.type, b.visits[field.type] ?? 0, sharedDeckOf(game))}
          sharedSeat={sharedDeckOf(game) ? { slot: sharedDeckOf(game)!.slot, players: sharedDeckOf(game)!.players } : undefined}>
          <FieldCardView card={card} hasKnowledge={hasKnowledge} balance={player.financialSheet.balance} trapSeconds={rules.trapTimerSeconds}
            onChoose={(o) => { if (resolveFieldCard(field.type, o, card)) setExpanded(false); }} />
        </CardFlip>
      </section>
    );
  }

  // 2/B) Eredménylap a kártya helyén, nagy betűvel - a kör a "Tovább" után folytatódik
  if (b.awaitingOutcomeAck && b.lastResult && b.lastOutcome) {
    return (
      <section className="space-y-3">
        {expanded ? <BoardFull others={others} pawnColor={myColor} position={b.position} highlight={b.position} pawnLabel={player.name} /> : <BoardStrip pawnColor={myColor} position={b.position} onExpand={() => setExpanded(true)} />}
        <FieldOutcomeView result={b.lastResult} outcome={b.lastOutcome} onContinue={() => { acknowledgeOutcome(); setExpanded(false); }} />
      </section>
    );
  }

  // 3) A kör többi része: keskeny sáv + a mező üzenete
  return (
    <section className="space-y-2">
      {expanded
        ? <div className="space-y-2"><BoardFull others={others} pawnColor={myColor} position={b.position} highlight={b.position} pawnLabel={player.name} />
            <button onClick={() => setExpanded(false)} className="w-full h-10 rounded-lg text-sm font-semibold bg-white/5">Tábla bezárása</button></div>
        : <BoardStrip pawnColor={myColor} position={b.position} onExpand={() => setExpanded(true)} />}
      {b.lastOutcome
        ? <div role="status" className="rounded-xl px-4 py-3 text-base leading-snug font-medium border border-amber-400/40 bg-amber-400/10">{b.lastOutcome}</div>
        : FIELD_HINTS[field.type] && <div className="rounded-xl px-3 py-2 text-sm bg-white/5">Dobtál: <b>{b.lastRoll}</b> · {FIELD_HINTS[field.type]}</div>}
    </section>
  );
}


function BoardOpen({ rolledNow, b, field, hasCard, playerName, rules, others }: {
  others: Array<{ position: number; color: string; label: string }>;
  rolledNow: boolean; b: SoloBoardState; field: (typeof BOARD)[number]; hasCard: boolean; playerName: string; rules: GameRules;
}) {
  const [arrived, setArrived] = useState(!rolledNow);
  const myColor = useMyPawnColor();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [rolledNow]);
  return (
    <section ref={ref} className="space-y-3 scroll-mt-24" aria-label="Tábla">
      <BoardFull others={others} pawnColor={myColor} position={b.position} highlight={rolledNow ? b.position : undefined}
        from={rolledNow ? b.from : undefined} reveal={rolledNow ? { field: field.type, hasCard } : undefined}
        fitViewport onArrived={() => setArrived(true)} onRevealClick={continueBoard} pawnLabel={playerName} />
      <div className="sticky bottom-3 z-10 space-y-2">
        {!rolledNow ? (
          <DiceControls rules={rules} rolls={b.rolls ?? []} />
        ) : arrived ? (
          <>
            <div className="rounded-xl px-3 py-2 flex items-center gap-3 border border-white/10" style={{ background: '#0E1525' }}>
              {b.lastRoll ? <DieFace value={b.lastRoll} size={44} /> : null}
              <p className="text-base">{b.lastRoll ? <>Dobtál: <b>{b.lastRoll}</b> → </> : null}<b>{FIELD_LABELS[field.type]}</b> · {districtOf(field.index).label}</p>
            </div>
            <button onClick={continueBoard} className="pulse-cta w-full h-14 rounded-2xl font-extrabold text-lg"
              style={{ background: '#F2A33A', color: '#0E1525' }}>
              {hasCard ? 'Felfordítom a kártyát' : 'Tovább'}
            </button>
          </>
        ) : (
          <div className="h-[76px] rounded-2xl flex items-center justify-center gap-4 text-lg font-bold" style={{ background: '#0E1525' }}>
            {b.lastRoll ? <LandingDie value={b.lastRoll} /> : null}
            <span>{b.lastRoll ? `${b.lastRoll} mezőt lépsz…` : 'Lépsz…'}</span>
          </div>
        )}
      </div>
      {!rolledNow && <BoardLegend />}
    </section>
  );
}

/** Dobás: az app véletlenje vagy saját kocka; tesztmódban kézi érték; átlátható forrás */
function DiceControls({ rules, rolls }: { rules: GameRules; rolls: Array<{ value: number; source: DiceRollSource }> }) {
  const [info, setInfo] = useState(false);
  const pick = (source: 'physical' | 'test') => (
    <div className="grid grid-cols-6 gap-1.5">
      {[1, 2, 3, 4, 5, 6].map((v) => (
        <button key={v} onClick={() => rollBoard({ value: v, source })} aria-label={`Dobott érték: ${v}`}
          className={`h-12 rounded-xl text-xl font-extrabold ${source === 'physical' ? 'pulse-cta' : ''}`}
          style={source === 'physical' ? { background: '#F2A33A', color: '#0E1525' } : { background: '#2A3550', color: '#F4F1EA' }}>
          {v}
        </button>
      ))}
    </div>
  );
  return (
    <div className="space-y-2 rounded-2xl p-2" style={{ background: '#0E1525' }}>
      {rules.diceSource === 'physical' ? (
        <>
          <p className="text-base font-bold px-1">Dobj a saját kockáddal - mennyit dobtál?</p>
          {pick('physical')}
        </>
      ) : (
        <DiceButton onRoll={rollBoard} />
      )}
      {rules.testMode && rules.diceSource !== 'physical' && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-amber-200 px-1">Teszt: kézi kockaérték</p>
          {pick('test')}
        </div>
      )}
      <button onClick={() => setInfo(true)} className="w-full text-sm underline text-[var(--color-text-muted)] py-1">
        Honnan jön a véletlen? ({rolls.length} dobás eddig)
      </button>
      {info && <DiceInfo rolls={rolls} onClose={() => setInfo(false)} />}
    </div>
  );
}

/** Játékmenü: új játék indítása (teszteléshez is), megerősítéssel */
function GameMenu() {
  const resetGame = useGameStore((s) => s.resetGame);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [settings, setSettings] = useState(false);
  const [liveData, setLiveData] = useState(false);
  return (
    <div className="relative">
      {settings && <SettingsPanel onClose={() => setSettings(false)} />}
      {liveData && <LiveDataPanel onClose={() => setLiveData(false)} />}
      <button aria-label="Menü" aria-expanded={open} onClick={() => { setOpen((o) => !o); setConfirm(false); }}
        className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-60 rounded-xl border border-white/10 bg-[#172036] p-2 shadow-xl">
          {!confirm ? (
            <>
              <button onClick={() => { setLiveData(true); setOpen(false); }} className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 text-sm font-semibold">
                Heti adatok - {weekLabel()}
              </button>
              <button onClick={() => { setSettings(true); setOpen(false); }} className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 text-sm font-semibold">
                Játékmesteri beállítások
              </button>
              <SoundQuickToggle />
              <button onClick={() => setConfirm(true)} className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 text-sm font-semibold">
                Új játék indítása
              </button>
            </>
          ) : (
            <div className="p-2 space-y-2">
              <p className="text-sm">Biztosan újrakezded? A mostani játék elvész{useTableStore.getState().role ? ', és kilépsz az asztalról' : ''}.</p>
              <div className="flex gap-2">
                <button onClick={() => { useTableStore.getState().leave(); resetGame(); setOpen(false); }} className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-bold">Igen, újra</button>
                <button onClick={() => setConfirm(false)} className="flex-1 h-10 rounded-lg bg-white/10 text-sm">Mégse</button>
              </div>
            </div>
          )}
          <div className="px-3 pt-2 pb-1 border-t border-white/10 mt-1"><VersionTag /></div>
        </div>
      )}
    </div>
  );
}
