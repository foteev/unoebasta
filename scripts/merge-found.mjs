// Merges a search result (CSV in the format of claude/search-agent-prompt.md) into the page:
//   full texts and audio → READ in src/index.html; fragments → ex in data/awards.json.
// Usage: node scripts/merge-found.mjs data/found/2026-11-02.csv [--archive]
//   --archive also takes Wayback snapshots (archive=yes); without it they are listed and skipped.
// Rows already on the page are skipped, so a file can be merged twice. kind=none rows are only counted.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [file, ...flags] = process.argv.slice(2);
if (!file) { console.error('usage: node scripts/merge-found.mjs <found.csv> [--archive]'); process.exit(2); }
const ARCHIVE = flags.includes('--archive');
const ADDED = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); if (row.some(x => x !== '')) rows.push(row); row = []; cell = ''; } else cell += c;
  }
  row.push(cell); if (row.some(x => x !== '')) rows.push(row);
  const [head, ...body] = rows; return body.map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}
const sq = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const clean = u => { const x = new URL(u); for (const k of [...x.searchParams.keys()]) if (/^(utm_|ref$|aff|fbclid|gclid)/i.test(k)) x.searchParams.delete(k); return x.href; };
// one source per work for the text: the magazine first, then other publishers, then the author's site
const RANK = ['Clarkesworld', 'Lightspeed', 'Uncanny', 'Apex', 'Asimov', 'Analog', 'Strange Horizons', 'Reactor', 'GigaNotoSaurus', 'Escape Pod', 'WIRED', 'Baen'];
const rank = s => { const i = RANK.findIndex(r => s.includes(r)); return i < 0 ? RANK.length : i; };

const srcPath = join(root, 'src', 'index.html'), dataPath = join(root, 'data', 'awards.json');
let src = readFileSync(srcPath, 'utf8');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const READ = new Function(src.slice(src.indexOf('const READ = {'), src.indexOf('const CHANGELOG')) + '; return READ;')();
const rows = parseCsv(readFileSync(file, 'utf8'));
const by = {}; for (const r of rows) (by[r.qid] = by[r.qid] || []).push(r);

const lines = [], skipped = [], frag = [], none = [];
for (const [q, rs] of Object.entries(by)) {
  if (!data.works[q]) { skipped.push(`${q}: not a winner in data/awards.json`); continue; }
  const ok = rs.filter(r => r.kind !== 'none' && r.url && (ARCHIVE || r.archive !== 'yes'));
  for (const r of rs) if (r.archive === 'yes' && !ARCHIVE) skipped.push(`${q} ${r.title}: Wayback snapshot (${r.site}) — run with --archive to take it`);
  if (rs.every(r => r.kind === 'none')) none.push(q);
  // fragments → ex: Reactor keeps its short form (r), every other site goes to o: [{ u, s, l }]
  for (const r of ok.filter(r => r.kind === 'fragment')) {
    const ex = data.ex[q] = data.ex[q] || {}, u = clean(r.url), host = new URL(u).hostname;
    if (/reactormag\.com$/.test(host)) { if (!ex.r) { ex.r = new URL(u).pathname; frag.push(`${q} Reactor`); } continue; }
    if (/litres\.ru$/.test(host)) { if (!ex.lr) { ex.lr = new URL(u).pathname; frag.push(`${q} LitRes`); } continue; }
    if (/legimi\.pl$/.test(host)) { if (!ex.lg) { ex.lg = new URL(u).pathname; frag.push(`${q} Legimi`); } continue; }
    ex.o = ex.o || []; if (!ex.o.some(o => o.u === u)) { ex.o.push({ u, s: r.site, l: r.lang || 'en' }); frag.push(`${q} ${r.site}`); }
  }
  if (READ[q]) { if (ok.some(r => r.kind === 'full' || r.kind === 'audio')) skipped.push(`${q}: already in READ, add new links by hand`); continue; }
  const full = ok.filter(r => r.kind === 'full'), audio = ok.filter(r => r.kind === 'audio');
  if (!full.length && !audio.length) continue;
  const site = full.length ? [...new Set(full.map(r => r.site))].sort((a, b) => rank(a) - rank(b))[0] : null;
  const text = full.filter(r => r.site === site).sort((a, b) => (+a.part || 0) - (+b.part || 0));
  const asite = audio.length ? [...new Set(audio.map(r => r.site))].sort((a, b) => rank(a) - rank(b))[0] : null;
  const voice = audio.filter(r => r.site === asite).sort((a, b) => (+a.part || 0) - (+b.part || 0));
  const main = text[0] || voice[0];
  const words = text.reduce((n, r) => n + (+r.words || 0), 0);
  const baen = text.some(r => /baen\.com/.test(r.url));
  const link = (r, kind) => `{ kind: '${kind}', url: ${sq(clean(r.url))}, site: ${sq(r.site)}${r.part ? `, part: ${+r.part}` : ''}${kind === 'full' && baen ? ', downloads: true' : ''}${r.lang && r.lang !== 'en' ? `, lang: ${sq(r.lang)}` : ''} }`;
  const fields = [words ? `w: ${words}` : null, `tier: ${sq(main.tier && main.tier !== 'frag' ? main.tier : 't2')}`, `added: ${sq(ADDED)}`, `pub: ${sq(main.pub.split(';')[0].trim())}`,
    main.license ? `license: ${sq(main.license)}` : null, baen ? `note: 'note_baen'` : null,
    `links: [${[...text.map(r => link(r, 'full')), ...voice.map(r => link(r, 'audio'))].join(', ')}]`].filter(Boolean);
  lines.push(`  ${q}: { ${fields.join(', ')} },`);
}
if (lines.length) {
  const end = src.indexOf('\n};\nconst CHANGELOG'); if (end < 0) throw new Error('READ end not found');
  src = src.slice(0, end) + '\n' + lines.join('\n') + src.slice(end);
  writeFileSync(srcPath, src);
}
data.ex_at = ADDED.slice(0, 10);
writeFileSync(dataPath, JSON.stringify(data));
console.log(`READ: ${lines.length} works added (full text or audio)`);
console.log(`fragments: ${frag.length} added${frag.length ? ' — ' + frag.join(', ') : ''}`);
console.log(`searched, nothing found: ${none.length}`);
if (skipped.length) console.log('skipped:\n  ' + skipped.join('\n  '));
