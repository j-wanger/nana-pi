Feature: FEAT-003 · Index and connect existing knowledge sources. Lane knowledge-index-recover, rows R-2400 to R-2406 (block R-2400 to R-2409). Class: install, hook or gate (hook). Builder: pi-worker (complex lane).
Work in ~/nana-pi-wt/knowledge-index-recover on feat/knowledge-index-recover, based on current main. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md or docs/sessions/.
Run single test files only (`node <file>`). Never run the full suite: other lanes hold the machine's suite lock.
Trace rule: put each `// req: R-24xx` on the line directly above its `check("R-24xx: …", …)` call. The title's opening quote must sit on the same line as `check(`. Never split a title onto the next line; a split title broke CI before.

Order: rows first, then the test, then the code.
1. REQUIREMENTS.md, FEAT-003: insert R-2400 to R-2406 directly after the R-208 row. Other slate lanes append at the table end. Copy the row text verbatim from the must-meet. Each row starts `untested` and becomes `implemented`, with `file::title` evidence, once its check passes.
2. Write the new packages/nana-knowledge/tests/recover.test.mjs:
   - Give it the six-tag header and a PASS/FAIL `check` that exits 1 on any FAIL. Use the must-meet titles exactly.
   - Before any build, take tmpDir from ./tmp-dir.mjs. Set HOME and USERPROFILE to a temp profile, and give each case a fresh NANA_KNOWLEDGE_HOME.
   - Run `delete process.env.NANA_ROLE`: you run as a worker, and runHook returns early for that role. No temp name may contain "damaged".
   - Sources: one article holding a known phrase plus about 40 filler articles. Build a good index, close every test handle, then damage it. Delete -wal and -shm with each fixture.
   - Fixtures:
     (a) 4096 random bytes.
     (b) A good index cut to half its size.
     (c) The docs root page, filled with 0xA5.
     (d) The files root page, filled with 0xA5.
     (e) A SQLite file holding only `docs(id, txt)`.
     (f) A SQLite file holding only `files(path)`.
   - For (c) and (d), take the rootpage from sqlite_schema and write at offset (rootpage-1)*page_size. Use the fixed filler, never random bytes: a random first byte is a valid page type 4 times in 256.
   - R-2400 covers (a) to (d) and R-2401 covers (e) and (f). build() must resolve AND search() must then find the phrase. For (d), a query alone is green today.
   - R-2402: use (c) with its mtime set 2 h back. Call runHook with the real spawn and expect query-failed. Poll up to a chosen 20 s deadline, with the comment "cold Windows CI slack, as hook.test.mjs". Wait until index.db's mtime is more than 60 s past the stale mtime and build.lock is gone. Then a pull with a new session_id must return "ok" with hits.
   - R-2403: commit a sentinel meta row. A second DatabaseSync runs `BEGIN IMMEDIATE` and an insert, and build() must reject. ROLLBACK, close, then read the sentinel through a NEW handle. An old handle reads the unlinked file on POSIX.
   - R-2404: write build.lock as {pid: process.pid, at: Date.now()} over (a). build() must reject with BuildLockedError and leave the bytes identical. Remove the lock afterwards.
   - R-2405 and R-2406: spawnSync the CLI with NODE_NO_WARNINGS=1 over (a), (b) and (c). Expect exit 0, empty stderr, no `^\s+at ` line, and exactly one stdout line containing "damaged".
   - That line holds "file is not a database" for (a) and "malformed" for (b) and (c). For status it also holds `nana-knowledge build --rebuild`.
3. lib/db.ts: add DAMAGE_CODES, IndexDamageError, indexDamage, checkIndex and openDb's close-on-throw, as the must-meet's design says. Update @purpose (still one sentence), @outputs and @errors.
4. lib/build.ts: run checkIndex after openDb unless rebuilding. Close the handle in a finally. Add the one retry in build(), inside the lock. Add `recovered?: string` to BuildStats. Update the header tags.
5. bin/nana-knowledge.ts: add the damaged line in build, the rebuild wording for MISSING and UNREADABLE when recovered, and the status line with return 0. Update the header tags.
6. README: add a paragraph after `--rebuild` and one sentence in the fail-open bullet. Add the check's cost: about 85 ms on a 50 MB index, measured 2026-10-20. Write no machine paths and no owner name.
7. Run `npm run map`, then `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`.
No inline tunables. Never add a typed leaf total.

