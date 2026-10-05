import { describe, it, expect } from 'vitest';
import { LIVE_DATA, LIVE_ECONOMIC_DATA, livePreGameContext, unverifiedKeys } from '@/data/live';

describe('heti élő adatcsomag', () => {
  it('minden érték szám, és van forrása', () => {
    for (const [key, e] of Object.entries(LIVE_DATA.ertekek)) {
      expect(typeof e.value, key).toBe('number');
      expect(Number.isFinite(e.value), key).toBe(true);
      expect(e.source.length, key).toBeGreaterThan(0);
      if (e.verified) expect(e.url, `${key} url`).toMatch(/^https:\/\//);
    }
  });

  it('a megerősítetlen értékek listája kiolvasható', () => {
    const u = unverifiedKeys();
    expect(Array.isArray(u)).toBe(true);
    for (const k of u) expect(LIVE_DATA.ertekek[k].verified).toBe(false);
  });

  it('a játékkezdő kontextus a heti adatokból épül', () => {
    const ctx = livePreGameContext();
    expect(ctx.currentData.baseRate).toBe(LIVE_ECONOMIC_DATA.mnb.baseRate);
    expect(ctx.currentData.avgNetWage).toBe(LIVE_ECONOMIC_DATA.ksh.netAverageWage);
    expect(ctx.economicSummary.headline).toContain('alapkamat');
    expect(ctx.fateEventPool.length).toBeGreaterThan(0);
    for (const f of ctx.fateEventPool) {
      expect(f.sourceUrl).toMatch(/^https:\/\//);
      expect(['positive', 'negative', 'decision']).toContain(f.generatedEvent.type);
    }
  });
});
