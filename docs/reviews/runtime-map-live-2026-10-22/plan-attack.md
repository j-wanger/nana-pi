# Plan attack: runtime-map-live (main 08c33d94)

Probe: `git archive` copy in scratch `plan-rml/adv/`, `git init`, temp HOME, a read-only copy of the clone's runtime data (written 21:26). No full suite run; filtered pairs only.

## MUST

**M1. Every line the plan relies on is swallowed at a passing land, and a coverage failure stops the map for good.** nana-land captures the suite's output and, on success, returns only the push and release lines (nana-land.mjs:103-124). The rerun line, the write-failure line (R-2525), the Windows line (R-2526) and the filtered-run line never reach the seat. D5 leaves the data unchanged after a coverage failure. So one test that always fails under coverage stops map production at every land while every land passes. That test exists today: install.test failed under coverage 2 of 2 here (5 of 5 with the planner's), passed 2 of 2 plainly, and the current data labels it FAIL. The fix in this lane covers that one test, not the next. Fix: after a coverage run that fails, still write the data from it (runtime-measure already writes on a failing suite when the completion count matches), labels as measured. nana-land prints the suite's lines that start with one declared prefix on success; the locked suite uses that prefix. New row (below, R-2530).

**M2. No row tests the feature: after a land, main's map matches main's tip.** R-2522 and R-2523 test halves. A build that hashes the main checkout instead of the tree, or stamps the captured main SHA instead of the source tip, passes both. The audit's first bullet ("after a land, map:impact on a changed file shows timings from main's tip") has no test. Fix: one row in land.test's fixture with the fake suite: after `runLand` merges, the data's `tip` equals `refs/heads/main`, and `checkoutDrift` from the main checkout is empty.

**M3. The negative cases have no row, and their wrong build is the worst one.** Untested: a filtered run with the variable set, a variable that is not HEAD, and a failing locked run with no variable. A build that measures filtered runs replaces the 203-entry map with a handful of entries, and passes every row R-2522 to R-2529. That run is honest: FEAT-031's known bug treats `test:locked -- --jobs=2` as a filtered run. A build that reruns without the variable gives every builder's failing locked run a second chance. Fix: one row with three cases. Each starts no coverage and no rerun, and leaves the data byte-equal.

**M4. The remedy the plan prints erases freshness.** R-2529 names `npm run map:measure`. The plan leaves that command writing no tip. Its known limits say data without a tip prints no freshness line. So following R-2529 removes R-2528's line. A builder who runs it in a worktree also overwrites the shared file with dirty lane hashes. That file is the git common dir copy every worktree reads. Fix: map:measure runs the locked suite's land path with HEAD as the tip. That gives one write path inside the lock, which also closes FEAT-029's two-at-once write. It stamps `tip`, `measuredAt` and the count of dirty tracked files. R-2529 says "the next land measures it" first. Row: a hand measure writes a tip and a time.

## SHOULD

