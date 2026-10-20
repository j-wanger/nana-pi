# Review — install-dry-run-pi-packages (the install dry run gives pi's package step install's own answer, up to the first pi install), 2026-10-19 (Opus, the lane's final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-014 · Preserve files and preview installation changes)

Review `git diff d4423eff..HEAD` on `feat/install-dry-run-pi-packages` (main was `d4423eff` when the lane branched; `git
merge-base HEAD main` is `d4423eff`; main has since moved to `8a9ff9a3`, the readme-windows-checklist land, which
changes the setup README's install-check paragraphs, rows, the tree, the code map, HANDOFF and the session archive but
not `steps.mjs` or `pi-registration.test.mjs`, so a merge of main follows before the land). The plan of record is
`docs/reviews/install-dry-run-pi-packages-2026-10-19/must-meet.md` (rows R-358 and R-391 pinned, R-391 narrowed in
place; R-1930 to R-1932 new), with `plan-attack.md` (the adversary's AMEND: R-391 narrowed, the three-line design) and
`build-brief-1.md`, the one build, beside it. The seat's record `seat-verify-30a5baf9.md` holds CI run 39360691316 (0
failing files on macOS, Ubuntu and Windows; install-check passes on macOS and Windows), the seat's wrong-code pairs
(`seat-mutate.mjs`, `seat-mutate-output-30a5baf9.txt`: 10 of 10 red, 0 survived), the independent check
(`independent-check-30a5baf9.md`: HOLDS, two known bugs carried) and the Windows suite log `ci-windows-30a5baf9.log`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main` at 497d2807; the seat's notes commit changes
no row): three rows added, two flipped from untested, one of them reworded.

```
tree movement d4423ef..497d280: 5 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-358 untested -> implemented
  R-391 untested -> implemented; text changed
  R-1930 new (implemented)
  R-1931 new (implemented)
  R-1932 new (implemented)
```

The change under review: three lines of `stepPiRegister` in `packages/nana-setup/lib/steps.mjs` (the early dry-run
return deleted; `if (install && o.dryRun) return { status: 0 };` in `launch` right after the refusal check; the final
detail chosen by `o.dryRun`), two new blocks in `packages/nana-setup/tests/pi-registration.test.mjs`, two sentences of
the setup README, REQUIREMENTS.md and the tree. Judge whether the dry run now reports exactly what install reports
whenever install decides the step before its first `pi install`: the `--home` skip, no pi on PATH, a version check that
fails or cannot start, and a launch refusal for any package root on Windows, with exit 1 for each ✗. Judge whether it
says would add otherwise and starts no `pi install` on any path. Judge whether the dry-run stop sits after every check
install runs and before the only spawn that carries `install`. On the real home with nana unregistered, the dry run now
starts `pi --version`; judge whether that trade is acceptable (doctor runs the same probe; the independent check's probe
6 found nothing nana owns written; the missing timeout is a carried residual). Judge whether install's own rows, spawns
and exit codes are unchanged. R-391 is narrowed to an unregistered extension directory, because a registered `--home`
reports unchanged, which R-323's check pins; judge whether the narrowed row is still no wider than its check. The CLI
block swaps `process.env.PATH` and restores it in `finally`; its R-358 anchor calls `stepPiRegister` with `isRealHome`
forced true, so it starts the recording pi's `install` against the real repo's package roots with the temp `--home`
pi folder; judge whether any of it writes outside the temp folders it owns. The build put the README's dry-run sentence
in the install table's pi packages row, not in the test-table cell must-meet named; judge whether both README sentences
are true. Only the CLI dry-runs this step: the session-start stale-copies check dry-runs only the skills step, and every
test dry run passes `--home` or `--pi-home` (plan-attack; independent check probe 11).

Threat model: honest variation in our tools' output and the OS in scope: macOS, Linux and Windows on Node 22; `--home`
test homes; pi missing from PATH; a Windows pi shim or checkout path holding a character the launcher refuses; a pi
whose version check fails or cannot start. Deliberate forgery out (a pi built to pass `--version` and then lie). Lane
class: install, hook or gate — nana-setup install's pi packages step and its dry run. It gets the land reviewer, the
seat's wrong-code pairs and one independent check; the seat runs the macOS install check before nana-land.

Check: (1) the must-meet checks are not vacuous: each reds on main's three lines (W1) and on the wrong code the plan
names (W2 to W10), and each row is no wider than its check; (2) the dry run starts no `pi install` on any path and
matches install on every path install decides before its first `pi install`; (3) install's own behaviour is unchanged
on macOS, Linux and Windows; (4) no test writes outside the temp folders it owns, the CLI block restores PATH, and each
block removes what it made; (5) nothing else changed, and the regenerated tree matches a fresh run; (6) the plan's known
limits and the independent check's two findings are HANDOFF residuals, and none hides a bug that stops the feature; (7)
HANDOFF and the session entry are true, including the seat items carried from other lanes; (8) any MUST.

## Chain note (the seat, after this brief was written)

Since `adf296a2`, the seat merged `bffa2f2d`, the hook-output-fail-open lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `bffa2f2d` becomes main before this lane lands. Review this lane's own change as `git diff bffa2f2d...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff d4c9400e` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base bffa2f2d`):

```
tree movement bffa2f2..d4c9400: 5 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-358 untested -> implemented
  R-391 untested -> implemented; text changed
  R-1930 new (implemented)
  R-1931 new (implemented)
  R-1932 new (implemented)
```
