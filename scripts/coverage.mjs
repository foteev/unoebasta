// What the catalog has for each winner and language: full text, excerpt/preview or nothing.
// Writes data/coverage.csv and prints what to look for next.
// Usage: node scripts/coverage.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(readFileSync(join(root, 'data', 'awards.json'), 'utf8'));
const src = readFileSync(join(root, 'src', 'index.html'), 'utf8');
const READ = new Function(src.slice(src.indexOf('const READ = {'), src.indexOf('const CHANGELOG')) + '; return READ;')();

const FORM = { N: 'novel', SF: 'novel', FN: 'novel', HN: 'novel', FT: 'novel', A: 'novella', E: 'novelette', S: 'short story' };
const RANK = ['novel', 'novella', 'novelette', 'short story'];
const LANGS = ['en', 'pl', 'ru', 'es'];
const works = {};
for (const [aw, cat, y, q] of d.aw) {
  const w = (works[q] = works[q] || { q, awards: [], form: null, last: 0 });
  w.awards.push(`${{ h: 'Hugo', n: 'Nebula', l: 'Locus' }[aw]} ${y}`);
  const f = FORM[cat]; if (!w.form || RANK.indexOf(f) < RANK.indexOf(w.form)) w.form = f;
  w.last = Math.max(w.last, y);
}
function availability(q) {
  const a = { en: '', pl: '', ru: '', es: '' };
  const r = READ[q]; if (r) for (const l of r.links) if (l.kind === 'full') a[l.lang || 'en'] = 'full';
  const x = (d.ex || {})[q] || {}, g = (d.gb || {})[q] || {};
  if (x.r && !a.en) a.en = 'part';
  if (x.lr && !a.ru) a.ru = 'part';
  if (x.lg && !a.pl) a.pl = 'part';
  for (const o of x.o || []) if (!a[o.l || 'en']) a[o.l || 'en'] = 'part';
  for (const l of LANGS) if (g[l] && !a[l]) a[l] = 'part';
  if (g.s && !a.en) a.en = 'part';
  return a;
}
// title_es: the title of a known Spanish translation (ISFDB, Wikidata), empty when none is known
const rows = [['qid', 'title', 'authors', 'form', 'awards', 'latest', 'pages', ...LANGS, 'audio', 'title_es']];
const tally = {};
for (const w of Object.values(works).sort((a, b) => b.last - a.last)) {
  const raw = d.works[w.q]; if (!raw) continue;
  const a = availability(w.q);
  const authors = raw[3].map(x => (d.authors[x] || [])[0] || x).join('; ');
  const audio = READ[w.q] && READ[w.q].links.some(l => l.kind === 'audio') ? 'yes' : ''; // a free reading by a person (podcast)
  rows.push([w.q, raw[0], authors, w.form, w.awards.join(', '), w.last, ((d.gb || {})[w.q] || {}).n || '', ...LANGS.map(l => a[l] || 'none'), audio, (d.t_es || {})[w.q] || '']);
  for (const l of LANGS) { const k = `${w.form}|${l}|${a[l] || 'none'}`; tally[k] = (tally[k] || 0) + 1; }
}
const csv = rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(',')).join('\n');
writeFileSync(join(root, 'data', 'coverage.csv'), csv + '\n');
console.log(`data/coverage.csv: ${rows.length - 1} works`);
for (const f of RANK) console.log(f.padEnd(12), LANGS.map(l => `${l}: full ${tally[`${f}|${l}|full`] || 0}, part ${tally[`${f}|${l}|part`] || 0}, none ${tally[`${f}|${l}|none`] || 0}`).join('  |  '));
