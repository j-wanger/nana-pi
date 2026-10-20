# Review — win-claude-skills (on Windows, Claude Code gets the spec, py-lint, py-review and py-test skills as managed copies), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-015 · Apply the platform's supported installation)

Review `git diff d4423eff..HEAD` on `feat/win-claude-skills` (main was `d4423eff` when the lane last merged it; `git
merge-base HEAD main` is `d4423eff`). Main has since moved to `8a9ff9a3` (the readme-windows-checklist land), so the
land needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/win-claude-skills-2026-10-19/must-meet.md`: eight must-meet checks, new rows R-1900 to R-1903 and pins
of R-351, R-938, R-388 and R-359; build 2 added R-1904. `plan-attack.md` holds the adversary's AMEND;
`build-brief-1.md` and `build-brief-2.md` are the two builds (cc3457a3, merged with main at 942127f4; then fc6ac33d).
The seat's record is `seat-verify-fc6ac33d.md`: CI run 39361156672 on macOS, Ubuntu and Windows at fc6ac33d, 0 failing
files on each (`ci-windows-fc6ac33d.log` beside it, and build 1's red `ci-windows-942127f4-build1.log`), the
wrong-code pairs (`seat-mutate.mjs`; 7 of 7 red on 942127f4 and 8 of 8 red on fc6ac33d, 0 survived) and the
independent check (`independent-check-942127f4.md`: HOLDS, no MUST, nine probes, run on build 1). The final
reviewer's brief is `review-brief.md`. The local macOS install check runs before the land.

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

The code under review: stepSkills in `packages/nana-setup/lib/steps.mjs` now copies all five skills on win32; the
retired step leaves a link or a directory holding `.nana-setup-copy` at spec, py-lint, py-review or py-test silent, on
every platform (build 2). `skillLinkState` in `lib/doctor.mjs` reads ✗ on win32 for a link or a regular file at a
skill path, with the move fix, and doctor no longer prints the four as notes. `bin/stale-copies.mjs`, which the
adoption hook runs at every Claude Code session start, now judges the four on win32. `DOCTOR_NOTES.win32`
(`lib/install-check-config.mjs`) drops the four skill labels, so the Windows install check now fails any note row for
them.

Judge whether the lane fails open: a link, junction, regular file or owner's folder at a managed skill path written
through, replaced or backed up into, or reading ✓ in doctor; a stale or missing copy that doctor or the session-start
line no longer names; or the retired step's new silent branch letting a folder nana-setup did not make, at one of the
four names, pass on any platform without stepSkills refusing it. Judge whether it leaves a harm the review standard
lists: data lost or corrupted (an owner's SKILL.md or added file, a legacy copy), a broken install, doctor run or
hook, or a test writing outside the temp folders and temp homes it owns. Judge whether anything main does today
stopped working: install's skill links, doctor's skill rows and the stale-copy line on macOS and Linux; the
requirements skill's copy, refresh and refusal on Windows; `install --dry-run`; and both CI install-check legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: a CRLF or
edited legacy copy of the four now makes win32 install exit 1, where main skipped it with exit 0 (nothing is lost; the
move fix prints); backups of nana-setup's own earlier copies pile up inside each skill folder over pulls; R-1900's
check needs doctor's overall exit 0; the first Claude Code session after this lands on Windows names the four as
missing until install runs.

Threat model: honest variation in our tools' output and the OS is in scope (native win32, forced win32 on macOS and
Linux, the Windows CI legs; an owner's folder, file, symlink or junction at a skill path, a stale copy after a pull, a
file the owner added, a captured legacy copy, CRLF); deliberate forgery, such as a forged `.nana-setup-copy` marker,
is out. Lane class: install, hook or gate — install and doctor in nana-setup, the stale-copies checker the adoption
hook runs, and the install check's note list.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Chain note (the seat, after this brief was written)

Since `a0e11f1d`, the seat merged `e3b73c90`, the install-dry-run-pi-packages lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `e3b73c90` becomes main before this lane lands. Review this lane's own change as `git diff e3b73c90...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff da70c957` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base e3b73c90`):

```
tree movement e3b73c9..da70c95: 11 rows in 2 features
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
