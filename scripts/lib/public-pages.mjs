import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { catalogAward, catalogLink, catalogWorkHeading } from '../../src/components/catalog.mjs';

export const SITE = 'https://foteev.github.io/unoebasta/';
const prefix = new URL(SITE).pathname;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export function catalogRoutes(data, slugs) {
  const entities = (type, entries) => Object.fromEntries(Object.keys(entries).map(qid => {
    const slug = slugs[type]?.[qid];
    if (!/^Q[1-9]\d*$/.test(qid) || !slugPattern.test(slug || '')) throw new Error('Missing or invalid stable slug for ' + type + ' ' + qid);
    return [qid, type + '/' + slug + '-' + qid + '/'];
  }));
  return {
    work: entities('work', data.works),
    author: entities('author', data.authors),
    award: Object.fromEntries(Object.entries(data.registry.awards).map(([id, a]) => [id, 'award/' + a.slug + '-' + a.code + '/']))
  };
}

export function writePublicPages(dir, shell, data, read) {
  const absolute = path => SITE + path;
  const local = (type, id) => '../../' + data.routes[type][id];
  const localized = (type, id, name) => '<span data-public-' + type + '="' + text(id) + '">' + text(name) + '</span>';
  const workLink = q => catalogLink(local('work', q), localized('work', q, data.works[q][0]), ' data-work="' + q + '"');
  const rowsByWork = new Map(Object.keys(data.works).map(q => [q, []]));
  for (const row of data.aw) rowsByWork.get(row[3]).push(row);
  const write = (path, title, description, content, qid) => {
    const url = absolute(path);
    const meta = '<link rel="canonical" href="' + text(url) + '">\n' +
      '<meta property="og:url" content="' + text(url) + '">\n' +
      '<meta property="og:title" content="' + text(title) + '">\n';
    let html = shell.replace('<body>', () => '<body data-page-path="' + text(prefix + path) + '"' +
      (qid ? ' data-page-work="' + qid + '"' : '') + '>')
      .replace('<title>unoebasta</title>', () => '<title>' + text(title) + ' · unoebasta</title>\n' + meta)
      .replace(/<meta name="description" content="[^"]*">/, () => '<meta name="description" content="' + text(description) + '">')
      .replace('<main>', () => '<main>\n' + content)
      .replace('id="view-catalog" class="wrap"', 'id="view-catalog" class="wrap" hidden');
    if (qid) html = html.replace('<div id="sheet-work" class="sheet" hidden></div>', '');
    const target = join(dir, path);
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, 'index.html'), html);
  };
  const sourceList = q => {
    const sources = (read[q]?.links || []).filter(l => /^https?:\/\//i.test(l.url));
    if (!sources.length) return '';
    return '<ul class="linklist">' + sources.map(l => '<li>' +
      catalogLink(l.url, text((l.kind === 'audio' ? 'Listen' : l.kind === 'full' ? 'Read' : 'Excerpt') +
        ' · ' + (l.lang || 'en').toUpperCase() + (l.site ? ' · ' + l.site : '')), ' rel="noopener"') + '</li>').join('') + '</ul>';
  };
  for (const [q, w] of Object.entries(data.works)) {
    const awards = rowsByWork.get(q).map(([a, c, y]) => catalogAward(data.registry.awards[a].name.en, y,
      data.registry.categories[c].name.en, { href: local('award', a) })).join('');
    const authors = w[3].map(a => catalogLink(local('author', a), text(data.authors[a][0]), ' class="btn btn-small author-pill"')).join('');
    const cover = data.covers.includes(q) ? '<img class="cover cover-m" src="../../covers/m/' + q + '.webp" alt="" width="120" height="180">' : '';
    const heading = catalogWorkHeading({ title: w[0], cover, awards, authors, page: true });
    const description = (w[7] || (w[0] + ' by ' + w[3].map(a => data.authors[a][0]).join(', '))).slice(0, 220);
    write(data.routes.work[q], w[0], description, '<section id="sheet-work" class="wrap public-work">' +
      heading + (w[7] ? '<p class="bio">' + text(w[7]) + '</p>' : '') + sourceList(q) + '</section>', q);
  }
  for (const [q, a] of Object.entries(data.authors)) {
    const works = Object.entries(data.works).filter(([, w]) => w[3].includes(q)).sort(([, a], [, b]) => a[0].localeCompare(b[0], 'en'));
    write(data.routes.author[q], a[0], 'Award-winning works by ' + a[0] + ' on unoebasta.',
      '<section class="wrap public-catalog"><h1>' + localized('author', q, a[0]) + '</h1><ul>' +
      works.map(([id]) => '<li>' + workLink(id) + '</li>').join('') + '</ul></section>');
  }
  for (const [id, a] of Object.entries(data.registry.awards)) {
    const rows = data.aw.filter(([award]) => award === id).sort((a, b) => b[2] - a[2]);
    const years = Map.groupBy(rows, row => row[2]);
    const groups = [...years].map(([year, winners]) => '<section class="yearsec"><h2>' + year + '</h2><ul>' +
      winners.map(([, c, , q]) => '<li>' + localized('category', c, data.registry.categories[c].name.en) + ' · ' + workLink(q) + '</li>').join('') + '</ul></section>');
    write(data.routes.award[id], a.name.en, 'Winners of the ' + a.name.en + ' award by year and category.',
      '<section class="wrap public-catalog"><h1>' + localized('award', id, a.name.en) + ' <small>' + text(a.code) + '</small></h1>' +
      catalogLink('../../?view=awards&award=' + encodeURIComponent(a.code), 'Filter awards · ' + text(a.code), ' class="btn"') +
      groups.join('') + '</section>');
  }
  const urls = ['', ...Object.values(data.routes).flatMap(routes => Object.values(routes))];
  writeFileSync(join(dir, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(path => '  <url><loc>' + text(absolute(path)) + '</loc></url>').join('\n') + '\n</urlset>\n');
  return urls.length - 1;
}
