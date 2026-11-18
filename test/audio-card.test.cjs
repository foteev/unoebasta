// Real-browser coverage for reading and listening sources on the work card.
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { resolve, join, extname } = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const root = resolve(__dirname, '../dist/web'), out = resolve(__dirname, '../.cache/mobile-shelf');
  mkdirSync(out, { recursive: true });
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/unoebasta(?=\/)/, '');
    const file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    try {
      const path = pathname.endsWith('/') ? join(file, 'index.html') : file;
      res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml' })[extname(path)] || 'application/octet-stream');
      res.end(readFileSync(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'], ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    const context = await browser.newContext({ viewport: { width: 1280, height: 1100 }, locale: 'en-US' });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const url = `http://127.0.0.1:${server.address().port}/`;
    await context.addInitScript(() => {
      if (!localStorage.getItem('fantastic-prefs')) localStorage.setItem('fantastic-prefs', JSON.stringify({lang: 'ru', langs: ['ru']}));
      window.addEventListener('pageshow', event => { window.restoredFromHistory = event.persisted; });
    });
    await page.goto(url, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => typeof Store !== 'undefined');
    await page.evaluate(() => openWork('Q19947428'));
    await page.waitForSelector('#sheet-work .src-audio');
    assert.equal(await page.locator('#sheet-work h2').textContent(), 'Раз солдат, два солдат...');
    // one list of sources: the Russian text and the Russian recording, each marked with its language
    assert.equal(await page.locator('#sheet-work .src-text:not(.src-ex) .src-l').first().textContent(), 'RU');
    assert.equal(await page.locator('#sheet-work .src-audio .src-l').first().textContent(), 'RU');
    assert.equal(await page.locator('#sheet-work a[href="https://flibusta.info/b/404336/read"]').count(),1);
    assert.equal(await page.locator('#about-slot a[href="https://fantlab.ru/work22792"]').count(),1);
    assert.equal(await page.locator('#sheet-work a.src-audio[href="https://www.youtube.com/watch?v=det3gpWwLWI"]').count(),1);
    assert.equal(await page.locator('#sheet-work a.src-audio[href="https://www.youtube.com/watch?v=det3gpWwLWI"] .src-w').count(),1);
    const layouts=[];
    for(const width of [360,390]) for(const theme of ['light','dark']) {
      await page.setViewportSize({width,height:width===360?740:844});
      await page.evaluate(theme=>{prefs.theme=theme;savePrefs();applyTheme();},theme);
      await page.locator('#sheet-work h2').scrollIntoViewIfNeeded();
      const info=await page.locator('#sheet-work').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));
      assert.ok(info.scroll<=info.width+1, 'Work card has no horizontal overflow');
      layouts.push({width,theme,...info});
      await page.screenshot({path:join(out,`audio-card-${width}-${theme}.png`),fullPage:true,animations:'disabled'});
      await page.locator('#sheet-work .src-audio').first().scrollIntoViewIfNeeded();
      await page.screenshot({path:join(out,`audio-links-${width}-${theme}.png`),animations:'disabled'});
    }
    const recordings=await page.evaluate(()=>Object.values(READ).flatMap(r=>r.links).filter(l=>l.tier==='external'&&l.kind==='audio'));
    assert.ok(recordings.length>=6); assert.ok(recordings.every(l=>l.rights==='unknown'&&l.verification==='metadata'));
    await page.evaluate(()=>openWork('Q41793715'));
    // an unverified recording: no publisher label, one note under the list
    await page.waitForFunction(()=>!!document.querySelector('#rl-panel .rl-foot') && !document.querySelector('#sheet-work .tier'));
    await page.evaluate(()=>openWork('Q467388'));
    const other = page.locator('#rl-panel .rl-other');
    const summary = other.locator('summary');
    await summary.waitFor();
    assert.equal(await other.locator('.src-list .src').first().isVisible(), false);
    await summary.press('Enter');
    await other.locator('.src-list .src').first().waitFor();
    assert.equal(await other.evaluate(el => el.open), true);
    await page.waitForSelector('#sheet-work .src-ex');
    assert.ok(await page.locator('#sheet-work .src-text:not(.src-ex)').count() >= 2, 'The existing Russian and Polish text sources remain visible');
    assert.equal(await page.locator('#sheet-work .src-text:not(.src-ex)[href^="https://www.legimi.pl/"]').count(),1);
    assert.equal(await page.locator('#sheet-work .src-text[href^="https://lecturia.org/"] .src-w').count(),1);
    assert.equal(await page.locator('#sheet-work .src-text[href^="https://www.legimi.pl/"] .src-w').count(),0);
    assert.equal(await page.locator('#sheet-work a.src-audio[href^="https://akniga.org/"]').count(),1);
    assert.equal(await page.locator('#sheet-work .src-ex[href^="https://libcat.ru/"]').count(),1);
    for(const width of [360,390]) for(const theme of ['light','dark']) {
      await page.setViewportSize({width,height:width===360?740:844});
      await page.evaluate(theme=>{prefs.theme=theme;savePrefs();applyTheme();},theme);
      await summary.scrollIntoViewIfNeeded();
      assert.ok((await summary.boundingBox()).height >= 44);
      assert.ok(await page.locator('#sheet-work').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
      await page.screenshot({path:join(out,`mixed-sources-${width}-${theme}.png`),animations:'disabled'});
    }
    const workPath = await page.evaluate(() => DATA.routes.work.Q467388);
    await page.setViewportSize({width:360,height:740});
    await page.evaluate(() => localStorage.setItem('fantastic-prefs', JSON.stringify({lang: 'pl', langs: ['pl']})));
    await page.goto(url + workPath + 'index.html', {waitUntil:'domcontentloaded'});
    await summary.waitFor();
    assert.match(await summary.textContent(), /^W innych językach \(\d+\)$/);
    assert.ok((await summary.boundingBox()).height >= 44);
    assert.equal(await other.evaluate(el => el.open), false);
    const preferred = await page.locator('#rl-panel > .src-list .src-l').allTextContents();
    assert.ok(preferred.length && preferred.every(lang => lang === 'PL'));
    await page.locator('#rl-panel').scrollIntoViewIfNeeded();
    await page.screenshot({path:join(out,'other-languages-360-collapsed.png'),animations:'disabled'});
    await summary.click();
    assert.ok(await other.locator('.src-list .src').first().isVisible());
    const foreign = await other.locator('.src-list .src-l').allTextContents();
    assert.equal(await summary.textContent(), `W innych językach (${foreign.length})`);
    assert.ok(foreign.every(lang => lang !== 'PL'));
    await summary.evaluate(el => { el.scrollIntoView({block:'start'}); window.scrollBy(0, -100); });
    await page.screenshot({path:join(out,'other-languages-360-expanded.png'),animations:'disabled'});

    const home = await context.newPage();
    home.on('pageerror', e => errors.push(e.message));
    await home.setViewportSize({width:360,height:740});
    await home.goto(url + 'unoebasta/');
    const waitForReadPicks = (tab, lang) => tab.waitForFunction(expected => {
      const picks = [...document.querySelectorAll('#view-catalog [data-picks="reading"] .pick')];
      return picks.length && picks.every(pick => pick.dataset.readingLang === expected);
    }, lang);
    await waitForReadPicks(home, 'pl');
    const change = '#rl-panel [data-langmenu]';
    await page.locator('#own-link').fill('https://example.test/unsaved');
    await page.locator(change).click();
    assert.equal(await page.evaluate(() => document.activeElement.dataset.readlang), 'pl');
    await page.locator('#lang-menu [data-readlang="all"]').click();
    await page.locator('#lang-menu [data-readlang="es"]').click();
    assert.equal(await page.locator('#own-link').inputValue(), 'https://example.test/unsaved');
    assert.equal(await page.locator('#lang-reading').textContent(), 'ES');
    assert.equal(await page.locator('#lang-cur').textContent(), 'PL');
    assert.ok((await page.locator('#rl-panel > .src-list .src-l').allTextContents()).includes('ES'));
    await waitForReadPicks(home, 'es');
    await home.locator('#lang-reading').waitFor({state:'visible'});
    assert.equal(await home.locator('#lang-reading').textContent(), 'ES');
    await page.locator('#lang-menu [data-lang="ru"]').click();
    await home.waitForFunction(() => document.documentElement.lang === 'ru' && document.querySelector('#lang-cur').textContent === 'RU');
    assert.equal(await home.locator('#lang-reading').textContent(), 'ES');
    await home.screenshot({path:join(out,'language-preferences-360.png'),animations:'disabled'});

    await home.locator('#tab-library').click();
    await home.locator('#view-library a[data-work="Q467388"]').first().click();
    await home.locator(change).click();
    await home.locator('#lang-menu [data-readlang="all"]').click();
    await home.locator('#lang-menu [data-readlang="pl"]').click();
    await home.goBack();
    await waitForReadPicks(home, 'pl');
    const restoredFromHistory = await home.evaluate(() => window.restoredFromHistory);
    await home.locator('#lang-btn').click();
    assert.equal(await home.locator('#lang-menu [data-readlang="pl"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await home.locator('#lang-menu [data-readlang="es"]').getAttribute('aria-pressed'), 'false');
    assert.equal(await home.locator('#lang-reading').textContent(), 'PL');

    // A cached page must also re-read saved preferences when it missed the storage event.
    await home.evaluate(() => {
      localStorage.setItem('fantastic-prefs', JSON.stringify({...prefs, lang: 'pl', langs: ['es']}));
      window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
    });
    await waitForReadPicks(home, 'es');
    assert.equal(await home.locator('#lang-cur').textContent(), 'PL');
    assert.equal(await home.locator('#lang-menu [data-readlang="es"]').getAttribute('aria-pressed'), 'true');
    assert.ok(await home.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors,[]);
    const report={external_recordings:recordings.length,sourced_summary:true,language_audio_badge:true,restoredFromHistory,layouts,errors};
    writeFileSync(join(out,'audio-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  } finally { if(browser) await browser.close(); await new Promise(r=>server.close(r)); }
})().catch(e=>{console.error(e);process.exit(1)});
