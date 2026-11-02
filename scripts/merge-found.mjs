// Merge reviewed search CSV into READ, excerpts and translated titles. Safe to run twice.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './lib/csv.mjs';
import { mergeFound } from './lib/merge-found.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
try {
  const [file, ...flags] = process.argv.slice(2);
  if (!file || flags.some(f => f !== '--archive')) throw new Error('usage: node scripts/merge-found.mjs <found.csv> [--archive]');
  const srcPath = join(root, 'src/index.html'), dataPath = join(root, 'data/awards.json');
  const source = readFileSync(srcPath, 'utf8'), original = JSON.parse(readFileSync(dataPath, 'utf8'));
  const result = mergeFound(source, original, parseCsv(readFileSync(file, 'utf8')), { archive: flags.includes('--archive') });
  if (result.source !== source) writeFileSync(srcPath, result.source);
  if (JSON.stringify(result.data) !== JSON.stringify(original)) writeFileSync(dataPath, JSON.stringify(result.data));
  console.log(JSON.stringify(result.stats, null, 2));
} catch (e) { console.error(e.message); process.exitCode = 1; }
