// Builds the page from src/index.html + data/awards.json:
//   dist/web/index.html — the whole site in one file (libraries from CDN, fonts from Google Fonts), deployed to GitHub Pages;
//   dist/web/covers/ — cover images, when covers/ has any (scripts/fetch-covers.mjs); the page gets their list in DATA.covers.
// Usage: node scripts/build-web.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'data', 'awards.json'), 'utf8'));
const cdir = join(root, 'covers');
data.covers = existsSync(join(cdir, 'm')) ? readdirSync(join(cdir, 'm')).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)).filter(q => existsSync(join(cdir, 's', q + '.webp'))).sort() : [];
const dataText = JSON.stringify(data).replace(/</g, '\\u003c');
const src = readFileSync(join(root, 'src', 'index.html'), 'utf8');
if (!src.includes('__AWARDS_JSON__')) throw new Error('placeholder __AWARDS_JSON__ missing in src/index.html');
const brief = JSON.stringify(readFileSync(join(root, 'docs', 'search-brief.md'), 'utf8')).replace(/</g, '\\u003c');
if (!src.includes('__SEARCH_BRIEF_JSON__')) throw new Error('placeholder __SEARCH_BRIEF_JSON__ missing');
const page = src.replace('__AWARDS_JSON__', () => dataText).replace('__SEARCH_BRIEF_JSON__', () => brief);
mkdirSync(join(root, 'dist', 'web'), { recursive: true });
writeFileSync(join(root, 'dist', 'web', 'index.html'), page);
if (data.covers.length) cpSync(cdir, join(root, 'dist', 'web', 'covers'), { recursive: true });
console.log('dist/web/index.html:', (page.length / 1024).toFixed(0), 'KB,', data.aw.length, 'awards,', data.covers.length, 'covers');
