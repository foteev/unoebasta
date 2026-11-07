// Build the portable app and the static catalog for GitHub Pages.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAwardRegistry, validateAwards } from './lib/awards.mjs';
import { readTable } from './lib/catalog.mjs';
import { catalogRoutes, SITE, writePublicPages } from './lib/public-pages.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist', 'web');
const load = path => readFileSync(join(root, path), 'utf8');
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const data = JSON.parse(load('data/awards.json'));
data.registry = readAwardRegistry(root);
validateAwards(data.registry, data);
data.routes = catalogRoutes(data, JSON.parse(load('data/catalog-slugs.json')));
const cdir = join(root, 'covers');
data.covers = existsSync(join(cdir, 'm')) ? readdirSync(join(cdir, 'm')).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)).filter(q => existsSync(join(cdir, 's', q + '.webp'))).sort() : [];
const src = load('src/index.html');
const css = ['base', 'lists', 'reading', 'sheets', 'appearance', 'themes', 'public-pages']
  .map(name => load('src/styles/' + name + '.css')).join('');
const components = load('src/components/catalog.mjs').replace(/^export /gm, '');
const brief = safeJson(load('docs/search-brief.md'));
function replaceOnce(source, marker, value) {
  if (!source.includes(marker)) throw new Error('Missing build marker: ' + marker);
  return source.replace(marker, () => value);
}
const dataText = safeJson(data);
const template = replaceOnce(src, '__CATALOG_COMPONENTS__', components);
const app = replaceOnce(replaceOnce(replaceOnce(template, '__SITE_CSS__', css), '__AWARDS_JSON__', dataText), '__SEARCH_BRIEF_JSON__', brief);
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'index.html'), replaceOnce(app, '<title>unoebasta</title>', '<title>unoebasta</title>\n<link rel="canonical" href="' + SITE + '">'));
const runtime = template.match(/<script>\n('use strict';[\s\S]*?)<\/script>/)?.[1];
if (!runtime) throw new Error('App script is missing');
const publicRuntime = replaceOnce(replaceOnce(runtime,
  "JSON.parse(document.getElementById('awards-data').textContent)", dataText),
  "JSON.parse(document.getElementById('search-brief').textContent)", brief);
writeFileSync(join(dist, 'catalog-app.js'), publicRuntime);
writeFileSync(join(dist, 'site.css'), css);
const shell = template.replace('<style>\n__SITE_CSS__</style>', '<link rel="stylesheet" href="../../site.css">')
  .replace(/<script type="application\/json" id="(?:awards-data|search-brief)">.*?<\/script>\n/g, '')
  .replace(/<script src=/g, '<script defer src=')
  .replace(/<script>\n'use strict';[\s\S]*?<\/script>/, '<script defer src="../../catalog-app.js"></script>');
for (const type of ['work', 'author', 'award']) rmSync(join(dist, type), { recursive: true, force: true });
const pages = writePublicPages(dist, shell, data, readTable(src));
if (data.covers.length) cpSync(cdir, join(dist, 'covers'), { recursive: true });
console.log('dist/web:', pages, 'catalog pages,', data.aw.length, 'award results,', data.covers.length, 'covers');
