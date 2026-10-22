# Review — runtime-map-live (every land measures the runtime map; impact names its freshness and marks stale only the tests that ran a changed file), 2026-10-22 (the final reviewer)

Feature: FEAT-029 · Navigate code and investigate impact

Class: install, hook or gate (it changes `nana-land`, a land tool, and a test under `packages/nana-setup/`). Threat model: honest variation in scope — a land stopped mid-measure by any signal, a filtered or `--jobs` run, Windows, two worktrees running suites, a test that behaves differently under coverage, a land refused after its suite, a hand measure in a dirty worktree, old data with no tip; deliberate forgery out (a hand-set `NANA_LAND_TIP`, a hand-edited data file).

Review `git diff 0430b534..HEAD` on `feat/runtime-map-live`. Main is 0430b534; the lane branched from 08c33d94 and merged main at a2b1306a, which brought in the deliverable-fields lane (already reviewed and landed) and regenerated the code map and the tree outline. The lane's own commits are ae4d9359 (plan), 01a7f371 (build 1), b7a41ca7 (seat check and brief 2), e13e6ba7 and 8a3df4bd (build 2), dd9cbc4d (the seat's pairs), a2b1306a (the merge), 9e975816 (the seat's check of build 2, the must-meet amendment, notes so far and brief 3), 56435b70 (build 3), dc931d36 (the pairs again), ea6b8c44 (the seat's check of build 3 and brief 4), a2d72686 (build 4) and the final notes commit.

The plan of record is `docs/reviews/runtime-map-live-2026-10-22/must-meet.md`: seat decisions D1 to D9, thirteen rows (R-2522 to R-2534), what each test does, the tunables and the known limits. `plan-draft.md` and `plan-attack.md` are its inputs. `build-brief-1.md` to `build-brief-4.md` are the four builder sessions. The seat checked build 1 and sent two findings back in brief 2: F1 (a MUST), the coverage rerun could pass a land whose coverage run also had a whole-run failure that names no file; F2, a write problem was lost on the rerun path. Build 2 fixed both: the completion record now carries the run's failure count, and the land reruns only when every failure is a labelled file. The Windows CI leg at dd9cbc4d then failed 9 checks (`ci-windows-dd9cbc4d.txt`): F3, the test wrappers imported scripts by a raw drive path, and F4, a regression — the hand measure stopped measuring on Windows, because it ran the locked suite with the land tip set and R-2526's Windows branch then wrote nothing (R-1278 red there). The must-meet's amendment after build 2 narrows R-2526 to a land: the measure command sets a declared marker and measures on every platform, as on main. Build 3 fixed both. The Windows leg at dc931d36 then passed R-1278 and R-2526 but failed three land checks that used the machine's real platform (F5, `ci-windows-dc931d36.txt`); build 4 makes those cases inject a non-Windows platform, as R-2526's and R-2527's cases already did.

The seat's record:
- The wrong-code pairs: 15 of 15 red at 8a3df4bd, 17 of 17 at 56435b70 and 17 of 17 at a2d72686 (`seat-mutate.mjs`, `seat-mutate-output-*.txt`): no land tip, main's old SHA as the tip, a filtered run that measures, a rerun of every file, a rerun under coverage, a write failure that exits 1, the notes dropped, a hand measure with no tip, a constant age, the whole list marked stale, F1, F2, Windows measured, data without a tip, main's distance counted the wrong way, and, after build 3, a Windows branch that ignores the hand-measure marker and a measure command that sets none.
- The lane's tests (runtime-land, runtime-map, land) pass plainly and through the runner with the coverage knob set at 56435b70: 3 files, 73 checks; build 4 changed only the runtime-land test, which passes plainly and under coverage.
- The independent check (`independent-check.md`): no material finding, from real full suites under coverage in scratch clones, including a real `nana-land merge` with a test that fails only under coverage, a whole-run failure and a real SIGTERM. Its notes are known bugs in FEAT-029's and FEAT-031's files.
- The full suite in build 4: `205 files: 203 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8287 pass, 0 fail, 39 skip`.
- The macOS install check at dc931d36: exit 0, 17 PASS, 0 FAIL.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 0430b53..a2d7268: 15 rows in 1 features
FEAT-029 · Navigate code and investigate impact
  R-1272 Made by/Read by lines changed
  R-1274 implemented -> retired
  R-2522 new (implemented)
  R-2523 new (implemented)
  R-2524 new (implemented)
  R-2525 new (implemented)
  R-2526 new (implemented)
  R-2527 new (implemented)
  R-2528 new (implemented)
  R-2529 new (implemented)
  R-2530 new (implemented)
  R-2531 new (implemented)
  R-2532 new (implemented)
  R-2533 new (implemented)
  R-2534 new (implemented)
```

CI: run 39731735341 at a2d72686 (PR #161): suite (ubuntu-latest) 205 files, 202 PASS, 0 FAIL, 3 SKIP, checks 8224 pass, 0 fail; suite (macos-latest) 205 files, 203 PASS, 0 FAIL, 2 SKIP, checks 8285 pass, 0 fail; suite (windows-latest) 205 files, 187 PASS, 0 FAIL, 18 SKIP, checks 7213 pass, 0 fail, with the land test (54 pass, 1 skip), runtime-land (7 pass, 1 skip) and runtime-map (9 pass, 1 skip, R-1278 passing) there (`ci-windows-a2d72686.txt`); install-check success on macOS and Windows. The earlier runs at dd9cbc4d and dc931d36 failed on Windows (F3 to F5).

The notes (in the notes commit): one HANDOFF Landed line and the queue's building line removed; R-1272's maker line changed from a hand measure to the land (the count reads 13 of 38); FEAT-029's known bugs gain twelve lines and lose the two-at-once write that D8 closed; FEAT-031's file gains one; six late notes from deliverable-fields' final review in FEAT-028's file and one cleanup bug in FEAT-008's file; the session entry. The plan's seat steps said this lane's notes would carry the 2026-10-22 ruling, the queue reorder and the removal of the deliverable-consumers ask; deliverable-fields landed first and carried all three.

Judge whether the feature works for its user — a builder or the seat reading `npm run map:impact`, and the seat landing a lane — and report:
- each must-meet check is red with its feature removed or with the obvious wrong code, and green with it; the seat's pairs are the floor, not the ceiling;
- a land can never pass on a coverage run that failed for a reason the plain rerun does not repeat, beyond the labelled-file rerun D5 allows; a failure that names no file, a missing or mismatched completion record, or a stop signal never turns into a passing land;
- a passing land never fails because of the map: a write failure, a full temp folder or a Windows checkout gives a note, not an exit code;
- the land's own guarantees are unchanged: the suite still runs on the reviewed tip in the source tree before the merge, the pre-merge checks and the ff-only merge are as before, and a suite command other than the locked suite behaves as before;
- a hand measure measures on Windows and a Windows land does not, and the marker cannot make a land measure on Windows by any honest path;
- impact's freshness lines and per-test staleness say what is true, and an absent tip, a tip off main or old data never prints a git error;
- the READMEs say what the code does;
- R-1272's new maker line is true (the land tool, the locked suite and the measure module make the map), and the notes, known-bug lines and session entry are accurate.

Known limits already carried (do not send back for them): every line in FEAT-029's known-bug file that names this lane, and the must-meet's known limits.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
