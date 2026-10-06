// Táblás mód (egyjátékos) műveletei a meglévő játékállapoton.
// A dobás a böngésző kriptográfiai véletlenforrásából jön (torzításmentes, elutasításos mintavétel).
import { useGameStore } from './game-store';
import { moveOnBoard, BOARD, FIELD_LABELS } from '@/data/board';
import { canAfford, type FieldCard, type FieldOption } from '@/data/field-cards';
import { isWellbeingTarget, wellbeingKeyOf } from '@/types/wellbeing';
import { TIME_SCALE_CONFIGS, type SoloBoardState } from '@/types/game';
import type { Expenses } from '@/types/financial';

const EXPENSE_KEYS = ['housing', 'utilities', 'food', 'transport', 'loanPayments', 'other'] as const;

/** 1..6, egyenletes eloszlással (crypto.getRandomValues + elutasítás) */
export function secureDieRoll(): number {
  const buf = new Uint8Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < 252) return (buf[0] % 6) + 1; // 252 = 6 × 42, a maradék torzítaná az eloszlást
  }
}

export function emptyBoard(): SoloBoardState {
  return { position: 0, visits: {}, reverts: [] };
}

function applyEffect(target: string, amount: number, description: string) {
  const s = useGameStore.getState();
  const pid = s.game?.players[s.game.activePlayerIndex]?.playerId;
  if (!pid) return;
  if (target === 'balance') s.modifyBalance(pid, amount, description);
  else if (target === 'salary') s.modifyIncome(pid, 'salary', amount);
  else if ((EXPENSE_KEYS as readonly string[]).includes(target)) s.modifyExpenses(pid, target as keyof Expenses, amount);
  else if (isWellbeingTarget(target)) s.modifyWellbeing(pid, wellbeingKeyOf(target), amount);
}

/** Körönként egyszer: dobás, lépés, esedékes visszaállítások */
export function rollBoard(): number | undefined {
  const { game } = useGameStore.getState();
  if (!game) return;
  const board = game.board ?? emptyBoard();
  if (board.rolledRound === game.currentRound) return board.lastRoll;

  const due = board.reverts.filter((r) => r.atRound <= game.currentRound);
  for (const r of due) applyEffect(r.target, r.amount, 'Lejárt időleges kiadás');

  const roll = secureDieRoll();
  const moved = moveOnBoard(board.position, roll);
  const next: SoloBoardState = {
    ...board,
    position: moved.position,
    lastRoll: roll,
    rolledRound: game.currentRound,
    lastOutcome: undefined,
    lastResult: undefined,
    awaitingOutcomeAck: false,
    awaitingContinue: true,
    reverts: board.reverts.filter((r) => r.atRound > game.currentRound),
  };
  useGameStore.setState((st) => (st.game ? { game: { ...st.game, board: next } } : st));
  useGameStore.getState().logEvent({
    type: 'decision',
    description: `Dobás: ${roll} → ${FIELD_LABELS[BOARD[moved.position].type]} mező`,
    financialImpact: 0,
  });
  return roll;
}

/** A mezőkártya választásának alkalmazása. Fedezet nélküli opciót nem alkalmaz (false). */
export function resolveFieldCard(fieldType: string, option?: FieldOption, card?: FieldCard): boolean {
  const { game } = useGameStore.getState();
  if (!game) return false;
  const board = game.board ?? emptyBoard();
  if (board.resolvedRound === game.currentRound) return false;
  const balance = game.players[game.activePlayerIndex]?.financialSheet.balance ?? 0;
  if (option && !canAfford(option, balance)) return false;

  const reverts = [...board.reverts];
  if (option) {
    for (const e of option.effects) applyEffect(e.target, e.amount, option.label);
    if (option.durationMonths) {
      const months = TIME_SCALE_CONFIGS[game.config.timeScale].monthsPerRound;
      const rounds = Math.max(1, Math.ceil(option.durationMonths / months));
      for (const e of option.effects) {
        if ((EXPENSE_KEYS as readonly string[]).includes(e.target)) {
          reverts.push({ atRound: game.currentRound + rounds, target: e.target, amount: -e.amount });
        }
      }
    }
  }
  const latest = useGameStore.getState().game?.board ?? board;
  const next: SoloBoardState = {
    ...latest,
    resolvedRound: game.currentRound,
    lastOutcome: option?.outcome,
    lastResult: option && card
      ? { field: fieldType, title: card.title, choice: option.label, effects: option.effects, realStep: card.realStep, sourceUrl: card.sourceUrl }
      : undefined,
    awaitingOutcomeAck: !!(option && card),
    visits: { ...latest.visits, [fieldType]: (latest.visits[fieldType] ?? 0) + 1 },
    reverts,
  };
  useGameStore.setState((st) => (st.game ? { game: { ...st.game, board: next } } : st));
  return true;
}

/** Az eredménylap lezárása, a kör megszokott menete folytatódik */
export function acknowledgeOutcome() {
  useGameStore.setState((st) =>
    st.game?.board ? { game: { ...st.game, board: { ...st.game.board, awaitingOutcomeAck: false } } } : st,
  );
}

/** A dobás utáni nagy táblanézet lezárása */
export function continueBoard() {
  useGameStore.setState((st) =>
    st.game?.board ? { game: { ...st.game, board: { ...st.game.board, awaitingContinue: false } } } : st,
  );
}
