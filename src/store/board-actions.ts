// Táblás mód (egyjátékos) műveletei a meglévő játékállapoton.
// A dobás a böngésző kriptográfiai véletlenforrásából jön (torzításmentes, elutasításos mintavétel).
import { useGameStore } from './game-store';
import { moveOnBoard, BOARD, FIELD_LABELS } from '@/data/board';
import { canAfford, type FieldCard, type FieldOption } from '@/data/field-cards';
import { isWellbeingTarget, wellbeingKeyOf } from '@/types/wellbeing';
import { TIME_SCALE_CONFIGS, type SoloBoardState, type DiceRollSource } from '@/types/game';
import type { FieldType } from '@/data/board';
import { KNOWLEDGE_TARGET } from '@/data/bonus-cards';
import { KNOWLEDGE_CARDS } from '@/data/knowledge-cards';
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

const ROLL_STATS_KEY = 'sorsfordito-dobasok';

/** Az app összes eddigi dobásának gyakorisága (1..6), játékokon át, ezen a készüléken */
export function readRollStats(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(ROLL_STATS_KEY) ?? 'null');
    if (Array.isArray(v) && v.length === 6 && v.every((n) => Number.isInteger(n) && n >= 0)) return v;
  } catch {}
  return [0, 0, 0, 0, 0, 0];
}

function recordRoll(value: number) {
  try {
    const c = readRollStats();
    c[value - 1] += 1;
    localStorage.setItem(ROLL_STATS_KEY, JSON.stringify(c));
  } catch {}
}

/**
 * A törlesztőt érintő hatás: a legdrágább hitel részlete változik (a havi kiadás a hitelekből adódik).
 * Hitel nélkül nincs mit módosítani.
 */
export function adjustTopDebt(delta: number) {
  const s = useGameStore.getState();
  const p = s.game?.players[s.game.activePlayerIndex];
  if (!p) return;
  const d = [...p.financialSheet.debts].sort((a, b) => b.interestRate - a.interestRate)[0];
  if (d) s.adjustDebtPayment(p.playerId, d.id, delta);
}

/** Hatás ütemezése egy későbbi kör elejére (késleltetett béremelés, lejáró ellátás) */
export function scheduleEffect(atRound: number, target: string, amount: number, label: string) {
  useGameStore.setState((st) => {
    if (!st.game) return st;
    const board = st.game.board ?? emptyBoard();
    return { game: { ...st.game, board: { ...board, reverts: [...board.reverts, { atRound, target, amount, label }] } } };
  });
}

export function emptyBoard(): SoloBoardState {
  return { position: 0, visits: {}, reverts: [] };
}

function applyEffect(target: string, amount: number, description: string) {
  const s = useGameStore.getState();
  const pid = s.game?.players[s.game.activePlayerIndex]?.playerId;
  if (!pid) return;
  if (target === 'balance') {
    s.modifyBalance(pid, amount, description);
    // A mezőkártya pénzhatása is a kör naplójába kerül (a kör összegzése így kiadja az egyenlegváltozást)
    s.logEvent({ type: 'field', description, financialImpact: amount });
  }
  else if (target === 'salary') s.modifyIncome(pid, 'salary', amount);
  else if (target === 'passive') s.modifyIncome(pid, 'passive', amount);
  else if (target === 'loanPayments') adjustTopDebt(amount);
  else if ((EXPENSE_KEYS as readonly string[]).includes(target)) s.modifyExpenses(pid, target as keyof Expenses, amount);
  else if (isWellbeingTarget(target)) s.modifyWellbeing(pid, wellbeingKeyOf(target), amount);
  else if (target.startsWith(KNOWLEDGE_TARGET)) {
    const id = target.slice(KNOWLEDGE_TARGET.length);
    s.addKnowledge(pid, id);
    s.logEvent({ type: 'investment', description: `Tudásbónusz (Tudás mező): ${KNOWLEDGE_CARDS.find((k) => k.id === id)?.name ?? id}`, financialImpact: 0 });
  }
}

const SOURCE_LABEL: Record<DiceRollSource, string> = { app: '', physical: ' (saját kocka)', test: ' (teszt: kézi érték)' };

