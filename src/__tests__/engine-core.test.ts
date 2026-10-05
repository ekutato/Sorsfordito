import { describe, it, expect } from 'vitest';
import { createRng, shuffle, rollDie, seedFromString } from '@/engine/rng';
import { createDeck, drawCard, dueEffects } from '@/engine/deck';

describe('seedelt véletlen', () => {
  it('ugyanabból a seedből ugyanaz a sorozat', () => {
    const a = createRng(42), b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(seedFromString('RÉKA')).toBe(seedFromString('RÉKA'));
  });
  it('a kocka 1..6', () => {
    const r = createRng(1);
    for (let i = 0; i < 500; i++) {
      const d = rollDie(r);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
  });
  it('a keverés nem veszít és nem duplikál lapot', () => {
    const xs = Array.from({ length: 30 }, (_, i) => `c${i}`);
    expect(shuffle(xs, createRng(7)).sort()).toEqual([...xs].sort());
  });
});

describe('húzózsák pakli', () => {
  it('egy lap sem ismétlődik, amíg a pakli el nem fogy', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const rng = createRng(3);
    let deck = createDeck(ids, rng);
    const first: string[] = [];
    for (let i = 0; i < ids.length; i++) { const r = drawCard(deck, rng); first.push(r.card); deck = r.deck; }
    expect([...first].sort()).toEqual(ids);
    const next = drawCard(deck, rng);
    expect(next.deck.reshuffles).toBe(1);
    expect(next.card).not.toBe(first[first.length - 1]);
  });
  it('ismétlődő azonosítót nem fogad el', () => {
    expect(() => createDeck(['a', 'a'], createRng(1))).toThrow();
  });
  it('a késleltetett hatások a megfelelő körben esedékesek', () => {
    const q = [
      { id: '1', dueRound: 3, playerId: 'p', effects: [], description: '' },
      { id: '2', dueRound: 6, playerId: 'p', effects: [], description: '' },
    ];
    const { due, rest } = dueEffects(q, 4);
    expect(due.map((d) => d.id)).toEqual(['1']);
    expect(rest.map((d) => d.id)).toEqual(['2']);
  });
});
