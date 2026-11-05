// These are conservative access diagnostics, never proof of story scope or permission.
export function pageAccessIssue(url, body) {
  const host = new URL(url).hostname;
  const html = String(body).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const visible = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (/(^|\.)litres\.ru$/.test(host) && visible.includes('Что-то пошло не так') && visible.includes('Нет в продаже')) return 'unavailable_reader';
  if (/<title[^>]*>\s*Site Unavailable\s*<\/title>/i.test(html) && visible.split(' ').length < 100) return 'placeholder_page';
  if (/(^|\.)legimi\.pl$/.test(host) && !/\bid=["']sample_section["']/i.test(html)) return 'missing_sample';
  return '';
}

export function catalogSourceLinks(read, data) {
  const out = Object.entries(read).flatMap(([q, r]) => r.links.map(l => ({ q, kind: l.kind, lang: l.lang || 'en', site: l.site, url: l.url })));
  for (const [q, x] of Object.entries(data.ex || {})) {
    for (const [k, host, lang, site] of [['r','https://reactormag.com','en','Reactor'],['lr','https://www.litres.ru','ru','LitRes'],['lg','https://www.legimi.pl','pl','Legimi']]) if (x[k]) out.push({ q, kind: 'fragment', lang, site, url: host + x[k] });
    for (const o of x.o || []) out.push({ q, kind: 'fragment', lang: o.l || 'en', site: o.s, url: o.u });
  }
  for (const [q, g] of Object.entries(data.gb || {})) {
    for (const lang of ['en','pl','ru','es']) if (g[lang]) out.push({ q, kind: 'conditional preview', lang, site: 'Google Books', url: `https://books.google.com/books?id=${encodeURIComponent(g[lang][0])}&printsec=frontcover` });
    if (g.s) out.push({ q, kind: 'conditional preview', lang: 'en', site: 'Google Books', url: `https://books.google.com/books?id=${encodeURIComponent(g.s[0])}&q=${encodeURIComponent('"' + data.works[q][0] + '"')}` });
  }
  return out;
}
