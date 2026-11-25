// Build the portable app and the static catalog for GitHub Pages.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { readAwardRegistry, validateAwards } from './lib/awards.mjs';
import { readTable } from './lib/catalog.mjs';
import { catalogAwardDirectory, catalogRoutes, SITE, writePublicPages } from './lib/public-pages.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist', 'web');
const load = path => readFileSync(join(root, path), 'utf8');
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const data = JSON.parse(load('data/awards.json'));
data.registry = readAwardRegistry(root);
data.authorNominations = JSON.parse(load('data/author-nominations.json'));
validateAwards(data.registry, data);
data.routes = catalogRoutes(data, JSON.parse(load('data/catalog-slugs.json')));
const cdir = join(root, 'covers');
data.covers = existsSync(join(cdir, 'm')) ? readdirSync(join(cdir, 'm')).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)).filter(q => existsSync(join(cdir, 's', q + '.webp'))).sort() : [];
const loadText = path => load(path).replace(/\r\n/g, '\n');
const src = loadText('src/index.html');
const css = ['base', 'lists', 'reading', 'sheets', 'appearance', 'themes', 'public-pages']
  .map(name => loadText('src/styles/' + name + '.css')).join('');
const components = loadText('src/components/catalog.mjs').replace(/^export /gm, '');
const i18n = loadText('src/components/i18n.mjs');
const storage = loadText('src/components/storage.mjs');
const files = loadText('src/components/files.mjs');
const voice = loadText('src/components/voice.mjs');
const sync = loadText('src/components/sync.mjs');
const analytics = loadText('src/components/analytics.mjs');
const brief = safeJson(load('docs/search-brief.md'));
function replaceOnce(source, marker, value) {
  if (!source.includes(marker)) throw new Error('Missing build marker: ' + marker);
  return source.replace(marker, () => value);
}
const dataText = safeJson(data);
const markers = [
  ['__CATALOG_COMPONENTS__', components],
  ['__I18N_DEFINITIONS__', i18n],
  ['__STORAGE_COMPONENTS__', storage],
  ['__FILES_COMPONENTS__', files],
  ['__VOICE_COMPONENTS__', voice],
  ['__SYNC_COMPONENTS__', sync],
  ['__ANALYTICS_COMPONENTS__', analytics],
];
const fragments = { components, i18n, storage, files, voice, sync, analytics };
for (const [marker] of markers) {
  if (src.split(marker).length !== 2) throw new Error('Build marker must occur once: ' + marker);
  for (const [name, text] of Object.entries(fragments)) {
    if (text.includes(marker)) throw new Error(`${name} contains ${marker}`);
  }
}
const MODULE_SYNTAX = /^\s*(?:import(?:\s+[\w]|\s*[{*'"(])|export(?:\s+[\w]|\s*[{*]))/m;
for (const [name, text] of Object.entries(fragments)) {
  if (MODULE_SYNTAX.test(text)) throw new Error(name + ': import/export survives inlining');
  if (/<\/script/i.test(text)) throw new Error(name + ': contains </script');
  new vm.Script(text, { filename: name });
}
const template = markers.reduce((acc, [marker, value]) => replaceOnce(acc, marker, value), src);
const app = replaceOnce(replaceOnce(replaceOnce(template, '__SITE_CSS__', css), '__AWARDS_JSON__', dataText), '__SEARCH_BRIEF_JSON__', brief);
if (/__[A-Z0-9_]+__/.test(app)) throw new Error('Unreplaced build marker in app');
const homeMetadata = `<title>Unoebasta · Award-Winning Sci-Fi and Fantasy to Read or Hear</title>
<link rel="canonical" href="${SITE}">
<meta name="google-site-verification" content="K4v2MmrqwzwD1Ve3ygC7yQR0_EYqP9vDwTrx-ODoYzU">`;
const home = replaceOnce(app, '<title>unoebasta</title>', homeMetadata);
const runtime = template.match(/<script>\n('use strict';[\s\S]*?)<\/script>/)?.[1];
if (!runtime) throw new Error('App script is missing');
const publicRuntime = replaceOnce(replaceOnce(runtime,
  "JSON.parse(document.getElementById('awards-data').textContent)", dataText),
  "JSON.parse(document.getElementById('search-brief').textContent)", brief);
const shell = replaceOnce(template, '<style>\n__SITE_CSS__</style>', '<link rel="stylesheet" href="../../site.css">')
  .replace(/<script type="application\/json" id="(?:awards-data|search-brief)">.*?<\/script>\n/g, '')
  .replace(/<script src=/g, '<script defer src=')
  .replace(/<script>\n'use strict';[\s\S]*?<\/script>/, '<script defer src="../../catalog-app.js"></script>');
if (/__[A-Z0-9_]+__/.test(shell)) throw new Error('Unreplaced build marker in public shell');
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'index.html'), replaceOnce(home, '</main>', catalogAwardDirectory(data) + '</main>'));
writeFileSync(join(dist, 'catalog-app.js'), publicRuntime);
writeFileSync(join(dist, 'site.css'), css);
for (const type of ['work', 'author', 'award']) rmSync(join(dist, type), { recursive: true, force: true });
const pages = writePublicPages(dist, shell, data, readTable(src));
if (data.covers.length) cpSync(cdir, join(dist, 'covers'), { recursive: true });
console.log('dist/web:', pages, 'catalog pages,', data.aw.length, 'award results,', data.covers.length, 'covers');
