# Readers’ data: storage, versions, moving between devices

Everything personal lives in the reader’s browser. There is no server. This file is the contract every change must keep.

## Storage

- **IndexedDB** database `fantastic` (the old internal name stays so nobody loses data), layout version `IDB_VERSION = 4`. Stores, all with `keyPath: 'id'`:
  - `files`: the reader’s own books (parsed HTML in `html`). Never leaves the device.
  - `positions`: where the reader stopped. `file:<id>` for own files, `ext:<QID>` for a story opened on a magazine site.
  - `bookmarks`: `type` is `work` (starred), `done` (finished), `pos` (bookmark in a text), `recall` (one line of reading history, with an optional note), `about` (a cached description).
  - `links`: the reader’s own links to a work.
  - `suggestions`: reports the reader wrote; stay on the device.
  - `tombs`: deletion marks, `{ id: '<store>|<key>', s, key, mt }`.
  - `meta`: the schema number and backups made before a migration.
- **localStorage** `fantastic-prefs`: settings.

## Versions of the data

`SCHEMA` is the shape of the records (now 4). A new version of the page brings steps `MIGRATIONS[n]` (n−1 → n): pure functions over a plain copy `{ files, positions, links, suggestions, bookmarks, tombs, prefs }`.

On start, `ensureSchema()`:
1. data older than the page: keep a backup (the two latest, without file bodies), run the steps in order, write everything back in one transaction;
2. a step fails: put everything back as it was, switch to read-only and say so;
3. data newer than the page: read-only, ask to reload.

Export files carry `{ app: 'unoebasta', v: SCHEMA }` and go through the same steps on import.

**Rules for a new step:**
- only add fields; never drop or rename one without a step;
- never touch `files[].html`;
- every step gets a fixture and checks in `test/ui.test.js`;
- never change the page address after release: a new address means an empty storage (readers move with the transfer link).

Steps so far: **2→3** every record gets `at` and a book label `book: { title, by }` (to find the work again by title and author if its ID changes). **3→4** deletion marks (`tombs`) and `mt`, the time a record last changed.

## Moving between devices

**One merge for every channel** (`syncMerge`): for each record the one with the newer `mt` wins, and a deletion mark is a record too. `Store.put` sets `mt` on every local write; a record that comes from another device keeps its own `mt` (`Store.put(s, rec, true)`). `Store.del` leaves a deletion mark.

My shelf panels are collapsed initially and retain their open state during a page visit. Item lists offer individual deletion and Delete all. Bulk file removal and clearing all saved items ask first. Section deletion uses `Store.del`, includes related positions and notes when removing a file, and preserves preferences.

**Delete everything** is a permanent reset on this device. It deletes the IndexedDB database, including migration backups and deletion marks, and removes the app’s preferences, visit history and sync key from localStorage. Once deletion succeeds, the page reloads into a fresh profile. The initial reading language mode includes every catalog language. The action does not send a deletion to other devices or relays. If an open connection blocks database deletion, the page asks the reader to close the other tab. A database deletion error leaves local settings in place and is reported on the shelf. Section deletions can still be undone.

Each saved-item list groups bulk deletion in a red bordered area with its item count. The global Danger zone is always visible at the bottom of My shelf, outside the collapsed panels. Interface language changes update labels and known work titles; readers' comments, notes and file contents remain in their original language.

Language settings live in one place: the language button in the header (it shows the site language, e.g. `RU ▾`). It opens a short menu with **Site language** and **I read in**. **I read in** has two states: **All** (no `prefs.langs`, every catalog language) or the languages chosen (`prefs.langs`). A tap applies at once and schedules settings sync. The first language tapped while All is on becomes the only one, further taps add or remove languages, and taking off the last one brings All back. An empty `langs` array from older pages (the former automatic mode) is read as All. My shelf has no languages section.

The theme button in the header (and **Aa** in the reader) opens the theme menu: **As in the system** (no `prefs.theme`), **Light**, **Dark**, **Classic** (a yellowed book page) and **Fantasy** (dark red and gold). A tap applies at once; the reader follows the site's theme. The theme stays on this device and does not travel.

While the reader has not chosen languages, a work card whose sources span more than one language asks once **Which languages do you read?** (the site language preselected). **Done** stores the choice in `prefs.langs`; **Not now** keeps All. Either sets `prefs.langsAsked`, so the question is not asked again.

**What travels:** `positions`, `bookmarks` (without cached `about` descriptions), `links`, deletion marks from the last 400 days, and the settings `listen`, `ttsRate`, `askNote`, `pickLengths`, `langs`, `langsAsked`, `focus` (with their own time `prefsMt`). A newer settings record without `langs` means All on the receiving device too. Interface language, theme and font size stay per device. `pickLen` remains readable for cached older pages; current pages use the additive `pickLengths` array (empty means all durations). Book titles and authors do not travel: the catalog rebuilds them.

**Own files** never travel. A place in one travels by a fingerprint of the text (`ff:<hash>`) and lands when the same file is on the other device.

**The transfer link** (My shelf → Data on this device → Link for another device):
- the pack is deflated (`CompressionStream('deflate-raw')`, `z…`) or plain (`j…`), base64url, after `#move=`; browsers never send that part to a server;
- a QR code is drawn when the link fits 1,400 characters; a larger shelf gets a code with the essentials and the full link;
- opening the link asks first, removes it from the address bar, then merges.

## Sync through Nostr relays

- **The key.** "Turn on sync" makes 32 random bytes (localStorage `fantastic-sync`, never exported). "Connect another device" shows them as `#sync=<base64url>` in a link and a QR code; the other device opens it and asks first.
- **From the key:** a Nostr secret key `sha256(key ‖ "unoebasta/nostr-key")` and a label `d = hex(sha256(key ‖ "unoebasta/label"))[0..24]`. Same key → same identity on every device; nobody can tie the label to a person.
- **The event.** `syncPack()` → deflate → base64url → NIP-44 encrypted to itself → kind 30078 (NIP-78), tag `d`, published to six relays run by different people (`RELAYS` in `src/index.html`). Replaceable: each relay keeps only the newest. Kept under ~40 KB; a bigger shelf drops old history first (`slimPack`).
- **When.** Pull + merge when the page opens and when you come back to it (at most every 30 s); push 4 s after a local change and when the page is hidden; "Sync now" on the shelf. A push happens only when the content changed (`h` = hash of the pack).
- **Library.** nostr-tools 2.25.2 from jsDelivr, loaded only when sync is on.
- **Safety.** Relays see ciphertext, the author key (random), the label and times. The main copy stays in the browser: a relay that forgets the event only delays the next sync. Losing every device and the key link loses the copy on the relays too.
- **Checked** in tests with an in-memory relay, and against the real relays from a browser: all six accept and return a ~40 KB kind-30078 event and keep only the newest.

Catalog and Awards filters use `prefs.filters` version 1, with arrays for each group. Every group starts at All (an empty array); choices within a group are OR, groups are AND. These browsing filters stay per device and do not change the saved reading languages. Legacy scalar filter restrictions reset to All on upgrade; saved view modes, author sorting and personal shelf data are preserved.
