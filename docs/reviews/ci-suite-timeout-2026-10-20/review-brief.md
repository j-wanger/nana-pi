# Review — ci-suite-timeout (a hung CI test leg stops after 90 minutes, not GitHub's six-hour default), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-019 · Release usable templates and report support

Review `git diff 385c633f..HEAD` on `feat/ci-suite-timeout` (main was `385c633f` when this brief was written; `git
merge-base HEAD main` is `385c633f`). The plan of record is `docs/reviews/ci-suite-timeout-2026-10-20/must-meet.md`:
two must-meet tests, rows R-2060 and R-2061, with its design, provenance and known limits. `plan-attack.md` holds the
adversary's AMEND (60 raised to 90 on 409 measured runs; R-2061 narrowed; the README sentence dropped);
`build-brief-1.md` is the one build (10dc31bf, 6d87702a), and 155ef222 merges main 385c633f, its one conflict the
generated tree's CAP-04 line. The seat's record is `seat-verify-155ef222.md`: CI run 39384632077 on draft pull
request #108 at 155ef222, 0 failing files on all three legs (the Windows suite log `ci-windows-155ef222.log` beside
it), the Windows suite job at 32.0 minutes against the new 90, and the builder's nine wrong versions as relayed.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`; it compares against the merge base
385c633f):

```
tree movement 385c633..155ef22: 2 rows in 1 features
FEAT-019 · Release usable templates and report support
  R-2060 new (implemented)
  R-2061 new (implemented)
```

CAP-04 moves from 443 to 445 rows and FEAT-019 from 23 to 25. No existing row changed.

The change under review: `.github/workflows/ci.yml` adds a five-line `chosen` comment and `    timeout-minutes: 90`
to the suite job, between `runs-on` and `continue-on-error`; the release and install-check jobs do not change.
`packages/nana-pack/tests/ci-workflow.test.mjs` appends the contract constant `GITHUB_DEFAULT_JOB_TIMEOUT_MINUTES =
360` and the checks for R-2060 and R-2061 before `if (failures)`. REQUIREMENTS.md adds both rows after R-1531, and the
tree is regenerated.

Judge whether every suite leg (macOS, Linux, Windows) now carries one job-level limit that GitHub reads as 90
minutes; whether the two checks fail on the wrong code the plan lists and stay green on the 13 older checks' cases;
whether the comment holds none of the strings the older checks find by first occurrence; and whether the provenance
in the comment and the plan matches the measurement it cites.

Threat model: honest variation in our tools' output and the OS is in scope (runner speed, suite growth, a hung setup
step, a runner the per-file kill does not end, on any of the three systems); deliberate forgery of the workflow is
out. That GitHub cancels a job at its limit is GitHub's documented behaviour, a declared limit, not a finding. Lane
class: ordinary — the root CI workflow's suite job, one pack test file and the requirement files.

Check: (1) the must-meet checks are not vacuous: each fails on main's workflow and on the wrong code the plan names
for it, and R-2061 is the only place the literal 90 appears in the test file; (2) the limit sits at job level in the
suite job, applies to every matrix leg, and leaves R-597's suite match, the release job's needs and the Linux leg's
continue-on-error unchanged; (3) the sealed value carries its provenance beside it, and the comment adds no machine
path or private name to a public file; (4) nothing else changed; (5) HANDOFF and the session entry are true, including
the removed win-leg-flip residual, the lane's new residuals and the seat items; (6) any MUST.
