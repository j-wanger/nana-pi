# Review — runtime-map-live, confirmation round 2 (the land reviewer), 2026-10-22

Feature: FEAT-029 · Navigate code and investigate impact

Class: install, hook or gate (it changes `nana-land`). Threat model: as in round 1's brief (`docs/reviews/runtime-map-live-2026-10-22/review-brief.md`): honest variation in scope — a land or hand measure stopped by any signal, a filtered or `--jobs` run, Windows, two worktrees running suites, a test that behaves differently under coverage, a land refused after its suite, a hand measure in a dirty worktree, old data with no tip; deliberate forgery out.

This round reviews only the change since round 1: `git diff b709fc18..HEAD` on `feat/runtime-map-live`. Round 1 at b709fc18: the final reviewer said LAND; the land reviewer sent it back with one MUST — stopping a hand measure no longer stopped its suite: `handMeasure()` ran the locked suite with `spawnSync` and forwarded no signal, so a SIGTERM to the measure command's PID left the suite running to overwrite the earlier map, and R-1277's check stayed green only because it drove the old `measure()` function.

The commits since b709fc18: 370a2f26 (round 1's record, two final-review notes as known bugs, `build-brief-5.md`), 8dc89838 (build 5), 83a92048 (the seat's check of build 5 and the notes).

Build 5:
- `handMeasure()` now starts the locked suite with `spawn`, forwards SIGINT, SIGTERM and SIGHUP to it, waits, and returns non-zero after a stop; the CLI awaits it.
- The locked suite's stop signals its child's whole process tree through the module's `killTree` (now taking the signal), not only the child's process group, so a detached grandchild ends too.
- R-1277's check drives the production command, with the existing three-level detached fake as the suite through `NANA_SUITE_TEST_COMMAND`; SIGINT and SIGTERM, each sent twice to the measure command's PID only.
- Both READMEs name the Windows exception (a Windows land does not measure; the hand measure measures on every platform) and drop "added" from the staleness sentence (the final reviewer's N1).
- R-2526's case builder deletes the hand-measure marker from the environment it copies (the final reviewer's N2).

The seat's record at 8dc89838:
- The wrong-code pairs: 19 of 19 red (`seat-mutate-output-8dc89838.txt`), including two new ones: the measure command forwards no signal, and the locked suite signals only its child's process group; each turns R-1277 red.
- runtime-land, runtime-map, land and test-locked pass through the runner with the coverage knob set: 4 files, 90 checks. The seat check prints `0 missing`.
- Build 5's full suite: `205 files: 203 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8287 pass, 39 skip`. The macOS install check at 83a92048: exit 0, 17 PASS, when re-run alone; the first attempt timed out after 301 s on the pi-subagents network install.
- CI run 39740755064 at 83a92048 (PR #161): suite (ubuntu-latest) 205 files, 202 PASS, 0 FAIL, 3 SKIP, checks 8224 pass, 0 fail; suite (macos-latest) 205 files, 203 PASS, 0 FAIL, 2 SKIP, checks 8285 pass, 0 fail; suite (windows-latest) 205 files, 187 PASS, 0 FAIL, 18 SKIP, checks 7213 pass, 0 fail, with the lane's four test files passing there; install-check success on Windows, and on macOS after a re-run of the job whose pi-subagents network install timed out (`ci-83a92048.txt`). The runs at dd9cbc4d and dc931d36 failed on Windows (F3 to F5).

The seat recorded two known bugs in FEAT-029's file rather than send them back: every locked-suite stop now finds the tree through `ps`, so where `ps` fails a stop signals nothing (on main it signalled the child's group); and the old `measure()` has no caller outside tests, while R-1271's and R-1275's checks still drive it through the shared data builder.

Judge whether the change fixes the MUST for its user, the seat or a builder who stops a hand measure or a land, and causes no harm the review standard lists:
- a SIGINT, SIGTERM or SIGHUP to the measure command ends the locked suite's whole tree within the stop wait, removes the coverage folder, keeps the earlier data and exits non-zero, and R-1277's check would catch a build that does not;
- the locked suite's new tree stop keeps R-2527 for a land and never signals a process outside the suite's tree (the caller's own group included);
- Windows behaves as before build 5 for both a land and a hand measure;
- the README sentences, the known-bug lines, the HANDOFF Landed line and the session entry say what the code does.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
