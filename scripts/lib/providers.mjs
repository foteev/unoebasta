import { JSDOM } from 'jsdom';
import { parseCsv, cleanUrl } from './csv.mjs';

export const PROVIDER_VERSION = 1;
export const normalize = value => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const titleMatch = (a, b) => normalize(a) === normalize(b);
export function authorMatch(expected, actual) {
  const a = normalize(expected).split(' '), b = normalize(actual).split(' ');
  // Require a surname and a first name/initial; title-only matches are never sufficient.
  return a.length >= 2 && b.includes(a.at(-1)) && a.every(t => b.includes(t) || b.some(x => x[0] === t[0] && (x.length === 1 || t.length === 1)));
}
const allAuthors = (w, names) => w.authors.every(a => names.some(b => authorMatch(a, b)));
const json = r => { try { return JSON.parse(r.body); } catch { throw new Error(`Invalid JSON from ${r.url}`); } };
const list = value => Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : [];
const LANGUAGE = { en: 'English', pl: 'Polish', ru: 'Russian', es: 'Spanish' };
const baseCandidate = (w, lang, response, values) => ({ qid: w.qid, title: w.titles[lang], form: w.form, lang,
  authors: w.authors, isfdb_title_id: w.isfdb || null, fantlab_work_id: w.fantlab || null,
  source_checked_at: response.checked_at, metadata_url: response.url,
  match: { title: 'exact', author: 'confirmed' }, review: { status: 'pending' }, ...values });

let pgCatalog;
async function gutenberg(w, lang, http) {
  const r = await http.get('https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv');
  if (pgCatalog?.body !== r.body) pgCatalog = { body: r.body, rows: parseCsv(r.body) };
  const rows = pgCatalog.rows;
  if (!rows.length || !('Text#' in rows[0]) || !('Authors' in rows[0])) throw new Error('Gutenberg catalog schema changed');
  const candidates = rows.filter(b => /^\d+$/.test(b['Text#']) && b.Type === 'Text' && b.Language.split(/[,;]\s*/).includes(lang)
    && titleMatch(w.titles[lang], b.Title.split('\n')[0]) && allAuthors(w, b.Authors.split(';')))
    .map(b => baseCandidate(w, lang, r, { site: 'Project Gutenberg', url: `https://www.gutenberg.org/ebooks/${b['Text#']}`,
      proposed_kind: 'full', proposed_tier: 't2us', notes: 'Catalog match only. Open the ebook and verify the target work, completeness and US rights statement.' }));
  return { candidates, scope: 'Project Gutenberg metadata catalog: exact title, author and language' };
}

async function librivox(w, lang, http) {
  const url = new URL('https://librivox.org/api/feed/audiobooks/');
  url.search = new URLSearchParams({ title: w.titles[lang], format: 'json', extended: '1', limit: '500' }).toString();
  let r;
  try { r = await http.get(url.href); }
  catch (e) {
    // This API uses 404 for a documented-shaped empty result; generic 404 pages remain errors.
    let body; try { body = JSON.parse(e.body); } catch { /* not an API response */ }
    if (e.status === 404 && body?.error === 'Audiobooks could not be found') return { candidates: [], scope: 'LibriVox exact-title query (API reports no audiobooks)' };
    throw e;
  }
  const body = json(r);
  if (!('books' in body)) {
    if (body.error && /no results|not found|no audiobooks found/i.test(String(body.error))) return { candidates: [], scope: 'LibriVox title search (no results)' };
    throw new Error('LibriVox schema changed or API returned an error');
  }
  const books = list(body.books);
  const candidates = books.filter(b => titleMatch(w.titles[lang], b.title) && normalize(b.language) === normalize(LANGUAGE[lang])
    && allAuthors(w, list(b.authors).map(a => `${a.first_name || ''} ${a.last_name || ''}`)))
    .filter(b => b.url_librivox).map(b => baseCandidate(w, lang, r, { site: 'LibriVox', url: cleanUrl(b.url_librivox),
      proposed_kind: 'audio', proposed_tier: 't2us', notes: 'Human reading. Verify complete recording, author and the applicable public-domain status on the episode page.' }));
  return { candidates, scope: 'LibriVox: exact title, all authors and language', incomplete: books.length >= 500 };
}

