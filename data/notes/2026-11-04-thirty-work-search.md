# Thirty-work findings batch — 2026-11-04

Baseline refreshed before submission: `foteev/unoebasta:main` at `641da53f178ea3b437986d322f604a193606c77c`. Coverage, catalog, READ links, sourced aliases and all historical findings (including merged PR #20) were included in duplicate checking. No other open findings PR existed; remaining open PRs were dependency updates.

Assigned **30 existing QIDs**, searched separately on **EN/PL/RU/ES (120 work/language targets)**. Original title plus author, native catalog titles where available, and text/reading/audio terms were queried independently; targeted bibliographic follow-ups replaced failed or ambiguous searches. Exploratory literal translations are explicitly not asserted as published aliases.

Delivered **49 new links for 30 works**: **20 full texts, 12 inspected text fragments, 17 audio pages**. EN 15, PL 3, RU 22, ES 9. Counts are source links, not distinct editions or 49 newly covered books. A positive source in one language does not close the other language targets.

## Review limits

- Text inspection checked actual narrative, identity, language and the stated boundaries. Fragments include only the narrative portion actually verified, even where an external reader advertises a larger complete book. A collection title or table of contents alone was never counted.
- All 17 audio rows credit named narrators and expose public player/recording metadata. **No sampled playback, independent human-voice assessment, or end-to-end listen was performed.** Runtime is not proof of completeness. Rows retain these limits; they are not listening-certified recordings.
- iVoox explicit unavailable/exclusive-preview banners were excluded from free full-audio findings. The matching BIBLIOTHEKA episode has unresolved human-versus-synthetic voice and stays in notes. YouTube search hits were not promoted from snippets.
- External copies retain empty licenses and permission-unknown evidence. Rights-holder/retailer provenance supports t2 only for the live Ellison author page and the complete Merchant story inside Legimi's public preview; neither grants an open redistribution license. Fragments use frag, which describes access scope, not licensing.
- Some readable indexed source pages did not pass separate direct HTTP retrieval: Stony Brook and the Asimov archive returned 503; Webderland returned 503; Zanotowane timed out; XpressEnglish returned 406. These restrictions are retained in CSV evidence. Recheck direct delivery before maintainer import; indexed readability is not a guarantee of availability from every client.
- Word counts are positive approximations. Where possible, HTML/PDF text was counted **in memory** and editorial material excluded approximately; several counts are explicitly estimates. No narrative bodies, audio/video, credentials or reader data are committed.
- This is a **findings-only PR**. A pure importer dry-run is part of validation. Generated coverage, awards data, site, workflows and research registry are unchanged. Merging these two files does not itself publish links; maintainer import/build remains separate.

## Per-work language checks and next steps

### 1. Q27903111 — The Paper Menagerie

Authors: Ken Liu. Catalog form: short story.

- **EN** — No new CSV row. Existing Gizmodo full text and Escape Pod EP345 audio were excluded as duplicates. Retailer/collection audio listings are leads; a collection title is not proof that its sample contains this story. Next: inspect LeVar Burton Reads' primary episode/feed.
- **PL** — No new CSV row. No published Polish title was confirmed in the original-title/author plus Polish-language searches. Do not turn an exploratory literal translation into an alias. Next: inspect Polish Ken Liu anthology contents.
- **RU** — CSV: audio (Аудиокниги Клуб). New standalone audio page credits Гарри Стил, 36:11; original English title displayed. Playback/completeness not sampled. Separate collection-reader search hits remain unreviewed leads.
- **ES** — CSV: full (Lecturia). New complete Lecturia text credits María Pilar San Román Navarro. Opened Alianza's collection PDF, but its first story is Acerca de las costumbres de elaboración de libros en determinadas especies, not the assigned story; that publisher sample was excluded (https://www.alianzaeditorial.es/primer_capitulo/el-zoo-de-papel-y-otros-relatos.pdf).

### 2. Q16747517 — Exhalation

Authors: Ted Chiang. Catalog form: short story.

- **EN** — No new CSV row. Existing Lightspeed full text and Escape Pod EP194 are already known. Exhalation collection samples can begin with Merchant; do not assign them to this story without inspecting contents.
- **PL** — CSV: fragment (Legimi). Legimi's actual Wydech preview contains the opening of the assigned story after Merchant and then a purchase prompt. Added as fragment only.
- **RU** — CSV: audio (Аудиокниги Клуб). New audio credits Кирилл Головин, player 41:52, original title Exhalation displayed. No independent voice or full-recording check.
- **ES** — No new CSV row. Resolved displayed title Exhalación. Opened three iVoox pages: collection 80354739 is unavailable; story 107709629 (55:41) and PRAF 123358153 (49:51) are exclusive paid previews. None added as free full audio. Next: inspect a narrator's public feed: https://www.ivoox.com/exhalacion-ted-chiang-audios-mp3_rf_107709629_1.html .

### 3. Q467388 — The Merchant and the Alchemist's Gate

Authors: Ted Chiang. Catalog form: novelette.

- **EN** — No new CSV row. Original-title/author searches produced collection samples, a paid edition and discussion podcasts. No new separately verified English narrative/audio was added. Next: follow original F&SF publication and author/publisher reprint references.
- **PL** — CSV: full (Legimi). Important: Legimi's partial Wydech collection preview contains the whole assigned first story, through the conclusion and translator credit, before the Wydech heading. Added full story, about 7500 words, translation Michał Jakuszewski; no claim that the whole collection is free.
- **RU** — CSV: audio (Аудиокниги Клуб); fragment (ЛибКат). Added Булдаков Олег audio (six tracks, stated 1 h 43 min) and only the inspected first-page LibCat text fragment (В. Гришечкин; 17-page reader). Intervening text pages were not verified.
- **ES** — CSV: full (Lecturia). New complete Lecturia story supplies the sourced title El comerciante y la puerta del alquimista and translator Rubén Martín Giráldez. Earlier exploratory mercader wording was a query, not a verified alias. https://lecturia.org/cuentos-y-relatos/ted-chiang-el-comerciante-y-la-puerta-del-alquimista/19545/

### 4. Q7620415 — Story of Your Life

Authors: Ted Chiang. Catalog form: novella.

- **EN** — No new CSV row. Separate the novella from the Stories of Your Life and Others collection and Arrival film. SFFaudio #425 is a readalong/discussion lead, not by itself a reading. No new inspected English copy.
- **PL** — No new CSV row. Historia twojego życia retailer/audio listings are collection leads. The inspected Legimi preview contains Tower of Babylon, not the title novella; it was not assigned to this QID. Next: inspect a preview that actually reaches the title story.
- **RU** — CSV: audio (Книга в ухе). New standalone Сергей Рощупкин audio page states 03:23:14. Only page/player metadata checked; no full listen.
- **ES** — CSV: fragment (Revista de la Universidad de México / UNAM). Added UNAM/Revista de la Universidad de México's explicitly identified, permission-credited fragment, not full novella. Radio Albemuth's human-voice iVoox page says content not available, so excluded: https://www.ivoox.com/historia-tu-vida-ted-chiang-audios-mp3_rf_20681461_1.html .

### 5. Q4102150 — Tower of Babylon

Authors: Ted Chiang. Catalog form: novelette.

- **EN** — No new CSV row. Original-title/author searches found paid editions and a LibCat listing, without a newly reviewed complete English copy. Next: inspect publisher ebook/sample or a complete author-approved reprint.
- **PL** — CSV: fragment (Legimi). New Wieża Babilonu fragment is actually present in Legimi's Historia twojego życia preview. It cuts off in the tunnel/flood scene at a purchase prompt, before the story's conclusion; not full.
- **RU** — CSV: audio (Аудиокниги Клуб). New Кирилл Головин player page, 01:04:28, 1990 story. Metadata only.
- **ES** — No new CSV row. Opened Que Hay Con's episode La Torre de Babilonia (01:14:54). Description identifies the first story, but actual reading extent and human narration remain unchecked; not in CSV. Next: sample the episode, distinguish a reading from commentary: https://www.ivoox.com/en/torre-babilonia-la-historia-de-audios-mp3_rf_128298138_1.html .

### 6. Q20737828 — Bloodchild

Authors: Octavia E. Butler. Catalog form: novelette.

- **EN** — No new CSV row. Existing BookBrowse excerpt URLs were excluded. The XpressEnglish Bloodchild page is a synopsis, not a narrative. Eye of Midas PDF is 17 image-only pages: text extraction yielded zero words and the available screenshot interface did not expose pixels for review, so no full-text claim. Next: visually inspect that scan or a publisher sample: https://eyeofmidas.com/scifi/Butler_Bloodchild.pdf .
- **PL** — No new CSV row. Do not confuse Butler's Kindred (Więzy krwi) with Bloodchild or similarly titled works by Agnieszka Pruska/Maja Lidia Kossakowska. Original-title searches did not confirm a Polish story text/audio or a sourced translation alias. Next: use anthology contents.
- **RU** — No new CSV row. Exploratory Russian Bloodchild/Butler searches did not resolve a published title or yield inspected matching narrative/audio. Amnesty results are a different work and were excluded. Next: establish the title from a bibliography before searching again.
- **ES** — CSV: full (Eskalera Karakola / Sindominio). Added complete 17-page Hijo de sangre PDF, author credit through FIN; translator not established. Excluded Richard Matheson's same-title audio hits. Permission for this external PDF remains unknown.

### 7. Q7575378 — Speech Sounds

Authors: Octavia E. Butler. Catalog form: short story.

- **EN** — CSV: full (Lecturia); full (shortsonline / XpressEnglish). Added two distinct readable English originals: Lecturia and XpressEnglish, both inspected through the ending; kept existing Serving Library URL out of submission. XpressEnglish direct fetch returned 406, despite readable indexed text.
- **PL** — No new CSV row. Catalog title Dźwięki mowy used with Butler and Polish text/audio terms. No new story-containing source was confirmed. Next: inspect the Polish anthology publication rather than general audiobook catalogues.
- **RU** — CSV: audio (Аудиокниги Клуб). New Олег Булдаков narration card, stated 40 min; metadata only.
- **ES** — CSV: full (Lecturia). Added complete Sonidos del habla, translation credited Juan Pablo Guevara for Lecturia. Other iVoox episode hits remain unreviewed audio leads; no voice/completeness claim.

### 8. Q468132 — The Bicentennial Man

Authors: Isaac Asimov. Catalog form: novelette.

- **EN** — CSV: full (Lecturia). Added Lecturia's 1976 single-author story through section 23 and THE END. This is not the later Asimov/Silverberg novel The Positronic Man and not the film.
- **PL** — No new CSV row. Searches under Asimov, original title and Dwustuletni człowiek did not yield a reviewed Polish narrative/audio source. Do not silently substitute Pozytronowy człowiek, the later novel. Next: establish a published short-story translation title.
- **RU** — CSV: audio (Аудиокниги Клуб). New Катерина Алексеенко narration, seven tracks, stated 1 h 25 min; original title and 1976 story attribution shown.
- **ES** — No new CSV row. El hombre bicentenario commercial audiobook by Raúl Lloréns is a publication lead, not free coverage. The observed Penguin listing was not enough to certify a playable free story: https://www.penguinlibros.com/es/audiolibros-ciencia-ficcion-y-fantasia/13149-audiolibro-el-hombre-bicentenario-9788416628001 .

### 9. Q16387285 — Neutron Star

Authors: Larry Niven. Catalog form: short story.

- **EN** — CSV: full (Stony Brook University course page). Added Stony Brook course-hosted English PDF, title/author and concluding puppeteer dialogue inspected. Indexed content readable; direct fetch returned 503 twice. Recheck direct delivery before import; 7000-word count is an estimate.
- **PL** — No new CSV row. Gwiazda neutronowa searches generated astrophysics podcasts; those are not Niven's story. No inspected Polish text/audio. Next: inspect Niven anthology contents.
- **RU** — No new CSV row. Matching Russian text/audio portal hits remain unreviewed leads; no CSV row based on snippets. Next: open the specific Нейтронная звезда story and distinguish the collection from the story.
- **ES** — No new CSV row. Spanish exploratory Estrella de neutrones searches did not establish an exact published alias or a reviewed public reading. INCI Neutron star listing is only an uninspected lead: https://biblioteca.inci.gov.co/handle/inci/18465 .

### 10. Q2350912 — The Last Castle

Authors: Jack Vance. Catalog form: novella.

- **EN** — No new CSV row. No new reviewed English text/audio. Open Library and anthology listings are publication leads, not free narrative. Next: inspect an original magazine or authorized preview.
- **PL** — No new CSV row. Existing Ostatni zamek Legimi fragment was excluded as duplicate. Paperback/bibliographic hits do not add coverage. Next: inspect publisher sample contents for an additional source.
- **RU** — CSV: audio (Аудиокниги Клуб). New Puffin Cafe audio page. Its player shows 02:05:33, but the duration field says 2 h 37 min: keep this discrepancy visible and do not infer completeness.
- **ES** — No new CSV row. Searches found the print edition El último castillo. Hombres y dragones, without an inspected readable sample/audio. Next: follow that edition's publisher/ISBN, not secondhand-shop availability.

### 11. Q7747230 — The Lifecycle of Software Objects

Authors: Ted Chiang. Catalog form: novella.

- **EN** — CSV: fragment (RoyalLib). Added only the English opening served by RoyalLib. Retrieved text stops during early Ana/Jax training; whole novella not verified despite book-reader styling.
- **PL** — No new CSV row. Cykl życia oprogramowania is a collection publication lead. Inspected Wydech preview stops in the second story, long before this novella. No matching fragment added.
- **RU** — CSV: audio (Аудиокниги Клуб). New Кирилл Головин four-track player, stated 3 h 47 min. Metadata only; an alternate Сергей Оробчук recording remains a follow-up lead.
- **ES** — No new CSV row. El ciclo de vida de los objetos de software searches produced discussion/review episodes and collection listings. No reviewed narrative/audio. Next: inspect Spanish collection contents and a story-specific recording.

### 12. Q17008262 — The Last of the Winnebagos

Authors: Connie Willis. Catalog form: novella.

- **EN** — CSV: full (SFSFSS). Added complete SFSFSS HTML through The End; direct HTTP 200, approximately 20781 whitespace tokens including headings, rounded down for story estimate. External permission unknown.
- **PL** — No new CSV row. Ostatni winnebago searches yielded bibliographic references rather than an inspected text/audio. Next: locate the translated anthology edition and its sample.
- **RU** — CSV: fragment (ЛибКат). Added only inspected first-page Последняя виннебаго narrative, credited М. Перпер; 25-page reader not fully reviewed. No free audio confirmed.
- **ES** — No new CSV row. El último de los Winnebago used with Willis and Spanish reading/audio terms. No inspected source confirmed. Next: follow award anthologies and original-title edition records.

### 13. Q7756755 — The Persistence of Vision

Authors: John Varley. Catalog form: novella.

- **EN** — No new CSV row. English LibCat source returned 429; Audible is a paid recording lead. Neither establishes new free coverage. Do not retry a blocked host in a tight loop: https://libcat.ru/knigi/fantastika-i-fjentezi/346637-john-varley-the-persistence-of-vision.html .
- **PL** — No new CSV row. Uporczywość widzenia searches produced bibliographic/anthology leads including Piknik po Bliższej Stronie, without reviewed narrative/audio. Next: inspect that anthology's actual contents/sample.
- **RU** — CSV: fragment (ЛибКат). Resolved published title Навязчивость зрения from FantLab work34900, translation А. Новиков (2023 edition listed): https://fantlab.ru/work34900 . Added only first-page fragment; a last-page peek does not verify all 24 pages. Exploratory Упорство wording was discarded.
- **ES** — No new CSV row. La persistencia de la visión yielded commercial editions, not inspected public narrative/audio. Next: use the exact anthology edition, not title-only audio matching.

### 14. Q6176396 — Jeffty Is Five

Authors: Harlan Ellison. Catalog form: short story.

- **EN** — CSV: full (Lecturia). Added complete English Jeffty Is Five on Lecturia through THE END. Author-read paid collections are publication leads, not free audio.
- **PL** — No new CSV row. Resolved Jeffty ma pięć lat in Ebookpoint's Opowiadania najlepsze contents. Read-fragment control returned the listing without confirmed target text. No fragment row: https://ebookpoint.pl/ksiazki/opowiadania-najlepsze-harlan-ellison,e_4r96.htm .
- **RU** — CSV: audio (Аудиокниги Клуб). New Константин Ермихин recording, introduction 2:40 plus story 55:35. Metadata only.
- **ES** — CSV: full (Lecturia). Added complete Jeffty tiene cinco años on Lecturia, translator Juan Carlos Silvi, through FIN.

### 15. Q5916312 — Houston, Houston, Do You Read?

Authors: Alice Bradley Sheldon. Catalog form: novella.

- **EN** — No new CSV row. SFFaudio #778 is a readalong; Sci-Fi Radio is a dramatization lead, not an established unabridged human reading of the novella. No new inspected English story copy. Next: inspect the primary audio/text edition and label adaptations separately.
- **PL** — No new CSV row. Known Houston, Houston, czy mnie słyszysz? anthology references found; no reviewed online narrative/audio. Next: follow that specific collection's sample.
- **RU** — CSV: fragment (RuLit). Added only first-page Хьюстон, Хьюстон, как слышите? narrative. Author uses James Tiptree Jr. pseudonym (Alice Bradley Sheldon); not a different author.
- **ES** — No new CSV row. Minotauro magazine PDF hits are publication leads, not yet opened/reviewed story spans. No Spanish CSV row. Next: locate the exact story and its ending inside the issue before claiming full text.

### 16. Q7736542 — The Girl Who Was Plugged In

Authors: Alice Bradley Sheldon. Catalog form: novella.

- **EN** — No new CSV row. Penguin Warm Worlds and Otherwise sample and SFFaudio #285 readalong are leads; actual assigned story coverage was not established. Next: inspect sample contents and avoid counting discussion as reading.
- **PL** — No new CSV row. No Polish published translation title was established from original-title/author searches. Exploratory Dziewczyna wording is not an alias. Next: inspect a Tiptree bibliography/anthology.
- **RU** — CSV: audio (Аудиокниги Клуб). New Puffin Cafe card displays original The Girl Who Was Plugged In and Russian Девочка, которую подключили, stated 1 h 47 min. Tiptree/Sheldon identity reconciled; metadata only.
- **ES** — No new CSV row. Apple episode identifies La muchacha que estaba conectada and labels human-voice audio. Primary playable media and complete story were not verified, so kept as lead: https://podcasts.apple.com/es/podcast/la-muchacha-que-estaba-conectada-de-james-tiptree-jr/id1269028690?i=1000460111590 .

### 17. Q2447776 — The Word for World Is Forest

Authors: Ursula K. Le Guin. Catalog form: novella.

- **EN** — CSV: fragment (Macmillan / Tor). Added actual Macmillan/Tor Read Excerpt narrative beginning with Captain Davidson. Paid-book excerpt, not full novella.
- **PL** — No new CSV row. Słowo „las” znaczy „świat” searched separately. No inspected new target-containing sample/audio; an omnibus sample may start with another Hainish work. Next: inspect exact story location.
- **RU** — No new CSV row. Existing LitRes fragment is already known. LitRes/Yandex audio listings are paid/subscription leads, not new free full audio. No audio row from the YouTube search snippet.
- **ES** — No new CSV row. iVoox part 1 (chapters 1–3) is an unreviewed multipart lead, not a complete recording: https://www.ivoox.com/1-el-nombre-del-mundo-es-bosque-audios-mp3_rf_10314448_1.html . Next: inspect all parts, voice and access.

### 18. Q27973661 — The Meeting

Authors: Frederik Pohl; Cyril M. Kornbluth. Catalog form: short story.

- **EN** — CSV: fragment (ЛибКат). Added inspected English opening with both Frederik Pohl and Cyril Kornbluth byline; four-page reader is not certified complete. Do not lose Kornbluth when a listing indexes only Pohl.
- **PL** — No new CSV row. Catalog title Spotkanie used with both authors. No reviewed Polish text/audio; title-only meetings/search noise not counted. Next: inspect the translated anthology.
- **RU** — CSV: fragment (HomeRead). Resolved matching Russian title Заседание by opening the story and matching Harry Vladek/school opening against English. Both authors credited. Added opening only. Встреча с Хичи is Pohl's different novel and was excluded.
- **ES** — No new CSV row. Opened iVoox 321 La reunión: both authors match, but explicit exclusive-episode preview banner blocks free-full-audio claim. Next: find an open reading: https://www.ivoox.com/321-la-reunion-frederik-pohl-y-audios-mp3_rf_134428594_1.html .

### 19. Q4503218 — The Queen of Air and Darkness

Authors: Poul Anderson. Catalog form: novella.

- **EN** — CSV: fragment (Luminist Archives). Added conservative fragment from New America PDF, story section from printed p159. Retrieved text stops mid-sentence at p198; the remainder/end is not verified. Do not label whole work full on contents alone.
- **PL** — No new CSV row. Królowa powietrza i mroku bibliography/print references found; no actual new Polish narrative/audio. Next: inspect anthology sample.
- **RU** — No new CSV row. Flibusta's Царица ветров и тьмы page is a collection/listing, not inspected narrative; Librusec fetch failed and English LibCat gave 429. No row based on those listings: https://flibusta.club/b/124730 .
- **ES** — No new CSV row. Opened BIBLIOTHEKA audio-relato page, 01:40:09, public player and matching author/title. Human versus synthetic voice, complete playback and exact extent not established: kept as lead, not human-audio row. https://www.ivoox.com/en/reina-del-aire-oscuridad-audios-mp3_rf_177577796_1.html

### 20. Q7542071 — Slow Sculpture

Authors: Theodore Sturgeon. Catalog form: novelette.

- **EN** — CSV: full (Soltech Design). Added complete 23-page Slow Sculpture PDF; author and final dialogue/end ornament inspected; direct HTTP 200, 7752 tokens including headers. External permission unknown.
- **PL** — No new CSV row. Powolna rzeźba searched with Sturgeon and Polish text/audio terms; no reviewed online story. Next: inspect the translated collection/anthology.
- **RU** — CSV: audio (Аудиокниги Клуб). New Puffin Cafe standalone narration, player 54:06, 1970 story. Metadata only.
- **ES** — No new CSV row. Exploratory Escultura lenta query did not establish a published Spanish title or an inspected reading. Next: verify Spanish bibliographic alias before broader audio search.

### 21. Q130617368 — A Boy and His Dog

Authors: Harlan Ellison. Catalog form: novella.

- **EN** — No new CSV row. Existing English fragment excluded. XpressEnglish synopsis and author-read commercial collections are publication leads, not inspected new free narrative/audio. Distinguish novella from film.
- **PL** — No new CSV row. Chłopiec i jego pies print/ebook leads found; no inspected sample/audio added. Next: inspect actual translated narrative, not adaptation reviews.
- **RU** — CSV: audio (Аудиокниги Клуб). New Рауль Абдуллин recording, eight-track player, stated 1 h 27 min; source displays original title and Russian Мальчик и его собака alias. Metadata only.
- **ES** — CSV: full (Lecturia). Added complete Un muchacho y su perro through FIN. Lecturia lists translation credits Márgara Auerbach, María Cristina Pinto and Paula Tizzano; retained all listed credits without choosing an unsupported individual attribution.

### 22. Q1973586 — The Dragon Masters

Authors: Jack Vance. Catalog form: short story.

- **EN** — No new CSV row. English LibCat reader and JackVance.com ebook shop are publication leads not reviewed through complete narrative. Next: inspect original publication or publisher sample.
- **PL** — No new CSV row. Władcy smoków print/anthology listings do not establish free Polish text/audio. Next: inspect actual sample.
- **RU** — CSV: audio (Аудиокниги Клуб). New Константин Ермихин player with twelve tracks, stated 3 h 31 min; original title and 1962 story identified. CSV uses existing catalog form short story (historical Hugo category), not a silent bibliography/schema correction.
- **ES** — No new CSV row. Spanish edition title remains unresolved in this pass; exploratory señores wording is not a sourced alias. Next: inspect the Spanish Hombres y dragones edition/bibliography associated with the Vance collection.

### 23. Q7717642 — The Big Front Yard

Authors: Clifford D. Simak. Catalog form: novelette.

- **EN** — No new CSV row. English Big Front Yard anthology/LibCat listings found without a newly inspected target text/audio. Next: inspect an actual story span, not collection title.
- **PL** — No new CSV row. Catalog has Wielkie podwórze frontowe; indexed bibliography uses Wielkie frontowe podwórze. Treat word-order variant as a lead until source opened: https://www.encyklopediafantastyki.pl/index.php?title=Wielkie_frontowe_podw%C3%B3rze . No text/audio row.
- **RU** — CSV: audio (Аудиокниги Клуб). New Puffin Cafe narration, stated 1 h 59 min, standalone 1958 story. Metadata only.
- **ES** — No new CSV row. Exploratory El gran patio delantero searches did not confirm an exact published title or reviewed reading. Next: use Simak's multilingual bibliography to resolve title first.

### 24. Q7773900 — The Way of Cross and Dragon

Authors: George R. R. Martin. Catalog form: short story.

- **EN** — No new CSV row. Existing Lightspeed full text/audio links excluded as duplicates. Other collection/torrent hits were not reviewed or added.
- **PL** — No new CSV row. Droga krzyża i smoka is a Piaseczniki collection lead. A Piaseczniki sample does not automatically contain this different story. No new Polish coverage; next inspect contents and actual sample span.
- **RU** — CSV: audio (Аудиокниги Клуб). New Александр Степной narration, stated 48 min, 1979 story. Metadata only.
- **ES** — CSV: full (Lecturia). Added complete El camino de la Cruz y el Dragón through FIN; original title shown, translation credits Albert Solé, Francisco Blanco, Rafael Marín Trechera retained as displayed.

### 25. Q905714 — Think Like a Dinosaur

Authors: James Patrick Kelly. Catalog form: novelette.

- **EN** — CSV: full (Electronics & Books magazine archive). Added the actual original magazine story in Asimov's June 1995, printed pp12–32: title/author, opening, end marker and transition to next poem/story inspected. TV Outer Limits adaptation excluded. Direct archive fetch returned 503; indexed PDF readable. Count estimated.
- **PL** — No new CSV row. Original-title/author search found Hartwell anthology To, co najlepsze w SF. Tom 1 as an unreviewed publication lead. No translated alias or story sample certified. Next: inspect its contents.
- **RU** — No new CSV row. Exploratory Думай как динозавр query did not establish a published Russian title or inspected recording. Do not insert it as an alias. Next: resolve the work in FantLab/ISFDB.
- **ES** — No new CSV row. Catalog Piensa como un dinosaurio used with Kelly; no inspected new Spanish narrative/audio. Next: inspect the actual translated edition, not TV-title results.

### 26. Q3791300 — The Cookie Monster

Authors: Vernor Vinge. Catalog form: novella.

- **EN** — CSV: full (SFSFSS). Added complete SFSFSS English novella, 2003, ending inspected. Direct HTTP 200; about 19618 tokens, some encoding corruption preserved as access/edition caveat.
- **PL** — No new CSV row. Original-title and exploratory Ciasteczkowy potwór searches returned unrelated Sesame Street material. No Polish alias certified. Next: inspect Vinge bibliography before querying a translated title.
- **RU** — No new CSV row. Куки-монстр is in current catalog. Opened LibKing listing but no full-story verification; no row based on the listing. Next: inspect the reader body and ending: https://libking.ru/books/sf-/sf-cyberpunk/208785-vernor-vindzh-kuki-monstr.html .
- **ES** — No new CSV row. El monstruo de las galletas print/PlanetaLibro leads remain unreviewed; synopsis alone was not added. Next: open an actual reader or narrator episode.

### 27. Q27973457 — Paladin of the Lost Hour

Authors: Harlan Ellison. Catalog form: novelette.

- **EN** — CSV: full (Ellison Webderland). Added live author-site Paladin of the Lost Hour. Existing Wayback URL was excluded separately; this is a current alternate endpoint. Author-site copyright/distribution prohibition retained: t2 denotes provenance, not CC/reuse permission. Direct fetch gave 503; indexed story readable.
- **PL** — No new CSV row. Resolved Paladyn utraconej godziny from Ebookpoint Opowiadania najlepsze contents. Sample did not expose verified target text; no row. Next: inspect a sample reaching that chapter.
- **RU** — No new CSV row. Resolved Хранители потерянного часа from FantLab work16196, correcting exploratory literal query wording. No inspected matching narrative/audio; next follow listed translated editions: https://fantlab.ru/work16196 .
- **ES** — No new CSV row. Exploratory Paladín de la hora perdida did not establish a published Spanish alias or reviewed reading. Next: resolve a translated anthology title before claiming a language gap.

### 28. Q27976010 — Boobs

Authors: Suzy McKee Charnas. Catalog form: short story.

- **EN** — No new CSV row. Yumpu/Music of the Night PDF results are unreviewed narrative leads. Every Hugo Ever episode is discussion, not established narration. No English CSV row; next inspect the story itself and its ending.
- **PL** — No new CSV row. No Polish published alias or inspected story/audio established from Charnas/original-title searches. Next: consult translated anthology bibliography.
- **RU** — CSV: audio (Книга в ухе). New standalone Сиськи narration page credits Константин Ермихин, 51:36. Title/author and player metadata only; no independent human-voice or completeness check.
- **ES** — No new CSV row. Exploratory Tetas query did not certify a Spanish translation title or reading. No same-title unrelated podcast counted. Next: resolve Charnas' Spanish story bibliography.

### 29. Q28015722 — Rachel in Love

Authors: Pat Murphy. Catalog form: novelette.

- **EN** — No new CSV row. Existing author/SFWA Wayback full text and Escape Pod EP447 excluded as duplicates. A commercially abridged recording is not free/full unabridged coverage.
- **PL** — No new CSV row. Resolved Zakochana Rachela, translator A. Nakoniecznik, 1988, from opened FantLab work81668: https://fantlab.ru/work81668 . No reviewed Polish narrative/audio. Next: inspect that anthology.
- **RU** — No new CSV row. Resolved Влюблённая Рашель (А. Корженевский; 1992 edition listed) from the same card; earlier Рейчел query wording was not accepted as an alias. Librusec result is an unreviewed lead, not a confirmed reading.
- **ES** — CSV: full (Maestros del Saber). Added complete 24-page Raquel enamorada PDF, Rachel in Love/1987 credit and final return-home paragraph inspected. File references Axxón 82 (August 1996) but leaves translator unknown; unknown remains unknown.

### 30. Q27881786 — The Death of Dr. Island

Authors: Gene Wolfe. Catalog form: novella.

- **EN** — CSV: full (Zanotowane). Added English Gene Wolfe novella through final Nicholas/Kenneth scene, not The Doctor of Death Island. Word count estimated; direct request timed out while indexed story was readable.
- **PL** — No new CSV row. Śmierć doktora Wyspy bibliography/print collection hits found, no inspected target narrative/audio. Next: inspect an actual sample rather than collection title.
- **RU** — No new CSV row. Important catalog identity defect: stored FantLab 36590 is Доктор острова Смерти / The Doctor of Death Island (1978), a different work. Correct matching card for this QID is work36589, Смерть доктора Острова (1973), translation А. Никулин (2015): https://fantlab.ru/work36589 . This data-only submission notes the correction but does not edit awards.json.
- **ES** — No new CSV row. Opened INCI La muerte del dr. Isla listing: DOCX explicitly requires sign-in, so not free anonymous text coverage. No inspected audio. Follow the cited source or an authorized public edition: https://biblioteca.inci.gov.co/handle/inci/9376 .

## Follow-up maintenance, outside this PR

1. Repair Q27881786's FantLab relation (36590 → 36589) after separate bibliography review. Do not attach the 1978 Doctor of Death Island to the 1973 award novella.
2. Promote sourced translation aliases from these notes through the normal reviewed registry workflow, particularly Навязчивость зрения, Заседание, El comerciante y la puerta del alquimista, Zakochana Rachela and Влюблённая Рашель. Preserve translator/edition uncertainty.
3. Check audio playback/voice and the Vance Last Castle duration mismatch before representing the recordings as listening-verified.
4. Revisit Polish anthology samples and explicit Spanish paywalls/unavailable feeds using different primary sources; scoped unsuccessful searches here are not claims that a translation or recording does not exist.
