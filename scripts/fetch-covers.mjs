// Fetches covers and stores two WebP sizes next to the page:
//   1. novels and novellas: Open Library, by cover ID (data/awards.json → ol[QID].c);
//   2. stories with a free text (READ in src/index.html) and no book cover: the picture the magazine shows
//      for that page (og:image: usually the issue cover, at Reactor the story's illustration). When a site
//      shows the same og:image on many pages (Uncanny: the newest issue), the issue cover on the page is used.
//   (a story from a collection or anthology can carry the book's cover ID in ol[QID].c with ol[QID].from)
// Where each picture came from is kept in covers/sources.json; pages without a picture in covers/none.json,
// so they are not asked again.
//   covers/s/<QID>.webp — 80×120, lists and picks
//   covers/m/<QID>.webp — 160×240, the work card
// Covers already present are skipped, so it only downloads what is new.
// Runs in GitHub Actions (.github/workflows/covers.yml). Locally:
//   npm install --no-save sharp@0.34.5 && node scripts/fetch-covers.mjs
// Cover art belongs to its publishers and artists; Open Library hosts it. See README, "Licenses".
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
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
const BAD = /logo|favicon|default|placeholder|icon|social|avatar|gravatar/i;
const abs = (u, base) => { try { return u ? new URL(u.replace(/&amp;/g, '&'), base).href : null; } catch (e) { return null; } };
const ogImage = (html, base) => {
  const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i);
  const c = m && m[0].match(/content=["']([^"']+)["']/i);
  return c ? abs(c[1], base) : null;
};
// the issue cover (or the story's illustration) shown on the page itself: any image URL on the page whose file
// name says "cover" or "illustration", lazy-loaded ones included; not the og:image banner, and not on sites
// whose sidebars advertise books
const coverImg = (html, base, og) => {
  if (/reactormag\.com|tor\.com/.test(base)) return null;
  for (const m of html.matchAll(/["'\s(,]((?:https?:)?[^"'\s(),]*(?:cover|illustration)[^"'\s(),]*\.(?:jpe?g|png|webp))/gi)) {
    const u = abs(m[1], base); if (u && u !== og && !BAD.test(u)) return u;
  }
  return null;
};


let ok = 0, missing = 0, failed = 0;
// first look at every story page: which og:image is a site's banner (the same on 3+ pages, counting earlier runs)?
const seen = {};
for (const u of Object.values(SOURCES)) if (!u.startsWith('openlibrary')) seen[u] = (seen[u] || 0) + 1;
for (const [, j] of jobs) if (j.page) {
  try {
    const p = await fetch(j.page, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (p.ok) { const html = await p.text(), base = p.url || j.page; j.og = ogImage(html, base); j.cover = coverImg(html, base, j.og); if (j.og) seen[j.og] = (seen[j.og] || 0) + 1; }
  } catch (e) { j.err = e.message; }
  await sleep(300);
}
async function one([q, j]) {
  try {
    if (j.page) { // a story: its own picture, or the issue cover when the og:image is the site's banner
      const og = j.og && !BAD.test(j.og) && seen[j.og] < 3 ? j.og : null;
      const img = og || (j.cover && !BAD.test(j.cover) ? j.cover : null);
      if (!img) { if (j.err) { failed++; return; } missing++; NONE.add(q); return; }
      j = { img, src: og ? img : 'issue:' + img };
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
// one picture for many stories is the site's own banner (or the current issue), not this story's: drop it
const uses = {}; for (const [q, u] of Object.entries(SOURCES)) if (!/^(openlibrary|issue):/.test(u)) (uses[u] = uses[u] || []).push(q); // an issue cover may serve several stories
for (const qs of Object.values(uses)) if (qs.length >= 3) for (const q of qs) {
  for (const k of Object.keys(SIZES)) rmSync(join(OUT, k, q + '.webp'), { force: true });
  delete SOURCES[q]; NONE.add(q);
}
writeFileSync(join(OUT, 'sources.json'), JSON.stringify(Object.fromEntries(Object.entries(SOURCES).sort()), null, 1));
writeFileSync(join(OUT, 'none.json'), JSON.stringify([...NONE].sort()));
console.log(`covers: ${ok} saved, ${missing} without an image, ${failed} failed`);
if (failed > jobs.length / 2) process.exit(1);
