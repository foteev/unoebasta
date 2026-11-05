// Real-browser checks and screenshots; run after npm run build with Playwright installed.
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { resolve, join, extname } = require('node:path');
const assert = require('node:assert/strict');
const { filterOption, selectFilter } = require('./filter-helpers.cjs');

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
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.addInitScript(() => {
      if (sessionStorage.getItem('fixture-started')) return;
      sessionStorage.setItem('fixture-started', '1');
      localStorage.setItem('fantastic-prefs', JSON.stringify({ lang: 'ru' }));
    });
    const url = `http://127.0.0.1:${server.address().port}/`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('#tab-shelf').click();
    await page.waitForFunction(() => document.querySelectorAll('#view-shelf > details').length === 9);
    assert.equal(await page.locator('#view-shelf > details[open]').count(), 0, 'Shelf starts collapsed');
    await page.screenshot({ path: join(out, 'shelf-390-collapsed.png'), fullPage: true, animations: 'disabled' });
    await page.locator('#shelf-langs summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#shelf-langs').getAttribute('open'), '', 'Keyboard opens native details');
    assert.equal(await page.locator('[data-mylang="es"]').getAttribute('aria-pressed'), 'true');
    for (const lang of ['en', 'pl', 'ru']) {
      await page.locator(`[data-mylang="${lang}"]`).click();
      await page.waitForFunction(lang => document.querySelector(`[data-mylang="${lang}"]`).getAttribute('aria-pressed') === 'false', lang);
    }
    assert.equal(await page.evaluate(() => prefs.langs), undefined, 'Draft has not changed saved preferences');
    await page.locator('#langs-save').click();
    await page.waitForFunction(() => JSON.stringify(prefs.langs) === '["es"]');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#picks-languages'));
    assert.deepEqual(await page.evaluate(() => prefs.langs), ['es'], 'Saved choice survives a real reload');
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('#view-catalog [data-picks=reading] .pick a[data-via="read"]')].every(a =>
      READ[a.dataset.track].links.some(l => l.kind === 'full' && (l.lang || 'en') === 'es' && l.url === a.href))), 'Every suggested full text is in Spanish');
    await page.screenshot({ path: join(out, 'read-390-spanish.png'), fullPage: true, animations: 'disabled' });
    await page.evaluate(() => {
      window.__readBeforeFallback = JSON.parse(JSON.stringify(READ));
      for (const r of Object.values(READ)) r.links = r.links.filter(l => l.lang !== 'es');
      renderHome();
    });
    assert.equal(await page.locator('#view-catalog [data-picks=reading] .pick').count(), 0, 'No English fallback when Spanish full texts are unavailable');
    assert.ok(await page.locator('#view-catalog .home-excerpts a').count(), 'Spanish excerpt is offered');
    await page.evaluate(() => { Object.assign(READ, window.__readBeforeFallback); delete window.__readBeforeFallback; renderHome(); });
    // Reported phone case: Polish alone, then a Spanish interface, with the long-duration bucket selected.
    await page.locator('#tab-shelf').click();
    await page.locator('#shelf-langs summary').click();
    await page.locator('[data-mylang="pl"]').click();
    await page.locator('[data-mylang="es"]').click();
    await page.locator('#langs-save').click();
    await page.waitForFunction(() => JSON.stringify(prefs.langs) === '["pl"]');
    await page.locator('#tab-catalog').click();
    await selectFilter(page, 'home-lengths', []);
    const primaryActions=page.locator('[data-pick-actions="full"]');
    assert.equal(await page.locator('[data-picks="reading"] .pick').count(),3);
    assert.equal(await primaryActions.locator('a').count(),1);
    assert.equal(await primaryActions.locator('button').isEnabled(),true);
    const pickIds=()=>page.locator('[data-picks="reading"] [data-done]').evaluateAll(els=>els.map(el=>el.dataset.done));
    const beforeThree=await pickIds();await primaryActions.locator('button').click();
    assert.notDeepEqual(await pickIds(),beforeThree);
    assert.deepEqual((await pickIds()).sort(),beforeThree.sort());
    assert.ok(await page.evaluate(()=>document.querySelector('[data-pick-actions="full"]').getBoundingClientRect().top<document.querySelector('[data-picks="reading"]').getBoundingClientRect().top));
    for(const width of [360,390]) for(const theme of ['light','dark']) {
      await page.setViewportSize({width,height:width===360?740:844});
      await page.locator('#lang-sel').selectOption('ru');
      await page.evaluate(theme=>{prefs.theme=theme;savePrefs();applyTheme();window.scrollTo(0,0);},theme);
      assert.ok(await primaryActions.locator('.btn').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height>=44)));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await primaryActions.locator('button').focus();await page.keyboard.press('Enter');
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:join(out,`home-actions-${width}-${theme}.png`),animations:'disabled'});
    }
    await selectFilter(page, 'home-lengths', ['eve']);
    await page.waitForSelector('#view-catalog [data-picks=reading] .pick a[data-via="listen"]');
    assert.equal(await page.locator('#view-catalog [data-picks=reading] .pick a[data-via="read"]').count(),0);
    assert.equal(await page.locator('#view-catalog [data-picks=reading] .pick [data-eleven]').count(),0);
    assert.equal(await page.locator('#view-catalog [data-picks=other] .pick[data-reading-lang="en"]').count(),3);
    assert.equal(await page.locator('#view-catalog [data-picks=other] .pick a[data-via="read"]').count(),3);
    assert.match(await page.locator('#view-catalog [data-picks=reading] .pick a[data-via="listen"]').getAttribute('href'),/podcasts\.apple\.com/);
    assert.equal(await page.evaluate(() => readingMinutes('Q6271990')),106);
    assert.equal(await primaryActions.locator('button').isDisabled(),true);
    assert.match(await primaryActions.locator('a').getAttribute('href'),/podcasts\.apple\.com/);
    const fallbackActions=page.locator('[data-pick-actions="other"]');
    assert.equal(await fallbackActions.locator('button').isEnabled(),true);
    const fallbackChoice=await fallbackActions.locator('a').getAttribute('href');
    assert.ok(await fallbackActions.locator('a').evaluate((el,href)=>READ[el.dataset.track].links.some(l=>l.kind==='full'&&(l.lang||'en')==='en'&&l.url===href),fallbackChoice));

    for(const width of [360,390]) for(const theme of ['light','dark']) {
      await page.setViewportSize({width,height:width===360?740:844});
      const lang = width === 360 ? 'pl' : 'es';
      await page.locator('#lang-sel').selectOption(lang);
      await page.waitForFunction(lang => document.documentElement.lang === lang && document.querySelector('#view-catalog [data-picks=reading] .pick-t')?.textContent === 'Piaseczniki', lang);
      await page.evaluate(theme => { prefs.theme=theme; savePrefs(); applyTheme(); },theme);
      assert.deepEqual(await page.evaluate(() => myLangs()),['pl']);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({path:join(out,`reading-pl-${lang}-${width}-${theme}.png`),fullPage:true,animations:'disabled'});
    }
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('#view-catalog [data-picks=reading] .pick a[data-via="listen"]');
    assert.deepEqual(await page.evaluate(() => prefs.langs),['pl']);
    assert.deepEqual(await page.evaluate(() => prefs.pickLengths),['eve']);
    await page.evaluate(() => {
      window.__polishRead = JSON.parse(JSON.stringify(READ));
      READ.Q6271990.links = READ.Q6271990.links.filter(l => l.lang !== 'pl');
      renderHome();
    });
    assert.equal(await page.locator('#view-catalog [data-picks=reading] .pick').count(),0);
    assert.equal(await page.locator('[data-pickavailable="15"]').count(),1);
    assert.equal(await page.locator('[data-pickavailable="40"]').count(),1);
    const firstExcerpts = await page.locator('[data-excerpt]').evaluateAll(els => els.map(el => el.dataset.excerpt));
    await page.locator('[data-pickmore="excerpt"]').click();
    const nextExcerpts = await page.locator('[data-excerpt]').evaluateAll(els => els.map(el => el.dataset.excerpt));
    assert.equal(nextExcerpts.length,3); assert.ok(nextExcerpts.every(q => !firstExcerpts.includes(q)));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:join(out,'reading-pl-fallback-390-dark.png'),fullPage:true,animations:'disabled'});
    await page.locator('[data-pickavailable="40"]').click();
    await page.waitForSelector('#view-catalog [data-picks=reading] .pick a[data-via="read"]');
    assert.match(await page.locator('#view-catalog [data-picks=reading] .pick a[data-via="read"]').getAttribute('href'),/legimi\.pl/);
    assert.match(await page.locator('#view-catalog [data-picks=reading] .pick-t').textContent(),/^Kupiec/);
    assert.equal(await page.locator('#view-catalog [data-picks=reading] .pick a[data-via="listen"]').count(),0);
    await page.evaluate(() => { Object.assign(READ,window.__polishRead); delete window.__polishRead; prefs.langs=['es']; prefs.pickLengths=['15']; savePrefs(); renderHome(); });
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
    await page.locator('#shelf-langs summary').click();
    assert.equal(await page.locator('#langs-reset').textContent(), 'Use automatic languages');
    await page.locator('#langs-reset').click();
    const status = page.locator('#toast[role="status"]');
    await status.waitFor({ state: 'visible' });
    assert.equal(await status.textContent(), 'Automatic reading languages are active. Using English.');
    assert.equal(await page.locator('#shelf-langs [data-mylang="es"]').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('#shelf-langs [data-mylang="en"]').getAttribute('aria-pressed'), 'true');
    await status.evaluate(el => { el.hidden = true; });
    await page.locator('#langs-reset').click();
    await status.waitFor({ state: 'visible' });
    assert.equal(await status.textContent(), 'Automatic reading languages are active. Using English.', 'An unchanged selection still gets visible feedback');
    assert.equal(await page.locator('#langs-reset').evaluate(el => el === document.activeElement), true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#lang-sel').selectOption('es');
    await page.waitForFunction(() => document.querySelector('#shelf-lang-mode').textContent.includes('español'));
    await page.locator('#langs-reset').click();
    await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('español'));
    assert.equal(await page.locator('#shelf-langs [data-mylang="es"]').getAttribute('aria-pressed'), 'true');
    await page.reload();
    await page.locator('#tab-shelf').click();
    await page.waitForSelector('#shelf-lang-mode', { state: 'attached' });
    assert.deepEqual(await page.evaluate(() => myLangs()), ['es', 'en'], 'Automatic languages use the Spanish interface and survive reload');
    await page.setViewportSize({ width: 1280, height: 900 });
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
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(async () => {
      // Reported desktop setup, with Spanish missing from the browser's preferences.
      Object.defineProperty(navigator, 'languages', { value: ['en-US', 'pl-PL', 'ru-RU'] });
      LANG = 'en';
      Object.assign(prefs, { lang: 'en', langs: [], theme: 'dark', listen: 'eleven', rsize: 25, pickLengths: ['eve'] });
      filter.langs = ['pl'];
      AV.langs = ['ru'];
      saveAV();
      await Store.put(META, { id: 'backup:fixture', data: { prefs: { langs: ['pl'] } } });
      localStorage.setItem('unrelated-app', 'keep this');
      await renderShelf();
    });
    await page.locator('#shelf-langs summary').click();
    assert.equal(await page.locator('[data-mylang="es"]').getAttribute('aria-pressed'), 'false', 'The old automatic mode reproduces the report');

    const beforeFailure = await page.evaluate(() => readAllData());
    await page.evaluate(() => {
      const remove = indexedDB.deleteDatabase.bind(indexedDB);
      window.restoreDeleteDatabase = () => { indexedDB.deleteDatabase = remove; };
      indexedDB.deleteDatabase = () => { throw new DOMException('Test failure', 'UnknownError'); };
    });
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#shelf-danger [data-shelfclear]').click();
    await page.waitForFunction(() => document.querySelector('#toast').textContent === t('shelf_delete_failed'));
    await page.evaluate(() => window.restoreDeleteDatabase());
    assert.deepEqual(await page.evaluate(() => readAllData()), beforeFailure, 'A failed database deletion keeps records and preferences');

    const peer = await context.newPage();
    await peer.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await peer.goto(url, { waitUntil: 'domcontentloaded' });
    await peer.evaluate(() => new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME);
      req.onsuccess = () => { window.heldConnection = req.result; resolve(); };
      req.onerror = () => reject(req.error);
    }));
    await page.evaluate(() => {
      saveSync({ key: 'fixture-key' });
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'languages', { value: ['en-US', 'pl-PL', 'ru-RU'] });
      window.storageBeforeStartup = ['fantastic-prefs', 'fantastic-visit', 'fantastic-sync'].map(key => localStorage.getItem(key));
    });
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#shelf-danger [data-shelfclear]').click();
    await page.waitForFunction(() => document.querySelector('#toast').textContent === t('shelf_reset_blocked'));
    assert.equal(await page.evaluate(() => syncState()), null, 'Sync is paused while the reset waits for another tab');
    const stale = await page.evaluate(() => syncMerge({ r: { links: [{ id: 'Q190192', url: 'https://example.test/stale', mt: Date.now() }] } }));
    assert.equal(stale, 0, 'A stale sync response cannot write while resetting');
    await peer.evaluate(() => window.heldConnection.close());
    await page.waitForFunction(() => window.storageBeforeStartup && typeof myLangs === 'function');
    assert.deepEqual(await page.evaluate(() => window.storageBeforeStartup), [null, null, null]);
    await page.waitForFunction(async () => Boolean(await Store.get(META, 'schema')));
    assert.ok(await page.evaluate(async () => {
      const allEmpty = (await Promise.all(STORES.map(s => Store.all(s)))).every(records => records.length === 0);
      const meta = await Store.all(META);
      return allEmpty && meta.length === 1 && meta[0].id === 'schema'
        && !syncState() && !shelfDeleted && !shelfLangDirty && VISIT.firstTime
        && LANG === 'en' && !prefs.theme && prefs.rsize === 19 && !prefs.listen
        && !homeLengths().length && !filter.langs.length && !AV.langs.length
        && localStorage.getItem('unrelated-app') === 'keep this';
    }), 'A new visit has no old data, settings, backups, tombstones, sync or Undo');
    await peer.waitForFunction(() => typeof myLangs === 'function' && !resetting && prefs.langs === undefined && !syncState());
    await peer.close();

    await page.locator('#tab-shelf').click();
    await page.locator('#shelf-langs summary').click();
    assert.deepEqual(await page.evaluate(() => myLangs().sort()), ['en', 'es', 'pl', 'ru']);
    assert.equal(await page.locator('[data-mylang="es"]').getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('#shelf-lang-mode').textContent(), /All reading languages.*Spanish/);
    assert.ok(await page.evaluate(() => pickList([]).some(q => fullLink(q, ['es']))), 'Spanish sources are eligible in Read');
    assert.equal(await page.locator('#toast [data-shelfundo]').count(), 0);
    await page.screenshot({ path: join(out, 'shelf-reset-all-languages.png'), fullPage: true, animations: 'disabled' });

    await page.locator('#langs-reset').click();
    await page.waitForFunction(() => prefs.langs?.length === 0 && !myLangs().includes('es'));
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#shelf-danger [data-shelfclear]').click();
    await page.waitForFunction(() => window.storageBeforeStartup?.every(value => value === null) && typeof myLangs === 'function' && prefs.langs === undefined);
    assert.ok(await page.evaluate(() => myLangs().includes('es')), 'Delete everything also resets an already empty shelf');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    const report = { language_save_and_reload: true, no_english_fallback: true, polish_audio_and_duration: true, interface_language_independent: true, rotating_excerpts: true, home_random_actions: true, small_pool_shuffle: true, available_duration_action: true, collapse_keyboard: true, deletion_and_undo: true, automatic_language_feedback: true, factory_reset: true, spanish_after_reset: true, empty_shelf_reset: true, stale_sync_blocked: true, other_tab_reloaded: true, layouts, errors };
    writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
  } finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exit(1); });
