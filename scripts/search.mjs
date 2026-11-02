// Discovery produces a review queue, never an automatically publishable import.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, LANGS, FORMS } from './lib/catalog.mjs';
import { CachedHttp, writeJson } from './lib/http.mjs';
import { PROVIDERS } from './lib/providers.mjs';
import { loadState, runSearch, reviewCandidate, approvedRows } from './lib/search.mjs';
import { toCsv } from './lib/csv.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HELP = `Usage: npm run search -- <run|list|approve|reject|export> [options]
  run: --lang en|pl|ru|es --kind all|full|audio|fragment --limit 50
       --providers clarkesworld,escapepod,podcastle,pseudopod,gutenberg,librivox,google
       --qid Q123,Q456 --forms "short story,novelette" --retry-searched --refresh
  list: prints candidate IDs, URLs, proposed kinds and review status
  approve: --id ID --kind full|audio|fragment --tier t1|t2|t2us|frag
           --evidence "Opened page; author, language, completeness and rights verified"
           [--words N --license "CC ..." --pub "..." --title "..." --part N --archive yes]
  reject: --id ID --evidence "Reason"
  export: --out data/found/YYYY-MM-DD.csv (approved rows only; refuses overwrite)
  All commands: --state .cache/search/state.json
  run also accepts --cache .cache/search/http. Use --refresh to repeat completed checks.
  Google Books requires environment variable GOOGLE_BOOKS_API_KEY (Actions secret of the same name).
  State and cached responses stay local. Errors never become kind=none.`;

try {
  const [command = 'help', ...args] = process.argv.slice(2), opts = {};
  const booleans = ['retry-searched', 'refresh'];
  const allowed = new Set(['lang', 'kind', 'limit', 'providers', 'qid', 'forms', 'id', 'evidence', 'tier', 'words', 'license', 'pub', 'title', 'part', 'archive', 'out', 'state', 'cache', ...booleans]);
  for (let i = 0; i < args.length; i++) {
    const name = args[i].replace(/^--/, '');
    if (!args[i].startsWith('--') || !allowed.has(name)) throw new Error(`Unknown option: ${args[i]}`);
    if (booleans.includes(name)) opts[name] = true;
    else { if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value for --${name}`); opts[name] = args[++i]; }
  }
  if (command === 'help' || command === '--help') { console.log(HELP); }
  else {
    const statePath = resolve(root, opts.state || '.cache/search/state.json'), state = loadState(statePath);
    if (command === 'run') {
      const lang = opts.lang || 'en', kind = opts.kind || 'all', limit = Number(opts.limit || 50);
      if (!LANGS.includes(lang) || !['all', 'full', 'audio', 'fragment'].includes(kind) || !Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Invalid lang, kind or limit (1..500)');
      const providers = opts.providers ? opts.providers.split(',') : Object.keys(PROVIDERS);
      if (providers.some(p => !PROVIDERS[p])) throw new Error('Unknown provider');
      const forms = opts.forms ? opts.forms.split(',') : [];
      if (forms.some(f => !FORMS.includes(f))) throw new Error('Unknown form');
      const summary = await runSearch({ catalog: loadCatalog(root), state, statePath, lang, kind, limit, providers, forms,
        qids: opts.qid ? opts.qid.split(',') : [], retrySearched: !!opts['retry-searched'], refresh: !!opts.refresh,
        http: new CachedHttp({ dir: resolve(root, opts.cache || '.cache/search/http'), googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY || '' }),
        onCheck: c => console.log(`${c.qid} ${c.lang} ${c.provider}: ${c.status}${c.error ? ' — ' + c.error : ''}`) });
      console.log(JSON.stringify(summary));
      if (summary.errors) process.exitCode = 1;
    } else if (command === 'list') {
      for (const c of Object.values(state.candidates)) console.log(`${c.id} ${c.review.status} ${c.qid} ${c.lang} ${c.proposed_kind} author=${c.match.author}\n  ${c.title} — ${c.authors.join('; ')}\n  ${c.url}\n  ${c.notes}${c.country ? ` Country: ${c.country}` : ''}`);
    } else if (['approve', 'reject'].includes(command)) {
      reviewCandidate(state, opts.id, { ...opts, reject: command === 'reject' }); writeJson(statePath, state);
      console.log(`${opts.id}: ${state.candidates[opts.id].review.status}`);
    } else if (command === 'export') {
      if (!opts.out) throw new Error('--out is required');
      const rows = approvedRows(state, loadCatalog(root)), out = resolve(root, opts.out);
      mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, toCsv(rows), { flag: 'wx' });
      console.log(`${rows.length} reviewed rows → ${out}`);
    } else throw new Error(HELP);
  }
} catch (e) { console.error(e.message); process.exitCode = 1; }
