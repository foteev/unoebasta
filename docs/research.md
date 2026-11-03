# Language versions, sources and research notes

The catalog identifies a work by Wikidata QID. Availability is independent for each **work × language × format** (`full`, `audio`, `fragment`). A bibliography can identify a translation or edition without proving that its text is freely accessible. The [search brief](search-brief.md) defines the access and rights checks.

## Durable research files

These files are versioned with the project, separately from disposable HTTP caches:

| File in `data/research/` | Contents |
| --- | --- |
| `aliases.json` | Published title variants and localized author names, each with language and provenance |
| `sources.json` | Source capabilities, languages, automatic/manual mode and default next action |
| `leads.jsonl` | Leads, publication references, uncertainties, notes, next actions, review decisions and recheck dates |
| `checks.jsonl` | Append-only outcomes scoped to work, language, format, provider and exact title/name variants |

A lead needs a hint and its origin. It can refer to an anthology, translator, issue or ISBN without having a URL. A hint is not counted as coverage. `open`, `needs_title`, `candidate`, `searched`, `inconclusive`, `blocked`, `confirmed`, `rejected` and `deferred` distinguish the stages. `confirmed` on a title task means a sourced title was recorded; on an availability task it means a candidate passed explicit review. Publication still requires CSV import.

Notes are timestamped and survive repeated discovery, checkpoint imports and lost HTTP caches. Rejected candidates retain their reasons; an automatic search can be repeated later without reopening the same rejected candidate. Deferred tasks pause requests until their recheck date, or indefinitely when no date is set. Use one writer per research directory and state file.

## Languages and matching

English, Polish, Russian and Spanish have independent coverage. Canonical titles come from the catalog; curated aliases extend them without overwriting catalog values. Author matching accepts the localized name, canonical name and sourced aliases, and checks **every** coauthor. Titles are compared exactly after case, accent and punctuation normalization. Homonymous works by different authors remain distinct.

Google Books queries use up to eight title/name combinations; LibriVox and magazine searches use up to eight title variants. A truncated search is inconclusive when it finds no candidate. This is a bounded search, not an exhaustive census of editions or translations.

If no translated title is known, the planner creates a `needs_title` task pointing to the relevant bibliography where a catalog ID exists. Discovery makes no title-based provider request for that task. Add a published title with its source; do not invent a translation of the English title. The next invocation loads the alias and can search for availability.

```sh
npm run research -- list --lang ru --status needs_title
npm run research -- alias --type titles --qid Q123 --lang ru --value "Published translation title" --origin "Publisher or bibliography URL and edition"
npm run research -- alias --type authors --qid Q456 --lang ru --value "Localized author name" --origin "Author authority record"
```

`Q123`, `Q456`, `LEAD_ID` and `CANDIDATE_ID` below are placeholders for real catalog identities. A title alias uses a work QID; an author alias uses an author QID.

`coverage.csv` keeps the original `audio` summary and appends `audio_en`, `audio_pl`, `audio_ru`, `audio_es`. A known title or a possible edition never changes an availability column.

## Which sources are executed

| Source | Languages | Mode and purpose |
| --- | --- | --- |
| Gutenberg | EN, PL, RU, ES | Automatic metadata match for full text |
| LibriVox | EN, PL, RU, ES | Automatic match for human audio |
| Google Books | EN, PL, RU, ES | Automatic preview candidates; key required; country recorded |
| Clarkesworld, Escape Pod, PodCastle, PseudoPod | EN | Automatic publisher-page candidates for full text/audio |
| Legimi | PL | Manual official fragment check |
| LitRes | RU | Manual official fragment check |
| Casa del Libro, Planeta | ES | Manual official fragment check |
| FantLab | RU | Manual translations, edition references and publication leads |
| ISFDB | EN, PL, RU, ES | Manual title/edition references and publication leads |
| Lecturalia | ES | Manual translated-title research |
| Publisher, author | EN, PL, RU, ES | Manual primary-source check |
| Legacy | EN, PL, RU, ES | Preserved historical notes to turn into more specific tasks |

Listing a manual source does not implement a crawler for it. An ISFDB/FantLab identifier supplies a bibliography link, never a free-text claim. The registry is extensible; adding a source definition creates planning tasks, while automated execution requires an adapter too.

## Plan and follow up

```sh
npm run research -- plan --lang all --limit 50
npm run research -- plan --lang es --kind fragment --providers google,casadellibro,planeta --limit 10
npm run research -- list --lang pl --source legimi
```

The plan is written to `.cache/search/plan.json`; the underlying tasks are saved in the registry. `limit` counts work/language targets, so each target may have several source/format tasks. `all` rotates through languages, prioritizes actionable historical leads, and prefers known translated titles before missing-title research. Non-English discovery prefers novels and novellas; English discovery prefers shorter fiction. Automatic `search run` uses its selected providers and its own queue; a research plan also includes manual next steps. Only uncompleted source checks consume an automatic batch limit.

Capture a vague but useful lead, then add findings without replacing the initial note:

```sh
npm run research -- add --qid Q123 --lang es --kind fragment --source publisher --hint "This collection may contain the translation" --origin "Bibliography reference" --publication "Collection, publisher, year, translator" --next-action "Locate contents and the publisher's sample"
npm run research -- note --id LEAD_ID --note "Contents list a different title; translator still uncertain"
npm run research -- check --id LEAD_ID --status inconclusive --evidence "Opened the collection sample; contents visible but target story pages missing"
npm run research -- update --id LEAD_ID --status deferred --recheck-after 2026-12-01T00:00:00Z --evidence "Publisher says the sample will be added later"
```

`check` supports `not_found`, `blocked` and `inconclusive` for a specific format. A check on a publication lead includes that publication/URL in its scope and does not suppress another edition. A negative automatic query is reusable for seven days only for the same language, format, provider and title/name variants. New aliases or another source create a different query. Errors, blocks and missing configuration are retried; they never prove absence.

When a manual lead produces a plausible URL, put it through the existing review workflow:

```sh
npm run research -- candidate --id LEAD_ID --url https://example.org/publisher/story
npm run search -- list
npm run search -- approve --id CANDIDATE_ID --kind fragment --tier frag --evidence "Opened official preview; correct work, author, translation and readable pages verified"
npm run search -- export --out data/found/2026-11-03.csv
```

`candidate` creates a pending record, never an approval. Use `--kind full|audio|fragment` for a broad historical lead. If the URL is already in the lead it can be omitted. Full text requires an estimated word count when approved. Continue with the [import and publication steps](search-pipeline.md#import-and-publish).

## Migration and Actions results

```sh
npm run research -- seed
npm run research -- import-state --file path/to/downloaded/state.json
npm run research -- import-state --from-research path/to/downloaded/data/research
```

Seeding is idempotent. It preserves old `kind=none` evidence with original CSV file, row and check date, copies useful localized names and title variants, and creates missing-title tasks. Old CSV negatives have unknown format/source scope, so they become investigative leads and never blacklist a whole work or language. Old checkpoints are preserved with their older query version; new alias-aware searches are not suppressed by them.

The Actions artifact contains `state.json`, the plan and all four research files. Before review, import the downloaded state and research directory into the current registry (both options may be combined), then pass `--state path/to/downloaded/state.json` to review/export commands. Artifact directories are relative to their common upload root; select the actual downloaded research path. Imports union notes and decisions, preserve existing human next actions and reject conflicting lead identities. Commit the resulting research changes in a PR even if no text was found. Artifacts expire; committed records persist.

Search workflows have read-only repository permissions. They never publish candidates or silently write results to `main`. Cache storage remains an optimization; the committed registry and imported checkpoints carry research history.
