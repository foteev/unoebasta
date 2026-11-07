// Import every reviewed findings CSV in data/found/ that is not yet listed in data/imported-found.json, then recount the totals.
// Merging a findings PR only adds files to data/found/; the page reads src/index.html and data/awards.json,
// so its counters change only after this import is committed and merged (see docs/search-pipeline.md).
// Usage: node scripts/import-pending.mjs            list the files still to import and what they would change (writes nothing)
//        node scripts/import-pending.mjs --write    import them, record them in data/imported-found.json, run scripts/coverage.mjs
//                                                   and print the totals before and after
// Add --archive to accept Wayback rows, as for merge-found.mjs. A file that fails validation (for example a source that
// data/source-reviews.json excludes) is reported, left out of the list and makes the exit code 1. Files imported by hand
// before this list existed are in it from the start and are never imported again.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseCsv } from './lib/csv.mjs';
import { mergeFound } from './lib/merge-found.mjs';
import { coverageTotals, totalsLine } from './lib/coverage-totals.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const coveragePath = join(root, 'data/coverage.csv'), ledgerPath = join(root, 'data/imported-found.json');
const readLedger = () => { try { return JSON.parse(readFileSync(ledgerPath, 'utf8')).files || []; } catch { return []; } };
const readCoverage = () => { try { return parseCsv(readFileSync(coveragePath, 'utf8')); } catch { return []; } };
const changes = s => s.added + s.updated + s.links + s.fragments + s.titles;

export function importPending(source, data, files, { archive = false } = {}) {
  const report = [];
  for (const { name, text } of files) {
    try {
      const result = mergeFound(source, data, parseCsv(text), { archive });
      const stats = result.stats;
      if (changes(stats) || stats.skipped.length) report.push({ name, stats });
      source = result.source; data = result.data;
    } catch (e) { report.push({ name, error: e.message }); }
  }
  return { source, data, report };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const flags = process.argv.slice(2);
    if (flags.some(f => !['--write', '--archive'].includes(f))) throw new Error('usage: node scripts/import-pending.mjs [--write] [--archive]');
    const srcPath = join(root, 'src/index.html'), dataPath = join(root, 'data/awards.json'), dir = join(root, 'data/found');
    const source = readFileSync(srcPath, 'utf8'), original = JSON.parse(readFileSync(dataPath, 'utf8'));
    const done = readLedger();
    const files = readdirSync(dir).filter(f => f.endsWith('.csv') && !done.includes(f)).sort().map(name => ({ name, text: readFileSync(join(dir, name), 'utf8') }));
    const result = importPending(source, original, files, { archive: flags.includes('--archive') });
    const pending = result.report.filter(r => r.stats && changes(r.stats));
    for (const r of result.report) {
      if (r.error) console.log(`${r.name}: cannot import: ${r.error}`);
      else console.log(`${r.name}: ${changes(r.stats) ? JSON.stringify({ ...r.stats, skipped: undefined }) : 'nothing new'}${r.stats.skipped.length ? `; skipped: ${r.stats.skipped.join(' | ')}` : ''}`);
    }
    if (result.report.some(r => r.error)) process.exitCode = 1;
    if (!files.length) console.log('Nothing to import: every file in data/found/ is listed in data/imported-found.json.');
    else if (!flags.includes('--write')) console.log(`${files.length} file(s) not imported yet. Run: node scripts/import-pending.mjs --write`);
    else {
      const failed = new Set(result.report.filter(r => r.error).map(r => r.name));
      writeFileSync(ledgerPath, JSON.stringify({ files: [...new Set([...done, ...files.map(f => f.name).filter(n => !failed.has(n))])].sort() }, null, 2) + '\n');
      const before = coverageTotals(readCoverage());
      if (result.source !== source) writeFileSync(srcPath, result.source);
      if (JSON.stringify(result.data) !== JSON.stringify(original)) writeFileSync(dataPath, JSON.stringify(result.data));
      const run = spawnSync(process.execPath, [join(root, 'scripts/coverage.mjs')], { stdio: 'inherit' });
      if (run.status) throw new Error('scripts/coverage.mjs failed');
      const after = coverageTotals(readCoverage());
      console.log(`Before: ${totalsLine(before)}\nAfter:  ${totalsLine(after)}`);
    }
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
