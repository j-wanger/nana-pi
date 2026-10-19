# Seat wrong-code run on Windows — post-edit-win-pin (2026-10-19, after the land)

The plan's Verification named one seat run on the Windows leg: killTree's win32 branch with taskkill `/F /PID` and no
`/T`, its `error` and `close` fallbacks both no-ops. R-1700 and R-1701 must FAIL there. The lane landed (f8d20142)
on the final reviewer's LAND; the seat ran the wrong code on a scratch branch that was never merged.

- Run 2, `6ee387cb` (CI run 39314443000): the Windows leg went red, but not on the named checks. Case (a)'s
  cleanup, `fs.rmSync` on its fixture folder, threw EBUSY, because the surviving process held the folder. The file
  stopped there, before R-1700 and R-1701 ran. macOS and Ubuntu were green (the mutant changes only the win32 branch).
- Run 3, `b1fe58a1` (CI run 39317131316): the same wrong code, with case (a)'s cleanup wrapped in a try so the run
  goes on. Windows leg: `FAIL tree: a timed-out check's process and that process's still-running child are both
  ended` (R-1700) and `FAIL win32: with taskkill off PATH the timed-out check's shell is killed and the run settles`
  (R-1701); the file read 7 pass, 2 fail before case (c)'s cleanup threw the same EBUSY. macOS 162 PASS, 0 FAIL;
  Ubuntu 162 PASS, 0 FAIL.

Result: both named checks fail against the broken kill code on Windows, as the plan requires. The adversary's
claim that a kill without `/T` still ends level A through libuv's breakaway is refuted by the run.

Found on the way: case (a)'s "the checker is gone", case (b)'s "no orphaned grandchild" and case (c)'s "the aborted
checker is killed, not orphaned" look for survivors with pgrep, so on Windows they pass without checking anything.
Under the wrong code, case (a) and case (c) passed there. HANDOFF carries this as a residual.
