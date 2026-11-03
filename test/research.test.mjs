import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyResearch, loadResearch, saveResearch, addLead, noteLead, updateLead, addAlias, checkKey, searchQuery, freshCheck, recordCheck, buildPlan, seedResearch, importState, mergeResearch, candidateFromLead } from '../scripts/lib/research.mjs';
import { loadCatalog } from '../scripts/lib/catalog.mjs';
import { runSearch, loadState, reviewCandidate, approvedRows, knownLink } from '../scripts/lib/search.mjs';
import { PROVIDERS } from '../scripts/lib/providers.mjs';
import { queryVariants, allAuthors } from '../scripts/lib/matching.mjs';
import { parseCsv } from '../scripts/lib/csv.mjs';

const NOW = '2026-11-03T10:00:00Z';
const LATER = '2026-11-03T11:00:00Z';
const root = fileURLToPath(new URL('..', import.meta.url));
const temp = t => { const p = mkdtempSync(join(tmpdir(), 'unoebasta-research-')); t.after(() => rmSync(p, { recursive: true, force: true })); return p; };
const work = (qid = 'Q1') => ({ qid, title: 'Red Planet', form: 'novel', latest: 1950, authors: ['Robert A. Heinlein'], authorQids: ['Q9'],
  titles: { en: 'Red Planet', pl: '', ru: '', es: '' }, isfdb: '123', fantlab: '456', urls: [], knownLinks: [],
  availability: Object.fromEntries(['en', 'pl', 'ru', 'es'].map(l => [l, { full: false, audio: false, fragment: false }])) });
const candidate = (w = work(), changes = {}) => ({ qid: w.qid, title: w.title, form: w.form, lang: 'en', authors: w.authors, site: 'Publisher',
  url: 'https://example.org/story/' + w.qid, proposed_kind: 'full', proposed_tier: 't2', notes: 'Provider guidance', source_checked_at: NOW,
  match: { title: 'exact', author: 'confirmed' }, review: { status: 'pending' }, ...changes });
const catalog = (works = [work()]) => ({ works, history: [], fingerprint: 'fixture', data: { authors: { Q9: ['Robert A. Heinlein', 0, 'Роберт Хайнлайн'] } } });
const registry = (search, kinds = ['full']) => ({ gutenberg: { kinds, languages: ['en', 'pl', 'ru', 'es'], search } });
const options = (t, changes = {}) => ({ catalog: catalog(), state: { version: 1, checks: {}, candidates: {} }, statePath: join(temp(t), 'state.json'),
  research: emptyResearch(), providers: ['gutenberg'], kind: 'full', now: () => NOW, ...changes });
const record = (w, lang, provider, kind, changes = {}) => ({ qid: w.qid, lang, kind, provider, check_key: checkKey(w, lang, provider, kind),
  query: searchQuery(w, lang, provider, kind), status: 'not_found', scope: 'Exact title and author search on this source', checked_at: NOW, ...changes });

test('publication-only lead, annotations and decisions survive save, refresh and merge', t => {
  const r = emptyResearch(), dir = temp(t);
  const lead = addLead(r, { qid: 'Q1', lang: 'ru', kind: 'fragment', source: 'publisher', hint: 'Translation may be in collection X', origin: 'Bibliography record', target: { publication: 'Collection X; translator Y; ISBN not yet identified' }, next_action: 'Find the contents and official publisher sample' }, NOW);
  noteLead(r, lead.id, 'The title may differ between editions', NOW); saveResearch(dir, r);
  const saved = loadResearch(dir); assert.equal(saved.leads[0].target.url, undefined); assert.equal(saved.leads[0].notes[0].text, 'The title may differ between editions');
  const incoming = structuredClone(saved); incoming.leads[0].next_action = 'Generic adapter default'; incoming.leads[0].notes.push({ at: LATER, text: 'Another bibliography mentions it' });
  mergeResearch(saved, incoming); assert.equal(saved.leads[0].notes.length, 2); assert.equal(saved.leads[0].next_action, 'Find the contents and official publisher sample');
  assert.throws(() => addLead(saved, { qid: 'Q1', lang: 'en', kind: 'full', source: 'author', hint: 'Secret URL', origin: 'test', target: { url: 'https://example.org/?key=do-not-store' } }), /Credential/);
});

