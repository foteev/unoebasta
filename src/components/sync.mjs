// Build-inlined classic-script fragment bundled by scripts/build-web.mjs; shares page global scope; do not import in Node.
/* ---------- moving to another device (sync, steps 1–2) ----------
   One merge for every channel (link now, a relay later): for each record the newer `mt` wins,
   and a deletion mark is a record too. The link carries the shelf after '#move=': browsers never send
   that part to a server. Only what the page cannot rebuild travels: places, notes, finished marks,
   bookmarks, history, a few settings, deletion marks. Book titles and authors come back from the catalog.
   Own book files stay on the device; a place in one of them travels by a fingerprint of the text
   and lands when the same file is on the other device. */
const mtOf = r => (r && (r.mt || r.at)) || 0;
const fileFp = f => 'ff:' + hash((f.words || 0) + '|' + (f.html || '').length + '|' + (f.html || '').slice(0, 4000));
async function syncPack() {
  await loadLocal();
  const fp = new Map(local.files.map(f => [f.id, fileFp(f)]));
  const keyOut = k => (typeof k === 'string' && k.startsWith('file:')) ? (fp.get(k.slice(5)) || null) : k;
  const r = { positions: [], bookmarks: [], links: [] };
  for (const st of SYNC_STORES) for (const r0 of local[st]) {
    if (st === 'bookmarks' && r0.type === 'about') continue; // cached descriptions: the page fetches them again
    const x = { ...r0 };
    if ((x.id = keyOut(x.id)) == null) continue;
    if (x.key && (x.key = keyOut(x.key)) == null) continue;
    const w = x.workId && WORKS[x.workId];
    if (w) { delete x.book; if (x.title === w.title) { delete x.title; delete x.byline; } }
    if (typeof x.text === 'string' && x.text.length > 300) x.text = x.text.slice(0, 300);
    if (!x.mt) x.mt = x.at || 0;
    r[st].push(x);
  }
  const since = Date.now() - 400 * 864e5;
  const x = local.tombs.filter(tb => tb.mt > since && SYNC_STORES.includes(tb.s) && !String(tb.key).startsWith('file:')).map(tb => [tb.s, tb.key, tb.mt]);
  const pr = { mt: prefs.prefsMt || 0 }; for (const k of SYNC_PREFS) if (prefs[k] !== undefined && prefs[k] !== null) pr[k] = prefs[k];
  return { v: SCHEMA, at: Date.now(), r, x, p: pr };
}
// a smaller pack for the QR code: the essentials first
function slimPack(pk, level) {
  const q = JSON.parse(JSON.stringify(pk)), now = Date.now();
  q.x = []; q.r.links = [];
  q.r.bookmarks = q.r.bookmarks.filter(b => b.type !== 'recall' || b.note);
  if (level >= 2) { const cut = now - 60 * 864e5; q.r.positions = q.r.positions.filter(z => mtOf(z) > cut); q.r.bookmarks = q.r.bookmarks.filter(b => b.type !== 'recall' || mtOf(b) > cut); }
  if (level >= 3) { const cut = now - 14 * 864e5; q.r.positions = q.r.positions.filter(z => mtOf(z) > cut); q.r.bookmarks = q.r.bookmarks.filter(b => b.type === 'done'); }
  q.part = level; return q;
}
function syncUnpack(pk) {
  const fpTo = new Map(local.files.map(f => [fileFp(f), 'file:' + f.id]));
  const keyIn = k => (typeof k === 'string' && k.startsWith('ff:')) ? (fpTo.get(k) || null) : k;
  const recs = { positions: [], bookmarks: [], links: [] };
  for (const st of SYNC_STORES) for (const r0 of ((pk.r && pk.r[st]) || [])) {
    if (!r0 || typeof r0 !== 'object' || !r0.id) continue;
    const x = { ...r0 };
    if ((x.id = keyIn(x.id)) == null) continue;
    if (x.key && (x.key = keyIn(x.key)) == null) continue;
    const w = x.workId && WORKS[x.workId];
    if (w) { x.book = bookOf(x.workId); if (!x.title && (st === 'positions' || x.type === 'recall' || x.type === 'pos')) { x.title = w.title; x.byline = authorsLine(w); } }
    recs[st].push(x);
  }
  const tombs = (pk.x || []).filter(z => Array.isArray(z) && SYNC_STORES.includes(z[0]) && z[1]).map(([st, key, mt]) => ({ id: st + '|' + key, s: st, key, mt: +mt || 0 }));
  return { recs, tombs, prefs: pk.p || null };
}
async function syncMerge(pk) {
  if (resetting || READONLY) return 0;
  await loadLocal();
  const { recs, tombs, prefs: pr } = syncUnpack(pk);
  const T = new Map(local.tombs.map(z => [z.id, z]));
  let n = 0;
  for (const tb of tombs) {
    const old = T.get(tb.id); if (old && old.mt >= tb.mt) continue;
    T.set(tb.id, tb);
    const cur = local[tb.s].find(z => z.id === tb.key);
    if (cur && mtOf(cur) > tb.mt) { await Store.put('tombs', tb); continue; } // changed here after it was deleted there: keep it
    if (cur) { await Store.del(tb.s, tb.key, tb.mt); n++; } else await Store.put('tombs', tb);
  }
  for (const st of SYNC_STORES) for (const x of recs[st]) {
    const tb = T.get(st + '|' + x.id); if (tb && tb.mt >= mtOf(x)) continue;
    const cur = local[st].find(z => z.id === x.id); if (cur && mtOf(cur) >= mtOf(x)) continue;
    await Store.put(st, x, true); n++;
  }
  if (pr && (pr.mt || 0) > (prefs.prefsMt || 0)) { for (const k of SYNC_PREFS) if (pr[k] !== undefined) prefs[k] = pr[k]; if (!Array.isArray(pr.langs) || !pr.langs.length) delete prefs.langs; prefs.prefsMt = pr.mt; savePrefs(true); n++; } // no languages there: all languages
  migrated = false; await refreshAll();
  return n;
}
// pack ⇄ text: deflate + base64url ('z'), or plain JSON in base64url ('j') where the browser cannot compress
const b64u = bytes => { let str = ''; for (let i = 0; i < bytes.length; i += 0x8000) str += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = str => { const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
async function deflate(bytes, pack) {
  const ts = new (pack ? CompressionStream : DecompressionStream)('deflate-raw');
  const wr = ts.writable.getWriter(); wr.write(bytes).catch(() => {}); wr.close().catch(() => {});
  const rd = ts.readable.getReader(), parts = []; let len = 0;
  for (;;) { const { value, done } = await rd.read(); if (done) break; parts.push(value); len += value.length; }
  const out = new Uint8Array(len); let o = 0; for (const c of parts) { out.set(c, o); o += c.length; } return out;
}
async function encodePack(pk) {
  const raw = new TextEncoder().encode(JSON.stringify(pk));
  if (typeof CompressionStream === 'function') { try { return 'z' + b64u(await deflate(raw, true)); } catch (e) {} }
  return 'j' + b64u(raw);
}
async function decodePack(code) {
  const bytes = unb64u(code.slice(1));
  const raw = code[0] === 'z' ? await deflate(bytes, false) : bytes;
  return JSON.parse(new TextDecoder().decode(raw));
}
const pageUrl = () => location.href.split('#')[0];
const transferUrl = () => PAGE_PATH ? new URL(APP_HOME, pageUrl()).href : pageUrl();
const QR_MAX = 1400; // characters: a denser code is hard to read from a screen
const QR_LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/dist/qrcode.js';
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); }); }
function qrSvg(text) {
  const q = window.qrcode(0, 'L'); q.addData(text); q.make();
  const n = q.getModuleCount(); let path = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (!q.isDark(r, c)) continue; let e = c; while (e + 1 < n && q.isDark(r, e + 1)) e++; path += `M${c + 4} ${r + 4}h${e - c + 1}v1h-${e - c + 1}z`; c = e; }
  return `<svg class="qr" viewBox="0 0 ${n + 8} ${n + 8}" role="img" aria-label="${esc(t('mv_qr_label'))}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}
let moveLinkNow = '';
async function makeMoveLink() {
  const out = $('#mv-out'); if (!out) return;
  const pk = await syncPack();
  const link = transferUrl() + '#move=' + await encodePack(pk);
  let qrLink = link, part = 0;
  for (let lv = 1; qrLink.length > QR_MAX && lv <= 3; lv++) { qrLink = transferUrl() + '#move=' + await encodePack(slimPack(pk, lv)); part = lv; }
  let qr = '';
  if (qrLink.length <= QR_MAX) {
    try { if (!window.qrcode) await loadScript(QR_LIB); qr = `<figure class="mv-qr">${qrSvg(qrLink)}<figcaption class="small">${esc(t(part ? 'mv_scan_part' : 'mv_scan'))}</figcaption></figure>`; }
    catch (e) { qr = `<p class="note">${esc(t('mv_fail_qr'))}</p>`; }
  } else qr = `<p class="note">${esc(t('mv_noqr'))}</p>`;
  moveLinkNow = link;
  out.innerHTML = `${qr}<div class="field"><label for="mv-link">${esc(t('mv_link_label'))}</label><input id="mv-link" type="text" readonly value="${esc(link)}"></div>
    <div class="row"><button class="btn" id="mv-copy">${esc(t('mv_copy'))}</button>${navigator.share ? `<button class="btn" id="mv-share">${esc(t('mv_share'))}</button>` : ''}</div>
    <p class="small">${esc(t('mv_warn'))}</p>`;
  out.hidden = false;
}
let movePack = null;
function openMoveDialog(pk) {
  movePack = pk; const m = $('#move-dialog'); const r = pk.r || {}, P = r.positions || [], B = r.bookmarks || [];
  const parts = [['mv_n_places', P.length], ['mv_n_done', B.filter(b => b.type === 'done').length], ['mv_n_notes', B.filter(b => b.note).length], ['mv_n_marks', B.filter(b => b.type === 'work' || b.type === 'pos').length], ['mv_n_links', (r.links || []).length]].filter(z => z[1]).map(([k, n]) => t(k, { n }));
  m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="mv-title">
    <h3 id="mv-title">${esc(t('mv_q_h'))}</h3>${parts.length ? `<p class="small">${esc(parts.join(' · '))}</p>` : ''}
    <p>${esc(t('mv_q'))}</p>
    <div class="modal-actions"><button class="btn btn-primary" data-mvgo="1">${esc(t('mv_go'))}</button><button class="btn btn-ghost" data-mvclose="1">${esc(t('mv_later'))}</button></div></div>`;
  m.hidden = false; const go = m.querySelector('[data-mvgo]'); if (go && go.focus) go.focus();
}
function closeMove() { const m = $('#move-dialog'); if (m.hidden) return; m.hidden = true; m.innerHTML = ''; movePack = null; }
async function checkMoveLink() {
  const h = location.hash;
  if (h.startsWith('#sync=')) {
    try { history.replaceState(history.state, '', pageUrl()); } catch (e) {}
    const key = h.slice(6);
    if (!/^[\w-]{43}$/.test(key)) return toast(t('mv_bad'));
    if (!syncAvailable()) return toast(t('sy_here_no', { u: 'foteev.github.io/unoebasta' }));
    if (READONLY) return toast(t('data_newer'));
    const st = syncState(); if (st && st.key === key) return syncNow();
    return openPairDialog(key);
  }
  if (!h.startsWith('#move=')) return;
  try { history.replaceState(history.state, '', pageUrl()); } catch (e) {}
  let pk = null; try { pk = await decodePack(h.slice(6)); } catch (e) {}
  if (!pk || !pk.r) return toast(t('mv_bad'));
  if ((+pk.v || 0) > SCHEMA) return toast(t('mv_newer'));
  if (READONLY) return toast(t('data_newer'));
  openMoveDialog(pk);
}
window.addEventListener('hashchange', () => { checkMoveLink(); });

