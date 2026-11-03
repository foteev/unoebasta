// Real-browser coverage for the same award scope in Board, By year and By category.
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { resolve, join, extname } = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const root = resolve(__dirname, '../dist/web'), out = resolve(__dirname, '../.cache/mobile-shelf');
  mkdirSync(out, { recursive: true });
  const server = createServer((req, res) => {
    const file = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (file !== root && !file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    try {
      const path = file === root ? join(root, 'index.html') : file;
      res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml' })[extname(path)] || 'application/octet-stream');
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
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('#tab-awards').click();
    await page.locator('[data-av-award="all"]').click();
    await page.locator('[data-av-mode="table"]').click();
    await page.waitForSelector('table.board .award-meta');
    assert.equal(await page.locator('[data-av-award="all"]').getAttribute('aria-pressed'), 'true');
    const entries = await page.locator('table.board .cell').count();
    assert.ok(entries > 500, 'All-awards board contains the combined corpus');
    assert.ok(await page.locator('table.board .award-meta').evaluateAll(xs => ['Hugo', 'Nebula', 'Locus'].every(a => xs.some(x => x.textContent.includes(a)))));
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { prefs.theme = theme; savePrefs(); applyTheme(); window.scrollTo(0, 0); }, theme);
      await page.screenshot({ path: join(out, `awards-board-${theme}.png`), animations: 'disabled' });
    }
    await page.locator('table.board [data-av-year="2024"]').click();
    assert.equal(await page.locator('#av-body .yearsec h3').count(), 3, 'Year drilldown includes all three awards');
    await page.locator('[data-av-clear]').click();
    assert.equal(await page.locator('table.board .cell').count(), entries, 'Return preserves combined board');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#tab-awards').click();
    await page.waitForSelector('table.board .award-meta');
    assert.equal(await page.locator('[data-av-award="all"]').getAttribute('aria-pressed'), 'true', 'All + Board survives reload');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => !document.querySelector('table.board'));
    assert.equal(await page.evaluate(() => AV.award === 'all' && AV.mode === 'table'), true, 'Phone does not discard desktop preference');
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.waitForSelector('table.board .award-meta');
    assert.equal(await page.locator('table.board .cell').count(), entries, 'Returning to desktop restores all awards');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => !document.querySelector('table.board'));
    for (const lang of ['en', 'es', 'pl', 'ru']) {
      await page.locator('#lang-sel').selectOption(lang);
      await page.waitForFunction(lang => document.documentElement.lang === lang, lang);
      assert.equal(await page.locator('[data-av-award="all"]').getAttribute('aria-pressed'), 'true');
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
      assert.equal(await page.locator('[data-av-award="all"]').getAttribute('aria-pressed'), 'true');
      layouts.push({ ...layout, theme, mode });
      await page.screenshot({ path: join(out, `awards-${mode}-${width}-${theme}.png`), animations: 'disabled' });
    }
    await page.addStyleTag({ content: 'html { font-size: 130% !important; }' });
    await page.setViewportSize({ width: 740, height: 360 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Landscape at enlarged font size fits');
    assert.deepEqual(errors, [], 'No browser errors');
    const report = { combined_board_entries: entries, all_modes_preserve_scope: true, resize_and_reload: true, layouts, errors };
    writeFileSync(join(out, 'awards-report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
  } finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exit(1); });
