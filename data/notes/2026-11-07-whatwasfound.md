# Research batch 2026-11-07-whatwasfound: 125 links for 60 works

Merged from three search-agent batches run on 2026-11-07 (their CSVs and notes lived in the maintainer's Claude project because those search sessions had no GitHub write access). Duplicates were rechecked against `main` at b42dcfc (2026-11-07, after PR #48; later commits only touched README files). The CSV holds source URLs and verification summaries only; no narrative text is copied.

| Batch | Run (UTC) | Works assigned | Rows submitted | Rows in this PR |
|---|---|---|---|---|
| gapsweep-1009 (test run) | 10:09 | 6: Q30337352 Q17989172 Q603645 Q808549 Q19346391 Q5706622 | 26 | 25 |
| gapsweep-1154 | 11:54 | 30 (Q963586 ... Q17026037, listed below) | 63 | 63 |
| gapsweep-1256 | 12:56 | 30 (Q4182240 ... Q3818994, listed below) | 38 | 37 |

Rows by language and kind: ru full 46, ru fragment 20, ru audio 1, en full 4, en fragment 27, es full 6, es fragment 11, pl fragment 10. Tier: `external` 57 (full/audio, permission unverified), `frag` 68. No row for Q2269230, Q17182684, Q2240456, Q3769828, Q3818994 (notes only) and Q3082606 (row withheld, see "Not included").

## Verification limits (read before merging)

- The search agents used a fetch tool that returns page text or a page summary; no browser and no playback. On paginated readers (LoveRead, Readli, e-reading.club) they opened the first page, the last page and usually one middle page. `full` therefore means "structure and ending look complete", not "read line by line"; endings were not compared with print. Large PDF/EPUB files were cut by the tool at about 65-110k characters.
- No audio was played by any agent. The only audio row (Q786025, knigavuhe.org) rests on the project owner's report of 2026-11-07 that it is the complete recording. Publisher audio excerpts (Macmillan, PRH) are short samples and are not audio rows. The synthetic-voice MP3 for Los desposeídos (Q467720) is not submitted as audio.
- Permission is unknown for every row; `license` is empty throughout. `frag` describes access scope only. Many `external` rows are community-library copies of in-copyright translations; maintainers decide what to publish.
- Owner reader checks of 2026-11-07 are written into the evidence of 20 rows (16 from gapsweep-1154, 4 from gapsweep-1256). A reader confirming identity, playback or completeness has checked only what the evidence says; permission was not checked. The other 105 rows are verified by the search agents only.
- No row carries a `NEEDS HUMAN CHECK` flag; open reader checks are listed per work and collected at the end.
- litres.ru readers excluded in `data/source-reviews.json` were not resubmitted; the Russian community/Readli rows are separate sources.
- Two rows were left out before submission: see "Not included".

## Sourced title and alias corrections (not in any CSV)

- Q17989172 RU: coverage «Меч правосудия» is not a published title; FantLab work528247 gives «Слуги меча» (tr. Валерий Лушников, Фантастика Книжный Клуб 2016; omnibus «Империя Радч» 2021). «Слуги правосудия» is Ancillary Justice.
- Q16386319 RU: «Изменчивая луна» (tr. В. Портянникова; FantLab work23486), not «Непостоянная Луна».
- Q9183865 RU: «Проект «Юпитер»» (Эксмо-Пресс 2000, tr. Е. Шестакова; FantLab work15931), alternate «Бесконечный мир». Readli/LibKing «Бесконечный мир» is Haldeman's Star Trek tie-in; rulit «Мост к разуму» is Mindbridge. Both were rejected.
- Q2300209 RU: Readli spells it «Акселерандо»; coverage has «Аччелерандо» (a Readli fragment entry uses that spelling).
- Q492207 PL: «Żołnierze kosmosu» (new edition, Ebookpoint) vs coverage «Kawaleria kosmosu» (old); a maintainer should confirm.
- Q603645 RU: author spelled «Майкл Шейбон» (Иностранка 2019, tr. Е. Калявина) or «Майкл Чабон» (Амфора 2008, tr. Ю. Балаян); ES «El sindicato de policía yiddish» (Debolsillo, tr. Javier Calvo); PL W.A.B. 2009, tr. Barbara Kopeć-Umiastowska.
- Q808549 volumes: PL «Żywe srebro» / «Zamęt» / «Ustrój świata» (MAG); RU «Ртуть» / «Смешенье» / «Система мира» (tr. Е. Доброхотова-Майкова, fanzon/Эксмо 2024-25); ES «Azogue» / «La confusión» / «El sistema del mundo» (Ediciones B).
- Q19346391 PL «Hominidzi» (Solaris 2007, tr. Agnieszka Jacewicz, ISBN 9788389951809); RU tr. Владислав Слободян.
- Q30337352: PL «Wrota obelisków» (SQN 2017, tr. Jakub Małecki); RU «Врата Обелиска» (Эксмо/fanzon 2021, tr. Наталия Некрасова); ES «El portal de los obeliscos» (NOVA, 2018).
- Q5706622: PL «Piekło to nieobecność Boga» (Solaris «Historia twojego życia» 2006; Zysk i S-ka 2016/2017); ES «El infierno es la ausencia de Dios» (Bibliópolis 2004, tr. Luis G. Prado; Alamut 2015/2021, ISBN 9788498891355); RU tr. Л. Щекотова (AST 2005) and Ксения Егорова (AST 2016/2026). An award-year discrepancy (2002 vs 2003) was not verified.
- Q3082606: the Russian Readli text is the later single-volume novel (see "Not included").

# Batch gapsweep-1009 (6 works)

Audio could not be played in this batch; audio leads below are reader checks. WebFetch could not read YouTube, harpercollins.com, empik.com, virtualo.pl, bonito.pl, litres.ru, bookmate, legimi search, scribd, issuu, audible JS players.

## Q30337352 The Obelisk Gate (N. K. Jemisin, novel)
- EN: no row. Hachette UK «Read Excerpt» anchor https://www.hachette.co.uk/titles/n-k-jemisin/the-obelisk-gate/9780356504896/#module-whats-inside had no content in the fetched text; "read online free" sites were deliberately not opened. Next: reader opens that anchor and the Google Play/Kobo samples of ebook ISBN 9780316229289.
- PL: Ebookpoint (SQN 2017) sample, no explicit end marker. Leads: https://issuu.com/wydawnictwosqn/docs/wrota_obeliskow_issuu (fetch failed), https://esensja.pl/ksiazka/prezentacje/tekst.html?id=24693.
- RU: no row. Eksmo https://eksmo.ru/ebook/vrata-obeliska-raskolotaya-zemlya-2-ITD1140840/ («Читать фрагмент», no extractable URL); MyBook https://mybook.ru/author/n-k-dzhemisin/vrata-obeliska/ marked «Недоступна» (a «Читать отрывок» link exists). Next: reader opens both fragments.
- ES: Everand preview row. penguinlibros.com fragment pages rejected (unrelated prose). Unchecked: https://extraits.tea-ebook.com/BookwirePRHGE/9/07/9788417347079.epub (binary, confirm book), Google Play https://play.google.com/store/books/details/El_portal_de_los_obeliscos_La_Tierra_Fragmentada_2?id=-aFBDwAAQBAJ&hl=es&gl=US, Kobo https://www.kobo.com/es/es/ebook/el-portal-de-los-obeliscos-la-tierra-fragmentada-2.
- Audio (none verified): EN Robin Miles https://audible.com/pd/The-Obelisk-Gate-Audiobook/B01K5RQ6J6, https://audiobookstore.com/audiobooks/the-obelisk-gate, https://libro.fm/audiobooks/9781478964391; PL Audioteka https://audioteka.com/pl/audiobook/wrota-obeliskow/ (~15 h 24 min, page says unavailable, no sample seen); ES Isa Puchol https://www.audible.com/pd/El-portal-de-los-obeliscos-The-Obelisk-Gate-Audiobook/B0BNSPVWY4 (~15 h 16 min). A reader plays the guest samples and records length and whether it is only a sample.

## Q17989172 Ancillary Sword (Ann Leckie, novel)
- EN: Gizmodo chapter 2 row (Orbit/Hachette excerpt, 2014; publisher authorisation not confirmed). Not submitted: https://annleckie.com/ancillary-sword-chapter-1/ (also -2, -3), full chapters but the page asks that the link be kept confidential (pre-order gift) with an all-rights-reserved footer; a maintainer may decide. The old Orbit excerpt redirects to the Orbit home page.
- PL: Ebookpoint sample row (Akurat/Muza 2016, tr. Danuta Górska). Woblink/Legimi list print only; Empik/Virtualo unreadable by the tool.
- RU: one `full`/`external` row, LoveRead.ec «Слуги меча» (pages 1, ~45, 90 = acknowledgments). Likely an unlicensed copy of an in-copyright translation (Лушников 2016); no LitRes/MyBook edition found.
- ES: PenguinLibros EC fragment row (verified as this book; tr. Victoria Morera García). Reader checks: https://extraits.tea-ebook.com/BookwirePRHGE/6/40/9788490690406.epub (binary), https://books.google.com/books?id=CSMpDwAAQBAJ. Unlicensed Scribd copy not used.
- Audio (none verified): EN Adjoa Andoh (~11 h 44 min) https://audible.com/pd/Ancillary-Sword-Audiobook/B00O5GFLRC, https://xigxag.co.uk/audiobook/ancillary-sword-9781405532396/ (not available in country); ES Nerea Alfonso Mercado (PRH Audio 2025) with a free MP3 sample referenced on https://www.casadellibro.com.co/audiolibro-espada-auxiliar-imperial-radch-2-audiolibro/9788419260703/17797175 (sample https://cdn.vivlio.com/product/v1/058db059-cc93-4e4a-bb62-609f0ed7f1c6/sample?format=.mp3, fetch errored) and https://www.audible.com.au/pd/Espada-auxiliar-Ancillary-Sword-Audiobook/B0G5TQTV2B. A sample is not free full audio.

## Q603645 The Yiddish Policemen's Union (Michael Chabon, novel)
- EN: three fragment rows (Mostly Fiction, BookBrowse page 1, LitRes international sample chapters 1-5). BookBrowse page 2 exists, URL not captured. The LitRes web reader should be confirmed to render in a normal browser. Not usable: Bookshare, Archive.org (lending only).
- PL: Ebookpoint row; the fetch rendered the three chapters in reverse order, so a reader should confirm what the sample shows. Empik pages https://www.empik.com/zwiazek-zydowskich-policjantow-chabon-michael,p1201250571,ebooki-i-mp3-p (and ...p1201250580...) unreadable.
- RU: Readli mirror of the LitRes sample (pages 3-25 narrative). Needs a maintainer decision: the original litres.ru reader is excluded and Readli is a third-party site. Not repeated: MyBook (unavailable), Azbuka https://azbooka.ru/books/soyuz-evreyskikh-polismenov («читать отрывок», URL not captured).
- ES: nothing verified. Reader checks: https://extraits.tea-ebook.com/LaesfraLibros/8/02/9788439723028.epub (file ISBN differs from listing ISBN 9788439721086, confirm book and length), https://books.google.com/books?id=hn-Y9sLfdwcC.
- Audio (Peter Riegert, HarperCollins; none verified): https://www.audiobooks.com/audiobook/yiddish-policemens-union-a-novel/268537, https://www.everand.com/audiobook/628919092/The-Yiddish-Policemen-s-Union-A-Novel, YouTube https://www.youtube.com/watch?v=FNdQgrcXY3o (also G5T8PJAv80Q, CYKYD_w2pxI, rJaewEJVxlg), a ~5-minute voice-actor demo https://www.voices.com/profile/wonderfish/the-yiddish-policeman-s-union-by-michael-chabon (not official, permission doubtful); RU YouTube lead https://www.youtube.com/watch?v=7gA86wGJxrU (title only). A 98-minute book-club podcast on archive.org was rejected.

## Q808549 The Baroque Cycle (Neal Stephenson, 3 volumes)
Rows name the volume exactly as at the source (no `part` set).
- EN: three LoveReading extracts (Quicksilver, The Confusion, The System of the World). A 2003 Boing Boing quote (~390 words) was not made a row. Audio (Simon Prebble; none verified): YouTube https://www.youtube.com/watch?v=jAXdqqNMnm0, https://www.youtube.com/watch?v=wRFHg4C2nUw, https://www.youtube.com/watch?v=B8JuFfRWfJo (likely unofficial), https://www.youtube.com/watch?v=fYR8udE9ONw.
- PL: one row (Żywe srebro, vol. 1). Reader checks for vols. 2-3: https://ebookpoint.pl/eksiazki/zamet-neal-stephenson,e_18q5.htm, https://ebookpoint.pl/eksiazki/ustroj-swiata-neal-stephenson,e_1968.htm, Virtualo https://virtualo.pl/ebook/zywe-srebro-i150750/ (.../zamet-i150121/, .../ustroj-swiata-i150672/), Bonito https://bonito.pl/produkt/zamet-tom-1-cykl-barokowy-czesc-druga-2, Woblink https://woblink.com/ksiazka/zywe-srebro-neal-stephenson-112456 and .../ustroj-swiata-neal-stephenson-114931.
- RU: four rows (LitRes international x3 volumes, Yandex Books vol. 1). LitRes readers should be confirmed in a normal browser. Not rows: readli.net/avidreaders.ru listings (likely unlicensed), Yandex Books vol. 3 https://books.yandex.ru/books/xWMQkLB3 (not opened), MyBook https://mybook.ru/author/nil-stivenson/smeshene/read/ (duplicate of LitRes). Audio (Андрей Анучин, ~43 h, paid): "Слушать фрагмент" on https://litres.com/audiobook/nil-stivenson/rtut-71357221/ (smeshene-71758951, sistema-mira-72615118) and https://mybook.ru/author/nil-stivenson/rtut-9/; promo clips would not count.
- ES: nothing verified. Reader check https://extraits.tea-ebook.com/LaesfraLibros/0/18/9788490190180.epub (vol. 3; listing https://www.casadellibro.com.co/libro-el-sistema-del-mundo-volumen-tres-del-ciclo-barroco-libro-3-e-l-sistema-del-mundo/9788466626835/1095300). Google Play Azogue I region-locked.

## Q19346391 Hominids (Robert J. Sawyer, novel)
- EN: two fragment rows from sfwriter.com (chapters 1-2; "Typical Passage"); no legal full text online per https://sfwriter.com/exho.htm. Rejected: a PDF on zfelleg.useribm.hu (saved web page from an eMule folder). Audio lead: http://www.scifiaudio.com/authors/sawyer.html (fetch failed; Sawyer reads from Hominids, check it plays). Google Books previews of ISBN 9781429914635 / 9780765345004 not checked.
- PL: no sample, ebook or audiobook found (Solaris 2007 print only). Reader checks (unlikely): https://www.empik.com/hominidzi-sawyer-robert-j,2919871,ksiazka-p, Legimi, Virtualo, Audioteka, Polona.
- RU: one fragment row (FantLab-hosted Fanzon 2024 PDF, ends mid-sentence on printed p.15, no sample label in the file). Audio: Николай Кобзев 2016 (11 h 50 min, FantLab edition327482, no URL) and Эксмо 2024, Артем Быков (12 h 01 min). Reader checks: https://eksmo.ru/audio/neandertalskiy-parallaks-gominidy-neandertalskiy-parallaks-1-ITDA51750/, https://eksmo.ru/ebook/neandertalskiy-parallaks-gominidy-ITDA52123/, https://www.litres.ru/book/robert-soyer/neandertalskiy-parallaks-gominidy-70769053/, https://www.litres.ru/audiobook/robert-soyer/neandertalskiy-parallaks-gominidy-70936300/. Any sample is a promo clip.
- ES: nothing accepted. Rejected: https://elibros.uclv.edu.cu/download/5725/epub/5725.epub (Homínidos, Ediciones B, tr. Rafael Marín; truncated mid-word in chapter 7, carries an "epubgratis.es" attribution, an unlicensed truncated copy). Lecturalia has no sample.

## Q5706622 Hell Is the Absence of God (Ted Chiang, novelette)
Main already lists EN (Squarespace PDF), ES and RU full texts from PR #47; the rows here add other copies and a RU sample.
- EN: two `external` full rows (CUNY City Tech OpenLab course upload; Internet Archive item `short_story_roulette`, a 4chan /lit/ compilation, weakest provenance, redundant now). Reader check: http://www.yukihime.com/music/hellis/hellistheabsenceofgod.html (robots-blocked, may be unlicensed).
- Audio: best lead of the three batches. PodCastle 40 «Hell Is the Absence of God (Giant Episode)», narrator James Trimarco, https://podcastle.org/2009/02/06/pc040-hell-is-the-absence-of-god-podcastle-giant/ (page showed only the opening text, no player, no rights note; SFFaudio lists it unabridged with poor sound; MP3 http://media.rawvoice.com/podcastle/media.libsyn.com/media/podcastle/PC040_HellIsTheAbsenceOfGod.mp3 not fetchable). Next: reader checks that it plays as a guest, its duration, that start and end are present and any permission note; then submit as `audio`/`external`.
- PL: no row. Story is 7th of 8 in the Solaris/Zysk collection «Historia twojego życia», so free samples (https://woblink.com/product-publication/download/25855/epub, https://woblink.com/product-publication/download/29111/MP3, https://ebookpoint.pl/pobierz-fragment/historia-twojego-zycia-ted-chiang,e_0byy/epub) probably stop before it; Zysk audiobook 2017, 11 h 28 min. Reader confirms where the samples end.
- RU: Readli fragment row (Щекотова, ends «Конец ознакомительного фрагмента»). AST FantLab PDF https://fantlab.ru/edition184500.pdf stops in «Вавилонская башня»; unchecked https://fantlab.ru/edition485652.pdf and https://cdn.ast.ru/v2/ASE000000000831516/read/full (JS). Audio: Кирилл Головин «Ноябрьский фантастический марафон 2018» (item 19; FantLab edition404715, hosting unknown); LitRes audiobook is paid.
- ES: story is 4th of 8, a retailer sample may reach it. Reader opens Casa del Libro «Leer primeras páginas», Amazon.es Kindle sample and Google Play sample of the Alamut edition and says whether the story is present.

# Batch gapsweep-1154 (30 works)

Assigned (all `none` in `data/coverage.csv` when re-fetched around 12:35Z): Q963586 Q46751 Q47598 Q2719299 Q9183865 Q3294967 Q543562 Q29994453 Q3294969 Q3294970 Q2603313 Q610680 Q1132427 Q3089022 Q3233920 Q3226029 Q2502176 Q3142271 Q2291295 Q21558225 Q2363504 Q3205411 Q964451 Q1751584 Q3209610 Q3221363 Q15094120 Q786025 Q2377008 Q17026037.

Method: pages opened with a summarising fetch tool; paginated readers checked at first, last and usually a middle page. The three Solidaridad Obrera PDFs, the two elibros EPUBs and the Fantasy Worlds reader were first recorded as fragments (the tool cuts at ~65-100k characters) and became `full` after the owner's reader replies of 2026-11-07; for those the ending was confirmed by the reader, not by the agent. Reader results: Solidaridad Obrera PDFs (Marte rojo/verde/azul), elibros EPUBs 6841 and 5468, Fantasy Worlds reader and knigavuhe.org audio reported complete; LoveRead pp.75-76 (Q3205411) and p.192 (Q963586) "in order"; LoveRead id 89067 (Q3221363) "in order", read by the agent as "not truncated", an interpretation worth one more look; libcom EPUB https://files.libcom.org/files/Year%20of%20Rice%20and%20Salt%20-%20Kim%20Stanley%20Robinson.epub and Ebookpoint samples e_36dw, e_0zk4, e_07ys: reader found no file (not rows); PRH "Read Sample" (Q543562, Q2603313) and Macmillan excerpts (Q2291295, Q3226029, Q3142271, Q2377008) exist and open, extent not reported (EN fragment rows; the Macmillan audio excerpts are short samples, not audio rows).

## Q963586 The Years of Rice and Salt (Robinson, novel)
- RU «Годы риса и соли» (Эксмо 2020, tr. Е. Шульга): LoveRead full (192 pp.) plus Readli LitRes-sample mirror. EN: Everand preview. PL «Lata ryżu i soli» (Rebis): no ebook sample on Legimi/Woblink/Ebookpoint/Virtualo; next Publio/Empik. ES «Tiempos de arroz y sal» (Timun Mas 2003, tr. Franca Borsani): Planeta page has no sample; next Casa del Libro/Amazon.es «Leer muestra».

## Q46751 Harry Potter and the Goblet of Fire (Rowling, novel)
- RU: LoveRead full (id 2320, ending matches) and Readli sample mirror; libking.ru and royallib copies exist, not opened. EN: BookBrowse chapter-1 excerpt (page 2 not captured); an archive.org bulk-collection PDF ("FantasyFictionebookcollection") was not opened, maintainers decide whether such sources are acceptable. PL «Harry Potter i Czara Ognia» (Media Rodzina, tr. A. Polkowski): no sample rendered on Legimi/Woblink/Virtualo/Empik; reader opens https://www.legimi.pl/ebook-harry-potter-i-czara-ognia-rowling-joanne,b561710.html. ES «Harry Potter y el cáliz de fuego» (Salamandra): no sample; Everand audiobook https://www.everand.com/audiobook/624838713/Harry-Potter-y-el-caliz-de-fuego is paid (lead only) and a robots-blocked Everand podcast series https://www.everand.com/podcast/689675099/ ("Capítulo 1 ... La mansión de los Riddle") is unopened, unknown whether it is a reading.

## Q47598 Harry Potter and the Prisoner of Azkaban (Rowling, novel)
- RU: LoveRead full (id 2319, ending matches). ES: Everand (es) preview (Salamandra, tr. Alicia Dellepiane). EN/PL: no sample opened (BookBrowse search rejected by the proxy); next BookBrowse/Legimi.

## Q2719299 To Say Nothing of the Dog (Willis, novel)
- RU «Не считая собаки»: LoveRead full (id 46798, ends «Placet.»). Lead: Readli sample mirror b=391045 (24 pp.), not opened to the end. ES «Por no mencionar al perro» (Ediciones B/NOVA, tr. Rafael Marín Trechera): two public EPUB downloads on elibros.uclv.edu.cu (ids 6841 fan ePub, 5468 ePub of the Nov. 2007 edition), both reported complete by the owner. PL «Nie licząc psa» (Prószyński): Empik lists paper only. EN: no excerpt opened; Everand audiobook is paid.

## Q9183865 Forever Peace (Haldeman, novel)
- RU: alias fix above. Fantasy Worlds reader https://reader.fantasy-worlds.org/book/16869/read.html as `full` (tool saw only 71.7k characters; owner reports the complete novel). Leads blocked for the tool: royallib.com/book/holdeman_dgo/proekt_yupiter.html, litmir.me b=12106, coollib.net; next: a Flibusta-type copy of «Проект «Юпитер»» (Шестакова) and its ending. EN/PL «Wieczny pokój»/ES «Paz interminable»: no sample found; EN not searched.

## Q3294967 Blue Mars (Robinson, novel)
- RU: LoveRead full «Голубой Марс» (id 61548); the litres.ru exclusion is untouched. PL: naEKRANIE.pl article with the Vesper/Wymiary opening (tr. Ewa Wojtczak, ~900-950 words); Woblink woblink.com/ksiazka/blekitny-mars--373608 not opened. ES: Solidaridad Obrera PDF «Marte azul» as `full` (owner: whole novel); Planeta page https://www.planetadelibros.com/libro-marte-azul/319751 has no excerpt link. EN: Everand series page gave no book URL (earlier fetch failed); next find the book URL and preview.

## Q543562 The Diamond Age (Stephenson, novel)
- RU: LoveRead full «Алмазный век» (id 79954). EN: PRH «Read Sample» https://www.penguinrandomhouse.com/books/172835/the-diamond-age-by-neal-stephenson/#excerpt (owner: opens; modal did not load for the tool; extent unknown). PL «Diamentowy wiek»: Woblink woblink.com/ksiazka/diamentowy-wiek-neal-stephenson-54612 not opened; «Epoka diamentu» (woblink.com/ksiazka/epoka-diamentu-neal-stephenson-135873) is probably another title, check a catalogue first. ES «La era del diamante»: no sample.

## Q29994453 Forgiveness Day (Le Guin, novella)
- RU: «День прощения» is inside «Четыре пути к прощению». Readli LitRes-sample mirror (b=28296, 16 pages) as a fragment starting at page 10; the novella covers about its first half or less. Leads, unopened: royallib.com/book/le_guin_ursula/chetire_puti_k_proshcheniyu.html (blocked), rulit, avidreaders; next find a full copy and verify the story pages. EN: ursulakleguin.com lists a Washington Post "Chapter One" excerpt https://www.washingtonpost.com/wp-srv/style/longterm/books/chap1/four_way.htm, probably from «Betrayals», unopened. PL «Dzień przebaczenia» (in «Cztery drogi przebaczenia»), ES «El día del perdón»: only catalogues. Audio: «Five Ways to Forgiveness» (Recorded Books/Libro.fm) paid.

## Q3294969 Red Mars (Robinson, novel)
- RU: no row (leads: libking.ru/books/sf-/sf-space/1113759-179-kim-robinson-krasnyj-mars.html fetch failed; https://litres.com/book/kim-stenli-robinson/krasnyy-mars-20633976/). EN: Everand preview. PL: naEKRANIE.pl opening excerpt (~2,000-2,500 words). ES: Solidaridad Obrera PDF `full` (owner: complete) and Planeta excerpt PDF (Part One pp.13-34, tr. Manuel Figueroa). Caveat: the Planeta PDF does not contain the line "Mars was empty before we came" that opens the English preview and the Solidaridad PDF; a reader should confirm the excerpt starts at the real opening.

## Q3294970 Green Mars (Robinson, novel)
- RU: LoveRead full «Зеленый Марс» (id 61029). PL: naEKRANIE.pl multi-page excerpt (pages /1, /2, /4, /7 seen; /6 and /8 did not load; passages may not be contiguous). ES: Solidaridad Obrera `full` (owner: complete) and Planeta excerpt PDF (tr. Ana Quijada, ends mid-chapter on p.22). EN not searched.

## Q2603313 Doomsday Book (Willis, novel)
- RU: LoveRead full «Книга Страшного суда» (id 42225). EN: PRH «Read Sample» https://www.penguinrandomhouse.com/books/191580/doomsday-book-by-connie-willis/#excerpt (owner: opens; extent unknown). PL «Księga Sądu Ostatecznego»: probably no ebook. ES «El libro del día del Juicio Final»: no sample.

## Q610680 Last Call (Powers, novel)
- RU: LoveRead full «Последняя ставка» (id 82017). EN: Everand preview (identity rests on page title and premise; Scott Crane not named in the preview). PL «Ostatnia odzywka»/ES «La última partida»: not found.

## Q1132427 Summer of Night (Simmons, novel)
- RU: LoveRead full «Лето ночи» (id 5190). EN: Everand preview (~1.5k words). PL «Letnia noc»: Ebookpoint sample e_0zk4 reader found no file; Woblink woblink.com/ebook/letnia-noc-dan-simmons-139449u shows no sample; Legimi b244499 not opened. ES «Un verano tenebroso»: only the English Everand page. RU audio: LitRes/Yandex Books listings are paid.

## Q3089022 Prentice Alvin (Card, novel)
- RU: LoveRead full «Подмастерье Элвин» (id 15426). ES: Everand (es) preview «Alvin el aprendiz» (Penguin Bolsillo 2015, ~5k words). EN: only a paid Everand audiobook https://www.everand.com/audiobook/903650004/Prentice-Alvin (lead). PL «Uczeń Alvin»: not searched.

## Q3233920 The Mountains of Mourning (Bujold, novella)
- RU: e-reading.club chapters /1/-/3/ of «Границы бесконечности» (tr. Т. Черезова; boundaries checked, page /2/ and boundary page /4/ not opened). LoveRead «Цетаганда» (id 2136) and «Границы бесконечности» (id 2127) do not contain it; lavka.lib.ru/bujold/binf.htm robots-blocked. EN: archive.org lending leads (login, not guest access): https://archive.org/details/bordersofinfinit0000bujo, https://archive.org/details/youngmiles00bujo, https://archive.org/details/hugowinnersvolum0003unse; next check whether Baen offers a sample or free-library text of «Borders of Infinity». PL «Lamentowe Góry»/ES «Las montañas de la aflicción»: no sample. No free audio.

## Q3226029 Red Prophet (Card, novel)
- RU: LoveRead full «Краснокожий Пророк» (id 15425). EN: Macmillan excerpt page https://us.macmillan.com/books/9781429964838/redprophet/ (owner: excerpts open, also audible; extent unknown). PL «Czerwony Prorok»/ES «El profeta rojo»: not found.

## Q2502176 The Uplift War (Brin, novel)
- RU: LoveRead full «Война за Возвышение» (id 2146). EN: Everand preview. PL «Wojna wspomaganych»/ES «La rebelión de los pupilos»: not found.

## Q3142271 Seventh Son (Card, novel)
- RU: LoveRead full «Седьмой сын» (id 15424; final narrative page ~p.73 not read). EN: Everand preview and Macmillan excerpt page https://us.macmillan.com/books/9781429964937/seventhson/ (owner: opens; extent unknown). PL: Ebookpoint e_07ys no file. ES «El séptimo hijo»: not found. Everand audiobooks (https://www.everand.com/audiobook/936676547/Seventh-Son and https://www.everand.com/audiobook/709789479/Seventh-Son) are subscription listings.

## Q2291295 Speaker for the Dead (Card, novel)
- RU: LoveRead full «Голос тех, кого нет» (id 15429, tr. Е. Михайлич). EN: Macmillan excerpt page https://us.macmillan.com/books/9781429963947/speakerforthedead/ (owner: opens; extent unknown). PL: Ebookpoint e_36dw no file. ES «La voz de los muertos»: Casa del Libro ebook page casadellibro.com.co/ebook-la-voz-de-los-muertos-saga-de-ender-2/9788490196380/2461094 exists, sample not checked.

## Q21558225 The Wild Shore (Robinson, novel)
- RU: LoveRead full «Дикий берег» (id 77271). EN/PL «Dziki brzeg»/ES «La playa salvaje»: not found.

## Q2363504 Startide Rising (Brin, novel)
- RU: LoveRead full «Звездный прилив» (id 2032); litres.ru exclusion untouched. EN: Everand preview. PL «Gwiezdny przypływ»/ES «Marea estelar»: catalogue pages only.

## Q3205411 The Sword of the Lictor (Wolfe, novel)
- RU: LoveRead omnibus «Меч и Цитадель» (id 107646), novel 1 = pp.1-76; owner: pp.75-76 in order. PL: Ebookpoint «Miecz i Cytadela» free sample (first chapter of Sword of the Lictor; page names only the omnibus); lead royallib.com/book/Wolfe_Gene/Miecz_Liktora.html (not fetchable). EN/ES «La espada del Lictor»: not searched.

## Q964451 No Enemy But Time (Bishop, novel)
- EN: Baen sample (Prologue and chapters 1-4+; end of sample not located, ___9 errored). RU «Нет врага, кроме времени»: no Russian edition found (title may be a calque). PL «Nie masz wroga prócz czasu»/ES «Solo un enemigo: el tiempo»: not searched.

## Q1751584 Downbelow Station (Cherryh, novel)
- RU: Readli full «Последняя база» (b=10531, 116 pp., «Эта книга завершена»). EN: Everand preview. PL «Stacja Podspodzie»/ES «La estación Downbelow»: catalogues only.

## Q3209610 The Claw of the Conciliator (Wolfe, novel)
- RU: Readli full «Коготь миротворца» (b=50218; page 64 text not visible to the tool). EN: authorwars lists «The Claw of the Conciliator (Excerpt)», unopened. PL «Pazur Łagodziciela»: taniaksiazka ebook pages for the omnibus «Cień i Pazur» https://www.taniaksiazka.pl/ebook-cien-i-pazur-mobi-epub-p-1345182.html unopened. ES not searched.

## Q3221363 Lord Valentine's Castle (Silverberg, novel)
- RU: two `full` rows, Readli (b=274911, 297 pp., only the last page opened) and LoveRead id 89067 (137 pp., see reader result above). EN: Everand preview of the omnibus «The Majipoor Cycle» (not a stand-alone page). PL/ES «El castillo de Lord Valentine»: not found.

## Q15094120 Enemy Mine (Longyear, novella)
- RU: Readli full «Враг мой» (b=87015, 22 pp.; no «Эта книга завершена» marker seen; ~26k-word estimate). LoveRead id 33982 is the author's collection (novella pp.24-44), not opened there. EN: reader-supplied PDF of Asimov's SF, Sept 1979 https://archive.org/download/Asimovs_v03n09_1979-09/Asimovs_v03n09_1979-09.pdf (redirects to dn790000.ca.archive.org); the tool read ~112k characters, the contents list shows «Enemy Mine» on p.120, but the story text was not confirmed. Open: confirm it is complete there and add an `external` `full` EN row. PL «Mój własny wróg»/ES «Enemigo mío»: not found.

## Q786025 The Fountains of Paradise (Clarke, novel)
- RU text: inside LoveRead «Весь Кларк. Фонтаны рая» pp.74-142 (id 28707; novel's last sentence not checked); lead royallib.com/book/klark_artur/fontani_raya.html. RU audio: knigavuhe.org (Лора Ерёмина, 11:24:37, ten track groups summing ~11:19), owner reports the complete recording; the agent did not play it; permission unverified. EN: Everand preview. ES: Issuu Océano page showed only the blurb, not used. PL «Fontanny raju»: not found.

## Q2377008 Man Plus (Pohl, novel)
- RU: Readli full «Человек Плюс» (b=93426, 54 pp.). EN: Macmillan excerpt page https://us.macmillan.com/books/9780765321787/manplus/ (owner: opens; extent unknown). PL «Człowiek plus»/ES «Homo plus»: not found.

## Q17026037 A Song for Lya (Martin, novella)
- RU: LoveRead collection «Хроники тысячи миров» pp.11-30 (id 31160, tr. Н. Магнат); lead not added: Readli 3-page sample b=275379. EN: archive.org leads (Dreamsongs I https://archive.org/details/dreamsongsi0000mart is print-disabled only; Hugo Winners vol. 3 book 2 is borrowable with login). PL «Pieśń dla Lyanny»/ES «Una canción para Lya»: not found. «Dreamsongs» audiobook is paid.

# Batch gapsweep-1256 (30 works)

Assigned: Q4182240 Q467720 Q16386319 Q2491758 Q2502043 Q2008211 Q966751 Q2441281 Q3227984 Q3367176 Q3082606 Q1659714 Q492207 Q3209683 Q945382 Q2350387 Q18003141 Q2269230 Q3231338 Q3400801 Q1026792 Q471679 Q729783 Q17182684 Q2240456 Q2300209 Q2301398 Q1748402 Q3769828 Q3818994. Chosen by the brief's ranking (most known PL/RU/ES titles first, then latest year). Audio was not searched systematically. Pages were opened at their first and last reader pages; for PDFs/ebooks the tool exposed only the beginning, so those are `fragment` rows with a reader-check lead. Mostly only the Russian lookup was run; "not searched" below means exactly that.

## Q4182240 The Day Before the Revolution (Le Guin, short story)
- Titles: PL «Dzień przed rewolucją»; RU «За день до революции» (FantLab work2037, tr. И. Тогоева, collection «Двенадцать румбов ветра», 1998 ed.); ES «El día antes de la revolución».
- EN: two `external` full rows (The Anarchist Library; libcom.org; start and end both present; no copyright statement; libcom text shows OCR-type errors).
- RU: Readli ~1,100-word sample only. Readli collection «Роза ветров (Рассказы)» https://readli.net/miryi-ursulyi-le-guin-tom-12-roza-vetrov-rasskazyi/ ('Полный текст') exists but its reader (b=944365) did not load; retry it and LoveRead.
- ES: collection PDF «Las doce moradas del viento» (tr. María Elena Rius) lists the story as the last entry of vol. II; the tool did not reach it (fragment row, collection-level lead). PL: queries found nothing usable; find the Polish collection. Audio not searched.

## Q467720 The Dispossessed (Le Guin, novel)
- Titles: PL «Wydziedziczeni» (Ekumena t.6); RU «Обделённые»; ES «Los desposeídos».
- RU: e-reading.club full (13 chapters, tr. Наталья Ачеркан; chapters 2-12 not read) plus a 23-page Readli sample; the litres.ru exclusion is untouched.
- ES: archive.org item https://archive.org/details/LosDesposeidos and the Solidaridad Obrera PDF are fragment rows (opened only at the start, probably whole). Metabiblioteca PDF `full` row: owner reports a good PDF of the whole book (the agent could not open it, bot check). Also an EPUB https://www.solidaridadobrera.org/ateneo_nacho/libros/Ursula%20K.%20Le%20Guin%20-%20Los%20desposeidos.epub. An MP3 on the same site has a synthetic (TTS) voice per the owner: not submitted as audio.
- PL: shop pages only; the Ebookpoint sample for the omnibus «Sześć światów Hain» is Rocannon's World. EN: no preview URL found. Next: PL sample via Legimi/Woblink/Virtualo; EN Everand preview.

## Q16386319 Inconstant Moon (Niven, short story)
- RU: Readli full (7 pp., «Изменчивая луна», tr. В. Портянникова, anthology «Фата-Моргана 4», 1992); title correction above. EN/PL/ES: only catalogues and a paid Audible/Hoopla audiobook; Marathon of SF 2019 audiobook (FantLab edition404719) not opened. Next: look for EN text in free magazine/archive scans.

## Q2491758 A Time of Changes (Silverberg, novel)
- RU: Readli omnibus «Время перемен (сборник)» pp.1-51 hold the novel (boundary at p.51, then «Прыгуны во времени»; 147 pp. total). Reader check https://readli.net/chitat-online/?b=127940&pg=51 (Kinnall's closing line «Идите и будете исцелены.» and the next heading). PL/ES/EN/audio not searched.

## Q2502043 To Your Scattered Bodies Go (Farmer, novel)
- RU: Readli full (58 pp., tr. М. Ахманов, «Эта книга завершена»). PL «Gdzie wasze ciała porzucone»/ES «A vuestros cuerpos dispersos»/EN/audio: not searched.

## Q2008211 The Left Hand of Darkness (Le Guin, novel)
- RU: Readli sample only (12 pp., LitRes); full text not found (litmir/royallib/libking not checked for this title). ES: archive.org PDF of the Minotauro/Abelenda translation opened only at the start (fragment row). Not opened: archive.org items `NeoNostromo7LaManoIzquierdaDeLaOscuridadYLasCosasQuePerdimosEnElFuego` and the lending scan `lamanoizquierdad0000ursu`. PL: the Ebookpoint omnibus sample is Rocannon's World only. Next: PL Legimi/Woblink sample of «Lewa ręka ciemności».

## Q966751 The Beast that Shouted Love at the Heart of the World (Ellison, short story)
- RU: Readli full (4 pp., tr. В. Гольдич, И. Оганесова); second Readli entry https://readli.net/zver-v-serdtse-mira-o-lyubvi-krichashhiy/ not opened. Others not searched.

## Q2441281 The Einstein Intersection (Delany, novel)
- RU: Readli full (27 pp., no completion marker on the last page). The separate Readli entry «Вавилон-17. Пересечение Эйнштейна» is a fragment, not used. Others not searched.

## Q3227984 The Wanderer (Leiber, novel)
- RU: Readli full (88 pp., tr. Н. Блинов). Others not searched.

## Q3367176 No Truce with Kings (Anderson, short story)
- RU: Readli full (12 pp.); identity rests on the Russian title, author and story details (the page has no English title). EN F&SF June 1963 scan, PL, ES not searched.

## Q3082606 Hothouse (Aldiss)
- Coverage lists a short story (the 1961-62 Hugo series). The only text found, Readli «Долгие сумерки земли [Теплица]» (47 pp.), is the later single-volume novel; no row (see "Not included"). A maintainer decides whether the novel version counts for this QID. PL «Cieplarnia», ES «Invernáculo»: not searched.

## Q1659714 A Canticle for Leibowitz (Miller, novel)
- RU: Readli full (78 pp.); a second Readli entry https://readli.net/strasti-po-leybovitsu/ not opened. PL: Ebookpoint sample (~5k words). Seen, not opened: Woblink/Legimi/Empik ebook and a paid Woblink audiobook https://woblink.com/audiobook/kantyczka-dla-leibowitza-walter-m-miller-457422. Portuguese archive.org lending items are PT, not used. ES/EN not searched.

## Q492207 Starship Troopers (Heinlein, novel)
- RU: Readli sample (46 pp., LitRes); full text on LoveRead/e-reading not yet looked for. PL: Ebookpoint sample under «Żołnierze kosmosu» (title correction above). ES «Las Brigadas del Espacio»: archive.org search found only films. EN not searched.

## Q3209683 The Big Time (Leiber, novel)
- RU: Readli full (44 pp.); another entry «Большое время [= Необъятное время]» https://readli.net/bolshoe-vremya-neobyatnoe-vremya/ (30 pp.) not opened. EN: Gutenberg may carry the Galaxy serial (gutenberg.org blocks the tool). Others not searched.

## Q945382 Double Star (Heinlein, novel)
- RU: Readli full (55 pp., tr. В. Ковалевский, Н. Штутцер). ES: archive.org Cenit CFC-47 scan https://archive.org/details/Ciencia_ficcion_Cenit_-_47_de_72 (OCR text 367 KB, opened only at the start; fragment row). EN/PL «Dubler» not searched.

## Q2350387 The Demolished Man (Bester, novel)
- RU: Readli full (54 pp.); second entry https://readli.net/chelovek-bez-litsa-sb-il-i-melnikova/ (53 pp.) not opened. ES: archive.org `elhombredemolido0000best` is a lending scan, not opened. Others not searched.

## Q18003141 Ancillary Mercy (Leckie, novel)
- RU: Readli full (72 pp. including acknowledgments; the last narrative page was not located). PL: no published translation known. ES «Misericordia auxiliar», EN: not searched.

## Q2269230 Among Others (Walton, novel)
- No row. PL «Wśród obcych» and ES «Entre extraños» found only as shop pages (Empik, lubimyczytac, Casa del Libro); no RU translation known. EN excerpt (Macmillan/Tor) not located in two searches. Next: PL Woblink/Legimi sample; ES Planeta/Gigamesh sample PDF.

## Q3231338 The Hundred Thousand Kingdoms (Jemisin, novel)
- RU: Readli reader copy (83 pp.) is truncated before the ending (owner-confirmed): fragment row. The fb2 download https://readli.net/download.php?id=178056 on the same book page is the complete book (owner-confirmed; the agent could not open it): `full` row. Readli also has a 17-page sample https://readli.net/sto-tyisyach-korolevstv-2/. PL «Sto Tysięcy Królestw», EN: not searched; no ES title known.

## Q3400801 Powers (Le Guin, novel)
- RU «Прозрение»: Readli sample only (19 pp.). Next: RU full on LoveRead/e-reading. PL «Moce» not searched.

## Q1026792 Two Hearts (Beagle, novelette)
- RU: Readli full (14 pp., tr. Владимир Гришечкин). Main already has an RU full copy (booksonline.com.ua) and EN copies from PR #47; this is an additional RU copy. PL «Dwa serca» not searched.

## Q471679 Rainbows End (Vinge, novel)
- RU: Readli sample (25 pp., LitRes; only the last page opened, the page does not name the author, so identity rests on the title, the Hugo tag and character names); a second entry https://readli.net/konets-radug/ (19 pp.) not opened. ES «Al final del arco iris»: nothing relevant on archive.org. Next: RU full on LoveRead/e-reading.

## Q729783 Seeker (McDevitt, novel)
- RU: LoveRead full «Искатель» (102 pp.; no translator credited) and a Readli sample (16 pp., tr. К. Плешков; reader pages not opened, https://readli.net/iskatel-4/). PL «Poszukiwacz» not searched.

## Q17182684 Magic for Beginners (Link, novella)
- No row. kellylink.net/books/magic-for-beginners-old links an archived SFSite copy of the title story http://web.archive.org/web/20060111060529/http://www.sfsite.com/fsf/fiction/kl01.htm (web.archive.org blocked for the tool). Next: reader checks whether it is the complete story (it would need `archive=yes`). PL «Magia dla początkujących», ES «Magia para principiantes»: not found.

## Q2240456 Camouflage (Haldeman, novel)
- No row. RU: FantLab work15936 lists only a 2019 samizdat «Камуфляж», no online text. PL «Kamuflaż»: catalogues only. ES «Camuflaje»: Lecturalia synopsis only. Next: PL sample; ES Planeta; EN Analog Mar-May 2004 scans.

## Q2300209 Accelerando (Stross, novel)
- RU: Readli full under «Акселерандо» (115 pp., ends with the marker «КОНЕЦ: июнь 1999 - апрель 2004»); a Readli fragment entry https://readli.net/achchelerando/ (29 pp.) not opened. EN (antipope.org official text) and ES: not searched.

## Q2301398 Spin (Wilson, novel)
- RU: Readli sample (20 pp., LitRes; only the last page opened). Next: RU full; EN preview; ES.

## Q1748402 Iron Council (Miéville, novel)
- RU: Readli sample (24 pp., LitRes; only the last page opened; contains an explicit scene, 18+). Two further Readli «другой перевод» entries not opened. PL «Żelazna Rada» not searched.

## Q3769828 The Concrete Jungle (Stross, novella)
- No row. EN: catalogues and reviews only (the novella is in The Atrocity Archives). PL «Betonowa dżungla» and ES «La jungla de cemento» not found; the Solidaridad Obrera SF index lists other Stross titles but not this one.

## Q3818994 The Green Leopard Plague (Williams, novella)
- No row. EN: Walter Jon Williams's blog post "even more available" (walterjonwilliams.net, 2008-07) and Boing Boing (2008-07-01) say Night Shade Books posted the full text; neither page gives a URL and the file may be gone. RU: FantLab work24180 appeared, not opened. Next: locate the Night Shade/WJW file (Wayback), Asimov's Oct-Nov 2003 scans; PL «Zaraza zielonych lampartów», ES «La plaga del leopardo verde» not found.

# Not included (rejected or withheld)

Rows left out of the CSV:
- Q5706622 EN, Squarespace PDF `https://static1.squarespace.com/static/50e08e65e4b0c2f4976972df/t/588a2e70725e25b6981e64d1/1485450864394/Chiang%2BHell%2BIs%2Bthe%2BAbsence%2Bof%2BGod.pdf`: already on `main` (PR #47) for the same work, language and format.
- Q3082606 RU, Readli https://readli.net/chitat-online/?b=35289&pg=1 «Долгие сумерки земли [Теплица]» (47 pp., ends with Gren going into the jungle): the catalog form is `short story` (the Hugo 1962 series), the text is the later single-volume novel, so the row fails the form check and its identity is doubtful. The URL was not edited to fit; a maintainer decides whether the novel version should count and how it should be recorded.

Leads rejected by the search agents (never made rows):
- https://annleckie.com/ancillary-sword-chapter-1/ (also -2, -3): author asks that the pre-order link be kept confidential.
- penguinlibros.com fragment pages for El portal de los obeliscos (unrelated prose); zfelleg.useribm.hu Hominids PDF (saved eMule page); https://elibros.uclv.edu.cu/download/5725/epub/5725.epub (truncated unlicensed Homínidos); Scribd Espada auxiliar copy (fetch failed, unlicensed).
- Readli «Бесконечный мир» b=110859 and libking «Бесконечный мир» (a Star Trek tie-in), rulit «Мост к разуму» (Mindbridge).
- libcom EPUB for Q963586 and Ebookpoint samples e_36dw (Q2291295), e_0zk4 (Q1132427), e_07ys (Q3142271): the owner found no files.
- Synthetic-voice MP3 of Los desposeídos (TTS, not human audio); Macmillan/PRH audio excerpts (short samples); the 98-minute book-club podcast on archive.org.
- Borrowable archive.org scans (`...0000...` identifiers) and Readli entries labelled as samples where a full copy exists; the Readli «Роза ветров» reader (did not load).

# Pending human check

Reader checks still open, with exact URLs (more per-work leads are in the sections above):
1. Completeness of recorded ES fragments (open the last pages, confirm the whole novel): https://www.solidaridadobrera.org/ateneo_nacho/libros/Ursula%20K.%20Le%20Guin%20-%20Los%20desposeidos.pdf ; https://archive.org/details/LosDesposeidos ; https://archive.org/download/LaManoIzquierdaDeLaOscuridad/la%20mano%20izquierda%20de%20la%20oscuridad.pdf ; https://archive.org/details/Ciencia_ficcion_Cenit_-_47_de_72 . Find «El día antes de la revolución» (last entry of vol. II) in https://www.solidaridadobrera.org/ateneo_nacho/libros/Ursula%20K%20Le%20Guin%20-%20Las%20doce%20moradas%20del%20viento.pdf .
2. http://web.archive.org/web/20060111060529/http://www.sfsite.com/fsf/fiction/kl01.htm : Q17182684 EN, is it the complete «Magic for Beginners» story?
3. https://readli.net/chitat-online/?b=127940&pg=51 : Q2491758, where A Time of Changes ends. Readli sample pages where only the last page was opened (page 1 / identity): b=390003 (Spin), b=197648 (Iron Council), b=1039595 (Rainbows End, check that it is Vinge).
4. Audio: PodCastle 40 for Q5706622 (guest playback, duration, start/end) and the Spanish Ancillary Sword sample (Q17989172); other audio leads are in the 1009 sections.
5. https://archive.org/download/Asimovs_v03n09_1979-09/Asimovs_v03n09_1979-09.pdf : Q15094120, is «Enemy Mine» complete from p.120? If so add an EN `full` row.
6. https://loveread.ec/read_book.php?id=89067&p=137 : Q3221363, confirm the ending is present (the owner's "in order" was read as "not truncated"). https://proassetspdlcom.cdnstatics2.com/usuaris/libros_contenido/arxius/45/44419_Marte_Rojo.pdf : Q3294969 ES, does the excerpt start at the book's opening?
7. Q603645: PL Ebookpoint sample (chapters rendered in reverse order), EN LitRes reader (renders in a normal browser?), RU Readli mirror (maintainer decision on third-party mirror of the LitRes sample). Q808549 RU LitRes readers: confirm they render in a normal browser.
8. Maintainer decisions: the `external` full rows are community-library copies of in-copyright works (permission unverified); Q5706622 EN 4chan /lit/ compilation PDF is the weakest provenance and now redundant with the Squarespace copy on `main`.
