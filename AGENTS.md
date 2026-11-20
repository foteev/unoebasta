# Reader-delegated contribution tasks

When the request contains an assigned-QID contribution task, follow [docs/search-brief.md](docs/search-brief.md). Deliver only one new findings CSV and an optional matching note, or notes only. Do not run the maintainer import/publication workflow (`npm run import:pending`) or modify code, coverage, the research registry or these instructions. The model is chosen by the reader.

# Catalog research

When asked to **continue search**, follow [docs/continue-search.md](docs/continue-search.md) and the verification rules in [docs/search-brief.md](docs/search-brief.md).

Carry the requested batch through discovery, targeted source checks, review, durable notes, CSV import, validation and publication within the user's authorized scope. Do not stop after planning, a smoke test or generating unreviewed candidates. Routine source and implementation choices do not require another confirmation. Keep uncertain results as annotated leads and report material blockers accurately.

The automatic runner does not perform human verification. Measure useful outcomes by verified new links, resolved title/author identities and specific publication leads; request counts alone do not demonstrate success.

# Human verification list when in doubt

If you have doubt about a source, do not import it. Do not submit unverified or doubtful links into findings or coverage.

Always verify actual text boundaries and playable audio streams before you import. Check for:
- Copyright blocks on community audio sites (for example: `class="book_blocked"` on knigavuhe).
- Commercial preview samples (for example: LitRes trial clips with duration 0).
- Truncated texts that miss the final narrative sentence.

If a link is uncertain, compile a verification list for the human. Write the list in your response. Include:
1. The work ID (QID), title, and author.
2. The candidate URL.
3. The observed status, byte length, or duration.
4. The exact question for the human to verify in a browser.

Keep uncertain candidates in the research notes as unresolved leads.

# Public catalog pages and Google Search

For each new or substantially updated public page, follow the [publication and indexing checks](docs/catalog-pages.md#publication-and-indexing-checks). Run the local checks for every change. After an authorized deployment, check the live pages and use Search Console for a small sample when access is available. Report crawl and index status separately. Reader-delegated tasks stop at the contribution files.

# Multilingual audio research

When asked to **search audio**, **ищи аудио** or continue the audio agent, follow [docs/audio-search.md](docs/audio-search.md). The user requested GPT Luna for first-pass discovery. Use `gpt-6-luna` when that model is available for delegation; the parent reviews identities and source evidence before publication. Prepare and carry a bounded batch through durable records, reviewed import, tests and deployment. If the model is unavailable, state that fact rather than silently claiming Luna ran.
