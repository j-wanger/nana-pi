# Review — doctor-quiet (doctor prints no Node warning after its summary line), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 4fe70c53..HEAD` on `feat/doctor-quiet` (the lane last merged main at `4fe70c53`, in `f0aa8ad5`;
`git merge-base HEAD main` is `4fe70c53`, and main has since moved on to `f8d20142`, five lands later; the lane has
not merged it, and that merge gets its own confirmation round). The plan of record is
`docs/reviews/doctor-quiet-2026-10-19/must-meet.md`: three must-meet checks, rows R-1750 to R-1752, as amended by
`plan-attack.md`; `build-brief-1.md` is the one build. The seat's record is `seat-verify-f0aa8ad.md`: CI run
39315735365 on all three legs (the Windows log `ci-windows-run-1.log` beside it), the wrong-code pairs
(`seat-mutate.mjs`, `seat-mutate-output-f0aa8ad.txt`: 9 of 9 red, 0 survived) and the independent check
(`independent-check-f0aa8ad.md`: HOLDS, no MUST, two known bugs recorded as HANDOFF residuals).

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at d6e19f1; the seat's notes after it change no row):

```
tree movement 4fe70c5..d6e19f1: 3 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-1750 new (implemented)
  R-1751 new (implemented)
  R-1752 new (implemented)
```

The code under review: `DOCTOR_MUTED_WARNINGS` and `muteDoctorWarnings` in `packages/nana-setup/bin/nana-setup.mjs`,
the call that opens `runDoctor`, and the module header's @outputs and @effects. Tests: the new
`packages/nana-setup/tests/doctor-quiet.test.mjs` and `packages/nana-pack/tests/requirements-tree.test.mjs` (the leaf
total only). Also the nana-setup README (one sentence, one known limit, one Tests row) and the generated tree and code
map. `lib/doctor.mjs` does not change.

Judge whether `nana-setup doctor` now writes neither the SQLite ExperimentalWarning nor the MODULE_TYPELESS_PACKAGE_JSON
warning, with and without `.pi/nana-pack.json` in the working folder (R-1750, R-1751); whether every other Node warning
still reaches stderr under Node's default warning output (R-1752); and whether doctor's stdout, its exit codes and the
other commands keep main's behaviour.

Threat model: honest variation in our tools' output and the OS is in scope (Node versions, macOS, Linux and Windows,
project configs, the caller's `NODE_OPTIONS`, `NODE_NO_WARNINGS` and `--trace-warnings`); deliberate forgery of a
warning's name, code or message is out, and a finding there is a residual. Lane class: install, hook or gate (it
changes `nana-setup doctor`'s output).

Check: (1) R-1750 and R-1751 are not vacuous: each fails on main's bin and proves doctor ran (the banner, the `project
trust` row) before it counts warning lines; (2) R-1752 fails under a blanket mute, a mute of every ExperimentalWarning
or every plain `Warning`, and a filter that does not forward; (3) Node's own warning flags and a user's `warning`
listener behave as on main, apart from the two known bugs the independent check names; (4) doctor's stdout and exit
codes are unchanged, and no other command changed; (5) the test writes only inside its temp folders and removes them;
(6) the three rows match `must-meet.md` as amended, and the README sentence and limit match the code; (7) HANDOFF and
the session entry are true; (8) any MUST.
