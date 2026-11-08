const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

(async () => {
  const ref = 'codex/check-readme-image';
  const repo = 'foteev/unoebasta';
  const path = 'docs/images/mobile-catalog.png';
  const url = 'https://raw.githubusercontent.com/' + repo + '/refs/heads/' + ref + '/' + path;
  const response = await fetch(url, {signal: AbortSignal.timeout(15000)});
  assert.equal(response.status, 200, 'Raw PNG status');
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), '36dcc465c2eb75d9bbed694ee3780e41faefb830');
  assert.equal(bytes.readUInt32BE(16), 441);
  assert.equal(bytes.readUInt32BE(20), 792);
  console.log('RECOVERED_IMAGE_OK ' + JSON.stringify({http:response.status,bytes:bytes.length,width:441,height:792}));

  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:1200,height:900}});
    const uri = 'https://github.com/' + repo + '/blob/refs/heads/' + ref + '/README.md';
    const rendered = await page.goto(uri, {waitUntil:'domcontentloaded',timeout:25000});
    const image = page.locator('img[alt="unoebasta mobile catalog view"]');
    if (!(await image.count())) console.log('README_PAGE '+JSON.stringify({status:rendered?.status(),title:await page.title(),url:page.url()}));
    await image.waitFor({state:'visible',timeout:10000});
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const img = document.querySelector('img[alt="unoebasta mobile catalog view"]');
      return img?.complete && img.naturalWidth > 0;
    }, null, {timeout:15000});
    const dimensions = await image.evaluate(img => [img.naturalWidth,img.naturalHeight]);
    assert.deepEqual(dimensions,[441,792]);
    console.log('README_RENDER_OK '+JSON.stringify({status:rendered?.status(),dimensions}));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
