# Task: find legal free texts, audio and fragments for unoebasta

You are helping **unoebasta** (https://foteev.github.io/unoebasta/, code and data: https://github.com/foteev/unoebasta), a non-commercial page for reading the winners of the Hugo, Nebula and Locus awards in prose. Readers are busy people and readers with ADHD: they open a story, read it and close the page. Your job is to find **where each winning work can be read or heard for free and legally**, and report it in the exact format below. You do not edit the site. The maintainer merges your results.

## 1. What already exists (snapshot of 2 November 2026)

656 winning works. "Full" means a free full text, "fragment" means an excerpt or preview of a book, "audio" means a free reading by a person.

| Form | Works | EN full text | EN fragment | PL fragment | RU fragment | Audio | Nothing at all |
|---|---|---|---|---|---|---|---|
| Novel | 236 | 1 | 43 | 57 | 88 | 1 | 103 |
| Novella | 131 | 4 | 20 | 6 | 8 | 1 | 101 |
| Novelette | 142 | 50 | 6 | – | – | 24 | 81 |
| Short story | 147 | 60 | 1 | – | – | 32 | 79 |

There are 115 full texts and 58 works with audio. All of them are in English, because translations are under copyright.

**Spanish is new** and has nothing on the page yet. A Spanish translation is known for 149 of 236 novels, 43 of 131 novellas, 31 of 142 novelettes and 47 of 147 short stories (`title_es`).

**The worklist.** Download https://raw.githubusercontent.com/foteev/unoebasta/main/data/coverage.csv. It has one row per work:

- columns: `qid, title, authors, form, awards, latest, pages, en, pl, ru, es, audio, title_pl, title_ru, title_es`;
- `audio` is `yes` when a free reading by a person is already on the page;
- `en`, `pl`, `ru` and `es` are each `full`, `part` or `none`;
- `title_pl`, `title_ru`, `title_es` are the titles of known translations (from Wikidata, ISFDB, Lecturalia and earlier searches); empty means none is known (a translation may still exist);
- a work is a target for a language when that column is `none`, or when it is `part` and you are looking for a full text.

**Helpers in https://raw.githubusercontent.com/foteev/unoebasta/main/data/awards.json:**

- `works[QID]` is an array:
  - `[0]` English title;
  - `[1]` Polish title (may be 0);
  - `[2]` Russian title (may be 0);
  - `[3]` author QIDs;
  - `[4]` ISFDB title id;
  - `[5]` FantLab work id;
  - `[6]` year.
- `authors[QID]` is `[name_en, name_pl, name_ru, …]`.
- **ISFDB** (`https://www.isfdb.org/cgi-bin/title.cgi?<id>`) shows where a story first appeared: magazine, issue and anthology. That is the fastest way to the magazine's own page.
- **FantLab** (`https://fantlab.ru/work<id>`) lists Russian translations and where they were published, including web publications.

**Already searched:** every file in https://github.com/foteev/unoebasta/tree/main/data/found has `kind=none` rows saying where nothing was found. Skip those works for that language, or search other places.

**Existing links** are in `const READ = {` (full texts and audio) in https://github.com/foteev/unoebasta/blob/main/src/index.html, and in `ex` / `gb` (fragments) in `awards.json`. Do not report them again.

## 2. The rules: legal only

**Allowed sources:**
- the magazine or publisher that published the work, on its own site;
- the author's own site, if the text is posted there on purpose;
- Creative Commons releases;
- public domain:
  - worldwide;
  - US-only, for example 1950s magazine stories whose copyright was not renewed (Project Gutenberg, Faded Page);
- official podcasts of magazines: Escape Pod, PodCastle, Pseudopod, Clarkesworld, Uncanny, Lightspeed, StarShipSofa and others;
- LibriVox, for public-domain texts only;
- free samples that a publisher or shop shows itself: Reactor/Tor.com excerpts, publisher "read an excerpt" pages, Google Books previews, LitRes "читать онлайн" fragments, Legimi book pages (they show a fragment), Woblink/Empik "fragment" files.

**Never:**
- Flibusta, LibGen, Z-Library, Anna's Archive, any "read free online" aggregator, Scribd uploads, Telegram, VK, fan translations, PDFs on random hosts;
- Internet Archive lending of in-copyright books;
- Hugo voter packets;
- any site that clearly reposts someone else's text.

**Wayback Machine:** use a snapshot only when the original page was free on the publisher's own site (for example SCIFICTION at scifi.com), and mark it `archive=yes`. The maintainer decides.

**Check every URL yourself** by opening it:
- the page must show the whole text, or the whole episode, or the fragment, without login, subscription or payment;
- it must be **this** work: right title (in that language), right author, not a different story with the same title;
- for an omnibus or a collection, the target work must be the first one, or the fragment must actually contain it.

**Clean URLs:**
- no tracking or affiliate parameters (`utm_*`, `ref`, `aff` and so on);
- use the canonical page, not a search result.

## 3. What to look for, by form

### Short stories and novelettes (biggest gain: a whole story in one sitting)

1. **English full text** at the original magazine. Start from ISFDB's publication list. Most likely places:
   - Clarkesworld, Uncanny, Lightspeed, Nightmare, Fantasy;
   - Reactor (formerly Tor.com), Strange Horizons, Apex, Beneath Ceaseless Skies, Fireside, Diabolical Plots;
   - Subterranean Press Magazine, Escape Pod (text posts), Daily Science Fiction, Infinity Plus;
   - Asimov's and Analog, which post some award stories free;
   - F&SF, Baen (Free Library, free sample chapters);
   - authors' sites.
2. **Older stories (1953–1970s):** Project Gutenberg, which has many non-renewed 1950s magazine stories (Galaxy, If, Astounding), and Faded Page. These are usually `t2us`.
3. **Audio of the same story:** the magazine's podcast episode, or Escape Pod, PodCastle or Pseudopod.
4. **Polish or Russian full text, only from legal free publishers of translations:**
   - Russian: the DARKER webzine (horror, licensed translations), "Мир фантастики" online publications, authors' own sites;
   - Polish: Szortal, Esensja, Nowa Fantastyka online pieces published with permission;
   - Spanish: only a translation posted by the rights holder or with stated permission (the author's site, a magazine that says the translation is authorized). University "digital library" sites and blogs that host whole commercial ebooks or stories do not count.
   - Check the translation's rights note. If you are unsure, mark `archive=unsure` in `evidence`.

### Novellas

1. English full text if a magazine published it whole or in parts (Clarkesworld, Lightspeed, Asimov's samples, Subterranean, Reactor original fiction), and any CC or public-domain release.
2. English fragment: Reactor/Tor.com "excerpt" posts, publisher excerpt pages, Google Books preview.
3. Polish fragment: Legimi book page (`https://www.legimi.pl/ebook-…,b<id>.html`), or a Woblink, Empik or publisher fragment.
4. Russian fragment: LitRes (`https://www.litres.ru/book/…/chitat-onlayn/`), or a publisher's fragment (AST, Eksmo, Fanzon).
5. Spanish fragment, only when the novella is published on its own (not inside a collection): the same places as for novels below.

### Novels

1. **Full text** only if Creative Commons or public domain (for example Cory Doctorow's and Charles Stross's CC novels, or pre-1930 / non-renewed works). These are rare. Check the license on the author's or publisher's own page.
2. **English fragment:** Reactor excerpts, the publisher's "read an excerpt" page (Tor, Orbit, Gollancz, Del Rey, Saga…), Google Books preview with visible pages.
3. **Polish fragment** (179 novels have none):
   - Legimi first;
   - then Woblink, Empik, Ebookpoint, or the publisher's own fragment PDF (Rebis, MAG, Prószyński, Zysk, Vesper, SQN).
   - Use the Polish title from `works[QID][1]`, or find it on lubimyczytac.pl.
4. **Russian fragment** (148 novels have none):
   - LitRes first, using the Russian title from `works[QID][2]` or FantLab.
   - Many Western classics are no longer on LitRes. Then try publishers' sites: AST, Eksmo, Fanzon, Азбука.

5. **Spanish fragment** (no novel has one yet; start with the works that have a `title_es`):
   - **Casa del Libro** (`https://www.casadellibro.com/libro-…/<ISBN>/<id>`): report the book page only if it has a **"Leer primeras páginas"** button. That button opens a publisher-supplied EPUB extract (`extraits.tea-ebook.com/…`); put that EPUB URL in `evidence`. Many Penguin Random House (Nova, Ediciones B), Alianza/Runas and Nocturna books have it; most Minotauro books do not.
   - **Planeta de Libros** (`https://www.planetadelibros.com/libro-…/<id>`) for Minotauro and other Planeta books: report only if the page offers a first chapter ("Leer primer capítulo" or a link from https://www.planetadelibros.com/libros-primeros-capitulos).
   - **Google Books** preview of the Spanish edition with visible pages (`https://books.google.com/books?id=…`).
   - Other publishers' own fragment pages (Gigamesh, Crononauta, Duermevela, Bóveda, Hidra) if they show text without login.
   - To find the Spanish title: `title_es`, then https://www.lecturalia.com, La Tercera Fundación (https://tercerafundacion.net) or the Casa del Libro search.
   - Use the current Spanish edition from Spain or Latin America; one fragment per work is enough.

**Priority order:**
1. English full texts of short stories and novelettes.
2. Audio for them.
3. Novella texts and fragments.
4. Polish, Russian and Spanish novel fragments.
5. Polish, Russian and Spanish translations of short forms.

## 4. How to report: one CSV, one row per link

File name: `unoebasta-found-YYYY-MM-DD.csv`, UTF-8, comma-separated, fields with commas in double quotes. Header exactly:

```
qid,title,form,lang,kind,site,url,tier,license,words,pub,part,archive,evidence,checked_at
```

**Fields:**
- `qid`: Wikidata id from coverage.csv, for example `Q25349436`.
- `title`: the title as shown at the URL, in that language. For a `pl`, `ru` or `es` row this becomes the work's title in that language on the page when none is known yet, so copy it exactly as the edition shows it, without series notes.
- `form`: `novel` / `novella` / `novelette` / `short story` (copy from coverage.csv).
- `lang`: `en` / `pl` / `ru` / `es`, the language of the text at the URL.
- `kind`:
  - `full`: the complete text;
  - `audio`: the complete story read aloud;
  - `fragment`: an excerpt or preview.
- `site`: the name readers will see, for example `Clarkesworld`, `Uncanny Magazine`, `Project Gutenberg`, `Escape Pod`, `Legimi`, `ЛитРес`, `Casa del Libro`, `Google Books`.
- `url`: the clean canonical URL.
- `tier`:
  - `t1`: Creative Commons, or public domain everywhere;
  - `t2`: free at the rights holder;
  - `t2us`: public domain in the US only;
  - `frag`: for fragments.
- `license`: for CC, the exact license (for example `CC BY-NC-SA 4.0`); otherwise empty.
- `words`: approximate words in the story body on that page (for reading time). Count or estimate from the page; empty for fragments and audio.
- `pub`: where the text appeared, for example `Clarkesworld #100`, `Galaxy, June 1958`, `Uncanny #57`, or the book's publisher and year for fragments.
- `part`: `1`, `2`… when the text is split across pages, one row per part; otherwise empty.
- `archive`: `yes` for a Wayback snapshot; otherwise empty.
- `evidence`: one short sentence on how you checked, for example:
  - "Full story on the magazine page, no paywall, ~6,200 words";
  - "Legimi page shows ~60k-character Polish fragment without login";
  - "Gutenberg #12345, non-renewed 1958 Galaxy story".
- `checked_at`: UTC date and time you opened the URL, ISO 8601.

**Also add a row with `kind=none`** for each work you searched and found nothing for. Leave `url` empty and put where you looked in `evidence`. That way nobody searches the same places twice.

**Example rows (the first three are already on the site; they only show the format):**

```
Q139732068,In My Country,short story,en,full,Clarkesworld,https://clarkesworldmagazine.com/ha_04_25/,t2,,6219,Clarkesworld #223,,,"Full story on the magazine page, no paywall",2026-11-02T10:15:00Z
Q139732068,In My Country,short story,en,audio,Clarkesworld Podcast,https://clarkesworldmagazine.com/audio_04_25e,t2,,,Clarkesworld #223,,,"Full reading, 48 min",2026-11-02T10:16:00Z
Q190192,Diuna,novel,pl,fragment,Legimi,https://www.legimi.pl/ebook-diuna-frank-herbert,b620057.html,frag,,,"Rebis, 2021",,,"Page shows Polish fragment without login",2026-11-02T10:20:00Z
Q2008211,The Left Hand of Darkness,novel,ru,none,,,,,,,,,"Not on LitRes; AST site has no fragment; FantLab lists no web publication",2026-11-02T10:25:00Z
```

## 5. How to work

For automated candidate discovery, checkpoints and reviewed CSV export, see [the search pipeline](search-pipeline.md). Automated matches still require every manual verification described above.

- Go by the priority order above. Work in batches of about 50 works and deliver each batch as a CSV.
- Do not guess URLs. Every `url` must be one you opened and checked.
- When a magazine moved (Tor.com became reactormag.com, for example), report the URL where the story is now.
- **At the end, give a short summary:**
  - how many works got a full text, audio or fragment, by form and language;
  - which sites gave the most;
  - anything the maintainer should decide: `archive=yes` rows, unclear licenses, translations whose rights you could not confirm.
