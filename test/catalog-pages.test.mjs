import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogRoutes } from '../scripts/lib/public-pages.mjs';
import { scopeByAward, validateAwards } from '../scripts/lib/awards.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const registry = JSON.parse(read('data/award-registry.json'));
const data = { ...JSON.parse(read('data/awards.json')), registry };
const slugs = JSON.parse(read('data/catalog-slugs.json'));
const routes = catalogRoutes(data, slugs);

test('the published work path and the prize codes appear in the static artifact', () => {
  const workPath = routes.work.Q130213759;
  assert.equal(workPath, 'work/better-living-through-algorithms-Q130213759/');
  assert.match(read('dist/web/' + workPath + 'index.html'), /<h1>Better Living Through Algorithms<\/h1>/);
  for (const award of Object.keys(registry.awards)) {
    const awardPath = routes.award[award];
    assert.match(read('dist/web/' + awardPath + 'index.html'), new RegExp('award=' + registry.awards[award].code));
    assert.ok(read('dist/web/sitemap.xml').includes('/unoebasta/' + awardPath));
  }
  for (const path of Object.values(routes.author)) {
    assert.ok(read('dist/web/' + path + 'index.html').includes('<h1>'));
  }
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
