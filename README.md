# unoebasta

_20 minute adventure_

**unoebasta** (Italian _uno e basta_, “one and that’s it”: one more page, one story, done) is a static catalog for reading the winners of the Hugo, Nebula and Locus awards with online text and audio links. It is made for busy readers and for readers with ADHD: one main action per screen, the time a story takes, three picks for the time you have.

<p align="center">
  <img width="441" height="792" alt="unoebasta mobile catalog view" src="https://github.com/user-attachments/assets/77cec8ce-56a0-4977-a6b7-7db688defb61" />
</p>


**Open it:** https://foteev.github.io/unoebasta/

## Principles

- **Pure reading.** Static pages. No app, no project server, no accounts, no subscriptions, no ads.
- **Sources stay identifiable.** Publisher, author, CC and public-domain links keep their provenance. External recordings and community sources can be added with permission marked unverified. Story texts and recordings are not copied into this repository.
- **Your data stays in your browser.** Places, notes, finished marks, bookmarks and your own files live in IndexedDB on the device. Sync between your devices needs no account: a secret key, carried once by a link or QR code, encrypts the shelf on the device, and public Nostr relays keep only the ciphertext. A one-time move link (`#move=…`) works too.
- **No keys, no personal data in this repository.** The page needs no API keys. CI rejects anything that looks like one.

## Analytics

The public GitHub Pages site uses Umami Cloud. We look at aggregate visits by country and broad device type, which work cards people open, and which Read, Listen and excerpt options they click. Work events carry a public Wikidata ID (`qid`). In Umami's Events report, the `qid` property lets us group `open_work`, `read_click`, `listen_click`, `excerpt_click` and `choose_for_me` by work. We use recent activity to decide which works to cover and where to look for more texts, excerpts or recordings. A click measures interest in a source. Completion and the source language are outside that measurement.

**These statistics are public as well:** https://cloud.umami.is/analytics/eu/share/pnQqY1cUt3VDRI4t

## Catalog pages and awards

See [catalog pages and awards](docs/catalog-pages.md) for public URLs, award codes and filters.

## Help

Everyone is welcome, no programming needed for most of it:

- **Know a text or recording of a winner?** [Suggest a text](https://github.com/foteev/unoebasta/issues/new?template=add-text.yml).
- **A link is broken?** [Report it](https://github.com/foteev/unoebasta/issues/new?template=broken-link.yml).
- **Something is wrong on your phone?** [Report a bug](https://github.com/foteev/unoebasta/issues/new?template=bug.yml).
- **Translations** (English, Spanish, Polish, Russian today), **code** and **design**: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Develop

- [Development guide](docs/development.md) for local setup, builds, tests and project structure.
- [Audio research](docs/audio-search.md) for the supervised search workflow.

## Licenses

- **Code:** MIT, see [LICENSE](LICENSE).
- **Award data** in `data/awards.json` comes from [Wikidata](https://www.wikidata.org/) (CC0 1.0).
- **Page counts and cover IDs** come from [Google Books](https://books.google.com/) and [Open Library](https://openlibrary.org/) (the Internet Archive asserts no copyright over its catalog data).
- **Descriptions and biographies** in `data/awards.json` are from [Wikipedia](https://www.wikipedia.org/), CC BY-SA 4.0. If you reuse them, keep the attribution and the license.
- **The stories** belong to their authors and publishers. unoebasta only links to them.
- **Fragments** of novels are links to the free samples that publishers and shops show themselves: Reactor (Tor), Google Books, LitRes (Russian), Legimi (Polish). unoebasta earns nothing from them.
- **Cover images** in `covers/` are fetched from [Open Library](https://openlibrary.org/) by `scripts/fetch-covers.mjs` (the “Covers” workflow). Cover art belongs to its publishers and artists and is shown only so readers can recognize a book. If you hold the rights and want a cover removed, open an issue.
- **Fonts:** [Jost](https://fonts.google.com/specimen/Jost) and [Literata](https://fonts.google.com/specimen/Literata), SIL Open Font License. **Icons:** [Lucide](https://lucide.dev/), ISC License.

unoebasta is a non-commercial project and is not affiliated with the Hugo, Nebula or Locus awards.

**Bring your own agent.** Copy a search task from About or a work card, then give it to any capable agent. The [task contract](docs/search-brief.md) assigns 30 works by default and keeps the PR limited to findings files. Readers can also send a link and description through the existing Nostr form.
