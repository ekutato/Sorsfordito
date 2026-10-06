import { describe, it, expect, vi } from 'vitest';
import { useSoundPrefs, play, makeThrottle, crossed } from '@/audio/sfx';

describe('hangok', () => {
  it('alapból némítva, rezgés nélkül', () => {
    const s = useSoundPrefs.getState();
    expect(s.sound).toBe(false);
    expect(s.haptics).toBe(false);
  });

  it('kikapcsolva a play() nem hoz létre hangot és nem rezeg', () => {
    const ctor = vi.fn();
    const vibrate = vi.fn();
    vi.stubGlobal('AudioContext', ctor);
    vi.stubGlobal('navigator', { vibrate });
    play('coinIn'); play('roll'); play('milestone');
    expect(ctor).not.toHaveBeenCalled();
    expect(vibrate).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('a pénzhang-fékező 300 ms-on belül csak egyszer enged', () => {
    let t = 1000;
    const ok = makeThrottle(300, () => t);
    expect(ok()).toBe(true);
    t += 100; expect(ok()).toBe(false);
    t += 250; expect(ok()).toBe(true);
  });

  it('mérföldkő: csak a küszöb első átlépése számít', () => {
    expect(crossed(80, 100, 100)).toBe(true);
    expect(crossed(100, 120, 100)).toBe(false);
    expect(crossed(undefined, 120, 100)).toBe(false);
    expect(crossed(0, 1, 1)).toBe(true);
  });
});
