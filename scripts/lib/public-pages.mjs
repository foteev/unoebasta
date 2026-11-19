import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WPM, catalogAudioDuration, catalogAward, catalogCover, catalogExcerpts, catalogLink, catalogPageCount, catalogSlip, catalogWorkHeading } from '../../src/components/catalog.mjs';

export const SITE = 'https://foteev.github.io/unoebasta/';
const prefix = new URL(SITE).pathname;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const localized = (type, id, name) => '<span data-public-' + type + '="' + text(id) + '">' + text(name) + '</span>';
const numbers = new Intl.NumberFormat('en');
const languages = new Intl.DisplayNames('en', { type: 'language' });

export function catalogAwardDirectory(data) {
  const links = Object.entries(data.registry.awards).map(([id, award]) =>
    catalogLink('./' + data.routes.award[id], localized('award', id, award.name.en), ' class="btn btn-small"'));
  return '<nav id="award-directory" class="wrap award-directory" aria-labelledby="award-directory-title">' +
    '<h2 id="award-directory-title" data-i18n="nav_awards">Awards</h2><div class="row">' + links.join('') + '</div></nav>\n';
}

function workSources(q, title, data, entry) {
  const links = (entry?.links || []).map(l => ({
    ...l,
    label: l.kind === 'audio' ? 'Audio' : l.part ? 'Text' : 'Full text',
    details: [l.part && 'Part ' + l.part, catalogAudioDuration(l.seconds),
      l.kind === 'audio' && l.verification === 'metadata' && 'Recording listed',
      (l.rights === 'unknown' || l.tier === 'external') && 'Permission unverified']
  }));
  const excerpts = catalogExcerpts({ title, ex: data.ex?.[q], gb: data.gb?.[q] }).map(l => ({
    ...l, label: l.audio ? 'Audio excerpt' : 'Excerpt', details: [l.coll]
  }));
  return [...links, ...excerpts].filter(l => /^https?:\/\//i.test(l.url));
}

function sourceList(sources) {
  if (!sources.length) return '';
  return '<h2>Read and listen</h2><ul class="linklist">' + sources.map(l => {
    const lang = (l.lang || 'en').toLowerCase();
    const label = [l.label, languages.of(lang), l.site, ...l.details].filter(Boolean).join(' · ');
    return '<li>' + catalogLink(l.url, text(label), ' rel="noopener"') + '</li>';
  }).join('') + '</ul>';
}

export function catalogRoutes(data, slugs) {
  const authorPrefix = qid => {
    const authors = data.works?.[qid]?.[3] || [];
    const authorSlugs = authors.map(id => slugs.author?.[id]).filter(Boolean);
    return authorSlugs.length ? authorSlugs.join('-') + '-' : '';
  };
  const entities = (type, entries) => Object.fromEntries(Object.keys(entries).map(qid => {
    const slug = slugs[type]?.[qid];
    if (!(type === 'work' ? /^[QT][1-9]\d*$/ : /^[QA][1-9]\d*$/).test(qid) || !slugPattern.test(slug || '')) throw new Error('Missing or invalid stable slug for ' + type + ' ' + qid);
    const prefix = type === 'work' ? authorPrefix(qid) : '';
    return [qid, type + '/' + prefix + slug + '-' + qid + '/'];
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
  const workLink = q => catalogLink(local('work', q), localized('work', q, data.works[q][0]), ' data-work="' + q + '"');
  const rowsByWork = new Map(Object.keys(data.works).map(q => [q, []]));
  for (const row of data.aw) rowsByWork.get(row[3]).push(row);
  const awardsFor = (q, linked = false) => rowsByWork.get(q).map(([a, c, y]) => catalogAward(
    data.registry.awards[a].name.en, y, data.registry.categories[c].name.en,
    linked ? { href: local('award', a) } : undefined)).join('');
  const covers = new Set(data.covers);
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
  for (const [q, w] of Object.entries(data.works)) {
    const rows = rowsByWork.get(q);
    const awards = awardsFor(q, true);
    const authors = w[3].map(a => catalogLink(local('author', a), text(data.authors[a][0]), ' class="btn btn-small author-pill"')).join('');
    const cover = covers.has(q) ? '<img class="cover cover-m" src="../../covers/m/' + q + '.webp" alt="" width="120" height="180">' : '';
    const entry = read[q], words = entry?.w, pages = catalogPageCount(data.gb?.[q], data.ol?.[q]);
    const hasWordCount = Number.isFinite(words) && words > 0;
    const facts = [w[6] && 'Published ' + w[6], entry?.pub, pages && numbers.format(pages) + ' pages',
      hasWordCount && 'About ' + numbers.format(words) + ' words',
      hasWordCount && 'About ' + numbers.format(Math.max(1, Math.round(words / WPM))) + ' min to read']
      .filter(Boolean).map(text).join(' · ');
    const heading = catalogWorkHeading({ title: w[0], cover, awards, authors, facts, page: true });
    const title = w[0] + ' by ' + w[3].map(a => data.authors[a][0]).join(', ');
    const sources = workSources(q, w[0], data, entry);
    const formats = [...new Set(sources.map(l => l.label.toLowerCase()))];
    const awardNames = rows.map(([a, c, y]) => `${y} ${data.registry.awards[a].name.en}, ${data.registry.categories[c].name.en}`);
    const description = [title + '.', formats.length && 'Find ' + formats.join(', ') + '.',
      awardNames.length && 'Winner: ' + awardNames.join('; ') + '.'].filter(Boolean).join(' ').slice(0, 220);
    write(data.routes.work[q], title, description, '<section id="sheet-work" class="wrap public-work">' +
      heading + (w[7] ? '<p class="bio">' + text(w[7]) + '</p>' : '') + sourceList(sources) + '</section>', q);
  }
  for (const [q, a] of Object.entries(data.authors)) {
    const works = Object.entries(data.works).filter(([, w]) => w[3].includes(q)).sort(([, a], [, b]) => a[0].localeCompare(b[0], 'en'));
    const cards = works.map(([id, w]) => {
      const names = w[3].map(author => data.authors[author][0]);
      return catalogSlip({
        opener: catalogLink(local('work', id), '<h3>' + text(w[0]) + '</h3>', ' class="slip-open" data-work="' + id + '"'),
        cover: catalogCover({ id, title: w[0], author: names[0], image: covers.has(id), base: '../../' }),
        awards: awardsFor(id), byline: [names.join(', '), read[id]?.pub, w[6]].filter(Boolean).join(' · ')
      });
    });
    write(data.routes.author[q], a[0], 'Award-winning works by ' + a[0] + ' on unoebasta.',
      '<section id="public-author" class="wrap public-author" data-author-id="' + q + '" aria-labelledby="author-name">' +
      '<h1 id="author-name">' + localized('author', q, a[0]) + '</h1><div id="author-controls"></div>' +
      '<div id="author-works" aria-live="polite">' + (cards.length ? '<div class="slips">' + cards.join('') + '</div>' :
        '<p class="empty" data-i18n="nothing_found">Nothing found</p>') + '</div></section>');
  }
  for (const [id, a] of Object.entries(data.registry.awards)) {
    const rows = data.aw.filter(([award]) => award === id).sort((a, b) => b[2] - a[2]);
    const years = Map.groupBy(rows, row => row[2]);
    const groups = [...years].map(([year, winners]) => '<section class="yearsec"><h2>' + year + '</h2><ul>' +
      winners.map(([, c, , q]) => '<li>' + localized('category', c, data.registry.categories[c].name.en) + ' · ' + workLink(q) + '</li>').join('') + '</ul></section>');
    const awardName = a.name.en.endsWith('Award') ? a.name.en : a.name.en + ' Award';
    write(data.routes.award[id], awardName + ' Winners', 'Browse ' + awardName + ' winners by year and category. Find full texts, excerpts and audio where available.',
      '<section class="wrap public-catalog"><h1>' + localized('award', id, a.name.en) + ' <small>' + text(a.code) + '</small></h1>' +
      catalogLink('../../?view=awards&award=' + encodeURIComponent(a.code), '<span data-i18n="filter_awards_link">Filter awards</span> · ' + text(a.code), ' class="btn"') +
      groups.join('') + '</section>');
  }
  const urls = ['', ...Object.values(data.routes).flatMap(routes => Object.values(routes))];
  writeFileSync(join(dir, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(path => '  <url><loc>' + text(absolute(path)) + '</loc></url>').join('\n') + '\n</urlset>\n');
  return urls.length - 1;
}
