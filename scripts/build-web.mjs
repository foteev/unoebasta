// Builds the page from src/index.html + data/awards.json:
//   dist/web/index.html — the whole site in one file (libraries from CDN, fonts from Google Fonts), deployed to GitHub Pages.
// Usage: node scripts/build-web.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'data', 'awards.json'), 'utf8'));
const dataText = JSON.stringify(data).replace(/</g, '\\u003c');
const src = readFileSync(join(root, 'src', 'index.html'), 'utf8');
if (!src.includes('__AWARDS_JSON__')) throw new Error('placeholder __AWARDS_JSON__ missing in src/index.html');
const page = src.replace('__AWARDS_JSON__', () => dataText);
mkdirSync(join(root, 'dist', 'web'), { recursive: true });
writeFileSync(join(root, 'dist', 'web', 'index.html'), page);
console.log('dist/web/index.html:', (page.length / 1024).toFixed(0), 'KB,', data.aw.length, 'awards');
