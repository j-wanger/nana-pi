# Review — win-claude-skills (on Windows, Claude Code gets the spec, py-lint, py-review and py-test skills as managed copies), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-015 · Apply the platform's supported installation)

Review `git diff d4423eff..HEAD` on `feat/win-claude-skills` (main was `d4423eff` when the lane last merged it; `git
merge-base HEAD main` is `d4423eff`). Main has since moved to `8a9ff9a3` (the readme-windows-checklist land), so the
land needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/win-claude-skills-2026-10-19/must-meet.md`: eight must-meet checks, new rows R-1900 to R-1903 and pins
of R-351, R-938, R-388 and R-359; build 2 added R-1904. `plan-attack.md` holds the adversary's AMEND;
`build-brief-1.md` and `build-brief-2.md` are the two builds (cc3457a3, merged with main at 942127f4; then fc6ac33d).
The seat's record is `seat-verify-fc6ac33d.md`: CI run 39361156672 on draft pull request #90 at fc6ac33d, 0 failing
files on all three legs (the Windows suite log `ci-windows-fc6ac33d.log` beside it; build 1's red Windows log
`ci-windows-942127f4-build1.log` too), the wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-942127f4.txt`,
7 of 7 red with W1 crashing a test file; `seat-mutate-output-fc6ac33d.txt`, 8 of 8 red, 0 survived) and the
independent check (`independent-check-942127f4.md`: HOLDS, no MUST, nine probes, run on build 1; its K1 is fixed in
build 2, and K2, K3 and K4 are HANDOFF residuals). The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement d4423ef..c5b69e4: 11 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-351 untested -> implemented
  R-359 untested -> implemented
  R-388 untested -> implemented
  R-665 text changed
  R-938 untested -> implemented
  R-1900 new (implemented)
  R-1901 new (implemented)
  R-1902 new (implemented)
  R-1903 new (implemented)
  R-1904 new (implemented)
FEAT-015 · Diagnose the active environment
  R-666 text changed
```

R-665 and R-666 narrow to "WHERE the platform is not win32"; R-669 and R-937 lose the cites of removed checks. The
plan also retired R-939 as a duplicate of R-359 and gave R-1081 an evidence note; the build did neither, and the seat
records the R-939 gap as a residual.

The code under review: in `packages/nana-setup/lib/steps.mjs`, stepSkills' win32 skip of the four and the unused
`skip` helper are gone, and the retired step's win32 skip of the four became a branch (build 2) that leaves a link or
a directory holding `.nana-setup-copy` at those names silent, on every platform. In `lib/doctor.mjs`,
`skillLinkState` on win32 reads ✗ for a link (before the symlink branch) and for a non-directory, each with the move
fix, and diagnose's `skipped (win32; pi-only)` note is gone. `bin/stale-copies.mjs`, which the adoption hook runs at
every Claude Code session start, loses its win32 skip. `DOCTOR_NOTES.win32` in `lib/install-check-config.mjs` drops
the four skill labels, and the R-1081 pin follows. Tests: a new section in `tests/skills-and-standards.test.mjs`;
R-1901 and R-1902 in `tests/retired-artifacts.test.mjs`, whose native-Windows branches collapse into the POSIX checks
or gain win32 variants; R-1904 and an R-351 mirror check in `tests/install.test.mjs`; extended win32 fixtures in
`tests/stale-copies.test.mjs`; `tests/state-manifest.test.mjs`. The setup README's skills row and Windows skills
paragraph change.

Judge whether, on win32, install puts byte-equal marked copies of all five skills in the Claude skills folder and a
second install prints no retired row for them; whether doctor marks each ✓ or ✗ and never as a note; whether an
owner's folder, file, link or junction at one of the four names is refused and left byte-identical, as on macOS;
whether a captured legacy spec copy moves to the dated backup; and whether macOS and Linux install, doctor and the
session-start stale-copy line are unchanged. This lane reverses a written 2026-10-07 design choice (the four skills
skipped on Windows) under the 2026-10-10 priority, with no owner ruling either way; the owner's confirmation is an
optional HANDOFF ask, not a review question.

Threat model: honest variation in our tools' output and the OS is in scope (native win32, forced win32 on macOS and
Linux, the Windows CI legs; an owner's folder, file, symlink or junction at a skill path, a stale copy after a pull, a
file the owner added, a captured legacy copy, CRLF); deliberate forgery, such as a forged `.nana-setup-copy` marker,
is out. Lane class: install, hook or gate — install and doctor in nana-setup, the stale-copies checker the adoption
hook runs, and the install check's note list.

Check: (1) the must-meet checks and R-1904 are not vacuous: each fails on main's code or on the wrong code its pair
names, and none passes on a missing file; (2) the retired step's new marked-copy branch: it is not limited to win32,
so judge whether a marked directory at one of the four names on macOS or Linux, now silent there, can hide anything
stepSkills does not then refuse, and whether an unmarked or unrecognized folder still gets its row; (3) no write
through a link or junction at a skill path, and no owner file changed or lost; (4) nothing main does today stopped
working on macOS, Linux or Windows: install, doctor, the stale-copy line, `install --dry-run`, the install check and
its note list; (5) the tests write only inside the temp folders and temp homes they own and clean up; (6) HANDOFF and
the session entry are true, including the edited "Doctor's skill advice" residual, the new win-claude-skills
residuals and the "Open for Jake" line; (7) any MUST.
