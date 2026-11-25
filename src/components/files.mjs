// Build-inlined classic-script fragment bundled by scripts/build-web.mjs; shares page global scope; do not import in Node.
/* ---------- text processing (your own files: TXT, HTML, EPUB, FB2) ---------- */
const ALLOWED_TAGS = ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'em', 'i', 'strong', 'b', 'blockquote', 'ul', 'ol', 'li', 'hr', 'a', 'img', 'pre', 'code', 'sup', 'sub', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'figure', 'figcaption', 'div', 'section', 'cite', 's', 'del'];
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(); s.onerror = () => { s.remove(); rej(new Error('load ' + src)); }; document.head.appendChild(s); }); }
const LIBS = {
  readability: ['https://cdn.jsdelivr.net/npm/@mozilla/readability@0.6.0/Readability.js', () => window.Readability],
  purify: ['https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js', () => window.DOMPurify],
  jszip: ['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', () => window.JSZip],
};
const libLoads = {};
function ensureLibs(names) {
  return Promise.all(names.map(name => {
    const [url, ready] = LIBS[name];
    if (ready()) return Promise.resolve();
    return libLoads[name] || (libLoads[name] = loadScript(url).then(() => { if (!ready()) throw new Error('load ' + name); }).catch(e => { delete libLoads[name]; throw e; }));
  }));
}
function cleanHtml(html, baseUrl) {
  let box;
  if (window.DOMPurify) {
    box = document.createElement('div');
    box.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ['href', 'src', 'alt', 'colspan', 'rowspan'] });
  } else {
    box = document.createElement('div'); box.innerHTML = html;
    box.querySelectorAll('script,style,iframe,object,embed,form,input,button,select,textarea,svg,video,audio,link,meta,noscript').forEach(n => n.remove());
    box.querySelectorAll('*').forEach(n => { [...n.attributes].forEach(a => { if (!['href', 'src', 'alt', 'colspan', 'rowspan'].includes(a.name)) n.removeAttribute(a.name); }); });
  }
  box.querySelectorAll('a').forEach(a => {
    const h = a.getAttribute('href'); let ok = null;
    try { const u = new URL(h, baseUrl || undefined); if (/^(https?|mailto):$/.test(u.protocol)) ok = u.href; } catch (e) {}
    if (ok) { a.setAttribute('href', ok); a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); } else a.removeAttribute('href');
  });
  box.querySelectorAll('img').forEach(img => {
    const s = img.getAttribute('src') || ''; let ok = null;
    if (/^data:image\//i.test(s)) ok = s; else if (baseUrl) { try { const u = new URL(s, baseUrl); if (/^https?:$/.test(u.protocol)) ok = u.href; } catch (e) {} }
    if (ok && !/pixel|track|spacer|1x1|blank\.gif/i.test(s)) img.setAttribute('src', ok); else img.remove();
  });
  box.innerHTML = box.innerHTML.replace(/(<br\s*\/?>\s*){2,}/gi, '</p><p>');
  box.querySelectorAll('p,div,h1,h2,h3,section').forEach(n => { if (!n.textContent.trim() && !n.querySelector('img')) n.remove(); });
  trimNavEdges(box);
  return box.innerHTML;
}
function trimNavEdges(body) {
  const isNav = el => { const tx = (el.textContent || '').trim(); const lt = [...el.querySelectorAll('a')].reduce((n, a) => n + a.textContent.trim().length, 0); return tx.length < 80 && lt > 0 && lt / Math.max(1, tx.replace(/[\s|·•\/-]/g, '').length) > 0.7; };
  let box = body;
  while (box.children.length === 1 && /^(DIV|SECTION|ARTICLE|MAIN)$/.test(box.firstElementChild.tagName)) box = box.firstElementChild;
  for (const pick of [() => box.firstElementChild, () => box.lastElementChild]) { let el; while ((el = pick()) && isNav(el)) el.remove(); }
}
function textToHtml(text) {
  return text.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map(block => {
    const b = block.trim(); if (!b) return '';
    if (/^([#*~]\s*){1,3}$/.test(b) || /^[-=_*\s]{3,}$/.test(b)) return '<hr>';
    const j = esc(b.replace(/\s*\n\s*/g, ' '));
    return /^={3,}/.test(b) ? `<h2>${j.replace(/=+/g, '').trim()}</h2>` : `<p>${j}</p>`;
  }).join('');
}
// Text files come in many encodings: UTF-8, UTF-16 (Windows Notepad), and the old one-byte code pages,
// windows-1251 for Russian and windows-1250 for Polish. In Russian text almost every letter is a byte above 0x7F,
// in Polish only the letters with diacritics are, so the share of such bytes tells the two apart.
function decodeBytes(buf, declared) {
  const tryDec = (enc, fatal) => { try { return new TextDecoder(enc, { fatal }).decode(buf); } catch (e) { return null; } };
  const u8 = new Uint8Array(buf);
  if (u8[0] === 0xFF && u8[1] === 0xFE) return tryDec('utf-16le', false);
  if (u8[0] === 0xFE && u8[1] === 0xFF) return tryDec('utf-16be', false);
  if (u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) return tryDec('utf-8', false);
  const n = Math.min(u8.length, 4000); let zEven = 0, zOdd = 0, high = 0, ascii = 0;
  for (let i = 0; i < n; i++) { const b = u8[i]; if (!b) i % 2 ? zOdd++ : zEven++; else if (b > 0x7F) high++; else if ((b | 32) >= 97 && (b | 32) <= 122) ascii++; }
  if (zOdd > n * 0.2 && zEven < n * 0.02) return tryDec('utf-16le', false);
  if (zEven > n * 0.2 && zOdd < n * 0.02) return tryDec('utf-16be', false);
  if (declared && !/^utf-?8$/i.test(declared)) { const d = tryDec(declared, false); if (d != null) return d; }
  const utf8 = tryDec('utf-8', true); if (utf8 != null) return utf8;
  return tryDec(high > ascii ? 'windows-1251' : 'windows-1250', false) ?? tryDec('utf-8', false);
}
// not text at all (a program, a picture, a format we do not read): better a clear message than a page of symbols
const looksBinary = s => { const n = Math.min(s.length, 4000); let bad = 0; for (let i = 0; i < n; i++) { const c = s.charCodeAt(i); if ((c < 9 || (c > 13 && c < 32)) || c === 0xFFFD) bad++; } return bad > n * 0.02; };
function countWords(html) { const d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').trim().split(/\s+/).filter(Boolean).length; }
function htmlFromDocument(doc, baseUrl) {
  if (baseUrl && !doc.querySelector('base[href]')) { const b = doc.createElement('base'); b.setAttribute('href', baseUrl); (doc.head || doc.documentElement).prepend(b); }
  const desc = pageDesc(doc);
  const metaTitle = (doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.title || '').split(/\s+[:|–—]\s+/)[0];
  let content = null, title = metaTitle, byline = '';
  if (window.Readability) { try { const a = new Readability(doc.cloneNode(true), { charThreshold: 400 }).parse(); if (a && (a.textContent || '').length > 600) { content = a.content; title = a.title || title; byline = (a.byline || '').replace(/\s+/g, ' ').trim(); } } catch (e) {} }
  if (!content) content = doc.body ? doc.body.innerHTML : '';
  const by = title.match(/^(.*?)\s+by\s+(.+)$/i); if (by) { title = by[1]; byline = byline || by[2]; }
  return { html: cleanHtml(content, baseUrl), title: title.trim(), byline, desc };
}
function pageDesc(doc) { return (doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || doc.querySelector('meta[name="description"]')?.getAttribute('content') || '').replace(/\s+/g, ' ').trim(); }
const plainText = s => { const d = document.createElement('div'); d.innerHTML = String(s || '').replace(/<\/(p|div|br)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n'); return (d.textContent || '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim(); };

/* File import: TXT, HTML, EPUB, FB2, FB2.ZIP, DOCX, ODT. The kind is told by the first bytes, not by the
   name: on phones a file often comes without its extension. */
async function parseFile(file) {
  const name = file.name || 'file';
  const lower = name.toLowerCase();
  const buf = await file.arrayBuffer();
  const u8 = new Uint8Array(buf.slice(0, 8)), starts = (...b) => b.every((x, i) => u8[i] === x);
  if (lower.endsWith('.pdf') || starts(0x25, 0x50, 0x44, 0x46)) throw new Error(t('pdf_no'));
  if (starts(0xD0, 0xCF, 0x11, 0xE0)) throw new Error(t('doc_no')); // the old Word .doc
  if (starts(0x50, 0x4B, 0x03, 0x04) || /\.(epub|zip|docx|odt)$/.test(lower)) return parseZip(buf, name);
  const head = new TextDecoder('ascii').decode(buf.slice(0, 1024));
  if (lower.endsWith('.fb2') || /<FictionBook/i.test(head)) return parseFb2(buf, name);
  if (/^\{\\rtf/.test(head)) throw new Error(t('rtf_no'));
  const declared = (head.match(/charset=["']?([\w-]+)/i) || head.match(/encoding=["']([\w-]+)/i) || [])[1];
  const text = decodeBytes(buf, declared);
  if (looksBinary(text)) throw new Error(t('file_unknown'));
  if (/\.(html?|xhtml)$/i.test(lower) || /<html|<body|<p[\s>]/i.test(text.slice(0, 4000))) {
    await ensureLibs(['readability', 'purify']);
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const r = htmlFromDocument(doc, null);
    return { title: r.title || name, byline: r.byline, html: r.html, format: 'html', desc: r.desc };
  }
  return { title: name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' '), byline: '', html: textToHtml(text), format: 'txt' };
}
const fileTitle = name => name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');
async function parseZip(buf, name) {
  await ensureLibs(['jszip']);
  if (!window.JSZip) throw new Error('ZIP');
  const zip = await JSZip.loadAsync(buf);
  const mt = zip.file('mimetype') ? (await zip.file('mimetype').async('string')).trim() : '';
  if (mt === 'application/epub+zip' || zip.file('META-INF/container.xml')) return parseEpub(buf, name);
  if (zip.file('word/document.xml')) return parseDocx(zip, name);
  if (/opendocument\.text/.test(mt) || zip.file('content.xml')) return parseOdt(zip, name);
  const inner = Object.values(zip.files).find(f => /\.fb2$/i.test(f.name)) || Object.values(zip.files).find(f => /\.(txt|html?|docx|odt|epub)$/i.test(f.name));
  if (!inner) throw new Error(t('file_unknown'));
  const innerBuf = await inner.async('arraybuffer');
  return parseFile(new File([innerBuf], inner.name.split('/').pop()));
}
// paragraphs → simple HTML: headings, paragraphs, line breaks; the reader styles them itself
const blocksToHtml = blocks => blocks.map(({ h, text }) => { const tx = text.replace(/[ \t]+/g, ' ').trim(); if (!tx) return ''; const inner = esc(tx).replace(/\n/g, '<br>'); return h ? `<h${h}>${inner}</h${h}>` : `<p>${inner}</p>`; }).join('');
// the reader already shows the title above the text: do not repeat it as the first heading
const dropTitle = (blocks, title) => { const i = blocks.findIndex(b => b.text.trim()); return i >= 0 && blocks[i].h && blocks[i].text.trim() === title ? blocks.filter((_, k) => k !== i) : blocks; };
async function docTitle(zip, path) {
  const core = zip.file(path); if (!core) return '';
  const d = new DOMParser().parseFromString(await core.async('string'), 'application/xml');
  const tEl = [...d.getElementsByTagName('*')].find(e => e.localName === 'title'); return tEl ? tEl.textContent.trim() : '';
}
// Word (DOCX): word/document.xml, paragraphs with their style; headings by style name or outline level
async function parseDocx(zip, name) {
  const doc = new DOMParser().parseFromString(await zip.file('word/document.xml').async('string'), 'application/xml');
  const body = [...doc.getElementsByTagName('*')].find(e => e.localName === 'body'); if (!body) throw new Error('DOCX');
  const blocks = [];
  const para = p => {
    let text = '';
    const walk = n => { for (const c of n.childNodes) { if (c.nodeType !== 1) continue; const l = c.localName; if (l === 't') text += c.textContent; else if (l === 'tab') text += ' '; else if (l === 'br' || l === 'cr') text += '\n'; else if (l !== 'pPr' && l !== 'rPr' && l !== 'instrText' && l !== 'delText') walk(c); } };
    walk(p);
    const pPr = [...p.childNodes].find(c => c.localName === 'pPr');
    const st = pPr ? [...pPr.getElementsByTagName('*')].find(e => e.localName === 'pStyle') : null;
    const sv = st ? (st.getAttribute('w:val') || '') : '';
    const ol = pPr ? [...pPr.getElementsByTagName('*')].find(e => e.localName === 'outlineLvl') : null;
    const lvl = /^(title|tytu|название|заголовок$)/i.test(sv) ? 1 : +((sv.match(/(?:heading|nag[łl][óo]wek|заголовок)\s*(\d)/i) || [])[1] || (ol ? +ol.getAttribute('w:val') + 1 : 0));
    blocks.push({ h: lvl ? Math.min(lvl + 1, 4) : 0, text });
  };
  const visit = n => { for (const c of n.childNodes) { if (c.nodeType !== 1) continue; if (c.localName === 'p') para(c); else if (c.localName !== 'sectPr') visit(c); } }; // tables and content controls: their paragraphs in order
  visit(body);
  const firstHead = blocks.find(b => b.h && b.text.trim());
  const title = await docTitle(zip, 'docProps/core.xml') || (firstHead ? firstHead.text.trim() : '') || fileTitle(name);
  return { title, byline: '', html: blocksToHtml(dropTitle(blocks, title)), format: 'docx' };
}
// OpenDocument text (ODT, LibreOffice): content.xml, text:h and text:p
async function parseOdt(zip, name) {
  const doc = new DOMParser().parseFromString(await zip.file('content.xml').async('string'), 'application/xml');
  const root = [...doc.getElementsByTagName('*')].find(e => e.localName === 'text' && e.parentNode && e.parentNode.localName === 'body'); if (!root) throw new Error('ODT');
  const blocks = [];
  const txt = n => { let s = ''; for (const c of n.childNodes) { if (c.nodeType === 3) s += c.textContent; else if (c.nodeType === 1) { const l = c.localName; if (l === 's') s += ' '.repeat(+(c.getAttribute('text:c') || 1)); else if (l === 'tab') s += ' '; else if (l === 'line-break') s += '\n'; else if (l !== 'note' && l !== 'annotation') s += txt(c); } } return s; };
  const visit = n => { for (const c of n.childNodes) { if (c.nodeType !== 1) continue; if (c.localName === 'h') blocks.push({ h: Math.min(+(c.getAttribute('text:outline-level') || 1) + 1, 4), text: txt(c) }); else if (c.localName === 'p') blocks.push({ h: 0, text: txt(c) }); else visit(c); } };
  visit(root);
  const firstHead = blocks.find(b => b.h && b.text.trim());
  const title = await docTitle(zip, 'meta.xml') || (firstHead ? firstHead.text.trim() : '') || fileTitle(name);
  return { title, byline: '', html: blocksToHtml(dropTitle(blocks, title)), format: 'odt' };
}
async function parseEpub(buf, name) {
  await ensureLibs(['jszip', 'purify']);
  if (!window.JSZip) throw new Error('EPUB');
  const zip = await JSZip.loadAsync(buf);
  const container = await zip.file('META-INF/container.xml')?.async('string');
  if (!container) throw new Error('EPUB: container.xml');
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const opfPath = xml(container).querySelector('rootfile')?.getAttribute('full-path');
  const opfText = await zip.file(opfPath)?.async('string');
  if (!opfText) throw new Error('EPUB: OPF');
  const opf = xml(opfText);
  const dir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const manifest = {}; opf.querySelectorAll('manifest > item').forEach(i => { manifest[i.getAttribute('id')] = i.getAttribute('href'); });
  const title = opf.getElementsByTagName('dc:title')[0]?.textContent || name;
  const creator = opf.getElementsByTagName('dc:creator')[0]?.textContent || '';
  const edesc = plainText(opf.getElementsByTagName('dc:description')[0]?.textContent || '');
  const parts = [];
  for (const ref of opf.querySelectorAll('spine > itemref')) {
    const href = manifest[ref.getAttribute('idref')]; if (!href) continue;
    const path = decodeURIComponent((dir + href).replace(/[^/]+\/\.\.\//g, ''));
    const s = await zip.file(path)?.async('string'); if (!s) continue;
    const doc = new DOMParser().parseFromString(s, 'application/xhtml+xml');
    const body = doc.querySelector('body') || new DOMParser().parseFromString(s, 'text/html').body;
    if (body && body.textContent.trim()) parts.push(cleanHtml(body.innerHTML, null));
  }
  return { title, byline: creator, html: parts.join('<hr>'), format: 'epub', desc: edesc };
}
async function parseFb2(buf, name) {
  const head = new TextDecoder('ascii').decode(buf.slice(0, 200));
  const enc = (head.match(/encoding=["']([\w-]+)/i) || [])[1];
  const text = decodeBytes(buf, enc);
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('FB2');
  const ti = doc.querySelector('description title-info');
  const title = ti?.querySelector('book-title')?.textContent || name;
  const au = ti?.querySelector('author');
  const byline = au ? [au.querySelector('first-name')?.textContent, au.querySelector('last-name')?.textContent].filter(Boolean).join(' ') : '';
  const ann = ti?.querySelector('annotation');
  const fdesc = ann ? [...ann.children].map(c => c.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n') || ann.textContent.replace(/\s+/g, ' ').trim() : '';
  const conv = node => {
    let out = '';
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { out += esc(n.textContent); return; }
      if (n.nodeType !== 1) return;
      const tag = n.localName;
      if (tag === 'p' || tag === 'v' || tag === 'subtitle' || tag === 'text-author') out += `<p>${conv(n)}</p>`;
      else if (tag === 'title') out += `<h2>${[...n.children].map(c => conv(c)).join(' ')}</h2>`;
      else if (tag === 'emphasis') out += `<em>${conv(n)}</em>`;
      else if (tag === 'strong') out += `<strong>${conv(n)}</strong>`;
      else if (tag === 'epigraph' || tag === 'cite') out += `<blockquote>${conv(n)}</blockquote>`;
      else if (tag === 'empty-line' || tag === 'image' || tag === 'binary') out += '';
      else out += conv(n);
    });
    return out;
  };
  const bodies = [...doc.getElementsByTagName('body')].filter(b => b.getAttribute('name') !== 'notes');
  const html = bodies.map(b => conv(b)).join('<hr>').replace(/<h2>\s*<\/h2>/g, '');
  await ensureLibs(['purify']);
  return { title, byline, html: cleanHtml(html, null), format: 'fb2', desc: fdesc };
}
