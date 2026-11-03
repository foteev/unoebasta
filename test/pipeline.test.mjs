import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FOUND_FIELDS, parseCsv, toCsv, validateFound } from '../scripts/lib/csv.mjs';
import { readTable, loadCatalog } from '../scripts/lib/catalog.mjs';
import { mergeFound } from '../scripts/lib/merge-found.mjs';
import { CachedHttp, HttpError, hash } from '../scripts/lib/http.mjs';
import { PROVIDERS, titleMatch, authorMatch } from '../scripts/lib/providers.mjs';
import { loadState, runSearch, reviewCandidate, approvedRows, selectWorks } from '../scripts/lib/search.mjs';

const instant = '2026-11-02T12:00:00Z';
const row = changes => ({ ...Object.fromEntries(FOUND_FIELDS.map(k => [k, ''])), qid: 'Q1', title: 'Red Planet', form: 'novel', lang: 'en', kind: 'full',
  site: 'Publisher', url: 'https://example.org/red', tier: 't2', words: '1000', pub: 'Magazine', evidence: 'Opened and checked full story and author', checked_at: instant, ...changes });
const data = () => ({ works: { Q1: ['Red Planet', 0, 0, ['Q9'], 1, 0, 1949] }, authors: { Q9: ['Robert A. Heinlein'] }, ex: {} });
const source = entries => `const READ = {\n${Object.entries(entries).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join('\n')}\n};\nconst CHANGELOG = [];`;
const work = () => ({ qid: 'Q1', title: 'Red Planet', form: 'novel', latest: 1950, titles: { en: 'Red Planet', pl: '', ru: '', es: '' }, authors: ['Robert A. Heinlein'], urls: [],
  availability: { en: { full: false, audio: false, fragment: false } } });