async function google(w, lang, http) {
  if (!http.googleBooksConfigured) {
    const error = new Error('Google Books needs GOOGLE_BOOKS_API_KEY; set it in the environment or repository Actions secrets');
    error.code = 'CONFIGURATION_REQUIRED'; throw error;
  }
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.search = new URLSearchParams({ q: `intitle:"${w.titles[lang]}" ${w.authors.map(a => `inauthor:"${a}"`).join(' ')}`,
    langRestrict: lang, printType: 'books', maxResults: '40', projection: 'full' }).toString();
  const r = await http.get(url.href), body = json(r);
  if (body.error || !Number.isFinite(body.totalItems)) throw new Error('Google Books API error or schema changed');
  const candidates = (body.items || []).filter(b => b.volumeInfo?.language === lang && titleMatch(w.titles[lang], b.volumeInfo.title)
    && allAuthors(w, b.volumeInfo.authors || []) && ['ALL_PAGES', 'PARTIAL'].includes(b.accessInfo?.viewability))
    .filter(b => /^[\w-]+$/.test(b.id)).map(b => baseCandidate(w, lang, r, { site: 'Google Books', url: `https://books.google.com/books?id=${b.id}`,
      proposed_kind: 'fragment', proposed_tier: 'frag', country: b.accessInfo.country || 'unknown', viewability: b.accessInfo.viewability,
      pub: `${b.volumeInfo.publisher || ''} ${b.volumeInfo.publishedDate || ''}`.trim(),
      notes: 'Preview depends on country. Open visible pages and check that the target story is actually present; a collection preview is insufficient.' }));
  return { candidates, scope: 'Google Books: first 40 exact title/author/language results with visible pages', incomplete: body.totalItems > 40 };
}

const MAGAZINES = {
  clarkesworld: ['Clarkesworld', 'https://clarkesworldmagazine.com/'],
  escapepod: ['Escape Pod', 'https://escapepod.org/'],
  podcastle: ['PodCastle', 'https://podcastle.org/'],
  pseudopod: ['PseudoPod', 'https://pseudopod.org/']
};
const episodeTitle = s => s.replace(/^\s*(?:Escape\s*Pod|PodCastle|PseudoPod|EP|PC|PP)\s*(?:Flash\s*on\s*the\s*Borderlands\s*)?\d+[\w.]*\s*[:–—-]\s*/i, '').trim();
const hostKey = url => new URL(url).hostname.replace(/^www\./, '');
async function magazine(provider, w, lang, http) {
  const [site, origin] = MAGAZINES[provider], url = new URL(origin); url.searchParams.set('s', w.titles[lang]);
  const r = await http.get(url.href), dom = new JSDOM(r.body), doc = dom.window.document;
  if (doc.querySelector('title')?.textContent.match(/just a moment|access denied|captcha/i)) { dom.window.close(); throw new Error('Search blocked by challenge page'); }
  const links = [...doc.querySelectorAll('h1 a[href], h2 a[href], h3 a[href], .post_title a[href], .entry-title a[href]')]
    .filter(a => titleMatch(w.titles[lang], episodeTitle(a.textContent))).map(a => new URL(a.getAttribute('href'), origin).href)
    .filter(u => hostKey(u) === hostKey(origin) && !new URL(u).search);
  const recognized = links.length || doc.querySelector('article, .post, .search-results, .no-results') || /nothing found|no results|no posts/i.test(doc.body.textContent);
  dom.window.close();
  if (!recognized) throw new Error('Unrecognized magazine search layout');
  const candidates = [];
  for (const u of [...new Set(links)].slice(0, 10)) {
    const page = await http.get(u), detail = new JSDOM(page.body), d = detail.window.document;
    try {
      const headline = [...d.querySelectorAll('h1, h2.post_title, [itemprop="headline"]')].find(el => titleMatch(w.titles[lang], episodeTitle(el.textContent)));
      if (!headline) throw new Error(`Cannot confirm title at ${u}`);
      const names = [...d.querySelectorAll('.author_name, .byline, .entry-author, [rel="author"], meta[name="author"]')].map(el => el.getAttribute('content') || el.textContent);
      const confirmed = allAuthors(w, names);
      const canonical = d.querySelector('link[rel="canonical"]')?.href;
      const final = canonical && hostKey(canonical) === hostKey(origin) ? canonical : page.final_url;
      const audio = !!d.querySelector('audio, .podcast_player, .podcast_wrapper, a[href$=".mp3"]');
      candidates.push(baseCandidate(w, lang, page, { site, url: cleanUrl(final), proposed_kind: audio ? 'audio' : 'full', proposed_tier: 't2',
        match: { title: 'exact', author: confirmed ? 'confirmed' : 'unconfirmed' },
        notes: 'Exact title on publisher page. Manually check author credit, story versus review/excerpt, completeness, language, rights and human narration. HTTP 200 does not prove full access.' }));
    } finally { detail.window.close(); }
  }
  return { candidates, scope: `${site}: first search page and up to 10 exact-title pages`, incomplete: !!candidates.length || links.length > 10 };
}

export const PROVIDERS = {
  gutenberg: { kinds: ['full'], languages: ['en', 'pl', 'ru', 'es'], search: gutenberg },
  librivox: { kinds: ['audio'], languages: ['en', 'pl', 'ru', 'es'], search: librivox },
  google: { kinds: ['fragment'], languages: ['en', 'pl', 'ru', 'es'], search: google },
  ...Object.fromEntries(Object.keys(MAGAZINES).map(id => [id, { kinds: ['full', 'audio'], languages: ['en'], search: (w, l, h) => magazine(id, w, l, h) }]))
};