/* ---------- sync through public Nostr relays ----------
   Your devices share one secret "shelf key" (32 random bytes), made here and carried once by a link or QR code
   (#sync=…, never sent to a server). From it come a Nostr signing key and a random label. The shelf (syncPack)
   is compressed, encrypted to itself with NIP-44 and published as one replaceable app-data event
   (kind 30078, NIP-78) to several relays run by different people. Relays see only ciphertext; the main copy
   stays in the browser, so a relay that forgets it only delays the next sync. Merge is syncMerge: newer mt wins. */
const SYNC_LS = 'fantastic-sync';
const RELAYS = ['wss://relay.primal.net', 'wss://nos.lol', 'wss://relay.damus.io', 'wss://nostr.mom', 'wss://relay.snort.social', 'wss://nostr.oxtr.dev'];
const NOSTR_LIB = 'https://cdn.jsdelivr.net/npm/nostr-tools@2.25.2/lib/nostr.bundle.js';
const SYNC_MAX = 28000; // characters of packed shelf: keeps one event under ~40 KB, which every relay above accepts
const syncState = () => { if (resetting) return null; try { return JSON.parse(localStorage.getItem(SYNC_LS) || 'null'); } catch (e) { return null; } };
const saveSync = st => { if (resetting) return; try { st ? localStorage.setItem(SYNC_LS, JSON.stringify(st)) : localStorage.removeItem(SYNC_LS); } catch (e) {} };
const toHex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
async function syncKeys(key) {
  const N = await nostrLib();
  const kb = unb64u(key), te = new TextEncoder();
  const dig = async s => { const a = te.encode(s), m = new Uint8Array(kb.length + a.length); m.set(kb); m.set(a, kb.length); return new Uint8Array(await crypto.subtle.digest('SHA-256', m)); };
  const sk = await dig('unoebasta/nostr-key'), d = toHex((await dig('unoebasta/label')).slice(0, 12));
  const pk = N.getPublicKey(sk);
  return { N, sk, pk, d, ck: N.nip44.getConversationKey(sk, pk) };
}
async function nostrLib() { if (!window.NostrTools) await loadScript(NOSTR_LIB); return window.NostrTools; }
let syncPoolObj = null;
const syncPool = N => syncPoolObj || (syncPoolObj = new N.SimplePool());
const syncAvailable = () => canNet() && !!(window.crypto && crypto.subtle);
let syncBusy = null, syncTimer = 0;
async function syncPush(force) {
  const st = syncState(); if (!st || READONLY || !syncAvailable()) return null;
  const { N, sk, d, ck } = await syncKeys(st.key);
  const pk = await syncPack();
  const h = hash(JSON.stringify({ ...pk, at: 0 }));
  if (!force && h === st.h) return 'same';
  let code = await encodePack(pk);
  for (let lv = 1; code.length > SYNC_MAX && lv <= 3; lv++) code = await encodePack(slimPack(pk, lv));
  if (syncState()?.key !== st.key) return null;
  const ev = N.finalizeEvent({ kind: 30078, created_at: Math.floor(Date.now() / 1000), tags: [['d', d]], content: N.nip44.encrypt(code, ck) }, sk);
  const res = await Promise.allSettled(syncPool(N).publish(RELAYS, ev));
  const ok = res.filter(r => r.status === 'fulfilled').length;
  if (syncState()?.key === st.key) saveSync({ ...syncState(), h: ok ? h : st.h, seen: ok ? ev.id : st.seen, at: ok ? Date.now() : st.at, ok });
  return ok;
}
async function syncPull() {
  const st = syncState(); if (!st || !syncAvailable()) return 0;
  const { N, pk, d, ck } = await syncKeys(st.key);
  const evs = await syncPool(N).querySync(RELAYS, { kinds: [30078], authors: [pk], '#d': [d] }, { maxWait: 5000 });
  if (syncState()?.key !== st.key) return 0;
  const ev = evs.filter(e => e.pubkey === pk).sort((a, b) => b.created_at - a.created_at)[0];
  saveSync({ ...syncState(), at: Date.now() });
  if (!ev || ev.id === st.seen) return 0;
  const pack = await decodePack(N.nip44.decrypt(ev.content, ck));
  if (syncState()?.key !== st.key) return 0;
  if ((+pack.v || 0) > SCHEMA) { toast(t('mv_newer')); return 0; }
  const n = await syncMerge(pack);
  if (syncState()?.key === st.key) saveSync({ ...syncState(), seen: ev.id });
  return n;
}
// pull, merge, then publish what this device has that the relays don't: everything converges after one round
function syncNow(quiet) {
  if (syncBusy) return syncBusy;
  if (!syncState() || !syncAvailable()) return Promise.resolve(null);
  syncUI('busy');
  syncBusy = (async () => {
    try { const n = await syncPull(); const ok = await syncPush(); syncUI(); return { n, ok }; }
    catch (e) { console.warn('[unoebasta] sync', e); syncUI('fail'); if (!quiet) toast(t('sy_fail')); return null; }
    finally { syncBusy = null; }
  })();
  return syncBusy;
}
// a local change: publish a few seconds later (several taps become one event)
function syncSoon() { if (!syncState()) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => { syncPush().then(() => syncUI()).catch(() => syncUI('fail')); }, 4000); }
let syncLast = 0;
document.addEventListener('visibilitychange', () => {
  if (!syncState()) return;
  if (document.visibilityState === 'hidden') { clearTimeout(syncTimer); syncPush().catch(() => {}); }
  else if (Date.now() - syncLast > 30000) { syncLast = Date.now(); syncNow(true); }
});
function newSyncKey() { return b64u(crypto.getRandomValues(new Uint8Array(32))); }
async function syncTurnOn(key) {
  saveSync({ key: key || newSyncKey(), since: Date.now() });
  const r = await syncNow();
  if (VIEW === 'shelf') await renderShelf();
  return r;
}
function syncTurnOff() { clearTimeout(syncTimer); saveSync(null); toast(t('sy_off_done')); if (VIEW === 'shelf') renderShelf(); }
const syncLink = () => { const st = syncState(); return st ? transferUrl() + '#sync=' + st.key : ''; };
function syncStatusText(mode) {
  const st = syncState(); if (!st) return '';
  if (mode === 'busy') return t('sy_status', { t: t('sy_syncing') });
  if (mode === 'fail') return t('sy_status', { t: t('sy_fail_short') });
  return t('sy_status', { t: st.at ? t('sy_when', { d: relTime(st.at) }) + (st.ok ? ' · ' + t('sy_servers', { n: st.ok, m: RELAYS.length }) : '') : t('sy_never') });
}
function syncUI(mode) { const el = document.getElementById('sy-status'); if (el) { el.textContent = syncStatusText(mode); el.dataset.mode = mode || 'ok'; } }
function syncPanelHtml() {
  if (!syncAvailable()) return `<p class="note">${esc(t('sy_here_no', { u: 'foteev.github.io/unoebasta' }))}</p>`;
  const st = syncState();
  if (!st) return `<p class="small">${esc(t('sy_what'))}</p><div class="row"><button class="btn btn-primary" id="sy-on">${esc(t('sy_on'))}</button></div>`;
  return `<p class="sync-st" id="sy-status" role="status">${esc(syncStatusText())}</p>
    <div class="row"><button class="btn btn-primary" id="sy-pair">${esc(t('sy_pair'))}</button><button class="btn" id="sy-now">${esc(t('sy_now'))}</button></div>
    <div id="sy-out" class="mv-out" hidden></div>
    <div class="row"><button class="btn btn-ghost btn-small" id="sy-off">${esc(t('sy_off'))}</button></div>`;
}
async function showSyncPair() {
  const out = $('#sy-out'); if (!out) return;
  const link = syncLink(); let qr = '';
  try { if (!window.qrcode) await loadScript(QR_LIB); qr = `<figure class="mv-qr">${qrSvg(link)}</figure>`; } catch (e) { qr = `<p class="note">${esc(t('mv_fail_qr'))}</p>`; }
  moveLinkNow = link;
  out.innerHTML = `${qr}<div class="field"><label for="mv-link">${esc(t('sy_link_label'))}</label><input id="mv-link" type="text" readonly value="${esc(link)}"></div>
    <div class="row"><button class="btn" id="mv-copy">${esc(t('mv_copy'))}</button>${navigator.share ? `<button class="btn" id="mv-share">${esc(t('mv_share'))}</button>` : ''}</div>
    <p class="small">${esc(t('sy_scan'))}</p>`;
  out.hidden = false;
}
let pairKey = null;
function openPairDialog(key) {
  pairKey = key; const m = $('#move-dialog'); const st = syncState();
  m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="sy-title">
    <h3 id="sy-title">${esc(t('sy_q_h'))}</h3><p>${esc(t('sy_q'))}</p>${st && st.key !== key ? `<p class="note note-warn">${esc(t('sy_q_replace'))}</p>` : ''}
    <div class="modal-actions"><button class="btn btn-primary" data-sygo="1">${esc(t('sy_go'))}</button><button class="btn btn-ghost" data-mvclose="1">${esc(t('mv_later'))}</button></div></div>`;
  m.hidden = false; const go = m.querySelector('[data-sygo]'); if (go && go.focus) go.focus();
}

/* ---------- export / import of everything local ---------- */
async function exportAll() { await loadLocal(); return JSON.stringify({ app: 'unoebasta', v: SCHEMA, at: new Date().toISOString(), data: { ...local, prefs } }); }
async function importAll(text) {
  let j; try { j = JSON.parse(text); } catch (e) { return toast(t('import_bad')); }
  if (!j || !['fantastic', 'unoebasta'].includes(j.app) || !j.data) return toast(t('import_bad'));
  const from = +j.v || 2;
  if (from > SCHEMA) return toast(t('import_newer'));
  if (READONLY) return toast(t('data_newer'));
  const data = migrateData(JSON.parse(JSON.stringify(j.data)), from);
  let n = 0; for (const s of STORES) for (const rec of (data[s] || [])) { if (rec && rec.id) { await Store.put(s, rec, true); n++; } }
  if (data.prefs) { const keep = { lang: prefs.lang }; prefs = Object.assign(prefs, data.prefs, keep); savePrefs(); applyTheme(); }
  migrated = false; toast(t('import_done', { n })); refreshAll();
}
