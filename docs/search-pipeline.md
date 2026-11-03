# Search and review pipeline

The discovery CLI reads the versioned `awards.json`, `READ` table, previous `data/found/*.csv` files and `data/research/` registry. It does not need a live GitHub download of `coverage.csv` or a backend. Google Books requires an API key; the other six providers work without one. The [search brief](search-brief.md) remains the authority for rights and manual verification. See [language versions and research notes](research.md) for aliases, potential sources and manual follow-ups.

## Collect candidates

Install dependencies with `npm ci`, then run:

```sh
npm run search -- run --lang en --kind full --forms "short story,novelette" --limit 50
npm run search -- list
```

Providers: `clarkesworld`, `escapepod`, `podcastle`, `pseudopod` (English publisher search pages), `gutenberg` (official metadata CSV), `librivox` (human recordings) and `google` (book previews). Narrow a run with `--providers gutenberg,librivox`, `--qid Q123,Q456`, `--lang es` or `--kind audio`. Use `--lead LEAD_ID` to run one automatic source task. Non-English searches use known translated titles and curated aliases. Missing titles create bibliography tasks without making provider requests; these adapters do not discover translation titles.

### Google Books key

[Google requires an API key or OAuth identifier for public API data](https://developers.google.com/books/docs/v1/using#APIKey). Enable **Books API** in your Google Cloud project, create an API key and restrict its API access to Books API. Check the project's available request quota: a key identifies the project but does not bypass an exhausted or zero quota.

For Actions, add a repository secret named `GOOGLE_BOOKS_API_KEY` under **Settings → Secrets and variables → Actions → New repository secret**. The workflow reads it on its next run. Locally, provide the same environment variable through your shell or secret manager. Do not put its value in a command argument, CSV, source file or chat.

The CLI sends the key in the `x-goog-api-key` header only to the HTTPS Books API endpoint, rejects redirects for those requests and redacts reflected key values from responses and errors. URLs, artifacts and the static page contain no key. Without configuration, Google checks are marked `configuration_required` without making requests; other providers continue. Once configured, these checks retry automatically on the next run. Auth/quota failures remain `blocked`, never `not_found`.

Completed checks resume for seven days for the same work, language, format, provider and title/name variants. Completed checks do not consume the next batch's limit, so another run advances through the catalog. Errors and blocked requests are retried on the next invocation. `--refresh` repeats completed checks; successful HTTP responses still use their seven-day cache. Delete `.cache/search/http` to force fresh network requests. Historical `kind=none` rows remain research notes and never block a whole language; `--retry-searched` is retained as an alias for `--refresh`.

Requests are sequential, with a per-host queue, a 30-second timeout, up to two retries for network errors/429/5xx, exponential backoff and `Retry-After`. LibriVox requests are spaced by at least five seconds. Responses over 64 MiB are rejected. Local successful-response caching avoids repeat downloads of the Gutenberg catalog. State is atomically saved after each provider check, including failures; an interrupted in-flight request is repeated on resume. Keep one process per state file.

`.cache/` is ignored by Git. It may contain publisher HTML; never commit it. `state.json` holds candidates plus touched research records, without story bodies. Scoped checks, notes and decisions are also saved to `data/research/` (select another location with `--research-dir`). Commit those files to preserve results beyond cache expiry. Use `--state <path>` to resume a downloaded Actions artifact, and `npm run research -- import-state --file <path>` to merge its research history. Keep one writer per state/research directory.

## Verify and approve

Automatic discovery is deliberately conservative about title, author and language. It cannot prove that a story is complete, a translation is authorized or a preview includes the target story. Magazine pages with an unconfirmed author remain visibly marked. Matching uses exact normalized title variants and localized author names/initials, not title-only fuzzy similarity. All coauthors must match. Some real editions will therefore be missed. A page offering both text and audio can have separate review tasks; known links are scoped by language and format.

Open each candidate URL. Check the work and all authors, edition/language, complete text or human recording, access without login and rights. For a collection, locate the target story in the visible pages. Google Books records include `country` and `viewability`; availability can differ elsewhere. Gutenberg and LibriVox rights require a manual check and normally use `t2us`, not worldwide public domain.

```sh
npm run search -- approve --id CANDIDATE_ID --kind full --tier t2 --words 6200 --pub "Magazine #100" --evidence "Opened publisher page; correct author, complete English story, no paywall"
npm run search -- reject --id OTHER_ID --evidence "Different author with the same title"
npm run search -- export --out data/found/2026-11-03.csv
```

Approval requires explicit kind, tier and evidence, plus an estimated word count for full text. Optional fields: `--title`, `--license`, `--pub`, `--part`, `--archive yes`. Each part must be approved separately. Export writes exactly the 15 columns from the brief, includes only approved links still absent from the catalog, and refuses to overwrite an existing file. Neither discovery nor export modifies the page.

`not_found` means no exact match in a named provider query, not that the work is unavailable everywhere. Truncated/uncertain searches are `inconclusive`; HTTP errors and blocks are separate outcomes. The tool never converts these into `kind=none`. Add such CSV rows manually only after checking and describing the actual search scope.

## Import and publish

```sh
node scripts/merge-found.mjs data/found/2026-11-03.csv
npm run coverage
npm run check:secrets
npm run build
npm test
```

The importer validates the whole CSV before writing. It adds links to existing works, preserves their previous sources, handles each language/kind independently and requires consecutive multipart sets. One new source per language/kind is selected using the publisher preference order. New links on existing works carry their own `added` timestamp; the work keeps its original date so News announces the new recording or text link. Duplicate links are ignored; a second identical import does not change timestamps. Wayback requires `--archive`. Submit the reviewed CSV and resulting catalog changes in a PR; Pages deploys when merged into `main`.

## GitHub Actions

Run **Search candidates** manually in Actions. It restores the previous search cache/checkpoint when available, builds a source plan and uploads `search-review-<run id>` with `state.json`, `plan.json` and all four research registry files, even when some providers fail. The plan includes manual source tasks; only the selected automatic providers execute. Download it, import its state into the current registry, then use `--state <downloaded state.json>` with `list`, `approve` and `export`. Commit the merged research changes through a PR. Cache availability is best effort; artifacts expire after 30 days. The workflow has read-only repository permissions and never imports or publishes candidates automatically. Existing Links, CI and Pages workflows keep their separate roles.
