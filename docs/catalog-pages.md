# Catalog pages and awards

## Public URLs

The reading app and generated pages share one catalog.

| Page | Path |
|---|---|
| Work | `work/<title>-<id>/` |
| Author | `author/<name>-<id>/` |
| Award | `award/<slug>-<code>/` |

Each URL is independent of the displayed language. Work pages share the app’s catalog IDs and [browser shelf](data-and-sync.md#storage). Add a slug to [`data/catalog-slugs.json`](../data/catalog-slugs.json) for each new work or author ID. Records with verified Wikidata identifiers use `Q…`. World Fantasy Award entries without a matched Wikidata item use the ISFDB title ID with a `T` prefix or the ISFDB author ID with an `A` prefix. Keep published slugs stable when correcting titles.

## Publication and indexing checks

1. Run `npm run build` and `npm test`. Use the generated files under `dist/web` to check each new or substantially updated public page.
2. Check the page title, canonical URL and sitemap entry. Follow a regular HTML link to the page with JavaScript disabled. The homepage links to the award pages. The award pages link to the works. Work pages link to their authors.
3. Check the initial HTML for the facts a reader needs. On work pages, check the award, category and year, plus publication details and page count when available. Label word counts and reading times as estimates. Distinguish full text, parts, excerpts and audio by source and language. Include a recorded duration when the catalog has one. Keep provenance and verification details accurate. Omit unknown values.
4. After deployment, open the live URL and check its HTTP status, canonical, internal links and visible content. With Search Console access, confirm that Google can read the [sitemap](https://foteev.github.io/unoebasta/sitemap.xml). Use URL Inspection for an important new page or a representative sample from a batch. Check the last crawl, rendered content and Google-selected canonical when available. Request indexing once for priority pages after a substantial change. Track index status, impressions and clicks over time. Record when Search Console access is unavailable.

The build generates public HTML in [`scripts/lib/public-pages.mjs`](../scripts/lib/public-pages.mjs). The browser uses the same catalog data. Google can render JavaScript and also evaluate the page content. The initial HTML gives readers and crawlers the important details on the first request. [Google’s JavaScript guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) · [Google’s recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)

## Award registry

[`data/award-registry.json`](../data/award-registry.json) defines the stable internal award IDs, public search codes, slugs, translated names and categories. Add award results in [`data/awards.json`](../data/awards.json) as `[awardId, categoryId, year, workQid]`. More than one work may win the same category and year.

| Award | Search code | Page |
|---|---|---|
| Hugo | `HUG` | [Hugo](https://foteev.github.io/unoebasta/award/hugo-HUG/) |
| Nebula | `NEB` | [Nebula](https://foteev.github.io/unoebasta/award/nebula-NEB/) |
| Locus | `LOC` | [Locus](https://foteev.github.io/unoebasta/award/locus-LOC/) |
| World Fantasy Award | `WFA` | [World Fantasy Award](https://foteev.github.io/unoebasta/award/world-fantasy-WFA/) |

World Fantasy Award covers Novel, Long Fiction (historically Novella), and Short Fiction from 1975 through 2026. The [World Fantasy Convention archive](https://worldfantasy.org/awards/winners/) covers historical results through 2023. The [SFADB yearly results](https://www.sfadb.com/World_Fantasy_Awards_Winners_By_Year) and [ISFDB award records](https://www.isfdb.org/cgi-bin/awardtype.cgi?44) supply newer years, corroborate shared wins, and distinguish standalone works from collections or later versions. In 1980, 1991, and 1993 both ISFDB and SFADB list shared wins where the Convention archive displays a single winner.

The initial WFA links were checked on 19 November 2026. [Reactor](https://reactormag.com/the-hungry-mouth-renan-bernardo/), [PodCastle](https://podcastle.org/2023/05/30/podcastle-789-emet/), [Uncanny](https://www.uncannymagazine.com/article/like-river-loves-sky/), [Lightspeed](https://www.lightspeedmagazine.com/fiction/ten-deals-with-the-indigo-snake/), and [Strange Horizons](https://strangehorizons.com/wordpress/fiction/the-birding-a-fairy-tale/) provide the full English texts of five short fiction winners. The PodCastle and Lightspeed media files both responded and decoded from the start. The episodes are listed at 1:06:54 and 31:07 respectively, read by Rebecca Fraimow and Judy Young. The recordings were sampled at the start. The Orbit and Tordotcom excerpts for the 2026 Novel and Long Fiction winners contain English prose. Ebookpoint’s guest reader opens with the Polish chapters of *Zatruty kielich*.

## Search and filter by award

Use an award code to scope discovery or planning.

```sh
npm run search:continue -- --award HUG --limit 30
npm run research -- plan --award WFA --lang pl --limit 20
```

The same code selects an Awards filter in a public link. [Filter Awards to Locus](https://foteev.github.io/unoebasta/?view=awards&award=LOC)

See the [discovery workflow](continue-search.md) and [research planner](research.md#plan-and-follow-up) for the rest of the search process.
