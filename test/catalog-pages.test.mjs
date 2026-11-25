import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { catalogRoutes } from '../scripts/lib/public-pages.mjs';
import { scopeByAward, validateAwards } from '../scripts/lib/awards.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const registry = JSON.parse(read('data/award-registry.json'));
const data = { ...JSON.parse(read('data/awards.json')), registry };
const slugs = JSON.parse(read('data/catalog-slugs.json'));
const routes = catalogRoutes(data, slugs);

test('the homepage links directly to each generated award page', () => {
  const home = read('dist/web/index.html');
  const directory = home.match(/<nav id="award-directory"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(directory);
  assert.match(home, /<title>Unoebasta · Award-Winning Sci-Fi and Fantasy to Read or Hear<\/title>/);
  for (const path of Object.values(routes.award)) {
    assert.ok(directory.includes(`href="./${path}"`), path);
    assert.ok(read('dist/web/' + path + 'index.html').includes(`rel="canonical" href="https://foteev.github.io/unoebasta/${path}"`));
  }
});

test('initial work HTML gives publication facts and separates full text, audio and excerpts', () => {
  const work = id => read('dist/web/' + routes.work[id] + 'index.html');
  const emet = work('Q131472627');
  assert.match(emet, /<title>\(emet\) by Lauren Ring · unoebasta<\/title>/);
  assert.match(emet, /<p class="wh-meta">Published 2021 · PodCastle 789 · About 7,877 words · About 39 min to read<\/p>/);
  assert.match(emet, /World Fantasy Award 2022<b>Short Fiction<\/b>/);
  assert.match(emet, />Full text · English · PodCastle<\/a>/);
  assert.match(emet, />Audio · English · PodCastle · 1:06:54<\/a>/);
  assert.match(work('Q1410482'), />Excerpt · Polish · Legimi<\/a>/);
  const pill = work('Q131245261');
  assert.match(pill, />Text · English · Escape Pod · Part 1<\/a>/);
  assert.doesNotMatch(work('T3514919'), /Published null/);
});

test('the published work path and the prize codes appear in the static artifact', () => {
  const workPath = routes.work.Q130213759;
  assert.equal(workPath, 'work/naomi-kritzer-better-living-through-algorithms-Q130213759/');
  assert.match(read('dist/web/' + workPath + 'index.html'), /<h1>Better Living Through Algorithms<\/h1>/);
  for (const award of Object.keys(registry.awards)) {
    const awardPath = routes.award[award];
    assert.match(read('dist/web/' + awardPath + 'index.html'), new RegExp('award=' + registry.awards[award].code));
    assert.ok(read('dist/web/sitemap.xml').includes('/unoebasta/' + awardPath));
  }
  for (const path of Object.values(routes.author)) {
    assert.ok(read('dist/web/' + path + 'index.html').includes('<h1 id="author-name">'));
  }
});

test('public author cards link to every work with JavaScript disabled', () => {
  const author = 'Q210059';
  const page = read('dist/web/' + routes.author[author] + 'index.html');
  assert.match(page, /<span data-public-author="Q210059">Neil Gaiman<\/span>/);
  assert.ok(page.includes(`<link rel="canonical" href="https://foteev.github.io/unoebasta/${routes.author[author]}">`));
  const works = Object.entries(data.works).filter(([, w]) => w[3].includes(author)).map(([id]) => id);
  const linked = [...page.matchAll(/<a href="\.\.\/\.\.\/work\/[^\"]+" class="slip-open" data-work="([^\"]+)"/g)].map(match => match[1]);
  assert.deepEqual(linked.sort(), works.sort());
  assert.match(page, /<img class="cover cover-s" src="\.\.\/\.\.\/covers\/s\//);
  assert.match(page, /class="cover cover-s cover-t"/);
  assert.match(page, /<span class="award">[^<]+<b>[^<]+<\/b><\/span>/);
});

test('a new prize and category can be registered without changing code', () => {
  const sample = structuredClone(registry);
  sample.categories.FIC = { form: 'short story', name: { en: 'Fiction' } };
  sample.awards.fixture = { code: 'FIX', slug: 'fixture', name: { en: 'Fixture' }, categories: ['FIC'] };
  const winners = ['Q130213759', 'Q25349436'];
  const extended = { ...data, registry: sample, aw: [...data.aw, ...winners.map(q => ['fixture', 'FIC', 2026, q])] };
  validateAwards(sample, extended);
  assert.equal(catalogRoutes(extended, slugs).award.fixture, 'award/fixture-FIX/');
  const catalog = { data: extended, works: Object.keys(extended.works).map(qid => ({ qid })) };
  assert.deepEqual(scopeByAward(catalog, sample, 'fix').works.map(w => w.qid).sort(), winners.sort());
  assert.throws(() => scopeByAward(catalog, sample, 'WRONG'), /Unknown award code/);
  sample.awards.fixture.code = 'HUG';
  assert.throws(() => validateAwards(sample, extended), /Invalid award/);
});

test('World Fantasy Award keeps shared wins, existing work IDs and ISFDB-only routes', () => {
  const winners = data.aw.filter(([award]) => award === 'wfa');
  assert.equal(winners.length, 162);
  assert.deepEqual(winners.filter(([, category, year]) => category === 'N' && year === 1985).map(row => data.works[row[3]][0]).sort(), ['Bridge of Birds', 'Mythago Wood']);
  assert.ok(winners.some(([, , year, id]) => year === 2012 && id === 'Q27903111'));
  assert.equal(routes.work.T3406511, 'work/m-r-carey-once-was-willem-T3406511/');
  const page = read('dist/web/' + routes.award.wfa + 'index.html');
  assert.match(page, /Long Fiction/);
  assert.match(page, /Short Fiction/);
  assert.ok(page.includes(routes.work.T3406511));
  const catalog = { data, works: Object.keys(data.works).map(qid => ({ qid })) };
  assert.equal(scopeByAward(catalog, registry, 'WFA').works.length, 162);
});

test('built runtime parses as a classic script with no leftover markers', () => {
  const app = read('dist/web/catalog-app.js');
  assert.doesNotThrow(() => new vm.Script(app, { filename: 'catalog-app.js' }));
  assert.doesNotMatch(app, /__[A-Z0-9_]+__/);
  assert.doesNotMatch(app, /^\s*(?:import(?:\s+[\w]|\s*[{*'"(])|export(?:\s+[\w]|\s*[{*]))/m);
  const inline = read('dist/web/index.html').match(/<script>\n('use strict';[\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(inline, { filename: 'index-inline.js' }));
});
