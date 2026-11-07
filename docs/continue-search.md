# Continue search

**Chat instruction:** `continue search` (or `продолжай поиск`). It requests one complete research batch, using the latest repository state, without stopping for routine decisions. The default budget is about 50 work/language targets. A number can override it: `continue search: 100 targets, Polish and Spanish first`.

This is a repository workflow instruction for an assistant, not an installed ChatGPT slash command or a scheduled background agent. The CLI below handles automatic discovery; the assistant also performs targeted checks and review.

## What counts as progress

A repeated negative API query does not improve coverage. Change the source or resolve a missing identity when a channel yields nothing. Report new verified text/audio/fragment links by language, sourced translation or author aliases, specific publication leads, unresolved candidates and blocks separately. Do not count search requests as discoveries.

Use this order:

1. Load current coverage, research notes and pending candidates. Preserve prior decisions. Start with a plausible existing lead or an accessible publisher, rather than another generic API query.
2. For English short fiction, follow the magazine, author and ISFDB publication references. Inspect the contents of a collection when the story has no separate page. For PL/RU/ES books, search publisher and legitimate retailer samples using the published title and author aliases. Google Books is a fallback; a negative Google result does not close those tasks.
3. Resolve unknown translation titles and author pseudonyms from primary or authoritative bibliographic sources. Add a sourced alias before searching under it. Do not guess translated names or URLs.
4. Use the automatic command for another bounded batch. Its default sources are publisher magazines and Google Books; Gutenberg and LibriVox remain available explicitly for suitable older works. Their rights status still needs review.
5. Apply the [verification rules](search-brief.md#search-and-verify-each-work) to promising URLs. Prefer a publisher-hosted readable sample over a country-dependent preview when both exist. Keep edition clues, scoped negatives and next actions in the [research registry](research.md).
6. Import any Actions checkpoint before review. Follow the [review, import and publication steps](search-pipeline.md#verify-and-approve) within the session's authorization. Report verified additions and remaining uncertainty. If publication is blocked, retain the reviewable work and identify the blocker.

## One automatic command

```sh
npm run search:continue
```

It shares a total budget of 50 work/language targets across EN, PL, RU and ES, resumes scoped checks, preserves discovered URLs/publications as leads, restores pending candidates from the committed registry if the cache was lost, and writes:

- `.cache/search/state.json`: candidates, review decisions and checkpoint;
- `.cache/search/report.json`: this run's counts, paused sources and pending candidates;
- `.cache/search/plan.json`: possible automatic and manual follow-up tasks;
- `data/research/`: persistent aliases, notes, candidate links and scoped checks, ready to commit.

Run it again to advance. Fresh checks do not consume the batch limit; small budgets rotate through languages. Errors pause only the affected source for that invocation and produce `completed_with_issues`; other sources continue. Failed sources retry on the next invocation. Fatal input/storage errors still fail the command. HTTP caching and host rate limits apply.

```sh
npm run search:continue -- --limit 100
npm run search:continue -- --lang es --kind fragment --limit 20
npm run search:continue -- --lang en --providers gutenberg,librivox --qid Q123,Q456 --limit 10
```

The QIDs are placeholders. The command needs dependencies installed with `npm ci`. Google requires `GOOGLE_BOOKS_API_KEY` in the environment. It never reads the key from a command argument or writes it to a report.

In GitHub Actions, run **Search candidates** with `lang=all` (the default), or, with an authenticated GitHub CLI:

```sh
gh workflow run search.yml --ref main -f lang=all -f limit=50
```

Actions reads the repository secret, restores the checkpoint when available and uploads the report, queue, plan and registry. Download/import the artifact and commit the results; the workflow has read-only repository permissions. This is a one-time invocation, not a schedule. The command itself never approves candidates or publishes unverified links. See [the research registry](research.md) and [review/import commands](search-pipeline.md).

For a multilingual audio batch, follow [audio-search.md](audio-search.md). External sources may be recorded with permission unverified; publisher-only filtering must not silently discard them.
