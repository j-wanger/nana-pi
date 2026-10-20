# Review — project-check-quiet (the project check mutes the same two Node warnings doctor mutes), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-014 · Create or adopt a project workspace (rows in SUB-021 · Check readiness and ratify the objective)

Review `git diff 385c633f..HEAD` on `feat/project-check-quiet` (main was `385c633f` when this brief was written; `git
merge-base HEAD main` is `385c633f`). The plan of record is `docs/reviews/project-check-quiet-2026-10-20/must-meet.md`
(rows R-2050 to R-2052, new in SUB-021's table directly after R-1670), with `plan-attack.md` (the adversary's AMEND)
and `build-brief-1.md` beside it. The build is one commit, `31634589`, on the plan commit `e84357b3`; `a7ae9920` merges
main `385c633f`. The seat's record `seat-verify-a7ae9920.md` holds CI run 39384750051 on draft pull request #109 at
a7ae9920 (0 failing files on macOS, Ubuntu and Windows; doctor-quiet prints 7 PASS lines on every leg, the three new
checks by title on native Windows), with the Windows log beside it (`ci-windows-a7ae9920.log`), and the builder's
wrong-code tries as relayed. No seat pairs and no independent check: an ordinary lane.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 385c633f` at a7ae9920; the seat's notes commit
changes no row): three rows added, all implemented; none retired, re-statused or reworded.

```
tree movement 385c633..a7ae992: 3 rows in 1 features
FEAT-014 · Create or adopt a project workspace
  R-2050 new (implemented)
  R-2051 new (implemented)
  R-2052 new (implemented)
```

CAP-04 moves from 443 to 446 rows, FEAT-014 from 91 to 94 and SUB-021 from 7 to 10.

Judge whether `nana-setup project <dir> --check` now writes no Node warning line to stderr, in a folder with project
config and in one without, on macOS, Linux and Windows; whether every other Node warning still prints; and whether
nothing outside the check's branch changed: doctor, the seeding run, trust and install behave as on main.

Threat model: honest variation in our tools' output and the OS in scope (Node 22.x patch levels on macOS, Linux and
Windows; folders with and without project config; preloads that emit their own warnings); deliberate forgery out (a
preload that forges a MODULE_TYPELESS-coded warning is dropped by the mute, the residual doctor already has). Lane
class: ordinary — one call in the project check's branch of the CLI, a comment and the CLI header, one test file, the
setup README, the ledger, tree and code map; no install, uninstall or doctor code, hook, extension, gate policy or land
or review tool.

Check: (1) R-2050 and R-2052 are not vacuous: each fails on main's CLI and passes on the lane's, and R-2052 alone
catches a mute gated on project config; (2) R-2051 fails under a blanket mute, so the check still prints a warning it
does not mute; (3) the mute is reached on every `--check` path before any pack module loads; (4) nothing outside the
check's branch changed behaviour, and doctor's three checks still pass; (5) the CLI header, the README sentence, the
Tests row and the code map are true; (6) no test writes outside the temp folders it owns; (7) HANDOFF and the session
entry are true, including the dropped doctor-quiet residual and the five new residual lines; (8) any MUST.
