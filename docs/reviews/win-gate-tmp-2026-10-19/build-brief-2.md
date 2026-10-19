# Lane win-gate-tmp — build brief 2 (2026-10-19 · feat/win-gate-tmp · on 6172dcb)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/win-gate-tmp`.** The same rules as brief 1: single test files only, in the foreground; no full suite; no push; no `HANDOFF.md` or `docs/sessions/`.

## 1. The lane's Windows check never ran on Windows

CI run 39248931880 on 297ce13, Windows leg (`ci-windows-run-1.log` here), prints for R-1430's Windows half:

`SKIP /tmp is a temporary root on macOS and Linux and not on Windows: \tmp on the current drive lies inside the lane or OS temp root`

The test's `contained()` helper near the top of `packages/nana-pack/tests/lane-write-guard.test.mjs` lacks the `!path.isAbsolute(rel)` guard the gate's own `within()` has. On the runner the lane and the temp folder are on `C:` and the suite runs from `D:`, so `\tmp` resolves to `D:\tmp`. `path.win32.relative("C:\\…", "D:\\tmp")` returns `D:\tmp`, an absolute path, which the helper reads as inside. The notes agent reproduced this with `path.win32` on macOS (inferred cause, from the code and the log's drive letters).

Fix the helper so a path on another drive reads as outside, as `within()` does. Then the check runs on the runner instead of skipping. Keep every skip the helper still needs, each with its reason. Do not change the gate code.

Show the evidence on macOS with `path.win32` (or the test's forced-platform seam): the helper's answer for a cross-drive pair before and after, and that the R-1430 Windows-half check, under a forced win32 platform with the lane on one drive and the cwd on another, now runs and passes on the lane's code, and goes red with the gate's tmp fix reverted. Restore the code after the red run.

## Report

First line `VERDICT: DONE | PARTIAL | BLOCKED`. Then the commits, every command you ran with its exit code, and the red-then-green evidence. The seat pushes and reads the real Windows leg.
