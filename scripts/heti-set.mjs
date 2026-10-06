#!/usr/bin/env node
// Egy heti érték frissítése: a régi érték automatikusan az `elozo` mezőbe kerül.
// Használat: node scripts/heti-set.mjs <kulcs> <érték> <asOf> <verified:true|false> "<forrás>" <url>
// Új hét kezdése (het, frissitve): node scripts/heti-set.mjs --het 2026-W42 2026-10-12
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../src/data/live/heti.json', import.meta.url);
const d = JSON.parse(readFileSync(FILE, 'utf8'));
const args = process.argv.slice(2);

if (args[0] === '--het') {
  d.het = args[1];
  d.frissitve = args[2];
} else {
  const [key, raw, asOf, verified, source, url] = args;
  if (!key || raw === undefined || !asOf) {
    console.error('Használat: heti-set.mjs <kulcs> <érték> <asOf> <verified> "<forrás>" <url>');
    process.exit(1);
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) { console.error(`Nem szám: ${raw}`); process.exit(1); }
  const e = d.ertekek[key];
  if (!e) { console.error(`Ismeretlen kulcs: ${key} (új kulcsot kézzel, egységgel együtt kell felvenni)`); process.exit(1); }
  // Csak valódi változáskor léptetjük az előző értéket (különben elveszne a múlt heti)
  if (e.value !== value || e.asOf !== asOf) e.elozo = { value: e.value, asOf: e.asOf };
  e.value = value;
  e.asOf = asOf;
  e.verified = verified !== 'false';
  if (source) e.source = source;
  if (url) e.url = url;
  // Gyanús ugrás: >10% eltérés az előzőhöz képest → jelöljük, a rutin ilyenkor nem élesít
  if (e.elozo && e.elozo.value !== 0 && Math.abs(value - e.elozo.value) / Math.abs(e.elozo.value) > 0.10) {
    console.log(`FIGYELEM: ${key} több mint 10%-ot változott (${e.elozo.value} → ${value})`);
  }
}
writeFileSync(FILE, JSON.stringify(d, null, 2) + '\n');
