# Contributing to unoebasta

Thank you for helping. Most help needs no code: a link to a free text, a broken link, a translation fix. Issues and pull requests in English, Polish or Russian are all fine.

## Ground rules

1. **Record access and provenance separately.** Publisher, author, CC and public-domain links remain preferred. External text/audio portals are accepted as public link records with `tier=external` and permission unverified; never label them publisher-authorized or CC without evidence. Do not copy story bodies or recordings into this repository.
2. **No keys, no tokens, no personal data.** The page needs no API keys and has no server. Never commit a key, a `.env` file, an e-mail address or anything about a reader. `npm run check:secrets` runs on every pull request and fails if it finds one. If you ever commit a real key by mistake, revoke it first: removing it from the history is not enough.
3. **Nothing that tracks readers.** No analytics, no third-party scripts that phone home, no fonts or libraries from new hosts without a reason in the pull request.
4. **Be kind.** We follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reader and agent findings

Use **Copy task for my agent** on About for five works, or the button on a work card for one. The copied task embeds the [canonical task contract](docs/search-brief.md) plus public catalog context. It is model-independent and contains no shelf files, notes or credentials. A findings PR adds one new CSV in `data/found/` and an optional same-stem Markdown note in `data/notes/`; code and generated-data changes are rejected. Notes-only submissions are accepted when no confirmed link was found.

The Findings submission workflow checks data from the exact PR commit using trusted base code, without checking out or executing contributor code. It validates file scope, schema, QIDs/forms and duplicates, not source truth. Maintainers review and merge findings, then use the existing import commands below in a separate change. A CSV-only merge does not itself publish new links.

Readers can also send a URL and description using the existing Nostr feedback form. Inbox messages remain review input.

## Maintainer import

## Add a free text

The easy way: open an issue with the [“Suggest a text”](https://github.com/foteev/unoebasta/issues/new?template=add-text.yml) form.

The direct way, as a pull request:

1. Find the work’s Wikidata ID (for example `Q25349436`). Every winner is already in `data/awards.json`; the catalog on the page shows the same works.
2. Check that the **full** text is free and legal at that address (see rule 1).
3. Add an entry to the `READ` table in `src/index.html`:

   ```js
   Q25349436: { w: 4600, tier: 't2', added: '2026-11-01T12:00:00Z', pub: 'Clarkesworld #100',
     links: [{ kind: 'full', url: 'https://…', site: 'Clarkesworld' },
             { kind: 'audio', url: 'https://…', site: 'Clarkesworld Podcast' }] },
   ```

   - `w`: number of words (the reading time is computed from it).
   - `tier`: `t1` Creative Commons, `t2` free at the publisher, `t2us` US public domain.
   - `added`: the current time in UTC; the page shows it in “New since your last visit”.
   - `links`: `kind` is `full` or `audio`; `site` is the name readers see.
4. `npm run build && npm test`.

**Many links at once.** A search result in the CSV format of [the search brief](docs/search-brief.md) goes into `data/found/` and is merged with `node scripts/merge-found.mjs data/found/<file>.csv`: full texts and audio become `READ` entries, fragments go to `ex` in `data/awards.json`, rows already on the page are skipped. Wayback snapshots are skipped unless you add `--archive`. Then `node scripts/coverage.mjs` updates `data/coverage.csv`.

**Automated discovery.** See [the search pipeline](docs/search-pipeline.md) for cached, resumable candidate searches and explicit review before CSV export. The importer also adds new links to existing works and handles each language separately.

**Research without a confirmed link.** Keep possible editions, translation titles, source checks and uncertainties in the [research registry](docs/research.md). Notes may have a publication reference without a URL. Commit the registry changes too: an unsuccessful search can still provide useful evidence for the next contributor.

## Covers

Novels and novellas show a cover from `covers/`; everything else gets a typographic cover drawn by the page. Covers come from Open Library by the cover ID in `data/awards.json` (`ol.<QID>.c`). When `data/awards.json` changes on `main`, the “Covers” workflow downloads what is missing and redeploys the site. To fix a wrong cover, change or remove its `c` in `ol` and delete the two files in `covers/s` and `covers/m`.

## Translations

All strings are in the `I18N` object in `src/index.html`, with one block per language (`en`, `pl`, `ru`). Every key must exist in every language. Keep the tone short and plain; the motto stays in English everywhere. A new language means a new block and a button in the header; open an issue first.

## Code

- **One file, no framework, no build step** beyond inserting the data. Fonts: Jost for the interface, Literata only for the text in the reader. Icons: [Lucide](https://lucide.dev/), inline SVG, stroke 1.6. Libraries come from cdnjs or jsDelivr with an exact version.
- **Mobile first.** Design and test at 360–390 px first, then wider screens. Touch targets at least 44 px. Light and dark themes. See [docs/mobile-first-ui.md](docs/mobile-first-ui.md).
- **One main action per screen.** The page is made for busy readers and readers with ADHD: no streaks, badges, blinking or nagging counters.
- **Readers’ data is sacred.** Read [docs/data-and-sync.md](docs/data-and-sync.md) before you change anything that is stored. In short: only add fields; renaming or dropping one needs a migration step with a test; never touch the bodies of readers’ files.
- **Tests.** Add a check in `test/ui.test.js` for UI behavior or `test/pipeline.test.mjs` for search/import behavior. `npm test` must pass.
- **UI changes:** add a screenshot at 360 px to the pull request.

## Pull requests

Small and focused is best: one text, one fix, one feature. Say what changes for the reader and why. CI runs the secret check, the build and the tests; the site is deployed from `main` to GitHub Pages.
