import { describe, it, expect } from 'vitest';
import { parseClientMessage, bindActionToPlayer, isCompatible } from '@/net/protocol';
import { PROTOCOL_VERSION } from '@/engine/table/state';

describe('protokoll', () => {
  it('érvényes hello üzenetet elfogad, a nevet levágja', () => {
    const m = parseClientMessage({ v: 1, t: 'hello', playerId: 'abc123xyz', name: 'x'.repeat(40), remote: true });
    expect(m && m.t === 'hello' && m.name.length).toBe(24);
  });
  it('rossz azonosítót, ismeretlen típust, hibás JSON-t elutasít', () => {
    expect(parseClientMessage({ v: 1, t: 'hello', playerId: '../x', name: 'a' })).toBeNull();
    expect(parseClientMessage({ v: 1, t: 'hack' })).toBeNull();
    expect(parseClientMessage('{nem json')).toBeNull();
    expect(parseClientMessage({ v: 1, t: 'chat', text: '   ' })).toBeNull();
  });
  it('a kliens nem tud más nevében cselekedni vagy hostként parancsolni', () => {
    expect(bindActionToPlayer({ type: 'roll', playerId: 'host' }, 'p1')).toEqual({ type: 'roll', playerId: 'p1' });
    expect(bindActionToPlayer({ type: 'start', by: 'host' }, 'p1')).toEqual({ type: 'start', by: 'p1' });
    expect(bindActionToPlayer({ type: 'join', playerId: 'evil', name: 'x', remote: false }, 'p1')).toEqual({ type: 'reconnect', playerId: 'p1' });
  });
  it('verzióellenőrzés', () => {
    expect(isCompatible(PROTOCOL_VERSION)).toBe(true);
    expect(isCompatible(PROTOCOL_VERSION + 1)).toBe(false);
  });
});
