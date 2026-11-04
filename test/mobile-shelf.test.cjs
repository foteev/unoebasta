// Real-browser checks and screenshots; run after npm run build with Playwright installed.
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
    try { const path = file === root ? join(root, 'index.html') : file;
      res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml' })[extname(path)] || 'application/octet-stream');
      res.end(readFileSync(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.addInitScript(() => { if (!localStorage.getItem('fantastic-prefs')) localStorage.setItem('fantastic-prefs', JSON.stringify({ lang: 'ru' })); });
    const url = `http://127.0.0.1:${server.address().port}/`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('#tab-shelf').click();
    await page.waitForFunction(() => document.querySelectorAll('#view-shelf > details').length === 9);
    assert.equal(await page.locator('#view-shelf > details[open]').count(), 0, 'Shelf starts collapsed');
    await page.screenshot({ path: join(out, 'shelf-390-collapsed.png'), fullPage: true, animations: 'disabled' });
    await page.locator('#shelf-langs summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#shelf-langs').getAttribute('open'), '', 'Keyboard opens native details');
    for (const lang of ['es', 'en', 'ru']) {
      await page.locator(`[data-mylang="${lang}"]`).click();
      await page.waitForFunction(lang => document.querySelector(`[data-mylang="${lang}"]`).getAttribute('aria-pressed') === (lang === 'es' ? 'true' : 'false'), lang);
    }
    assert.equal(await page.evaluate(() => prefs.langs), undefined, 'Draft has not changed saved preferences');
    await page.locator('#langs-save').click();
    await page.waitForFunction(() => JSON.stringify(prefs.langs) === '["es"]');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#picks-languages'));
    assert.deepEqual(await page.evaluate(() => prefs.langs), ['es'], 'Saved choice survives a real reload');
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('#view-catalog .pick a[data-track]')].every(a =>
      READ[a.dataset.track].links.some(l => l.kind === 'full' && (l.lang || 'en') === 'es' && l.url === a.href))), 'Every suggested full text is in Spanish');
    await page.screenshot({ path: join(out, 'read-390-spanish.png'), fullPage: true, animations: 'disabled' });
    await page.evaluate(() => {
      window.__readBeforeFallback = JSON.parse(JSON.stringify(READ));
      for (const r of Object.values(READ)) r.links = r.links.filter(l => l.kind !== 'full' || l.lang !== 'es');
      renderHome();
    });
    assert.equal(await page.locator('#view-catalog .pick').count(), 0, 'No English fallback when Spanish full texts are unavailable');
    assert.ok(await page.locator('#view-catalog .home-excerpts a').count(), 'Spanish excerpt is offered');
    await page.evaluate(() => { Object.assign(READ, window.__readBeforeFallback); delete window.__readBeforeFallback; renderHome(); });
    await page.evaluate(async () => {
      await Store.put('files', { id: 'qa-file', title: 'Тестовая книга с длинным названием для проверки мобильной полки', byline: 'Тестовый автор', format: 'txt', words: 100, size: 42, html: '<p>QA file body.</p>', at: Date.now() });
      await Store.put('bookmarks', { id: 'w:Q25349436', type: 'work', workId: 'Q25349436', at: Date.now() });
      await Store.put('links', { id: 'Q190192', url: 'https://example.test/my-book', note: 'Проверка удаления личной ссылки', at: Date.now() });
      await Store.put('suggestions', { id: 'qa-comment', kind: 'feedback', workId: 'Q190192', comment: 'Исходный текст комментария сохраняется.', sent: Date.now(), at: Date.now() });
    });
    await page.locator('#tab-shelf').click();
    await page.waitForFunction(() => document.querySelector('#shelf-files [data-delfile]'));
    for (const lang of ['en', 'es', 'pl', 'ru']) {
      await page.locator('#lang-sel').selectOption(lang);
      await page.waitForFunction(lang => document.documentElement.lang === lang && document.querySelector('#sugg-clear-all').textContent.trim() === I18N[lang].shelf_delete_all, lang);
      assert.equal(await page.locator('#shelf-sugg .snip').textContent(), 'Исходный текст комментария сохраняется.', 'Saved feedback is preserved across language switches');
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator('#lang-en').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en' && document.querySelector('#sugg-clear-all').textContent.trim() === 'Delete all');
    await page.evaluate(() => { for (const el of document.querySelectorAll('#view-shelf > details')) el.open = el.id === 'shelf-sugg'; });
    await page.screenshot({ path: join(out, 'shelf-desktop-danger.png'), fullPage: true, animations: 'disabled' });
    await page.locator('#lang-ru').click();
    await page.waitForFunction(() => document.documentElement.lang === 'ru');
    const layouts = [];
    for (const width of [360, 390]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: width === 360 ? 740 : 844 });
      await page.evaluate(theme => { prefs.theme = theme; savePrefs(); applyTheme(); }, theme);
      await page.evaluate(() => { for (const id of ['shelf-files', 'shelf-langs', 'shelf-links', 'shelf-sugg']) document.getElementById(id).open = true; });
      const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
        summaryMin: Math.min(...[...document.querySelectorAll('#view-shelf summary')].map(el => el.getBoundingClientRect().height)) }));
      assert.ok(layout.scroll <= layout.width + 1, `No horizontal overflow at ${width}px (${theme})`);
      assert.ok(await page.evaluate(() => getComputedStyle(document.getElementById('shelf-danger')).borderTopColor !== getComputedStyle(document.getElementById('shelf-data')).borderTopColor), 'Global danger border is distinct from ordinary panels');
      assert.ok(layout.summaryMin >= 44, 'Summary touch targets are at least 44px'); layouts.push({ theme, ...layout });
      await page.screenshot({ path: join(out, `shelf-${width}-${theme}.png`), fullPage: true, animations: 'disabled' });
    }
    await page.locator('#shelf-links [data-shelfdel]').click();
    await page.waitForFunction(() => !local.links.length);
    assert.ok(await page.evaluate(async () => (await Store.all('tombs')).some(x => x.id === 'links|Q190192')), 'Delete leaves a sync deletion mark');
    await page.locator('#toast [data-shelfundo]').click(); await page.waitForFunction(() => local.links.length === 1);
    await page.evaluate(() => { for (const el of document.querySelectorAll('#view-shelf > details')) el.open = false; });
    assert.equal(await page.evaluate(() => document.querySelector('#view-shelf').lastElementChild.id), 'shelf-danger', 'Global danger zone stays at the bottom');
    assert.equal(await page.locator('#shelf-danger').evaluate(el => !!el.closest('details')), false, 'Global deletion is not hidden in a collapsed panel');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#shelf-danger [data-shelfclear]').click(); await page.waitForFunction(() => !local.files.length && !local.links.length);
    await page.locator('#toast [data-shelfundo]').click(); await page.waitForFunction(() => local.files.length === 1);
    assert.equal(await page.evaluate(() => local.files[0].html), '<p>QA file body.</p>', 'Undo preserves file contents');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    const report = { language_save_and_reload: true, no_english_fallback: true, collapse_keyboard: true, deletion_and_undo: true, layouts, errors };
    writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
  } finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exit(1); });
