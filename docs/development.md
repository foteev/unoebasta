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

## Project layout

| Path | Purpose |
|---|---|
| `src/index.html` | App shell, runtime and interface strings in EN, ES, PL and RU. The `READ` table contains full-text and audio links keyed by Wikidata ID. |
| `src/styles/` | Stylesheets assembled in cascade order for the app and public pages. |
| `src/components/` | Shared templates for the app and public pages. |
| `data/catalog-slugs.json` | Stable URL slugs for published work and author pages. |
| `data/award-registry.json` | Award codes, categories and translated labels. |
| `data/awards.json` | Prose winners since 1953, with works, authors and descriptions. |
| `scripts/build-web.mjs` | Assembles the portable app and generates the public pages and sitemap. |
| `scripts/coverage.mjs` | Recounts source coverage by language in `data/coverage.csv`. |
| `scripts/fetch-covers.mjs` | Fetches Open Library cover IDs as WebP files in `covers/s` (80 × 120) and `covers/m` (160 × 240). See [cover maintenance](../CONTRIBUTING.md#covers). |
| `scripts/merge-found.mjs` | Imports a findings CSV from `data/found/` into the catalog. See the [maintainer import workflow](search-pipeline.md#import-and-publish). |
| `scripts/search.mjs` | Cached discovery, candidate review and approved CSV export. See the [search pipeline](search-pipeline.md). |
| `npm run search:continue` | Resumes a discovery batch across four languages. See [continue search](continue-search.md). |
| `scripts/research.mjs` | Language aliases, source plans, publication leads and durable research notes. See [research](research.md). |
| `scripts/check-links.mjs` | Checks reachability of text, audio, excerpt and conditional preview links in the weekly [Links workflow](../.github/workflows/links.yml). |
| `scripts/check-secrets.mjs` | Checks for keys, tokens and personal email addresses. |
| `test/ui.test.js` | Browser behavior tests in jsdom. |
| `docs/` | [Contributor search contract](search-brief.md), [maintainer workflows](search-pipeline.md), [shelf storage](data-and-sync.md) and [mobile UI guidelines](mobile-first-ui.md). |

Use the [audio research guide](audio-search.md) for the supervised workflow and the four-language planning command.
