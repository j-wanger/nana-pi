# Review — review-test-waits (the review tools' tests wait for a reviewer's whole launch record), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Review `git diff 6bc2f727..HEAD` on `feat/review-test-waits` (main was `6bc2f727` when this brief was written; `git
merge-base HEAD main` is `6bc2f727`). The plan of record is `docs/reviews/review-test-waits-2026-10-19/must-meet.md`
(rows R-1920 to R-1924), amended by its adversary's `plan-attack.md`; the build followed `build-brief-1.md`. The seat's
record `seat-verify-f53cf02e.md` holds CI, the Windows log beside it.

Tree movement (`requirements-moved.mjs --root . --base main`):

```
tree movement 6bc2f72..f53cf02: 5 rows in 1 features
FEAT-031 · Run checks reliably and without contaminating work
  R-1920 new (implemented)
  R-1921 new (implemented)
  R-1922 new (implemented)
  R-1923 new (implemented)
  R-1924 new (implemented)
```

Judge whether, on a slow or loaded machine, immutable-review and review-ledger's signal section pass whenever
pi-review meets their checks; whether a temporary folder still busy at immutable-review's end prints one named FAIL
line instead of a crash; and whether the tests write only inside temp folders they own, cleaning up after themselves.

Threat model: honest variation in our tools' output and the OS in scope (machine load, process start time, file-write
timing, Windows folder handles); deliberate forgery out (a fake or launcher that lies). Lane class: ordinary — tests of
the review tools only (one new helper, one new test file, two edited test files); never pi-review, the watchdog, the
ledger or a hook.

Check: (1) the five must-meet checks are not vacuous: R-1920 and R-1921 really reach late launches and split record
writes in the child run, and each fails on its wrong code; (2) the shared wait returns only a complete record, returns
null only after closure or its limit, and cannot hang; (3) review-ledger's section 7 signals only a running launcher and
fails by name on a missing pid record; (4) the stall check is as win-watchdog-cpu-read left it; (5) no test writes
outside the temp folders it owns, and the meta run's preload reaches only its own child; (6) nothing else changed (no
product file); (7) HANDOFF and the session entry are true, including the residual lines and which load failures the
seat calls covered; (8) any MUST.

## Merge note (the seat, after this brief was written)

Since `d25ac4f1`, the seat merged main `bdc65eba` (the mutation-runner-win-lock land: the mutation runner lock test budget and bounded release; HANDOFF and session lines) as `28aed8cc`. Review this lane's own change as `git diff bdc65eba...HEAD` and the merge as `git show --remerge-diff 28aed8cc`. Tree movement now (`node scripts/requirements-moved.mjs --root . --base bdc65eba`):

```
tree movement bdc65eb..28aed8c: 5 rows in 1 features
FEAT-031 · Run checks reliably and without contaminating work
  R-1920 new (implemented)
  R-1921 new (implemented)
  R-1922 new (implemented)
  R-1923 new (implemented)
  R-1924 new (implemented)
```
