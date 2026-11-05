// Checks full text, audio, excerpt and conditional-preview addresses. HTTP success alone does not certify source content.
// Access restrictions and rate limits are listed for review; they do not prove a dead or paid source.
// Runs in GitHub Actions (.github/workflows/links.yml) every week and on demand. Locally: node scripts/check-links.mjs
import { readFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogSourceLinks, pageAccessIssue } from './lib/link-access.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src', 'index.html'), 'utf8');
const READ = new Function(src.slice(src.indexOf('const READ = {'), src.indexOf('const CHANGELOG')) + '; return READ;')();
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; unoebasta link check; +https://github.com/foteev/unoebasta)', Accept: 'text/html,application/xhtml+xml,audio/*,*/*;q=0.8' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const links = catalogSourceLinks(READ, JSON.parse(readFileSync(join(root, 'data/awards.json'), 'utf8')));
async function check(l, retry = 2) {
  for (const method of ['GET']) {
    try {
      const r = await fetch(l.url, { method, headers: UA, redirect: 'follow', signal: AbortSignal.timeout(25000) });
      let issue = '';
      if (r.ok && /html/i.test(r.headers.get('content-type') || '')) {
        const chunks = []; let size = 0;
        for await (const chunk of r.body) { chunks.push(chunk); size += chunk.length; if (size > 2_000_000) break; }
        issue = pageAccessIssue(r.url, Buffer.concat(chunks).toString('utf8'));
      } else if (r.body) r.body.cancel().catch(() => {});
      if (r.status === 429 && retry) { await sleep(8000); return check(l, retry - 1); } // a site that asks to slow down
      if (r.ok) return { ...l, status: r.status, issue, final: r.url !== l.url ? r.url : '' };
      if (method === 'GET' || ![403, 405, 400, 404, 501].includes(r.status)) return { ...l, status: r.status };
    } catch (e) { if (method === 'GET') return { ...l, status: 0, err: e.cause?.code || e.name }; }
  }
}
const out = [];
for (let i = 0; i < links.length; i += 4) { out.push(...await Promise.all(links.slice(i, i + 4).map(check))); await sleep(400); }
const dead = out.filter(x => x.issue === 'unavailable_reader' || x.status === 404 || x.status === 410 || (x.status === 0 && /ENOTFOUND|EAI_AGAIN|CERT/.test(x.err || '')));
const unsure = out.filter(x => !dead.includes(x) && (x.issue || x.status < 200 || x.status >= 300));
const moved = out.filter(x => x.kind === 'full' && x.final && new URL(x.final).host !== new URL(x.url).host); // audio files always go through a CDN
const row = x => `| ${x.q} | ${x.kind} | ${x.site} | ${x.issue || x.status || x.err} | ${x.url} |`;
const md = [`## Source addresses: ${out.length} checked`, '', 'This checks reachability and obvious missing-content screens, not free full-text scope, complete playback or permission. Google Books previews vary by region. An HTTP 200 store page is not an approval.', '', `- dead: ${dead.length}`, `- to check by hand (access limits, missing content, timeouts, server errors): ${unsure.length}`, `- moved to another site: ${moved.length}`, ''];
if (dead.length) md.push('### Dead', '| QID | kind | site | status | url |', '|---|---|---|---|---|', ...dead.map(row), '');
if (unsure.length) md.push('### To check by hand', '| QID | kind | site | status | url |', '|---|---|---|---|---|', ...unsure.map(row), '');
if (moved.length) md.push('### Moved', '| QID | kind | site | now | url |', '|---|---|---|---|---|', ...moved.map(x => `| ${x.q} | ${x.kind} | ${x.site} | ${x.final} | ${x.url} |`), '');
console.log(md.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n') + '\n');
if (dead.length) process.exit(1);
