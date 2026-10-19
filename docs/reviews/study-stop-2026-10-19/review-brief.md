# Review — study-stop (a bench study stops when it cannot write a graded run's evidence), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-036 · Bound study execution and paid work

Review `git diff 2a96090..HEAD` on `feat/study-stop` (main was `2a96090` when the lane last merged it; `git merge-base
HEAD main` is `2a96090`). The plan of record is `docs/reviews/study-stop-2026-10-19/must-meet.md` (rows R-1500 to
R-1504, and R-542 flips from violated to implemented), with the adversary's verdict `plan-attack.md` and
`build-brief-1.md`. The seat's record `seat-verify-87bfeae.md` holds red-first and CI, the Windows log beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 2a96090`):

```
tree movement 2a96090..87bfeae: 6 rows in 1 features
FEAT-036 · Bound study execution and paid work
  R-542 violated -> implemented
  R-1500 new (implemented)
  R-1501 new (implemented)
  R-1502 new (implemented)
  R-1503 new (implemented)
  R-1504 new (implemented)
```

Judge whether a graded run whose child ran but whose evidence was not written (an unwritable evidence folder, or an
asset copy that fails after the child) now stops the study before any further paid child starts, after that run's
record and spend are in `results.jsonl`, with an error naming the folder and the code; and whether a grader error with
its evidence on disk still lets the schedule go on.

Threat model: honest variation in our tools' output and the OS in scope (an unwritable evidence folder, a missing
asset, per-platform Node error text and codes); deliberate forgery of evidence, results or ledger files out. Lane
class: ordinary — the bench runner, its tests and README, and one count in the requirements-tree test.

Check: (1) the six must-meet checks are not vacuous: each fails with its feature removed (the seat saw four red on
2a96090's runner; the R-1504 and probe checks are pins); (2) the stop comes only after the run's record is appended
and the in-flight hook released, and only when a measured child's evidence was not written; (3) the error names the
folder and the code on Windows as well as POSIX; (4) nothing else changed, and the README, module header, code map
and tree say what the code does; (5) HANDOFF, its six "Study stop" residual lines and the session entry are true;
(6) any MUST.
