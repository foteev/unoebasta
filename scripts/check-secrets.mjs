// Fails if the repository holds anything that looks like a key, a token or a personal e-mail address.
// Runs in CI on every pull request; run it yourself with `npm run check:secrets` before you push.
// The page needs no keys at all, so there is never a reason to commit one.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.cache']);
const TEXT = /\.(html|m?js|json|md|csv|ya?ml|css|txt|py|sh|toml)$|^\.[a-z]+$|^[A-Z]+$/i;

const PATTERNS = [
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['API secret key (sk-…)', /\bsk-(?:ant-|proj-|live_|test_)?[A-Za-z0-9_-]{24,}/],
  ['Nostr secret key', /\bnsec1[02-9ac-hj-np-z]{58}\b/],
  ['Hex secret assigned to a key-like name', /\b(?:secret|private|priv|sk|token|api[_-]?key)\w*["']?\s*[:=]\s*["'][0-9a-f]{32,}["']/i],
];
// e-mail addresses: only these may appear
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const EMAIL_OK = [/@users\.noreply\.github\.com$/i, /@example\.(com|org|test)$/i, /^noreply@/i];

const found = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name), rel = relative(root, p);
    const st = statSync(p);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); continue; }
    if (/^\.env(\..*)?$/.test(name) && name !== '.env.example') { found.push(`${rel}: environment file must not be committed`); continue; }
    if (!TEXT.test(name) || st.size > 5e6) continue;
    const text = readFileSync(p, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      for (const [what, re] of PATTERNS) if (re.test(line)) found.push(`${rel}:${i + 1}: looks like a ${what}`);
      for (const m of line.match(EMAIL) || []) if (!EMAIL_OK.some(ok => ok.test(m)) && !/\.(png|jpe?g|webp|svg|gif)$/i.test(m)) found.push(`${rel}:${i + 1}: e-mail address (${m.replace(/^(.).*(@.*)$/, '$1…$2')})`);
    });
  }
}
walk(root);
if (found.length) {
  console.error('Possible secrets or personal data:\n' + found.map(f => '  ' + f).join('\n'));
  console.error('\nRemove them. If a real key was ever committed, revoke it first: deleting it from git history is not enough.');
  process.exit(1);
}
console.log('check:secrets — nothing found');
