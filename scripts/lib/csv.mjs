export const FOUND_FIELDS = 'qid,title,form,lang,kind,site,url,tier,license,words,pub,part,archive,evidence,checked_at'.split(',');

export function parseCsv(text) {
  const records = []; let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(Boolean)) records.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  row.push(cell); if (row.some(Boolean)) records.push(row);
  const [head, ...body] = records;
  if (!head) return [];
  const keys = head.map(s => s.trim());
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate CSV header');
  return body.map((r, i) => {
    if (r.length !== keys.length) throw new Error(`CSV row ${i + 2}: expected ${keys.length} columns, got ${r.length}`);
    return Object.fromEntries(keys.map((k, j) => [k, r[j].trim()]));
  });
}

export const toCsv = (rows, fields = FOUND_FIELDS) => [fields, ...rows.map(r => fields.map(k => r[k] ?? ''))]
  .map(r => r.map(v => /[",\r\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : v).join(',')).join('\n') + '\n';

export function cleanUrl(value) {
  const u = new URL(value);
  if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) throw new Error('Expected public HTTP(S) URL');
  for (const k of [...u.searchParams.keys()]) if (/^(utm_|ref$|aff|fbclid$|gclid$)/i.test(k)) u.searchParams.delete(k);
  return u.href;
}

// A fragment identifier changes the starting position, not the source identity.
export function sourceUrlKey(value) { const u = new URL(cleanUrl(value)); u.hash = ''; return u.href; }

export function validateFound(r) {
  const fail = message => { throw new Error(`${r.qid || 'row'}: ${message}`); };
  if (FOUND_FIELDS.some(k => !(k in r))) fail('missing CSV columns');
  if (!/^Q[1-9]\d*$/.test(r.qid)) fail('invalid QID');
  if (!['en', 'pl', 'ru', 'es'].includes(r.lang)) fail('unsupported language');
  if (!['novel', 'novella', 'novelette', 'short story'].includes(r.form)) fail('invalid form');
  if (!['full', 'audio', 'fragment', 'none'].includes(r.kind)) fail('invalid kind');
  if (!r.evidence || /^CANDIDATE\b/i.test(r.evidence)) fail('review evidence required');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(r.checked_at) || !Number.isFinite(Date.parse(r.checked_at))) fail('UTC checked_at required');
  if (r.kind === 'none') { if (r.url) fail('none must have no URL'); return; }
  if (!r.title || !r.site || !r.url) fail('title, site and URL required');
  cleanUrl(r.url);
  if (r.kind === 'fragment' ? r.tier !== 'frag' : !['t1', 't2', 't2us', 'external'].includes(r.tier)) fail('invalid tier for kind');
  if (r.tier === 'external' && r.license) fail('external sources have unverified permission; do not assign a license');
  if (r.words && (r.kind !== 'full' || !/^[1-9]\d*$/.test(r.words))) fail('words must be a positive integer for full text only');
  if (r.part && (!/^[1-9]\d*$/.test(r.part) || +r.part > 100)) fail('part must be 1..100');
  if (r.archive && r.archive !== 'yes') fail('archive must be yes or empty');
  if (new URL(r.url).hostname === 'web.archive.org' && r.archive !== 'yes') fail('Wayback needs archive=yes');
}
