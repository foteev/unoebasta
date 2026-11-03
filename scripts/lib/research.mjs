import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { hash } from './http.mjs';
import { cleanUrl } from './csv.mjs';
import { normalize, titlesFor, authorsFor } from './matching.mjs';

export const LANGUAGES = ['en', 'pl', 'ru', 'es'];
export const KINDS = ['full', 'audio', 'fragment'];
export const LEAD_STATUSES = ['open', 'needs_title', 'candidate', 'searched', 'inconclusive', 'blocked', 'confirmed', 'rejected', 'deferred'];
export const CHECK_STATUSES = ['candidates', 'not_found', 'already_known', 'inconclusive', 'blocked', 'error', 'configuration_required'];
export const pausedLead = (lead, now) => lead.status === 'deferred' && (!lead.recheck_after || Date.parse(lead.recheck_after) > Date.parse(now));
const DAY = 86400000;
const bundledSources = () => JSON.parse(readFileSync(new URL('../../data/research/sources.json', import.meta.url), 'utf8')).sources;
export const emptyResearch = () => ({ version: 1, aliases: { version: 1, titles: [], authors: [] }, sources: bundledSources(), leads: [], checks: [] });
export const missingKinds = (w, lang, kind = 'all') => (kind === 'all' ? KINDS : [kind]).filter(k => !w.availability[lang]?.[k] && !(k === 'fragment' && w.availability[lang]?.full));
const timestamp = s => typeof s === 'string' && /Z$/.test(s) && Number.isFinite(Date.parse(s));
const qid = q => /^Q[1-9]\d*$/.test(q);
const readLines = path => existsSync(path) ? readFileSync(path, 'utf8').split('\n').filter(s => s.trim()).map((s, i) => {
  try { return JSON.parse(s); } catch { throw new Error(`${path}:${i + 1}: invalid JSON`); }
}) : [];
function atomic(path, text) {
  mkdirSync(dirname(path), { recursive: true }); const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, text); renameSync(temp, path);
}
export function publicUrl(value) {
  const url = cleanUrl(value), u = new URL(url);
  if ([...u.searchParams.keys()].some(k => /^(key|api[_-]?key|access_token|token|password|authorization)$/i.test(k))) throw new Error('Credential query parameters cannot be saved in research');
  return url;
}
export function loadResearch(dir) {
  const r = emptyResearch();
  for (const name of ['aliases', 'sources']) if (existsSync(join(dir, name + '.json'))) {
    const value = JSON.parse(readFileSync(join(dir, name + '.json'), 'utf8'));
    if (value.version !== 1) throw new Error(`Unsupported ${name} schema`);
    r[name] = name === 'sources' ? value.sources : value;
  }
  r.leads = readLines(join(dir, 'leads.jsonl')); r.checks = readLines(join(dir, 'checks.jsonl'));
  validateResearch(r); return r;
}
export function validateResearch(r) {
  if (r.version !== 1 || r.aliases?.version !== 1 || !Array.isArray(r.sources) || !Array.isArray(r.leads) || !Array.isArray(r.checks) || !Array.isArray(r.aliases.titles) || !Array.isArray(r.aliases.authors)) throw new Error('Invalid research registry schema');
  const ids = new Set();
  for (const s of r.sources) {
    if (!s.id || ids.has(s.id) || !['auto', 'manual'].includes(s.mode) || !s.next_action || !s.languages?.length || s.languages.some(l => !LANGUAGES.includes(l)) || !s.kinds?.length || s.kinds.some(k => ![...KINDS, 'title', 'any'].includes(k))) throw new Error('Invalid research source');
    if (s.url) publicUrl(s.url); ids.add(s.id);
  }
  for (const type of ['titles', 'authors']) for (const a of r.aliases[type]) {
    if (!qid(a.qid) || !LANGUAGES.includes(a.lang) || !a.value?.trim() || !a.origin?.trim()) throw new Error(`Invalid ${type} alias`);
  }
  const leadIds = new Set();
  for (const l of r.leads) {
    if (!qid(l.qid) || !LANGUAGES.includes(l.lang) || ![...KINDS, 'title', 'any'].includes(l.kind) || !ids.has(l.source) || !LEAD_STATUSES.includes(l.status) || !l.id || leadIds.has(l.id) || !l.hint || !l.origin || !l.next_action || !timestamp(l.created_at) || !timestamp(l.updated_at)) throw new Error(`Invalid research lead ${l.id || ''}`);
    if (l.target?.url) publicUrl(l.target.url);
    if (l.recheck_after && !timestamp(l.recheck_after)) throw new Error(`Invalid recheck date ${l.id}`);
    if (l.notes?.some(n => !n.text || !timestamp(n.at))) throw new Error(`Invalid note ${l.id}`);
    leadIds.add(l.id);
  }
  const checkIds = new Set();
  for (const c of r.checks) {
    if (!c.id || checkIds.has(c.id) || !qid(c.qid) || !LANGUAGES.includes(c.lang) || !KINDS.includes(c.kind) || !c.provider || !c.check_key || !c.query || !CHECK_STATUSES.includes(c.status) || !c.scope || !timestamp(c.checked_at)) throw new Error(`Invalid scoped check ${c.id || ''}`);
    checkIds.add(c.id);
  }
  return r;
}
export function saveResearch(dir, r) {
  validateResearch(r);
  atomic(join(dir, 'aliases.json'), JSON.stringify(r.aliases, null, 2) + '\n');
  atomic(join(dir, 'sources.json'), JSON.stringify({ version: 1, sources: r.sources }, null, 2) + '\n');
  for (const name of ['leads', 'checks']) atomic(join(dir, name + '.jsonl'), r[name].map(x => JSON.stringify(x)).join('\n') + (r[name].length ? '\n' : ''));
}
export function addAlias(r, type, record) {
  if (!['titles', 'authors'].includes(type)) throw new Error('Alias type must be titles or authors');
  const key = a => JSON.stringify([a.qid, a.lang, normalize(a.value)]);
  if (!r.aliases[type].some(a => key(a) === key(record))) {
    r.aliases[type].push(record);
    if (type === 'titles') for (const lead of r.leads.filter(l => l.type === 'title' && l.qid === record.qid && l.lang === record.lang)) {
      lead.status = 'confirmed'; lead.updated_at = record.recorded_at || new Date().toISOString();
      lead.notes.push({ at: lead.updated_at, text: `Translation title recorded: ${record.value}; ${record.origin}` });
    }
    validateResearch(r); return true;
  }
  return false;
}
export function addLead(r, record, now = new Date().toISOString()) {
  const source = r.sources.find(s => s.id === record.source);
  if (!source) throw new Error(`Unknown source: ${record.source}`);
  const target = { ...(record.target || {}) }; if (target.url) target.url = publicUrl(target.url);
  const id = record.id || 'lead-' + hash(JSON.stringify([record.qid, record.lang, record.kind, record.source, record.type || 'investigate', target, record.query_key || ''])).slice(0, 20);
  let lead = r.leads.find(l => l.id === id);
  if (lead) return lead; // Human notes, next actions and decisions are never replaced by discovery.
  lead = { ...record, id, type: record.type || 'investigate', target, status: record.status || 'open', next_action: record.next_action || source.next_action, notes: record.notes || [], created_at: record.created_at || now, updated_at: now };
  r.leads.push(lead); validateResearch(r); return lead;
}
export function noteLead(r, id, text, now = new Date().toISOString()) {
  const lead = r.leads.find(l => l.id === id); if (!lead) throw new Error(`Unknown lead: ${id}`);
  if (!text?.trim()) throw new Error('Note text required');
  lead.notes ||= []; lead.notes.push({ at: now, text: text.trim() }); lead.updated_at = now; return lead;
}
export function candidateFromLead(r, catalog, state, id, { url, kind, title, now = new Date().toISOString() } = {}) {
  const lead = r.leads.find(l => l.id === id), w = catalog.works.find(w => w.qid === lead?.qid);
  if (!lead || !w || lead.kind === 'title') throw new Error('Choose an availability lead; translation-title tasks need a sourced alias first');
  kind ||= lead.kind;
  if (!KINDS.includes(kind) || (lead.kind !== 'any' && kind !== lead.kind)) throw new Error('Choose the specific full/audio/fragment kind of this lead');
  url = publicUrl(url || lead.target.url);
  const cid = hash(JSON.stringify([w.qid, lead.lang, kind, url])).slice(0, 20), existing = state.candidates[cid];
  const candidate = { qid: w.qid, lang: lead.lang, kind, title: title || w.titles[lead.lang] || w.title, form: w.form, authors: w.authors,
    url, site: r.sources.find(s => s.id === lead.source).name, proposed_kind: kind, requested_kind: kind, source_checked_at: now,
    match: { title: 'unconfirmed', author: 'unconfirmed' }, notes: lead.hint, providers: [lead.source], review: { status: 'pending' },
    ...existing, lead_ids: [...new Set([...(existing?.lead_ids || []), lead.id])] };
  candidate.id = cid; state.candidates[cid] = candidate;
  if (!['confirmed', 'rejected'].includes(lead.status)) lead.status = 'candidate';
  lead.updated_at = now; return candidate;
}
export function updateLead(r, id, { status, next_action, recheck_after, evidence }, now = new Date().toISOString()) {
  const lead = r.leads.find(l => l.id === id); if (!lead) throw new Error(`Unknown lead: ${id}`);
  if (status === 'confirmed') throw new Error('Confirm availability through search approve with review evidence');
  if (status && !LEAD_STATUSES.includes(status)) throw new Error('Unknown lead status');
  if (status && ['rejected', 'deferred', 'searched'].includes(status) && !evidence) throw new Error('A reason is required for this decision');
  if (status) lead.status = status;
  if (next_action) lead.next_action = next_action;
  if (recheck_after !== undefined) { if (recheck_after && !timestamp(recheck_after)) throw new Error('Use a UTC ISO recheck date'); lead.recheck_after = recheck_after; }
  if (evidence) noteLead(r, id, evidence, now);
  lead.updated_at = now; validateResearch(r); return lead;
}
export function searchQuery(w, lang, provider, kind, locator) {
  return { version: 2, provider, kind, lang, titles: titlesFor(w, lang), authors: authorsFor(w, lang), ...(locator ? { locator } : {}) };
}
export const checkKey = (w, lang, provider, kind, locator) => hash(JSON.stringify([w.qid, searchQuery(w, lang, provider, kind, locator)]));
export function freshCheck(r, key, now, maxAge = 7 * DAY) {
  const latest = r.checks.filter(c => c.check_key === key).reverse().sort((a, b) => Date.parse(b.checked_at) - Date.parse(a.checked_at))[0];
  return latest && !['error', 'blocked', 'configuration_required'].includes(latest.status) && Date.parse(now) - Date.parse(latest.checked_at) < maxAge ? latest : undefined;
}
export function recordCheck(r, check) {
  const record = { ...check, id: check.id || 'check-' + hash(JSON.stringify([check.check_key, check.checked_at, check.status, check.scope])).slice(0, 24) };
  if (!r.checks.some(c => c.id === record.id)) r.checks.push(record);
  validateResearch(r); return record;
}
export function searchLead(r, w, lang, provider, kind, now) {
  const key = checkKey(w, lang, provider, kind);
  const url = provider === 'fantlab' && w.fantlab ? `https://fantlab.ru/work${w.fantlab}` : provider === 'isfdb' && w.isfdb ? `https://www.isfdb.org/cgi-bin/title.cgi?${w.isfdb}` : '';
  return addLead(r, { qid: w.qid, lang, kind, source: provider, type: 'search', query_key: key,
    ...(url ? { target: { url } } : {}),
    hint: `Search ${titlesFor(w, lang).join(' / ')} in ${provider}`, origin: 'Catalog coverage gap; exact title and author query' }, now);
}
export function applyCheckToLead(lead, check) {
  // A user may close or defer a task; preserve that decision and all annotations.
  if (['confirmed', 'rejected'].includes(lead.status) || pausedLead(lead, check.checked_at)) return;
  lead.status = ({ candidates: 'candidate', not_found: 'searched', already_known: 'searched', inconclusive: 'inconclusive', blocked: 'blocked', error: 'blocked', configuration_required: 'blocked' })[check.status];
  lead.last_checked = check.checked_at; lead.updated_at = check.checked_at;
  lead.recheck_after = ['not_found', 'already_known', 'inconclusive'].includes(check.status) ? new Date(Date.parse(check.checked_at) + 7 * DAY).toISOString() : '';
}
export function mergeResearch(base, incoming = {}) {
  for (const source of incoming.sources || []) if (!base.sources.some(s => s.id === source.id)) base.sources.push(source);
  for (const type of ['titles', 'authors']) for (const alias of incoming.aliases?.[type] || []) addAlias(base, type, alias);
  for (const lead of incoming.leads || []) {
    const old = base.leads.find(l => l.id === lead.id);
    if (!old) { base.leads.push(structuredClone(lead)); continue; }
    if (JSON.stringify([old.qid, old.lang, old.kind, old.source, old.target]) !== JSON.stringify([lead.qid, lead.lang, lead.kind, lead.source, lead.target])) throw new Error(`Conflicting lead identity ${lead.id}`);
    for (const field of ['notes', 'decisions']) {
      const values = [...(old[field] || []), ...(lead[field] || [])];
      old[field] = [...new Map(values.map(v => [JSON.stringify(v), v])).values()];
    }
    if (lead.hint !== old.hint && !old.notes.some(n => n.text === lead.hint)) old.notes.push({ at: lead.updated_at, text: lead.hint });
    if (Date.parse(lead.last_checked || 0) > Date.parse(old.last_checked || 0)) old.last_checked = lead.last_checked;
    if (!['confirmed', 'rejected'].includes(old.status) && !pausedLead(old, lead.updated_at) && lead.updated_at > old.updated_at) {
      old.status = lead.status;
      if (lead.recheck_after !== undefined) old.recheck_after = lead.recheck_after;
    }
    old.updated_at = [old.updated_at, lead.updated_at].sort().at(-1);
  }
  for (const check of incoming.checks || []) recordCheck(base, check);
  validateResearch(base); return base;
}
export function recordReview(r, state, candidate, now) {
  for (const id of candidate.lead_ids || []) {
    const lead = r.leads.find(l => l.id === id); if (!lead) continue;
    const review = candidate.review, row = review.row;
    const decision = { candidate_id: candidate.id, url: candidate.url, status: review.status,
      checked_at: row?.checked_at || review.checked_at || now, evidence: row?.evidence || review.evidence, ...(row ? { row } : {}) };
    lead.decisions ||= []; if (lead.decisions.some(d => JSON.stringify(d) === JSON.stringify(decision))) continue;
    lead.decisions.push(decision); lead.updated_at = decision.checked_at;
    noteLead(r, lead.id, `${review.status}: ${decision.evidence}`, decision.checked_at);
    if (review.status === 'approved' && (lead.kind === row.kind || lead.kind === 'any')) lead.status = 'confirmed';
    else if (review.status === 'rejected') {
      const others = Object.values(state.candidates).filter(c => c.lead_ids?.includes(id));
      if (others.every(c => c.review.status === 'rejected')) {
        lead.status = lead.type === 'search' ? 'searched' : 'rejected';
        if (lead.type === 'search') lead.recheck_after = new Date(Date.parse(decision.checked_at) + 7 * DAY).toISOString();
      }
    }
  }
}
export function titleLead(r, w, lang, now) {
  const source = lang === 'ru' && w.fantlab ? 'fantlab' : lang === 'es' ? 'lecturalia' : w.isfdb ? 'isfdb' : 'author';
  const url = source === 'fantlab' ? `https://fantlab.ru/work${w.fantlab}` : source === 'isfdb' ? `https://www.isfdb.org/cgi-bin/title.cgi?${w.isfdb}` : '';
  return addLead(r, { qid: w.qid, lang, kind: 'title', source, type: 'title', status: 'needs_title', target: url ? { url } : {},
    hint: `Find the published ${lang} title of ${w.title}; the catalog has no target-language title.`, origin: 'data/awards.json and research aliases',
    next_action: 'Identify the translation title, translator or edition from a bibliography or publisher; add a sourced title alias. Unknown title does not mean no translation exists.' }, now);
}
export function buildPlan(catalog, r, { langs = LANGUAGES, kind = 'all', providers, limit = 50, now = new Date().toISOString(), maxAge = 7 * DAY, refresh = false } = {}) {
  const lists = langs.map(lang => catalog.works.filter(w => missingKinds(w, lang, kind).length)
    .sort((a, b) => Number(r.leads.some(l => l.qid === b.qid && l.lang === lang && l.type === 'investigate' && !['confirmed', 'rejected'].includes(l.status))) - Number(r.leads.some(l => l.qid === a.qid && l.lang === lang && l.type === 'investigate' && !['confirmed', 'rejected'].includes(l.status)))
      || (lang === 'en' ? 0 : Number(!titlesFor(a, lang).length) - Number(!titlesFor(b, lang).length))
      || (lang === 'en' ? ['short story', 'novelette', 'novella', 'novel'] : ['novel', 'novella', 'novelette', 'short story']).indexOf(a.form) - (lang === 'en' ? ['short story', 'novelette', 'novella', 'novel'] : ['novel', 'novella', 'novelette', 'short story']).indexOf(b.form) || b.latest - a.latest).map(w => ({ w, lang })));
  const tasks = []; let targets = 0;
  while (targets < limit && lists.some(a => a.length)) for (const list of lists) {
    if (targets >= limit || !list.length) continue;
    const { w, lang } = list.shift(), goals = missingKinds(w, lang, kind), current = [];
    if (!titlesFor(w, lang).length) { const lead = titleLead(r, w, lang, now); if (!['confirmed', 'rejected'].includes(lead.status) && !pausedLead(lead, now)) current.push(lead); }
    else {
      for (const lead of r.leads.filter(l => l.qid === w.qid && l.lang === lang && l.type === 'investigate' && !['confirmed', 'rejected'].includes(l.status) && !pausedLead(l, now) && (!l.recheck_after || Date.parse(l.recheck_after) <= Date.parse(now)))) if (!providers || providers.includes(lead.source)) current.push(lead);
      for (const source of r.sources.filter(s => s.id !== 'legacy' && s.languages.includes(lang) && (!providers || providers.includes(s.id)))) for (const k of goals.filter(k => source.kinds.includes(k))) {
        const key = checkKey(w, lang, source.id, k);
        if (!refresh && freshCheck(r, key, now, maxAge)) continue;
        const lead = searchLead(r, w, lang, source.id, k, now);
        if (['confirmed', 'rejected'].includes(lead.status) || pausedLead(lead, now) || (lead.recheck_after && Date.parse(lead.recheck_after) > Date.parse(now) && !refresh)) continue;
        current.push(lead);
      }
    }
    if (!current.length) continue;
    targets++;
    for (const lead of current) tasks.push({ id: lead.id, qid: w.qid, lang, kind: lead.kind, source: lead.source,
      mode: lead.kind === 'title' ? 'manual' : r.sources.find(s => s.id === lead.source).mode, status: lead.status,
      title: w.titles[lang] || '', catalog_title: w.title, title_variants: titlesFor(w, lang), authors: authorsFor(w, lang), hint: lead.hint,
      origin: lead.origin, target: lead.target, next_action: lead.next_action, notes: lead.notes, recheck_after: lead.recheck_after || '' });
  }
  return { version: 1, generated_at: now, languages: langs, targets, tasks };
}
export function seedResearch(catalog, r, now = new Date().toISOString()) {
  const counts = { aliases: 0, legacy_notes: 0, missing_titles: 0 };
  for (const [q, raw] of Object.entries(catalog.data.authors)) for (const [lang, i] of [['pl', 1], ['ru', 2]]) {
    if (typeof raw[i] === 'string' && normalize(raw[i]) !== normalize(raw[0])) counts.aliases += Number(addAlias(r, 'authors', { qid: q, lang, value: raw[i], origin: `data/awards.json#authors/${q}/${i}`, recorded_at: now }));
  }
  for (const row of catalog.history) {
    const origin = { file: row._file || 'data/found', row: row._row || 0, checked_at: row.checked_at };
    if (row.kind === 'none') {
      const count = r.leads.length;
      addLead(r, { qid: row.qid, lang: row.lang, kind: 'any', source: 'legacy', type: 'investigate',
        hint: row.evidence, origin, target: { reference: `${origin.file}:${origin.row}`, publication: row.pub || '' },
        created_at: row.checked_at, next_action: 'Read the preserved note, identify the named publication or source, and create a scoped follow-up. The previous search does not block other sources or formats.' }, now);
      counts.legacy_notes += r.leads.length - count;
    } else if (!row.part && !/\bpart\s+\d|часть\s+\d/i.test(row.title)) {
      const w = catalog.works.find(w => w.qid === row.qid);
      if (w && !titlesFor(w, row.lang).some(t => normalize(t) === normalize(row.title))) counts.aliases += Number(addAlias(r, 'titles', {
        qid: row.qid, lang: row.lang, value: row.title, origin: `${origin.file}:${origin.row}; ${row.url}`, recorded_at: row.checked_at
      }));
    }
  }
  for (const w of catalog.works) for (const lang of LANGUAGES) if (!titlesFor(w, lang).length && !r.aliases.titles.some(a => a.qid === w.qid && a.lang === lang)) {
    const count = r.leads.length; titleLead(r, w, lang, now); counts.missing_titles += r.leads.length - count;
  }
  return counts;
}
export function importState(r, state, catalog, reference = 'search state') {
  const before = { leads: r.leads.length, checks: r.checks.length };
  mergeResearch(r, state.research);
  for (const old of Object.values(state.checks || {})) {
    if (old.check_key && old.query && old.kind) { recordCheck(r, old); continue; }
    const w = catalog.works.find(w => w.qid === old.qid); if (!w) continue;
    for (const kind of (old.goals || []).filter(k => KINDS.includes(k))) {
      const query = { version: 1, provider: old.provider, kind, lang: old.lang, titles: [w.titles[old.lang]].filter(Boolean), authors: w.authors.map(a => [a]) };
      const related = (old.candidate_ids || []).map(id => state.candidates?.[id]).filter(Boolean);
      const status = old.status === 'candidates' && !related.some(c => (c.review?.row?.kind || c.proposed_kind) === kind) ? 'inconclusive' : old.status === 'already_known' && old.goals.length > 1 ? 'inconclusive' : old.status;
      recordCheck(r, { qid: w.qid, lang: old.lang, kind, provider: old.provider, query, check_key: hash(JSON.stringify([w.qid, query])), status,
        scope: old.scope || 'Legacy failed request; no availability conclusion', checked_at: old.checked_at, origin: reference, ...(old.error ? { error: old.error } : {}) });
    }
  }
  for (const candidate of Object.values(state.candidates || {})) {
    const source = candidate.providers?.find(p => r.sources.some(s => s.id === p)); if (!source) continue;
    const kind = candidate.review?.row?.kind || candidate.requested_kind || candidate.proposed_kind;
    const lead = addLead(r, { qid: candidate.qid, lang: candidate.lang, kind, source, type: 'investigate', target: { url: candidate.url, publication: candidate.review?.row?.pub || candidate.pub || '' },
      hint: `${candidate.title} — ${candidate.authors.join('; ')}`, origin: { state: reference, metadata_url: candidate.metadata_url || '' },
      notes: candidate.notes ? [{ at: candidate.source_checked_at || candidate.review?.row?.checked_at || new Date().toISOString(), text: candidate.notes }] : [], status: 'candidate' });
    candidate.lead_ids = [...new Set([...(candidate.lead_ids || []), lead.id])];
    if (['approved', 'rejected'].includes(candidate.review?.status)) recordReview(r, state, candidate, candidate.review.row?.checked_at || candidate.review.checked_at);
  }
  return { leads: r.leads.length - before.leads, checks: r.checks.length - before.checks };
}
