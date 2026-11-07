// Real-browser coverage for contribution tasks, multilingual coverage and author browsing.
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { resolve, join, extname } = require('node:path');
const assert = require('node:assert/strict');
const { filterOption, selectFilter, openLangMenu, siteLang, readLang } = require('./filter-helpers.cjs');

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
    assert.equal(snapshot(batch).length,30);assert.equal(new Set(snapshot(batch).map(w=>w.qid)).size,30);
    assert.match(batch,/data\/found/);assert.match(batch,/coverage.csv/);
    await page.evaluate(()=>openWork('Q19947428'));
    await page.locator('#sheet-work [data-agent-task]').click();
    const single=await page.evaluate(()=>navigator.clipboard.readText());
    assert.equal(snapshot(single).length,1);assert.equal(snapshot(single)[0].qid,'Q19947428');
    await page.evaluate(()=>closeSheets());
    await page.locator('#tab-awards').click();
    await selectFilter(page, 'av-languages', []);
    await selectFilter(page, 'av-awards', []);
    await selectFilter(page, 'av-categories', []);
    const total=await page.locator('#av-body .yrow').count();assert.ok(total>500);
    await page.locator('[data-av-mode="authors"]').click();
    await page.locator('#av-body [data-author="Q314553"]').click();
    await page.waitForSelector('#sheet-author h2');assert.match(await page.locator('#sheet-author h2').textContent(),/Silverberg/);
    await page.evaluate(()=>closeSheets());
    const layouts=[];
    for(const width of [360,390]) for(const theme of ['light','dark']){
      await page.setViewportSize({width,height:width===360?740:844});
      await page.evaluate(theme=>{prefs.theme=theme;savePrefs();applyTheme();},theme);
      await siteLang(page, 'ru');
      for(const mode of ['cats','authors']){
        await page.locator(`[data-av-mode="${mode}"]`).click();await page.evaluate(()=>window.scrollTo(0,0));
        const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,min:Math.min(...[...document.querySelectorAll('#av-head .seg button,#av-head [data-av-cat]')].map(b=>b.getBoundingClientRect().height))}));
        assert.ok(layout.scroll<=width+1);assert.ok(layout.min>=44);layouts.push({...layout,theme,mode});
        assert.equal(await filterOption(page, 'av-categories', 'all').isChecked(),true);
        await page.screenshot({path:join(out,`community-${mode}-${width}-${theme}.png`),animations:'disabled'});
      }
    }
    await page.locator('#tab-about').click();
    await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw new Error('denied')}});
    await page.locator('#about-contribute [data-agent-task]').click();
    await page.waitForSelector('#agent-dialog textarea');assert.equal(snapshot(await page.locator('#agent-task-text').inputValue()).length,30);
    const overflow=await page.locator('#agent-dialog .modal-card').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(overflow,false);
    await page.screenshot({path:join(out,'community-copy-fallback-390-dark.png'),animations:'disabled'});
    await page.keyboard.press('Escape');assert.equal(await page.locator('#agent-dialog').isVisible(),false);
    for(const lang of ['en','es','pl','ru']){
      await siteLang(page, lang);assert.ok(await page.locator('#about-contribute [data-agent-task]').textContent());
    }
    await page.evaluate(()=>{document.querySelector('#toast').hidden=true;});
    await siteLang(page, 'en');
    await page.setViewportSize({width:1280,height:1100});
    await page.locator('[data-cov-view="languages"]').click();
    assert.equal(await page.locator('#about-cov tbody tr').count(),5);
    const coverage=await page.evaluate(()=>coverageStats());
    assert.equal(Number(await page.locator('[data-cov-row="ru"] [data-cov-kind="full"]').textContent()),coverage.languages.ru.full);
    assert.ok(coverage.languages.ru.full>0 && coverage.languages.ru.audio>0);
    assert.equal(await page.locator('#view-about [data-form="feedback"]').count(),1);
    assert.equal(await page.locator('#view-about a[href$="docs/search-brief.md"]').count(),1);
    await page.locator('#about-cov').screenshot({path:join(out,'coverage-languages-desktop.png'),animations:'disabled'});
    const coverageLayouts=[];
    for(const width of [360,390]) for(const theme of ['light','dark']) {
      await page.setViewportSize({width,height:width===360?740:844});
      await page.evaluate(theme=>{prefs.theme=theme;savePrefs();applyTheme();},theme);
      await siteLang(page, width===360?'pl':'ru');
      for(const view of ['forms','languages']) {
        await page.locator(`[data-cov-view="${view}"]`).click();
        const layout=await page.locator('#about-cov').evaluate(el=>({width:innerWidth,scroll:document.documentElement.scrollWidth,table:el.querySelector('.cov').getBoundingClientRect().width,min:Math.min(...[...el.querySelectorAll('button,a')].map(b=>b.getBoundingClientRect().height)),cards:getComputedStyle(el.querySelector('.cov tbody tr')).display,statsTop:[...el.querySelectorAll('.cov-overview dd')].slice(1).map(x=>x.getBoundingClientRect().top)}));
        assert.ok(layout.scroll<=width+1);assert.ok(layout.min>=44);assert.equal(layout.cards,'grid');assert.ok(Math.abs(layout.statsTop[0]-layout.statsTop[1])<=1);coverageLayouts.push({...layout,theme,view});
        await page.locator('#about-cov').screenshot({path:join(out,`coverage-${view}-${width}-${theme}.png`),animations:'disabled'});
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('#tab-awards').click();
    await page.locator('[data-av-mode="authors"]').click();
    await page.locator('#av-author-sort').selectOption('az');
    const sorted=await page.locator('.author-open > span:first-child').allTextContents();
    assert.ok(sorted.every((name,i)=>!i||sorted[i-1].localeCompare(name,'ru')<=0));
    await page.locator('#av-author-sort').selectOption('awards');
    const ranked=await page.locator('.author-counts').allTextContents();
    const counts=ranked.map(text=>Number(text.match(/(\d+)$/)[1]));
    assert.ok(counts.every((n,i)=>!i||counts[i-1]>=n));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#tab-awards').click();assert.equal(await page.locator('#av-author-sort').inputValue(),'awards');
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:join(out,'authors-most-awards-390-dark.png'),animations:'disabled'});
    assert.ok(await page.locator('#av-author-sort').evaluate(el=>el.getBoundingClientRect().height>=44));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    // Reader languages are the default in both independent source-language filters.
    await page.evaluate(()=>{prefs.langs=['pl'];delete prefs.catalogLang;delete prefs.av;delete prefs.filters;savePrefs();});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#tab-library').click();
    assert.equal(await filterOption(page,'lib-languages','all').isChecked(),true);
    assert.equal(await page.locator('[data-multi-filter="lib-languages"]').first().getAttribute('value'),'all');
    assert.equal(await page.locator('[data-multi-filter="lib-languages"]').nth(1).getAttribute('value'),'pl');
    const allCatalog=await page.locator('#view-library .slip').count();assert.ok(allCatalog>100);
    await selectFilter(page, 'lib-languages', ['pl']);
    assert.ok(await page.locator('#view-library .slip').count()<allCatalog);
    await selectFilter(page, 'lib-formats', ['full']);
    const expectedPolishFull = await page.evaluate(() => Object.entries(READ)
      .filter(([qid, entry]) => WORKS[qid] && entry.links.some(link => link.lang === 'pl' && link.kind === 'full'))
      .map(([qid]) => qid).sort());
    const visiblePolishFull = await page.locator('#view-library .slip-open')
      .evaluateAll(cards => cards.map(card => card.dataset.work).sort());
    assert.ok(expectedPolishFull.length > 0);
    assert.deepEqual(visiblePolishFull, expectedPolishFull);
    await selectFilter(page, 'lib-formats', []);
    await page.locator('#lib-q').fill('Cat Pictures Please');await page.locator('#view-library [type="submit"]').click();
    assert.equal(await page.locator('#view-library .slip-open[data-work="Q25349436"]').count(),0);
    await selectFilter(page, 'lib-languages', []);
    assert.equal(await page.locator('#lib-q').inputValue(),'Cat Pictures Please');
    assert.equal(await page.locator('#view-library .slip-open[data-work="Q25349436"]').count(),1);
    await page.locator('#view-library [data-sclear]').click();await selectFilter(page, 'lib-languages', ['pl']);
    await page.locator('#tab-awards').click();assert.equal(await filterOption(page,'av-languages','all').isChecked(),true);
    await selectFilter(page, 'av-awards', []);await selectFilter(page, 'av-categories', []);
    await selectFilter(page, 'av-languages', ['pl']);
    assert.equal(await page.locator('#av-body [data-work="Q25349436"]').count(),0);
    assert.ok(await page.locator('#av-body [data-work="Q190192"]').count()>0);
    await page.setViewportSize({width:1280,height:1100});
    for(const mode of ['cats','years','authors','table']) {
      await page.locator(`[data-av-mode="${mode}"]`).click();
      const ids=await page.locator('#av-body [data-work]').evaluateAll(els=>els.map(el=>el.dataset.work));
      assert.ok(ids.length>0);assert.ok(await page.evaluate(ids=>ids.every(q=>matchesSourceLanguage(q,'pl')),ids));
    }
    await page.locator('[data-av-mode="cats"]').click();
    await selectFilter(page, 'av-formats', ['full']);
    assert.equal(await page.locator('#av-body [data-work="Q16747517"]').count(),0);
    assert.ok(await page.locator('#av-body [data-work="Q467388"]').count()>0);
    await selectFilter(page, 'av-formats', []);
    await page.locator('#av-body [data-av-year]').first().click();
    assert.equal(await filterOption(page,'av-languages','pl').isChecked(),true);
    await page.locator('[data-av-clear]').click();
    await page.locator('#av-q').fill('Cat Pictures Please');await page.locator('#view-awards [type="submit"]').click();
    assert.equal(await page.locator('#av-body [data-work="Q25349436"]').count(),0);
    await selectFilter(page, 'av-languages', []);
    assert.ok(await page.locator('#av-body [data-work="Q25349436"]').count()>0);
    await page.locator('#view-awards [data-sclear]').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#tab-library').click();assert.equal(await filterOption(page,'lib-languages','pl').isChecked(),true);
    await page.locator('#tab-awards').click();assert.equal(await filterOption(page,'av-languages','all').isChecked(),true);
    assert.deepEqual(await page.evaluate(()=>myLangs()),['pl']);
    await selectFilter(page, 'av-languages', ['pl']);
    for(const width of [360,390]) for(const theme of ['light','dark']) {
      await page.setViewportSize({width,height:width===360?740:844});
      await siteLang(page, width===360?'pl':'ru');
      await page.evaluate(theme=>{prefs.theme=theme;savePrefs();applyTheme();},theme);
      for(const view of ['library','awards']) {
        await page.locator('#tab-'+view).click();await page.evaluate(()=>window.scrollTo(0,0));
        const select=page.locator(`[data-multi="${view==='library'?'lib':'av'}-languages"] summary`);
        assert.ok(await select.evaluate(el=>el.getBoundingClientRect().height>=44));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        await page.screenshot({path:join(out,`source-language-${view}-${width}-${theme}.png`),animations:'disabled'});
      }
    }
    await page.locator('#tab-library').click();
    await selectFilter(page,'lib-languages',['en','pl']);
    assert.equal(await filterOption(page,'lib-languages','en').isChecked(),true);
    assert.equal(await filterOption(page,'lib-languages','pl').isChecked(),true);
    assert.equal(await filterOption(page,'lib-languages','all').isChecked(),false);
    await selectFilter(page,'lib-formats',['full','audio']);
    const matching = await page.locator('#view-library .slip-open').evaluateAll(xs=>xs.map(x=>x.dataset.work));
    assert.ok(matching.length>3);
    assert.ok(await page.evaluate(ids=>ids.every(q=>matchesFormats(q,['en','pl'],['full','audio'])),matching));
    await page.reload({waitUntil:'domcontentloaded'});await page.locator('#tab-library').click();
    assert.deepEqual(await page.evaluate(()=>filter.langs),['en','pl']);
    assert.deepEqual(await page.evaluate(()=>filter.formats),['full','audio']);
    for(const width of [360,390]) for(const theme of ['light','dark']) {
      await page.setViewportSize({width,height:width===360?740:844});
      await page.evaluate(theme=>{prefs.theme=theme;savePrefs();applyTheme();window.scrollTo(0,0);},theme);
      const details=page.locator('[data-multi="lib-languages"]');
      if(!(await details.evaluate(el=>el.open)))await details.locator('summary').click();
      assert.ok(await details.locator('.multi-option').evaluateAll(xs=>xs.every(x=>x.getBoundingClientRect().height>=44)));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:join(out,`multiselect-${width}-${theme}.png`),animations:'disabled'});
      await filterOption(page,'lib-languages','en').focus();
      await page.keyboard.press('Space');
      assert.equal(await filterOption(page,'lib-languages','en').isChecked(),false);
      assert.equal(await filterOption(page,'lib-languages','en').evaluate(el=>el===document.activeElement),true);
      assert.equal(await details.evaluate(el=>el.open),true);
      await page.keyboard.press('Space');
      await page.keyboard.press('Escape');
      assert.equal(await details.evaluate(el=>el.open),false);
      assert.equal(await details.locator('summary').evaluate(el=>el===document.activeElement),true);
    }
    assert.deepEqual(errors,[]);
    const report={batch_copy:true,one_work_copy:true,clipboard_fallback:true,all_categories:total,author_cards:true,author_sort:true,source_language_filters:true,language_defaults_and_persistence:true,language_scoped_search:true,coverage,coverageLayouts,layouts,errors};
    writeFileSync(join(out,'community-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  } finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
