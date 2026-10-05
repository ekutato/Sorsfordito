// "Húzózsák" pakli: minden kártya pontosan egyszer jön, mielőtt a pakli újrakeveredik,
// és újrakeveréskor az előző kör utolsó lapja nem kerülhet azonnal a tetejére.
import { shuffle, type Rng } from './rng';

export interface DeckState {
  /** Még húzható lapok azonosítói (a 0. a következő) */
  drawPile: string[];
  /** Már kihúzott lapok, az aktuális körben */
  discard: string[];
  /** Hányszor keveredett újra */
  reshuffles: number;
}

export function createDeck(cardIds: readonly string[], rng: Rng): DeckState {
  if (new Set(cardIds).size !== cardIds.length) throw new Error('A pakliban ismétlődő azonosító van');
  return { drawPile: shuffle(cardIds, rng), discard: [], reshuffles: 0 };
}

export function drawCard(deck: DeckState, rng: Rng): { card: string; deck: DeckState } {
  let { drawPile, discard, reshuffles } = deck;
  if (drawPile.length === 0) {
    if (discard.length === 0) throw new Error('Üres pakliból nem lehet húzni');
    const last = discard[discard.length - 1];
    drawPile = shuffle(discard, rng);
    if (drawPile.length > 1 && drawPile[0] === last) {
      [drawPile[0], drawPile[1]] = [drawPile[1], drawPile[0]];
    }
    discard = [];
    reshuffles += 1;
  }
  const [card, ...rest] = drawPile;
  return { card, deck: { drawPile: rest, discard: [...discard, card], reshuffles } };
}

/** Késleltetett következmény: egy döntés hatása N kör múlva érkezik */
export interface DelayedEffect {
  id: string;
  dueRound: number;
  playerId: string;
  effects: Array<{ target: string; amount: number }>;
  description: string;
}

export function dueEffects(queue: readonly DelayedEffect[], round: number): { due: DelayedEffect[]; rest: DelayedEffect[] } {
  return {
    due: queue.filter((e) => e.dueRound <= round),
    rest: queue.filter((e) => e.dueRound > round),
  };
}