const catalog = () => ({ works: [work()], history: [], fingerprint: 'test' });
const temp = t => { const dir = mkdtempSync(join(tmpdir(), 'unoebasta-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir; };
const metadata = body => ({ url: 'https://example.org/api', final_url: 'https://example.org/api', body: typeof body === 'string' ? body : JSON.stringify(body), checked_at: instant });

test('CSV round trip supports BOM, quoted newlines, commas, CRLF; malformed rows fail', () => {
  const rows = [row({ evidence: 'Line one, "checked"\nLine two' })];
  assert.deepEqual(parseCsv('\uFEFF' + toCsv(rows).replaceAll('\n', '\r\n'))[0].evidence, rows[0].evidence.replaceAll('\n', '\r\n'));
  assert.throws(() => parseCsv('a,b\n1\n'), /columns/);
  assert.throws(() => parseCsv('a,a\n1,2'), /Duplicate/);
  assert.throws(() => parseCsv('a\n"unfinished'), /Unclosed/);
  assert.throws(() => validateFound(row({ url: 'javascript:alert(1)' })), /HTTP/);
  assert.throws(() => validateFound(row({ evidence: 'CANDIDATE match only' })), /review/);
});

test('import adds links to existing works, keeps metadata and is idempotent', () => {
  const entry = { w: 5000, tier: 't2', pub: 'Original', note: 'keep', added: '2020-01-01T00:00:00Z', links: [{ kind: 'full', url: 'https://example.org/old', site: 'Original' }] };
  const r = row({ kind: 'audio', words: '', url: 'https://example.org/audio?utm_source=test' });
  const first = mergeFound(source({ Q1: entry }), data(), [r], { now: instant });
  const result = readTable(first.source).Q1;
  assert.equal(result.links.length, 2); assert.equal(result.note, 'keep'); assert.equal(result.w, 5000); assert.equal(result.pub, 'Original');
  assert.equal(result.added, entry.added); assert.equal(result.links[1].added, instant);
  assert.equal(result.links[1].url, 'https://example.org/audio'); assert.equal(first.stats.updated, 1);
  const again = mergeFound(first.source, first.data, [r], { now: '2027-01-01T00:00:00Z' });
  assert.equal(again.source, first.source); assert.deepEqual(again.data, first.data); assert.equal(again.stats.links, 0);
});

test('import handles languages independently and upgrades audio-only metadata', () => {
  const old = { tier: 't2us', pub: 'Audio', links: [{ kind: 'audio', site: 'LibriVox', url: 'https://example.org/audio' }] };
  const rs = [row(), row({ lang: 'es', title: 'Planeta rojo', url: 'https://example.org/es', words: '1200' })];
  const result = mergeFound(source({ Q1: old }), data(), rs, { now: instant });
  const entry = readTable(result.source).Q1;
  assert.equal(entry.links.length, 3); assert.equal(entry.w, 1000); assert.equal(entry.tier, 't2');
  assert.equal(entry.links[2].lang, 'es'); assert.equal(result.data.t_es.Q1, 'Planeta rojo');
});

test('multipart sets must be complete, unique and remain idempotent', () => {
  const rs = [row({ part: '1', url: 'https://example.org/1' }), row({ part: '2', url: 'https://example.org/2' })];
  assert.throws(() => mergeFound(source({}), data(), rs.slice(1)), /incomplete/);
  assert.throws(() => mergeFound(source({}), data(), [...rs, row({ part: '1', url: 'https://example.org/other' })]), /conflicting/);
  const first = mergeFound(source({}), data(), rs);
  assert.equal(readTable(first.source).Q1.w, 2000);
  assert.equal(mergeFound(first.source, first.data, rs).source, first.source);
});

test('fragment and archive handling does not mutate data on a no-op', () => {
  const r = row({ kind: 'fragment', tier: 'frag', words: '', lang: 'ru', title: 'Красная планета', url: 'https://www.litres.ru/book/one/chitat-onlayn/' });
  const first = mergeFound(source({}), data(), [r], { now: instant });
  assert.equal(first.data.ex.Q1.lr, '/book/one/chitat-onlayn/');
  assert.deepEqual(mergeFound(first.source, first.data, [r], { now: '2027-01-01T00:00:00Z' }).data, first.data);
  const snapshot = row({ url: 'https://web.archive.org/web/20010101/https://example.org/story', archive: 'yes' });
  assert.equal(mergeFound(source({}), data(), [snapshot]).stats.links, 0);
  assert.equal(mergeFound(source({}), data(), [snapshot], { archive: true }).stats.links, 1);
  assert.throws(() => mergeFound(source({}), data(), [row({ lang: 'xx' })]), /language/);
});

test('HTTP success cache works offline, errors are not cached, corrupted cache is recoverable', async t => {
  const dir = temp(t); let calls = 0;
  const http = new CachedHttp({ dir, pause: async () => {}, fetchImpl: async () => { calls++; return new Response('metadata'); } });
  await http.get('https://example.org/a'); await http.get('https://example.org/a'); assert.equal(calls, 1);
  const offline = new CachedHttp({ dir, pause: async () => {}, fetchImpl: async () => { throw new Error('DNS failed'); } });
  assert.equal((await offline.get('https://example.org/a')).body, 'metadata');
  await assert.rejects(offline.get('https://example.org/b'), /DNS/);
  writeFileSync(join(dir, hash('https://example.org/a') + '.json'), 'broken JSON');
  const recovery = new CachedHttp({ dir, pause: async () => {}, fetchImpl: async () => new Response('recovered') });
  assert.equal((await recovery.get('https://example.org/a')).body, 'recovered');
});

test('HTTP 429 honors Retry-After; 404 is not retried; same URL requests coalesce', async t => {
  const pauses = []; let calls = 0;
  const http = new CachedHttp({ dir: temp(t), pause: async ms => pauses.push(ms), fetchImpl: async () => ++calls === 1 ? new Response('', { status: 429, headers: { 'Retry-After': '2' } }) : new Response('ok') });
  await Promise.all([http.get('https://example.org/a'), http.get('https://example.org/a')]);
  assert.equal(calls, 2); assert.ok(pauses.includes(2000));
  let misses = 0;
  const other = new CachedHttp({ dir: temp(t), pause: async () => {}, fetchImpl: async () => { misses++; return new Response('', { status: 404 }); } });
  await assert.rejects(other.get('https://example.org/missing'), e => e.status === 404); assert.equal(misses, 1);
});

test('Google key goes only to the Books API header and stays out of cache and errors', async t => {
  const dir = temp(t), secret = 'mock-google-credential', requests = [];
  const http = new CachedHttp({ dir, googleBooksApiKey: secret, pause: async () => {}, retries: 0,
    fetchImpl: async (url, options) => { requests.push({ url, options }); return new Response('reflected ' + secret); } });
  const result = await http.get('https://www.googleapis.com/books/v1/volumes?q=example');
  assert.equal(requests[0].options.headers['x-goog-api-key'], secret); assert.equal(requests[0].options.redirect, 'error');
  assert.equal(requests[0].url.includes(secret), false); assert.equal(JSON.stringify(result).includes(secret), false);
  for (const f of readdirSync(dir)) assert.equal(readFileSync(join(dir, f), 'utf8').includes(secret), false);
  await http.get('https://example.org/story'); await http.get('https://www.googleapis.com/other/v1/items');
  assert.equal(requests[1].options.headers['x-goog-api-key'], undefined); assert.equal(requests[2].options.headers['x-goog-api-key'], undefined);
  const broken = new CachedHttp({ dir, googleBooksApiKey: secret, retries: 0, pause: async () => {}, fetchImpl: async () => { throw new DOMException('failure ' + secret, 'AbortError'); } });
  await assert.rejects(broken.get('https://www.googleapis.com/books/v1/volumes?q=error'), e => !e.message.includes(secret));
});

test('HTTP timeout preserves AbortError without mutating its read-only message', async t => {
  const http = new CachedHttp({ dir: temp(t), timeout: 5, retries: 0, pause: async () => {},
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted request', 'AbortError')))) });
  await assert.rejects(http.get('https://example.org/slow'), e => e.name === 'AbortError' && e.message === 'Aborted request');
});

test('exact titles and authors reject homonyms and misleading fuzzy matches', () => {
  assert.equal(titleMatch('Gold', 'Golden'), false); assert.equal(titleMatch('Angel', 'The Angel Pattern'), false);
  assert.equal(titleMatch('L’Été', "L'ete"), true);
  assert.equal(authorMatch('Robert A. Heinlein', 'William John Locke'), false);
  assert.equal(authorMatch('Arthur C. Clarke', 'Clarke, Arthur C.'), true);
});

test('LibriVox parses dictionary results and rejects same-title wrong-author records', async () => {
  const wrong = { title: 'Red Planet', language: 'English', url_librivox: 'https://librivox.org/wrong/', authors: [{ first_name: 'William John', last_name: 'Locke' }] };
  const right = { ...wrong, url_librivox: 'https://librivox.org/right/', authors: [{ first_name: 'Robert A.', last_name: 'Heinlein' }] };
  const http = { get: async () => metadata({ books: { 19: wrong, 20: right } }) };
  const result = await PROVIDERS.librivox.search(work(), 'en', http);
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].url, right.url_librivox);
  assert.equal(result.candidates[0].review.status, 'pending');
});

test('only the specific LibriVox empty-result 404 counts as no matches', async () => {
  const failure = body => ({ get: async () => { const e = new HttpError('HTTP 404', 404); e.body = body; throw e; } });
  const result = await PROVIDERS.librivox.search(work(), 'en', failure('{"error":"Audiobooks could not be found"}'));
  assert.deepEqual(result.candidates, []);
  await assert.rejects(PROVIDERS.librivox.search(work(), 'en', failure('<h1>Not Found</h1>')), /404/);
});

test('Google Books uses ALL_PAGES and PARTIAL with country, never auto-approves', async () => {
  const item = { id: 'abc-1', volumeInfo: { title: 'Red Planet', authors: ['Robert A. Heinlein'], language: 'en' }, accessInfo: { viewability: 'ALL_PAGES', country: 'US' } };
  const http = { googleBooksConfigured: true, get: async () => metadata({ totalItems: 2, items: [item, { ...item, id: 'abc-2', accessInfo: { viewability: 'NO_PAGES' } }] }) };
  const { candidates } = await PROVIDERS.google.search(work(), 'en', http);
  assert.equal(candidates.length, 1); assert.equal(candidates[0].country, 'US'); assert.equal(candidates[0].proposed_kind, 'fragment');
});

test('missing Google key is explicit, makes no request, and retries after configuration', async t => {
  const statePath = join(temp(t), 'state.json'), state = loadState(statePath); let requests = 0;
  const http = { googleBooksConfigured: false, get: async () => { requests++; return metadata({ totalItems: 0 }); } };
  const options = { catalog: catalog(), state, statePath, http, providers: ['google'], lang: 'en', kind: 'fragment', now: () => instant };
  let result = await runSearch(options);
  assert.equal(result.configuration_required, 1); assert.equal(result.errors, 0); assert.equal(requests, 0);
  assert.equal(Object.values(state.checks)[0].status, 'configuration_required');
  assert.deepEqual(approvedRows(state, catalog()), []);
  http.googleBooksConfigured = true; result = await runSearch(options);
  assert.equal(result.checked, 1); assert.equal(result.resumed, 0); assert.equal(requests, 1);
  assert.equal(Object.values(state.checks)[0].status, 'not_found');
});

test('Gutenberg official metadata matches author, title and language', async () => {
  const body = 'Text#,Type,Title,Language,Authors\n1,Text,Red Planet,en,"Locke, William John"\n2,Text,Red Planet,en,"Heinlein, Robert A."\n3,Text,Red Planet,es,"Heinlein, Robert A."\n';
  const result = await PROVIDERS.gutenberg.search(work(), 'en', { get: async () => metadata(body) });
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].url, 'https://www.gutenberg.org/ebooks/2');
});

test('magazine parser checks exact page title, keeps uncertain author for manual review', async () => {
  const pages = ['<article><h2><a href="https://escapepod.org/episode/">Escape Pod 123: Red Planet</a></h2><h2><a href="/other/">Red Planet Returns</a></h2></article>',
    '<h2 class="post_title">Escape Pod 123: Red Planet</h2><div class="podcast_wrapper"></div><h4 class="author_name">William John Locke</h4>'];
  const result = await PROVIDERS.escapepod.search(work(), 'en', { get: async u => ({ ...metadata(pages.shift()), final_url: u }) });
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].match.author, 'unconfirmed');
  assert.equal(result.candidates[0].review.status, 'pending');
});

