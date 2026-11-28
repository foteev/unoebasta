// Real-browser coverage for the same award scope in Board, By year and By category.
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { resolve, join, extname, sep } = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { filterOption, selectFilter, openLangMenu, siteLang, readLang } = require('./filter-helpers.cjs');

(async () => {
  const root = resolve(__dirname, '../dist/web'), out = resolve(__dirname, '../.cache/mobile-shelf');
  mkdirSync(out, { recursive: true });
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try {
      const path = pathname.endsWith('/') ? join(file, 'index.html') : file;
      res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml' })[extname(path)] || 'application/octet-stream');
      res.end(readFileSync(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, locale: 'en-US' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const url = `http://127.0.0.1:${server.address().port}/`;
    const broken = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await broken.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await broken.route('**/catalog-app.js*', route => route.abort());
    await broken.goto(url, { waitUntil: 'load' });
    await broken.waitForFunction(() => !document.documentElement.classList.contains('ub-boot'), null, { timeout: 5000 });
    assert.ok(await broken.locator('#catalog-summary').isVisible(), 'Summary visible when app script fails');
    assert.ok(await broken.locator('#award-directory a').first().isVisible(), 'Award links visible when app script fails');
    assert.equal(await broken.evaluate(() => getComputedStyle(document.getElementById('catalog-summary')).paddingBottom), '20px');
    assert.equal(await broken.evaluate(() => getComputedStyle(document.getElementById('award-directory')).paddingTop), '0px');
    await broken.close();

    const syntax = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await syntax.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await syntax.route('**/catalog-app.js*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: 'const broken = {;' }));
    await syntax.goto(url, { waitUntil: 'load' });
    await syntax.waitForFunction(() => !document.documentElement.classList.contains('ub-boot'), null, { timeout: 5000 });
    assert.ok(await syntax.locator('#award-directory a').first().isVisible(), 'Award links visible after a parse error');
    await syntax.close();

    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const np = await nojs.newPage();
    await np.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await np.goto(url, { waitUntil: 'load' });
    assert.ok(await np.locator('#catalog-summary').isVisible());
    await Promise.all([
      np.waitForURL(/\/award\/[a-z-]+-[A-Z]{3}\/$/),
      np.locator('#award-directory a').first().click(),
    ]);
    assert.ok(await np.locator('main a[href*="work/"]').count() > 0, 'Award page links to works without JS');
    await nojs.close();

    const portable = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const portableErrors = []; portable.on('pageerror', e => portableErrors.push(e.message));
    await portable.route(/^https?:\/\//, route => route.abort());
    await portable.goto(pathToFileURL(resolve(__dirname, '../dist/unoebasta.html')).href, { waitUntil: 'load' });
    await portable.locator('#tab-library').click();
    await portable.waitForSelector('#view-library .slip');
    assert.ok(await portable.locator('#view-library .cover-t').count() > 0, 'Typographic covers render');
    assert.equal(await portable.locator('img[src*="covers/"]').count(), 0, 'No dist/web-only cover images');
    assert.equal(await portable.locator('a[href^="./work/"], a[href^="./author/"], a[href^="./award/"]').count(), 0);
    assert.equal(await portable.locator('#fatal').count(), 0, 'No fatal error line');
    assert.deepEqual(portableErrors, []);
    await portable.close();

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('catalog-summary')).paddingBottom), '20px');
    await page.locator('#tab-awards').click();
    await selectFilter(page, 'av-languages', []);
    await selectFilter(page, 'av-awards', []);
    await page.locator('[data-av-mode="table"]').click();
    await page.waitForSelector('table.board .award-meta');
    assert.equal(await filterOption(page, 'av-awards', 'all').isChecked(), true);
    const entries = await page.locator('table.board .cell').count();
    assert.ok(entries > 500, 'All-awards board contains the combined corpus');
    assert.ok(await page.locator('table.board .award-meta').evaluateAll(xs => ['Hugo', 'Nebula', 'Locus', 'World Fantasy Award'].every(a => xs.some(x => x.textContent.includes(a)))));
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { prefs.theme = theme; savePrefs(); applyTheme(); window.scrollTo(0, 0); }, theme);
      await page.screenshot({ path: join(out, `awards-board-${theme}.png`), animations: 'disabled' });
    }
    await page.locator('table.board [data-av-year="2024"]').click();
    assert.equal(await page.locator('#av-body .yearsec h3').count(), 4, 'Year drilldown includes all four awards');
    await page.locator('[data-av-clear]').click();
    assert.equal(await page.locator('table.board .cell').count(), entries, 'Return preserves combined board');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#tab-awards').click();
    await page.waitForSelector('table.board .award-meta');
    assert.equal(await filterOption(page, 'av-awards', 'all').isChecked(), true, 'All + Board survives reload');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => !document.querySelector('table.board'));
    assert.equal(await page.evaluate(() => AV.awards.length === 0 && AV.mode === 'table'), true, 'Phone does not discard desktop preference');
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.waitForSelector('table.board .award-meta');
    assert.equal(await page.locator('table.board .cell').count(), entries, 'Returning to desktop restores all awards');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => !document.querySelector('table.board'));
    for (const lang of ['en', 'es', 'pl', 'ru']) {
      await siteLang(page, lang);
      await page.waitForFunction(lang => document.documentElement.lang === lang, lang);
      assert.equal(await filterOption(page, 'av-awards', 'all').isChecked(), true);
    }
    const layouts = [];
    for (const width of [360, 390]) for (const theme of ['light', 'dark']) for (const mode of ['cats', 'years']) {
      await page.setViewportSize({ width, height: width === 360 ? 740 : 844 });
      await page.evaluate(theme => { prefs.theme = theme; savePrefs(); applyTheme(); }, theme);
      await page.locator(`[data-av-mode="${mode}"]`).click();
      await page.evaluate(() => window.scrollTo(0, 0));
      const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
        minTarget: Math.min(...[...document.querySelectorAll('#av-head .seg button, #av-head [data-av-cat]')].map(x => x.getBoundingClientRect().height)) }));
      assert.ok(layout.scroll <= width + 1, 'No page overflow');
      assert.ok(layout.minTarget >= 44, 'Award/category/mode controls are touch-sized');
      assert.equal(await page.locator('table.board').count(), 0, 'Phone has a list instead of a wide table');
      assert.equal(await filterOption(page, 'av-awards', 'all').isChecked(), true);
      layouts.push({ ...layout, theme, mode });
      await page.screenshot({ path: join(out, `awards-${mode}-${width}-${theme}.png`), animations: 'disabled' });
    }
    await page.setViewportSize({ width: 360, height: 740 });
    await selectFilter(page, 'av-awards', ['wfa']);
    await page.locator('[data-av-mode="cats"]').click();
    assert.equal(await page.locator('#av-body .yrow').count(), 162);
    assert.equal(await page.locator('#av-body [data-work="T3406511"]').count(), 1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: join(out, 'world-fantasy-award-360.png'), animations: 'disabled' });
    await page.addStyleTag({ content: 'html { font-size: 130% !important; }' });
    await page.setViewportSize({ width: 740, height: 360 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Landscape at enlarged font size fits');
    assert.deepEqual(errors, [], 'No browser errors');
    const report = { combined_board_entries: entries, all_modes_preserve_scope: true, resize_and_reload: true, layouts, errors };
    writeFileSync(join(out, 'awards-report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
  } finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exit(1); });
