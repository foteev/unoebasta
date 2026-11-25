// Build-inlined classic-script fragment bundled by scripts/build-web.mjs; shares page global scope; do not import in Node.
/* ---------- phone voice: the browser's own text-to-speech, reading inside our reader ----------
   speechSynthesis (Chrome, Safari on iPhone, Firefox) uses the voices of the device itself.
   The text goes out in short sentences (long utterances get cut in some browsers), two ahead.
   The paragraph being read is marked and kept in view, so the reading place is saved as you listen. */
const RATES = [0.8, 1, 1.2, 1.4];
function ttsOK() { return !!(window.speechSynthesis && window.SpeechSynthesisUtterance); }
function fmtRate(r) { return String(r).replace('.', LANG === 'en' ? '.' : ',') + '×'; }
let SAY = null;        // { blocks, items: [{ bi, k, n, text }], pos, sent, playing, gen, lang, voice }
let pendingSay = false; // a card asked for the phone voice: start once the text is open
let wakeLock = null;
async function wakeOn() { try { if (navigator.wakeLock && !wakeLock && document.visibilityState === 'visible') { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) { wakeLock = null; } }
function wakeOff() { try { if (wakeLock) wakeLock.release(); } catch (e) {} wakeLock = null; }
// the language of the text, not of the interface
function textLang(s) {
  const x = (s || '').slice(0, 4000); const cyr = (x.match(/[а-яё]/gi) || []).length, lat = (x.match(/[a-z]/gi) || []).length;
  if (cyr > lat) return 'ru-RU';
  if ((x.match(/[ąćęłńśźż]/gi) || []).length > Math.max(3, lat / 300)) return 'pl-PL';
  return 'en-US';
}
// sentences joined up to max characters; very long sentences are cut at a space
function sayChunks(text, max) {
  const flat = (text || '').replace(/\s+/g, ' ').trim(); if (!flat) return [];
  const parts = flat.replace(/([.!?…]+["»”’)\]]*)\s+/g, '$1\u0001').split('\u0001');
  const out = []; let cur = '';
  for (let p of parts) {
    while (p.length > max) { let k = p.lastIndexOf(' ', max); if (k < max / 2) k = max; if (cur) { out.push(cur.trim()); cur = ''; } out.push(p.slice(0, k).trim()); p = p.slice(k).trim(); }
    if (cur && (cur + ' ' + p).length > max) { out.push(cur.trim()); cur = p; } else cur = cur ? cur + ' ' + p : p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}
function pickVoice(lang) {
  let vs = []; try { vs = speechSynthesis.getVoices() || []; } catch (e) {}
  const base = lang.slice(0, 2).toLowerCase(); const norm = v => (v.lang || '').replace('_', '-').toLowerCase();
  const m = vs.filter(v => norm(v).startsWith(base)); if (!m.length) return null;
  const exact = m.filter(v => norm(v) === lang.toLowerCase()); const pool = exact.length ? exact : m;
  return pool.find(v => /natural|neural|enhanced|premium|google/i.test(v.name)) || pool.find(v => v.default) || pool[0];
}
// iPhone Safari lets a page speak only from a tap; a silent word inside the tap opens the way for what follows
function sayUnlock() { if (!ttsOK()) return; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {} }
function sayWork(q) {
  if (!phoneOK(q)) return;
  sayUnlock(); pendingSay = true;
  return openFile(fileOf(q).id);
}
async function sayStart() {
  if (!R || !ttsOK()) return;
  sayStop(); sayUnlock();
  const blocks = readerBlocks(); if (!blocks.length) return;
  const items = [];
  blocks.forEach((b, bi) => { const ch = sayChunks(b.textContent, 220); ch.forEach((text, k) => items.push({ bi, k, n: ch.length, text })); });
  if (!items.length) return;
  const p = currentPlace() || { i: 0, r: 0 };
  let pos = items.findIndex(it => it.bi >= p.i); if (pos < 0) pos = 0;
  const f = items[pos]; if (f.bi === p.i && f.n > 1) pos += Math.min(f.n - 1, Math.floor(p.r * f.n));
  const lang = textLang($('#rbody').textContent);
  let vs = []; try { vs = speechSynthesis.getVoices() || []; } catch (e) {} if (vs.length && !pickVoice(lang)) { toast(t('say_novoice')); return; }
  SAY = { blocks, items, pos, sent: pos, playing: true, gen: 1, lang, voice: pickVoice(lang) };
  sayMark(); sayUI(); sayPump(SAY.gen); wakeOn();
}
function speakOne(text, queue) {
  const S = SAY; const rate = prefs.ttsRate || 1;
  return new Promise((res, rej) => {
    const u = new SpeechSynthesisUtterance(text); u.lang = S.lang; u.rate = rate; if (S.voice) u.voice = S.voice;
    u.onend = () => res(); u.onerror = e => rej(e); speechSynthesis.speak(u);
  });
}
function sayPump(gen) {
  const S = SAY; if (!S || S.gen !== gen || !S.playing) return;
  const AHEAD = 2;
  while (S.sent < S.items.length && S.sent - S.pos < AHEAD) {
    const i = S.sent++;
    let pr; try { pr = speakOne(S.items[i].text, i === S.pos ? 0 : 1); } catch (e) { pr = Promise.reject(e); }
    Promise.resolve(pr).then(() => sayDone(gen, i), e => sayErr(gen, e));
  }
}
function sayDone(gen, i) {
  const S = SAY; if (!S || S.gen !== gen) return;
  S.pos = i + 1;
  if (S.pos >= S.items.length) { sayStop(); savePosition(); const rd = $('#rdone'); if (rd && rd.scrollIntoView) rd.scrollIntoView({ block: 'center', behavior: 'smooth' }); toast(t('say_end')); return; }
  sayMark(); sayPump(gen);
}
function sayErr(gen, e) {
  const S = SAY; if (!S || S.gen !== gen) return;
  const msg = String((e && (e.error || e.message)) || e || '');
  if (/interrupted|cancel/i.test(msg)) return;
  sayStop(); toast(t(/language|voice|support/i.test(msg) ? 'say_novoice' : 'say_fail'));
}
function engineStop() { try { speechSynthesis.cancel(); } catch (e) {} }
function sayRestart() { const S = SAY; if (!S) return; S.gen++; engineStop(); sayMark(); if (S.playing) { S.sent = S.pos; const g = S.gen; setTimeout(() => sayPump(g), 80); } sayUI(); }
function sayToggle() {
  const S = SAY; if (!S) return sayStart();
  if (S.playing) { S.playing = false; S.gen++; engineStop(); wakeOff(); savePosition(); sayUI(); return; }
  S.playing = true; sayUnlock(); sayRestart(); wakeOn();
}
// ⏮ goes to the start of this paragraph, or to the previous one when this one has just begun; ⏭ to the next
function sayJump(dir) {
  const S = SAY; if (!S) return; const cur = S.items[Math.min(S.pos, S.items.length - 1)]; let j = Math.min(S.pos, S.items.length - 1);
  if (dir > 0) { while (j < S.items.length && S.items[j].bi === cur.bi) j++; if (j >= S.items.length) return; }
  else { while (j > 0 && S.items[j - 1].bi === cur.bi) j--; if (j === S.pos && j > 0) { const pb = S.items[j - 1].bi; while (j > 0 && S.items[j - 1].bi === pb) j--; } }
  S.pos = j; sayRestart();
}
function sayRate() {
  const r = prefs.ttsRate || 1; prefs.ttsRate = RATES[(RATES.indexOf(r) + 1) % RATES.length] || 1; savePrefs();
  if (SAY && SAY.playing) sayRestart(); else sayUI();
}
// mark the paragraph being read and keep it near the top; inside a long paragraph follow the sentence roughly
function sayMark() {
  const S = SAY; if (!S) return; const it = S.items[S.pos]; if (!it) return; const b = S.blocks[it.bi]; if (!b) return;
  const old = $('#rbody > .saying'); if (old !== b) { if (old) old.classList.remove('saying'); b.classList.add('saying'); }
  const box = $('#reader'); const tall = b.offsetHeight > box.clientHeight * 0.5;
  const top = Math.max(0, b.offsetTop + (tall ? b.offsetHeight * it.k / it.n : 0) - barH() - 12);
  if ((old !== b || tall) && Math.abs(box.scrollTop - top) > 24) {
    const smooth = document.visibilityState === 'visible' && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (smooth && typeof box.scrollTo === 'function') box.scrollTo({ top, behavior: 'smooth' }); else box.scrollTop = top;
    clearTimeout(sayMark._t); sayMark._t = setTimeout(savePosition, smooth ? 800 : 0);
  }
}
function sayUI() {
  const S = SAY; const el = $('#rsay'); const btn = $('#r-say');
  if (btn) btn.setAttribute('aria-pressed', String(!!S));
  if (!el) return; el.hidden = !S; if (!S) return;
  const pb = $('#s-play'); pb.innerHTML = S.playing ? ICON.pause : ICON.play; pb.setAttribute('aria-label', t(S.playing ? 's_pause' : 's_play')); pb.title = t(S.playing ? 's_pause' : 's_play');
  $('#s-rate').textContent = fmtRate(prefs.ttsRate || 1);
}
function sayStop() {
  const S = SAY; if (!S) return; SAY = null;
  engineStop(); wakeOff(); clearTimeout(sayMark._t);
  const c = $('#rbody > .saying'); if (c) c.classList.remove('saying');
  sayUI();
}

