// Fetches covers and stores two WebP sizes next to the page:
//   1. novels and novellas: Open Library, by cover ID (data/awards.json → ol[QID].c);
//   2. stories with a free text (READ in src/index.html) and no book cover: the picture the magazine shows
//      for that page (og:image: usually the issue cover, at Reactor the story's illustration).
// Where each picture came from is kept in covers/sources.json; pages without a picture in covers/none.json,
// so they are not asked again.
//   covers/s/<QID>.webp — 80×120, lists and picks
//   covers/m/<QID>.webp — 160×240, the work card
// Covers already present are skipped, so it only downloads what is new.
// Runs in GitHub Actions (.github/workflows/covers.yml). Locally:
//   npm install --no-save sharp@0.34.5 && node scripts/fetch-covers.mjs
// Cover art belongs to its publishers and artists; Open Library hosts it. See README, "Licenses".
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.COVER_BASE || 'https://covers.openlibrary.org/b/id/';
const OUT = process.env.COVERS_DIR || join(root, 'covers');
const LIMIT = process.env.LIMIT ? +process.env.LIMIT : Infinity;
const SIZES = { s: [80, 120, 70], m: [160, 240, 72] };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const UA = { 'User-Agent': 'unoebasta covers (+https://github.com/foteev/unoebasta)' };
const sharp = (await import('sharp')).default;
const data = JSON.parse(readFileSync(join(root, 'data', 'awards.json'), 'utf8'));
const src = readFileSync(join(root, 'src', 'index.html'), 'utf8');
const READ = new Function(src.slice(src.indexOf('const READ = {'), src.indexOf('const CHANGELOG')) + '; return READ;')();
for (const k of Object.keys(SIZES)) mkdirSync(join(OUT, k), { recursive: true });
const readJson = (f, d) => { try { return JSON.parse(readFileSync(join(OUT, f), 'utf8')); } catch (e) { return d; } };
const SOURCES = readJson('sources.json', {}), NONE = new Set(readJson('none.json', []));
const has = q => Object.keys(SIZES).every(k => existsSync(join(OUT, k, q + '.webp')));
for (const [q, o] of Object.entries(data.ol || {})) if (o.c && has(q) && !SOURCES[q]) SOURCES[q] = `openlibrary:${o.c}`;
const books = Object.entries(data.ol || {}).filter(([q, o]) => o.c && !has(q)).map(([q, o]) => [q, { img: `${BASE}${o.c}-M.jpg?default=false`, src: `openlibrary:${o.c}` }]);
const stories = Object.entries(READ).filter(([q]) => !has(q) && !(data.ol && data.ol[q] && data.ol[q].c) && !NONE.has(q))
  .map(([q, r]) => [q, { page: (r.links.find(l => l.kind === 'full') || {}).url }]).filter(([, j]) => j.page);
const jobs = [...books, ...stories].slice(0, LIMIT);
console.log(`covers: ${books.length} book covers and ${stories.length} story pages to look at`);
const ogImage = (html, base) => {
  const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i);
  const c = m && m[0].match(/content=["']([^"']+)["']/i);
  try { return c ? new URL(c[1].replace(/&amp;/g, '&'), base).href : null; } catch (e) { return null; }
};

let ok = 0, missing = 0, failed = 0;
async function one([q, j]) {
  try {
    if (j.page) { // a story: find the picture of its page
      const p = await fetch(j.page, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      const img = p.ok ? ogImage(await p.text(), p.url || j.page) : null;
      if (!img || /logo|favicon|default|placeholder/i.test(img)) { missing++; NONE.add(q); return; }
      j = { img, src: img };
    }
    const r = await fetch(j.img, { headers: UA, signal: AbortSignal.timeout(20000) });
    if (r.status === 404) { missing++; if (!j.src.startsWith('openlibrary')) NONE.add(q); return; }
    if (!r.ok) { failed++; console.warn(q, 'HTTP', r.status); return; }
    const buf = Buffer.from(await r.arrayBuffer());
    const meta = await sharp(buf).metadata();
    if (!meta.width || meta.width < 40) { missing++; return; } // a placeholder, not a cover
    for (const [k, [w, h, quality]] of Object.entries(SIZES))
      await sharp(buf).resize(w, h, { fit: 'cover', position: meta.width > meta.height ? 'attention' : 'top' }).webp({ quality }).toFile(join(OUT, k, q + '.webp'));
    SOURCES[q] = j.src; ok++;
  } catch (e) { failed++; console.warn(q, e.message); }
}
// two at a time with a pause: Open Library is a free service, be gentle
for (let i = 0; i < jobs.length; i += 2) {
  await Promise.all(jobs.slice(i, i + 2).map(one));
  await sleep(300);
}
writeFileSync(join(OUT, 'sources.json'), JSON.stringify(Object.fromEntries(Object.entries(SOURCES).sort()), null, 1));
writeFileSync(join(OUT, 'none.json'), JSON.stringify([...NONE].sort()));
console.log(`covers: ${ok} saved, ${missing} without an image, ${failed} failed`);
if (failed > jobs.length / 2) process.exit(1);
