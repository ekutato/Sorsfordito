// Mezőbónusz-kártyák: a Tudás és a Befektetés mező is húz egy lapot, és összefügg
// a kör tudás- és befektetési kereteivel (GameScreen InvestPhase).
// - Tudás mező: egy ingyenes tudáskártya (a pakliból, játékonként keverve) + 1 tudáskeret a piacon.
// - Befektetés mező: bővebb heti piac és +1 befektetési keret.
import type { FieldType } from './board';
import type { FieldCard } from './field-cards';
import { KNOWLEDGE_CARDS } from './knowledge-cards';
import { createRng, seedFromString, shuffle } from '@/engine/rng';
import { DISTRICT_KNOWLEDGE, LEVEL_LABEL, knowledgeEffects, levelOf, prerequisitesMet } from './knowledge-tree';
import { nextLearnable } from '@/engine/offers';
import type { DistrictId } from './board';

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

export function bonusCardFor(field: FieldType, visit: number, seed: string, owned: string[], district?: DistrictId): FieldCard | undefined {
  if (field === 'knowledge') {
    // Csak tanulható (előfeltétellel rendelkező) lap; elsőként a negyed témájához illő lépcsőfok
    const learnable = KNOWLEDGE_CARDS.filter((k) => k.tier === 'free' && !owned.includes(k.id) && prerequisitesMet(k.id, owned));
    const themed = (district ? DISTRICT_KNOWLEDGE[district] : []).map((id) => nextLearnable(id, owned)).filter((id): id is string => !!id);
    const deck = shuffle(learnable, createRng(seedFromString(`${seed}-tudas-${visit}`)));
    const k = learnable.find((x) => x.id === themed[visit % Math.max(1, themed.length)]) ?? deck[0];
    if (!k) return undefined;
    // Hogyan szerzed meg: elolvasod a forrás tájékoztatóját, majd egy kérdéssel ellenőrzöd magad.
    // A tudás csak helyes válasz után a tiéd (mint a piacon a tudáspróba).
    const effects = [`${LEVEL_LABEL[levelOf(k.id)]} szint`, ...knowledgeEffects(k.id)].join(' · ');
    const host = (() => { try { return new URL(k.sourceUrl).hostname.replace(/^www\./, ''); } catch { return 'a hivatalos forrás'; } })();
    const learn = `Hogyan tanulod meg: ingyenes tanulási alkalom - elolvasod a lenti forrás tájékoztatóját (${host}, kb. egy óra), aztán egy kérdéssel ellenőrzöd magad. Ha jól válaszolsz, a tudás a tiéd.`;
    const q = k.quiz?.length ? k.quiz[visit % k.quiz.length] : undefined;
    const acquire = { target: `${KNOWLEDGE_TARGET}${k.id}`, amount: 1 };
    const skip = { label: 'Most kihagyom', effects: [], outcome: 'Rendben. A tudáskártyák piacán ebben a körben 3 lapot szerezhetsz.' };
    return {
      id: `bonus-know-${k.id}`,
      field: 'knowledge',
      title: `Tudás mező: ${k.name}`,
      body: `${learn}\n\nAmit megtanulsz: ${k.realWorldKnowledge}${q ? `\n\nEllenőrző kérdés: ${q.question}` : ''}`,
      options: q
        ? [
          ...q.options.map((opt, i) => i === q.correctIndex
            ? { label: opt, effects: [acquire], outcome: `Helyes! ${q.explanation} Megszerezted: ${k.name}. A játékban: ${effects}.` }
            : { label: opt, effects: [], outcome: `Nem ez a helyes válasz. ${q.explanation} Most nem szerezted meg; a tudáskártyák piacán később újra megpróbálhatod.` }),
          skip,
        ]
        : [
          { label: 'Megtanulom (ingyenes)', effects: [acquire], outcome: `Megszerezted: ${k.name}. A játékban: ${effects}.` },
          skip,
        ],
      realStep: `Olvasd el te is a forrást (${host}): ebből tanul a játékbeli karaktered is.`,
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
