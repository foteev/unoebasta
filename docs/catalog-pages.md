# Catalog pages and awards

## Public URLs

The reading app and generated pages share one catalog.

| Page | Path |
|---|---|
| Work | `work/<title>-Q…/` |
| Author | `author/<name>-Q…/` |
| Award | `award/<slug>-<code>/` |

Each URL is independent of the displayed language. Work pages share the app’s QIDs and [browser shelf](data-and-sync.md#storage). Add a slug to [`data/catalog-slugs.json`](../data/catalog-slugs.json) for each new work or author QID. Keep published slugs stable when correcting titles.

## Award registry

[`data/award-registry.json`](../data/award-registry.json) defines the stable internal award IDs, public search codes, slugs, translated names and categories. Add award results in [`data/awards.json`](../data/awards.json) as `[awardId, categoryId, year, workQid]`. More than one work may win the same category and year.

| Award | Search code | Page |
|---|---|---|
| Hugo | `HUG` | [Hugo](https://foteev.github.io/unoebasta/award/hugo-HUG/) |
| Nebula | `NEB` | [Nebula](https://foteev.github.io/unoebasta/award/nebula-NEB/) |
| Locus | `LOC` | [Locus](https://foteev.github.io/unoebasta/award/locus-LOC/) |

## Search and filter by award

Use an award code to scope discovery or planning.

```sh
npm run search:continue -- --award HUG --limit 30
npm run research -- plan --award NEB --lang pl --limit 20
```

The same code selects an Awards filter in a public link. [Filter Awards to Locus](https://foteev.github.io/unoebasta/?view=awards&award=LOC)

See the [discovery workflow](continue-search.md) and [research planner](research.md#plan-and-follow-up) for the rest of the search process.
