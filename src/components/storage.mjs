// Build-inlined classic-script fragment bundled by scripts/build-web.mjs; shares page global scope; do not import in Node.
/* ---------- storage (IndexedDB, with an in-memory fallback) ---------- */
const SHELF_STORES = ['files', 'positions', 'links', 'suggestions', 'bookmarks'];
const STORES = [...SHELF_STORES, 'tombs'];
const SYNC_STORES = ['positions', 'bookmarks', 'links']; // what travels between devices (never files or suggestions)
const META = 'meta';      // the schema number and backup copies made before a migration
const DB_NAME = 'fantastic';
const IDB_VERSION = 4;    // layout of the stores (3 added 'meta', 4 added 'tombs'); SCHEMA below is the shape of the records inside
const mem = Object.fromEntries([...STORES, META].map(s => [s, new Map()]));
let READONLY = false;     // data newer than this page, or a migration that failed: show it, never change it
let dbp = null;
function openDB() {
  if (resetting) return Promise.resolve(null);
  if (dbp) return dbp;
  dbp = new Promise(res => {
    // never wait for storage longer than 3 s: the page must render even if IndexedDB stalls
    const timer = setTimeout(() => { console.warn('[fantastic] IndexedDB timeout, using memory'); res(null); }, 3000);
    const done = v => { clearTimeout(timer); res(v); };
    try {
      const r = indexedDB.open(DB_NAME, IDB_VERSION);
      r.onupgradeneeded = () => { const d = r.result; [...STORES, META].forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); }); };
      r.onsuccess = () => {
        const d = r.result;
        if (resetting) { d.close(); done(null); return; }
        d.onversionchange = event => {
          d.close();
          if (event.newVersion === null) resetting = true;
        };
        done(d);
      };
      r.onerror = () => done(null); r.onblocked = () => done(null);
    } catch (e) { done(null); }
  });
  return dbp;
}
const reqP = r => new Promise(res => { const tm = setTimeout(() => res(undefined), 3000); r.onsuccess = () => { clearTimeout(tm); res(r.result); }; r.onerror = () => { clearTimeout(tm); res(undefined); }; });
const Store = {
  // keepMt: a record that came from another device keeps its own time; anything written here gets mt = now
  async put(s, obj, keepMt) { if (resetting || (READONLY && s !== META)) return; if (!keepMt && SYNC_STORES.includes(s)) { obj.mt = Date.now(); try { syncSoon(); } catch (e) {} } const d = await openDB(); if (resetting) return; if (!d) { mem[s].set(obj.id, obj); return; } try { await reqP(d.transaction(s, 'readwrite').objectStore(s).put(obj)); } catch (e) { mem[s].set(obj.id, obj); } },
  async get(s, id) { const d = await openDB(); if (!d) return mem[s].get(id); try { return await reqP(d.transaction(s).objectStore(s).get(id)); } catch (e) { return mem[s].get(id); } },
  async all(s) { const d = await openDB(); if (!d) return [...mem[s].values()]; try { return (await reqP(d.transaction(s).objectStore(s).getAll())) || []; } catch (e) { return [...mem[s].values()]; } },
  // replace the content of every personal store in one transaction: all or nothing
  async replaceAll(data) {
    const d = await openDB();
    if (resetting) return;
    if (!d) { for (const s of STORES) { mem[s].clear(); for (const r of data[s] || []) mem[s].set(r.id, r); } return; }
    await new Promise((res, rej) => {
      const tx = d.transaction(STORES, 'readwrite');
      for (const s of STORES) { const os = tx.objectStore(s); os.clear(); for (const r of data[s] || []) os.put(r); }
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('abort'));
    });
  },
  async erase() {
    const d = await dbp;
    d?.close();
    dbp = null;
    if (window.indexedDB) {
      await new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = resolve;
        req.onerror = () => reject(req.error);
        req.onblocked = () => toast(t('shelf_reset_blocked'));
      });
    }
    for (const store of Object.values(mem)) store.clear();
  },
  async restoreShelf(rows, at) {
    const d = await openDB();
    if (resetting || READONLY) throw new Error('Shelf is read-only');
    const stores = Object.keys(rows).filter(s => rows[s].length);
    if (!stores.length) return;
    const mt = Math.max(Date.now(), at + 1);
    if (!d) {
      for (const s of stores) for (const row of rows[s]) {
        if (!mem[s].has(row.id)) mem[s].set(row.id, { ...row, mt });
      }
      return;
    }
    await new Promise((resolve, reject) => {
      const tx = d.transaction(stores, 'readwrite');
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error || new Error('Shelf restore aborted'));
      try {
        for (const s of stores) for (const row of rows[s]) {
          const add = tx.objectStore(s).add({ ...row, mt });
          // A record saved since deletion already has the reader's current value.
          add.onerror = event => { if (add.error?.name === 'ConstraintError') event.preventDefault(); };
        }
      } catch (error) {
        reject(error);
        tx.abort();
      }
    });
  },
  // a delete leaves a deletion mark, so the record does not come back from another device
  async del(s, id, tombMt) {
    if (resetting || (READONLY && s !== META)) return; const d = await openDB(); if (resetting) return; mem[s].delete(id);
    if (d) { try { await reqP(d.transaction(s, 'readwrite').objectStore(s).delete(id)); } catch (e) {} }
    if (SYNC_STORES.includes(s)) { await Store.put('tombs', { id: s + '|' + id, s, key: id, mt: tombMt || Date.now() }); if (!tombMt) try { syncSoon(); } catch (e) {} }
  },
};

