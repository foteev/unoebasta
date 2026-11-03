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
    await page.context().grantPermissions(['clipboard-read','clipboard-write']);
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#tab-about').click();
    await page.locator('#about-contribute [data-agent-task]').click();
    const batch=await page.evaluate(()=>navigator.clipboard.readText());
    const snapshot=text=>JSON.parse(text.split('PUBLIC CATALOG SNAPSHOT (refresh main before submitting):\n')[1]);
    assert.equal(snapshot(batch).length,5);assert.equal(new Set(snapshot(batch).map(w=>w.qid)).size,5);
    assert.match(batch,/data\/found/);assert.match(batch,/coverage.csv/);
    await page.evaluate(()=>openWork('Q19947428'));
    await page.locator('#sheet-work [data-agent-task]').click();
    const single=await page.evaluate(()=>navigator.clipboard.readText());
    assert.equal(snapshot(single).length,1);assert.equal(snapshot(single)[0].qid,'Q19947428');
    await page.evaluate(()=>closeSheets());
    await page.locator('#tab-awards').click();
    await page.locator('[data-av-award="all"]').click();
    await page.locator('[data-av-cat="all"]').click();
    const total=await page.locator('#av-body .yrow').count();assert.ok(total>500);
    await page.locator('[data-av-mode="authors"]').click();
    await page.locator('#av-body [data-author="Q314553"]').click();
    await page.waitForSelector('#sheet-author h2');assert.match(await page.locator('#sheet-author h2').textContent(),/Silverberg/);
    await page.evaluate(()=>closeSheets());
    const layouts=[];
    for(const width of [360,390]) for(const theme of ['light','dark']){
      await page.setViewportSize({width,height:width===360?740:844});
      await page.evaluate(theme=>{prefs.theme=theme;savePrefs();applyTheme();},theme);
      await page.locator('#lang-sel').selectOption('ru');
      for(const mode of ['cats','authors']){
        await page.locator(`[data-av-mode="${mode}"]`).click();await page.evaluate(()=>window.scrollTo(0,0));
        const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,min:Math.min(...[...document.querySelectorAll('#av-head .seg button,#av-head [data-av-cat]')].map(b=>b.getBoundingClientRect().height))}));
        assert.ok(layout.scroll<=width+1);assert.ok(layout.min>=44);layouts.push({...layout,theme,mode});
        assert.equal(await page.locator('[data-av-cat="all"]').getAttribute('aria-pressed'),'true');
        await page.screenshot({path:join(out,`community-${mode}-${width}-${theme}.png`),animations:'disabled'});
      }
    }
    await page.locator('#tab-about').click();
    await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw new Error('denied')}});
    await page.locator('#about-contribute [data-agent-task]').click();
    await page.waitForSelector('#agent-dialog textarea');assert.equal(snapshot(await page.locator('#agent-task-text').inputValue()).length,5);
    const overflow=await page.locator('#agent-dialog .modal-card').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(overflow,false);
    await page.screenshot({path:join(out,'community-copy-fallback-390-dark.png'),animations:'disabled'});
    await page.keyboard.press('Escape');assert.equal(await page.locator('#agent-dialog').isVisible(),false);
    for(const lang of ['en','es','pl','ru']){
      await page.locator('#lang-sel').selectOption(lang);assert.ok(await page.locator('#about-contribute [data-agent-task]').textContent());
    }
    assert.deepEqual(errors,[]);
    const report={batch_copy:true,one_work_copy:true,clipboard_fallback:true,all_categories:total,author_cards:true,layouts,errors};
    writeFileSync(join(out,'community-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  } finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
