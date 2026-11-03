export const normalize = value => String(value || '').replace(/[™®©]/g, '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const titleMatch = (a, b) => normalize(a) === normalize(b);
export function authorMatch(expected, actual) {
  if (normalize(expected) === normalize(actual)) return !!normalize(expected);
  const a = normalize(expected).split(' '), b = normalize(actual).split(' ');
  return a.length >= 2 && b.includes(a.at(-1)) && a.every(t => b.includes(t) || b.some(x => x[0] === t[0] && (x.length === 1 || t.length === 1)));
}
export const uniqueNames = values => [...new Map(values.filter(v => typeof v === 'string' && v.trim()).map(v => [normalize(v), v.trim()])).values()];
export const titlesFor = (w, lang) => uniqueNames([w.titles?.[lang], ...(w.titleVariants?.[lang] || [])]);
export const authorsFor = (w, lang) => w.authorVariants?.[lang] || w.authors.map(a => [a]);
export const allAuthors = (w, names, lang) => authorsFor(w, lang).every(group => group.some(a => names.some(b => authorMatch(a, b))));
export function queryVariants(w, lang, { max = 8 } = {}) {
  const titles = titlesFor(w, lang), groups = authorsFor(w, lang), queries = [];
  const depth = Math.max(1, ...groups.map(g => g.length));
  // Bounded name sets, rather than a Cartesian product of every author's aliases.
  for (const title of titles) for (let i = 0; i < depth; i++) {
    const authors = groups.map(g => g[i] || g[0]);
    const key = JSON.stringify([normalize(title), authors.map(normalize)]);
    if (!queries.some(q => q.key === key)) queries.push({ title, authors, key });
  }
  return { queries: queries.slice(0, max), truncated: queries.length > max };
}