/* ---------- your data across versions ----------
   Everything personal lives in this browser: IndexedDB stores + prefs in localStorage. SCHEMA is the shape of it.
   A new version of the page brings steps MIGRATIONS[n] (n-1 → n): pure functions on a plain copy
   { files, positions, links, suggestions, bookmarks, prefs }. On start, older data goes through the steps in order;
   before that a copy is kept (the two latest, without file bodies), and if a step fails everything is put back
   as it was and the page stays read-only. Export files carry their schema number and go through the same steps
   on import, so an old file always opens. Data newer than the page is shown but never changed.
   Rules for new steps: only add fields; never drop or rename one without a step; never touch files[].html;
   every step has a fixture in the tests. */
const SCHEMA = 4;
const enName = a => (AUTHORS[a] && AUTHORS[a].name && (AUTHORS[a].name.en || Object.values(AUTHORS[a].name)[0])) || '';
const bookOf = q => { const w = q && WORKS[q]; return w ? { title: w.title, by: w.authors.map(enName).join(', ') } : null; };
const MIGRATIONS = {
  // 2 → 3: every record gets a time (to merge two devices later) and a label of its book (to find it again by title and author)
  3: d => {
    const now = Date.now();
    for (const s of STORES) for (const r of d[s] || []) {
      if (!r.at) r.at = now;
      const q = r.workId || (s === 'links' ? r.id : null);
      if (!r.book && bookOf(q)) r.book = bookOf(q);
    }
    return d;
  },
  // 3 → 4: deletion marks travel too (store 'tombs'); records get mt = at, the time they last changed
  4: d => {
    d.tombs = d.tombs || [];
    for (const s of SYNC_STORES) for (const r of d[s] || []) if (!r.mt) r.mt = r.at || Date.now();
    return d;
  }
};
function migrateData(d, from) {
  for (let v = from + 1; v <= SCHEMA; v++) if (MIGRATIONS[v]) d = MIGRATIONS[v](d) || d;
  return d;
}
async function readAllData() { const d = {}; for (const s of STORES) d[s] = await Store.all(s); d.prefs = JSON.parse(JSON.stringify(prefs)); return d; }
const stripBodies = d => ({ ...d, files: (d.files || []).map(f => ({ ...f, html: undefined })) });
async function keepBackup(d, from) {
  await Store.put(META, { id: 'backup:' + Date.now(), from, at: Date.now(), data: stripBodies(d) });
  const old = (await Store.all(META)).filter(x => x.id.startsWith('backup:')).sort((a, b) => b.at - a.at).slice(2);
  for (const x of old) await Store.del(META, x.id);
}
function dataNote(key) {
  let el = document.getElementById('data-note');
  if (!el) { el = document.createElement('p'); el.id = 'data-note'; el.className = 'note note-warn data-note wrap'; el.setAttribute('role', 'status'); const m = document.querySelector('main'); m.insertBefore(el, m.firstChild); }
  el.textContent = t(key);
}
async function ensureSchema() {
  const meta = await Store.get(META, 'schema');
  let from = meta ? meta.v : null;
  if (from == null) { // first start of a versioned page: data from before is schema 2, an empty browser starts at the current one
    let any = false; for (const s of STORES) if ((await Store.all(s)).length) { any = true; break; }
    from = any ? 2 : SCHEMA;
  }
  if (from > SCHEMA) { READONLY = true; dataNote('data_newer'); return 'newer'; }
  if (from < SCHEMA) {
    const before = await readAllData();
    await keepBackup(before, from);
    try {
      const after = migrateData(JSON.parse(JSON.stringify(before)), from);
      for (const f of after.files || []) { const o = before.files.find(x => x.id === f.id); if (o) f.html = o.html; } // file bodies are never touched
      await Store.replaceAll(after);
      if (after.prefs) { prefs = Object.assign(prefs, after.prefs); savePrefs(); }
    } catch (e) {
      console.warn('[unoebasta] migration failed, data kept as it was', e);
      try { await Store.replaceAll(before); } catch (e2) {}
      READONLY = true; dataNote('data_fail'); return 'failed';
    }
  }
  if (!meta || meta.v !== SCHEMA) await Store.put(META, { id: 'schema', v: SCHEMA, at: Date.now() });
  return from < SCHEMA ? 'migrated' : 'ok';
}
