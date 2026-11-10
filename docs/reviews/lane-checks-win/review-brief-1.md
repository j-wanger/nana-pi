Feature: FEAT-006 · Launch builders with execution limits

# Review brief 1: lane-checks-win

Review `git diff main...HEAD` on feat/lane-checks-win (one commit, 912bd1d2; test, ledger and known-bug file only).

Owner (2026-11-09): flakes are recorded per file and fixed in source. Two measured Windows failures in `packages/nana-pack/tests/lane-checks.test.mjs`:
1. R-4006 was skipped on Windows. A seat probe (CI run 42805530123) un-skipped it and read the labelled failure: the check child reported `C:\Users\runneradmin\...\lane` while `fs.realpathSync(lane)` kept the runner's 8.3 name `C:\Users\RUNNER~1\...\lane`. The build compares `fs.realpathSync.native` on both sides, removes the Windows skip and removes its known-bug line.
2. Main CI run 42801845383 attempt 1, Windows shard 2: `temp folder not removed ... (EBUSY)` after the file; its rerun was green and was recorded as a flake. The build records descendant process IDs and awaits their exit before the fixture removes its folder; no sleeps, retries or skips were added.

Seat re-ran on 912bd1d2: `lane-checks` passes 12 cases on macOS; the diff adds no retry, sleep or skip. Windows evidence comes from this tip's CI leg, which runs alongside this review.

Questions:
- Does the native-path compare hide a real mismatch (a check running in the wrong folder) on any platform?
- Does the teardown wait end every case's processes within a bound, or can it hang or kill an unrelated process (a reused ID)?
- Is removing the known-bug line honest before Windows CI shows R-4006 green?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