Wrong code to try (each must turn its check red; revert after):
- Remove checkIndex from buildLocked: R-2400, R-2402 and R-2406 go red. Remove it from status: R-2405 goes red.
- Drop 11: R-2400 goes red. Drop 1: R-2401 goes red. Add 5: R-2403 goes red, on macOS and Linux only.
- Retry without rebuild:true: R-2400, R-2401, R-2402 and R-2406 go red. Delete before acquireBuildLock: R-2404 goes red. Remove the build line: R-2406 goes red.
- Windows only, for the seat on the CI leg: no close in buildLocked's finally, or none in openDb's catch, turns R-2400 red.

Done:
- recover.test.mjs is 7/7 PASS, and it is red on today's main for R-2400, R-2401, R-2402, R-2405 and R-2406.
- incremental-build, unreadable-root, discovery, hook and extension .test.mjs pass as single files.
- map:check, readme:check and trace are green, and the rows are implemented.
- The work is committed on feat/knowledge-index-recover with explicit paths.

Report (≤ 10 lines): the tip sha; the 7 checks; the red-on-main result per row; each wrong-code result; the five other knowledge files; map, readme and trace status; anything left untested.

## Seat amendments (re-check on 29269b13)

- Branch from main at 29269b13. It already holds knowledge-sources-unparseable, so drop the plan's notes on land order, merging main and re-applying hunks. No in-flight worktree touches packages/nana-knowledge; I checked every worktree against 29269b13.
- Rows R-2400 to R-2409 are free at 29269b13 and in every lane worktree. Other lanes use R-2340 to R-2346, R-2390 to R-2398, and R-2410 and up. R-2370 to R-2376 now sit directly above R-208. Still insert R-2400 to R-2406 directly after R-208, then put the new R-2407 after R-2406.
- Use these locations on 29269b13. In build.ts, `build()` is at :228–235 and `buildLocked` starts at :237. `loadSources()` is at :239 and the delete guard `if (opts.rebuild && !problem)` is at :241. `openDb` is at :246, the files SELECT is at :263–266 and `db.close()` is at :329.
- More locations: the files SELECT now throws at build.ts:264, not :263. BuildStats ends with `problem?: SourcesProblem` at :159. db.ts has not changed, so the pragma and schema lines still throw at :90 and :91.
- In the bin, the sources marker line is at :42 and the MISSING/UNREADABLE wording is at :43. cmdStatus prints the sources line at :120 and calls openDb at :123.
- Re-run the red-on-main probe on 29269b13, not on 72abe19a. The sources lane changed no damage path.
- Read sources.json once per build. Call `loadSources()` in `build()` right after `acquireBuildLock()`. Pass the result to `buildLocked` for the first pass and for the retry. Nothing moves before the lock.
- In buildLocked, run checkIndex unless this pass deleted the database (`opts.rebuild && !sources.problem`). Do not skip it just because `opts.rebuild` is set. A `--rebuild` under a sources problem keeps the old file, so the check must still run.
- In build()'s catch, handle the case where `indexDamage(err)` is non-null and `sources.problem` is set. Do not retry and do not delete. Return a BuildStats with no roots, the sources problem, and a new `keptDamage?: string` holding the reason.
- Put that kept branch in build(), not around openDb. A files table of another shape only throws at the files SELECT.
- Retry with `rebuild: true` only when three things hold: the error is damage, `sources.problem` is unset, and the call was not already a rebuild. Set `recovered` only on that path.
- In cmdBuild, when `s.keptDamage` is set, print exactly one line: `  index was damaged (<reason>) — not rebuilt while sources.json has a problem; repair it, then run nana-knowledge build`.
- After that line, print the existing sources marker line in the :42 format, then return 0. Skip the totals lines, because "files 0 · rows 0" would claim the index is empty.
- The kept path writes nothing and does not touch index.db's mtime. That way the first pull past the stale age after the owner repairs the file heals the index.
- Change the MISSING/UNREADABLE wording test at bin:43 from `rebuild` to `rebuild || s.recovered`.
- cmdStatus needs no change for sources problems. Its sources marker line already prints above the new damage line. A `build --rebuild` run while the file is broken prints the not-rebuilt line.
- In the README, put the damaged-index paragraph after the sources-file paragraph, which ends "Repair the file to resume scanning…". Do not put it straight after the `--rebuild` parenthetical.
- Add one sentence to that paragraph: while sources.json does not parse or cannot be read, a damaged index is kept as it is and not rebuilt; repair the file, then build.
- The check makes the README's "0.1 s for a no-op rebuild" in The index out of date. The same is true of "costs 0.1 s" in the stale-index bullet. Put the check's measured cost (about 85 ms at 50 MB) next to the first figure, and say both 0.1 s figures predate the check.
- Model the CLI spawns on the `run()` helper in sources-file.test.mjs: HOME, USERPROFILE, NANA_KNOWLEDGE_HOME and NODE_NO_WARNINGS=1. Use a trailing-comma sources.json like its F3 fixture for R-2407. The marker line for that fixture does not contain "damaged".
- Run sources-file.test.mjs as a sixth single file, and list it in Done as 7/7.
- I prototyped this amended design on 29269b13, in <seat-scratch> with probe2.mjs. These files pass: sources-file 7/7, incremental-build 30/30, unreadable-root 7/7, discovery 37/37, hook 98/98 and extension 38/38.
- In the same prototype, fixtures (a) to (f) with a valid sources.json each rebuild, print one damaged line, and then return a query hit.
- I did not write recover.test.mjs, so I have not shown its 7/7.
- Add two wrong-code pairs; both turned R-2407's assertions red on my macOS prototype. First, drop the keptDamage branch so that damage under a sources problem retries. R-2407 goes red: exit 1 with a stack.
- Second, gate checkIndex on `opts.rebuild` instead of on the delete. R-2407 goes red on its `--rebuild` half only: no damaged line, and index.db is rewritten.
- Add these known limits to the HANDOFF residuals at land:
  - While sources.json has a problem, a damaged index stays damaged. Pulls keep logging db-open-failed or query-failed.
  - In that state, every pull past the stale age starts a build that runs the check and exits. The kept path does not refresh the index age, unlike the sources lane's healthy-index path.
  - A table of another shape is kept, but it is not byte for byte. openDb's schema step can add the missing tables before the damage shows.
  - An unreadable sources.json takes the same kept path. Only the unparseable case is pinned.
  - nana-setup project's refresh summary falls back to "rebuilt" after a kept build. It shows only the totals line, and the kept path prints none.
  - Under a sources problem, a SQLITE_ERROR from our own SQL prints a false "damaged … not rebuilt" line. It now keeps the index instead of replacing it.
  - The kept line's exact wording is unpinned beyond "damaged" and "not rebuilt".

