// A városi táblaútvonal: 24 mező, egy kör = egy év (két mező = egy hónap).
// A mezőtípusok sorrendje a dizájnvászon (Claude Design) "Tábla" artboardjával egyezik.
export type FieldType =
  | 'payday' | 'decision' | 'market_news' | 'temptation' | 'investment' | 'fate'
  | 'knowledge' | 'trap' | 'encounter' | 'office' | 'recharge';

export interface BoardField {
  index: number;
  type: FieldType;
  /** A hónap rövid neve, ha ezen a mezőn kezdődik egy hónap */
  month?: string;
  district: 'munkahely' | 'bankutca' | 'piacter' | 'tozsde' | 'hivatal' | 'kozossegi-ter';
}

const SEQUENCE: FieldType[] = [
  'payday', 'decision', 'market_news', 'temptation', 'investment', 'fate',
  'knowledge', 'trap', 'encounter', 'decision', 'office', 'recharge',
  'payday', 'fate', 'investment', 'temptation', 'decision', 'market_news',
  'trap', 'knowledge', 'encounter', 'office', 'recharge', 'fate',
];
const MONTHS = ['jan', 'feb', 'márc', 'ápr', 'máj', 'jún', 'júl', 'aug', 'szept', 'okt', 'nov', 'dec'];
const DISTRICTS: BoardField['district'][] = ['munkahely', 'bankutca', 'piacter', 'tozsde', 'hivatal', 'kozossegi-ter'];

export const BOARD: readonly BoardField[] = SEQUENCE.map((type, index) => ({
  index,
  type,
  month: index % 2 === 0 ? MONTHS[index / 2] : undefined,
  district: DISTRICTS[Math.floor(index / 4)],
}));

export const BOARD_SIZE = BOARD.length;

export const FIELD_LABELS: Record<FieldType, string> = {
  payday: 'Fizetésnap', decision: 'Döntés', market_news: 'Piaci hír', temptation: 'Kísértés',
  investment: 'Befektetés', fate: 'Sorsfordító', knowledge: 'Tudás', trap: 'Csapda',
  encounter: 'Találkozás', office: 'Hivatal', recharge: 'Feltöltődés',
};

/** Lépés a táblán: új pozíció és hogy áthaladt-e a fizetésnapon / évfordulón */
export function moveOnBoard(position: number, steps: number): { position: number; passedYearEnd: boolean; passedPaydays: number } {
  const raw = position + steps;
  const newPos = raw % BOARD_SIZE;
  let passedPaydays = 0;
  for (let p = position + 1; p <= raw; p++) if (BOARD[p % BOARD_SIZE].type === 'payday') passedPaydays++;
  return { position: newPos, passedYearEnd: raw >= BOARD_SIZE, passedPaydays };
}
