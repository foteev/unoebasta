# unoebasta

_You’re the grown-up now. Say yes._

**unoebasta** (Italian _uno e basta_, “one and that’s it”: one more page, one story, done) is a single web page for reading the winners of the Hugo, Nebula and Locus awards that are free and legal online. It is made for busy readers and for readers with ADHD: one main action per screen, the time a story takes, three picks for the time you have.

**Open it:** https://foteev.github.io/unoebasta/ · Русский: [README.ru.md](README.ru.md)

## Principles

- **Pure reading.** One static page. No app, no server, no accounts, no subscriptions, no ads, no analytics.
- **Legal texts only.** The page links to the magazine or publisher that posted a story, to Creative Commons releases and to public domain archives. It never copies a text.
- **Your data stays in your browser.** Places, notes, finished marks, bookmarks and your own files live in IndexedDB on the device. Sync between your devices needs no account: a secret key, carried once by a link or QR code, encrypts the shelf on the device, and public Nostr relays keep only the ciphertext. A one-time move link (`#move=…`) works too.
- **No keys, no personal data in this repository.** The page needs no API keys. CI rejects anything that looks like one.

## Help

Everyone is welcome, no programming needed for most of it:

- **Know a free, legal full text of a winner?** [Suggest a text](https://github.com/foteev/unoebasta/issues/new?template=add-text.yml).
- **A link is broken?** [Report it](https://github.com/foteev/unoebasta/issues/new?template=broken-link.yml).
- **Something is wrong on your phone?** [Report a bug](https://github.com/foteev/unoebasta/issues/new?template=bug.yml).
- **Translations** (English, Polish, Russian today), **code** and **design**: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Develop

You need Node.js 20 or newer.

```sh
npm ci              # dev tools for the tests only: the page itself has no build dependencies
npm run build       # src/index.html + data/awards.json → dist/web/index.html (one file)
npm test            # the page in jsdom: about 190 checks
npm run check:secrets
```

Open `dist/web/index.html` in a browser. That is the whole site.

| Path | What it is |
|---|---|
| `src/index.html` | The whole page: markup, styles, script, strings in EN/PL/RU. Free texts are the `READ` table, keyed by Wikidata ID |
| `data/awards.json` | Prose winners since 1953: awards, works, authors, descriptions |
| `scripts/build-web.mjs` | Puts the data into the page |
| `scripts/coverage.mjs` | What exists in each language → `data/coverage.csv` |
| `scripts/fetch-covers.mjs` | Downloads covers by Open Library cover ID → `covers/s` (80×120) and `covers/m` (160×240), WebP |
| `scripts/check-links.mjs` | Checks every text and audio link (the “Links” workflow, weekly) |
| `scripts/check-secrets.mjs` | Fails on keys, tokens or personal e-mail addresses |
| `test/ui.test.js` | jsdom tests |
| `docs/` | How user data is stored, migrated and moved; mobile-first rules |

## Licenses

- **Code:** MIT, see [LICENSE](LICENSE).
- **Award data** in `data/awards.json` comes from [Wikidata](https://www.wikidata.org/) (CC0 1.0).
- **Page counts and cover IDs** come from [Google Books](https://books.google.com/) and [Open Library](https://openlibrary.org/) (the Internet Archive asserts no copyright over its catalog data).
- **Descriptions and biographies** in `data/awards.json` are from [Wikipedia](https://www.wikipedia.org/), CC BY-SA 4.0. If you reuse them, keep the attribution and the license.
- **The stories** belong to their authors and publishers. unoebasta only links to them.
- **Cover images** in `covers/` are fetched from [Open Library](https://openlibrary.org/) by `scripts/fetch-covers.mjs` (the “Covers” workflow). Cover art belongs to its publishers and artists and is shown only so readers can recognize a book. If you hold the rights and want a cover removed, open an issue.
- **Fonts:** [Jost](https://fonts.google.com/specimen/Jost) and [Literata](https://fonts.google.com/specimen/Literata), SIL Open Font License. **Icons:** [Lucide](https://lucide.dev/), ISC License.

unoebasta is a non-commercial project and is not affiliated with the Hugo, Nebula or Locus awards.
