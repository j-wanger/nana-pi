Feature: FEAT-003 · Index and connect existing knowledge sources

Class: install, hook or gate (hook). Both seats' knowledge hooks run `nana-knowledge hook`. Past one hour a pull starts a detached `nana-knowledge build`, and that build is the code this lane changes. Full ladder: the roster's final reviewer, the land reviewer (or seat-land.md when the roster prints `land: seat`), the seat's wrong-code pairs and one independent check. The seat runs install-check on macOS before the land.

Threat model: honest damage is in scope: random or zeroed bytes, a truncated file (an interrupted copy, a restore, a sync tool), whole pages overwritten anywhere in the file, and docs or files tables of another shape (an older or newer schema, or another SQLite file in its place). Honest concurrency is in scope: a pull reading, another connection writing, another build holding the build lock. A crafted SQLite file and damage inside one record's bytes are out.

Behaviour: a build over a damaged index.db replaces it with one rebuilt from the sources, including the build a pull starts in the background. A write-locked index, or one under another build's lock, is never deleted. build and status each name the damage in one line, never a stack.

Design (prototyped on a temp copy of 72abe19a: 7/7 PASS; incremental-build 30/30, unreadable-root 7/7, discovery 37/37, hook 98/98, extension 38/38):
- lib/db.ts:
  - `DAMAGE_CODES` holds the SQLite primary codes 1 ERROR (a table of another shape), 11 CORRUPT and 26 NOTADB, with provenance "contract: R-2400, R-2401".
  - Add `IndexDamageError`.
  - `indexDamage(err)` returns the message for an IndexDamageError. It also returns it when `code === "ERR_SQLITE_ERROR"` and `(errcode & 0xff)` is in DAMAGE_CODES. Otherwise it returns null. The codes 5, 6, 8, 10, 13 and 14 never count.
  - `checkIndex(db)` runs `PRAGMA quick_check(1)`. On any result but "ok" it throws IndexDamageError("database disk image is malformed: <first finding on one line, without its `*** in database main ***` header>"). A page it cannot read throws SQLite's own code 11.
  - On the create path, openDb closes its handle before rethrowing.
- lib/build.ts:
  - buildLocked runs checkIndex right after openDb unless it is rebuilding.
  - It closes its handle in a finally on every exit. Close rolls back an open transaction, and on Windows an open handle blocks the delete.
  - Inside the lock, build() catches once. On damage, when the build was not already a rebuild, it runs `buildLocked({ rebuild: true })` and sets `stats.recovered`. Any other error, or a second failure, propagates.
  - Nothing is checked or deleted before acquireBuildLock.
- bin/nana-knowledge.ts:
  - cmdBuild prints `  index was damaged (<reason>) — rebuilt from the sources` once, before the root lines.
  - A recovered build uses the rebuild wording for MISSING and UNREADABLE roots.
  - cmdStatus wraps the open, checkIndex and the counts. On damage it prints `index <db> is damaged (<reason>) — repair: nana-knowledge build --rebuild` and returns 0 (R-216). Any other error behaves as today.
- lib/hook.ts is unchanged.
- README: add a paragraph after `--rebuild`, one sentence in the fail-open bullet, and the check's measured cost.

Why the quick check: the incremental build reads only the files table. So a page overwritten in the docs table or the FTS data, which is most of the file, passes today's build and a plain catch-and-retry alike. Probe on a 25 MB index: whole pages were overwritten at 10–99% of the file. The no-op build resolved every time and moved the index mtime. At 90–99%, 1 to 5 of 20 pulls failed, and quick_check flagged every case. Cost, measured 2026-10-20: a no-op build went from 14–20 ms to 42–46 ms at 25 MB, and the check alone took 85 ms at 50 MB.

| Row | Requirement (EARS) | Test: packages/nana-knowledge/tests/recover.test.mjs:: | Red today (probe on 72abe19a) |
|---|---|---|---|
| R-2400 | IF index.db is not a SQLite database, is truncated, or has a whole page overwritten, THEN the knowledge build shall replace it with an index rebuilt from the sources. | R-2400: a build over a random-bytes, a half-truncated or a page-overwritten index.db resolves and a query then hits | RED. Random bytes threw errcode 26 at db.ts:90. Half truncation threw 11 at db.ts:90. The files root page threw 11 at build.ts:263. With the docs root page overwritten, the build RESOLVED (the build reads no docs page), but the query threw 11. |
| R-2401 | IF index.db is a SQLite database whose docs or files table lacks a column the knowledge build uses, THEN the knowledge build shall replace it with an index rebuilt from the sources. | R-2401: a build over a SQLite file whose docs or files table lacks a used column resolves and a query then hits | RED. docs(id, txt) threw 1 "no such column: path" at db.ts:91. files(path) threw 1 "no such column: root" at build.ts:263. |
| R-2402 | WHEN a pull finds an index.db older than one hour that has a whole page overwritten, the build that pull starts in the background shall rebuild the index so that a later pull returns hits. | R-2402: a pull over a page-overwritten index older than one hour starts a build that heals it, and a later pull hits | RED. The docs page was overwritten and the mtime set 2 h back. The first pull returned query-failed. The background build resolved and moved the mtime. The later pull still returned query-failed. The design without the quick check is red the same way. |
| R-2403 | IF another connection holds a write lock on index.db, THEN the knowledge build shall fail and keep every committed row of the index. | R-2403: a build over a write-locked index fails and a fresh handle still reads the committed sentinel | Guard, green today: the build throws 5 and the sentinel stays. Wrong code that adds 5 to DAMAGE_CODES turns it red. |
| R-2404 | WHILE another live build holds the build lock, the knowledge build shall leave a damaged index.db unchanged. | R-2404: a build that loses the build lock leaves a damaged index.db byte for byte | Guard, green today. It goes red on code that checks or deletes before acquireBuildLock. |
| R-2405 | IF index.db is not a SQLite database, is truncated, or has a whole page overwritten, THEN `nana-knowledge status` shall exit 0 and print one stdout line that names the damage and `nana-knowledge build --rebuild`, with no stack trace. | R-2405: status on a random-bytes, half-truncated or page-overwritten index exits 0 with one line naming the damage and build --rebuild, no stack | RED. Random bytes: a stack and exit 1. Docs page overwritten: healthy counts, exit 0, no damage line. |
| R-2406 | WHEN `nana-knowledge build` replaces an index.db that is not a SQLite database, is truncated, or has a whole page overwritten, it shall exit 0 and print one stdout line that names the damage, with no stack trace. | R-2406: build on a random-bytes, half-truncated or page-overwritten index exits 0 with one line naming the damage, no stack | RED. Random bytes: a stack at db.ts:90 and exit 1. Docs page overwritten: normal output with no damage line. |

