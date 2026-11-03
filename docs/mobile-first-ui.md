
# Mobile-first UI

The phone is the main screen. Every element is designed, built and checked at 360–390 px wide first; wider layouts are enhancements added with `min-width` media queries. If an element only works on desktop, it is not done.

## 1. Before building an element

Answer three questions and design the phone layout from the answers:
1. What is the one thing the person does here (read, pick, compare, jump)? That action gets the biggest, lowest, easiest target.
2. How many dimensions does the data have? A phone shows one dimension at a time. Two dimensions (years × categories) means: pick one with a control, list the other.
3. How long is the longest real value (Russian and Polish strings are 20–40 % longer than English; titles run to 60+ characters)? Design for that, not for the sample.

## 2. Layout rules

- Single column on phones. Side gutter `max(16px, env(safe-area-inset-left))`; nothing may make the page scroll sideways.
- **No multi-column data tables on phones.** A table with more than 3 columns becomes:
  - a **list of rows** (one row = one record: primary line, secondary meta line, trailing marks), or
  - a **picker + list**: chips/segmented control chooses one dimension (category, award), the list shows the other (years).
  Full tables are allowed only as an extra view from ~900 px up, and even there never with a sticky column over horizontally scrolled cells.
- Horizontal scrolling is allowed only for a single row of chips (a "chip scroller"), never for content people must read.
- At most one sticky bar at the top (plus the safe-area band). Do not combine sticky headers with horizontal scroll.
- Long lists (100+ rows) get a jump aid: decade/letter chips that scroll to a section, and `content-visibility: auto` on sections.

## 3. Touch and controls

- Every tappable thing is at least **44×44 px** (min-height 44 px; Material recommends 48 dp), with ≥ 8 px between neighbours.
- One row = one tap target. Do not put several small links inside a list row; secondary actions go to the detail screen.
- Nothing depends on hover or `title` tooltips; all information is visible or one tap away.
- Primary navigation on phones is a **bottom bar** (3–5 items, icon + short label, safe-area padding at the bottom). Top tabs that overflow or get clipped are a bug.
- Filters: at most one visible row (a chip scroller). Rarely used options go behind a "Filters"/"More" control or into the detail view.
- Toggles that have two states are one button that shows the current state ("↓ Newest"), not two side-by-side buttons that wrap.
- Text inputs: `font-size: 16px` or larger (smaller makes iOS zoom), correct `type`/`inputmode`, full width.

## 4. Type and content

- Body text ≥ 16 px; secondary text ≥ 13 px; nothing below 12 px.
- Titles in rows clamp to 2 lines; meta lines to 1 line with ellipsis; never clip text without a way to see it in full (the detail view).
- Labels are short. Legends and explanations go below the content or behind an info control, not above it.

## 5. Reading and media screens

- Controls for the current task sit within thumb reach (bottom bar or floating button), not only in the top bar.
- Long-running or background tasks (audio, TTS) need lock-screen/media controls and must survive the screen turning off.
- Save state (position, drafts) on pause/visibility change, not only on explicit close.

## 6. Checklist before shipping any element

Check each item at 360 × 740 and 390 × 844, in light and dark theme:
- [ ] No horizontal page scroll; no clipped tabs, headers or buttons.
- [ ] Every target ≥ 44 px; the main action is reachable with one thumb.
- [ ] Longest real RU/PL strings fit (wrap or clamp, never overlap).
- [ ] Tables replaced by lists or picker + list on phones.
- [ ] Inputs ≥ 16 px; keyboard does not cover the field being typed in.
- [ ] Works with system font size at 130 % and in landscape.
- [ ] Look at a real screenshot at phone width before publishing (for claude.ai artifacts: the `artifact-emulator` skill, phone viewport; otherwise Playwright at 390 px). A layout change that has not been seen at phone width is not finished.

## 7. Project patterns (unoebasta)

- Award structure (years × categories): phone = award segmented control + category chip scroller + list of years (year | title, author | marks) with decade jump chips. Wide screens add the full board as an extra view. All awards is available in Board, By year and By category. Combined views merge a work only within the same year and category, retaining all award names and Locus novel subcategories. Switching to a phone layout must not erase the selected desktop Board view or award scope.
- Author awards: list rows "2024 · Hugo · Novelette" + title, sortable by year with one toggle; counters per award as large tappable tiles.
- Navigation: bottom bar Read · Awards · Shelf · About on phones; top tabs from 720 px.
