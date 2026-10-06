import { describe, it, expect } from 'vitest';
import { contentItems } from '@/data/live/usage';
import { LIVE_VAR_DEFS, liveVar, varsIn, fillLiveVars, liveConditionHolds } from '@/data/live/vars';
import { LIVE_DATA } from '@/data/live';

// Időérzékeny, fixen beírt értékek mintái - ezeknek a heti csomagból kell jönniük ({{változó}})
const STALE_PATTERNS: Array<[RegExp, string]> = [
  [/EUR\/HUF\s*~?\s*\d/i, 'EUR/HUF árfolyam fixen'],
  [/USD\/HUF\s*~?\s*\d/i, 'USD/HUF árfolyam fixen'],
  [/\d[\d\s.,]*\s*Ft\/EUR/i, 'Ft/EUR fixen'],
  [/\$\s?\d[\d\s.,]*\s*\/\s*oz/i, 'nemesfémár fixen'],
  [/kb\.\s*40\s*M\s*Ft/i, 'OBA-határ forintban fixen'],
  [/PMÁP[^.]{0,40}\d+[,-]?\d*\s*%/, 'PMÁP-hozam fixen'],
];

// Márkasemlegesség (CLAUDE.md 11.): állami/intézményi nevek maradhatnak, más márkanév nem
const BRANDS = /\b(Revolut|Wise|Lightyear|Gránit|K&H|KBC|Random Capital|Interactive Brokers|OTP Simple|Wolt|Foodpanda|Netflix|Airbnb|Fiverr|Upwork|Coursera|Udemy|PayPal|Splitwise|TikTok|Aranykor)\b/;

const items = contentItems();

describe('élő adatok a szövegekben', () => {
  it('minden használt {{változó}} ismert és van értéke', () => {
    const missing: string[] = [];
    for (const it of items) for (const t of it.texts) for (const v of varsIn(t)) {
      // a játékos saját adatai (pl. salary, balance) a nézetben töltődnek
      if (!LIVE_VAR_DEFS[v] && ['salary', 'balance', 'netWorth', 'income', 'housing', 'cashflow', 'transport', 'loanPayments', 'months', 'rent_bp', 'rent_rural'].includes(v)) continue;
      if (!LIVE_VAR_DEFS[v]) { missing.push(`${it.label}: {{${v}}} ismeretlen`); continue; }
      if (liveVar(v) === undefined) missing.push(`${it.label}: {{${v}}} nincs érték`);
    }
    expect(missing).toEqual([]);
  });

  it('nincs fixen beírt, elavuló piaci érték', () => {
    const hits: string[] = [];
    for (const it of items) for (const t of it.texts) for (const [re, why] of STALE_PATTERNS) {
      if (re.test(t)) hits.push(`${it.label}: ${why} - „${t.slice(0, 90)}…"`);
    }
    expect(hits).toEqual([]);
  });

  it('nincs márkanév (csak állami és intézményi név)', () => {
    const hits: string[] = [];
    for (const it of items) for (const t of it.texts) {
      const m = t.match(BRANDS);
      if (m) hits.push(`${it.label}: ${m[0]}`);
    }
    expect(hits).toEqual([]);
  });

  it('a behelyettesítés nem hagy {{…}}-t, és a valós árfolyamot írja', () => {
    const out = fillLiveVars('Egy euró {{eur_huf}} Ft, ismeretlen: {{nincs_ilyen}}');
    expect(out).not.toMatch(/\{\{/);
    expect(out).toContain(LIVE_DATA.ertekek['mnb.eurHufRate'].value.toLocaleString('hu-HU', { maximumFractionDigits: 2 }));
  });

  it('az árfolyamfeltételek kizárják egymást', () => {
    expect(liveConditionHolds('forint_gyengul')).not.toBe(liveConditionHolds('forint_erosodik'));
    expect(liveConditionHolds('inflacio_emelkedik')).not.toBe(liveConditionHolds('inflacio_csokken'));
  });

  it('minden heti értéknek van forrása, dátuma és egysége', () => {
    for (const [k, e] of Object.entries(LIVE_DATA.ertekek)) {
      expect(e.source.length, k).toBeGreaterThan(5);
      expect(e.url, k).toMatch(/^https:\/\//);
      expect(e.asOf, k).toMatch(/^\d{4}/);
      expect(e.unit.length, k).toBeGreaterThan(0);
    }
  });
});
