import { readJson, writeJson, hash } from './http.mjs';
import { PROVIDERS, PROVIDER_VERSION } from './providers.mjs';
import { FOUND_FIELDS, cleanUrl, validateFound } from './csv.mjs';

export function loadState(path) {
  const state = readJson(path, { version: 1, checks: {}, candidates: {} });
  if (state.version !== 1 || !state.checks || !state.candidates) throw new Error('Unsupported search state');
  return state;
}
export function selectWorks(catalog, { lang = 'en', kind = 'all', qids = [], forms = [], retrySearched = false, limit = 50 } = {}) {
  for (const q of qids) if (!catalog.works.some(w => w.qid === q)) throw new Error(`Unknown QID: ${q}`);
  return catalog.works.filter(w => (!qids.length || qids.includes(w.qid)) && (!forms.length || forms.includes(w.form)) && w.titles[lang]
    && (retrySearched || !catalog.history.some(r => r.qid === w.qid && r.lang === lang && r.kind === 'none'))
    && missingKinds(w, lang, kind).length)
    .sort((a, b) => ['short story', 'novelette', 'novella', 'novel'].indexOf(a.form) - ['short story', 'novelette', 'novella', 'novel'].indexOf(b.form) || b.latest - a.latest)
    .slice(0, limit);
}
function missingKinds(w, lang, kind) {
  const a = w.availability[lang];
  return (kind === 'all' ? ['full', 'audio', 'fragment'] : [kind]).filter(k => !a[k] && !(k === 'fragment' && a.full));
}

export async function runSearch({ catalog, state, statePath, http, lang = 'en', kind = 'all', providers = Object.keys(PROVIDERS),
  qids = [], forms = [], retrySearched = false, limit = 50, refresh = false, maxAge = 7 * 86400000,
  now = () => new Date().toISOString(), onCheck = () => {}, registry = PROVIDERS }) {
  const works = selectWorks(catalog, { lang, kind, qids, forms, retrySearched, limit });
  const summary = { works: works.length, checked: 0, resumed: 0, candidates: 0, errors: 0 };
  for (const w of works) for (const id of providers) {
    const provider = registry[id];
    if (!provider) throw new Error(`Unknown provider: ${id}`);
    const goals = missingKinds(w, lang, kind).filter(k => provider.kinds.includes(k));
    if (!provider.languages.includes(lang) || !goals.length) continue;
    const key = hash(JSON.stringify([PROVIDER_VERSION, id, w.qid, w.titles[lang], w.authors, w.form, lang, goals]));
    const old = state.checks[key], instant = now();
    if (!refresh && old && !['error', 'blocked'].includes(old.status) && Date.parse(instant) - Date.parse(old.checked_at) < maxAge) { summary.resumed++; continue; }
    const check = { qid: w.qid, lang, goals, provider: id, checked_at: instant };
    const requested = new Set();
    try {
      const result = await provider.search(w, lang, { get: url => { requested.add(url); return http.get(url); } });
      if (!Array.isArray(result.candidates) || !result.scope) throw new Error('Invalid provider result');
      const ids = []; let known = 0;
      for (const candidate of result.candidates) {
        candidate.url = cleanUrl(candidate.url);
        if (w.urls.includes(candidate.url)) { known++; continue; }
        const cid = hash(JSON.stringify([w.qid, lang, candidate.url])).slice(0, 20);
        const existing = state.candidates[cid];
        state.candidates[cid] = { ...candidate, id: cid, providers: [...new Set([...(existing?.providers || []), id])], review: existing?.review || { status: 'pending' } };
        ids.push(cid);
      }
      Object.assign(check, { status: ids.length ? 'candidates' : known ? 'already_known' : result.incomplete ? 'inconclusive' : 'not_found', scope: result.scope, candidate_ids: ids });
      summary.candidates += ids.length;
    } catch (e) {
      // A cached challenge page or invalid schema must not poison subsequent retries.
      for (const url of requested) http.invalidate?.(url);
      Object.assign(check, { status: [401, 403, 429].includes(e.status) ? 'blocked' : 'error', error: e.message });
      summary.errors++;
    }
    state.checks[key] = check; state.updated_at = now(); state.catalog_fingerprint = catalog.fingerprint;
    writeJson(statePath, state); summary.checked++; onCheck(check);
  }
  state.last_run = { at: now(), lang, kind, providers, summary };
  writeJson(statePath, state);
  return summary;
}

export function reviewCandidate(state, id, { reject = false, evidence, kind, tier, words = '', license = '', pub, part = '', archive = '', title, checkedAt = new Date().toISOString() } = {}) {
  const c = state.candidates[id];
  if (!c) throw new Error(`Unknown candidate: ${id}`);
  if (!evidence?.trim()) throw new Error('Manual evidence is required: open the URL and verify title, all authors, language, completeness and rights');
  if (reject) { c.review = { status: 'rejected', evidence, checked_at: checkedAt }; return; }
  if (!kind || !tier) throw new Error('Explicit --kind and --tier are required after opening the page');
  if (kind === 'none') throw new Error('Candidates cannot be approved as none');
  if (kind === 'full' && !/^[1-9]\d*$/.test(String(words))) throw new Error('Full text requires an estimated --words count');
  if (/\bCC\b/.test(license) && tier !== 't1') throw new Error('CC releases use tier t1');
  const row = Object.fromEntries(FOUND_FIELDS.map(k => [k, '']));
  Object.assign(row, { qid: c.qid, title: title || c.title, form: c.form, lang: c.lang, kind, site: c.site, url: c.url,
    tier, words: String(words), license, pub: pub ?? c.pub ?? '', part: String(part), archive, evidence: evidence.trim(), checked_at: checkedAt });
  validateFound(row); c.review = { status: 'approved', row };
}

export function approvedRows(state, catalog) {
  const rows = [], seen = new Set();
  for (const c of Object.values(state.candidates)) if (c.review.status === 'approved') {
    const r = c.review.row; validateFound(r);
    const w = catalog.works.find(w => w.qid === r.qid);
    if (!w) throw new Error(`Approved QID no longer in catalog: ${r.qid}`);
    if (r.qid !== c.qid || r.lang !== c.lang || cleanUrl(r.url) !== cleanUrl(c.url)) throw new Error(`Approval no longer matches candidate ${c.id}`);
    const key = JSON.stringify([r.qid, r.lang, r.kind, r.part, cleanUrl(r.url)]);
    if (!w.urls.includes(cleanUrl(r.url)) && !seen.has(key)) { rows.push(r); seen.add(key); }
  }
  return rows;
}