/**
 * Körönként egyszer: dobás, lépés, esedékes visszaállítások.
 * `manual`: saját (fizikai) kockával dobott vagy tesztmódban választott érték, 1-6.
 */
export function rollBoard(manual?: { value: number; source: Exclude<DiceRollSource, 'app'> }): number | undefined {
  const { game } = useGameStore.getState();
  if (!game) return;
  const board = game.board ?? emptyBoard();
  if (board.rolledRound === game.currentRound) return board.lastRoll;

  const due = board.reverts.filter((r) => r.atRound <= game.currentRound);
  for (const r of due) {
    applyEffect(r.target, r.amount, r.label ?? 'Lejárt időleges kiadás');
    if (r.target !== 'balance' && r.label) {
      useGameStore.getState().logEvent({ type: 'income', description: `${r.label} (${r.amount > 0 ? '+' : '−'}${Math.abs(r.amount).toLocaleString('hu-HU')} Ft/hó)`, financialImpact: 0 });
    }
  }

  if (manual && !(Number.isInteger(manual.value) && manual.value >= 1 && manual.value <= 6)) return;
  const roll = manual ? manual.value : secureDieRoll();
  const source: DiceRollSource = manual ? manual.source : 'app';
  if (source === 'app') recordRoll(roll);
  const moved = moveOnBoard(board.position, roll);
  const next: SoloBoardState = {
    ...board,
    position: moved.position,
    from: board.position,
    lastRoll: roll,
    rolledRound: game.currentRound,
    lastOutcome: undefined,
    lastResult: undefined,
    awaitingOutcomeAck: false,
    awaitingContinue: true,
    rolls: [...(board.rolls ?? []), { value: roll, source }],
    reverts: board.reverts.filter((r) => r.atRound > game.currentRound),
  };
  useGameStore.setState((st) => (st.game ? { game: { ...st.game, board: next } } : st));
  useGameStore.getState().logEvent({
    type: 'decision',
    description: `Dobás: ${roll}${SOURCE_LABEL[source]} → ${FIELD_LABELS[BOARD[moved.position].type]} mező`,
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
    for (const e of option.effects) applyEffect(e.target, e.amount, card ? `${card.title}: ${option.label}` : option.label);
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
      ? { field: fieldType, title: card.title, choice: option.label, effects: option.effects, realStep: card.realStep, sourceUrl: card.sourceUrl, reflection: option.reflection }
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

// --- Tesztmód eszközei (csak bekapcsolt tesztmódban érhetők el a felületen) ---

/** Ugrás a következő adott típusú mezőre; a kör mezőkártyája ennek megfelelően jön */
export function testJumpTo(field: FieldType) {
  const { game } = useGameStore.getState();
  if (!game) return;
  const board = game.board ?? emptyBoard();
  let pos = board.position;
  for (let i = 1; i <= BOARD.length; i++) {
    const idx = (board.position + i) % BOARD.length;
    if (BOARD[idx].type === field) { pos = idx; break; }
  }
  const next: SoloBoardState = {
    ...board, position: pos, from: board.position, lastRoll: undefined, rolledRound: game.currentRound, awaitingContinue: true,
    resolvedRound: undefined, lastOutcome: undefined, lastResult: undefined, awaitingOutcomeAck: false,
  };
  useGameStore.setState((st) => (st.game ? { game: { ...st.game, board: next } } : st));
  useGameStore.getState().logEvent({ type: 'decision', description: `Teszt: ugrás a(z) ${FIELD_LABELS[field]} mezőre`, financialImpact: 0 });
}

/** A kör tartalmának átugrása: egyenesen a kör összegzésére */
export function testSkipRound() {
  const { game } = useGameStore.getState();
  if (!game) return;
  const board = game.board ?? emptyBoard();
  const next: SoloBoardState = {
    ...board, rolledRound: game.currentRound, resolvedRound: game.currentRound,
    awaitingContinue: false, awaitingOutcomeAck: false,
  };
  useGameStore.setState((st) => (st.game ? { game: { ...st.game, board: next } } : st));
  useGameStore.getState().logEvent({ type: 'decision', description: 'Teszt: kör átugorva', financialImpact: 0 });
  useGameStore.getState().setPhase('round_summary');
}
