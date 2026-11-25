// Measure CLS, shift sources, LCP, FCP and long tasks on gzipped dist/web/ across desktop and slow mobile.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const runs = Math.max(1, Number((process.argv.find(a => a.startsWith('--runs=')) || '').slice(7)) || 5);
const root = resolve('dist/web');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  let target = resolve(root, pathname.replace(/^\/+/, ''));
  if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
  if (!existsSync(target)) { res.writeHead(404).end(); return; }
  const ext = extname(target);
  const body = readFileSync(target);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  if (['.html', '.css', '.js', '.svg', '.json', '.xml'].includes(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    res.setHeader('Content-Encoding', 'gzip');
    res.end(gzipSync(body));
    return;
  }
  res.end(body);
});

const median = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] ?? 0; };
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const urls = [
  ['home', base],
  ['work', `${base}work/naomi-kritzer-better-living-through-algorithms-Q130213759/`],
  ['author', `${base}author/a-t-greenblatt-Q98915176/`],
  ['award', `${base}award/hugo-HUG/`],
];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const [profile, mobile] of [['desktop', false], ['mobile', true]]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1350, height: 900 },
    });
    const page = await context.newPage();
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const cdp = await context.newCDPSession(page);
    if (mobile) {
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (0.75 * 1024 * 1024) / 8,
        latency: 150,
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    await page.addInitScript(() => {
      window.__cwv = { shifts: [], lcp: 0, lt: [] };
      const label = n => !n ? '?' : (n.id ? '#' + n.id : n.tagName + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) {
          window.__cwv.shifts.push({ v: e.value, t: Math.round(e.startTime), src: (e.sources || []).map(s => label(s.node)) });
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => {
        const es = l.getEntries(); if (es.length) window.__cwv.lcp = Math.round(es[es.length - 1].startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) window.__cwv.lt.push(Math.round(e.duration));
      }).observe({ type: 'longtask', buffered: true });
    });

    for (const [name, url] of urls) {
      const samples = [];
      for (let i = 0; i < runs; i++) {
        await cdp.send('Network.clearBrowserCache');
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(1500);
        samples.push(await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
          const box = s => { const el = document.querySelector(s); return el ? Math.round(el.getBoundingClientRect().height) : 0; };
          const c = window.__cwv;
          return {
            cls: +c.shifts.reduce((a, x) => a + x.v, 0).toFixed(4),
            shifts: c.shifts.map(x => `${x.v.toFixed(4)}@${x.t}ms(${x.src.join(',')})`),
            lcp: c.lcp,
            fcp: fcp ? Math.round(fcp.startTime) : 0,
            load: Math.round(nav.loadEventEnd),
            maxLt: Math.max(0, ...c.lt),
            lt: c.lt,
            dom: document.querySelectorAll('*').length,
            catH: box('#view-catalog'),
            authCtlH: box('#author-controls'),
          };
        }));
      }
      const last = samples[samples.length - 1];
      console.log(JSON.stringify({
        profile, name, runs,
        cls: median(samples.map(s => s.cls)),
        lcp: median(samples.map(s => s.lcp)),
        fcp: median(samples.map(s => s.fcp)),
        load: median(samples.map(s => s.load)),
        maxLt: median(samples.map(s => s.maxLt)),
        dom: last.dom,
        catH: last.catH,
        authCtlH: last.authCtlH,
        shifts: last.shifts,
        lt: last.lt,
      }));
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