## Must-meet changes

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

## Adversary fixes to the amendments (verdict GO-WITH-FIXES; these win where they differ)

1. Branch from current main (the worktree's base, 63aca2fb), not 29269b13. Neither later land touches packages/nana-knowledge. Re-run the red-on-main probe on this base.
2. Run checkIndex after every openDb in buildLocked, with no "unless this pass deleted the database" gate. A failed delete (EBUSY on Windows while a reader holds index.db) is swallowed at build.ts:242–244, and a gated retry would write into the damaged file and set `recovered`. Wrong-code pair 2 becomes "skip checkIndex when opts.rebuild is set"; it still turns R-2407's `--rebuild` half red for fixture (c).
3. Done and the report read recover.test.mjs 8/8 for R-2400 to R-2407. Add R-2407 to the red-on-main list and to the row range (R-2400 to R-2407).
4. R-2407's check also asserts what the damaged line names: "file is not a database" for (a) and "malformed" for (b) and (c), as R-2406 does.
5. Call loadSources() inside build()'s `try` whose `finally` runs releaseBuildLock, not between acquireBuildLock and the `try`.
6. The README sentence says a damaged index "is not rebuilt or replaced" while sources.json has a problem, not "kept as it is".
7. Put `recovered?` and `keptDamage?` in BuildStats next to `problem?` (:159), not after `ms` and `dbBytes`.
8. (For the seat's notes, not the build) three more residuals: with a valid sources.json, a recovery drops the rows of missing or unreadable roots, as `--rebuild` does; a failed delete during the retry is unpinned; the README and hook.ts "0.1 s" rationale predates the check.

The adversary's claim most likely wrong: that the kept path leaves index.db byte for byte on Windows for (b) and (c). All evidence is from macOS; if SQLite's open and close writes to the file there, R-2407 goes red only on the Windows leg. If you cannot make it hold by construction (for example by never opening the database on the kept path), say so in the report.

## Seat (2026-10-20 ~18:20 EDT)

- Builder: pi-worker --lane knowledge-index-recover --lane-size larger (the roster's larger-lane builder, pi gpt-5.6-sol). Ignore any line above that names another builder.
- Reviews: Claude Opus 5.5 is the final reviewer and pi gpt-6-astra the land reviewer; the seat lands when every reviewer says LAND.
- Base: main 63aca2fb (lifecycle-compaction-reason, gate-stop-names-config, knowledge-sources-unparseable, project-odd-seeds and review-launch-win-paths have landed). Ignore the brief's land-order and merge notes: knowledge-sources-unparseable is already in your base.
- Run single test files only, never the full suite: other builders share this machine.
- `import { tmpDir } from "./tmp-dir.mjs";` on its own line in any new test file; never call mkdtempSync.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
