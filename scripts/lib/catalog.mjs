import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { parseCsv, cleanUrl } from './csv.mjs';
import { loadResearch } from './research.mjs';
import { uniqueNames } from './matching.mjs';

import { readAwardRegistry } from './awards.mjs';

export const LANGS = ['en', 'pl', 'ru', 'es'];
export const FORMS = ['novel', 'novella', 'novelette', 'short story'];
const FORM = { N: 'novel', SF: 'novel', FN: 'novel', HN: 'novel', FT: 'novel', A: 'novella', E: 'novelette', S: 'short story' };
export function readTable(source) {
  const start = source.indexOf('const READ = {'), end = source.indexOf('const CHANGELOG', start);
  if (start < 0 || end < 0) throw new Error('READ boundaries not found');
  return new Function(source.slice(start, end) + '; return READ;')();
}

export function loadCatalog(root, { researchDir = join(root, 'data/research') } = {}) {
  // Local versioned data is the source of truth; a DNS failure cannot erase the worklist.
  const json = readFileSync(join(root, 'data/awards.json'), 'utf8');
  const data = JSON.parse(json), read = readTable(readFileSync(join(root, 'src/index.html'), 'utf8'));
  const categories = existsSync(join(root, 'data', 'award-registry.json')) ? readAwardRegistry(root).categories : null;
  const dir = join(root, 'data/found');
  const history = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.csv')).sort().flatMap(f => parseCsv(readFileSync(join(dir, f), 'utf8')).map((r, i) => ({ ...r, _file: `data/found/${f}`, _row: i + 2 }))) : [];
  const research = loadResearch(researchDir);
  const works = {};
  for (const [, category, year, qid] of data.aw) {
    const form = categories?.[category]?.form || FORM[category];
    if (!data.works[qid] || !form) continue;
    const w = works[qid] ||= { qid, form, latest: year };
    if (FORMS.indexOf(form) < FORMS.indexOf(w.form)) w.form = form;
    w.latest = Math.max(w.latest, year);
  }
  for (const w of Object.values(works)) {
    const raw = data.works[w.qid], x = data.ex?.[w.qid] || {}, g = data.gb?.[w.qid] || {};
    w.title = raw[0]; w.authors = raw[3].map(q => data.authors[q]?.[0] || q);
    w.authorQids = raw[3];
    w.titles = Object.fromEntries(LANGS.map(l => [l, l === 'en' ? raw[0] : (l === 'pl' && raw[1]) || (l === 'ru' && raw[2]) || data['t_' + l]?.[w.qid] || '']));
    w.titleVariants = Object.fromEntries(LANGS.map(l => [l, uniqueNames([w.titles[l], ...research.aliases.titles.filter(a => a.qid === w.qid && a.lang === l).map(a => a.value)])]));
    for (const l of LANGS) if (!w.titles[l] && w.titleVariants[l].length) w.titles[l] = w.titleVariants[l][0];
    w.authorVariants = Object.fromEntries(LANGS.map(l => [l, raw[3].map(q => uniqueNames([
      data.authors[q]?.[l === 'pl' ? 1 : l === 'ru' ? 2 : 0], data.authors[q]?.[0],
      ...research.aliases.authors.filter(a => a.qid === q && (a.lang === l || a.lang === 'en')).map(a => a.value)
    ]))]));
    w.isfdb = raw[4] || null; w.fantlab = raw[5] || null;
    w.availability = Object.fromEntries(LANGS.map(l => [l, { full: false, audio: false, fragment: false }]));
    w.urls = []; w.knownLinks = [];
    const add = (u, kind, lang = 'en') => { if (u) { const url = cleanUrl(u); w.urls.push(url); if (kind) w.knownLinks.push({ url, kind, lang }); } };
    for (const l of read[w.qid]?.links || []) { if (w.availability[l.lang || 'en']) w.availability[l.lang || 'en'][l.kind] = true; add(l.url); w.knownLinks.push({ ...l, lang: l.lang || 'en', url: cleanUrl(l.url) }); }
    for (const [key, lang, host] of [['r', 'en', 'reactormag.com'], ['lr', 'ru', 'www.litres.ru'], ['lg', 'pl', 'www.legimi.pl']]) {
      if (x[key]) { w.availability[lang].fragment = true; add(new URL(x[key], `https://${host}`).href, 'fragment', lang); }
    }
    for (const o of x.o || []) { if (w.availability[o.l || 'en']) w.availability[o.l || 'en'].fragment = true; add(o.u, 'fragment', o.l || 'en'); }
    for (const lang of LANGS) if (g[lang] || (lang === 'en' && g.s)) { w.availability[lang].fragment = true; add(`https://books.google.com/books?id=${g[lang] || g.s}`, 'fragment', lang); }
    for (const h of history) if (h.qid === w.qid && h.url && h.kind !== 'none') { add(h.url); w.knownLinks.push({ url: cleanUrl(h.url), lang: h.lang, kind: h.kind, part: h.part || '' }); }
    w.urls = [...new Set(w.urls)];
  }
  return { works: Object.values(works).sort((a, b) => b.latest - a.latest), history, data, read, research,
    fingerprint: createHash('sha256').update(json + JSON.stringify(read)).digest('hex') };
}
