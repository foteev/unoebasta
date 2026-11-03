import { readJson, writeJson, hash } from './http.mjs';
import { PROVIDERS } from './providers.mjs';
import { FOUND_FIELDS, cleanUrl, validateFound } from './csv.mjs';
import { titlesFor } from './matching.mjs';
import { emptyResearch, mergeResearch, saveResearch, missingKinds, checkKey, searchQuery, freshCheck, searchLead, titleLead, recordCheck, applyCheckToLead, recordReview, pausedLead } from './research.mjs';

export function loadState(path) {
  const state = readJson(path, { version: 1, checks: {}, candidates: {} });
  if (state.version !== 1 || !state.checks || !state.candidates) throw new Error('Unsupported search state');
  return state;
}
export function selectWorks(catalog, { lang = 'en', kind = 'all', qids = [], forms = [], limit = 50 } = {}) {
  for (const q of qids) if (!catalog.works.some(w => w.qid === q)) throw new Error(`Unknown QID: ${q}`);
  const order = lang === 'en' ? ['short story', 'novelette', 'novella', 'novel'] : ['novel', 'novella', 'novelette', 'short story'];
  return catalog.works.filter(w => (!qids.length || qids.includes(w.qid)) && (!forms.length || forms.includes(w.form)) && missingKinds(w, lang, kind).length)
    .sort((a, b) => Number(!titlesFor(a, lang).length) - Number(!titlesFor(b, lang).length) || order.indexOf(a.form) - order.indexOf(b.form) || b.latest - a.latest).slice(0, limit);
}
export const knownLink = (w, row) => w.knownLinks ? w.knownLinks.some(l => l.kind === row.kind && (l.lang || 'en') === row.lang && cleanUrl(l.url) === cleanUrl(row.url) && (+l.part || '') === (+row.part || '')) : w.urls.includes(cleanUrl(row.url));

export async function runSearch({ catalog, state, statePath, http, lang = 'en', kind = 'all', providers = Object.keys(PROVIDERS),
  qids = [], forms = [], limit = 50, refresh = false, maxAge = 7 * 86400000, research = catalog.research || emptyResearch(), researchDir,
  now = () => new Date().toISOString(), onCheck = () => {}, registry = PROVIDERS }) {
  for (const id of providers) {
    if (!registry[id]) throw new Error(`Unknown provider: ${id}`);
    if (!research.sources.some(s => s.id === id)) research.sources.push({ id, name: id, mode: 'auto', languages: registry[id].languages, kinds: registry[id].kinds, next_action: 'Review the matched work and legal access.' });
  }
  mergeResearch(research, state.research);
  for (const check of Object.values(state.checks)) if (check.check_key && check.query && check.kind) recordCheck(research, check);
  const touchedLeads = new Set((state.research?.leads || []).map(l => l.id)), touchedChecks = new Set((state.research?.checks || []).map(c => c.id));
  const summary = { works: 0, checked: 0, resumed: 0, candidates: 0, errors: 0, configuration_required: 0, needs_title: 0 };
  const save = () => {
    state.research = { version: 1, leads: research.leads.filter(l => touchedLeads.has(l.id)), checks: research.checks.filter(c => touchedChecks.has(c.id)) };
    state.updated_at = now(); state.catalog_fingerprint = catalog.fingerprint;
    if (researchDir) saveResearch(researchDir, research);
    writeJson(statePath, state);
  };
  for (const w of selectWorks(catalog, { lang, kind, qids, forms, limit: Infinity })) {
    if (summary.works >= limit) break;
    if (!titlesFor(w, lang).length) {
      const lead = titleLead(research, w, lang, now()); touchedLeads.add(lead.id); summary.needs_title++; summary.works++; save(); continue;
    }
    const jobs = [];
    for (const id of providers) {
      const provider = registry[id]; if (!provider.languages.includes(lang)) continue;
      const goals = missingKinds(w, lang, kind).filter(k => provider.kinds.includes(k));
      for (const goal of goals) {
        const key = checkKey(w, lang, id, goal);
        const durable = freshCheck(research, key, now(), maxAge);
        if (!refresh && durable) { summary.resumed++; continue; }
        const lead = searchLead(research, w, lang, id, goal, now());
        if (['confirmed', 'rejected'].includes(lead.status) || pausedLead(lead, now()) || (!refresh && lead.recheck_after && Date.parse(lead.recheck_after) > Date.parse(now()))) continue;
        jobs.push({ id, goal, key, lead });
      }
    }
    if (!jobs.length) continue; // Completed work-source pairs do not consume the next batch.
    summary.works++;
    for (const id of [...new Set(jobs.map(j => j.id))]) {
      const pending = jobs.filter(j => j.id === id), requested = new Set(); let result, failure;
      try {
        result = await registry[id].search(w, lang, { googleBooksConfigured: http?.googleBooksConfigured, get: url => { requested.add(url); return http.get(url); } });
        if (!Array.isArray(result.candidates) || !result.scope) throw new Error('Invalid provider result');
      } catch (e) { failure = e; for (const url of requested) http?.invalidate?.(url); }
      for (const { goal, key, lead } of pending) {
        touchedLeads.add(lead.id);
        const check = { qid: w.qid, lang, kind: goal, goals: [goal], provider: id, check_key: key, query: searchQuery(w, lang, id, goal), checked_at: now() };
        if (failure) {
          const status = failure.code === 'CONFIGURATION_REQUIRED' ? 'configuration_required' : [401, 403, 429].includes(failure.status) ? 'blocked' : 'error';
          Object.assign(check, { status, error: failure.message, scope: 'Provider request failed; no availability conclusion' });
          if (status === 'configuration_required') summary.configuration_required++; else summary.errors++;
        } else {
          const ids = []; let known = 0;
          for (const candidate of result.candidates) {
            const url = cleanUrl(candidate.url);
            if (knownLink(w, { ...candidate, url, lang, kind: goal })) { known++; continue; }
            const existing = Object.values(state.candidates).find(c => c.qid === w.qid && c.lang === lang && c.url === url && (c.requested_kind || c.review?.row?.kind || c.proposed_kind) === goal);
            const cid = existing?.id || hash(JSON.stringify([w.qid, lang, goal, url])).slice(0, 20);
            const savedDecision = lead.decisions?.filter(d => d.url === url && (!d.row || d.row.kind === goal)).at(-1);
            state.candidates[cid] = { ...existing, ...candidate, url, id: cid, requested_kind: goal,
              providers: [...new Set([...(existing?.providers || []), id])], lead_ids: [...new Set([...(existing?.lead_ids || []), lead.id])],
              notes: existing?.notes || candidate.notes, provider_notes: candidate.notes,
              review: existing?.review || (savedDecision ? { status: savedDecision.status, ...(savedDecision.row ? { row: savedDecision.row } : { evidence: savedDecision.evidence, checked_at: savedDecision.checked_at }) } : { status: 'pending' }) };
            ids.push(cid);
          }
          Object.assign(check, { status: ids.length ? 'candidates' : known ? 'already_known' : result.incomplete ? 'inconclusive' : 'not_found', scope: result.scope, candidate_ids: ids });
          summary.candidates += ids.length;
        }
        const recorded = recordCheck(research, check); touchedChecks.add(recorded.id); applyCheckToLead(lead, recorded);
        state.checks[key] = recorded; summary.checked++; save(); onCheck(recorded);
      }
    }
  }
  state.last_run = { at: now(), lang, kind, providers, summary }; save(); return summary;
}

