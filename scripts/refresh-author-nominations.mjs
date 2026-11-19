import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { CachedHttp, writeJson } from './lib/http.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://isfdb.stoecker.eu/cgi-bin/';
const categories = {
  Hugo: [261, 566, 263, 262, 273, 850, 274],
  Nebula: [413, 415, 414, 418],
  Locus: [375, 347, 350, 351, 349, 361, 360, 378, 377],
  'World Fantasy Award': [532, 667, 533, 534]
};
const { authors } = JSON.parse(readFileSync(join(root, 'data/awards.json'), 'utf8'));
const counts = Object.fromEntries(Object.values(authors).filter(a => a[6]).map(a => [a[6], 0]));
const seenEntries = new Set();
const http = new CachedHttp({ dir: join(root, '.cache/author-nominations'), delay: 500, ttl: 3600000 });

const home = await http.get(base + 'index.cgi');
const snapshot = home.body.match(/database as of (\d{4}-\d{2}-\d{2})/i)?.[1];
if (!snapshot) throw new Error('ISFDB mirror snapshot date is missing');

for (const [award, ids] of Object.entries(categories)) {
  let total = 0;
  for (const id of ids) {
    const { body } = await http.get(`${base}award_category.cgi?${id}+1`);
    const page = new JSDOM(body);
    try {
      const doc = page.window.document;
      const rows = doc.querySelectorAll('td > a[href^="/cgi-bin/award_details.cgi?"]');
      if (!doc.title.startsWith('Award Category:') || !rows.length) throw new Error(`No ISFDB award entries in category ${id}`);
      for (const link of rows) {
        const status = link.textContent.trim();
        if (status === '*') continue;
        if (!/^(?:Win|Nomination|[1-9][0-9]*)$/.test(status)) throw new Error(`Unknown ISFDB entry status ${status} in category ${id}`);
        const entry = link.getAttribute('href');
        if (seenEntries.has(entry)) continue;
        seenEntries.add(entry);
        total++;
        const authors = new Set([...link.closest('tr').querySelectorAll('a[href^="/cgi-bin/ea.cgi?"]')]
          .map(a => a.getAttribute('href').match(/\?(\d+)$/)?.[1]));
        for (const author of authors) if (Object.hasOwn(counts, author)) counts[author]++;
      }
    } finally {
      page.window.close();
    }
  }
  console.log(`${award}: ${total} ranked or nominated entries`);
}

writeJson(join(root, 'data/author-nominations.json'), { source: base + 'award_directory.cgi', snapshot, categories, counts });
console.log(`Saved nomination counts for ${Object.keys(counts).length} catalog authors from ISFDB ${snapshot}`);
