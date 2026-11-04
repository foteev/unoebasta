# Reviewed findings import — 2026-11-04

Baseline: `05ad4cfe2fb03b0e338c9d7adbdaca1897605e7f`. PRs [#20](https://github.com/foteev/unoebasta/pull/20) and [#22](https://github.com/foteev/unoebasta/pull/22) had merged findings files without publishing them. This maintenance change imports both submissions: 65 links for 35 works (26 full-text links, 13 fragments and 26 audio pages). Original submissions and their review notes remain unchanged.

| Unique works | Before | After |
|---|---:|---:|
| Catalog | 656 | 656 |
| With any source | 298 | 323 |
| With a full text | 115 | 130 |
| With a fragment | 169 | 180 |
| With audio | 63 | 81 |

Source types and languages overlap; these counts must not be added together. Word counts remain estimates. External permission remains unknown. Audio retains metadata-only verification, with no new playback or completeness claim. The two findings notes preserve unresolved translations, editions and scoped unsuccessful searches.

Direct delivery rechecks at 13:39 UTC used an ordinary HTTP GET, closed after response headers, with a 15-second timeout. They did not repeat story or audio inspection:

| Work/source | Result |
|---|---|
| Neutron Star — Stony Brook University PDF | HTTP 503 |
| Paladin of the Lost Hour — Ellison Webderland | HTTP 503 |
| The Death of Dr. Island — Zanotowane | Timeout |
| Think Like a Dinosaur — Electronics & Books PDF | HTTP 503 |
| Speech Sounds — XpressEnglish | HTTP 200, text/html |

The earlier narrative inspection is retained as evidence; these links are not newly certified as universally accessible. Their original check dates and access limits remain attached to the full-text records. A successful HTTP status alone is not a second content verification.

Separate bibliography review opened both [FantLab 36589](https://fantlab.ru/work36589) and [36590](https://fantlab.ru/work36590). Q27881786 is the 1973 novella *The Death of Dr. Island*, Russian title **Смерть доктора Острова**, translated by А. Никулин (2015). Relation 36590 belongs to the distinct 1978 *The Doctor of Death Island*. The catalog now points to 36589 and uses the matching Russian title; no new Russian text availability is inferred.

Maintenance also keeps fragments visible alongside full texts and audio, labels external full-text sources individually, and removes the validator's separate work-count limit. Copied tasks still assign 30 works by default; submissions remain limited to one CSV (200 KB, 500 rows) and one optional note (60 KB).

Regression checks cover every imported link, external evidence and dates, unchanged repeat imports, coexisting source types in work cards, larger assigned batches and resource boundaries. Production deployment follows the normal PR merge into `main`.
