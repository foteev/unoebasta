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

export function catalogMultiFilter(id, label, values, options, allLabel) {
  const selected = values || [], summary = selected.length ? options.filter(([v]) => selected.includes(v)).map(([, name]) => name).join(', ') : allLabel;
  return `<details class="multi-filter" data-multi="${id}"><summary><span class="multi-label">${catalogEscape(label)}</span><span class="multi-value" title="${catalogEscape(summary)}">${catalogEscape(summary)}</span></summary><div class="multi-options" role="group" aria-label="${catalogEscape(label)}">${[['all', allLabel], ...options].map(([value, name, code]) => { const checked = value === 'all' ? !selected.length : selected.includes(value); return `<label class="multi-option${checked ? ' is-selected' : ''}"><input type="checkbox" data-multi-filter="${id}"${code ? ` data-award-code="${catalogEscape(code)}"` : ''} value="${value}"${checked ? ' checked' : ''}><span>${catalogEscape(name)}</span></label>`; }).join('')}</div></details>`;
}
