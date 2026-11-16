# Google Books retry for the prior English batch

The Google Books API key was supplied at runtime and authenticated requests succeeded. Thirteen English works from the earlier continuation run were checked by title and author against Google Books; each query inspected up to 40 results per title/author variant. Three returned partial-preview candidates. No result is a claim that other sources do not exist.

- **Q97968393 · As the Last I May Know** — the Google Books guest preview identifies S. L. Huang and displayed story prose about Nyma and Tej. It is a limited preview of the Tor Books edition, not a full-text claim. Reactor already hosts the complete story.
- **Q61054553 · The Martian Obelisk** — the Google Books guest preview identifies Linda Nagata and displayed story prose about Susannah and the crisis on Earth. It is a limited preview of the Tor Books edition, not a full-text claim. Reactor already hosts the complete story.
- **Q30005036 · Seasons of Glass and Iron** — Google Books identified a partial preview at https://books.google.com/books?id=bCFYEQAAQBAJ, Tordotcom 2026. Google presented an unusual-traffic verification screen before the preview could be inspected. The presence of story prose remains unverified; retain as a lead only.

The remaining ten works produced no matching preview candidate within the scoped Google Books queries: Q133843405, Q131314620, Q111913901, Q131308104, Q69991268, Q65062497, Q56215021, Q29956215, Q36452349 and Q30002253. These are provider-specific search outcomes, not claims that the works are unavailable. Preview access may vary by location.

The standard continuation command excludes fragment searches when a full text is already recorded; this batch therefore queried the same Google provider explicitly for the 13 prior QIDs. The standard command also completed one eligible Google check successfully. The previous batch identified 37 non-English tasks needing verified translated titles; this retry did not resolve them.