test('legacy negative notes are preserved idempotently and cannot blacklist a work', () => {
  const c = catalog(), r = emptyResearch(); c.history = [{ qid: 'Q1', lang: 'en', kind: 'none', evidence: 'Published in collection X; no freely accessible text located in one search', pub: 'Collection X', checked_at: NOW, _file: 'data/found/example.csv', _row: 2 }];
  const first = seedResearch(c, r, NOW), again = seedResearch(c, r, LATER);
  assert.equal(first.legacy_notes, 1); assert.equal(first.missing_titles, 3); assert.deepEqual(again, { aliases: 0, legacy_notes: 0, missing_titles: 0 });
  assert.equal(r.leads.find(l => l.source === 'legacy').hint, c.history[0].evidence);
  assert.equal(r.checks.length, 0);
  assert.ok(buildPlan(c, r, { langs: ['en'], providers: ['gutenberg'], limit: 1, now: NOW }).tasks.some(t => t.source === 'gutenberg'));
});

test('negative checks are scoped to language, format, source and title/name variants', () => {
  const w = work(), r = emptyResearch(), c = record(w, 'en', 'gutenberg', 'full'); recordCheck(r, c);
  assert.ok(freshCheck(r, c.check_key, LATER));
  for (const key of [checkKey(w, 'ru', 'gutenberg', 'full'), checkKey(w, 'en', 'gutenberg', 'audio'), checkKey(w, 'en', 'google', 'full')]) assert.equal(freshCheck(r, key, LATER), undefined);
  w.titleVariants = { en: ['Red Planet', 'Alternative published title'] };
  assert.equal(freshCheck(r, checkKey(w, 'en', 'gutenberg', 'full'), LATER), undefined);
});

test('a newer error never hides behind an older successful cached negative', async t => {
  const r = emptyResearch(), w = work(); recordCheck(r, record(w, 'en', 'gutenberg', 'full'));
  recordCheck(r, record(w, 'en', 'gutenberg', 'full', { checked_at: LATER, status: 'blocked', scope: '429; retry later' }));
  assert.equal(freshCheck(r, checkKey(w, 'en', 'gutenberg', 'full'), LATER), undefined);
  const o = options(t, { research: r, now: () => LATER, registry: registry(async () => ({ candidates: [], scope: 'Retry exact query' })) });
  o.state.checks[checkKey(w, 'en', 'gutenberg', 'full')] = record(w, 'en', 'gutenberg', 'full');
  assert.equal((await runSearch(o)).checked, 1);
});

test('next batch advances past fresh source checks, and durable checks work without the cache', async t => {
  const calls = [], o = options(t, { catalog: catalog([work('Q1'), work('Q2')]), limit: 1,
    registry: registry(async w => { calls.push(w.qid); return { candidates: [], scope: 'Exact publisher query' }; }) });
  assert.equal((await runSearch(o)).checked, 1);
  assert.equal((await runSearch(o)).checked, 1); assert.deepEqual(calls, ['Q1', 'Q2']);
  o.state = { version: 1, checks: {}, candidates: {} };
  const result = await runSearch(o); assert.equal(result.checked, 0); assert.equal(result.resumed, 2); assert.equal(calls.length, 2);
});

test('unknown translation title becomes a task without making network requests', async t => {
  let called = false;
  const o = options(t, { lang: 'ru', registry: registry(async () => { called = true; throw Error('must not request'); }) });
  const result = await runSearch(o);
  assert.equal(result.needs_title, 1); assert.equal(result.checked, 0); assert.equal(called, false);
  const lead = o.research.leads[0]; assert.equal(lead.status, 'needs_title'); assert.equal(lead.target.url, 'https://fantlab.ru/work456');
  addAlias(o.research, 'titles', { qid: 'Q1', lang: 'ru', value: 'Красная планета', origin: 'Verified publisher edition', recorded_at: LATER });
  assert.equal(lead.status, 'confirmed'); assert.match(lead.notes[0].text, /Красная планета/);
});