There are no platform skips, because every case exists on macOS, Linux and Windows. The test closes its own handles before each build, so the Windows delete is real. On the Windows CI leg, R-2400's page cases prove that buildLocked closes its handle.

Known limits (record in HANDOFF residuals at land):
- quick_check checks page structure only. A byte changed inside one record, such as body text or an FTS blob, passes it. Such FTS damage can still fail some pulls until `build --rebuild`.
- A damaged index younger than one hour keeps pulls quiet until it ages past the stale age, because the hook spawns builds by age only.
- Every build pays for the check. It took 85 ms at 50 MB (measured). The README's 273 MB corpus would take about 0.5 s (inferred).
- On Windows, a reader holding the index at the delete blocks it. That reader can be a pull or a virus scan. That build then fails, with a stack on a manual run and silently in the background. The next build retries.
- A write-locked index still fails a manual build with node:sqlite's stack, as it does today.
- Because SQLITE_ERROR counts as damage, a bug in our own SQL replaces a good index with a partial one before the same error is thrown.
- status does not report a table of another shape.
- `query` still prints "query failed" and names no repair.
- doctor's knowledge row still names no repair and misses page damage. It waits for the doctor lanes in flight.
- The recovered MISSING/UNREADABLE wording is unpinned.

## Must-meet changes (re-check on the knowledge-sources-unparseable land tip, 2026-10-20; these win over the rows above)

- Threat model: add one in-scope honest variation. The index is damaged while sources.json, at the same time, does not parse or cannot be read.
- R-2400 new text: WHILE sources.json parses, IF index.db is not a SQLite database, is truncated, or has a whole page overwritten, THEN the knowledge build shall replace it with an index rebuilt from the sources. The test is unchanged.
- R-2401 new text: WHILE sources.json parses, IF index.db is a SQLite database whose docs or files table lacks a column the knowledge build uses, THEN the knowledge build shall replace it with an index rebuilt from the sources. The test is unchanged.
- R-2402 new text: WHILE sources.json parses, WHEN a pull finds an index.db older than one hour that has a whole page overwritten, the build that pull starts in the background shall rebuild the index so that a later pull returns hits. The test is unchanged.
- R-2403 to R-2406 do not change. R-2406 applies only when the build replaces the index, so the kept case falls outside it. R-2405 still holds when both problems are present.
- New row R-2407: WHILE sources.json exists but does not parse, IF index.db is not a SQLite database, is truncated, or has a whole page overwritten, THEN `nana-knowledge build`, with or without `--rebuild`, shall keep index.db byte for byte, exit 0, and print one stdout line that names the damage and says the index was not rebuilt, with no stack trace.
- R-2407 test: `packages/nana-knowledge/tests/recover.test.mjs::R-2407: build and build --rebuild with an unparseable sources.json over a random-bytes, half-truncated or page-overwritten index exit 0, keep index.db byte for byte and print one line naming the damage as not rebuilt`
- R-2407 check: run it for fixtures (a), (b) and (c).
  - Build a good index and close every handle. Damage it, delete -wal and -shm, then write the trailing-comma sources.json.
  - Hash index.db, then spawn `build` and `build --rebuild`.
  - Each run must exit 0 with empty stderr and no `^\s+at ` line.
  - Each run must print exactly one stdout line containing "damaged", and that line must contain "not rebuilt".
  - index.db's hash must be unchanged after each run.
- R-2407 red today, probed on 29269b13: (a) and (b) exit 1 with a stack for both `build` and `build --rebuild`. For (c), both commands exit 0 with no damaged line and rewrite index.db, and the mtime moves.
- R-2407 is also red on the plan's unamended design. For (c), `build` prints "rebuilt from the sources" but rebuilds nothing and writes into the damaged file. (a), (b) and (d) exit 1 with a stack. (e) and (f) also exit 1 with a stack.
- (adversary fix 4) R-2407's check also asserts the damaged line names "file is not a database" for (a) and "malformed" for (b) and (c).
- Rows R-2400 to R-2407; recover.test.mjs is 8/8.
