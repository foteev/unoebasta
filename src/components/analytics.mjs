// Build-inlined classic-script fragment bundled by scripts/build-web.mjs; shares page global scope; do not import in Node.
/* ---------- analytics: send only public section names and catalog actions ---------- */
const ANALYTICS_ID = 'a4439374-4d07-4d26-91a7-3b6c91591dd2';
const ANALYTICS_SECTIONS = { catalog: 'read', library: 'catalog', awards: 'awards', shelf: 'shelf', about: 'about' };
const ANALYTICS_EVENTS = new Set(['open_work', 'read_click', 'listen_click', 'excerpt_click', 'choose_for_me']);
let analyticsReady = null;

function trackAnalytics(name, qid, referrer) {
  if (!analyticsReady || (!PAGE_PATH && !Object.hasOwn(ANALYTICS_SECTIONS, VIEW))) return;
  if (name && ((!PAGE_PATH && VIEW === 'shelf') || !ANALYTICS_EVENTS.has(name) || !/^Q[1-9]\d*$/.test(qid) || !Object.hasOwn(WORKS, qid))) return;
  const section = PAGE_PATH || ANALYTICS_SECTIONS[VIEW];
  const payload = { website: ANALYTICS_ID, hostname: 'foteev.github.io', url: PAGE_PATH || '/unoebasta/' + section, title: PAGE_PATH ? document.title : 'unoebasta · ' + section };
  if (name) { payload.name = name; payload.data = { qid }; }
  if (referrer) payload.referrer = referrer;
  analyticsReady.then(tracker => tracker?.track(payload)).catch(() => {});
}

function startAnalytics() {
  if (location.origin !== 'https://foteev.github.io' || !(PAGE_PATH ? [PAGE_PATH, PAGE_PATH + 'index.html'].includes(location.pathname) : ['/unoebasta/', '/unoebasta/index.html'].includes(location.pathname))) return;
  if (PRIVATE_ENTRY || navigator.doNotTrack === '1') return;
  const script = document.createElement('script');
  script.src = 'https://cloud.umami.is/script.js';
  script.referrerPolicy = 'no-referrer';
  script.dataset.websiteId = ANALYTICS_ID;
  script.dataset.autoTrack = 'false'; // Use only the explicit payload above, never the raw URL or DOM.
  analyticsReady = new Promise(resolve => {
    script.addEventListener('load', () => resolve(window.umami), { once: true });
    script.addEventListener('error', () => resolve(null), { once: true });
  });
  let referrer;
  if (document.referrer) {
    const source = new URL(document.referrer);
    if (['http:', 'https:'].includes(source.protocol) && source.origin !== location.origin) referrer = source.origin;
  }
  trackAnalytics(undefined, undefined, referrer);
  if (PAGE_WORK) trackAnalytics('open_work', PAGE_WORK);
  document.head.appendChild(script);
}

document.addEventListener('click', e => {
  const el = e.target.closest?.('[data-analytics]');
  if (!el || el.closest('#reader')) return;
  const name = el.closest('[data-pick-actions]') ? 'choose_for_me' : el.dataset.analytics;
  trackAnalytics(name, el.dataset.track || el.dataset.wid);
}, true);

