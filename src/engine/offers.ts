// A heti piac lapjai a kör helyzetéhez igazodnak (a többi seedelt véletlen):
// 1. a kínálatban lévő, tudáshoz kötött befektetés feltétele ("Tudás kell" soha nem zsákutca),
// 2. a kör döntésének témája, 3. a látott, de nem kivédett csapda tudása, 4. a negyed témája.
// Olyan tudás, amelynek az előfeltétele hiányzik, nem kínálható - helyette az előfeltétele jön (építkezés).
import { createRng, seedFromString, shuffle } from './rng';
import { INVESTMENT_OPTIONS } from '@/data/investment-options';
import { KNOWLEDGE_CARDS } from '@/data/knowledge-cards';
import { CATEGORY_KNOWLEDGE, DISTRICT_INVESTMENTS, DISTRICT_KNOWLEDGE, prerequisitesMet, requiresOf } from '@/data/knowledge-tree';
import type { DistrictId } from '@/data/board';
import type { InvestmentOption } from '@/types/financial';
import type { KnowledgeCard } from '@/data/knowledge-cards';

export interface OfferContext {
  gameId: string;
  round: number;
  ownedInvestments: string[];
  ownedKnowledge: string[];
  investOffers: number;
  knowledgeOffers: number;
  district?: DistrictId;
  decisionCategory?: string;
  /** Döntésekből feloldott befektetések */
  unlockedInvestments?: string[];
  /** Nem kivédett csapdák tudása */
  missedTrapKnowledge?: string[];
}

export interface Offers {
  investments: InvestmentOption[];
  knowledge: KnowledgeCard[];
  /** Miért került a lap a kínálatba (a felületen jelölhető) */
  reasons: Record<string, string>;
}

/** Ha a tudás még nem kínálható, a legmélyebb hiányzó előfeltétele */
export function nextLearnable(id: string, owned: string[], seen = new Set<string>()): string | undefined {
  if (owned.includes(id) || seen.has(id)) return undefined;
  seen.add(id);
  if (prerequisitesMet(id, owned)) return id;
  for (const r of requiresOf(id)) {
    const n = nextLearnable(r, owned, seen);
    if (n) return n;
  }
  return undefined;
}

export function drawOffers(c: OfferContext): Offers {
  const rng = createRng(seedFromString(`${c.gameId}-r${c.round}`));
  const reasons: Record<string, string> = {};
  const freeInv = INVESTMENT_OPTIONS.filter((i) => i.tier === 'free' && !c.ownedInvestments.includes(i.id));
  const learnable = KNOWLEDGE_CARDS.filter((k) => k.tier === 'free' && !c.ownedKnowledge.includes(k.id) && prerequisitesMet(k.id, c.ownedKnowledge));

  // Befektetések: döntésből feloldott → negyed témája → véletlen
  const invOrder: InvestmentOption[] = [];
  const pushInv = (id: string, why: string) => {
    const o = freeInv.find((x) => x.id === id);
    if (o && !invOrder.includes(o)) { invOrder.push(o); reasons[o.id] ??= why; }
  };
  for (const id of shuffle(c.unlockedInvestments ?? [], rng)) pushInv(id, 'a döntésed nyitotta meg');
  if (c.district) for (const id of shuffle(DISTRICT_INVESTMENTS[c.district], rng).slice(0, 2)) pushInv(id, 'ehhez a negyedhez illik');
  for (const o of shuffle(freeInv, rng)) pushInv(o.id, '');
  const investments = invOrder.slice(0, c.investOffers);

  // Tudás: a feltételek sorrendjében, mindig a tanulható (előfeltétellel rendelkező) lépcsőfok
  const knowOrder: KnowledgeCard[] = [];
  const pushKnow = (id: string, why: string) => {
    const step = nextLearnable(id, c.ownedKnowledge);
    const k = step ? learnable.find((x) => x.id === step) : undefined;
    if (k && !knowOrder.includes(k)) { knowOrder.push(k); reasons[k.id] ??= step === id ? why : `${why} (előbb ezt kell megtanulni)`; }
  };
  for (const o of investments) if (o.requiredKnowledge && !c.ownedKnowledge.includes(o.requiredKnowledge)) pushKnow(o.requiredKnowledge, `kell hozzá: ${o.name}`);
  for (const id of CATEGORY_KNOWLEDGE[c.decisionCategory ?? ''] ?? []) pushKnow(id, 'a mostani döntésedhez');
  for (const id of c.missedTrapKnowledge ?? []) pushKnow(id, 'a csapda, amit láttál');
  if (c.district) for (const id of shuffle(DISTRICT_KNOWLEDGE[c.district], rng)) pushKnow(id, 'ehhez a negyedhez illik');
  // Legfeljebb két célzott lap, a többi véletlen (hogy maradjon felfedezés)
  const targeted = knowOrder.slice(0, Math.min(2, c.knowledgeOffers));
  const rest = shuffle(learnable.filter((k) => !targeted.includes(k)), rng);
  const knowledge = [...targeted, ...rest].slice(0, c.knowledgeOffers);
  return { investments, knowledge, reasons };
}

export interface KnowledgeLock {
  /** A befektetéshez szükséges tudás */
  needId: string;
  needName: string;
  /** Ha előbb egy előfeltételt kell megtanulni: a következő tanulható lépcsőfok */
  stepId?: string;
  stepName?: string;
  /** A lépcsőfok (vagy maga a tudás) ott van-e a mostani tudáskínálatban */
  offered: boolean;
}

export interface KnowledgeLinks {
  /** Zárt, kínált befektetés → a hozzá vezető tudás */
  locks: Record<string, KnowledgeLock>;
  /** Kínált tudáskártya → a kínált befektetések, amelyekhez ez a (következő) lépés */
  unlocks: Record<string, { investmentId: string; name: string; direct: boolean }[]>;
}

/** A piac és a Tudás fül összekötése: melyik zárt befektetéshez melyik kínált tudás vezet */
export function knowledgeLinks(offers: Pick<Offers, 'investments' | 'knowledge'>, owned: string[]): KnowledgeLinks {
  const locks: KnowledgeLinks['locks'] = {};
  const unlocks: KnowledgeLinks['unlocks'] = {};
  const nameOf = (id: string) => KNOWLEDGE_CARDS.find((k) => k.id === id)?.name ?? id;
  for (const inv of offers.investments) {
    const need = inv.requiredKnowledge;
    if (!need || owned.includes(need)) continue;
    const step = nextLearnable(need, owned) ?? need;
    const offered = offers.knowledge.some((k) => k.id === step);
    locks[inv.id] = {
      needId: need, needName: nameOf(need),
      ...(step !== need ? { stepId: step, stepName: nameOf(step) } : {}),
      offered,
    };
    if (offered) (unlocks[step] ??= []).push({ investmentId: inv.id, name: inv.name, direct: step === need });
  }
  return { locks, unlocks };
}
