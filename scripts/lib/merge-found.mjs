import { cleanUrl, validateFound } from './csv.mjs';
import { readTable } from './catalog.mjs';

const RANK = ['Clarkesworld', 'Lightspeed', 'Uncanny', 'Apex', 'Asimov', 'Analog', 'Strange Horizons', 'Reactor', 'GigaNotoSaurus', 'Escape Pod', 'WIRED', 'Baen'];
const rank = s => { const i = RANK.findIndex(r => s.includes(r)); return i < 0 ? RANK.length : i; };
const siteName = s => s.replace(/\s*\(Wayback\)\s*$/i, '');
const key = r => JSON.stringify([r.kind, r.lang || 'en', +r.part || '', cleanUrl(r.url)]);
const groups = (rows, getKey) => { const m = new Map(); for (const r of rows) { const k = getKey(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return m; };

export function mergeFound(source, originalData, rows, { archive = false, now = new Date().toISOString() } = {}) {
  rows.forEach(validateFound); // Validate everything before changing either file.
  const data = structuredClone(originalData), read = readTable(source), changed = new Map();
  const stats = { added: 0, updated: 0, links: 0, fragments: 0, titles: 0, none: 0, skipped: [] };
  for (const [qid, all] of groups(rows, r => r.qid)) {
    const raw = data.works[qid];
    if (!raw) { stats.skipped.push(`${qid}: not in awards.json`); continue; }
    stats.none += all.filter(r => r.kind === 'none').length;
    const ok = all.filter(r => r.kind !== 'none' && (archive || r.archive !== 'yes'));
    if (all.some(r => r.archive === 'yes') && !archive) stats.skipped.push(`${qid}: Wayback requires --archive`);
    for (const r of ok) {
      const known = (r.lang === 'pl' && raw[1]) || (r.lang === 'ru' && raw[2]) || data['t_' + r.lang]?.[qid];
      const title = r.title.replace(/\s*[([][^()[\]]*[)\]]\s*$/, '').trim();
      if (r.lang !== 'en' && !known && title && title !== raw[0]) { (data['t_' + r.lang] ||= {})[qid] = title; stats.titles++; }
      if (r.kind !== 'fragment') continue;
      const x = (data.ex ||= {})[qid] ||= {}, u = cleanUrl(r.url), parsed = new URL(u);
      const shorthand = [['reactormag.com', 'en', 'r'], ['litres.ru', 'ru', 'lr'], ['legimi.pl', 'pl', 'lg']]
        .find(([host, lang]) => (parsed.hostname === host || parsed.hostname.endsWith('.' + host)) && lang === r.lang);
      if (shorthand && !x[shorthand[2]]) { x[shorthand[2]] = parsed.pathname + parsed.search; stats.fragments++; }
      else if (!(shorthand && new URL(x[shorthand[2]], parsed.origin).href === u)) {
        const list = x.o ||= [];
        if (!list.some(o => cleanUrl(o.u) === u && (o.l || 'en') === r.lang)) { list.push({ u, s: r.site, l: r.lang }); stats.fragments++; }
      }
    }
    const entry = structuredClone(read[qid] || { links: [] }), before = entry.links.length;
    const hadFull = entry.links.some(l => l.kind === 'full');
    const selected = [];
    for (const rs of groups(ok.filter(r => ['full', 'audio'].includes(r.kind)), r => `${r.lang}|${r.kind}`).values()) {
      // Keep all existing sources; select one new source per language and kind, including every part.
      const site = [...new Set(rs.map(r => r.site))].sort((a, b) => rank(a) - rank(b))[0];
      const chosen = rs.filter(r => r.site === site).sort((a, b) => (+a.part || 0) - (+b.part || 0));
      const combined = [...entry.links.filter(l => l.kind === chosen[0].kind && (l.lang || 'en') === chosen[0].lang && l.site === siteName(site)), ...chosen];
      if (combined.some(r => r.part)) {
        if (combined.some(r => !r.part)) throw new Error(`${qid}: cannot mix numbered and unnumbered parts for ${site}`);
        const parts = new Map();
        for (const r of combined) {
          if (parts.has(+r.part) && cleanUrl(parts.get(+r.part)) !== cleanUrl(r.url)) throw new Error(`${qid}: conflicting part ${r.part}`);
          parts.set(+r.part, r.url);
        }
        const max = Math.max(...parts.keys());
        if (max > 100 || Array.from({ length: max }, (_, i) => i + 1).some(p => !parts.has(p))) throw new Error(`${qid}: incomplete multipart source ${site}`);
      }
      for (const r of chosen) {
        if (entry.links.some(l => key(l) === key(r))) continue;
        const link = { kind: r.kind, url: cleanUrl(r.url), site: siteName(r.site) };
        if (r.archive === 'yes') link.archive = true;
        if (r.part) link.part = +r.part;
        if (r.lang !== 'en') link.lang = r.lang;
        if (r.kind === 'full' && /(^|\.)baen\.com$/.test(new URL(r.url).hostname)) link.downloads = true;
        entry.links.push(link); selected.push(r);
      }
    }
    if (entry.links.length === before) continue;
    const texts = selected.filter(r => r.kind === 'full'), main = texts.find(r => r.lang === 'en') || texts[0] || selected[0];
    if (!read[qid] || (!hadFull && texts.length)) {
      const words = texts.filter(r => r.lang === main.lang).reduce((n, r) => n + (+r.words || 0), 0);
      if (words) entry.w = words;
      entry.tier = main.tier; entry.pub = main.pub.split(';')[0].trim();
      if (main.license) entry.license = main.license; else delete entry.license;
      if (selected.some(r => r.kind === 'full' && /(^|\.)baen\.com$/.test(new URL(r.url).hostname))) entry.note = 'note_baen';
    }
    entry.added = now;
    changed.set(qid, entry); stats.links += entry.links.length - before;
    if (read[qid]) stats.updated++; else stats.added++;
  }
  for (const [qid, entry] of changed) {
    const line = `  ${qid}: ${JSON.stringify(entry).replaceAll('<', '\\u003c')},`;
    if (read[qid]) {
      const pattern = new RegExp(`^  ${qid}: .*,$`, 'm');
      if (!pattern.test(source)) throw new Error(`${qid}: READ entry is not on one line`);
      source = source.replace(pattern, () => line);
    } else {
      const end = source.indexOf('\n};\nconst CHANGELOG');
      if (end < 0) throw new Error('READ end not found');
      source = source.slice(0, end) + '\n' + line + source.slice(end);
    }
  }
  if (stats.fragments) data.ex_at = now.slice(0, 10);
  return { source, data, stats };
}
