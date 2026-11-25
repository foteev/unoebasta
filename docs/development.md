# Development

## Set up and run locally

Use Node.js 22.22.2 or later in the 22.x line, 24.15.0 or later in the 24.x line, or Node.js 26 or newer. The supported ranges are in [`package.json`](../package.json). [CI](../.github/workflows/ci.yml) uses Node.js 22. The npm dependencies support development tools such as tests and candidate discovery. The built app runs as a static page.

```sh
npm ci
npm run build
npm test
npm run check:secrets
```

Open `dist/web/index.html` in a browser to use the portable app. The build also generates the [public catalog pages](catalog-pages.md) and sitemap. The [Pages workflow](../.github/workflows/pages.yml) publishes `dist/web` from `main`.

## Test suites

The repository has two test layers:

1. **Unit, pipeline and UI tests (`npm test`)**:
   - Node test runner executes unit tests: `pipeline.test.mjs`, `research.test.mjs`, `contributions.test.mjs` and `catalog-pages.test.mjs`.
   - `test/ui.test.js` tests catalog interactions, filters, reading views and shelf persistence in jsdom.

2. **Mobile shelf and browser tests**:
   - `test/*.test.cjs` files test mobile viewport behavior, audio cards, awards views and contribution dialogs in Playwright.
   - The [Mobile shelf workflow](../.github/workflows/mobile-shelf.yml) executes these tests on pull requests and pushes to `main`.
   - To execute them locally, install Playwright and Chromium:
     ```sh
     npm install --no-save playwright
     npx playwright install chromium
     npm run build
     node test/mobile-shelf.test.cjs
     node test/awards-views.test.cjs
     node test/audio-card.test.cjs
     node test/contribution-ui.test.cjs
     ```

## Project layout

On Windows, the build accepts CRLF source files. File URL paths in tests use `fileURLToPath` to preserve the drive letter.

| Path | Purpose |
|---|---|
| `src/index.html` | App shell, runtime script template and the `READ` table keyed by Wikidata ID. |
| `src/styles/` | Stylesheets assembled in cascade order for the app and public pages. |
| `src/components/` | `catalog.mjs` is an ES module shared by the app and public-page generator. `i18n.mjs`, `storage.mjs`, `files.mjs`, `voice.mjs`, `sync.mjs`, and `analytics.mjs` are build-inlined classic-script fragments bundled by `scripts/build-web.mjs`; they share the page's global scope and must not be imported in Node. |
| `data/catalog-slugs.json` | Stable URL slugs for published work and author pages. |
| `data/award-registry.json` | Award codes, categories and translated labels for Hugo, Nebula, Locus and World Fantasy Award. |
| `data/awards.json` | Prose winners since 1953, with works, authors, descriptions and sample excerpts (`ex`). |
| `data/found/` | Contributor and agent findings CSV files awaiting review or maintainer import. |
| `data/notes/` | Matching notes for findings submissions. |
| `data/research/` | Durable research records: `checks.jsonl`, `leads.jsonl` and continuation `runs/`. |
| `data/coverage.csv` | Source coverage counts by language and award. |
| `covers/` | Open Library cover images in small (`s/`) and medium (`m/`) sizes with metadata in `sources.json`. |
| `scripts/build-web.mjs` | Assembles the portable app and generates public pages and sitemap. |
| `scripts/coverage.mjs` | Recounts source coverage by language in `data/coverage.csv`. |
| `scripts/fetch-covers.mjs` | Fetches Open Library cover IDs as WebP files in `covers/s` and `covers/m`. |
| `scripts/import-pending.mjs` | Imports merged findings CSVs from `data/found/` into the catalog (`npm run import:pending`). |
| `scripts/merge-found.mjs` | Imports a single findings CSV from `data/found/` into the catalog. |
| `scripts/search.mjs` | Cached discovery, candidate review and approved CSV export. |
| `scripts/research.mjs` | Language aliases, source plans, publication leads and durable research notes. |
| `scripts/check-links.mjs` | Checks reachability of text, audio, excerpt and preview links. |
| `scripts/check-secrets.mjs` | Checks for keys, tokens and personal email addresses. |
| `scripts/check-contribution-pr.mjs` | Validates contribution pull request data blobs without checking out untrusted code. |
| `scripts/lib/` | Shared library modules for catalog parsing, CSV handling, HTTP caching and providers. |
| `test/pipeline.test.mjs` | Pipeline, CSV parsing, import idempotency and provider matching tests. |
| `test/research.test.mjs` | Source plans, registry persistence, checks and continuation tests. |
| `test/contributions.test.mjs` | Pull request contribution intake and data validation tests. |
| `test/catalog-pages.test.mjs` | Public work and author page generation tests. |
| `test/ui.test.js` | Browser behavior tests in jsdom. |
| `test/*.test.cjs` | Mobile shelf, audio cards, awards views and contribution UI tests in Playwright. |
| `docs/` | [Task contract](search-brief.md), [search pipeline](search-pipeline.md), [continue search](continue-search.md), [research](research.md), [audio research](audio-search.md), [catalog pages](catalog-pages.md), [shelf storage](data-and-sync.md) and [mobile UI](mobile-first-ui.md). |
| `AGENTS.md` | Task instructions for delegated agent contribution and research runs. |
