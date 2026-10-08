// A városi táblaútvonal: 24 mező, hat tematikus negyedben (Munkahely, Bankutca, Tőzsde,
// Piactér, Hivatal, Közösségi tér). Körönként egy dobás.
export type FieldType =
  | 'payday' | 'decision' | 'market_news' | 'temptation' | 'investment' | 'fate'
  | 'knowledge' | 'trap' | 'encounter' | 'office' | 'recharge';

export type DistrictId = 'munkahely' | 'bankutca' | 'piacter' | 'tozsde' | 'hivatal' | 'kozossegi-ter';

export interface BoardField {
  index: number;
  type: FieldType;
  district: DistrictId;
}

// Tematikus negyedek: a negyed neve magyarázza a benne lévő mezőket (4 mező / negyed).
// Fizetésnap évente egy van a táblán; a havi bevétel minden körben megérkezik.
export const DISTRICTS: ReadonlyArray<{ id: BoardField['district']; label: string; tag: string; hint: string; fields: FieldType[] }> = [
  { id: 'munkahely', label: 'Munkahely', tag: 'fizetés, munka', hint: 'Fizetés, munkahelyi döntések, tanulás', fields: ['payday', 'decision', 'knowledge', 'fate'] },
  { id: 'bankutca', label: 'Bankutca', tag: 'pénz, csalók', hint: 'Megtakarítás, befektetés - és itt próbálkoznak a csalók is', fields: ['investment', 'trap', 'decision', 'trap'] },
  { id: 'tozsde', label: 'Tőzsde', tag: 'hírek, befektetés', hint: 'Piaci hírek valós adatokból, befektetések', fields: ['market_news', 'investment', 'market_news', 'fate'] },
  { id: 'piacter', label: 'Piactér', tag: 'vásárlás', hint: 'Vásárlás, apró kísértések, élethelyzetek', fields: ['temptation', 'decision', 'temptation', 'fate'] },
  { id: 'hivatal', label: 'Hivatal', tag: 'adó, ügyek', hint: 'Adó, ügyintézés, szabályok - és a tudás, ami ehhez kell', fields: ['office', 'knowledge', 'office', 'knowledge'] },
  { id: 'kozossegi-ter', label: 'Közösségi tér', tag: 'barátok, pihenés', hint: 'Barátok, közös ügyek, feltöltődés', fields: ['encounter', 'recharge', 'encounter', 'recharge'] },
];

export const BOARD: readonly BoardField[] = DISTRICTS.flatMap((d) => d.fields).map((type, index) => ({
  index,
  type,
  district: DISTRICTS[Math.floor(index / 4)].id,
}));

export function districtOf(index: number) {
  return DISTRICTS[Math.floor((index % 24) / 4)];
}

export const BOARD_SIZE = BOARD.length;

export const FIELD_LABELS: Record<FieldType, string> = {
  payday: 'Fizetésnap', decision: 'Döntés', market_news: 'Piaci hír', temptation: 'Kísértés',
  investment: 'Befektetés', fate: 'Sorsfordító', knowledge: 'Tudás', trap: 'Csapda',
  encounter: 'Találkozás', office: 'Hivatal', recharge: 'Feltöltődés',
};

/** Rövid felirat a mezőn (a betűjel alatt) */
export const FIELD_SHORT: Record<FieldType, string> = {
  payday: 'Fizetés', decision: 'Döntés', market_news: 'Hír', temptation: 'Kísértés',
  investment: 'Befekt.', fate: 'Sors', knowledge: 'Tudás', trap: 'Csapda',
  encounter: 'Találk.', office: 'Hivatal', recharge: 'Feltölt.',
};

/** Egymondatos magyarázat a jelmagyarázathoz */
export const FIELD_EXPLAIN: Record<FieldType, string> = {
  payday: 'megérkezik a havi bevétel, átnézed a pénzügyeidet.',
  decision: 'nagyobb élethelyzeti döntés, pénzügyi következményekkel.',
  market_news: 'valós heti gazdasági adat (kamat, árfolyam, tőzsde) és a hatása.',
  temptation: 'apró költések, előfizetések, részletfizetés - kis összegek, nagy szivárgás.',
  investment: 'befektetési lehetőségek: állampapír, betét, részvény és társaik.',
  fate: 'az élet közbeszól: váratlan esemény, jó vagy rossz.',
  knowledge: 'tudáskártya: ami később pénzt vagy bajt spórol meg.',
  trap: 'csábító, de gyanús ajánlat - a vészjelekből felismerhető.',
  encounter: 'valaki ajánlatot tesz: közös ügy, kölcsön, segítség.',
  office: 'adó, ügyintézés, jogszabályváltozás.',
  recharge: 'pihenés, kapcsolatok, egészség - a jólléti jelölőkre hat.',
};

/** Lépés a táblán: új pozíció és hogy áthaladt-e a fizetésnapon / évfordulón */
export function moveOnBoard(position: number, steps: number): { position: number; passedYearEnd: boolean; passedPaydays: number } {
  const raw = position + steps;
  const newPos = raw % BOARD_SIZE;
  let passedPaydays = 0;
  for (let p = position + 1; p <= raw; p++) if (BOARD[p % BOARD_SIZE].type === 'payday') passedPaydays++;
  return { position: newPos, passedYearEnd: raw >= BOARD_SIZE, passedPaydays };
}
