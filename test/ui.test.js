// Smoke test of the page in jsdom: catalog, news, awards board, author page, bookmarks, listening, reader,
// data across versions, moving the shelf to another device. Usage: npm run build && npm test
const path = require('path'), fs = require('fs');
const NM = process.argv[2] || path.join(__dirname, '..', 'node_modules'), PAGE = process.argv[3] || path.join(__dirname, '..', 'dist', 'web', 'index.html');
const { JSDOM } = require(path.join(NM, 'jsdom'));
const html = fs.readFileSync(PAGE, 'utf8').replace(/<script src=[^>]+><\/script>/g, '').replace(/<link[^>]+>/g, '');
const errors = [];
const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', {
  url: 'https://example.test/', runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(w) {
    w.localStorage.setItem('fantastic-prefs', JSON.stringify({ lang: 'ru' })); // returning user from 21.10
    w.scrollTo = () => {};
    if (!w.TextEncoder) { const u = require('util'); w.TextEncoder = u.TextEncoder; w.TextDecoder = u.TextDecoder; }
    w.CompressionStream = CompressionStream; w.DecompressionStream = DecompressionStream; // as in browsers
    if (!w.crypto.subtle) Object.defineProperty(w.crypto, 'subtle', { value: require('crypto').webcrypto.subtle });
    // a stand-in for nostr-tools and the relays: events are kept in memory, "encryption" is base64
    const relay = w.__relay = [];
    const pkOf = sk => Buffer.from(sk).toString('hex');
    w.NostrTools = {
      getPublicKey: pkOf,
      nip44: { getConversationKey: (sk, pk) => 'ck:' + pk, encrypt: (txt, ck) => 'enc:' + Buffer.from(txt).toString('base64'), decrypt: (c, ck) => Buffer.from(c.slice(4), 'base64').toString() },
      finalizeEvent: (tpl, sk) => ({ ...tpl, pubkey: pkOf(sk), id: 'e' + relay.length + Math.random().toString(36).slice(2, 6), sig: 'x' }),
      generateSecretKey: () => require('crypto').randomBytes(32),
      nip19: { decode: n => ({ type: 'npub', data: 'ab'.repeat(32) }) },
      nip17: { wrapEvent: (sk, to, text, subject) => ({ kind: 1059, pubkey: pkOf(sk), tags: [['p', to.publicKey]], content: 'sealed:' + Buffer.from(text).toString('base64'), id: 'w' + relay.length, created_at: 1 }) },
      SimplePool: class { publish(relays, ev) { relay.push(ev); return relays.map(() => Promise.resolve('')); } async querySync(relays, f) { return relay.filter(e => e.kind === f.kinds[0] && f.authors.includes(e.pubkey) && e.tags.some(t => t[0] === 'd' && f['#d'].includes(t[1]))); } }
    };
    try { w.eval(fs.readFileSync(path.join(NM, 'qrcode-generator/dist/qrcode.js'), 'utf8') + ';window.qrcode = qrcode;'); } catch (e) {} // the CDN QR library
    { const NZ = require(path.join(NM, 'jszip')); w.JSZip = { loadAsync: d => NZ.loadAsync(Buffer.from(new Uint8Array(d))) }; } // the CDN ZIP library (EPUB, DOCX, ODT); its browser build stalls in jsdom, so the Node build stands in
    if (!w.Blob.prototype.arrayBuffer) w.Blob.prototype.arrayBuffer = function () { return new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsArrayBuffer(this); }); }; // as in browsers
    w.navigator.clipboard = { writeText: async s => { w.__clip = s; } };
    w.addEventListener('error', e => errors.push(e.message));
    // a fake speechSynthesis: records what is said, ends each utterance when told
    w.__said = []; w.__cancels = 0;
    w.SpeechSynthesisUtterance = function (text) { this.text = text; this.lang = ''; this.rate = 1; this.volume = 1; };
    w.speechSynthesis = { getVoices: () => [{ name: 'English', lang: 'en-US', default: true }, { name: 'Русский', lang: 'ru-RU' }], speak(u) { w.__said.push(u); }, cancel() { w.__cancels++; const q = w.__said.splice(0); q.forEach(u => u.onerror && u.onerror({ error: 'interrupted' })); } };
    w.__endOne = () => { const i = w.__said.findIndex(u => u.onend); if (i < 0) return null; const u = w.__said.splice(i, 1)[0]; u.onend(); return u.text; };
  }
});
const w = dom.window, $ = s => w.document.querySelector(s), $$ = s => [...w.document.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async predicate => { const end = Date.now() + 2000; while (!predicate() && Date.now() < end) await sleep(20); };
const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
(async () => {
  await sleep(400);
  const checks = {};
  const nCatalog = w.eval('Object.keys(READ).filter(q => WORKS[q]).length'); // grows with every batch of found texts
  checks['catalog tab: every work with a text or audio'] = nCatalog >= 100 && $$('#view-library .slip').length === nCatalog;
  const news = $('#view-library .news');
  checks['news panel for returning user'] = !!news && /прошлого визита/.test(news.textContent);
  const nNews = w.eval('newsItems().length');
  checks['news: 5 newest + "and N more" (incl. new audio)'] = news && news.querySelectorAll('li').length === 6 && new RegExp('\\b' + (nNews - 5) + '\\b').test(news.querySelector('li:last-child').textContent);
  checks['quiet dot on the catalog tab, no number'] = $('#news-dot').hidden === false && $('#news-dot').textContent === '' && !!$('#tab-library #news-dot');
  // filter New
  click($('[data-fresh]')); await sleep(50);
  checks['filter New → only new works'] = $$('#view-library .slip').length === w.eval('Object.keys(READ).filter(q => WORKS[q] && isNew(q)).length') && $$('#view-library .slip').length < nCatalog;
  click($('[data-fresh]')); await sleep(50);
  // star a work
  const star = $('#view-library [data-star="Q25349436"]'); click(star); await sleep(50);
  checks['star toggles'] = $('#view-library [data-star="Q25349436"]').getAttribute('aria-pressed') === 'true';
  // awards tab — phone layout (no matchMedia in jsdom = narrow screen)
  click($('#tab-awards')); await sleep(50);
  checks['phone: no table'] = !$('#view-awards table.board');
  checks['phone: category picker'] = $$('#view-awards [data-av-cat]').length === 5;
  const ss = $$('#view-awards .yrow');
  checks['hugo short story list ~71'] = ss.length >= 68 && ss.length <= 74;
  checks['decade jump chips'] = $$('#view-awards [data-jump]').length >= 7;
  checks['text marks in rows'] = $$('#view-awards .yrow .tm').length >= 8;
  click($('#view-awards [data-av-year="2024"]')); await sleep(50);
  const yearText = $('#view-awards').textContent;
  checks['year 2024 view shows Kritzer twice'] = (yearText.match(/Kritzer|Критцер/g) || []).length >= 2;
  click($('#view-awards [data-av-clear]')); await sleep(50);
  click($('#view-awards [data-av-cat="N"]')); await sleep(50);
  checks['novel list ~75'] = $$('#view-awards .yrow').length >= 72;
  click($('#view-awards [data-av-sort]')); await sleep(50);
  checks['sort toggle → 1953 first'] = /1953/.test($('#view-awards .yrow').textContent);
  click($('#view-awards [data-av-award="l"]')); await sleep(50);
  checks['locus 8 category chips'] = $$('#view-awards [data-av-cat]').length === 9;
  // "All" by category: every award at once, one row per work, the awards named on it
  click($('#view-awards [data-av-award="all"]')); await sleep(50);
  click($('#view-awards [data-av-cat="S"]')); await sleep(50);
  const allRows = $$('#view-awards .yrow'), hugoS = w.eval("DATA.aw.filter(x => x[0] === 'h' && x[1] === 'S').length");
  checks['awards “All” by category: more than one award, no duplicates, awards named'] = $$('#view-awards [data-av-cat]').length === 5 && allRows.length > hugoS && allRows.length < w.eval("DATA.aw.filter(x => x[1] === 'S').length") && allRows.some(r => /,/.test((r.querySelector('.wmeta') || {}).textContent || '')) && /^Все/.test($('#view-awards .count-line').textContent);
  click($('#view-awards [data-av-cat="N"]')); await sleep(50);
  checks['awards “All” novels include Locus fantasy novels'] = $$('#view-awards .wmeta').some(m => /Локус · /.test(m.textContent));
  click($('#view-awards [data-av-mode="years"]')); await sleep(30);
  click($('#view-awards [data-av-award="all"]')); await sleep(50);
  const inp = $('#av-q'); inp.value = 'Le Guin'; inp.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(400);
  const found = $('#view-awards .count-line').textContent;
  checks['search Le Guin finds several'] = +found.match(/\d+/)[0] >= 8;
  const inp2 = $('#av-q'); inp2.value = ''; inp2.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(400);
  // one search over everything: any category, titles and authors in any language, year, magazine, topic
  click($('#view-awards [data-av-mode="cats"]')); await sleep(30);
  const aq = $('#av-q'); aq.value = 'ле гуин'; aq.closest('form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(80);
  checks['search: Awards searches every category, by a Russian author name, with a button'] = !!$('#view-awards form[data-sform] button[type="submit"]') && +$('#view-awards .count-line').textContent.match(/\d+/)[0] >= 8 && /Левая рука тьмы/.test($('#view-awards').textContent) && /Обделённые|Dispossessed/.test($('#view-awards').textContent);
  checks['search: the box stays while results change'] = $('#av-q') === aq && aq.value === 'ле гуин';
  click($('#view-awards [data-sclear]')); await sleep(60);
  checks['search: clear brings the board back'] = $('#av-q').value === '' && !!$('#view-awards [data-av-cat]');
  const S = qs => w.eval(`searchWorks(${JSON.stringify(qs)})`);
  checks['search: Polish and Russian titles'] = S('Diuna').includes('Q190192') && S('дюна').includes('Q190192');
  checks['search: Spanish titles of known translations'] = S('La mano izquierda de la oscuridad').includes('Q2008211') && S('el zoo de papel').includes('Q27903111');
  checks['search: accents and ё do not matter'] = S('Mieville').some(q => /Miéville/.test(w.eval(`AUTHORS[WORKS['${q}'].authors[0]].name.en`))) && S('ЛЕВАЯ РУКА ТЬМЫ').includes('Q2008211');
  checks['search: year, award and category words'] = S('хьюго 1966').includes('Q190192') && S('nebula 2015 short story').length >= 1;
  checks['search: magazine and topic'] = S('clarkesworld').length >= 10 && S('dragon').length >= 3;
  checks['search: titles rank above descriptions'] = S('dune')[0] === 'Q190192';
  click($('#tab-library')); await sleep(30);
  const lq = $('#lib-q'); lq.value = 'Kritzer'; lq.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(400);
  checks['search: Catalog shows free texts first, then other winners'] = $$('#view-library .slips .slip').length >= 2 && /Cat Pictures Please/.test($('#view-library .slips').textContent) && $('#lib-q') === lq;
  lq.value = ''; lq.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(400);
  checks['search: empty box → the whole catalog'] = $$('#view-library .slip').length === nCatalog;
  const iu = w.eval(`issueUrl({ kind: 'suggest', workId: 'Q25349436', url: 'https://x.test/a', lang: 'ru', type: 'full', comment: 'hi', at: 1 })`);
  const ir = w.eval(`issueUrl({ kind: 'report', workId: 'Q25349436', url: 'https://x.test/b', reason: 'dead', at: 1 })`);
  checks['suggestions: a ready GitHub issue, no account data in the page'] = iu.startsWith('https://github.com/foteev/unoebasta/issues/new?template=add-text.yml&') && iu.includes('url=https%3A%2F%2Fx.test%2Fa') && iu.includes('lang=Russian') && iu.includes('Cat%20Pictures%20Please') && ir.includes('template=broken-link.yml') && ir.includes('what=dead');
  // author page

  const kr = Object.keys(w.eval('AUTHORS')).find(k => w.eval('AUTHORS')[k].name.en === 'Naomi Kritzer');
  w.eval(`openAuthor('${kr}')`); await sleep(50);
  checks['author: 7 award rows, no table'] = $$('#sheet-author .wrow').length === 7 && !$('#sheet-author table');
  checks['author stats Hugo/Nebula/Locus'] = $$('#sheet-author .stat').length === 3;
  checks['author bio shown'] = /Kritzer/.test($('#sheet-author .bio').textContent);
  click($('#sheet-author [data-goaw^="n||"]')); await sleep(50);
  checks['author → awards view'] = !$('#view-awards').hidden && $('#view-awards [data-av-award="n"]').getAttribute('aria-pressed') === 'true';
  // wide screen: the board appears as an extra view
  w.matchMedia = q => ({ matches: /min-width: 900px/.test(q), addEventListener() {}, removeEventListener() {} });
  w.eval("AV.mode = 'table'; AV.award = 'h'; renderAwards()"); await sleep(30);
  checks['wide: board with 4 categories'] = $$('#view-awards table.board thead th button').length === 4 && $$('#view-awards table.board tbody tr').length >= 70;
  click($('#view-awards [data-av-award="all"]')); await sleep(30);
  const boardRows = $$('#view-awards table.board tbody tr[data-year]');
  const boardEntries = boardRows.flatMap(row => [...row.querySelectorAll('td')].flatMap(td => [...td.querySelectorAll('[data-work]')].map(b => `${row.dataset.year}|${td.dataset.category}|${b.dataset.work}`)));
  const expectedEntries = [...new Set(w.eval("DATA.aw.map(([a,c,y,q]) => y + '|' + (['SF','FN','HN','FT'].includes(c) ? 'N' : c) + '|' + q)"))];
  checks['all-awards board: every award record represented, no duplicate work/year/category'] = boardEntries.length === expectedEntries.length && new Set(boardEntries).size === boardEntries.length && expectedEntries.every(x => boardEntries.includes(x));
  checks['all-awards board: All stays selected and every entry names its awards'] = w.eval("AV.award === 'all'") && $('#view-awards [data-av-award="all"]').getAttribute('aria-pressed') === 'true' && $$('#view-awards table.board .award-meta').length === boardEntries.length && $$('#view-awards table.board .award-meta').some(x => /Хьюго; Небьюла/.test(x.textContent));
  checks['all-awards board: Locus novel subcategories and tied winners remain visible'] = $$('#view-awards table.board [data-category="N"] .award-meta').some(x => /Локус · Фэнтези-роман/.test(x.textContent)) && expectedEntries.filter(x => x.startsWith('1966|N|')).every(x => boardEntries.includes(x));
  click($('#view-awards [data-av-mode="years"]')); await sleep(30);
  checks['all-awards by year: same winners as board, grouped by category with award labels'] = $$('#view-awards .yearsec .wrow').length === boardEntries.length && w.eval("AV.award === 'all'") && $$('#view-awards .yearsec .wmeta').every(x => /Хьюго|Небьюла|Локус/.test(x.textContent));
  click($('#view-awards [data-av-mode="table"]')); await sleep(30);
  click($('#view-awards [data-av-cat-go="N"]')); await sleep(30);
  checks['all-awards board → category: All remains selected and no novel winners lost'] = w.eval("AV.award === 'all' && AV.cat === 'N' && AV.mode === 'cats'") && $$('#view-awards .yrow').length === boardEntries.filter(x => x.split('|')[1] === 'N').length;
  click($('#view-awards [data-av-mode="table"]')); await sleep(30);
  click($('#view-awards [data-av-text]')); await sleep(30);
  checks['all-awards board: text filter applies to every award and leaves no empty years'] = $$('#view-awards table.board .cell').length > 0 && $$('#view-awards table.board .cell').every(x => w.eval(`hasText('${x.dataset.work}') || isMine('${x.dataset.work}')`)) && $$('#view-awards table.board tbody tr').every(x => !!x.querySelector('.cell'));
  click($('#view-awards [data-av-text]')); await sleep(30);
  click($('#view-awards [data-av-year="2024"]')); await sleep(30);
  checks['all-awards board → year: every award and return to board'] = $$('#view-awards .yearsec h3').length === 3 && w.eval("AV.award === 'all' && AV.mode === 'table'");
  click($('#view-awards [data-av-clear]')); await sleep(30);
  w.matchMedia = undefined; w.eval("renderAwards()");
  checks['back to phone: all awards without a table; desktop choice preserved'] = !$('#view-awards table.board') && w.eval("AV.award === 'all' && AV.mode === 'table'") && $('#view-awards [data-av-mode="cats"]').getAttribute('aria-pressed') === 'true';
  w.matchMedia = q => ({ matches: /min-width: 900px/.test(q) }); w.eval('renderAwards()');
  checks['back to desktop: all-awards board restored'] = !!$('#view-awards table.board') && $('#view-awards [data-av-award="all"]').getAttribute('aria-pressed') === 'true';
  w.matchMedia = undefined; w.eval('renderAwards()');
  w.eval("Object.assign(AV,{award:'all',cat:'all',mode:'cats',onlyText:false,year:null,q:''}); renderAwards()");
  checks['all categories: every work/year once, categories and prizes labelled'] = $$('#view-awards .yrow').length === w.eval("new Set(DATA.aw.map(x=>x[2]+'|'+x[3])).size") && $$('#view-awards .wmeta').every(x=>x.textContent.includes(' · ')) && $('#view-awards [data-av-cat="all"]').getAttribute('aria-pressed') === 'true';
  click($('#view-awards [data-av-mode="authors"]')); await sleep(40);
  checks['authors: direct author cards and winning works are discoverable'] = $$('#view-awards .author-open').length > 100 && !!$('#view-awards [data-author="Q314553"]') && $$('#view-awards .authorsec .wrow').length > 500;
  click($('#view-awards [data-author="Q314553"]')); await sleep(30);
  checks['authors: name opens biography and award history'] = !$('#sheet-author').hidden && /Силверберг/.test($('#sheet-author h2').textContent) && $$('#sheet-author .wrow').length > 3;
  w.eval('closeSheets()');
  click($('#view-awards [data-av-award="n"]')); click($('#view-awards [data-av-cat="S"]')); click($('#view-awards [data-av-text]')); await sleep(40);
  const authorWorks=$$('#view-awards .authorsec [data-work]');
  checks['authors: award, category and text filters apply together'] = authorWorks.length > 0 && authorWorks.every(el=>w.eval(`WORKS['${el.dataset.work}'].awards.some(a=>a[0]==='n'&&a[1]==='S') && (hasText('${el.dataset.work}')||isMine('${el.dataset.work}'))`));
  w.eval("Object.assign(AV,{award:'h',cat:'S',mode:'cats',onlyText:false,q:''}); renderAwards()");
  // work card for a catalog-only work (Dune)
  const dune = Object.values(w.eval('WORKS')).find(x => x.title === 'Dune');
  w.eval(`openWork('${dune.id}')`); await sleep(50);
  checks['dune card: excerpt note instead of full text + own link'] = /Бесплатный фрагмент или предпросмотр/.test($('#sheet-work').textContent) && !/Бесплатного легального текста/.test($('#sheet-work').textContent) && !!$('#own-link');
  checks['titles: no Wikipedia notes such as (рассказ Ле Гуин) in a title'] = w.eval("WORKS.Q21404517.titles.ru") === 'Сур' && w.eval("bareTitle('Kamienne niebo (powieść N.K. Jemisin)')") === 'Kamienne niebo' && w.eval("bareTitle('Rok 1984 (wydanie II)')") === 'Rok 1984 (wydanie II)';
  checks['titles: the work is called by its Russian title, the original underneath'] = $('#sheet-work h2').textContent === 'Дюна' && $('#sheet-work .alt').textContent === 'Оригинальное название: Dune';
  // own link with a note
  $('#own-link').value = 'https://example.org/dune-pl'; $('#own-note').value = 'Polski przekład, test';
  click($('#own-link-save')); await sleep(80);
  checks['own link + note saved'] = w.eval("local.links.some(l => l.url === 'https://example.org/dune-pl' && l.note === 'Polski przekład, test')") && /Polski przekład, test/.test($('#sheet-work .saved-link').textContent);
  checks['own link: saved as a card with a check mark, the form folds away'] = /✓/.test($('#own-card .saved-ok').textContent) && $('#own-form').hidden && !$('#own-card').hidden;
  click($('#own-link-edit')); await sleep(30);
  const editing = !$('#own-form').hidden && $('#own-card').hidden && $('#own-link').value === 'https://example.org/dune-pl';
  click($('#own-link-cancel')); await sleep(30);
  checks['own link: Edit opens the form, Cancel brings the card back'] = editing && $('#own-form').hidden && !$('#own-card').hidden;
  // offline file with a name: saved via the import path, then renamed
  const rec = await w.eval("saveFile({ title: 'Dune (EPUB)', byline: 'Frank Herbert', html: '<p>Text</p>', format: 'epub', workId: '" + dune.id + "', note: 'Русский перевод' })");
  w.eval(`openWork('${dune.id}')`); await sleep(80);
  checks['file row shows name'] = /Русский перевод/.test($('#sheet-work').textContent) && /Dune \(EPUB\)/.test($('#sheet-work').textContent) && !!$('#work-file-note');
  click($(`#sheet-work [data-notefile="${rec.id}"]`)); await sleep(30);
  const fin = $(`#fn-${rec.id}`); fin.value = 'Перевод П. Вязникова';
  fin.closest('form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(80);
  checks['file rename saved'] = w.eval(`local.files.find(f => f.id === '${rec.id}').note`) === 'Перевод П. Вязникова' && /Перевод П. Вязникова/.test($('#sheet-work').textContent);
  // ElevenReader on a readable work (web: copies link)
  w.eval(`openWork('Q130213759')`); await sleep(50);
  click($('#sheet-work button[data-eleven]')); await sleep(60);
  const dlg = $('#eleven-dialog');
  checks['eleven: copies link and shows confirmation'] = w.__clip === 'https://clarkesworldmagazine.com/kritzer_05_23/' && !dlg.hidden && dlg.querySelectorAll('.steps li').length === 3 && dlg.querySelector('.steps li').classList.contains('done') && /kritzer_05_23/.test(dlg.querySelector('.copybox').textContent);
  checks['eleven: dialog opens import window'] = $('#ed-open').getAttribute('href') === 'https://elevenreader.io/reader/library?dialog=import' && $('#ed-open').target === '_blank';
  click($('#eleven-dialog [data-edclose]')); await sleep(30);
  checks['eleven: cancel closes'] = $('#eleven-dialog').hidden;
  checks['eleven: the listen is remembered in the reading history'] = w.eval("!!posFor('ext:Q130213759') && posFor('ext:Q130213759').via === 'eleven'");
  await w.eval("(async () => { for (const p of local.positions.filter(p => p.ext)) await Store.del('positions', p.id); for (const r of local.bookmarks.filter(b => b.ext)) await Store.del('bookmarks', r.id); await loadLocal(); renderCatalog(); })()");
  // reader bookmark on demo
  w.eval('closeSheets(); openDemo()'); await sleep(80);
  click($('#r-bm')); await sleep(50);
  checks['reader bookmark stored'] = w.eval("local.bookmarks.filter(b => b.type === 'pos').length") === 1;
  click($('#r-bmlist')); await sleep(30);
  checks['reader bookmark list'] = $$('#rmarks .mk').length === 1;
  click($('#r-close')); await sleep(80);
  click($('#tab-shelf')); await sleep(80);
  checks['shelf shows own link note'] = /Polski przekład, test/.test($('#view-shelf').textContent);
  checks['shelf: every panel starts collapsed with a keyboard-accessible summary'] = $$('#view-shelf > details').length === 9 && $$('#view-shelf > details').every(el => !el.open && el.querySelector('summary h4') && el.querySelector('summary svg'));
  click($('#shelf-bm summary')); await sleep(30);
  await w.eval('renderShelf()');
  checks['shelf: an expanded panel stays open after rendering'] = $('#shelf-bm').open;
  checks['shelf shows bookmarks'] = /Закладки/.test($('#view-shelf').textContent) && $$('#view-shelf [data-gobm]').length === 1 && /Cat Pictures Please/.test($('#view-shelf').textContent);
  // mark news seen
  click($('#tab-library')); await sleep(30); click($('#news-seen')); await sleep(30);
  checks['news cleared'] = !$('#view-library .news') && $('#news-dot').hidden;
  // recall: a reading session leaves a recall record, leaving asks for a note, the start screen and reopening remind
  const submit = f => f.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  const age = "for (const x of [...local.positions, ...local.bookmarks]) if (x.id === 'demo:ru' || x.key === 'demo:ru') { x.at -= 2 * 864e5; x.pct = 40; x.text = 'Утром мы поехали к морю'; x.chapter = 'Глава 2'; }";
  w.eval('openDemo()'); await sleep(80);
  w.eval('R.started = Date.now() - 100e3; savePosition()'); await sleep(30);
  checks['recall: session record'] = w.eval("local.bookmarks.filter(b => b.type === 'recall' && b.key === 'demo:ru').length") === 1;
  click($('#r-close')); await sleep(50);
  checks['recall: leaving asks for a note'] = !$('#exit-dialog').hidden && !$('#reader').hidden;
  $('#ex-note').value = 'Мира нашла письмо'; submit($('#ex-form')); await sleep(150);
  checks['recall: note saved, reader closed'] = $('#reader').hidden && $('#exit-dialog').hidden && w.eval("local.bookmarks.find(b => b.type === 'recall' && b.key === 'demo:ru').note") === 'Мира нашла письмо';
  w.eval(age + '; renderCatalog()'); await sleep(30);
  let rc = $('#view-catalog .recall');
  checks['recall: the start screen begins with it, no motto there'] = !!rc && $('#view-catalog').firstElementChild === rc && !$('#view-catalog .motto') && !$('#view-catalog [data-view="library"]') && $('#view-about .motto').textContent === '20 minute adventure' && /Мира нашла письмо/.test(rc.textContent) && /40%/.test(rc.textContent) && /Глава 2/.test(rc.textContent) && /Утром мы поехали к морю/.test(rc.textContent);
  click(rc.querySelector('[data-rcnote]')); await sleep(20);
  rc.querySelector('form.rc-noteform textarea').value = 'Мира нашла письмо. Кто такой Ян?'; submit(rc.querySelector('form.rc-noteform')); await sleep(120);
  checks['recall: note edited on the card'] = /Кто такой Ян/.test($('#view-catalog .recall').textContent);
  w.eval('openDemo()'); await sleep(120);
  const rd = $('#recall-dialog');
  checks['recall: reopening after a break shows the reminder'] = !rd.hidden && /Кто такой Ян/.test(rd.textContent) && /40%/.test(rd.textContent) && !!$('#rbody .stop-here');
  click($('#recall-dialog [data-rdgo]')); await sleep(30);
  checks['recall: continue closes the reminder'] = rd.hidden && !$('#reader').hidden;
  w.eval('closeReader()'); await sleep(80);
  w.eval(age + '; renderCatalog()'); await sleep(30);
  click($('#view-catalog .recall [data-rcgo]')); await sleep(120);
  checks['recall: continue from the card skips a second reminder'] = !$('#reader').hidden && $('#recall-dialog').hidden;
  w.eval('closeReader()'); await sleep(80);
  click($('#view-catalog .recall [data-rchide]')); await sleep(60);
  checks['recall: hide from start screen'] = !$('#view-catalog .recall');
  // descriptions: FB2 annotation, Wikipedia text in the work card (collapsed, expands)
  const fbXml = '<?xml version="1.0" encoding="utf-8"?><FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0"><description><title-info><author><first-name>Ursula</first-name><last-name>Le Guin</last-name></author><book-title>Test</book-title><annotation><p>Первый абзац аннотации.</p><p>Второй.</p></annotation></title-info></description><body><section><p>Текст.</p></section></body></FictionBook>';
  w.__fb = fbXml;
  const fb = await w.eval("parseFb2(new TextEncoder().encode(window.__fb).buffer, 't.fb2')");
  checks['about: FB2 annotation read'] = fb.desc === 'Первый абзац аннотации.\nВторой.';
  await w.eval("Store.put('bookmarks', { id: 'a:w:Q130213759:en', type: 'about', workId: 'Q130213759', src: 'wiki', lang: 'en', title: 'Better Living Through Algorithms', text: 'A story about an app that tells people what to do. '.repeat(10), at: Date.now() })");
  await w.eval("Store.put('positions', { id: 'url:https://clarkesworldmagazine.com/kritzer_05_23/', workId: 'Q130213759', title: 'Better Living Through Algorithms', byline: 'Naomi Kritzer', pct: 55, text: 'Lettie opened the app again.', at: Date.now() - 3600e3 })");
  w.eval("openWork('Q130213759')"); await sleep(80);
  const ab = $('#about-slot .about');
  checks['about: work card shows collapsed description'] = !!ab && ab.classList.contains('clamp') && /wikipedia\.org/.test(ab.querySelector('a').href);
  click(ab.querySelector('[data-more]')); await sleep(20);
  checks['about: expands'] = !ab.classList.contains('clamp') && ab.querySelector('[data-more]').textContent === 'Свернуть';
  const wr = $('#sheet-work .recall-in');
  checks['recall: work card, web opens the original'] = !!wr && /55%/.test(wr.textContent) && /Lettie opened the app again/.test(wr.textContent) && !!wr.querySelector('a.btn-primary[href="https://clarkesworldmagazine.com/kritzer_05_23/"]');
  w.eval('closeSheets()');
  // excerpts and multi-part texts
  const dune2 = Object.values(w.eval('WORKS')).find(x => x.title === 'Dune');
  w.eval(`openWork('${dune2.id}')`); await sleep(60);
  checks['availability: Dune RU and PL = fragment (LitRes, Legimi)'] = /RU фрагмент/.test($('#sheet-work .avail').textContent) && /PL фрагмент/.test($('#sheet-work .avail').textContent) && !!$('#sheet-work a[href^="https://www.legimi.pl/ebook-diuna"]') && !!$('#sheet-work a[href^="https://www.litres.ru/"]');
  checks['excerpt: Dune shows LitRes fragment'] = !!$('#sheet-work a[href^="https://www.litres.ru/book/frenk-gerbert/"][href$="/chitat-onlayn/"]') && /Фрагмент · RU/.test($('#sheet-work').textContent);
  w.eval("openWork('Q53828903')"); await sleep(60);
  checks['excerpt: All Systems Red shows Reactor excerpt'] = !!$('#sheet-work a[href="https://reactormag.com/meet-murderbot-in-chapter-one-of-martha-wells-all-systems-red/"]');
  w.eval("openWork('Q25349436')"); await sleep(60);
  checks['availability: Cat Pictures Please EN = full text'] = /EN полный текст/.test($('#sheet-work .av-full').textContent);
  w.eval("openWork('Q19947428')"); await sleep(50);
  checks['audio pilot: Silverberg uses the published Russian title and sourced summary'] = $('#sheet-work h2').textContent === 'Раз солдат, два солдат...' && /виртуальные личности/.test($('#sheet-work #about-slot').textContent) && !!$('#about-slot a[href="https://fantlab.ru/work22792"]') && !/Википедия/.test($('#about-slot').textContent);
  checks['audio pilot: Russian text and audio are distinguished and source verification is visible'] = /RU полный текст · аудио/.test($('#sheet-work .avail').textContent) && !!$('#sheet-work a[href="https://flibusta.info/b/404336/read"]') && !!$('#sheet-work .audio-source a[href="https://www.youtube.com/watch?v=det3gpWwLWI"]') && /разрешение не подтверждено/.test($('#sheet-work .audio-source').textContent) && /полнота независимо не проверена/.test($('#sheet-work .audio-source').textContent);
  checks['audio pilot: original publisher text is retained'] = w.eval("READ.Q19947428.tier === 't2' && READ.Q19947428.links.some(l => l.kind === 'full' && /baen/.test(l.url))");
  const audioPref = w.eval('prefs.langs'), originalAudioLinks = w.eval('READ.Q19947428.links.slice()');
  w.eval("prefs.langs = ['ru']; READ.Q19947428.links.push({kind:'audio',lang:'en',site:'English narrator',url:'https://example.test/en-audio'},{kind:'audio',lang:'pl',site:'Polski lektor',url:'https://example.test/pl-audio'})");
  const audioOptions = w.eval("listenOpts('Q19947428')");
  checks['audio pilot: Listen chooses preferred language and offers all recordings'] = audioOptions.filter(x => x.type === 'audio').length === 3 && audioOptions[0].url === 'https://www.youtube.com/watch?v=det3gpWwLWI' && /русский/i.test(audioOptions[0].name) && /разрешение не подтверждено/.test(audioOptions[0].sub);
  w.__restoreAudio = originalAudioLinks; w.__restoreLangs = audioPref; w.eval('READ.Q19947428.links = window.__restoreAudio; prefs.langs = window.__restoreLangs');
  w.eval("openWork('Q41793715')"); await sleep(50);
  checks['audio pilot: external-only recording is not called publisher-authorized'] = /Внешний источник/.test($('#sheet-work .tier').textContent) && !/у издателя/.test($('#sheet-work .tier').textContent) && /RU аудио/.test($('#sheet-work .avail').textContent);
  w.eval("openWork('Q29994374')"); await sleep(60);
  checks['parts: Silently and Very Fast has part 2'] = !!$('#sheet-work a[href="https://clarkesworldmagazine.com/valente_11_11/"]') && /Часть 2/.test($('#sheet-work').textContent);
  w.eval("openWork('Q7049279')"); await sleep(60);
  checks['found batch 3: None So Blind offers the author text and human reading'] = /EN полный текст/.test($('#sheet-work .avail').textContent) && !!$('#sheet-work a[href="https://sites.google.com/site/joehaldemansf/books/short-stories"]') && w.eval("listenOpts('Q7049279').some(x => x.id === 'pod' && /starshipsofano499joehaldeman/.test(x.url))");
  w.eval("openWork('Q28015722')"); await sleep(60);
  checks['found batch 3: Rachel in Love labels the archived text and retains audio'] = !!$('#sheet-work a[href^="https://web.archive.org/web/"]') && /архив/.test($('#sheet-work a[href^="https://web.archive.org/web/"]').textContent) && w.eval("READ.Q28015722.links.some(x => x.kind === 'audio' && /ep447-rachel-love/.test(x.url))");
  w.eval("openWork('Q20737828')"); await sleep(60);
  checks['found batch 3: Bloodchild is an excerpt with all three pages, not a full text'] = /EN фрагмент/.test($('#sheet-work .avail').textContent) && !$('#sheet-work .av-full') && $$('#sheet-work a[href^="https://www.bookbrowse.com/excerpts/"]').length === 3;
  w.eval('closeSheets()');
  // Google Books: preview opens inside the app (embedded viewer), pages in the card
  const gq = w.eval("Object.keys(WORKS).find(q => WORKS[q].gb && WORKS[q].gb.en && WORKS[q].gb.n && !READ[q] && !(WORKS[q].ex && WORKS[q].ex.r))");
  if (gq) {
    w.eval(`openWork('${gq}')`); await sleep(60);
    const gbtn = $('#sheet-work [data-gbview]');
    checks['google: preview button + pages'] = !!gbtn && /Предпросмотр · EN · Google Books/.test(gbtn.textContent) && /\d+ стр\./.test($('#sheet-work').textContent);
    click(gbtn); await sleep(40);
    const fr = $('#sheet-gb iframe.gb-frame');
    checks['google: embedded viewer sheet'] = !$('#sheet-gb').hidden && !!fr && /books\/jsapi\.js/.test(fr.getAttribute('srcdoc')) && /DefaultViewer/.test(fr.getAttribute('srcdoc'));
    w.eval('closeSheets()');
  } else checks['google: data present'] = false;
  // ADHD mode: home picks, time, listen next to read, theme, reader bar and focus
  click($('#tab-catalog')); await sleep(30);
  w.eval("prefs.pickLen = '15'; renderHome()"); await sleep(20);
  const picks = $$('#view-catalog .pick');
  checks['home: three picks for a few minutes'] = picks.length === 3 && picks.every(pk => w.eval(`minutesOf('${pk.querySelector('.pick-done').dataset.done}')`) <= 25) && (($('#pk-h').textContent === 'Есть несколько минут?' && $('#pk-h').classList.contains('sr')) || $('#pk-h').textContent === 'Или что-то новое') && $('#view-catalog [data-picklen="15"]').textContent === 'Несколько минут';
  checks['home: a card is only cover, title and author, then Read'] = picks.every(pk => !pk.querySelector('.pick-meta') && pk.querySelector('.pick-open').children.length === 2 && pk.querySelector('.pick-open').firstElementChild.classList.contains('cover') && [...pk.querySelector('.pick-txt').children].map(el => el.className).join(',') === 'pick-t,pick-a' && pk.querySelector('.pick-actions .btn-primary').textContent.trim().startsWith('Читать'));
  checks['home: read and listen side by side'] = picks.every(pk => pk.querySelector('.pick-actions a[target="_blank"]') && pk.querySelectorAll('.pick-actions > *').length === 2) && !!$('#view-catalog .pick-more');
  checks['home: listen is a headphones button that still names the source'] = picks.every(pk => { const l = pk.querySelector('.pick-actions .btn-icon'); return l && l.querySelector('svg') && /^Слушать · \S.*$/.test(l.querySelector('.sr').textContent) && !pk.querySelector('.lmore'); });
  click($('#view-catalog [data-picklen="eve"]')); await sleep(20);
  checks['home: more-than-an-hour picks are long'] = $$('#view-catalog .pick').length > 0 && w.eval("pickList('eve').every(q => minutesOf(q) > 60)") && $('#view-catalog [data-picklen="eve"]').textContent === 'Больше часа';
  const before = $$('#view-catalog .pick .pick-t').map(x => x.textContent).join('|');
  click($('#view-catalog [data-pickmore]')); await sleep(20);
  checks['home: three others'] = $$('#view-catalog .pick .pick-t').map(x => x.textContent).join('|') !== before || w.eval("pickList('eve').length") <= 3;
  // ✓ Read: off the start screen and random picks, onto the shelf, muted in award lists, Undo in the toast
  w.eval("prefs.pickLen = '40'; renderHome()"); await sleep(10);
  const pk0 = $$('#view-catalog .pick'); const dq = pk0[0].querySelector('.pick-done').dataset.done; const keep = pk0[1].querySelector('.pick-done').dataset.done;
  checks['done: on the start screen it says “Уже читал(а)”, under Read'] = pk0.every(pk => pk.querySelector('.pick-done').textContent.trim() === 'Уже читал(а)' && pk.querySelector('.pick-actions').nextElementSibling === pk.querySelector('.pick-done') && /уйдёт с первого экрана/.test(pk.querySelector('.pick-done').title));
  click(pk0[0].querySelector('.pick-done')); await sleep(40);
  const pk1 = $$('#view-catalog .pick .pick-done').map(b => b.dataset.done);
  checks['done: leaves the home picks, others stay'] = !pk1.includes(dq) && pk1.includes(keep) && pk1.length === 3 && w.eval(`isDone('${dq}')`);
  checks['done: never in random picks'] = ['15', '40', 'eve'].every(k => !w.eval(`pickList('${k}')`).includes(dq));
  checks['done: toast with Undo'] = !$('#toast').hidden && !!$('#toast [data-undone]');
  click($('#toast [data-undone]')); await sleep(40);
  checks['done: Undo brings it back'] = !w.eval(`isDone('${dq}')`) && $$('#view-catalog .pick .pick-done').map(b => b.dataset.done).includes(dq);
  w.eval(`openWork('${dq}')`); await sleep(40);
  click($(`#sheet-work [data-done="${dq}"]`)); await sleep(60);
  checks['done: full card button pressed + date'] = $(`#sheet-work [data-done="${dq}"]`).getAttribute('aria-pressed') === 'true' && $(`#sheet-work [data-done="${dq}"]`).textContent.trim() === 'Прочитано' && /прочитано \d+/.test($('#sheet-work').textContent);
  w.eval('closeSheets()');
  checks['done: muted row with mark in award lists'] = /yrow is-done/.test(w.eval(`yearRow(2020, '${dq}', true)`)) && /✓ прочитано/.test(w.eval(`yearRow(2020, '${dq}', true)`)) && /wrow is-done/.test(w.eval(`workRow('x', '${dq}')`)) && /is-done/.test(w.eval(`cellHtml('${dq}')`));
  checks['done: catalog slip muted, button pressed'] = !!$(`#view-library .slip.is-done [data-done="${dq}"][aria-pressed="true"]`);
  click($('#tab-shelf')); await sleep(60);
  checks['done: on the shelf under Прочитанное'] = !!$(`#shelf-done [data-work="${dq}"]`) && /Прочитанное · 1/.test($('#shelf-done h4').textContent);
  click($(`#shelf-done [data-done="${dq}"]`)); await sleep(60);
  checks['done: removed from the shelf'] = !$(`#shelf-done [data-work="${dq}"]`) && !w.eval(`isDone('${dq}')`) && /Пока пусто/.test($('#shelf-done').textContent);
  click($('#tab-catalog')); await sleep(20);
  click($('#view-library [data-flen="15"]')); await sleep(20);
  checks['catalog: time filter, a few minutes'] = $$('#view-library .slip').length > 0 && w.eval("[...document.querySelectorAll('#view-library .slip-open')].length") === $$('#view-library .slip').length && $$('#view-library .slip-time').every(x => x.textContent === 'несколько минут');
  click($('#view-library [data-flen="any"]')); await sleep(20);
  checks['time: novels without Google Books use Open Library pages'] = w.eval("Object.values(WORKS).filter(x => !(x.gb && x.gb.n) && x.ol && x.ol.n).length") > 100 && w.eval("(() => { const x = Object.values(WORKS).find(x => !(x.gb && x.gb.n) && x.ol && x.ol.n && !READ[x.id]); return wordsOf(x.id) === x.ol.n * 280; })()");
  checks['time: neutral words, no exact minutes'] = w.eval("fmtDur(minutesOf('Q190192'))") === 'больше часа' && w.eval("[fmtDur(5), fmtDur(25), fmtDur(26), fmtDur(60), fmtDur(61), fmtDur(600)].join('|')") === 'несколько минут|несколько минут|около часа|около часа|больше часа|больше часа' && !/≈|\d+ мин/.test($('#view-library').textContent.replace(/\d+ стр\./g, ''));
  click($('#theme-btn')); await sleep(10);
  const th1 = w.document.documentElement.dataset.theme;
  click($('#theme-btn')); await sleep(10);
  checks['theme: toggles light/dark'] = (th1 === 'dark' || th1 === 'light') && w.document.documentElement.dataset.theme !== th1;
  w.eval('openDemo()'); await sleep(80);
  await waitFor(() => /осталось|почти конец/.test($('#rleft').textContent));
  checks['reader: time left shown'] = /осталось|почти конец/.test($('#rleft').textContent);
  click($('#rbody p')); await sleep(10);
  checks['reader: tap hides the bar'] = $('#reader').classList.contains('chrome-off');
  click($('#rbody p')); await sleep(10);
  checks['reader: tap shows it again'] = !$('#reader').classList.contains('chrome-off');
  click($('#rbody p')); await sleep(10);
  w.matchMedia = q => ({ matches: /hover: hover/.test(q), addEventListener() {}, removeEventListener() {} });
  $('#reader').dispatchEvent(new w.MouseEvent('mousemove', { bubbles: true, clientY: 20 })); await sleep(10);
  checks['reader (computer): pointer at the top brings the bar back'] = !$('#reader').classList.contains('chrome-off');
  w.matchMedia = undefined;
  click($('#rbody p')); await sleep(10);
  $('#r-close').dispatchEvent(new w.FocusEvent('focusin', { bubbles: true })); await sleep(10);
  checks['reader: keyboard focus on the bar brings it back'] = !$('#reader').classList.contains('chrome-off');
  click($('#r-set')); await sleep(10);
  click($('#r-focus')); await sleep(10);
  checks['reader: focus highlights one paragraph'] = $('.rcontent').classList.contains('focus') && $$('#rbody > .cur').length === 1;
  click($('#r-focus')); await sleep(10);
  // phone voice in the reader (jsdom has no layout: give the paragraphs a simple one)
  Object.defineProperty(w.HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return this.parentElement && this.parentElement.id === 'rbody' ? 100 : 0; } });
  Object.defineProperty(w.HTMLElement.prototype, 'offsetTop', { configurable: true, get() { const p = this.parentElement; return p && p.id === 'rbody' ? 300 + [...p.children].indexOf(this) * 100 : 0; } });
  checks['say: button in the reader bar'] = !!$('#r-say') && $('#rsay').hidden;
  w.__said.length = 0; click($('#r-say')); await sleep(20);
  const spoken = w.__said.filter(u => u.onend);
  checks['say: starts on the current paragraph, marks it, shows the player'] = spoken.length >= 1 && !$('#rsay').hidden && $$('#rbody > .saying').length === 1 && $('#rbody > .saying').textContent.replace(/\s+/g, ' ').includes(spoken[0].text.slice(0, 20)) && spoken[0].lang === 'ru-RU';
  checks['say: web chunks are short'] = spoken.every(u => u.text.length <= 220);
  const firstSaying = $('#rbody > .saying');
  let guard = 0; while ($('#rbody > .saying') === firstSaying && guard++ < 40) { w.__endOne(); await sleep(5); }
  checks['say: moves on to the next paragraph'] = !!$('#rbody > .saying') && $('#rbody > .saying') !== firstSaying;
  click($('#s-play')); await sleep(10);
  checks['say: pause'] = w.eval('SAY && SAY.playing') === false && $('#s-play').getAttribute('aria-label') === 'Продолжить';
  click($('#s-rate')); await sleep(10);
  checks['say: speed 1,2×'] = $('#s-rate').textContent === '1,2×';
  click($('#s-play')); await sleep(120);
  checks['say: resume at the rate'] = w.eval('SAY.playing') === true && w.__said.some(u => u.onend && u.rate === 1.2);
  const atPrev = w.eval('SAY.items[SAY.pos].bi'); click($('#s-prev')); await sleep(120);
  checks['say: paragraph back'] = w.eval('SAY.items[SAY.pos].bi') < atPrev;
  click($('#s-stop')); await sleep(10);
  checks['say: stop hides the player'] = $('#rsay').hidden && !$('#rbody > .saying') && w.eval('SAY') === null;
  w.eval("prefs.ttsRate = 1; savePrefs()");
  checks['say: chunker'] = w.eval("sayChunks('One. Two two! Three three three? ' + 'word '.repeat(80), 60).every(c => c.length <= 60)") && w.eval("textLang('Это русский текст')") === 'ru-RU' && w.eval("textLang('Zażółć gęślą jaźń, ąę łńś')") === 'pl-PL';
  w.eval('closeReader()'); await sleep(80);
  const errorsBeforeClose = errors.length;
  await w.eval("openReader({ key: 'test:reader-close', title: 'Test', html: '<p>Text</p>', source: 'Test' })");
  w.eval('closeReader()'); await sleep(50);
  checks['reader: closing before the next animation frame leaves no runtime error'] = w.eval('R') === null && $('#reader').hidden && errors.length === errorsBeforeClose;
  await w.eval("Store.del('positions', 'test:reader-close'); loadLocal()");
  // Listen: ▾ chooser, phone voice for a saved file, remembered choice
  w.eval("renderHome()"); await sleep(10);
  const podWork = w.eval("Object.keys(READ).find(q => READ[q].links.some(l => l.kind === 'audio') && fullLink(q))");
  w.eval(`openWork('${podWork}')`); await sleep(40);
  checks['work card: no phone voice on the web without a file'] = !$('#sheet-work [data-say]');
  w.eval('closeSheets()');
  w.eval("renderLibrary()"); await sleep(10);
  const slip = $(`#view-library [data-lsrc="${podWork}"]`);
  checks['listen: ▾ next to a story with podcast + ElevenReader'] = !!slip && /Clarkesworld|Uncanny|Lightspeed|Escape|LibriVox|Strange/.test(slip.closest('.lgrp').querySelector('.ls').textContent);
  click(slip); await sleep(10);
  checks['listen: sheet with 2 options, remember on'] = !$('#listen-dialog').hidden && $$('#listen-dialog .lopt').length === 2 && $('#ls-remember').checked;
  click($('#listen-dialog [data-lgo="eleven"]')); await sleep(30);
  checks['listen: ElevenReader chosen and remembered'] = w.eval('prefs.listen') === 'eleven' && !$('#eleven-dialog').hidden && $(`#view-library [data-lsrc="${podWork}"]`).closest('.lgrp').querySelector('.ls').textContent === 'ElevenReader';
  w.eval('closeEleven()');
  await w.eval(`saveFile({ title: 'Test file', byline: '', html: '<p>Первый абзац текста.</p><p>Второй абзац.</p>', format: 'html', workId: '${podWork}' })`);
  w.eval("renderLibrary()"); await sleep(10);
  click($(`#view-library [data-lsrc="${podWork}"]`)); await sleep(10);
  checks['listen: phone voice offered for a saved file'] = $$('#listen-dialog .lopt').length === 3 && /без интернета/.test($('#listen-dialog [data-lgo="phone"]').textContent);
  w.__said.length = 0; click($('#listen-dialog [data-lgo="phone"]')); await waitFor(() => w.__said.some(u => u.onend && /Первый абзац/.test(u.text)));
  checks['listen: phone voice opens the file and speaks'] = !$('#reader').hidden && w.__said.some(u => u.onend && /Первый абзац/.test(u.text)) && w.eval('prefs.listen') === 'phone';
  w.eval('closeReader()'); await sleep(80);
  checks['listen: main button now says Phone voice'] = $(`#view-library [data-lsrc="${podWork}"]`).closest('.lgrp').querySelector('.ls').textContent === 'Голос телефона';
  w.eval("prefs.listen = null; savePrefs()");
  // end of the text: "Mark as read?" under the last paragraph; nothing for an excerpt; part 1 → part 2; exit dialog near the end
  const eq = w.eval("Object.keys(READ).find(q => fullLink(q) && !fullLink(q).part)");
  await w.eval(`saveFile({ title: 'End test', byline: '', html: '<p>Один.</p><p>Два.</p>', format: 'html', workId: '${eq}' })`);
  const ef = w.eval("local.files.find(f => f.title === 'End test').id");
  w.eval(`openFile('${ef}')`); await sleep(150);
  checks['end: block under the text'] = !!$('#rdone #r-done') && /Конец текста/.test($('#rdone').textContent) && !$('#rbody #rdone');
  click($('#r-done')); await sleep(60);
  checks['end: marked read, block says so, toast with Undo'] = w.eval(`isDone('${eq}')`) && !!$('#rdone #r-end-close') && !!$('#toast [data-undone]');
  click($('#toast [data-undone]')); await sleep(60);
  checks['end: Undo redraws the block'] = !w.eval(`isDone('${eq}')`) && !!$('#rdone #r-done');
  w.eval('closeReader()'); await sleep(60);
  w.eval('openDemo()'); await sleep(80);
  checks['end: nothing for a text that is not a catalog work'] = !$('#rdone');
  w.eval('closeReader()'); await sleep(40);
  w.eval(`openFile('${ef}')`); await sleep(150);
  w.eval("savePosition(); posFor(R.key).pct = 97; R.recallId = 'r:endtest'; openExitDialog()"); await sleep(20);
  checks['end: exit dialog offers ✓ Read, leave'] = !!$('#exit-dialog [data-exdone]');
  click($('#exit-dialog [data-exdone]')); await sleep(80);
  checks['end: … marks it read and closes the text'] = w.eval(`isDone('${eq}')`) && $('#reader').hidden && $('#exit-dialog').hidden;
  await w.eval(`setDone('${eq}', false)`); await w.eval(`Store.del('files', '${ef}')`); await w.eval(`Store.del('positions', 'file:${ef}')`);
  for (const id of w.eval(`local.bookmarks.filter(b => b.key === 'file:${ef}').map(b => b.id)`)) await w.eval(`Store.del('bookmarks', '${id}')`);
  await w.eval('loadLocal()'); w.eval('renderCatalog()');
  const tf = w.eval(`local.files.find(f => f.title === 'Test file').id`); await w.eval(`Store.del('files', '${tf}')`); await w.eval(`Store.del('positions', 'file:${tf}')`); await w.eval('loadLocal()');
  click($('#tab-shelf')); await sleep(60);
  checks['pure web: no reminder, no app, nothing about Android'] = !$('#set-remind') && !/Android/.test(w.document.body.textContent + w.eval('JSON.stringify(I18N)')) && typeof w.Capacitor === 'undefined' && !w.eval("typeof NATIVE !== 'undefined'");
  // About: sections named as in the menu, as links; shelf panels linked directly
  click($('#tab-about')); await sleep(30);
  checks['about: sections listed with links to every tab'] = ['catalog', 'library', 'awards', 'shelf'].every(v => !!$(`#about-tabs [data-view="${v}"]`)) && /Разделы/.test($('#about-tabs h4').textContent) && $('#about-tabs [data-view="library"]').textContent === 'Каталог';
  checks['about: no old flat paragraphs, links inside the text'] = $$('#view-about [data-goshelf]').length >= 5 && !!$('#about-data [data-goshelf="shelf-data"]') && !!$('#about-app [data-goshelf="shelf-files"]');
  click($('#about-data [data-goshelf="shelf-data"]')); await sleep(80);
  checks['about: a shelf link opens My shelf at that panel'] = !$('#view-shelf').hidden && !!$('#shelf-data.hit');
  click($('#tab-about')); await sleep(20);
  click($('#about-tabs [data-view="awards"]')); await sleep(40);
  checks['about: a tab link opens the tab'] = !$('#view-awards').hidden;
  // data across versions: schema steps, backup and rollback, read-only for newer data, old export files, lost book numbers
  checks['data: a fresh browser starts at the current schema'] = (await w.eval("Store.get(META, 'schema')")).v === w.eval('SCHEMA');
  await w.eval(`(async () => { await Store.put(META, { id: 'schema', v: 2 }); await Store.put('bookmarks', { id: 'd:Q25349436', type: 'done', workId: 'Q25349436' }, true); await Store.put('positions', { id: 'file:fx', workId: 'Q25349436', title: 'x', pct: 10, i: 0, r: 0, h: 'a' }, true); })()`);
  const mres = await w.eval('ensureSchema()');
  const mbm = await w.eval("Store.get('bookmarks', 'd:Q25349436')");
  checks['data: schema 2 → 4 adds a time, the book label and a change time'] = mres === 'migrated' && mbm.at > 0 && mbm.mt === mbm.at && !!mbm.book && mbm.book.title === 'Cat Pictures Please' && (await w.eval("Store.get('positions', 'file:fx')")).book.by === 'Naomi Kritzer' && (await w.eval("Store.get(META, 'schema')")).v === 4;
  checks['data: a copy is kept before the steps'] = (await w.eval('Store.all(META)')).some(x => x.id.startsWith('backup:') && x.from === 2 && x.data.bookmarks.some(b => b.id === 'd:Q25349436' && !b.at));
  await w.eval(`(async () => { await Store.put(META, { id: 'schema', v: 2 }); await Store.put('bookmarks', { id: 'w:Q1', type: 'work', workId: 'Q1' }); })()`);
  w.eval("window.__m3 = MIGRATIONS[3]; MIGRATIONS[3] = () => { throw new Error('boom'); }");
  const mfail = await w.eval('ensureSchema()');
  const kept = await w.eval("Store.get('bookmarks', 'w:Q1')");
  checks['data: a failing step leaves everything as it was, read-only'] = mfail === 'failed' && w.eval('READONLY') === true && !!kept && !kept.at && /Не удалось перевести/.test($('#data-note').textContent);
  w.eval("MIGRATIONS[3] = window.__m3; READONLY = false; document.getElementById('data-note').remove()");
  await w.eval(`(async () => { for (const id of ['w:Q1', 'd:Q25349436']) await Store.del('bookmarks', id); await Store.del('positions', 'file:fx'); await Store.put(META, { id: 'schema', v: 99 }); })()`);
  const mnew = await w.eval('ensureSchema()');
  await w.eval("Store.put('bookmarks', { id: 'w:Q2', type: 'work', workId: 'Q2' })");
  checks['data: newer than the page → shown, never changed'] = mnew === 'newer' && !(await w.eval("Store.get('bookmarks', 'w:Q2')")) && /более новая версия/.test($('#data-note').textContent);
  w.eval("READONLY = false; document.getElementById('data-note').remove()"); await w.eval("Store.put(META, { id: 'schema', v: SCHEMA })");
  await w.eval(`importAll(JSON.stringify({ app: 'fantastic', v: 2, data: { bookmarks: [{ id: 'd:Q16990038', type: 'done', workId: 'Q16990038' }] } }))`); await sleep(60);
  const imp = await w.eval("Store.get('bookmarks', 'd:Q16990038')");
  checks['data: an old export file is brought up to date on import'] = !!imp && imp.at > 0 && !!imp.book;
  const exj = JSON.parse(await w.eval('exportAll()'));
  checks['data: export carries the schema number and settings'] = exj.v === 4 && Array.isArray(exj.data.tombs) && exj.app === 'unoebasta' && !!exj.data.prefs && Array.isArray(exj.data.bookmarks);
  await w.eval("importAll(JSON.stringify({ app: 'unoebasta', v: 99, data: {} }))"); await sleep(20);
  checks['data: a file from a newer version is refused'] = /более новой версии/.test($('#toast').textContent);
  await w.eval(`(async () => { await Store.put('positions', { id: 'file:lost', workId: 'Qgone', book: { title: 'Cat Pictures Please', by: 'Naomi Kritzer' }, title: 'x', pct: 5, at: 1 }); migrated = false; await loadLocal(); })()`);
  checks['data: a lost book number is found again by title and author'] = (await w.eval("Store.get('positions', 'file:lost')")).workId === 'Q25349436';
  await w.eval(`(async () => { await Store.del('positions', 'file:lost'); await Store.del('bookmarks', 'd:Q16990038'); await loadLocal(); renderCatalog(); })()`);
  // exits on a phone: "Close the text" in the reader's recall window; Back closes the top layer
  w.eval('openDemo()'); await sleep(120);
  w.eval('savePosition(); openRecallDialog(posFor(R.key), true)'); await sleep(20);
  checks['exit: recall window in the reader has Close the text'] = !!$('#recall-dialog [data-rdleave]');
  click($('#recall-dialog [data-rdleave]')); await sleep(60);
  checks['exit: … and it closes the text'] = $('#reader').hidden && $('#recall-dialog').hidden;
  await sleep(800);
  w.eval('openDemo()'); await sleep(120);
  checks['back: an open reader holds one history entry'] = !!(w.history.state && w.history.state.ub) && w.eval('navPushed') === true;
  w.dispatchEvent(new w.PopStateEvent('popstate', { state: null })); await sleep(60);
  checks['back: the phone Back button closes the reader'] = $('#reader').hidden;
  w.eval("openWork('Q25349436')"); await sleep(60);
  w.dispatchEvent(new w.PopStateEvent('popstate', { state: null })); await sleep(60);
  checks['back: … and a work card'] = $('#sheet-work').hidden;
  // what you open elsewhere becomes your reading history and status; Hide is a ✕ in the card's corner
  click($('#tab-catalog')); await sleep(30);
  const trk = $('#view-catalog .pick a[data-track]'); const tq = trk.dataset.track; const tTitle = w.eval(`titleOf(work('${tq}'))`);
  click(trk); await sleep(80);
  const rcard = $('#view-catalog .recall');
  checks['track: Read ↗ puts the story first in You were reading'] = !!rcard && rcard.querySelector('h3').textContent.trim() === tTitle && /Открыто на/.test(rcard.textContent) && !!rcard.querySelector('a[data-track]');
  checks['track: Hide is a ✕ in the corner, not among the actions'] = !!rcard.querySelector(':scope > .rc-hide[data-rchide]') && !rcard.querySelector('.rc-actions [data-rchide]') && !!rcard.querySelector(`.rc-actions [data-done="${tq}"]`);
  checks['track: no place, so it asks for a note'] = /Оставьте себе заметку/.test(rcard.textContent);
  click(rcard.querySelector('a[data-track]')); await sleep(60);
  checks['track: opening again within half an hour is one history line'] = w.eval(`recallsFor('ext:${tq}').length`) === 1 && w.eval(`posFor('ext:${tq}').opens`) === 2;
  checks['track: status flag on the work'] = /Открыто/.test(w.eval(`workFlags(work('${tq}'))`));
  click($('#view-catalog .recall .rc-hide')); await sleep(40);
  checks['track: ✕ hides it from the start screen'] = !$('#view-catalog .recall') || $('#view-catalog .recall h3').textContent.trim() !== tTitle;
  await w.eval(`(async () => { await Store.del('positions', 'ext:${tq}'); for (const r of recallsFor('ext:${tq}')) await Store.del('bookmarks', r.id); await loadLocal(); renderCatalog(); })()`);
  // Three others: no repeats until every book of that length has been shown
  click($('#tab-catalog')); await sleep(20);
  w.eval("prefs.pickLen = '40'; renderHome()"); await sleep(10);
  const seen40 = []; for (let i = 0; i < 3; i++) { seen40.push(...$$('#view-catalog .pick .pick-done').map(b => b.dataset.done)); click($('#view-catalog [data-pickmore]')); await sleep(10); }
  checks['picks: Three others never repeats within the list'] = seen40.length === 9 && new Set(seen40).size === 9;
  w.eval("prefs.pickLen = '15'; renderHome()"); await sleep(10);
  const n15 = w.eval("pickList('15').length"); const s15 = [];
  for (let i = 0; i < Math.ceil(n15 / 3); i++) { s15.push(...$$('#view-catalog .pick .pick-done').map(b => b.dataset.done)); click($('#view-catalog [data-pickmore]')); await sleep(10); }
  checks['picks: every short story shows before any repeats, then a note'] = new Set(s15).size === n15 && /дальше по кругу/.test($('#view-catalog .picks').textContent);
  // covers: an image when the build found one, otherwise a typographic cover
  click($('#tab-library')); await sleep(30);
  checks['covers: every slip has a cover'] = $$('#view-library .slip').every(sl => !!sl.querySelector('.cover'));
  checks['covers: typographic cover with the title when there is no image'] = (() => { const q = 'Q25349436'; if (w.eval(`(DATA.covers || []).includes('${q}')`)) return true; const c = $(`#view-library .slip-open[data-work="${q}"]`).closest('.slip').querySelector('.cover-t'); return !!c && c.querySelector('.ct').textContent === w.eval(`WORKS['${q}'].title`); })();
  checks['covers: an image from covers/ when the build lists it'] = w.eval(`(() => { coverHtml('Q190192', 'm'); COVERS.add('Q190192'); const h = coverHtml('Q190192', 'm'); return h.startsWith('<img') && h.includes('src="covers/m/Q190192.webp"') && h.includes('loading="lazy"'); })()`);
  w.eval("COVERS.delete('Q190192')");
  // sync, steps 1–2: deletion marks, one merge (newer wins), the transfer link and its QR code
  const T0 = Date.now();
  await w.eval(`(async () => { await setDone('Q16990038', true); await setDone('Q16990038', false); })()`);
  const tomb = await w.eval("Store.get('tombs', 'bookmarks|d:Q16990038')");
  checks['sync: a delete leaves a deletion mark'] = !!tomb && tomb.s === 'bookmarks' && tomb.key === 'd:Q16990038' && tomb.mt >= T0;
  await w.eval(`(async () => {
    await Store.put('bookmarks', { id: 'w:Q25349436', type: 'work', workId: 'Q25349436', at: 1, mt: ${T0} }, true);
    await Store.put('bookmarks', { id: 'w:Q16990038', type: 'work', workId: 'Q16990038', at: 1, mt: ${T0 - 5000} }, true);
    await Store.put('bookmarks', { id: 'w:Q190192', type: 'work', workId: 'Q190192', at: 1, mt: ${T0 + 5000} }, true);
    prefs.theme = 'light'; savePrefs(); await loadLocal();
  })()`);
  const merged = await w.eval(`syncMerge({ v: 4, r: { bookmarks: [
      { id: 'd:Q130213759', type: 'done', workId: 'Q130213759', at: ${T0}, mt: ${T0} },
      { id: 'w:Q25349436', type: 'work', workId: 'Q25349436', at: 1, mt: ${T0 - 1000}, stale: true },
      { id: 'd:Q16990038', type: 'done', workId: 'Q16990038', at: 1, mt: ${T0 - 10000} } ] },
    x: [['bookmarks', 'w:Q16990038', ${T0}], ['bookmarks', 'w:Q190192', ${T0}]],
    p: { mt: ${T0 + 60000}, ttsRate: 1.3, theme: 'dark' } })`);
  checks['sync merge: a new record arrives, with its book label from the catalog'] = w.eval("isDone('Q130213759')") && (await w.eval("Store.get('bookmarks', 'd:Q130213759')")).book.title === 'Better Living Through Algorithms';
  checks['sync merge: an older version does not overwrite a newer one'] = !(await w.eval("Store.get('bookmarks', 'w:Q25349436')")).stale;
  checks['sync merge: a newer deletion removes the record'] = !(await w.eval("Store.get('bookmarks', 'w:Q16990038')"));
  checks['sync merge: a record changed after the deletion stays'] = !!(await w.eval("Store.get('bookmarks', 'w:Q190192')"));
  checks['sync merge: a deleted record does not come back'] = !w.eval("isDone('Q16990038')");
  checks['sync merge: travelling settings only'] = w.eval('prefs.ttsRate') === 1.3 && w.eval('prefs.theme') === 'light' && merged === 3;
  // the link: everything from this browser → a clean browser
  await w.eval("trackOpen('Q130213759', 'read', 'https://clarkesworldmagazine.com/kritzer_05_23/', 'Clarkesworld')");
  await w.eval(`(async () => { const r = await saveFile({ title: 'My Book', byline: 'Me', html: '<p>' + 'word '.repeat(400) + '</p>', format: 'txt' }); window.__fid = r.id; await Store.put('positions', { id: 'file:' + r.id, title: 'My Book', pct: 40, i: 3, r: 0, h: 'x', at: ${T0} }); await loadLocal(); })()`);
  const pk = await w.eval('syncPack()');
  checks['sync link: only what the catalog cannot rebuild'] = !JSON.stringify(pk).includes('file:') && pk.r.positions.some(p => p.id.startsWith('ff:')) && pk.r.bookmarks.every(b => !b.book && b.type !== 'about') && !pk.r.positions.find(p => p.id === 'ext:Q130213759').title;
  const code = await w.eval('syncPack().then(encodePack)');
  checks['sync link: compressed and short'] = code[0] === 'z' && code.length < JSON.stringify(pk).length / 2;
  checks['sync link: decodes to the same shelf'] = JSON.stringify(await w.eval(`decodePack(${JSON.stringify(code)})`)).length === JSON.stringify(pk).length - JSON.stringify(pk.at).length + JSON.stringify((await w.eval(`decodePack(${JSON.stringify(code)})`)).at).length;
  await w.eval(`(async () => { const keepFile = local.files.find(f => f.id === window.__fid); await Store.replaceAll({ files: [keepFile] }); migrated = false; await loadLocal(); })()`);
  checks['sync link: (clean browser has nothing)'] = !w.eval("isDone('Q130213759')") && !w.eval("posFor('ext:Q130213759')");
  w.location.hash = '#move=' + code; await sleep(200);
  checks['sync link: opening it asks first, with what it holds'] = !$('#move-dialog').hidden && /Перенести полку/.test($('#move-dialog h3').textContent) && /прочитано: 1/.test($('#move-dialog').textContent);
  checks['sync link: the shelf is gone from the address bar'] = !w.location.hash;
  click($('#move-dialog [data-mvgo]')); await sleep(250);
  checks['sync link: … then brings the shelf here'] = $('#move-dialog').hidden && w.eval("isDone('Q130213759')") && w.eval("posFor('ext:Q130213759') && posFor('ext:Q130213759').title") === 'Better Living Through Algorithms' && /Обновлено записей/.test($('#toast').textContent);
  checks['sync link: the place in your own file finds the same file'] = !!w.eval("posFor('file:' + window.__fid)") && w.eval("posFor('file:' + window.__fid).pct") === 40;
  w.location.hash = '#move=' + code; await sleep(200); click($('#move-dialog [data-mvgo]')); await sleep(200);
  checks['sync link: opening it twice changes nothing'] = /уже есть/.test($('#toast').textContent);
  w.location.hash = '#move=zBROKEN'; await sleep(150);
  checks['sync link: a broken link says so'] = $('#move-dialog').hidden && /повреждена/.test($('#toast').textContent);
  click($('#tab-shelf')); await sleep(80);
  click($('#mv-make')); await sleep(250);
  checks['sync link: My shelf makes the link and a QR code'] = /^https:\/\/example\.test\/#move=z/.test($('#mv-link').value) && !!$('#mv-out svg.qr path') && /камеру|только главное/.test($('#mv-out').textContent) && /не публикуйте/.test($('#mv-out').textContent);
  click($('#mv-copy')); await sleep(20);
  checks['sync link: copy'] = w.__clip === $('#mv-link').value;
  checks['sync link: the QR code takes the essentials when the shelf is big'] = w.eval("slimPack({ v: 4, r: { positions: [{ id: 'ext:Q1', mt: 1 }], bookmarks: [{ id: 'd:Q1', type: 'done', mt: 1 }, { id: 'r:1', type: 'recall', mt: Date.now() }], links: [{ id: 'Q1' }] }, x: [['bookmarks', 'w:Q1', 1]] }, 3)").r.bookmarks.length === 1 && w.eval("slimPack({ v: 4, r: { positions: [{ id: 'ext:Q1', mt: 1 }], bookmarks: [], links: [] }, x: [] }, 3)").r.positions.length === 0;
  // sync through relays: turn on, pair another device with the key link, merge, turn off
  click($('#tab-shelf')); await sleep(80);
  checks['sync: My shelf offers to turn it on, with what it does'] = !!$('#sy-on') && /шифруется/.test($('#shelf-data').textContent);
  await w.eval(`setDone('Q130213759', true)`); await sleep(20);
  click($('#sy-on')); await sleep(400);
  const relay = w.__relay;
  checks['sync: turning on publishes one encrypted app-data event'] = relay.length >= 1 && relay[relay.length - 1].kind === 30078 && relay[relay.length - 1].tags[0][0] === 'd' && relay[relay.length - 1].content.startsWith('enc:') && !relay[relay.length - 1].content.includes('Q130213759');
  checks['sync: then shows the key link and its QR code'] = /#sync=[\w-]{43}$/.test($('#mv-link').value) && !!$('#sy-out svg.qr') && /не публикуйте/.test($('#sy-out').textContent) && /Синхронизация включена/.test($('#sy-status').textContent);
  const keyLink = $('#mv-link').value, key = keyLink.split('#sync=')[1];
  // another device: an empty browser opens the key link
  await w.eval(`(async () => { saveSync(null); await Store.replaceAll({}); migrated = false; await loadLocal(); })()`);
  checks['sync: (the other device starts empty)'] = !w.eval("isDone('Q130213759')") && !w.eval('syncState()');
  w.location.hash = '#sync=' + key; await sleep(200);
  checks['sync: the key link asks first'] = !$('#move-dialog').hidden && /Подключить это устройство/.test($('#move-dialog').textContent) && !w.location.hash;
  click($('#move-dialog [data-sygo]')); await sleep(500);
  await waitFor(() => w.eval("isDone('Q130213759')") && /Устройство подключено/.test($('#toast').textContent));
  checks['sync: … then the shelf arrives from the relays'] = w.eval("isDone('Q130213759')") && w.eval('syncState().key') === key && /Устройство подключено/.test($('#toast').textContent);
  const before2 = relay.length; await w.eval('syncPush()');
  checks['sync: nothing new → nothing published'] = relay.length === before2;
  await w.eval(`setDone('Q16990038', true)`); const r2 = await w.eval('syncPush()');
  checks['sync: a change here is published'] = r2 === 6 && relay.length === before2 + 1;
  click($('#tab-shelf')); await sleep(80);
  click($('#sy-off')); await sleep(80);
  checks['sync: turning off keeps the data here'] = !w.eval('syncState()') && w.eval("isDone('Q130213759')") && !!$('#sy-on');
  click($('#tab-about')); await sleep(40);
  const covSum = $('#about-cov .cov-sum td:last-child');
  checks['about: what you can read today, counted from the data, with a way to help'] = !!covSum && +covSum.textContent.replace(/\D/g, '') === w.eval('Object.keys(WORKS).length') && $$('#about-cov tbody tr').length === 5 && !!$('#about-cov [data-form="feedback"]') && !!$('#about-cov a[href$="docs/search-brief.md"]');
  checks['about: how to sync, in three steps with a link to the shelf'] = $$('#about-sync ol li').length === 3 && !!$('#about-sync [data-goshelf="shelf-sync"]');
  // writing to the project: one comment field and Send; anonymous when the project's inbox key is set
  checks['feedback: the page ships with the project’s public inbox key (an npub, never a secret)'] = /^npub1[02-9ac-hj-np-z]{58}$/.test(w.eval('INBOX_NPUB'));
  w.eval("INBOX_NPUB = 'npub1test'");
  w.eval("openForm('feedback', 'Q2008211')"); await sleep(60);
  checks['feedback: one field and one button'] = $$('#sg-form textarea').length === 1 && $$('#sg-form input, #sg-form select').length === 0 && $$('#sg-form button').length === 1 && /Левая рука тьмы/.test($('#sheet-form').textContent);
  const nRelay = w.__relay.length;
  $('#sg-comment').value = 'Full text: https://example.org/left-hand'; $('#sg-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(300);
  const pm = w.__relay[w.__relay.length - 1], pmText = Buffer.from(pm.content.slice(7), 'base64').toString();
  checks['feedback: sent as one sealed private message, nothing readable outside'] = w.__relay.length === nRelay + 1 && pm.kind === 1059 && pm.tags[0][1] === 'ab'.repeat(32) && !pm.content.includes('left-hand') && pmText.includes('https://example.org/left-hand') && pmText.includes('template=feedback.yml');
  checks['feedback: thanks, the field is empty for the next one'] = !$('#sg-status').hidden && /Спасибо/.test($('#sg-status').textContent) && $('#sg-comment').value === '' && (await w.eval("Store.all('suggestions')")).some(x => x.comment === 'Full text: https://example.org/left-hand' && x.sent);
  $('#sg-comment').value = 'And another idea'; $('#sg-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(300);
  checks['feedback: write another right away'] = w.__relay.length === nRelay + 2 && $('#sg-comment').value === '';
  w.eval("INBOX_NPUB = ''"); w.__opened = []; w.open = u => { w.__opened.push(u); return null; };
  w.eval("openForm('feedback', '')"); await sleep(60);
  $('#sg-comment').value = 'No inbox yet'; $('#sg-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(120);
  checks['feedback: without the inbox key it opens a ready GitHub issue'] = w.__opened.length === 1 && w.__opened[0].includes('template=feedback.yml') && w.__opened[0].includes('No%20inbox%20yet') && /GitHub/.test($('#sg-status').textContent);
  w.eval("INBOX_NPUB = 'npub1test'");
  await w.eval(`Store.put('suggestions', { id: 's-unsent', kind: 'report', workId: 'Q25349436', url: 'https://x.test/b', reason: 'dead', at: Date.now() })`);
  w.eval("document.getElementById('sheet-form').hidden = true");
  click($('#tab-shelf')); await sleep(80);
  const rows = $$('#shelf-sugg .sugg');
  checks['suggestions on the shelf: one row each, with status, send, GitHub and remove'] = rows.length >= 2 && rows.some(r => /отправлено/.test(r.textContent)) && rows.some(r => /ещё не отправлено/.test(r.textContent)) && rows.every(r => r.querySelector('[data-sgdel]') && r.querySelector('a[data-sggh]')) && !!$('#shelf-sugg [data-sgsend]');
  click($('#sugg-clear-sent')); await sleep(80);
  checks['suggestions: “Remove sent” keeps only the unsent'] = $$('#shelf-sugg .sugg').length === 1 && /ещё не отправлено/.test($('#shelf-sugg').textContent);
  click($('#shelf-sugg [data-sgdel]')); await sleep(80);
  checks['suggestions: remove one → the list is empty'] = /Пока ничего/.test($('#shelf-sugg').textContent);
  w.eval("INBOX_NPUB = ''");
  // the logo and the name lead to the start screen
  click($('#tab-about')); await sleep(60);
  click($('.brand-home .logo')); await sleep(60);
  const fromLogo = !$('#view-catalog').hidden && $('#tab-catalog').getAttribute('aria-selected') === 'true';
  click($('#tab-shelf')); await sleep(60);
  click($('.brand-home .brand-e')); await sleep(60);
  checks['logo and name → start screen'] = fromLogo && !$('#view-catalog').hidden && $('.brand-home').title === 'На главную';
  // own files: the kind is told by the first bytes; Word, LibreOffice, and the old Russian and Polish code pages
  const NodeZip = require(path.join(NM, 'jszip'));
  const mkZip = async files => { const z = new NodeZip(); for (const [k, v] of Object.entries(files)) z.file(k, v); return z.generateAsync({ type: 'uint8array' }); };
  const parse = async (bytes, name) => { w.__bytes = bytes; return w.eval(`(async () => { try { return await parseFile(new File([new Uint8Array(window.__bytes)], ${JSON.stringify(name)})); } catch (e) { return { error: e.message }; } })()`); };
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const docx = await mkZip({ '[Content_Types].xml': '<Types/>', 'word/document.xml': `<w:document ${W}><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Глава первая</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">Главное перед изучением: </w:t></w:r><w:r><w:t>читать медленно.</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Часть вторая</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>В таблице</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr/></w:body></w:document>` });
  const d1 = await parse([...docx], 'Главное перед изучением'); // no extension, as phones often give it
  checks['files: DOCX without an extension opens as text, with headings and tables'] = d1.format === 'docx' && d1.title === 'Глава первая' && !/Глава первая/.test(d1.html) && /<h3>Часть вторая<\/h3>/.test(d1.html) && /<p>Главное перед изучением: читать медленно\.<\/p>/.test(d1.html) && /В таблице/.test(d1.html) && !/Content_Types|PK/.test(d1.html);
  const odt = await mkZip({ mimetype: 'application/vnd.oasis.opendocument.text', 'content.xml': '<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:text><text:h text:outline-level="1">Rozdział</text:h><text:p>Zażółć<text:s text:c="2"/>gęślą jaźń</text:p></office:text></office:body></office:document-content>' });
  const o1 = await parse([...odt], 'notatki.odt');
  checks['files: ODT opens'] = o1.format === 'odt' && o1.title === 'Rozdział' && /Zażółć gęślą jaźń/.test(o1.html);
  const cp1251 = str => [...str].map(c => { const k = c.charCodeAt(0); return k >= 0x410 && k <= 0x44F ? k - 0x410 + 0xC0 : k === 0x451 ? 0xB8 : k; });
  const PL = { 'ą': 0xB9, 'ć': 0xE6, 'ę': 0xEA, 'ł': 0xB3, 'ń': 0xF1, 'ó': 0xF3, 'ś': 0x9C, 'ź': 0x9F, 'ż': 0xBF, 'Ż': 0xAF };
  const cp1250 = str => [...str].map(c => PL[c] || c.charCodeAt(0));
  const t1 = await parse(cp1251('Привет, это текст в старой кодировке Windows.\n\nВторой абзац, ёлка.'), 'stary.txt');
  const t2 = await parse(cp1250('Zażółć gęślą jaźń. To jest tekst w starym kodowaniu Windows.'), 'stary-pl.txt');
  const u16 = [0xFF, 0xFE, ...[...'Текст UTF-16'].flatMap(c => [c.charCodeAt(0) & 255, c.charCodeAt(0) >> 8])];
  const t3 = await parse(u16, 'notepad.txt');
  checks['files: TXT in windows-1251, windows-1250 and UTF-16 reads right'] = /Привет, это текст/.test(t1.html) && /ёлка/.test(t1.html) && /Zażółć gęślą jaźń/.test(t2.html) && /Текст UTF-16/.test(t3.html);
  const junk = await parse(Array.from({ length: 3000 }, (_, i) => (i * 37 + 11) % 256), 'mystery.bin');
  const oldDoc = await parse([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0, 0, 0], 'stary.doc');
  checks['files: a binary file or an old .doc gets a clear message, not a page of symbols'] = /не текст/.test(junk.error || '') && /\.doc/.test(oldDoc.error || '');
  // the reader's languages: by default the page's and the phone's; what they can read in them comes first
  checks['languages: by default the page language and the phone’s'] = JSON.stringify(w.eval('myLangs()')) === JSON.stringify(['ru', 'en']);
  click($('#tab-shelf')); await sleep(80);
  click($('#shelf-langs [data-mylang="en"]')); await sleep(80);
  click($('#shelf-langs [data-mylang="pl"]')); await sleep(80);
  click($('#shelf-langs [data-mylang="ru"]')); await sleep(80);
  checks['languages: edits are a draft until Save'] = w.eval('prefs.langs') === undefined && $('#shelf-langs [data-mylang="pl"]').getAttribute('aria-pressed') === 'true';
  click($('#langs-save')); await sleep(80);
  checks['languages: chosen on the shelf, kept, and they travel with sync'] = JSON.stringify(w.eval('prefs.langs')) === JSON.stringify(['pl']) && w.eval("SYNC_PREFS.includes('langs')") && $('#shelf-langs [data-mylang="pl"]').getAttribute('aria-pressed') === 'true';
  checks['languages: Save persists the choice for a reload'] = JSON.stringify(JSON.parse(w.localStorage.getItem('fantastic-prefs')).langs) === JSON.stringify(['pl']);
  click($('#shelf-langs [data-mylang="pl"]')); await sleep(80);
  checks['languages: at least one stays'] = JSON.stringify(w.eval('prefs.langs')) === JSON.stringify(['pl']) && /хотя бы один/.test($('#toast').textContent);
  w.eval("renderCatalog()"); await sleep(60);
  checks['languages: saved Polish choice does not silently suggest English texts'] = !$('#view-catalog .pick') && /Полного текста/.test($('#view-catalog').textContent) && !!$('#view-catalog [data-goshelf="shelf-langs"]') && !!$('#view-catalog .home-excerpts a');
  click($('#tab-library')); await sleep(60);
  checks['languages: the text language on each card, dimmed when unknown'] = !!$('#view-library .slip .flag-lang.far') && /^EN$/.test($('#view-library .slip .flag-lang').textContent);
  const wid = $('#view-library .slip [data-work]').dataset.work; w.eval(`openWork('${wid}')`); await sleep(80);
  checks['languages: the work card says the text is in English and how to translate'] = /Браузер может перевести страницу/.test($('#sheet-work').textContent);
  w.eval('closeSheets()');
  w.eval("READ.Q190192 = { w: 3000, tier: 't2', added: '2026-10-01T00:00:00Z', pub: 'Test', links: [{ kind: 'full', url: 'https://x.test/diuna-pl', site: 'Test', lang: 'pl' }] }; renderLibrary();"); await sleep(60);
  checks['languages: a Polish text comes first for a Polish reader'] = $('#view-library .slip [data-work]').dataset.work === 'Q190192' && $('#view-library .slip .flag-lang').textContent === 'PL' && !$('#view-library .slip .flag-lang').classList.contains('far');
  w.eval("prefs.pickLen = '15'; READ.Q190192.links.unshift({kind:'full',url:'https://x.test/dune-en',site:'English fixture'}); renderHome()");
  checks['languages: one matching full text is shown without filling with other languages'] = $$('#view-catalog .pick').length === 1 && $('#view-catalog .pick [data-work]').dataset.work === 'Q190192';
  checks['languages: Read opens the matching language even when English is listed first'] = $('#view-catalog .pick a[data-track]').href === 'https://x.test/diuna-pl';
  click($('#f-mine')); await sleep(60);
  checks['languages: “In my languages” keeps what can be read or heard in them'] = $$('#view-library .slip').every(sl => w.eval(`langScore('${sl.querySelector('[data-work]').dataset.work}')`) > 0) && $$('#view-library .slip').length >= 1;
  click($('#f-mine')); await sleep(30);
  w.eval("delete READ.Q190192"); click($('#tab-shelf')); await sleep(60); click($('#langs-reset')); await sleep(60);
  checks['languages: back to the phone’s languages'] = w.eval('prefs.langs') === undefined && JSON.stringify(w.eval('myLangs()')) === JSON.stringify(['ru', 'en']);
  // Reading now: clear the whole list at once, with Undo
  await w.eval(`(async () => { const now = Date.now();
    await Store.put('positions', { id: 'ext:Q25349436', ext: true, workId: 'Q25349436', title: 'A', source: 'X', sourceUrl: 'https://x.test/a', at: now - 1000 });
    await Store.put('positions', { id: 'ext:Q2008211', ext: true, workId: 'Q2008211', title: 'B', source: 'X', sourceUrl: 'https://x.test/b', at: now - 2000 });
    await Store.put('bookmarks', { id: 'r:t1', type: 'recall', key: 'ext:Q25349436', workId: 'Q25349436', note: '', at: now });
    await Store.put('bookmarks', { id: 'r:t2', type: 'recall', key: 'ext:Q2008211', workId: 'Q2008211', note: 'keep me', at: now });
    await Store.put('bookmarks', { id: 'pos:t3', type: 'pos', key: 'file:x', title: 'Mark', pct: 3, snippet: 's', at: now }); })()`);
  click($('#tab-shelf')); await sleep(80);
  const nReading = $$('#shelf-reading .file-row').length;
  click($('#reading-clear')); await sleep(150);
  const bms = await w.eval("Store.all('bookmarks')");
  checks['reading now: “Delete all” empties it, keeps notes, bookmarks and Finished'] = nReading >= 2 && $$('#shelf-reading .file-row').length === 0 && $('#reading-clear').disabled && (await w.eval("Store.all('positions')")).filter(p => !w.eval(`isDone(${JSON.stringify(p.workId)})`)).length === 0 && !bms.some(b => b.id === 'r:t1') && bms.some(b => b.id === 'r:t2') && bms.some(b => b.id === 'pos:t3') && w.eval("isDone('Q130213759')") && /Список очищен/.test($('#toast').textContent);
  click($('#toast [data-rcundo]')); await sleep(150);
  checks['reading now: Undo brings the list back'] = $$('#shelf-reading .file-row').length === nReading && (await w.eval("Store.all('bookmarks')")).some(b => b.id === 'r:t1');
  // one row: remove from the list (the work stays in the catalog), or mark it finished
  click($('#shelf-reading [data-rcdrop="ext:Q25349436"]')); await sleep(150);
  checks['reading now: “Remove from list” takes one row off, the work stays in the catalog'] = $$('#shelf-reading .file-row').length === nReading - 1 && !$('#shelf-reading [data-rcdrop="ext:Q25349436"]') && !!w.eval("WORKS['Q25349436']") && !w.eval("isDone('Q25349436')") && /каталоге/.test($('#toast').textContent);
  click($('#toast [data-rcundo]')); await sleep(150);
  click($('#shelf-reading [data-done="Q2008211"]')); await sleep(200);
  checks['reading now: “Finished” moves the row to Finished'] = w.eval("isDone('Q2008211')") && !$('#shelf-reading [data-rcdrop="ext:Q2008211"]') && /Left Hand of Darkness|Левая рука/.test($('#shelf-done').textContent);
  // languages


  w.eval("openWork('Q27903111')"); await sleep(60);
  checks['titles: in Russian, a work with no Russian title shows the original only, never another language'] = $('#sheet-work h2').textContent === 'The Paper Menagerie' && !$('#sheet-work .alt') && !/El zoo de papel|Испанск/.test($('#sheet-work').textContent);
  w.eval('closeSheets()');
  const qRu = w.eval("Object.keys(READ).find(q => WORKS[q] && WORKS[q].titles.ru && WORKS[q].titles.ru !== WORKS[q].title)");
  click($('#tab-library')); await sleep(80);
  const lq2 = $('#lib-q'); lq2.value = w.eval(`WORKS['${qRu}'].titles.ru`); lq2.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(250);
  const slipRu = $(`#view-library .slip-open[data-work="${qRu}"]`);
  checks['titles: the catalog card shows the Russian title, the original underneath'] = !!slipRu && slipRu.textContent.trim() === w.eval(`WORKS['${qRu}'].titles.ru`) && slipRu.closest('.slip').querySelector('.alt').textContent === w.eval(`WORKS['${qRu}'].title`);
  lq2.value = ''; lq2.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(150);
  click($('#lang-es')); await sleep(80);
  checks['es: the interface switches to Spanish'] = $('#tab-catalog').textContent.trim() === 'Leer' && $('#tab-library').textContent.trim() === 'Catálogo' && $('#tab-shelf').textContent.trim() === 'Mi estante' && $('#lang-es').getAttribute('aria-pressed') === 'true' && w.document.documentElement.lang === 'es';
  checks['es: same keys and placeholders as English'] = w.eval(`Object.keys(I18N.en).every(k => k in I18N.es && JSON.stringify((JSON.stringify(I18N.en[k]).match(/\\{[\\w:-]+\\}/g) || []).sort()) === JSON.stringify((JSON.stringify(I18N.es[k]).match(/\\{[\\w:-]+\\}/g) || []).sort()))`);
  w.eval("openWork('Q2008211')"); await sleep(60);
  checks['es: a work is called by its Spanish title, the original underneath, and shows what exists in Spanish'] = $('#sheet-work h2').textContent === 'La mano izquierda de la oscuridad' && $('#sheet-work .alt').textContent === 'Título original: The Left Hand of Darkness' && /ES nada todavía/.test($('#sheet-work .avail').textContent) && /Novela/.test($('#sheet-work').textContent);
  w.eval("openWork('Q27903111')"); await sleep(60);
  checks['es: The Paper Menagerie is El zoo de papel in Spanish'] = $('#sheet-work h2').textContent === 'El zoo de papel' && /The Paper Menagerie/.test($('#sheet-work .alt').textContent);
  w.eval('closeSheets()');
  const nEsFragments = w.eval("Object.keys(WORKS).filter(q => availability(q).es === 'part').length");
  checks['es: coverage counts Spanish fragments'] = new RegExp('ES ' + nEsFragments + '\\b').test($('#about-cov').textContent) && /Qué puedes leer hoy/.test($('#about-cov').textContent);
  const sel = $('#lang-sel'); sel.value = 'ru'; sel.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(80);
  checks['language picker on phones: the native list switches the language'] = $('#tab-catalog').textContent.trim() === 'Читать' && $('#lang-cur').textContent === 'RU' && $('#lang-sel').getAttribute('aria-label') === 'Язык';
  sel.value = 'es'; sel.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(80);
  checks['es: plural and numbers'] = w.eval("plural(1, t('works')) + ' ' + plural(5, t('works'))") === 'obra obras';
  click($('#lang-pl')); await sleep(80);
  checks['pl strings'] = /Czytaj/.test($('#tab-catalog').textContent);
  checks['translations: every interface has matching keys and placeholders'] = w.eval(`(() => { const keys = Object.keys(I18N.en), ph = v => JSON.stringify((JSON.stringify(v).match(/\\{[\\w:-]+\\}/g) || []).sort()); return ['en','es','pl','ru'].every(l => Object.keys(I18N[l]).length === keys.length && keys.every(k => k in I18N[l] && ph(I18N[l][k]) === ph(I18N.en[k]))); })()`);
  await w.eval(`Store.put('suggestions', {id:'i18n-original',kind:'feedback',workId:'Q190192',comment:'Исходный комментарий: не изменять.',sent:Date.now(),at:Date.now()})`);
  let commentLanguagesOK = true;
  for (const lang of ['en', 'es', 'pl', 'ru']) {
    w.eval(`LANG = '${lang}'`); await w.eval('renderShelf()');
    const row = $$('#shelf-sugg .sugg').find(el => /Исходный комментарий/.test(el.textContent));
    commentLanguagesOK = commentLanguagesOK && !!row && row.querySelector('.snip').textContent === 'Исходный комментарий: не изменять.' && row.querySelector('strong').textContent.includes(w.eval("titleOf(work('Q190192'))")) && $('#sugg-clear-all').textContent.trim() === w.eval("t('shelf_delete_all')");
  }
  checks['translations: saved comments remain original while labels and work titles switch'] = commentLanguagesOK;
  checks['translations: file hints list DOCX and ODT in every interface'] = w.eval("['en','es','pl','ru'].every(l => /DOCX/.test(I18N[l].empty_files) && /ODT/.test(I18N[l].empty_files))");
  // Shelf deletion is scoped to a section and leaves sync deletion marks; Undo never rewrites file bodies.
  await w.eval(`(async () => { await Store.replaceAll({
    files: [{ id: 'shelf-file', title: 'Long test title', byline: 'Author', format: 'txt', words: 100, size: 45, html: '<p>Keep this file body exactly.</p>', at: 1 }],
    positions: [{ id: 'file:shelf-file', title: 'Long test title', pct: 25, at: 1 }, { id: 'ext:Q2008211', workId: 'Q2008211', title: 'The Left Hand of Darkness', ext: true, at: 2 }],
    bookmarks: [{ id: 'w:Q25349436', type: 'work', workId: 'Q25349436', at: 1 }, { id: 'pos:shelf', type: 'pos', key: 'file:shelf-file', title: 'Bookmarked place', pct: 25, snippet: 'Keep this', at: 1 }, { id: 'd:Q190192', type: 'done', workId: 'Q190192', at: 1 }, { id: 'r:shelf', type: 'recall', key: 'file:shelf-file', title: 'Long test title', note: 'Keep my note', at: 1 }],
    links: [{ id: 'Q190192', url: 'https://example.org/my-link', note: 'Keep this link', at: 1 }], suggestions: [{ id: 'shelf-suggestion', kind: 'feedback', text: 'Test private draft', at: 1 }]
  }); await loadLocal(); })()`);
  click($('#tab-shelf')); await sleep(100);
  checks['shelf: every saved-item section has Delete all and rows have Delete'] = ['bm', 'done', 'files', 'links', 'danger'].every(s => !!$(`#shelf-${s} [data-shelfclear]`)) && !!$('#reading-clear') && !!$('#sugg-clear-all') && !!$('#shelf-bm [data-shelfdel="bm"]') && !!$('#shelf-links [data-shelfdel="links"]') && !!$('#shelf-files [data-delfile]') && !!$('#shelf-sugg [data-sgdel]');
  checks['shelf: every saved-item list has a distinct danger zone'] = ['reading','bm','done','files','links','sugg'].every(s => !!$(`#shelf-${s} .shelf-danger-zone .btn-danger-strong`) && !!$(`#shelf-${s} .shelf-danger-zone svg`));
  checks['shelf: global danger zone is last and outside collapsed panels'] = $('#view-shelf').lastElementChild.id === 'shelf-danger' && !$('#shelf-danger').closest('details') && !$('#shelf-data [data-shelfclear]');
  click($('#shelf-links [data-shelfdel="links"]')); await sleep(100);
  checks['shelf: individual own-link Delete leaves other sections alone'] = (await w.eval("Store.all('links')")).length === 0 && (await w.eval("Store.all('files')")).length === 1 && (await w.eval("Store.all('bookmarks')")).length === 4;
  click($('#toast [data-shelfundo]')); await sleep(100);
  const beforeLinkDelete = await w.eval('syncPack()');
  click($('#shelf-links [data-shelfclear]')); await sleep(100);
  await w.eval(`syncMerge(${JSON.stringify(beforeLinkDelete)})`); await sleep(60);
  checks['shelf: deleted links do not return from an older synced shelf'] = (await w.eval("Store.all('links')")).length === 0 && (await w.eval("Store.all('tombs')")).some(x => x.id === 'links|Q190192');
  click($('#toast [data-shelfundo]')); await sleep(100);
  click($('#shelf-bm [data-shelfclear]')); await sleep(100);
  const afterBookmarks = await w.eval("Store.all('bookmarks')");
  checks['shelf: Delete all bookmarks preserves Finished and reading notes'] = !afterBookmarks.some(b => ['work', 'pos'].includes(b.type)) && afterBookmarks.some(b => b.type === 'done') && afterBookmarks.some(b => b.note === 'Keep my note');
  click($('#toast [data-shelfundo]')); await sleep(100);
  w.confirm = () => true;
  click($('#shelf-files [data-shelfclear]')); await sleep(100);
  checks['shelf: deleting files removes their places and notes, keeps unrelated progress'] = (await w.eval("Store.all('files')")).length === 0 && !(await w.eval("Store.all('positions')")).some(p => p.id === 'file:shelf-file') && (await w.eval("Store.all('positions')")).some(p => p.id === 'ext:Q2008211') && !(await w.eval("Store.all('bookmarks')")).some(b => b.key === 'file:shelf-file');
  click($('#toast [data-shelfundo]')); await sleep(100);
  checks['shelf: Undo restores the exact file body and related notes'] = (await w.eval("Store.get('files', 'shelf-file')")).html === '<p>Keep this file body exactly.</p>' && (await w.eval("Store.all('bookmarks')")).some(b => b.note === 'Keep my note');
  w.confirm = () => false;
  click($('#shelf-danger [data-shelfclear]')); await sleep(50);
  checks['shelf: cancelling Delete all saved items preserves the data'] = (await w.eval("Store.all('files')")).length === 1 && (await w.eval("Store.all('links')")).length === 1;
  w.confirm = () => true;
  click($('#shelf-danger [data-shelfclear]')); await sleep(100);
  checks['shelf: Delete all saved items clears personal records and retains deletion marks'] = (await Promise.all(['files', 'positions', 'bookmarks', 'links', 'suggestions'].map(s => w.eval(`Store.all('${s}')`)))).every(a => a.length === 0) && (await w.eval("Store.all('tombs')")).length > 0;
  click($('#toast [data-shelfundo]')); await sleep(100);
  checks['shelf: Undo all restores each saved-item section'] = (await w.eval("Store.all('files')")).length === 1 && (await w.eval("Store.all('links')")).length === 1 && (await w.eval("Store.all('suggestions')")).length === 1 && (await w.eval("Store.all('positions')")).length === 2;
  const privateSugg=w.eval('local.suggestions'); w.eval("local.suggestions=[{comment:'PRIVATE-READER-NOTE-12345'}]");
  const singleTask=w.eval("buildSearchTask('Q19947428')"), batchTask=w.eval("buildSearchTask('batch')");
  w.__savedSuggestions=privateSugg;w.eval('local.suggestions=window.__savedSuggestions');
  const payload=task=>JSON.parse(task.split('PUBLIC CATALOG SNAPSHOT (refresh main before submitting):\n')[1]);
  checks['agent task: one work with four-language scope, current URLs and canonical rules'] = payload(singleTask).length===1 && payload(singleTask)[0].qid==='Q19947428' && singleTask.includes('coverage.csv') && singleTask.includes('Change **only the new CSV') && payload(singleTask)[0].existing_links.some(x=>x.url.includes('det3gpWwLWI'));
  checks['agent task: random batch has five distinct public works and no shelf data'] = payload(batchTask).length===5 && new Set(payload(batchTask).map(x=>x.qid)).size===5 && !singleTask.includes('PRIVATE-READER-NOTE-12345') && !batchTask.includes('PRIVATE-READER-NOTE-12345');
  w.eval("copyAgentTask('Q19947428')"); await sleep(30);
  checks['agent task: clipboard receives a ready task'] = w.__clip && w.__clip.includes('Assigned QIDs: Q19947428');
  const clipboardWrite=w.navigator.clipboard.writeText;w.navigator.clipboard.writeText=async()=>{throw Error('denied')};
  w.eval("copyAgentTask('Q19947428')"); await sleep(30);
  checks['agent task: clipboard denial provides a selectable fallback'] = !$('#agent-dialog').hidden && $('#agent-task-text').readOnly && payload($('#agent-task-text').value)[0].qid==='Q19947428';
  w.eval('closeAgentTask()');w.navigator.clipboard.writeText=clipboardWrite;
  checks['no runtime errors'] = errors.length === 0;
  console.log(JSON.stringify({ checks, errors }, null, 1));
  process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
