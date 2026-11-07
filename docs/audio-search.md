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
3. Apply the [audio verification and reader-check rules](search-brief.md#search-and-verify-each-work) to the specific video, episode or book page. Record narrator, duration, scope and actual playback evidence.
4. Return `found`, `inconclusive`, `blocked`, `paid_only` or `no_match_in_queries`, with precise source/query scope. Do not turn a missed search into “no audio exists in this language”. Store a paid anthology containing the story as a publication lead, not free audio coverage.
5. Save aliases, candidates, notes and checks in the [research registry](research.md). Follow the [review, import and publication steps](search-pipeline.md#verify-and-approve) within the established authorization. Report new recordings by language, sourced metadata and remaining leads separately.

Only URLs and metadata are stored. Story bodies and recordings stay on the source sites. Bibliographic titles and sourced original summaries improve cards independently of text availability. Custom descriptions belong in `awards.json.descriptions[QID][lang]` with `text`, `source` and `url`; they must not be presented as Wikipedia excerpts.

The [2026-11-03 audio pilot](../data/research/audio-pilot-2026-11-03.json) records the Silverberg example and its verification limits.