test('localized names and title aliases feed real provider matching and bounded queries', async () => {
  const w = work(); w.titles.ru = 'Красная планета'; w.titleVariants = { ru: ['Красная планета', 'Альтернативное название'] };
  w.authorVariants = { ru: [['Роберт Хайнлайн', 'Robert A. Heinlein']] };
  assert.equal(allAuthors(w, ['Роберт Хайнлайн'], 'ru'), true); assert.equal(allAuthors(w, ['Уильям Локк'], 'ru'), false);
  const queries = queryVariants(w, 'ru'); assert.equal(queries.queries.length, 4);
  const urls = []; const body = { totalItems: 1, items: [{ id: 'volume1', volumeInfo: { title: 'Альтернативное название', language: 'ru', authors: ['Роберт Хайнлайн'] }, accessInfo: { viewability: 'PARTIAL', country: 'US' } }] };
  const result = await PROVIDERS.google.search(w, 'ru', { googleBooksConfigured: true, get: async url => { urls.push(new URL(url)); return { url, checked_at: NOW, body: JSON.stringify(body) }; } });
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].title, 'Альтернативное название');
  assert.ok(urls.some(u => u.searchParams.get('q').includes('Роберт Хайнлайн'))); assert.ok(urls.some(u => u.searchParams.get('q').includes('Robert A. Heinlein')));
  w.titleVariants.ru = Array.from({ length: 20 }, (_, i) => 'Title ' + i); assert.equal(queryVariants(w, 'ru').queries.length, 8); assert.equal(queryVariants(w, 'ru').truncated, true);
});

test('source plan balances languages and includes actionable regional manual tasks', () => {
  const w = work(); for (const l of ['pl', 'ru', 'es']) w.titles[l] = 'Localized title ' + l;
  const r = emptyResearch(), plan = buildPlan(catalog([w]), r, { langs: ['en', 'pl', 'ru', 'es'], kind: 'fragment', limit: 4, now: NOW });
  assert.equal(plan.targets, 4); assert.deepEqual([...new Set(plan.tasks.map(t => t.lang))], ['en', 'pl', 'ru', 'es']);
  for (const [source, lang] of [['legimi', 'pl'], ['litres', 'ru'], ['casadellibro', 'es'], ['planeta', 'es']]) assert.ok(plan.tasks.some(t => t.source === source && t.lang === lang && t.mode === 'manual' && t.next_action));
  assert.ok(plan.tasks.some(t => t.source === 'google' && t.mode === 'auto'));
});

test('same URL may provide independent languages and kinds', () => {
  const w = work(); w.knownLinks = [{ url: 'https://example.org/story', lang: 'en', kind: 'audio' }];
  assert.equal(knownLink(w, { url: 'https://example.org/story', lang: 'en', kind: 'audio' }), true);
  assert.equal(knownLink(w, { url: 'https://example.org/story', lang: 'en', kind: 'full' }), false);
  assert.equal(knownLink(w, { url: 'https://example.org/story', lang: 'ru', kind: 'audio' }), false);
});

test('one page can be reviewed separately for full text and audio; notes survive refresh', async t => {
  const o = options(t, { kind: 'all', registry: registry(async w => ({ candidates: [candidate(w, { proposed_kind: 'audio' })], scope: 'Publisher page with media' }), ['full', 'audio']) });
  await runSearch(o); assert.equal(Object.keys(o.state.candidates).length, 2);
  const text = Object.values(o.state.candidates).find(c => c.requested_kind === 'full'), audio = Object.values(o.state.candidates).find(c => c.requested_kind === 'audio');
  assert.notEqual(text.id, audio.id);
  const lead = o.research.leads.find(l => text.lead_ids.includes(l.id)); noteLead(o.research, lead.id, 'Body has been checked to its ending', NOW); text.notes = 'Curator annotation';
  o.refresh = true; o.now = () => LATER; await runSearch(o);
  assert.equal(o.state.candidates[text.id].notes, 'Curator annotation'); assert.ok(lead.notes.some(n => n.text === 'Body has been checked to its ending'));
  reviewCandidate(o.state, text.id, { research: o.research, kind: 'full', tier: 't2', words: '1000', evidence: 'Complete publisher text opened and author checked', checkedAt: LATER });
  reviewCandidate(o.state, audio.id, { research: o.research, kind: 'audio', tier: 't2', evidence: 'Full human episode opened, author and narrator checked', checkedAt: LATER });
  assert.equal(approvedRows(o.state, o.catalog).length, 2); assert.equal(lead.status, 'confirmed'); assert.equal(lead.decisions.length, 1);
});

test('deferred tasks pause automatic requests until the specified date', async t => {
  const o = options(t, { registry: registry(async () => ({ candidates: [], scope: 'Exact query' })) });
  const plan = buildPlan(o.catalog, o.research, { langs: ['en'], providers: ['gutenberg'], kind: 'full', limit: 1, now: NOW });
  updateLead(o.research, plan.tasks[0].id, { status: 'deferred', recheck_after: '2026-11-04T00:00:00Z', evidence: 'Wait for publisher maintenance' }, NOW);
  assert.equal((await runSearch(o)).checked, 0);
  o.now = () => '2026-11-05T00:00:00Z'; assert.equal((await runSearch(o)).checked, 1);
  assert.equal(o.research.leads[0].status, 'searched');
});

