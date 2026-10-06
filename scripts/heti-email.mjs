#!/usr/bin/env node
// A heti adatcsomagból HTML e-mail-törzs: minden érték, a változottak sárga háttérrel (régi → új).
// Használat: node scripts/heti-email.mjs [--allapot "Élesítve" | "Nem élesítve: ..."] > heti-email.html
import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync(new URL('../src/data/live/heti.json', import.meta.url), 'utf8'));
const i = process.argv.indexOf('--allapot');
const allapot = i > 0 ? process.argv[i + 1] : 'Élesítve';
const fmt = (n) => Number(n).toLocaleString('hu-HU', { maximumFractionDigits: 2 });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const rows = Object.entries(d.ertekek).map(([k, e]) => {
  const changed = e.elozo && e.elozo.value !== e.value;
  const bg = changed ? 'background:#FEF3C7;' : '';
  const val = changed
    ? `<s style="color:#8a7a55">${fmt(e.elozo.value)}</s> → <b>${fmt(e.value)}</b>`
    : fmt(e.value);
  const ok = e.verified ? '✓' : '<b style="color:#B91C1C">nem ellenőrzött</b>';
  return `<tr style="${bg}"><td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(k)}</td>` +
    `<td style="padding:6px 8px;border-bottom:1px solid #eee;white-space:nowrap">${val} ${esc(e.unit)}</td>` +
    `<td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(e.asOf)}</td>` +
    `<td style="padding:6px 8px;border-bottom:1px solid #eee"><a href="${esc(e.url)}">${esc(e.source)}</a></td>` +
    `<td style="padding:6px 8px;border-bottom:1px solid #eee">${ok}</td></tr>`;
});
const changedCount = Object.values(d.ertekek).filter((e) => e.elozo && e.elozo.value !== e.value).length;
const hirek = (d.hirek ?? []).map((h) => `<li>${esc(h.title)} - <a href="${esc(h.url)}">${esc(h.source)}</a></li>`).join('');

process.stdout.write(`<div style="font-family:Arial,sans-serif;font-size:14px;color:#1c1a16">
<h2 style="margin:0 0 4px">Sorsfordító - heti adatok, ${esc(d.het)}</h2>
<p style="margin:0 0 12px">Frissítve: ${esc(d.frissitve)} · Állapot: <b>${esc(allapot)}</b> · ${changedCount} érték változott (sárga háttér, régi → új).</p>
<table style="border-collapse:collapse;width:100%"><thead><tr style="text-align:left;background:#f3efe4">
<th style="padding:6px 8px">Adat</th><th style="padding:6px 8px">Érték</th><th style="padding:6px 8px">Dátum</th><th style="padding:6px 8px">Forrás</th><th style="padding:6px 8px">Ellenőrzött</th></tr></thead>
<tbody>${rows.join('')}</tbody></table>
${hirek ? `<h3 style="margin:16px 0 4px">A hét hírei a játékban</h3><ul>${hirek}</ul>` : ''}
<p style="color:#6b604b;font-size:12px">A játékban: menü → Heti adatok. Ezt az e-mailt a heti Sorsfordító-rutin küldte.</p>
</div>
`);
