# Review — suite-records (every full locked suite run keeps a record; the same run compares against a nearest clean baseline, classes each failure and counts the lane's runs), 2026-10-22 (the final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Class: ordinary (the test runner, the locked suite, a new library and config module, their tests, the ledger; no install, hook, gate or land-tool file: `nana-land` is unchanged). Threat model: honest variation in scope — filtered, `--jobs` and stopped runs, a land stopped mid-rerun, two worktrees sharing one store, a dirty worktree, untracked files, an old-dated lane merged after its base, a record that is missing, unreadable or unwritable, Windows file names, a store over its cap, a run with no main branch; deliberate forgery out (a hand-written record file, a hand-set `NANA_SUITE_RECORD_FILE` or `NANA_LAND_TIP`).

Review `git diff 09e38e7d..HEAD` on `feat/suite-records`. Main is 09e38e7d; the lane branched from it. The lane's commits are 59524a6e (plan), d428c8d6 (build 1), 35cd941d (the seat's check of build 1 and brief 2), 01f5aabe (build 2), 464775de (the seat's check of build 2, the must-meet amendment and brief 3), 514590a8 (build 3), 250c6e30 (the seat's check of build 3 and the notes) and the final commit with CI evidence and this brief.

The plan of record is `docs/reviews/suite-records-2026-10-22/must-meet.md`: seat decisions D1 to D11, ten rows (R-2546 to R-2555), what each test does, the tunables, the known limits and the amendment after build 2. `plan-draft.md` and `plan-attack.md` are its inputs. `build-brief-1.md` to `build-brief-3.md` are the three builder sessions. The seat checked build 2 and sent three findings back in brief 3: F1 (a MUST), a land that passed through the coverage rerun printed that file as a failure, so R-2554 now restates the final result; F2, R-2549 had no case where a dirty record is the only one at the merge base; F3, R-2548 had no case for a stop during a land's plain rerun. Build 3 fixed all three.

The seat's record:
- The wrong-code pairs: 12 of 14 red at 01f5aabe (s2 and s10 survived, the gaps F2 and F3 name) and 14 of 14 at 514590a8 (`seat-mutate.mjs`, `seat-mutate-output-*.txt`): newest ancestor over nearest, a dirty baseline, untracked files not counted, a dirty run called flaky, slower files across job counts, the land prefix dropped, an off-lane total, an unguarded runner write, a filtered run stored, a stopped run stored, a rerun file with only its coverage label, the counts line first, a record written with the knob unset, a store failure that changes the exit code.
- The lane's tests (suite-records, test-runner and test-runner-parallel) pass plainly and through the runner with the coverage knob set at 514590a8: 3 files, 64 checks.
- Session titles: 0 missing for both sessions.
- The full suite in build 3: `206 files: 204 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8296 pass, 0 fail, 40 skip`, followed by the lane's own two record lines.
- The tree checker: 0 problems, 1812 rows, `deliverables: 14 of 39 made and read by code`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 09e38e7..250c6e3: 11 rows in 1 features, 1 capability change(s)
FEAT-031 · Run checks reliably and without contaminating work
  R-1270 text changed
  R-2546 new (implemented)
  R-2547 new (implemented)
  R-2548 new (implemented)
  R-2549 new (implemented)
  R-2550 new (implemented)
  R-2551 new (implemented)
  R-2552 new (implemented)
  R-2553 new (implemented)
  R-2554 new (implemented)
  R-2555 new (implemented)
capabilities:
  CAP-07 · Keep code and promises checkable: Deliverables R-291, R-1460, R-1014, R-1272, R-616, R-1239 → R-291, R-1460, R-1014, R-1272, R-616, R-1239, R-2547
```

R-1270's change narrows "record" to "per-file coverage record", since the runner now also writes a whole-run record under its own knob.

CI: run 39765317737 at 250c6e30 (PR #163), every job green (`ci-250c6e30.txt`): suite (ubuntu-latest) 206 files, 203 PASS, 0 FAIL, 3 SKIP, checks 8233 pass, 0 fail; suite (macos-latest) 206 files, 204 PASS, 0 FAIL, 2 SKIP, checks 8294 pass, 0 fail; suite (windows-latest) 206 files, 188 PASS, 0 FAIL, 18 SKIP, checks 7223 pass, 0 fail, with suite-records (9 pass), test-locked, test-runner and test-runner-parallel passing there; install-check success on macOS and Windows. The later commit adds only this brief and the CI record.

Questions for you: does every full locked run store exactly one record and every filtered or stopped run none; does the record's exit code and the closing lines always restate the run's final result, a land through the rerun included; can a record problem ever change the suite's exit code or block a land; and does the baseline rule pick the nearest clean record on main's line as the rows say?
