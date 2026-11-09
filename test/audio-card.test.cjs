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
    await page.addInitScript(() => localStorage.setItem('fantastic-prefs', JSON.stringify({lang:'ru',langs:['ru']})));
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
    await page.click('#rl-panel [data-rl-lang="all"]');
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
      await page.locator('#sheet-work .src-text').first().scrollIntoViewIfNeeded();
      assert.ok(await page.locator('#sheet-work').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
      await page.screenshot({path:join(out,`mixed-sources-${width}-${theme}.png`),animations:'disabled'});
    }
    assert.deepEqual(errors,[]);
    const report={external_recordings:recordings.length,sourced_summary:true,language_audio_badge:true,layouts,errors};
    writeFileSync(join(out,'audio-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  } finally { if(browser) await browser.close(); await new Promise(r=>server.close(r)); }
})().catch(e=>{console.error(e);process.exit(1)});