export function reviewCandidate(state, id, { reject = false, evidence, kind, tier, words = '', license = '', pub, part = '', archive = '', title, research, checkedAt = new Date().toISOString() } = {}) {
  const c = state.candidates[id];
  if (!c) throw new Error(`Unknown candidate: ${id}`);
  if (!evidence?.trim()) throw new Error('Manual evidence is required: open the URL and verify title, all authors, language, completeness and rights');
  if (reject) { c.review = { status: 'rejected', evidence, checked_at: checkedAt }; if (research) recordReview(research, state, c, checkedAt); return; }
  if (!kind || !tier) throw new Error('Explicit --kind and --tier are required after opening the page');
  if (kind === 'none') throw new Error('Candidates cannot be approved as none');
  if (kind === 'full' && !/^[1-9]\d*$/.test(String(words))) throw new Error('Full text requires an estimated --words count');
  if (/\bCC\b/.test(license) && tier !== 't1') throw new Error('CC releases use tier t1');
  const row = Object.fromEntries(FOUND_FIELDS.map(k => [k, '']));
  Object.assign(row, { qid: c.qid, title: title || c.title, form: c.form, lang: c.lang, kind, site: c.site, url: c.url,
    tier, words: String(words), license, pub: pub ?? c.pub ?? '', part: String(part), archive, evidence: evidence.trim(), checked_at: checkedAt });
  validateFound(row); c.review = { status: 'approved', row }; if (research) recordReview(research, state, c, checkedAt);
}

export function approvedRows(state, catalog) {
  const rows = [], seen = new Set();
  for (const c of Object.values(state.candidates)) if (c.review.status === 'approved') {
    const r = c.review.row; validateFound(r);
    const w = catalog.works.find(w => w.qid === r.qid);
    if (!w) throw new Error(`Approved QID no longer in catalog: ${r.qid}`);
    if (r.qid !== c.qid || r.lang !== c.lang || cleanUrl(r.url) !== cleanUrl(c.url)) throw new Error(`Approval no longer matches candidate ${c.id}`);
    const key = JSON.stringify([r.qid, r.lang, r.kind, r.part, cleanUrl(r.url)]);
    if (!knownLink(w, r) && !seen.has(key)) { rows.push(r); seen.add(key); }
  }
  return rows;
}
