# Four-language audio research

Chat command: **search audio** / **ищи аудио**. Default: up to 40 missing work/language targets, across EN, PL, RU and ES. A number, language or QID can narrow the batch. This is a supervised assistant workflow, not an unattended service.

The requested first-pass model is **gpt-6-luna**. The parent assistant supplies the work QID, original title, every author, published translations and aliases, existing audio and bibliography links. Luna searches and reports evidence; the parent resolves ambiguous identities and reviews sources before importing. Never claim that a model was launched unless delegation actually succeeded. No API key is needed for an in-chat delegated run.

`npm run audio:plan` prepares `.cache/search/audio-plan.json` and durable research tasks for YouTube, Akniga, LibriVox and publisher sources. It **does not launch an AI model or make paid API calls**. For one work:

```sh
npm run audio:plan -- --qid Q19947428
```

For each work, check every language independently:

1. Resolve missing translated titles from FantLab, ISFDB, publishers and catalogues. Preserve translator, edition, anthology and alternate titles. Never translate a title speculatively. Match story versus novel, particularly homonyms such as Blood Music.
2. Search title + author + local audiobook terms, then alternate titles, narrator channels and anthology contents. Check YouTube and relevant public portals, including community sources; a platform whitelist must not suppress useful leads. Flibusta can supply text/edition leads too. Keep publisher sources preferred when available.
3. Open the specific video/episode/book page. Record URL, title, author, language, narrator/channel, duration, access restrictions, standalone story versus anthology, and what was actually inspected. A search snippet is a lead, not a verified player. Runtime is corroboration, not proof of completeness.
4. Return `found`, `inconclusive`, `blocked`, `paid_only` or `no_match_in_queries`, with precise source/query scope. Do not turn a missed search into “no audio exists in this language”. Store a paid anthology containing the story as a publication lead, not free audio coverage.
5. Save aliases, candidates, notes and checks in `data/research/`. Use the existing candidate/approve/export/import commands. Reviewed external links use `tier=external`; no license is invented. The importer preserves `rights=unknown`, audio metadata or full-page verification, evidence and check date. Record any sampled playback separately; do not claim an end-to-end listen.
6. Import the CSV, regenerate coverage, run secret/build/test checks and publish within the established authorization. Report new recordings by language, sourced metadata and remaining leads separately.

Only URLs and metadata are stored. Story bodies and recordings stay on the source sites. Bibliographic titles and sourced original summaries improve cards independently of text availability. Custom descriptions belong in `awards.json.descriptions[QID][lang]` with `text`, `source` and `url`; they must not be presented as Wikipedia excerpts.

The first pilot is **Q19947428**, Silverberg's Enter a Soldier. Later: Enter Another. It resolves Russian and Spanish titles, adds the narrator's Russian YouTube recording and a sourced Russian summary, and retains the English commercial compilation plus scoped PL/ES misses as research evidence. Its report also covers five additional Russian recordings and one unresolved story, with metadata-level verification explicitly recorded.
