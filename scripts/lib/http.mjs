import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(value, null, 2) + '\n'); renameSync(temp, path);
}
export function readJson(path, fallback) { return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback; }
export class HttpError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}
async function bodyText(response, limit, { truncate = false, controller } = {}) {
  const chunks = []; let size = 0;
  for await (const chunk of response.body || []) {
    const remaining = limit - size;
    if (chunk.length > remaining) {
      if (truncate) { chunks.push(chunk.subarray(0, remaining)); break; }
      controller?.abort(); throw new HttpError(`Response exceeds ${limit} bytes`);
    }
    size += chunk.length; chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export class CachedHttp {
  constructor({ dir, fetchImpl = fetch, pause = sleep, now = Date.now, retries = 2, timeout = 30000, ttl = 7 * 86400000, delay = 1000, googleBooksApiKey = '' } = {}) {
    Object.assign(this, { dir, fetchImpl, pause, now, retries, timeout, ttl, delay });
    this.googleBooksApiKey = googleBooksApiKey.trim();
    this.hosts = new Map(); this.pending = new Map(); this.memory = new Map();
  }
  get googleBooksConfigured() { return !!this.googleBooksApiKey; }
  redact(value) { return this.googleBooksApiKey ? String(value).replaceAll(this.googleBooksApiKey, '[REDACTED]') : value; }
  async get(url) {
    const cached = this.memory.get(url);
    if (cached && this.now() - Date.parse(cached.checked_at) < this.ttl) return { ...cached, cached: true };
    if (this.pending.has(url)) return this.pending.get(url);
    const request = this.request(url);
    this.pending.set(url, request);
    try { const result = await request; this.memory.set(url, result); return result; } finally { this.pending.delete(url); }
  }
  invalidate(url) { this.memory.delete(url); rmSync(join(this.dir, hash(url) + '.json'), { force: true }); }
  async request(url) {
    const path = join(this.dir, hash(url) + '.json');
    let cached;
    try { cached = readJson(path, null); } catch { /* A broken cache is refetched. */ }
    if (cached?.url === url && this.now() - Date.parse(cached.checked_at) < this.ttl) return { ...cached, cached: true };
    const parsed = new URL(url), host = parsed.hostname;
    const credentialed = this.googleBooksConfigured && parsed.origin === 'https://www.googleapis.com' && parsed.pathname.startsWith('/books/v1/');
    const previous = this.hosts.get(host) || Promise.resolve();
    let release; const gate = new Promise(resolve => { release = resolve; });
    this.hosts.set(host, gate);
    await previous;
    try {
      for (let attempt = 0; ; attempt++) {
        await this.pause(host === 'librivox.org' ? Math.max(5000, this.delay) : this.delay);
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.timeout);
        let response, result, failure;
        try {
          const headers = { 'User-Agent': 'unoebasta-metadata/1.0 (+https://github.com/foteev/unoebasta)', Accept: 'application/json,text/html,text/csv;q=0.9' };
          if (credentialed) headers['x-goog-api-key'] = this.googleBooksApiKey;
          response = await this.fetchImpl(url, { signal: controller.signal, headers, redirect: credentialed ? 'error' : 'follow' });
          if (!response.ok) {
            const error = new HttpError(`HTTP ${response.status} at ${url}`, response.status);
            error.body = this.redact(await bodyText(response, 4000, { truncate: true, controller }));
            throw error;
          }
          const limit = 64 * 1024 * 1024;
          if (+response.headers.get('content-length') > limit) { controller.abort(); throw new HttpError('Response exceeds 64 MiB'); }
          const body = await bodyText(response, limit, { controller });
          result = { url, final_url: this.redact(response.url || url), checked_at: new Date(this.now()).toISOString(), body: this.redact(body) };
        } catch (e) { failure = e; failure.message = this.redact(failure.message); } finally { clearTimeout(timer); }
        if (result) { writeJson(path, result); return { ...result, cached: false }; }
        const status = failure.status || 0;
        if (attempt >= this.retries || (status && status !== 429 && status < 500)) throw failure;
        const retry = response?.headers.get('retry-after');
        const retryMs = retry && (/^\d+$/.test(retry) ? +retry * 1000 : Date.parse(retry) - this.now());
        // Stop rather than retry before an unusually long server-requested cooldown.
        if (retryMs > 60000) throw new HttpError(`Retry-After exceeds 60 seconds at ${url}`, status);
        await this.pause(Math.max(1000 * 2 ** attempt, retryMs || 0));
      }
    } finally { release(); if (this.hosts.get(host) === gate) this.hosts.delete(host); }
  }
}