test('checkpoint resumes completed searches and retries failures; errors never export as none', async t => {
  const statePath = join(temp(t), 'state.json'), state = loadState(statePath); let calls = 0;
  const registry = { fake: { kinds: ['full'], languages: ['en'], search: async () => { calls++; if (calls === 1) throw new HttpError('rate limit', 429); return { candidates: [], scope: 'Test exact query' }; } } };
  const options = { catalog: catalog(), state, statePath, registry, providers: ['fake'], lang: 'en', kind: 'full', now: () => instant };
  assert.equal((await runSearch(options)).errors, 1); assert.equal(Object.values(state.checks)[0].status, 'blocked');
  assert.equal((await runSearch(options)).checked, 1); assert.equal(Object.values(loadState(statePath).checks)[0].status, 'not_found');
  assert.equal((await runSearch(options)).resumed, 1); assert.equal(calls, 2); assert.deepEqual(approvedRows(state, catalog()), []);
});

test('review/export requires explicit evidence, kind, rights tier and word count', () => {
  const c = { id: 'abc', ...row(), proposed_kind: 'full', review: { status: 'pending' } }, state = { candidates: { abc: c } };
  assert.deepEqual(approvedRows(state, catalog()), []);
  assert.throws(() => reviewCandidate(state, 'abc', { evidence: 'Opened' }), /kind/);
  assert.throws(() => reviewCandidate(state, 'abc', { evidence: 'Opened', kind: 'full', tier: 't2' }), /words/);
  reviewCandidate(state, 'abc', { evidence: 'Opened; author and full text verified at publisher', kind: 'full', tier: 't2', words: '1500', checkedAt: instant });
  assert.equal(approvedRows(state, catalog()).length, 1);
  const covered = catalog(); covered.works[0].urls.push(c.url); assert.deepEqual(approvedRows(state, covered), []);
  reviewCandidate(state, 'abc', { reject: true, evidence: 'Actually an excerpt' }); assert.deepEqual(approvedRows(state, catalog()), []);
});

test('legacy negatives do not block new sources; unknown translation titles remain actionable', () => {
  const c = catalog(); c.history.push(row({ kind: 'none', url: '' }));
  assert.equal(selectWorks(c).length, 1); assert.equal(selectWorks(c, { retrySearched: true }).length, 1);
  assert.equal(selectWorks(c, { lang: 'es' }).length, 1);
  c.history = []; c.works[0].availability.en.full = true;
  assert.equal(selectWorks(c, { kind: 'audio' }).length, 1); assert.equal(selectWorks(c, { kind: 'full' }).length, 0);
});

test('current catalog and historical CSVs load without remote coverage.csv', () => {
  const c = loadCatalog(new URL('..', import.meta.url).pathname);
  c.history.forEach(validateFound);
  assert.ok(c.works.length >= 656); assert.ok(c.history.length >= 177); assert.ok(c.works.every(w => w.authors.length));
});
