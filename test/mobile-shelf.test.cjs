const { chromium } = require('playwright');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

(async () => {
  const ids = ['77cec8ce-56a0-4977-a6b7-7db688defb61', '36230489-de88-408a-a0b5-322ab1c78fb8'];
  const base = 'https://github.com/user-attachments/assets/';
  const report = {};
  let chosen;
  for (const id of ids) {
    try {
      const response = await fetch(base + id, { signal: AbortSignal.timeout(15000) });
      const bytes = Buffer.from(await response.arrayBuffer());
      const png = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
      report[id] = {status: response.status, type: response.headers.get('content-type'), size: bytes.length,
        dimensions: png && bytes.length >= 24 ? [bytes.readUInt32BE(16), bytes.readUInt32BE(20)] : null};
      if (!chosen && response.ok && png) chosen = bytes;
    } catch (e) {
      report[id] = {error: e.message};
    }
  }

  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:1200,height:900}});
    const response = await page.goto('https://github.com/foteev/unoebasta#readme', {waitUntil:'domcontentloaded',timeout:18000});
    const image = page.locator('#readme img[alt="unoebasta mobile catalog view"]');
    if (await image.count()) {
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('#readme img[alt="unoebasta mobile catalog view"]')?.complete, {timeout:10000}).catch(()=>{});
      report.readme = await image.evaluate(img => ({loaded:img.complete && img.naturalWidth>0,
        width:img.naturalWidth,height:img.naturalHeight}));
    } else {
      report.readme = {imageFound:false,status:response?.status()};
    }
  } catch (e) {
    report.readme = {error: e.message.slice(0,400)};
  } finally { await browser.close(); }
  console.log('IMAGE_DIAGNOSTIC '+JSON.stringify(report));
  const out = path.resolve(__dirname, '../.cache/mobile-shelf');
  mkdirSync(out,{recursive:true});
  writeFileSync(path.join(out,'image-diagnostic.json'),JSON.stringify(report));
  if (chosen) {
    writeFileSync(path.join(out,'readme-mobile-catalog.png'),chosen);
    const value = chosen.toString('base64');
    for (let i = 0; i < value.length; i += 4096) console.log('RECOVERED_PNG '+value.slice(i,i+4096));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
