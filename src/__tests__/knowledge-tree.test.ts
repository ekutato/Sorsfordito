import { describe, it, expect } from 'vitest';
import { KNOWLEDGE_TREE, prerequisitesMet, knowledgeEffects, levelOf } from '@/data/knowledge-tree';
import { KNOWLEDGE_CARDS } from '@/data/knowledge-cards';
import { INVESTMENT_OPTIONS } from '@/data/investment-options';
import { ALL_FIELD_CARDS } from '@/data/field-cards';
import { drawOffers, nextLearnable } from '@/engine/offers';

describe('egymásra épülő tudás', () => {
  it('minden tudáskártya a fában van, az előfeltételek léteznek és alacsonyabb szintűek (nincs kör)', () => {
    for (const k of KNOWLEDGE_CARDS) expect(KNOWLEDGE_TREE[k.id], k.id).toBeDefined();
    for (const [id, n] of Object.entries(KNOWLEDGE_TREE)) {
      for (const r of n.requires ?? []) {
        expect(KNOWLEDGE_CARDS.some((k) => k.id === r), `${id} → ${r}`).toBe(true);
        expect(levelOf(r)).toBeLessThanOrEqual(n.level);
      }
    }
    // nincs körkörös előfeltétel
    const visit = (id: string, path: string[]): void => {
      expect(path.includes(id), [...path, id].join(' → ')).toBe(false);
      for (const r of KNOWLEDGE_TREE[id]?.requires ?? []) visit(r, [...path, id]);
    };
    for (const id of Object.keys(KNOWLEDGE_TREE)) visit(id, []);
  });

  it('minden szint-1 tudás előfeltétel nélkül tanulható, minden lap elérhető az alapokból', () => {
    for (const k of KNOWLEDGE_CARDS) expect(nextLearnable(k.id, []), k.id).toBeDefined();
  });

  it('a csapdák vészjelét kiemelő tudás ingyenes lap (mindenki megszerezheti)', () => {
    for (const c of ALL_FIELD_CARDS.filter((x) => x.highlightWithKnowledge)) {
      expect(KNOWLEDGE_CARDS.find((k) => k.id === c.highlightWithKnowledge)?.tier, c.id).toBe('free');
    }
  });

  it('a kártyán látható hatás valós (feloldás, csapda, ráépülő lap)', () => {
    expect(knowledgeEffects('know-tbsz').join(' ')).toMatch(/Feloldja: .*TBSZ/);
    expect(knowledgeEffects('know-digital').join(' ')).toMatch(/csapdalapon/);
    expect(knowledgeEffects('know-savings').join(' ')).toMatch(/Erre épül/);
  });

  it('kínálat: nincs előfeltétel nélküli lap; a zárt befektetés feltétele (vagy annak előfeltétele) a kínálatban', () => {
    for (let r = 1; r <= 40; r++) {
      for (const owned of [[], ['know-savings', 'know-inflation'], ['know-tax', 'know-freelance']]) {
        const o = drawOffers({ gameId: 'g', round: r, ownedInvestments: [], ownedKnowledge: owned, investOffers: 3, knowledgeOffers: 3, district: 'tozsde', decisionCategory: 'Befektetés' });
        for (const k of o.knowledge) expect(prerequisitesMet(k.id, owned), `${r}: ${k.id}`).toBe(true);
        const locked = o.investments.filter((i) => i.requiredKnowledge && !owned.includes(i.requiredKnowledge));
        const lockedFirst = locked[0];
        if (lockedFirst) expect(o.knowledge.map((k) => k.id)).toContain(nextLearnable(lockedFirst.requiredKnowledge!, owned));
      }
    }
  });

  it('a döntés témája szerinti tudás a kínálatban van', () => {
    const o = drawOffers({ gameId: 'g', round: 3, ownedInvestments: [], ownedKnowledge: ['know-savings'], investOffers: 3, knowledgeOffers: 3, decisionCategory: 'Adósságkezelés' });
    expect(o.knowledge.map((k) => k.id)).toContain('know-debt');
  });

  it('a döntéssel feloldott befektetés a piacra kerül', () => {
    const o = drawOffers({ gameId: 'g', round: 5, ownedInvestments: [], ownedKnowledge: [], investOffers: 3, knowledgeOffers: 3, unlockedInvestments: ['inv-map-plus'] });
    expect(o.investments.map((i) => i.id)).toContain('inv-map-plus');
    expect(INVESTMENT_OPTIONS.some((i) => i.id === 'inv-map-plus')).toBe(true);
  });
});