- **S1. Whole-section stale marks keep worktree reads stale.** One land (scrub-records) changed 903 of the 3,664 hashed files. The 21:26 data is already stale against main's 21:52 tip. After this lane, a worktree with one edit, or with another lane landed during its build, still marks every block stale. The median source file runs in 8 of 203 tests (p90 51). Per-entry marks would mark about 4% of entries for a one-file edit. R-1513's per-entry rule already exists (product-report.mjs:400-411): reuse it in `formatRuntime`, about ten lines. This is the planner's rejected option, but it is reuse, not new code. If kept out, state in the plan that the builder reads stay stale.
- **S2. Rerun only the files that failed under coverage.** A whole plain rerun costs about 6 minutes and discards the data. The verdict differs only when a file passes under coverage and fails plainly (inferred rare). The flaky second chance stays the owner's call. M1's prefix line names the rerun files.
- **S3. Coverage seconds are not plain seconds.** identity-scan took 13.9 s and 13.8 s plainly against 17.7 s and 17.5 s covered: +27%, serial, two pairs. The wall total hides it. The draft's "two coverage runs against one plain" compares across trees; like for like is one pair on main (341 s against 354 s). Record in FEAT-031 that the map's seconds overstate CPU-heavy files, or let suite-records supply plain seconds.
- **S4. A hard stop leaks about 1 GB.** test-locked traps SIGHUP; runtime-measure's `STOP_SIGNALS` holds only SIGINT and SIGTERM. A SIGHUP or SIGKILL to a land leaves the coverage folder (planner's peak 983 MB). Nothing sweeps it. macOS's temp reaper is the only bound (inferred). Fix: add SIGHUP to R-2527. Write the owner pid into the folder. At start, remove any `nana-runtime-*` folder whose owner is dead.
- **S5. R-2526 runs only on the Windows leg.** Off Windows it skips, so a red appears only in CI after the land. runtime-measure already takes `platform`: inject it so the row runs on every leg.
- **S6. Rows that a wrong build passes.** R-2522: the fixture's tip must differ from main's SHA. R-2528: inject the clock, set `measuredAt` 5 hours back and make 2 files differ, which catches a constant 0. R-2529: cases with main 3 past, a tip ahead of main (refused land) and a tip absent from the repo (pruned branch). The absent tip reads "not on main", never a thrown git error.

## NOTE

- N1. Lock order lets a refused land leave the map at an unlanded tip. B checks first, A lands, then B's suite writes and B is refused. R-2529 reports it until the next land. Keeping one previous file would fix it; a known limit is enough.
- N2. nana-land's 16 MB output buffer now holds two runs' output on a coverage failure. Current output is far smaller (inferred).
- N3. Until the install.test fix lands, the product report shows FAIL beside R-2498's evidence (current data).
- N4. Highest row on main is R-2521; no HANDOFF reservation for R-2522 onward. Reserve R-2522 to R-2532 there.

## AMENDED

Install, hook or gate lane, as planned. Suggested wrong-code pairs: M2 (stamp main's SHA), M3 (measure a filtered run), M1 (drop the prefix echo), M4 (hand measure writes no tip), S6 (constant age).

| Row | EARS (one shall) | Test file :: title | What it does |
|---|---|---|---|
| R-2522 | as drafted | land.test :: as drafted | Fixture tip differs from main's SHA. |
| R-2523 | as drafted | runtime-land.test :: as drafted | |
| R-2524 | IF the coverage run exits non-zero, THEN the locked suite shall write the data from it, rerun only the failed files plainly, and exit with the rerun's code. | runtime-land.test :: "a land failing under coverage keeps its data and reruns only the failed files" | The fake fails one file under coverage. Asserts data written and one plain start naming that file. |
| R-2525 | as drafted | runtime-land.test :: as drafted | |
| R-2526 | as drafted, platform injected | runtime-land.test :: as drafted | Runs on every leg. |
| R-2527 | as drafted, plus SIGHUP and the dead-owner sweep | runtime-land.test :: as drafted | |
| R-2528 | as drafted | runtime-map.test :: as drafted | Clock injected; 5 h; 2 files differ. |
| R-2529 | as drafted, plus an absent tip | runtime-map.test :: as drafted | Three cases. |
| R-2530 | WHEN the suite prints a line with the land note prefix, the land merge command shall print that line in its success output. | land.test :: "a passing land shows its suite's land notes" | Fake suite prints one note and one other line. Only the note appears. |
| R-2531 | WHEN a land merges, the runtime data shall name main's new tip and match the main checkout's tracked files. | land.test :: "after a land the runtime data names main's tip and is not stale" | End to end with the fake suite. |
| R-2532 | IF the locked suite runs filtered, with a tip that is not HEAD, or fails with no tip set, THEN it shall start no coverage, rerun nothing and leave the data unchanged. | runtime-land.test :: "filtered, wrong-tip and unset-tip runs neither measure nor rerun" | Three cases, data compared byte for byte. |
| (M4) | WHEN map:measure runs, it shall write the tip, the time and the dirty-file count through the locked suite. | runtime-land.test :: "a hand measure writes its tip and time inside the lock" | Folded into R-2523 if the planner prefers. |
