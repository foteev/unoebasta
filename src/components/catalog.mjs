function catalogEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

export function catalogLink(href, label, attrs = '') {
  return '<a href="' + catalogEscape(href) + '"' + attrs + '>' + label + '</a>';
}

export function catalogAward(label, year, category, { href, filter } = {}) {
  const body = catalogEscape(label) + ' ' + year + '<b>' + catalogEscape(category) + '</b>';
  if (href) return catalogLink(href, body, ' class="award"');
  if (filter) return '<button class="award" data-goaw="' + catalogEscape(filter) + '">' + body + '</button>';
  return '<span class="award">' + body + '</span>';
}

export function catalogWorkHeading({ title, cover = '', awards, authors, facts = '', page = false }) {
  const heading = page ? 'h1' : 'h2';
  return '<div class="work-head wh-b">' + cover + '<div class="work-head-t"><div class="awards">' + awards +
    '</div><div class="row wh-authors">' + authors + '</div><' + heading + '>' + catalogEscape(title) +
    '</' + heading + '><p class="wh-meta">' + facts + '</p></div></div>';
}

export function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function catalogCover({ id, title, author, image, size = 's', base = '' }) {
  const big = size === 'm';
  if (image) return `<img class="cover cover-${size}" src="${catalogEscape(base)}covers/${size}/${catalogEscape(id)}.webp" alt="" loading="lazy" decoding="async" width="${big ? 120 : 56}" height="${big ? 180 : 84}">`;
  const hue = parseInt(hash(id), 36) % 360;
  return `<div class="cover cover-${size} cover-t" style="--ch:${hue}" aria-hidden="true"><span class="ct" lang="en">${catalogEscape(title)}</span><span class="ca">${catalogEscape(author)}</span></div>`;
}

export function catalogSlip({ opener, cover, awards, byline, original = '', duration = '', flags = '', actions = '', star = '', done = false }) {
  return `<article class="slip${done ? ' is-done' : ''}">
    ${star}
    <div class="slip-row">${cover}<div class="slip-body">
      <div class="awards">${awards}</div>
      ${opener}
      ${original ? `<div class="alt" lang="en">${catalogEscape(original)}</div>` : ''}
      <p class="byline">${catalogEscape(byline)}</p>
      ${duration ? `<p class="slip-time">${catalogEscape(duration)}</p>` : ''}</div></div>
    ${flags ? `<div class="flags">${flags}</div>` : ''}
    ${actions ? `<div class="slip-actions">${actions}</div>` : ''}
  </article>`;
}

export const WPM = 200;
export const catalogPageCount = (gb, ol) => gb?.n || ol?.n || null;
export const catalogHasExcerpt = (ex, gb) => !!(ex || (gb && (gb.en || gb.pl || gb.ru || gb.es || gb.s)));

export function catalogAudioDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const pad = n => String(n).padStart(2, '0');
  return hours ? `${hours}:${pad(minutes)}:${pad(total % 60)}` : `${minutes}:${pad(total % 60)}`;
}

export function gbUrl(id, title) {
  return `https://books.google.com/books?id=${encodeURIComponent(id)}${title ? '&q=' + encodeURIComponent('"' + title + '"') : '&printsec=frontcover'}`;
}

export function catalogExcerpts({ title, ex, gb }, litRes = 'LitRes') {
  const x = ex || {}, g = gb || {}, out = [];
  if (x.r) {
    const audio = /audio-excerpt/.test(x.r);
    out.push({ url: 'https://reactormag.com' + x.r, site: 'Reactor (Tor)', lang: 'EN', html: !audio, audio });
  }
  if (x.lr) out.push({ url: 'https://www.litres.ru' + x.lr, site: litRes, lang: 'RU', html: true });
  if (x.lg) out.push({ url: 'https://www.legimi.pl' + x.lg, site: 'Legimi', lang: 'PL', html: true });
  for (const o of x.o || []) out.push({ url: o.u, site: o.s, lang: (o.l || 'en').toUpperCase(), html: true });
  const publisherExcerpt = { en: x.r, ru: x.lr, pl: x.lg };
  for (const l of ['en', 'pl', 'ru', 'es']) {
    if (!g[l] || publisherExcerpt[l]) continue;
    const [id, isbn] = g[l];
    out.push({ url: gbUrl(id), site: 'Google Books', lang: l.toUpperCase(), gb: { id, isbn, lang: l } });
  }
  if (g.s) out.push({ url: gbUrl(g.s[0], title), site: 'Google Books', lang: 'EN', coll: g.s[1] });
  return out;
}

export function catalogMultiFilter(id, label, values, options, allLabel) {
  const selected = values || [], summary = selected.length ? options.filter(([v]) => selected.includes(v)).map(([, name]) => name).join(', ') : allLabel;
  return `<details class="multi-filter" data-multi="${id}"><summary><span class="multi-label">${catalogEscape(label)}</span><span class="multi-value" title="${catalogEscape(summary)}">${catalogEscape(summary)}</span></summary><div class="multi-options" role="group" aria-label="${catalogEscape(label)}">${[['all', allLabel], ...options].map(([value, name, code]) => { const checked = value === 'all' ? !selected.length : selected.includes(value); return `<label class="multi-option${checked ? ' is-selected' : ''}"><input type="checkbox" data-multi-filter="${id}"${code ? ` data-award-code="${catalogEscape(code)}"` : ''} value="${value}"${checked ? ' checked' : ''}><span>${catalogEscape(name)}</span></label>`; }).join('')}</div></details>`;
}
