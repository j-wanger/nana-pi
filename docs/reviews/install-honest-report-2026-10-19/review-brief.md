# Review — install-honest-report (install tells the truth about a held lock and its own skill links), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff 713d6aa..HEAD` on `feat/install-honest-report` (main is `27603d4` as this brief is written; `git
merge-base HEAD main` is `713d6aa`, merged at cc2c4ed). The lane's own commits: `git log --oneline --first-parent
a1ea491..HEAD`. The plan of record is `docs/reviews/install-honest-report-2026-10-19/must-meet.md` (R-1590 to R-1593,
under SUB-014, plus a `req:` tag that flips R-926 to implemented); `plan-attack.md` holds the adversary's amendments,
`build-brief-1.md` the build and `build-brief-1b.md` its finish after a launcher stall. The seat's record is
`seat-verify-702b9bc.md`: CI on all three legs (the Windows log beside it), the wrong-code pairs (`seat-mutate.mjs`,
output beside it, 8 of 9 red, M9 declared) and the independent check (`independent-check-702b9bc.md`, FINDINGS: F1, a
MUST, fixed in 702b9bc; F2, a known bug, recorded as a residual).

Tree movement (the lane's own report, `node scripts/requirements-moved.mjs --root . --base 713d6aa`):

```
tree movement 713d6aa..1244b00: 5 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-926 untested -> implemented
  R-1590 new (implemented)
  R-1591 new (implemented)
  R-1592 new (implemented)
  R-1593 new (implemented)
```

The code under review: `install()`, `stepSettings` and `stepRetiredArtifacts` in `packages/nana-setup/lib/steps.mjs`,
with the nana-setup README's lock paragraph and table rows. Judge whether install, outside a dry run, takes the settings
lock before its first write and holds it through the settings write, so a held lock leaves the home unchanged and
"Nothing was written" is true; whether the lock is released on success and on a throw; and whether a re-run over the
skill links install made prints no retired row and no extra skipped rows, while every link that is not nana's own is
still reported.

Threat model: honest variation in our tools' output and the OS is in scope — a lock left by an interrupted run (any
pid, any age, unreadable content), a second nana-setup run at the same time, skill links install made, a canonical link
spelled relatively, a link to another pack skill or an outside folder, a link at a legacy skill name install no longer
links, win32; deliberate forgery (a crafted lock, a planted look-alike pack tree) is out. Lane class: install
(nana-setup install: the settings lock and the retired-artifacts report).

Check: (1) R-1590 to R-1593 and their tests are not vacuous, and each red-today check fails on main's code; (2) install
takes the lock before its first write rather than only checking for it there and taking it at the settings step (M9,
which no test catches: read `install()`); (3) a held lock leaves the home unchanged, a dry run is never blocked, and no
lock is left after a normal run or a throw; (4) a link at spec, py-lint, py-review or py-test is still reported by its
skill row, and every other retired entry reports as before; (5) nothing main does today stopped working on macOS, Linux
or Windows; (6) HANDOFF and the session entry are true; (7) any MUST.