test('a manual publication hint can enter the same explicit review/export workflow', () => {
  const r = emptyResearch(), c = catalog(), state = { version: 1, checks: {}, candidates: {} };
  const lead = addLead(r, { qid: 'Q1', lang: 'en', kind: 'full', source: 'publisher', hint: 'Collection X may include the story', origin: 'Bibliography', target: { publication: 'Collection X' } }, NOW);
  const item = candidateFromLead(r, c, state, lead.id, { url: 'https://example.org/story/Q1', now: NOW });
  assert.equal(item.review.status, 'pending'); assert.equal(approvedRows(state, c).length, 0);
  reviewCandidate(state, item.id, { research: r, kind: 'full', tier: 't2', words: '1000', evidence: 'Complete publisher text opened and author checked', checkedAt: LATER });
  assert.equal(approvedRows(state, c).length, 1); assert.equal(lead.status, 'confirmed');
  assert.equal(candidateFromLead(r, c, state, lead.id, { url: item.url, now: LATER }).review.status, 'approved');
});

test('a rejected candidate stays rejected after cache loss and a new provider check', async t => {
  const o = options(t, { registry: registry(async w => ({ candidates: [candidate(w)], scope: 'Exact publisher query' })) });
  await runSearch(o); const item = Object.values(o.state.candidates)[0];
  reviewCandidate(o.state, item.id, { research: o.research, reject: true, evidence: 'Publisher page is an excerpt', checkedAt: LATER });
  o.state = { version: 1, checks: {}, candidates: {} }; o.refresh = true; o.now = () => LATER;
  await runSearch(o); assert.equal(Object.values(o.state.candidates)[0].review.status, 'rejected');
  assert.match(Object.values(o.state.candidates)[0].review.evidence, /excerpt/);
});

test('legacy checkpoint migration preserves scoped evidence without inheriting broad negatives', () => {
  const r = emptyResearch(), c = catalog(), state = { checks: { old: { qid: 'Q1', lang: 'en', provider: 'gutenberg', goals: ['full', 'audio'], status: 'not_found', scope: 'Legacy exact-title query', checked_at: NOW } }, candidates: {} };
  assert.equal(importState(r, state, c).checks, 2); assert.equal(importState(r, state, c).checks, 0);
  assert.ok(r.checks.every(check => check.query.version === 1)); assert.equal(freshCheck(r, checkKey(c.works[0], 'en', 'gutenberg', 'full'), LATER), undefined);
});

test('catalog loads sourced aliases and localized author names from actual files', t => {
  const dir = temp(t); mkdirSync(join(dir, 'data'), { recursive: true }); mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'data/awards.json'), JSON.stringify({ works: { Q1: ['Red Planet', 0, 0, ['Q9'], 123, 456, 1949] }, aw: [['h', 'N', 1950, 'Q1']], authors: { Q9: ['Robert A. Heinlein', 0, 'Роберт Хайнлайн'] } }));
  writeFileSync(join(dir, 'src/index.html'), 'const READ = {};\nconst CHANGELOG = [];');
  const r = emptyResearch(); addAlias(r, 'titles', { qid: 'Q1', lang: 'ru', value: 'Красная планета', origin: 'Test publisher record' }); saveResearch(join(dir, 'data/research'), r);
  const c = loadCatalog(dir); assert.equal(c.works[0].titles.ru, 'Красная планета'); assert.deepEqual(c.works[0].authorVariants.ru[0], ['Роберт Хайнлайн', 'Robert A. Heinlein']);
});

test('versioned registry has legacy provenance, missing titles and language-specific audio columns', () => {
  const c = loadCatalog(root); assert.ok(c.research.leads.some(l => l.source === 'legacy' && typeof l.origin === 'object' && l.origin.file));
  for (const lang of ['pl', 'ru', 'es']) assert.ok(c.research.leads.some(l => l.lang === lang && l.status === 'needs_title'));
  const csv = parseCsv(readFileSync(join(root, 'data/coverage.csv'), 'utf8'));
  for (const lang of ['en', 'pl', 'ru', 'es']) assert.ok('audio_' + lang in csv[0]);
  assert.equal(csv.filter(r => r.audio === 'yes').length, csv.filter(r => ['en', 'pl', 'ru', 'es'].some(l => r['audio_' + l] === 'yes')).length);
});
