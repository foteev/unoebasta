// Discovery produces a review queue, never an automatically publishable import.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, LANGS, FORMS } from './lib/catalog.mjs';
import { CachedHttp, writeJson } from './lib/http.mjs';
import { PROVIDERS } from './lib/providers.mjs';
import { loadState, runSearch, reviewCandidate, approvedRows } from './lib/search.mjs';
import { toCsv } from './lib/csv.mjs';
import { loadResearch, saveResearch, mergeResearch, addLead } from './lib/research.mjs';
import { continueSearch, CONTINUE_PROVIDERS } from './lib/continue-search.mjs';

import { readAwardRegistry, scopeByAward } from './lib/awards.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HELP = `Usage: npm run search -- <continue|run|list|approve|reject|export> [options]
  continue: --lang all|en|pl|ru|es --limit 50 (total across languages; default all)
       Plan follow-ups, discover, preserve candidates/notes and write report.json. Repeat to advance.
       npm run search:continue -- --limit 50
  run: --lang en|pl|ru|es --kind all|full|audio|fragment --limit 50
       --providers clarkesworld,escapepod,podcastle,pseudopod,gutenberg,librivox,google
       --award CODE (run and continue) --qid Q123,Q456 --forms "short story,novelette" --lead LEAD_ID --refresh
  list: prints candidate IDs, URLs, proposed kinds and review status
  approve: --id ID --kind full|audio|fragment --tier t1|t2|t2us|frag
           --evidence "Opened page; author, language, completeness and rights verified"
           [--words N --license "CC ..." --pub "..." --title "..." --part N --archive yes]
  reject: --id ID --evidence "Reason"
  export: --out data/found/YYYY-MM-DD.csv (approved rows only; refuses overwrite)
  All commands: --state .cache/search/state.json --research-dir data/research
  run also accepts --cache .cache/search/http. Use --refresh to repeat completed checks.
  Google Books requires environment variable GOOGLE_BOOKS_API_KEY (Actions secret of the same name).
  --retry-searched is a compatibility alias for --refresh; old CSV negatives never block a whole language.
  Research notes/checks are versioned; cached responses stay local. Errors never become kind=none.`;

try {
  const [command = 'help', ...args] = process.argv.slice(2), opts = {};
  const booleans = ['retry-searched', 'refresh'];
  const allowed = new Set(['award', 'lang', 'kind', 'limit', 'providers', 'qid', 'forms', 'lead', 'research-dir', 'id', 'evidence', 'tier', 'words', 'license', 'pub', 'title', 'part', 'archive', 'out', 'state', 'cache', ...booleans]);
  for (let i = 0; i < args.length; i++) {
    const name = args[i].replace(/^--/, '');
    if (!args[i].startsWith('--') || !allowed.has(name)) throw new Error(`Unknown option: ${args[i]}`);
    if (booleans.includes(name)) opts[name] = true;
    else { if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value for --${name}`); opts[name] = args[++i]; }
  }
  if (command === 'help' || command === '--help') { console.log(HELP); }
  else {
    if (opts.award && !['run', 'continue'].includes(command)) throw new Error('--award is available for run and continue');
    const scopedCatalog = researchDir => {
      const catalog = loadCatalog(root, { researchDir });
      return opts.award ? scopeByAward(catalog, readAwardRegistry(root), opts.award) : catalog;
    };
    const statePath = resolve(root, opts.state || '.cache/search/state.json'), state = loadState(statePath);
    const researchDir = resolve(root, opts['research-dir'] || 'data/research'), research = loadResearch(researchDir);
    mergeResearch(research, state.research);
    if (command === 'continue') {
      if (opts.lead) throw new Error('Use run --lead for a single source task');
      const lang = opts.lang || 'all', providers = opts.providers?.split(',') || CONTINUE_PROVIDERS, forms = opts.forms?.split(',') || [];
      if (!['all', ...LANGS].includes(lang) || forms.some(f => !FORMS.includes(f))) throw new Error('Invalid language or forms');
      const report = await continueSearch({ catalog: scopedCatalog(researchDir), state, statePath, research, researchDir,
        langs: lang === 'all' ? LANGS : [lang], kind: opts.kind || 'all', limit: Number(opts.limit || 50), providers, forms,
        qids: opts.qid?.split(',') || [], refresh: !!opts.refresh || !!opts['retry-searched'],
        http: new CachedHttp({ dir: resolve(root, opts.cache || '.cache/search/http'), googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY || '' }),
        onCheck: c => console.log(`${c.qid} ${c.lang} ${c.kind} ${c.provider}: ${c.status}${c.error ? ' — ' + c.error : ''}`) });
      console.log(JSON.stringify(report));
    } else if (command === 'run') {
      const lead = opts.lead ? research.leads.find(l => l.id === opts.lead) : undefined;
      if (opts.lead && !lead) throw new Error('Unknown lead');
      if (lead && (lead.type !== 'search' || !PROVIDERS[lead.source])) throw new Error(`Manual task: ${lead.next_action}; use npm run research -- note/update/check to record the result`);
      const lang = opts.lang || lead?.lang || 'en', kind = opts.kind || lead?.kind || 'all', limit = Number(opts.limit || 50);
      if (lead && (lang !== lead.lang || kind !== lead.kind)) throw new Error('Lead language/kind cannot be changed by run options');
      if (lead && opts.qid && opts.qid !== lead.qid) throw new Error('Lead work cannot be changed by run options');
      if (!LANGS.includes(lang) || !['all', 'full', 'audio', 'fragment'].includes(kind) || !Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Invalid lang, kind or limit (1..500)');
      const providers = opts.providers ? opts.providers.split(',') : lead ? [lead.source] : Object.keys(PROVIDERS);
      if (lead && !providers.includes(lead.source)) throw new Error('Lead source must be included');
      if (providers.some(p => !PROVIDERS[p])) throw new Error('Unknown provider');
      const forms = opts.forms ? opts.forms.split(',') : [];
      if (forms.some(f => !FORMS.includes(f))) throw new Error('Unknown form');
      const summary = await runSearch({ catalog: scopedCatalog(researchDir), research, researchDir, state, statePath, lang, kind, limit, providers, forms,
        qids: opts.qid ? opts.qid.split(',') : lead ? [lead.qid] : [], refresh: !!opts.refresh || !!opts['retry-searched'],
        http: new CachedHttp({ dir: resolve(root, opts.cache || '.cache/search/http'), googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY || '' }),
        onCheck: c => console.log(`${c.qid} ${c.lang} ${c.provider}: ${c.status}${c.error ? ' — ' + c.error : ''}`) });
      console.log(JSON.stringify(summary));
      if (summary.errors) process.exitCode = 1;
    } else if (command === 'list') {
      for (const c of Object.values(state.candidates)) console.log(`${c.id} ${c.review.status} ${c.qid} ${c.lang} proposed=${c.proposed_kind} requested=${c.requested_kind || c.proposed_kind} author=${c.match.author}\n  ${c.title} — ${c.authors.join('; ')}\n  ${c.url}\n  ${c.notes}${c.country ? ` Country: ${c.country}` : ''}\n  Leads: ${(c.lead_ids || []).join(', ')}${(c.lead_ids || []).flatMap(id => research.leads.find(l => l.id === id)?.notes || []).map(n => '\n  Note: ' + n.text).join('')}`);
    } else if (['approve', 'reject'].includes(command)) {
      const candidate = state.candidates[opts.id]; if (!candidate) throw new Error('Unknown candidate');
      if (!candidate.lead_ids?.length) {
        const lead = addLead(research, { qid: candidate.qid, lang: candidate.lang, kind: opts.kind || candidate.proposed_kind, source: candidate.providers?.[0] || 'publisher',
          hint: candidate.title, origin: candidate.metadata_url || 'Legacy candidate review', target: { url: candidate.url } }); candidate.lead_ids = [lead.id];
      }
      reviewCandidate(state, opts.id, { ...opts, research, reject: command === 'reject' });
      const ids = new Set([...(state.research?.leads || []).map(l => l.id), ...candidate.lead_ids]);
      state.research = { ...(state.research || { version: 1, checks: [] }), leads: research.leads.filter(l => ids.has(l.id)) };
      saveResearch(researchDir, research); writeJson(statePath, state);
      console.log(`${opts.id}: ${state.candidates[opts.id].review.status}`);
    } else if (command === 'export') {
      if (!opts.out) throw new Error('--out is required');
      const rows = approvedRows(state, loadCatalog(root, { researchDir })), out = resolve(root, opts.out);
      mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, toCsv(rows), { flag: 'wx' });
      console.log(`${rows.length} reviewed rows → ${out}`);
    } else throw new Error(HELP);
  }
} catch (e) { console.error(e.message); process.exitCode = 1; }
