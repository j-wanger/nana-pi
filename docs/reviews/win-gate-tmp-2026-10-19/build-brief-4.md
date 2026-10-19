# Lane win-gate-tmp — build brief 4 (2026-10-19 · feat/win-gate-tmp · on e97bad5)

**Builder: Claude Sonnet, a subagent in `<worktrees>/win-gate-tmp`.** Same rules as before: single test files only, in the foreground; no full suite; no push; no `HANDOFF.md`, `docs/sessions/` or the seat's review files. Do not change the gate code (`extensions/nana-gate.ts`).

Round 1 said LAND from both reviewers (Opus 9/10, Fable 9/10). Two findings come back because each is a one-line fix.

## 1. R-1430's Windows half must also assert the absolute form (Opus SHOULD 1)

On CI's layout the lane and temp folders sit on `C:` and the suite runs from `D:`. Main's gate judges the literal `/tmp/…` write at `C:\tmp\…` (it takes the session cwd's drive), so main already refuses the literal and the Windows half passes on main's gate. The form main lets through is the absolute `D:\tmp\…`; main allows it and the lane refuses it. `r1430Joined` is computed but used only on POSIX.

Fix: on win32, assert both forms are refused — `await call("write", r1430Joined) && await call("write", r1430Literal)` (or the test's equivalent), keeping the check's title and its `// req: R-1430` marker directly above the `check(` call. Show on macOS, with the test's forced-win32 seam or `path.win32`, that the joined form is refused on the lane's code and allowed on main's resolver (main's `realOut` from 4be0b79, or the M5 Windows form from `seat-mutate.mjs`), then restore. Say which CI log line will prove it on the real runner.

## 2. README: the TMP sentence (Opus NOTE 4, Fable SHOULD-2)

`packages/nana-pack/README.md` says `TMP` "is never read when it differs from `TEMP`". That is true only when both are set: Node's `os.tmpdir()` reads `TMP` when `TEMP` is unset. Make the sentence true in plain words. Run `npm run readme:check`.

## Report

First line `VERDICT: DONE | PARTIAL | BLOCKED`. Then the commits, each command with its exit code, and the red-then-green evidence for item 1.
