# Independent check — runtime-map-live at dd9cbc4d (2026-10-22)

One independent agent (Claude, general-purpose, not the builder's lineage) ran real full suites under coverage, about 6 minutes each over 204 test files, in scratch clones of dd9cbc4d with their own git common dir and a temporary HOME. The real runtime map in the main checkout kept its sha256 and time.

Verdict: NO MATERIAL FINDING.

What held:
- Hand measure: `npm run map:measure` exited 0 (202 PASS, 2 SKIP, 358.4 s), removed its coverage folder and wrote tip dd9cbc4d (HEAD), dirty 0, 204 tests and 3,686 hashes. Impact printed the tip, "0 hours old; 0 tracked files differ" and "the measured tip is not on main; the next land measures it" (the clone's main was the base). With main one and two commits past the tip it printed 1 and 2 commits past; a 5.5-hour-old copy read "5 hours old"; a tip absent from the repository read "not on main" with no git error; data without a tip printed no freshness line.
- Per-test staleness: one uncommitted edit to the land tool gave "1 tracked file differs" on every read, and marked stale only the tests whose ran set held that file (all 4 under the land tool, only the land test under the locked suite, 2 of 37 under an unrelated tokenizer).
- A real `nana-land merge` with `--suite "npm run test:locked"` (review records seeded as the land test does), on a tree where one test fails only under coverage: exit 0 with the land note "rerunning without coverage: <that file>", main moved to the tip, the data's tip equals main and labels that file FAIL; impact in the landed main showed 0 files differ and the FAIL label.
- A whole-run failure (one labelled coverage-only failure plus a test that changes a tracked file), with `NANA_LAND_TIP` set to HEAD: exit 1 with "FAIL tracked repository files changed by tests" and no rerun; the data still written with the FAIL label (D5).
- SIGTERM 20 seconds into a real coverage run: exit 143, coverage folder removed, lock released, no suite process left, data unchanged.
- The root README's runtime map paragraph and the pack README's land section match what ran.

Notes, recorded as known bugs in FEAT-029's and FEAT-031's files: impact never shows the dirty count; the hand measure counts a staged rename twice and takes the count before the lock; "1 commits past"; the README's product report paragraph still names only the hand measure; the plan's full-disk line was wrong (a crash leaves no completion record, so the land fails with no rerun; the seat corrected the line); `node scripts/test-locked.mjs` outside npm launches "undefined" (older, not this lane).

Not run: Windows (R-2526, covered by the Windows CI leg), Linux, and a failure with no labelled file at all, which ends at the same return as the mixed case. The check covers dd9cbc4d; the later merge of main a2b1306a touches no runtime map code.
