import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadCatalog, LANGS } from './lib/catalog.mjs';
import { loadResearch, saveResearch, addAlias, addLead, noteLead, updateLead, buildPlan, seedResearch, importState, KINDS, recordCheck, checkKey, searchQuery, applyCheckToLead, candidateFromLead, mergeResearch } from './lib/research.mjs';
import { loadState } from './lib/search.mjs';
import { writeJson } from './lib/http.mjs';

import { readAwardRegistry, scopeByAward } from './lib/awards.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HELP = `Usage: npm run research -- <seed|list|plan|add|note|update|check|candidate|alias|import-state> [options]
  --research-dir data/research (one writer per directory)
  seed: preserve CSV notes, localized author names and all missing translation-title tasks
  list: [--lang en|pl|ru|es --status open|needs_title|candidate|searched|blocked|confirmed|rejected|deferred --source ID --qid Q123]
  plan: --lang all|en|pl|ru|es --kind all|full|audio|fragment --limit 50 [--out .cache/search/plan.json --providers ID,ID --qid Q123 --award CODE]
  add: --qid Q123 --lang ru --kind full --source publisher --hint "Possible publication" --origin "Where the lead came from"
       [--url URL --publication "Collection, edition, translator, ISBN" --next-action "What to check"]
  note: --id LEAD_ID --note "Research note; provenance, doubts or next step"
  update: --id LEAD_ID [--status STATUS --next-action "..." --recheck-after UTC_ISO --evidence "Reason"]
  check: --id LEAD_ID --status not_found|blocked|inconclusive --evidence "Exactly what was opened or searched"
  candidate: --id LEAD_ID [--url URL --kind full|audio|fragment --title "Edition title" --state .cache/search/state.json]
  alias: --type titles|authors --qid Q123 --lang ru --value "Published name" --origin "Supporting source"
  import-state: [--file .cache/search/state.json --from-research downloaded/data/research] (at least one; preserve human notes)
  A lead can have a publication reference without a URL. Bibliography is not proof of free access.`;
try {
  const [command = 'help', ...args] = process.argv.slice(2), o = {};
  const allowed = new Set(['award', 'research-dir', 'lang', 'status', 'source', 'qid', 'kind', 'limit', 'out', 'providers', 'hint', 'origin', 'url', 'publication', 'next-action', 'id', 'note', 'recheck-after', 'evidence', 'type', 'value', 'file', 'state', 'title', 'from-research']);
  for (let i = 0; i < args.length; i++) { const key = args[i].slice(2); if (!args[i].startsWith('--') || !allowed.has(key) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Invalid option ${args[i]}`); o[key] = args[++i]; }
  if (['help', '--help'].includes(command)) console.log(HELP);
  else {
    if (o.award && command !== 'plan') throw new Error('--award is available for plan');
    const dir = resolve(root, o['research-dir'] || 'data/research'), research = loadResearch(dir), catalog = loadCatalog(root, { researchDir: dir });
    if (o.lang && !['all', ...LANGS].includes(o.lang)) throw new Error('Unsupported language');
    if (o.award) catalog.works = scopeByAward(catalog, readAwardRegistry(root), o.award).works;
    const qids = o.qid?.split(',') || [];
    if (qids.length && !(command === 'alias' && o.type === 'authors') && qids.some(q => !catalog.works.some(w => w.qid === q))) throw new Error('Unknown work QID');
    if (qids.length > 1 && !['plan', 'list'].includes(command)) throw new Error('This command requires one QID');
    if (command === 'seed') { console.log(JSON.stringify(seedResearch(catalog, research))); saveResearch(dir, research); }
    else if (command === 'list') {
      const leads = research.leads.filter(l => (!o.lang || o.lang === 'all' || l.lang === o.lang) && (!o.status || l.status === o.status) && (!o.source || l.source === o.source) && (!qids.length || qids.includes(l.qid)));
      for (const l of leads) console.log(`${l.id} ${l.qid} ${l.lang} ${l.kind} ${l.source} ${l.status}\n  ${l.hint}\n  Next: ${l.next_action}${l.target?.url ? '\n  ' + l.target.url : ''}${l.notes.length ? '\n  Notes: ' + l.notes.map(n => n.text).join(' | ') : ''}`);
      console.log(`${leads.length} leads`);
    } else if (command === 'plan') {
      const limit = Number(o.limit || 50), kind = o.kind || 'all';
      if (!Number.isInteger(limit) || limit < 1 || limit > 500 || !['all', ...KINDS].includes(kind)) throw new Error('Invalid kind or limit (1..500)');
      const providers = o.providers?.split(','); if (providers?.some(id => !research.sources.some(s => s.id === id))) throw new Error('Unknown source');
      const selected = qids.length ? { ...catalog, works: catalog.works.filter(w => qids.includes(w.qid)) } : catalog;
      const plan = buildPlan(selected, research, { langs: !o.lang || o.lang === 'all' ? LANGS : [o.lang], kind, limit, providers });
      const out = resolve(root, o.out || '.cache/search/plan.json'); mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(plan, null, 2) + '\n'); saveResearch(dir, research);
      console.log(JSON.stringify({ targets: plan.targets, tasks: plan.tasks.length, languages: plan.languages, modes: plan.tasks.reduce((a, t) => (a[t.mode] = (a[t.mode] || 0) + 1, a), {}), out }));
    } else if (command === 'alias') {
      if (o.type === 'authors' && !catalog.data.authors[o.qid]) throw new Error('Unknown author QID');
      const added = addAlias(research, o.type, { qid: o.qid, lang: o.lang, value: o.value, origin: o.origin, recorded_at: new Date().toISOString() }); saveResearch(dir, research); console.log(added ? 'Alias added' : 'Alias already known');
    } else if (command === 'add') {
      const lead = addLead(research, { qid: o.qid, lang: o.lang, kind: o.kind, source: o.source, hint: o.hint, origin: o.origin,
        target: { ...(o.url ? { url: o.url } : {}), ...(o.publication ? { publication: o.publication } : {}) }, ...(o['next-action'] ? { next_action: o['next-action'] } : {}) }); saveResearch(dir, research); console.log(lead.id);
    } else if (command === 'note') { noteLead(research, o.id, o.note); saveResearch(dir, research); console.log('Note saved'); }
    else if (command === 'update') {
      updateLead(research, o.id, { status: o.status, next_action: o['next-action'], recheck_after: o['recheck-after'], evidence: o.evidence }); saveResearch(dir, research); console.log('Lead updated');
    } else if (command === 'check') {
      const lead = research.leads.find(l => l.id === o.id), w = catalog.works.find(w => w.qid === lead?.qid);
      if (!lead || !w || !KINDS.includes(lead.kind) || !['not_found', 'blocked', 'inconclusive'].includes(o.status) || !o.evidence) throw new Error('Choose a specific full/audio/fragment lead, an allowed status and scoped evidence');
      const locator = lead.type === 'search' ? undefined : lead.target;
      const check = recordCheck(research, { qid: lead.qid, lang: lead.lang, kind: lead.kind, provider: lead.source,
        query: searchQuery(w, lead.lang, lead.source, lead.kind, locator), check_key: checkKey(w, lead.lang, lead.source, lead.kind, locator), status: o.status, scope: o.evidence, checked_at: new Date().toISOString() });
      applyCheckToLead(lead, check); saveResearch(dir, research); console.log(check.id);
    } else if (command === 'candidate') {
      const path = resolve(root, o.state || '.cache/search/state.json'), state = loadState(path);
      mergeResearch(research, state.research);
      const candidate = candidateFromLead(research, catalog, state, o.id, { url: o.url, kind: o.kind, title: o.title });
      const ids = new Set([...(state.research?.leads || []).map(l => l.id), ...candidate.lead_ids]);
      state.research = { ...(state.research || { version: 1, checks: [] }), leads: research.leads.filter(l => ids.has(l.id)) };
      saveResearch(dir, research); writeJson(path, state); console.log(`${candidate.id}: pending manual verification`);
    } else if (command === 'import-state') {
      if (!o.file && !o['from-research']) throw new Error('--file or --from-research required');
      const before = { leads: research.leads.length, checks: research.checks.length };
      if (o['from-research']) mergeResearch(research, loadResearch(resolve(root, o['from-research'])));
      if (o.file) importState(research, JSON.parse(readFileSync(resolve(root, o.file), 'utf8')), catalog, basename(o.file));
      console.log(JSON.stringify({ leads: research.leads.length - before.leads, checks: research.checks.length - before.checks })); saveResearch(dir, research);
    } else throw new Error(HELP);
  }
} catch (e) { console.error(e.message); process.exitCode = 1; }
