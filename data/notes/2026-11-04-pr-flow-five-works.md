# Five-work multilingual search and findings-PR flow check

Date: 2026-11-04. Baseline and pre-submission refresh: `foteev/unoebasta:main` at `190a885532ed7d8bcc001a404b7488542a758dfe`.

Assigned QIDs only: Q18209196, Q7755107, Q2307397, Q2634534, Q6271990. Authors and canonical forms were taken from that main snapshot and matched to source pages. Search languages: EN/PL/RU/ES independently. No other works are submitted. Original catalog/source files and research registry are unchanged.

Deliverable: one matching CSV, 16 rows: EN 3, PL 3, RU 5, ES 5. Kinds: six full texts, one verified fragment, nine audio links. These are link records, not claims of authorization or guaranteed complete recordings. Permission is unknown for every submitted external host. No story bodies, audio or reader data are included.

## Verification limits

- Opened specific source pages, not just search results. Full-text records were checked for matching author/title and narrative boundaries. Word counts are approximate. The Russian Johnson text was counted in memory between its opening and translator credit (22,748 words); nothing from that body was saved.
- Audio pages were inspected for matching work, credited reader/channel, duration, public player or feed metadata, and visible access restrictions. No recording was listened to end-to-end; most streams were not played at all. Duration alone was never treated as proof of completeness. Named performers are site/creator credits, not independently authenticated voices.
- For Polish Sandkings, the specific Apple episode, Apple's public lookup API and the creator RSS agree on the same recording. A 32-byte range request to its public enclosure returned HTTP 206 and `audio/mpeg`; no full recording was downloaded. This checks the endpoint, not every minute of audio.
- Lecturia pages were visible through the web reader, including full-story sections and endings. Direct automated HTTP requests returned 403. Availability in a reader's browser, region and future session is therefore not guaranteed. No bypass was attempted.
- Bibliographic or anthology listings, paid previews, discussions and blocked candidates stay below as leads, never as free full coverage. An original magazine's authorization statement does not establish permission for a later mirror.

## Q18209196 — The Man Who Bridged the Mist — Kij Johnson

