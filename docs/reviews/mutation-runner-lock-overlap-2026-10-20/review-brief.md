# Review — mutation-runner-lock-overlap (the lock contention check no longer races its own starting gate), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Review `git diff 15703d8d..HEAD` on `feat/mutation-runner-lock-overlap` (main is `54433844` as this brief is written;
`git merge-base HEAD main` is `15703d8d`, the pi-probe-timeout land tip that 8138f592 merges; the lane began on
`1b54211c`, so `1b54211c..HEAD` would also show pi-probe-timeout's own change). The plan of record is
`docs/reviews/mutation-runner-lock-overlap-2026-10-20/must-meet.md` with `plan-attack.md` (tests only, no row added;
R-1776 and R-1777 stay as they are), built from `build-brief-1.md`. The seat's record `seat-verify-8138f592.md` holds
CI, the Windows log beside it.

Tree movement: none (`requirements-moved --base main`: tree movement none; no row added or changed).

Judge whether the contention check still fails on a real overlap of critical sections and on any worker that enters
while the unreadable starting lock stands, now that the gate marker is gone, and whether anything left in the check's
gate can still race the lift. Judge whether the new `found <holder>` diagnostic can itself fail the check, hide an
overlap or misname one.

Threat model: honest variation in our tools' output and the OS in scope (scheduler stalls on loaded hosted runners, the
parent pausing between two file operations, platform timing); deliberate forgery out. Lane class: ordinary — one test
file.

Check: (1) the must-meet checks are not vacuous: W2 and W3 in `lib/mutation-runner.mjs` still turn the contention
check red; (2) no step of the check's gate still races the lift; (3) the diagnostic's marker read cannot throw out of
the worker or turn a real overlap green; (4) no test writes outside the temp folders it owns; (5) nothing else changed:
no lib, config, row or tree edit; (6) HANDOFF and the session entry are true, the residual lines included; (7) any MUST.
