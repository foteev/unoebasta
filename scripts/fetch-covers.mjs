// Fetches cover images of novels and novellas from Open Library by cover ID (data/awards.json → ol[QID].c)
// and stores two WebP sizes next to the page:
//   covers/s/<QID>.webp — 80×120, lists and picks
//   covers/m/<QID>.webp — 160×240, the work card
// Covers already present are skipped, so it only downloads what is new.
// Runs in GitHub Actions (.github/workflows/covers.yml). Locally:
//   npm install --no-save sharp@0.34.5 && node scripts/fetch-covers.mjs
// Cover art belongs to its publishers and artists; Open Library hosts it. See README, "Licenses".
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.COVER_BASE || 'https://covers.openlibrary.org/b/id/';
const OUT = process.env.COVERS_DIR || join(root, 'covers');
const LIMIT = +process.env.LIMIT || Infinity;
const SIZES = { s: [80, 120, 70], m: [160, 240, 72] };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const sharp = (await import('sharp')).default;
const data = JSON.parse(readFileSync(join(root, 'data', 'awards.json'), 'utf8'));
for (const k of Object.keys(SIZES)) mkdirSync(join(OUT, k), { recursive: true });
const has = q => Object.keys(SIZES).every(k => existsSync(join(OUT, k, q + '.webp')));
const jobs = Object.entries(data.ol || {}).filter(([q, o]) => o.c && !has(q)).slice(0, LIMIT);
console.log(`covers: ${jobs.length} to fetch`);

let ok = 0, missing = 0, failed = 0;
async function one([q, o]) {
  try {
    const r = await fetch(`${BASE}${o.c}-M.jpg?default=false`, { headers: { 'User-Agent': 'unoebasta (+https://github.com/foteev/unoebasta)' } });
    if (r.status === 404) { missing++; return; }
    if (!r.ok) { failed++; console.warn(q, 'HTTP', r.status); return; }
    const buf = Buffer.from(await r.arrayBuffer());
    const meta = await sharp(buf).metadata();
    if (!meta.width || meta.width < 40) { missing++; return; } // a placeholder, not a cover
    for (const [k, [w, h, quality]] of Object.entries(SIZES))
      await sharp(buf).resize(w, h, { fit: 'cover', position: 'top' }).webp({ quality }).toFile(join(OUT, k, q + '.webp'));
    ok++;
  } catch (e) { failed++; console.warn(q, e.message); }
}
// two at a time with a pause: Open Library is a free service, be gentle
for (let i = 0; i < jobs.length; i += 2) {
  await Promise.all(jobs.slice(i, i + 2).map(one));
  await sleep(300);
}
console.log(`covers: ${ok} saved, ${missing} without an image, ${failed} failed`);
if (failed > jobs.length / 2) process.exit(1);
