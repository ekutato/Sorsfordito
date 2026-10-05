// ============================================================================
// PENZUGYI SORSFORDITO - Game Store
// A jatek fo allapotkezelese - Zustand store
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState,
  GamePhase,
  GameConfig,
  PlayerState,
  CharacterPresetId,
  DecisionCard,
  FateEvent,
  GameEvent,
  TimeScale,
} from '@/types/game';
import type {
  FinancialSheet,
  HUF,
  Income,
  Expenses,
  Investment,
  Debt,
  ComputedFinancials,
  PendingStoryline,
} from '@/types/financial';
import type { PreGameContext } from '@/data-sources/types';
import { CHARACTER_PRESETS } from '@/data/character-presets';
import { TIME_SCALE_CONFIGS } from '@/types/game';

// --- Seged fuggvenyek ---

function generateId(): string {
  return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function computeFinancials(sheet: FinancialSheet): ComputedFinancials {
  const totalIncome = sheet.income.salary + sheet.income.passive + sheet.income.oneTime;
  const totalExpenses =
    sheet.expenses.housing +
    sheet.expenses.utilities +
    sheet.expenses.food +
    sheet.expenses.transport +
    sheet.expenses.loanPayments +
    sheet.expenses.other;

  const investmentValue = sheet.investments.reduce(
    (sum, inv) => sum + inv.currentValue,
    0
  );
  const totalDebt = sheet.debts.reduce(
    (sum, debt) => sum + debt.remainingAmount,
    0
  );
  const netWorth = sheet.balance + investmentValue - totalDebt;

  const freeCashflow = totalIncome - totalExpenses;

  const financialFreedomPercent =
    totalExpenses > 0
      ? Math.round((sheet.income.passive / totalExpenses) * 100)
      : 0;

  const emergencyFundMonths =
    totalExpenses > 0 ? Math.round((sheet.balance / totalExpenses) * 10) / 10 : 0;

  return {
    totalIncome,
    totalExpenses,
    freeCashflow,
    investmentValue,
    totalDebt,
    netWorth,
    financialFreedomPercent,
    emergencyFundMonths,
  };
}

function createFinancialSheet(
  playerId: string,
  presetId: CharacterPresetId,
  balanceOverride?: number
): FinancialSheet {
  const preset = CHARACTER_PRESETS[presetId];
  const sf = preset.startingFinancials;

  const income: Income = {
    salary: sf.salary,
    passive: 0,
    oneTime: 0,
  };

  const expenses: Expenses = {
    housing: sf.housing,
    utilities: sf.utilities,
    food: sf.food,
    transport: sf.transport,
    loanPayments: sf.debts.reduce((sum, d) => sum + d.monthlyPayment, 0),
    other: sf.other,
  };

  const debts: Debt[] = sf.debts.map((d, i) => ({
    id: `debt-${presetId}-${i}`,
    type: d.type as Debt['type'],
    name: d.type === 'student_loan' ? 'Diákhitel 2' : 'Személyi kölcsön',
    originalAmount: d.amount,
    remainingAmount: d.amount,
    interestRate: d.interestRate,
    monthlyPayment: d.monthlyPayment,
    remainingMonths: d.monthlyPayment > 0 ? Math.ceil(d.amount / d.monthlyPayment) : 120,
    isInterestFree: d.interestRate === 0,
    repaymentStartsAtRound: d.monthlyPayment === 0 ? 6 : undefined, // DH2 torlesztes 6. kor
  }));

  const sheet: FinancialSheet = {
    playerId,
    balance: balanceOverride ?? sf.balance,
    income,
    expenses,
    investments: [],
    debts,
    acquiredKnowledge: [],
    pendingStorylines: [],
    activeOngoingEffects: [],
    computed: {} as ComputedFinancials,
    history: [],
  };

  sheet.computed = computeFinancials(sheet);
  return sheet;
}

function formatGameDate(startDate: string, round: number, monthsPerRound: number): string {
  const [year, month] = startDate.split('-').map(Number);
  const totalMonths = (month - 1) + (round - 1) * monthsPerRound;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

// --- Store ---

interface GameStoreActions {
  // Jatek eletciklus
  startNewGame: (config: GameConfig, characterPreset: CharacterPresetId, playerName: string, preGameContext?: PreGameContext, balanceOverride?: number) => void;
  setPhase: (phase: GamePhase) => void;
  advanceRound: () => void;
  endGame: () => void;
  resetGame: () => void;

  // Penzugyi muveletek
  modifyBalance: (playerId: string, amount: HUF, description: string) => void;
  modifyIncome: (playerId: string, field: keyof Income, amount: HUF) => void;
  modifyExpenses: (playerId: string, field: keyof Expenses, amount: HUF) => void;
  addInvestment: (playerId: string, investment: Investment) => void;
  removeInvestment: (playerId: string, investmentOptionId: string) => void;
  addDebt: (playerId: string, debt: Debt) => void;
  payDebt: (playerId: string, debtId: string, amount: HUF) => void;
  addKnowledge: (playerId: string, knowledgeId: string) => void;
  addStoryline: (playerId: string, storyline: PendingStoryline) => void;
  resolveStoryline: (playerId: string, storylineId: string) => void;

  // Dontes + Sorsfordito
  setCurrentDecision: (decision: DecisionCard | undefined) => void;
  setCurrentFateEvent: (event: FateEvent | undefined) => void;

  // Esemenyek logolasa
  logEvent: (event: Omit<GameEvent, 'round' | 'gameDate'>) => void;

  // Kor feldolgozas
  processRoundIncome: () => void;
  processRoundExpenses: () => void;
  processInvestmentReturns: () => void;
  processDebtPayments: () => void;
  takeFinancialSnapshot: () => void;

  // Segédfüggvények
  getActivePlayer: () => PlayerState | undefined;
  recalculateFinancials: (playerId: string) => void;
}

type GameStore = { game: GameState | null } & GameStoreActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,

      // --- Jatek eletciklus ---

      startNewGame: (config, characterPreset, playerName, preGameContext, balanceOverride) => {
        const gameId = generateId();
        const playerId = `player-1`;
        const tsConfig = TIME_SCALE_CONFIGS[config.timeScale];

        const financialSheet = createFinancialSheet(playerId, characterPreset, balanceOverride);

        const player: PlayerState = {
          playerId,
          name: playerName,
          lifeSituation: characterPreset,
          financialSheet,
          tier: 'free',
        };

        const gameState: GameState = {
          gameId,
          config,
          phase: 'round_income',
          currentRound: 1,
          currentGameDate: config.startDate,
          players: [player],
          activePlayerIndex: 0,
          eventLog: [],
          preGameContext,
        };

        set({ game: gameState });
      },

      setPhase: (phase) =>
        set((state) => ({
          game: state.game ? { ...state.game, phase } : null,
        })),

      advanceRound: () =>
        set((state) => {
          if (!state.game) return state;
          const tsConfig = TIME_SCALE_CONFIGS[state.game.config.timeScale];
          const nextRound = state.game.currentRound + 1;

          if (nextRound > tsConfig.totalRounds) {
            return {
              game: { ...state.game, phase: 'epilogue' },
            };
          }

          return {
            game: {
              ...state.game,
              currentRound: nextRound,
              currentGameDate: formatGameDate(
                state.game.config.startDate,
                nextRound,
                tsConfig.monthsPerRound
              ),
              phase: 'round_income',
              currentDecision: undefined,
              currentFateEvent: undefined,
            },
          };
        }),

      endGame: () =>
        set((state) => ({
          game: state.game ? { ...state.game, phase: 'epilogue' } : null,
        })),

      resetGame: () => set({ game: null }),

      // --- Penzugyi muveletek ---

      modifyBalance: (playerId, amount, description) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const newSheet = { ...p.financialSheet, balance: p.financialSheet.balance + amount };
            newSheet.computed = computeFinancials(newSheet);
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      modifyIncome: (playerId, field, amount) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const newIncome = { ...p.financialSheet.income, [field]: p.financialSheet.income[field] + amount };
            const newSheet = { ...p.financialSheet, income: newIncome };
            newSheet.computed = computeFinancials(newSheet);
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      modifyExpenses: (playerId, field, amount) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const newExpenses = { ...p.financialSheet.expenses, [field]: p.financialSheet.expenses[field] + amount };
            const newSheet = { ...p.financialSheet, expenses: newExpenses };
            newSheet.computed = computeFinancials(newSheet);
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      addInvestment: (playerId, investment) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const newSheet = {
              ...p.financialSheet,
              balance: p.financialSheet.balance - investment.purchasePrice,
              investments: [...p.financialSheet.investments, investment],
            };
            newSheet.computed = computeFinancials(newSheet);
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      removeInvestment: (playerId, investmentOptionId) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const inv = p.financialSheet.investments.find(
              (i) => i.optionId === investmentOptionId
            );
            if (!inv) return p;
            const newSheet = {
              ...p.financialSheet,
              balance: p.financialSheet.balance + inv.currentValue,
              investments: p.financialSheet.investments.filter(
                (i) => i.optionId !== investmentOptionId
              ),
            };
            newSheet.computed = computeFinancials(newSheet);
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      addDebt: (playerId, debt) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const newSheet = {
              ...p.financialSheet,
              balance: p.financialSheet.balance + debt.originalAmount,
              debts: [...p.financialSheet.debts, debt],
              expenses: {
                ...p.financialSheet.expenses,
                loanPayments: p.financialSheet.expenses.loanPayments + debt.monthlyPayment,
              },
            };
            newSheet.computed = computeFinancials(newSheet);
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      payDebt: (playerId, debtId, amount) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const newDebts = p.financialSheet.debts.map((d) => {
              if (d.id !== debtId) return d;
              const newRemaining = Math.max(0, d.remainingAmount - amount);
              return { ...d, remainingAmount: newRemaining };
            }).filter((d) => d.remainingAmount > 0);

            const newSheet = {
              ...p.financialSheet,
              balance: p.financialSheet.balance - amount,
              debts: newDebts,
              expenses: {
                ...p.financialSheet.expenses,
                loanPayments: newDebts.reduce((sum, d) => sum + d.monthlyPayment, 0),
              },
            };
            newSheet.computed = computeFinancials(newSheet);
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      addKnowledge: (playerId, knowledgeId) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            if (p.financialSheet.acquiredKnowledge.includes(knowledgeId)) return p;
            const newSheet = {
              ...p.financialSheet,
              acquiredKnowledge: [...p.financialSheet.acquiredKnowledge, knowledgeId],
            };
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      // --- Sztorivonalak ---

      addStoryline: (playerId, storyline) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const newSheet = {
              ...p.financialSheet,
              pendingStorylines: [...(p.financialSheet.pendingStorylines ?? []), storyline],
            };
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      resolveStoryline: (playerId, storylineId) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const newSheet = {
              ...p.financialSheet,
              pendingStorylines: (p.financialSheet.pendingStorylines ?? []).map((s) =>
                s.id === storylineId ? { ...s, resolved: true } : s
              ),
            };
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),

      // --- Dontes + Sorsfordito ---

      setCurrentDecision: (decision) =>
        set((state) => ({
          game: state.game ? { ...state.game, currentDecision: decision } : null,
        })),

      setCurrentFateEvent: (event) =>
        set((state) => ({
          game: state.game ? { ...state.game, currentFateEvent: event } : null,
        })),

      // --- Esemenyek ---

      logEvent: (event) =>
        set((state) => {
          if (!state.game) return state;
          const fullEvent: GameEvent = {
            ...event,
            round: state.game.currentRound,
            gameDate: state.game.currentGameDate,
          };
          return {
            game: {
              ...state.game,
              eventLog: [...state.game.eventLog, fullEvent],
            },
          };
        }),

      // --- Kor feldolgozas ---

      processRoundIncome: () => {
        const state = get();
        if (!state.game) return;
        const player = state.game.players[state.game.activePlayerIndex];
        let currentSalary = player.financialSheet.income.salary;
        const passive = player.financialSheet.income.passive;
        const tsConfig = TIME_SCALE_CONFIGS[state.game.config.timeScale];
        const monthsInRound = tsConfig.monthsPerRound;
        const round = state.game.currentRound;

        // Karrierprogresszió: marathon/ultra módban, évi ~5% emelés
        // A roundsPerYear kiszámítja hány kör = 1 év az adott időskálában
        // Marathon: 12/3 = 4 kör/év, Ultra: 12/6 = 2 kör/év
        const roundsPerYear = Math.round(12 / monthsInRound);
        if (tsConfig.applyCareerProgression && currentSalary > 0 && round > 1 && round % roundsPerYear === 0) {
          const raisePercent = 0.05; // 5% éves emelés (MO átlag: 5-10%)
          const raiseAmount = Math.round(currentSalary * raisePercent);
          if (raiseAmount > 0) {
            currentSalary += raiseAmount;
            state.modifyIncome(player.playerId, 'salary', raiseAmount);
            state.logEvent({
              type: 'income',
              description: `Éves fizetésemelés: +${raiseAmount.toLocaleString('hu-HU')} Ft/hó (+5%)`,
              financialImpact: 0,
            });
          }
        }

        const totalIncome = (currentSalary + passive) * monthsInRound;
        state.modifyBalance(player.playerId, totalIncome, `Bevétel (${monthsInRound} hónap)`);
        state.logEvent({
          type: 'income',
          description: monthsInRound > 1
            ? `Bevétel beérkezett: ${totalIncome.toLocaleString('hu-HU')} Ft (${monthsInRound} hó × ${currentSalary.toLocaleString('hu-HU')} Ft/hó)`
            : `Bevétel beérkezett: ${totalIncome.toLocaleString('hu-HU')} Ft`,
          financialImpact: totalIncome,
        });
      },

      processRoundExpenses: () => {
        const state = get();
        if (!state.game) return;
        const player = state.game.players[state.game.activePlayerIndex];
        const totalExpenses = player.financialSheet.computed.totalExpenses;
        const tsConfig = TIME_SCALE_CONFIGS[state.game.config.timeScale];
        const monthsInRound = tsConfig.monthsPerRound;

        const totalCost = totalExpenses * monthsInRound;
        state.modifyBalance(player.playerId, -totalCost, `Kiadások (${monthsInRound} hónap)`);
        state.logEvent({
          type: 'expense',
          description: monthsInRound > 1
            ? `Kiadások levonva: ${totalCost.toLocaleString('hu-HU')} Ft (${monthsInRound} hó × ${totalExpenses.toLocaleString('hu-HU')} Ft/hó)`
            : `Kiadások levonva: ${totalCost.toLocaleString('hu-HU')} Ft`,
          financialImpact: -totalCost,
        });
      },

      processInvestmentReturns: () => {
        const state = get();
        if (!state.game) return;
        const player = state.game.players[state.game.activePlayerIndex];
        const tsConfig = TIME_SCALE_CONFIGS[state.game.config.timeScale];
        const monthsInRound = tsConfig.monthsPerRound;

        let totalReturns = 0;
        player.financialSheet.investments.forEach((inv) => {
          // Egyszerusitett hozamszamitas - kesobbi fazisban valos adatbol
          const monthlyReturn = inv.currentValue * 0.005; // ~6% eves, havi
          totalReturns += monthlyReturn * monthsInRound;
        });

        if (totalReturns > 0) {
          state.modifyBalance(player.playerId, Math.round(totalReturns), 'Befektetési hozam');
          state.logEvent({
            type: 'investment',
            description: `Befektetési hozam: +${Math.round(totalReturns).toLocaleString('hu-HU')} Ft`,
            financialImpact: Math.round(totalReturns),
          });
        }
      },

      processDebtPayments: () => {
        const state = get();
        if (!state.game) return;
        const player = state.game.players[state.game.activePlayerIndex];

        // Ellenorizzuk, hogy a DH2 torlesztes elindul-e ebben a korben
        player.financialSheet.debts.forEach((debt) => {
          if (
            debt.repaymentStartsAtRound &&
            state.game!.currentRound >= debt.repaymentStartsAtRound &&
            debt.monthlyPayment === 0
          ) {
            // DH2 torlesztes indul: havi ~30 000 Ft
            const monthlyPayment = 30_000;
            state.modifyExpenses(player.playerId, 'loanPayments', monthlyPayment);
            state.logEvent({
              type: 'expense',
              description: 'Diákhitel-törlesztés megindult: +30 000 Ft/hó',
              financialImpact: -monthlyPayment,
            });
          }
        });
      },

      takeFinancialSnapshot: () =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            const snapshot = {
              round: state.game!.currentRound,
              gameDate: state.game!.currentGameDate,
              balance: p.financialSheet.balance,
              netWorth: p.financialSheet.computed.netWorth,
              freeCashflow: p.financialSheet.computed.freeCashflow,
              passiveIncome: p.financialSheet.income.passive,
            };
            return {
              ...p,
              financialSheet: {
                ...p.financialSheet,
                history: [...p.financialSheet.history, snapshot],
              },
            };
          });
          return { game: { ...state.game, players } };
        }),

      // --- Segédfüggvények ---

      getActivePlayer: () => {
        const state = get();
        if (!state.game) return undefined;
        return state.game.players[state.game.activePlayerIndex];
      },

      recalculateFinancials: (playerId) =>
        set((state) => {
          if (!state.game) return state;
          const players = state.game.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const newSheet = {
              ...p.financialSheet,
              computed: computeFinancials(p.financialSheet),
            };
            return { ...p, financialSheet: newSheet };
          });
          return { game: { ...state.game, players } };
        }),
    }),
    {
      name: 'penzugyi-sorsfordito-game',
    }
  )
);
