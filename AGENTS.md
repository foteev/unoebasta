# Reader-delegated contribution tasks

When the request contains an assigned-QID contribution task, follow [docs/search-brief.md](docs/search-brief.md). Deliver only one new findings CSV and an optional matching note, or notes only. Do not run the maintainer import/publication workflow (`npm run import:pending`) or modify code, coverage, the research registry or these instructions. The model is chosen by the reader.

# Catalog research

When asked to **continue search**, follow [docs/continue-search.md](docs/continue-search.md) and the verification rules in [docs/search-brief.md](docs/search-brief.md).

Carry the requested batch through discovery, targeted source checks, review, durable notes, CSV import, validation and publication within the user's authorized scope. Do not stop after planning, a smoke test or generating unreviewed candidates. Routine source and implementation choices do not require another confirmation. Keep uncertain results as annotated leads and report material blockers accurately.

The automatic runner does not perform human verification. Measure useful outcomes by verified new links, resolved title/author identities and specific publication leads; request counts alone do not demonstrate success.

# Multilingual audio research

When asked to **search audio**, **ищи аудио** or continue the audio agent, follow [docs/audio-search.md](docs/audio-search.md). The user requested GPT Luna for first-pass discovery. Use `gpt-6-luna` when that model is available for delegation; the parent reviews identities and source evidence before publication. Prepare and carry a bounded batch through durable records, reviewed import, tests and deployment. If the model is unavailable, state that fact rather than silently claiming Luna ran.
