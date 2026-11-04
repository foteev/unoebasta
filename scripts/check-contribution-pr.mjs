// Validate research submissions using trusted base code; never check out or execute PR code.
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FOUND_FIELDS, parseCsv, validateFound, sourceUrlKey } from './lib/csv.mjs';
import { loadCatalog } from './lib/catalog.mjs';
import { mergeFound } from './lib/merge-found.mjs';
import { assertSourceScope } from './lib/source-reviews.mjs';

const PATH = /^data\/(found|notes)\/(\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{0,79})\.(csv|md)$/;
const CSV_BYTES = 200_000, NOTES_BYTES = 60_000;
const fileLimit = filename => filename.endsWith('.csv') ? CSV_BYTES : NOTES_BYTES;
const researchPath = path => path.startsWith('data/found/') || path.startsWith('data/notes/');
const linkKey = r => JSON.stringify([r.qid, r.lang || 'en', r.kind, +r.part || '', sourceUrlKey(r.url)]);
export function validateSubmission(files, catalog, source, { labelled = false } = {}) {
  if (!labelled && !files.some(f => researchPath(f.filename))) return { skipped: true, reason: 'No research submission files' };
  if (!files.length || files.length > 2) throw new Error('Submit only one new findings CSV and optional matching note, or one notes-only file');
  let csv, note; const stems = new Set();
  for (const f of files) {
    const match = PATH.exec(f.filename);
    if (!match || (match[1] === 'found' ? match[3] !== 'csv' : match[3] !== 'md')) throw new Error('Disallowed submission path: ' + JSON.stringify(f.filename));
    if (f.status !== 'added' || f.mode !== '100644') throw new Error('Submission files must be new regular files');
    if (match[1] === 'found' ? csv : note) throw new Error('Only one CSV and one note are allowed');
    const date = match[2].slice(0, 10), stamp = Date.parse(date + 'T00:00:00Z');
    if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== date) throw new Error('Invalid date in submission filename');
    stems.add(match[2]);
    if (typeof f.content !== 'string' || f.content.includes('\0')) throw new Error('Expected UTF-8 text');
    const cap = match[1] === 'found' ? CSV_BYTES : NOTES_BYTES;
    if (Buffer.byteLength(f.content) > cap) throw new Error('Submission file exceeds size limit');
    if (match[1] === 'found') csv = f; else note = f;
  }
  if (stems.size !== 1) throw new Error('CSV and note must have the same filename stem');
  if (note && !note.content.trim()) throw new Error('Notes must not be empty');
  if (!csv) return { notes_only: true, rows: 0 };
  const rows = parseCsv(csv.content);
  if (!rows.length || rows.length > 500) throw new Error('CSV must contain 1–500 findings');
  if (Object.keys(rows[0]).join(',') !== FOUND_FIELDS.join(',')) throw new Error('CSV header must match the task contract exactly');
  assertSourceScope(rows);
  const works = new Map(catalog.works.map(w => [w.qid, w])), seen = new Set();
  for (const r of rows) {
    validateFound(r);
    if (r.kind === 'none') throw new Error('Unsuccessful checks belong in notes');
    const w = works.get(r.qid);
    if (!w || r.form !== w.form) throw new Error('Unknown QID or incorrect work form: ' + r.qid);
    if (r.kind === 'full' && !r.words) throw new Error('Full text requires an estimated word count');
    const u = new URL(r.url), host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host === '::1' || host.includes(':') || /^\d+(?:\.\d+){3}$/.test(host)) throw new Error('Use a public source hostname, not a local or IP address');
    if ([...u.searchParams.keys()].some(k => /^(key|api[_-]?key|access_token|token|password|authorization)$/i.test(k))) throw new Error('Credential parameters are not allowed in source URLs');
    if (Date.parse(r.checked_at) > Date.now() + 300_000) throw new Error('Check date is in the future');
    const key = linkKey(r);
    if (seen.has(key) || w.knownLinks.some(l => linkKey({ ...l, qid: w.qid }) === key)) throw new Error('Duplicate finding; refresh main and remove it: ' + r.qid);
    seen.add(key);
  }
  // Pure dry-run catches incomplete/conflicting multipart sets; no generated files are written.
  if (source) mergeFound(source, catalog.data, rows, { archive: true });
  return { rows: rows.length, works: new Set(rows.map(r => r.qid)).size, notes: !!note, archive_review: rows.some(r => r.archive === 'yes') };
}

async function github(path, token) {
  const res = await fetch('https://api.github.com' + path, { redirect: 'error', signal: AbortSignal.timeout(20_000),
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  if (!res.ok) throw new Error('GitHub API returned HTTP ' + res.status);
  const reader = res.body.getReader(); let size = 0; const chunks = [];
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 8_000_000) { await reader.cancel(); throw new Error('GitHub response exceeds limit'); } chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function inspectPullRequest({ repository, number, headSha, baseSha, token, api = github }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^\d+$/.test(String(number)) || !/^[a-f0-9]{40}$/.test(headSha) || !/^[a-f0-9]{40}$/.test(baseSha)) throw new Error('Invalid workflow context');
  const pr = await api(`/repos/${repository}/pulls/${number}`, token);
  if (pr.head.sha !== headSha || pr.base.sha !== baseSha) throw new Error('PR changed; rerun against its current commit');
  const files = [];
  for (let page = 1; page <= 30; page++) {
    const batch = await api(`/repos/${repository}/pulls/${number}/files?per_page=100&page=${page}`, token); files.push(...batch);
    if (batch.length < 100) break;
    if (page === 30) throw new Error('PR file listing is incomplete');
  }
  const labelled = pr.labels.some(l => l.name === 'agent-findings');
  if (!labelled && !files.some(f => researchPath(f.filename))) return { skipped: true };
  // Reject code changes before reading any contributor-supplied blob.
  if (files.length > 2 || files.some(f => !PATH.test(f.filename) || f.status !== 'added')) throw new Error('Research PRs may add only the task-contract CSV and optional note');
  const tree = await api(`/repos/${repository}/git/trees/${headSha}?recursive=1`, token);
  if (tree.truncated) throw new Error('PR tree is incomplete');
  for (const f of files) {
    const entry = tree.tree.find(e => e.path === f.filename);
    if (!entry || entry.type !== 'blob' || entry.mode !== '100644' || entry.sha !== f.sha) throw new Error('Expected a regular file from the exact PR commit');
    if (entry.size > fileLimit(f.filename)) throw new Error('Submission file exceeds size limit');
    const blob = await api(`/repos/${repository}/git/blobs/${entry.sha}`, token);
    if (blob.encoding !== 'base64' || blob.size > fileLimit(f.filename)) throw new Error('Unexpected submission blob');
    f.mode = entry.mode; f.content = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(blob.content, 'base64'));
  }
  const current = await api(`/repos/${repository}/pulls/${number}`, token);
  if (current.head.sha !== headSha || current.base.sha !== baseSha) throw new Error('PR changed during validation; rerun');
  return { files, labelled };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
    const result = await inspectPullRequest({ repository: process.env.CONTRIBUTION_REPO, number: process.env.CONTRIBUTION_PR,
      headSha: process.env.CONTRIBUTION_HEAD, baseSha: process.env.CONTRIBUTION_BASE, token: process.env.GITHUB_TOKEN });
    const report = result.skipped ? result : validateSubmission(result.files, loadCatalog(root), readFileSync(join(root, 'src/index.html'), 'utf8'), result);
    console.log(JSON.stringify(report));
  } catch (e) { console.error(JSON.stringify({ error: e.message })); process.exitCode = 1; }
}
