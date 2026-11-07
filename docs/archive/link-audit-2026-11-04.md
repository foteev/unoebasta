# Source-link audit — 2026-11-04 UTC

This is a historical snapshot of the audit. Access results and pull request states below reflect what was observed at the time. Current publication decisions are in [source reviews](../../data/source-reviews.json).

Baseline: `52ae687fbe414f3977b21c4f8394caa1bb7bb74e`. Reviewed the published reading links and source additions reachable through the repository’s merged/closed history, the historical findings CSVs, and open research PRs [#24](https://github.com/foteev/unoebasta/pull/24) and [#25](https://github.com/foteev/unoebasta/pull/25). The open dependency PRs do not contribute catalog sources.

## Results

| Check | Result |
|---|---|
| Inventory | 546 work/language/format claims, 534 unique addresses |
| Published / pending claims | 505 before cleanup / 38 in PRs #24 and #25 |
| Direct HTTP results | 474 × 200, 3 × 206, 11 × 403, 43 × 429, 3 × 503 |
| Removed | 45 empty LitRes readers and 1 audio page whose media file is 404 |
| Legimi | 70 pages contain guest samples; links now target `#sample_section` |
| Audio | Anonymous playback started on all 24 catalogued Akniga pages and all 5 Uncanny recordings whose direct HTTP checks returned 403; 72 additional linked media endpoints sampled, with 39 partial-audio responses, 32 access restrictions and 1 missing file |

Full machine-readable, per-claim evidence and provenance: [source access records](../../data/research/audits/2026-11-04-source-access.json). Browser playback observations: [audio samples](../../data/research/audits/2026-11-04-audio-samples.json). Publication-scope decisions: [source reviews](../../data/source-reviews.json). No story bodies or media files are published with this audit.

## The reported Legimi link

[Wydech on Legimi — open sample](https://www.legimi.pl/ebook-wydech-ted-chiang,b610123.html#sample_section) is a store page with a guest text sample far below the sales section. The sample contains the complete **The Merchant and the Alchemist’s Gate** through its ending and translator credit, then only the opening of **Exhalation**. The Merchant link remains `full`; Exhalation remains `fragment`. The commercial audiobook listing does not establish free full audio. This was observed in the live guest browser and in the source’s sample container.

The same distinction is now enforced when importing findings: a sample for the whole paid book cannot be submitted as full text or full audio. Fragment identifiers are preserved for navigation while source identity ignores them for deduplication.

## Confirmed removals

### Empty LitRes readers

All 45 had HTTP 200 and plausible title/author metadata, but a second body check found both a reader error and an unavailable edition. A live guest-browser check confirmed the error and “not for sale” state. These are access failures, not a claim that every affected title is a paid book. The 45 false excerpt entries are removed from `awards.json.ex`, and re-import is blocked pending new maintainer-reviewed evidence.

Provenance: 40 were already in the initial catalog commit `62116876`; five were introduced in the later pre-PR fragment expansion `750e3253`. They did not originate in the still-open #24/#25 batches.

| Work | Removed source |
|---|---|
| Q1659714 — A Canticle for Leibowitz | [LitRes reader](https://www.litres.ru/book/uolter-miller-mladshiy/gimn-leybovicu-126780/chitat-onlayn/) |
| Q2292400 — A Deepness in the Sky | [LitRes reader](https://www.litres.ru/book/vernor-vindzh/glubina-v-nebe-9800240/chitat-onlayn/) |
| Q58221164 — A Fire Upon the Deep | [LitRes reader](https://www.litres.ru/book/vernor-vindzh/plamya-nad-bezdnoy-8507597/chitat-onlayn/) |
| Q17026037 — A Song for Lya | [LitRes reader](https://www.litres.ru/book/dzhordzh-r-r-martin-45006/pesn-o-lii-125422/chitat-onlayn/) |
| Q2300209 — Accelerando | [LitRes reader](https://www.litres.ru/book/charlz-stross/achchelerando-63140118/chitat-onlayn/) |
| Q430514 — American Gods | [LitRes reader](https://www.litres.ru/book/nil-geyman/amerikanskie-bogi-429152/chitat-onlayn/) |
| Q2360806 — Anansi Boys | [LitRes reader](https://www.litres.ru/book/nil-geyman/synovya-anansi-8613701/chitat-onlayn/) |
| Q16961640 — Annihilation | [LitRes reader](https://www.litres.ru/book/dzheff-vandermeer/annigilyaciya-8981462/chitat-onlayn/) |
| Q3294967 — Blue Mars | [LitRes reader](https://www.litres.ru/book/kim-robinson/goluboy-mars-22879242/chitat-onlayn/) |
| Q741013 — Contact | [LitRes reader](https://www.litres.ru/book/karl-sagan/kontakt-135995/chitat-onlayn/) |
| Q475125 — Coraline | [LitRes reader](https://www.litres.ru/book/nil-geyman/koralina-442785/chitat-onlayn/) |
| Q534975 — Cryptonomicon | [LitRes reader](https://www.litres.ru/book/nil-stivenson/kriptonomikon-122851/chitat-onlayn/) |
| Q356107 — Cyteen | [LitRes reader](https://www.litres.ru/book/kerolayn-cherri/saytin-izmena-158417/chitat-onlayn/) |
| Q17625679 — Desolation Road | [LitRes reader](https://www.litres.ru/book/yen-makdonald/doroga-zapusteniya-49526711/chitat-onlayn/) |
| Q816016 — Ender's Game | [LitRes reader](https://www.litres.ru/book/orson-skott-kard/igra-endera-122405/chitat-onlayn/) |
| Q3294970 — Green Mars | [LitRes reader](https://www.litres.ru/book/kim-robinson/zelenyy-mars-22150793/chitat-onlayn/) |
| Q3221827 — Heart-Shaped Box | [LitRes reader](https://www.litres.ru/book/dzho-hill/korobka-v-forme-serdca-68566005/chitat-onlayn/) |
| Q108030514 — Jade Legacy | [LitRes reader](https://www.litres.ru/book/li-fonda/nefritovoe-nasledie-67313457/chitat-onlayn/) |
| Q1474920 — Jonathan Strange & Mr Norrell | [LitRes reader](https://www.litres.ru/book/suzanna-klark/dzhonatan-strendzh-i-mister-norrell-140659/chitat-onlayn/) |
| Q610680 — Last Call | [LitRes reader](https://www.litres.ru/book/tim-pauers/poslednyaya-stavka-28506508/chitat-onlayn/) |
| Q16056012 — Nightflyers | [LitRes reader](https://www.litres.ru/book/dzhordzh-r-r-martin-45006/letyaschie-skvoz-noch-125420/chitat-onlayn/) |
| Q2901129 — Nightwings | [LitRes reader](https://www.litres.ru/book/robert-silverberg/nochnye-krylya-70320316/chitat-onlayn/) |
| Q3400801 — Powers | [LitRes reader](https://www.litres.ru/book/ursula-kreber-le-guin/prozrenie-177716/chitat-onlayn/) |
| Q729783 — Seeker | [LitRes reader](https://www.litres.ru/book/dzhek-makdevit/iskatel-8483098/chitat-onlayn/) |
| Q2301398 — Spin | [LitRes reader](https://www.litres.ru/book/robert-uilson/spin-67774526/chitat-onlayn/) |
| Q1416458 — Stand on Zanzibar | [LitRes reader](https://www.litres.ru/book/dzhon-branner/vsem-stoyat-na-zanzibare-154946/chitat-onlayn/) |
| Q492207 — Starship Troopers | [LitRes reader](https://www.litres.ru/book/robert-haynlayn/zvezdnyy-desant-69304117/chitat-onlayn/) |
| Q2363504 — Startide Rising | [LitRes reader](https://www.litres.ru/book/devid-brin/zvezdnyy-priliv-22608612/chitat-onlayn/) |
| Q929821 — Stranger in a Strange Land | [LitRes reader](https://www.litres.ru/book/robert-haynlayn/chuzhak-v-strane-chuzhoy-27095720/chitat-onlayn/) |
| Q543562 — The Diamond Age | [LitRes reader](https://www.litres.ru/book/nil-stivenson/almaznyy-vek-120016/chitat-onlayn/) |
| Q467720 — The Dispossessed | [LitRes reader](https://www.litres.ru/book/ursula-kreber-le-guin/obdelennye-169730/chitat-onlayn/) |
| Q25217632 — The Fifth Season | [LitRes reader](https://www.litres.ru/book/n-k-dzhemisin/pyatoe-vremya-goda-41926901/chitat-onlayn/) |
| Q30030695 — The Grace of Kings | [LitRes reader](https://www.litres.ru/book/ken-lu-8970493/korolevskie-milosti-21991501/chitat-onlayn/) |
| Q3231338 — The Hundred Thousand Kingdoms | [LitRes reader](https://www.litres.ru/book/n-k-dzhemisin/sto-tysyach-korolevstv-6562275/chitat-onlayn/) |
| Q132062 — The Lathe of Heaven | [LitRes reader](https://www.litres.ru/book/ursula-kreber-le-guin/rezec-nebesnyy-124497/chitat-onlayn/) |
| Q10594892 — The Night Circus | [LitRes reader](https://www.litres.ru/book/erin-morgenshtern/nochnoy-cirk-8954714/chitat-onlayn/) |
| Q30337352 — The Obelisk Gate | [LitRes reader](https://www.litres.ru/book/n-k-dzhemisin/vrata-obeliska-64507522/chitat-onlayn/) |
| Q14548336 — The Ocean at the End of the Lane | [LitRes reader](https://www.litres.ru/book/nil-geyman/okean-v-konce-dorogi-6379535/chitat-onlayn/) |
| Q39058554 — The Stone Sky | [LitRes reader](https://www.litres.ru/book/n-k-dzhemisin/kamennye-nebesa-65536052/chitat-onlayn/) |
| Q29994238 — The Storms of Windhaven | [LitRes reader](https://www.litres.ru/book/dzhordzh-r-r-martin-45006/shtorm-v-gavani-vetrov-6598848/chitat-onlayn/) |
| Q100324066 — The Strange Case of the Alchemist's Daughter | [LitRes reader](https://www.litres.ru/book/teodora-goss/strannaya-istoriya-docheri-alhimika-26722992/chitat-onlayn/) |
| Q2623688 — The Telling | [LitRes reader](https://www.litres.ru/book/ursula-kreber-le-guin/tolkovateli-150044/chitat-onlayn/) |
| Q2447776 — The Word for World Is Forest | [LitRes reader](https://www.litres.ru/book/ursula-kreber-le-guin/slovo-dlya-lesa-i-mira-odno-124637/chitat-onlayn/) |
| Q603645 — The Yiddish Policemen's Union | [LitRes reader](https://www.litres.ru/book/maykl-sheybon/souz-evreyskih-polismenov-41042539/chitat-onlayn/) |
| Q3226889 — Those Who Hunt the Night | [LitRes reader](https://www.litres.ru/book/barbara-hembli/te-kto-ohotitsya-v-nochi-127975/chitat-onlayn/) |

### A surviving author page with a missing audio file

The catalogued **How to Talk to Girls at Parties** audio page links `http://web3.streamhoster.com/idstaff/excerpt/Fragile_Things.mp3`, which returned HTTP 404 during the media check. Its audio entry is removed; the work’s text link remains. The audio page already existed in the early catalog/history, rather than in pending #24/#25.

## Explicit verification limits

- **Google Books:** all 43 preview addresses returned 429 to the audit client; an independent API attempt hit quota exhaustion. They are conditional previews, not newly certified readable pages. No verdict of “paid” or “dead” follows from this restriction.
- **Macmillan:** six pages returned a browser-security challenge to this client: one already published, four in #24 and one in #25. Indexed excerpt prose is evidence of a source, but live guest access still needs a reader check. The five pending rows are not approved for publication by this audit.
- **Other access restrictions:** five direct Uncanny/Libsyn recordings returned 403 to the HTTP client, then all five successfully played in the anonymous browser. Two print-source hosts returned 503. The Paladin source also returned 503 to the HTTP client, but indexed primary prose was separately accessible. Both Gizmodo stories returned an HTTP-200 placeholder to one client while the web retrieval tool showed their actual attributed narrative; they are retained and labelled as client-dependent in the evidence.
- **Scanned PDFs:** A Study in Emerald was visually checked on its first and final pages because text extraction is empty. The River Has Roots preview was visually checked on a narrative page. The New America collection scan was visually checked on the assigned story title page (printed 159) and a narrative page; it retains its conservative fragment classification, without claiming a full read. The Sleeper and the Spindle PDF was also visually checked on a narrative page.
- **Download pages:** the Serving Library’s Speech Sounds page has a short introduction and a working anonymous PDF download, observed in the browser. A checkout announcement elsewhere on the site does not make that download paid.
- **Other episode pages:** metadata was inspected for the remaining audio addresses; the per-claim record distinguishes page-only, media-byte and actual browser checks. A Play button or episode description alone is not a playback approval. Acast did not start in this browser during the attempted check, so its recordings retain a playback-verification limit.
- **Audio:** playback-start and byte-sample checks are not end-to-end listens and do not certify narration identity throughout or complete runtime. The record preserves this limit instead of upgrading page metadata to a full-listen claim.

### Pending Macmillan rows for reader verification

| PR | Work | Page |
|---|---|---|
| #24 | The Tusks of Extinction | [Publisher excerpt](https://us.macmillan.com/books/9781250855527/thetusksofextinction/) |
| #24 | What Feasts at Night | [Publisher excerpt](https://us.macmillan.com/books/9781250830852/whatfeastsatnight/) |
| #24 | Thornhedge | [Publisher excerpt](https://us.macmillan.com/books/9781250409195/thornhedge/) |
| #24 | Where the Drowned Girls Go | [Publisher excerpt](https://us.macmillan.com/books/9781250213617/wherethedrownedgirlsgo/) |
| #25 | Seasons of Glass and Iron | [Publisher excerpt](https://us.macmillan.com/books/9781250341013/seasonsofglassandiron/) |

## Prevention

- Source-scope reviews are checked in both contribution validation and maintainer import. Historical CSVs stay intact as history; they cannot silently restore an excluded source.
- Search instructions now require actual guest prose/playback, work-specific scope inside collections, an exact read/sample control, and a named human-check request when automated access cannot establish the claim.
- The scheduled link checker now includes excerpts and Google Books addresses, uses GET body checks, and reports successful missing-reader/placeholder pages. It explicitly does not certify story scope, complete audio or permission.

## Validation

Updated coverage and production build; source-review and content-diagnostic regressions; existing UI and Chromium/mobile suites. Final CI and deployment status are recorded in the maintenance PR.
