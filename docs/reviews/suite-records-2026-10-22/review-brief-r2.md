# Review — suite-records, round 2 (confirmation), 2026-10-22 (the final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Class: ordinary. Threat model as in round 1 (`review-brief.md`): honest variation in scope — filtered, `--jobs` and stopped runs, a land stopped mid-rerun, two worktrees sharing one store, a dirty worktree, untracked files, a record that is missing, unreadable or unwritable, Windows file names; deliberate forgery out.

This is a confirmation round: review only the change since round 1's revision, `git diff 18036bc6..HEAD` on `feat/suite-records`. Round 1 (your SEND-BACK at 18036bc6) found one MUST, F1: a stop during a land's rerun of two or more files did not stop the rerun, and the remaining files ran outside the lock. Its three notes are now known-bug lines in FEAT-031's file.

The change since round 1:
- 0f6b7a37: the round-1 notes as FEAT-031 known bugs; `build-brief-4.md`.
- 3db949cd (build 4): the rerun loop breaks once `stopping` is set and returns `signalExitCode ?? 1` after the loop, storing no record; R-2548's check gains a two-file case (the land's coverage run fails two files, stopped during the first file's plain rerun: the second never starts, the exit code is the signal's, no record). The seat committed it as the builder left it: the builder's full suite failed only in templates-render, the Biome 2.6 break that the biome-pin lane fixed.
- 754238fe: the seat's pairs at 3db949cd, 14 of 15 red. s15 (the loop without the stop check) is red by R-2548. s10 (the `!stopping` guard inside `finishRecord` dropped) now survives as an equivalent change: every call site checks the stop before calling it (the two plain-run returns, the check after the coverage run, and the new check after the rerun loop), and nothing between those checks and the call awaits.
- ad0f5d00: merge of main at b195d89f (biome-pin, reviewed and landed); HANDOFF and session-entry conflicts kept both entries; the tree outline and code map regenerated.
- 5091b5eb: the session entry's evidence for build 4 and round 1.

The seat's record at 5091b5eb: the locked full suite `206 files: 204 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8298 pass, 0 fail, 39 skip`, then the lane's own record lines (`no baseline exists (the next land records one)`; `this lane: 8 full runs, 48.8 min`). Session titles: 0 missing. CI runs on PR #163 at 5091b5eb while you review; the seat lands only once its three suite legs pass.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement b195d89..5091b5e: 11 rows in 1 features, 1 capability change(s)
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
