import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readAwardRegistry(root) {
  return JSON.parse(readFileSync(join(root, 'data', 'award-registry.json'), 'utf8'));
}

export function validateAwards(registry, data) {
  const codes = new Set(), slugs = new Set(), rows = new Set();
  for (const [id, { form, name }] of Object.entries(registry.categories)) {
    if (!/^[A-Z][A-Z0-9_-]*$/.test(id) || !['novel', 'novella', 'novelette', 'short story'].includes(form) || !name?.en) {
      throw new Error('Invalid award category: ' + id);
    }
  }
  for (const [id, { code, slug, name, categories }] of Object.entries(registry.awards)) {
    if (!/^[a-z][a-z0-9_-]*$/.test(id) || !/^[A-Z][A-Z0-9]*$/.test(code) || codes.has(code) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug) || !name?.en ||
        !Array.isArray(categories) || !categories.length || new Set(categories).size !== categories.length ||
        categories.some(category => !Object.hasOwn(registry.categories, category))) throw new Error('Invalid award: ' + id);
    codes.add(code);
    slugs.add(slug);
  }
  for (const [award, category, year, qid] of data.aw) {
    const key = [award, category, year, qid].join('|');
    if (!Object.hasOwn(registry.awards, award) || !registry.awards[award].categories.includes(category) ||
        !Number.isInteger(year) || year < 1 || !Object.hasOwn(data.works, qid) || rows.has(key)) throw new Error('Invalid award result: ' + key);
    rows.add(key);
  }
}

export function scopeByAward(catalog, registry, code) {
  const id = Object.keys(registry.awards).find(key => registry.awards[key].code === code.toUpperCase());
  if (!id) throw new Error('Unknown award code: ' + code);
  const qids = new Set(catalog.data.aw.filter(([award]) => award === id).map(([, , , qid]) => qid));
  return { ...catalog, works: catalog.works.filter(work => qids.has(work.qid)) };
}
