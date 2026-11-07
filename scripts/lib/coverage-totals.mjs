// The counters on the front page ("Что уже можно прочитать"), computed from the rows of data/coverage.csv.
// A work has a link when any language has full text or an excerpt, or when it has a free audio reading.
const LANGS = ['en', 'pl', 'ru', 'es'];
export function coverageTotals(rows) {
  const t = { works: rows.length, withLink: 0, withoutLink: 0, full: 0, audio: 0 };
  for (const r of rows) {
    const audio = r.audio || LANGS.some(l => r['audio_' + l]);
    if (LANGS.some(l => r[l] && r[l] !== 'none') || audio) t.withLink++; else t.withoutLink++;
    if (LANGS.some(l => r[l] === 'full')) t.full++;
    if (audio) t.audio++;
  }
  return t;
}
export const totalsLine = t => `Totals: ${t.works} works, with a link ${t.withLink}, no link yet ${t.withoutLink}, full text ${t.full}, audio ${t.audio}`;