Form: novella. Catalog references: [ISFDB 1330974](https://www.isfdb.org/cgi-bin/title.cgi?1330974), [FantLab 295921](https://fantlab.ru/work295921).

| Language | Title / publication evidence | Text and fragment outcome | Audio outcome / next step |
|---|---|---|---|
| EN | Original title confirmed by the author's site and SFWA award page. | Historical author DOC and Asimov's link could not be retrieved. Current Free Stories page did not expose this title. No EN text is submitted. | Paid anthology identified; no free matching recording verified. Follow current publisher/author links, not an assumed old DOC URL. |
| PL | Catalog title `Człowiek, który przerzucił most przez mgłę`; bibliographic lead: Fantastyka Wydanie Specjalne 2 (39), 2013. | Exact-title/author and reading queries did not yield an inspected text/fragment. Locate the magazine's contents and scan before asserting availability. | No specific Polish player verified in those queries. Search the published magazine title and narrator catalogues next. |
| RU | `Мост через туман`, Gennady Korchagin translation in Если 2012 #10 [236]. | Submitted full story at Wikireading: opening, ending, translator credit and original English title inspected. Mirror permission remains unknown despite its reproduction of the original magazine notice. | Queries for the Russian title plus audio terms produced text/book records, not a verified audio page. Search narrator catalogues next. |
| ES | Original-title + author + español/traducción searches and author publication references checked. | A sourced published Spanish title was not resolved in this bounded pass; no invented translation is used. Check ISFDB translation/publication records next. | No title-qualified ES audio query can be closed while the translated title remains unresolved. Search original title/author is inconclusive, not evidence of absence. |

References and leads:

- [Author's current free-story index](https://kijjohnson.com/online-library/); [published works](https://kijjohnson.com/published-works/).
- Historical [MistBridge.doc](https://kijjohnson.com/MistBridge.doc): inaccessible in this run. [Asimov's historical story page](https://www.asimovs.com/2011_10-11/exc_story1.shtml): retrieval/redirect failed. These are not findings rows.
- [SFWA work identity](https://nebulas.sfwa.org/nominated-work/man-bridged-mist/).
- [Polish bibliography](https://www.encyklopediafantastyki.pl/index.php?title=Kij_Johnson).
- [The Year's Top Short SF Novels 2 on Apple Books](https://books.apple.com/be/audiobook/the-years-top-short-sf-novels-2-unabridged/id577679810): commercial anthology naming the story; not free audio coverage.

## Q7755107 — The Ones Who Walk Away from Omelas — Ursula K. Le Guin

Form: short story. Catalog references: [ISFDB 58836](https://www.isfdb.org/cgi-bin/title.cgi?58836), [FantLab 2036](https://fantlab.ru/work2036).

| Language | Title check | Text and fragment outcome | Audio outcome / next step |
|---|---|---|---|
| EN | Original author/title and 1973 story matched. | Submitted Lecturia full-story page. A separate UCA faculty copy opened initially but timed out on rechecks; keep it as an access-unstable lead. | A named YouTube full-reading candidate was found but not successfully reviewed as a player; no EN audio row submitted. |
| PL | `Ci, którzy odchodzą z Omelas`; PDF credits Zofia Uhrynowska-Hanasz. | Submitted fragment only. The actual PDF was fetched and parsed in memory: four physical pages, ending mid-sentence on printed page 5, before the story's ending. A collection listing does not fix this incomplete file. | Exact-title/author searches did not produce a verified Polish player. Check periodical editions and narrator catalogues. |
| RU | `Уходящие из Омеласа`, credited Ursula Le Guin. | No standalone Russian text page was inspected in this pass; text remains unresolved. | Submitted Konstantin Ermikhin page: introduction 04:52, story 23:57, about 28:49 combined. Player/chapter metadata inspected only. |
| ES | Submitted source uses `Los que se alejan de Omelas`; catalog also has `Quienes se marchan de Omelas`. | University PDF/catalogue lead found but full contents not inspected; no ES text row. | Submitted Por qué leer / Ceci Bona episode, 26:44, explicitly labelled human voice. Page, description and transcript inspected; no listening/completeness claim. |

Leads and exclusions:

- [UCA faculty copy](https://faculty.uca.edu/rnovy/LeGuin%20--%20The%20Ones%20Who%20Walk%20Away%20From%20Omelas.htm): unstable retrieval, not submitted.
- [EN YouTube candidate](https://www.youtube.com/watch?v=hZSN4WAxWK0): player verification still needed.
- [Prószyński collection page](https://www.proszynski.pl/product/wszystkie-strony-swiata): opened as an edition lead, not proof that the assigned story is present in an accessible sample. Earlier Polish editions can have different contents.
- [Spanish university item](https://uvirtual.uabjb.edu.bo/items/1ac84d5c-dca4-4485-81d8-98df3277f7a4): PDF candidate requiring contents inspection.
- [Creator's Spanish episode page](https://porqueleer.com/audiolibros/los-que-se-alejan-de-omelas-de-ursula-k-le-guin/): corroborates the submitted iVoox recording; not counted as another recording.

## Q2307397 — I Have No Mouth, and I Must Scream — Harlan Ellison

Form: short story. Catalog references: [ISFDB 41300](https://www.isfdb.org/cgi-bin/title.cgi?41300), [FantLab 14894](https://fantlab.ru/work14894). Avoid the game, radio adaptation and entire similarly named collections unless the assigned original story can be isolated.

| Language | Title check | Text and fragment outcome | Audio outcome / next step |
|---|---|---|---|
| EN | Original story and Harlan Ellison matched. | Submitted shortsonline original-text page. Its information page gives about 5,800 words; narrative ending was inspected. | EN YouTube and commercial anthology candidates remain unreviewed audio leads, not submitted recordings. Embedded audio on the text page has no verified human-reader attribution in this pass. |
| PL | Catalog title `Nie mam ust, a muszę krzyczeć`; video candidate uses `Nie mam ust, choć muszę krzyczeć`. | A Polish-language book listing explicitly describes an English edition; it is not proof of a Polish text. No PL text row submitted. | Surreaktor's video description names the original 1967 story, but opening the video was throttled. Keep as blocked/inconclusive until the player, voice and scope can be checked. |
| RU | Submitted page uses `У меня нет рта, но я должен кричать`. | Text not independently located/inspected in this pass. | Submitted page credits Обнимающий читатель, 46 minutes. Site metadata only; voice and completeness unverified. |
| ES | `No tengo boca y debo gritar`, Harlan Ellison. | Text candidates were found but not inspected to a full-story ending; no text row. | Submitted public Noviembre Nocturno episode by Láudano, 01:05:44. A different Casa de la Bruja episode is an exclusive preview and was excluded from full audio findings. |

Leads:

- [PL Surreaktor video](https://www.youtube.com/watch?v=fEcRPUvQ3rQ): opened attempt returned online-fetch throttling; no confirmed audio row.
- [Polish catalogue listing](https://lubimyczytac.pl/ksiazka/4909335/nie-mam-ust-a-musze-krzyczec): labels the edition's language English.
- [EN author-reading candidate](https://www.youtube.com/watch?v=dgo-As552hY); [EN unofficial reading candidate](https://www.youtube.com/watch?v=aTffic7uq6Y): page/player and scope still need review.
- [Excluded Spanish preview](https://www.ivoox.com/en/no-tengo-boca-debo-gritar-harlan-audios-mp3_rf_43277483_1.html): explicitly says the full episode requires supporting the podcast. Duration 52:41 does not make it free full audio.
- [Spanish text candidate](https://planetalibro.net/libro/harlan-ellison-no-tengo-boca-y-debo-gritar): inspect actual text rather than assuming a listing is the story.

## Q2634534 — The Star — Arthur C. Clarke

Form: short story (1955, Hugo 1956). Catalog references: [ISFDB 40913](https://www.isfdb.org/cgi-bin/title.cgi?40913), [FantLab 10386](https://fantlab.ru/work10386). Distinguish the short story from collections titled Gwiazda/The Star and unrelated stories by other authors.

| Language | Title check | Text and fragment outcome | Audio outcome / next step |
|---|---|---|---|
| EN | Arthur C. Clarke, original 1955 story. | Submitted Lecturia complete story through its final paragraph and THE END; direct automated HTTP 403 is disclosed. | SFFaudio Reading, Short And Deep #202 is a discussion, not the audiobook. Its linked PDF returned 404. Other author-reading/radio candidates need source-specific scope checks. |
| PL | `Gwiazda`, Iskry 1989 collection, author/title and Jesuit/supernova narrative matched. | Submitted full target story within a 20-page collection preview. The visible OCR reaches the story ending on printed page 11, then begins Halo, kto mówi on page 12. This is full coverage of this assigned story, not the entire collection. OCR/translation-credit issues remain. | Printed collection/catalogue records are not recordings. No specific Polish human-audio player was verified. |
| RU | `Звезда`, Arthur Clarke; original-story synopsis matched. | Artefact index marks the text removed; that index is not a full-text finding. No RU text row. | Submitted Гарри Стил recording page/player, 16:46. Metadata only. |
| ES | `La estrella`; Lecturia credits Antonio-Prometeo Moya and original The Star. | Submitted complete HTML story through FIN. Reader access inspected; direct HTTP 403 disclosed. | Submitted Cuentos de la Casa de la Bruja episode 302, Juan Carlos Albarracín, 22:29. Public player and transcript checked, not fully listened. |

Leads and limits:

- [Discussion, not audiobook](https://www.sffaudio.com/reading-short-and-deep-202-the-star-by-arthur-c-clarke/); its `TheStarByArthurC.Clarke.pdf` link returned 404.
- [Polish edition contents](https://www.encyklopediafantastyki.pl/index.php?title=Gwiazda_%28Clarke%29) name a translator differently from the OCR boundaries. Reconcile against a clean title/credit scan before publishing translator metadata. The source/assigned story match is independently established by the narrative and ending.
- [Removed-text index](https://artefact.lib.ru/library/clarke.htm): do not infer current text availability.

## Q6271990 — Sandkings — George R. R. Martin

Form: novelette. Catalog references: [ISFDB 45192](https://www.isfdb.org/cgi-bin/title.cgi?45192), [FantLab 4109](https://fantlab.ru/work4109). The story and same-named seven-story collection are distinct search scopes.

| Language | Title check | Text and fragment outcome | Audio outcome / next step |
|---|---|---|---|
| EN | Original Sandkings author/title and Simon Kress story scope checked against assigned metadata. | Page-one text candidate not inspected through its ending; no EN text row. | Commercial and third-party audio leads not fully inspected. Discussion/readalong episodes are not automatically readings. |
| PL | `Piaseczniki`; creator names original Sandkings and Darosław Jerzy Toruń translation in Fantastyka July 1986. | Modern collection/ebook sample listings do not establish that the title story is inside the visible fragment; no text row. | Submitted the specific Apple episode; creator Ryszard Chojnowski, 01:45:25. Apple API, RSS and public MP3 range response cross-check described above. |
| RU | Source title `Песочники`, explicitly aliases Sandkings / Песчаные короли / Мутанты. | Flibusta listing found but text itself not opened/checked; no full-text row. | Submitted Юрий Мир episode/player, 01:39:19. Original title and Simon Kress synopsis corroborate identity. |
| ES | `Los reyes de la arena`, George R. R. Martin. | Publisher/collection and review references remain publication leads, not inspected full text. | Submitted Comisión 2022 / UNLP student-cast audiocuento, 01:36:14. Excluded one paid preview and one collection review. |

Cross-checks and exclusions:

- [Apple public lookup](https://itunes.apple.com/lookup?id=1742441860&entity=podcastEpisode&limit=30), [creator RSS](https://anchor.fm/s/f4da1674/podcast/rss), episode ID `1000653119561`. The canonical enclosure accepted the byte-range request. RSS page link [creator episode](https://podcasters.spotify.com/pod/show/ryszard-chojnowski93/episodes/George-R--R--Martin---Piaseczniki-e2igq9d) was not readable through the web tool; Apple episode and enclosure were independently checked. Do not treat the music's Epidemic Sounds license as permission for the story.
- [English page-one candidate](https://theallfreenovel.com/15442/1/sandkings): inspect all pages and the ending before adding full coverage.
- [Polish collection listing](https://www.legimi.pl/ebook-piaseczniki-george-r-r-martin%2Cb1393117.html): target-story presence in an available sample still needs checking.
- [Russian listing](https://flibusta.info/b/120111/): match readable contents, not just title/description, before a text finding.
- [Excluded Relatos Salvajes preview](https://www.ivoox.com/en/297-seleccion-salvaje-los-reyes-arena-audios-mp3_rf_76338912_1.html): supporting the podcast is required for the full episode.
- [Excluded La Vieja Raza episode](https://www.ivoox.com/en/vieja-raza-8x03-los-reyes-la-audios-mp3_rf_182757334_1.html): description says Sin Spoilers and lists the collection's seven stories. This is a review, not a verified reading of the assigned story.

## PR-flow test scope

This submission intentionally changes only the new CSV and this note. Validate with trusted current-main code, compare against fresh main for duplicates, and dry-run the existing importer without writing generated coverage or site data.

The connected GitHub account owns the upstream repository. This run exercises a real same-repository branch -> data-only PR -> Findings submission/CI route. It does not claim to test an independent outside contributor's fork permissions or first-time-fork workflow approval. The external-fork route remains the documented reader path.

The PR is review input. Successful schema/security checks do not certify copyright permission or recording completeness, and merging a findings CSV alone does not publish the links on the site. Maintainer review/import is a separate step.
