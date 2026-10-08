// Mezőbónusz-kártyák: a Tudás és a Befektetés mező is húz egy lapot, és összefügg
// a kör tudás- és befektetési kereteivel (GameScreen InvestPhase).
// - Tudás mező: egy ingyenes tudáskártya (a pakliból, játékonként keverve) + 1 tudáskeret a piacon.
// - Befektetés mező: bővebb heti piac és +1 befektetési keret.
import type { FieldType } from './board';
import type { FieldCard } from './field-cards';
import { KNOWLEDGE_CARDS } from './knowledge-cards';
import { createRng, seedFromString, shuffle } from '@/engine/rng';

/** A mező által adott körönkénti bónusz (a piac kereteihez) */
export interface FieldBonus { knowledgeLimit: number; investLimit: number; investOffers: number; knowledgeOffers: number }

export const BASE_BONUS: FieldBonus = { knowledgeLimit: 2, investLimit: 1, investOffers: 3, knowledgeOffers: 3 };

export function fieldBonus(field: FieldType | undefined): FieldBonus {
  if (field === 'knowledge') return { ...BASE_BONUS, knowledgeLimit: 3 };
  if (field === 'investment') return { ...BASE_BONUS, investLimit: 2, investOffers: 5 };
  return BASE_BONUS;
}

/** Hatás-célpont az ingyenes tudáskártyához (a táblás hatások között kezelve) */
export const KNOWLEDGE_TARGET = 'knowledge:';

export function bonusCardFor(field: FieldType, visit: number, seed: string, owned: string[]): FieldCard | undefined {
  if (field === 'knowledge') {
    const deck = shuffle(KNOWLEDGE_CARDS.filter((k) => k.tier === 'free' && !owned.includes(k.id)), createRng(seedFromString(`${seed}-tudas`)));
    const k = deck[visit % Math.max(1, deck.length)];
    if (!k) return undefined;
    return {
      id: `bonus-know-${k.id}`,
      field: 'knowledge',
      title: `Tudás mező: ${k.name}`,
      body: `Ingyen megtanulhatod: ${k.realWorldKnowledge.split(/(?<=\.)\s/)[0]} Ebben a körben a piacon is eggyel több tudáskártyát szerezhetsz (3).`,
      options: [
        { label: 'Megtanulom (ingyenes)', effects: [{ target: `${KNOWLEDGE_TARGET}${k.id}`, amount: 1 }],
          outcome: `Megszerezted: ${k.name}. A tudásbefektetés később pénzt vagy bajt spórol meg.` },
        { label: 'Most kihagyom', effects: [],
          outcome: 'Rendben. A tudáskártyák piacán ebben a körben így is 3 lapot szerezhetsz.' },
      ],
      realStep: `Valós lépés: ${k.ongoingEffect}`,
      sourceUrl: k.sourceUrl,
    };
  }
  if (field === 'investment') {
    return {
      id: 'bonus-invest',
      field: 'investment',
      title: 'Befektetés mező: bővebb piac',
      body: 'Ebben a körben a befektetési piacon 5 ajánlat közül választhatsz (a szokásos 3 helyett), és 2 befektetést tehetsz (1 helyett). Előtte nézd meg a tartalékodat: befektetni csak a vésztartalék fölötti pénzt érdemes.',
      options: [
        { label: 'Megnézem a piacot', effects: [], outcome: 'A kör befektetési szakaszában 5 ajánlat vár, és 2 befektetést tehetsz.' },
      ],
      realStep: 'Befektetés előtt legyen meg a 3-6 havi kiadásnak megfelelő vésztartalék.',
    };
  }
  return undefined;
}
