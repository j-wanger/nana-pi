# Review — install-cli-pins (tests pin eight existing install promises; two duplicate rows retire), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (R-383 is also on FEAT-014 · Create or adopt a project
workspace, through its Also applies line)

Review `git diff 385c633f..HEAD` on `feat/install-cli-pins` (`git merge-base HEAD main` is `385c633f`, the main the
lane last merged; main has since moved to `445f4d5b`, the ci-suite-timeout and knowledge-index-pins lands, which touch
none of the lane's test files). The plan of record is `docs/reviews/install-cli-pins-2026-10-20/must-meet.md`: a pin
lane over eight existing untested rows, R-932, R-383, R-315, R-320, R-317, R-349, R-384 and R-927, plus two
retirements, R-739 (duplicate of R-302) and R-939 (duplicate of R-359), with no new row and no product code (the
R-2040 to R-2049 block stays unused). `plan-attack.md` holds the adversary's AMEND (class ordinary; two more R-317
must-not cases; padded-label match for R-349; `endsWith` for R-927; the `registered as` row as R-384's evidence;
host-platform `entryInvokes` for R-320's accepted side; R-383's re-seed of one home). `build-brief-1.md` is the one
build (b3753a3f), merged with main 385c633f at 197edd87. The seat's record is `seat-verify-197edd87.md`: CI run
39386603117 on draft pull request #112 at 197edd87, 0 failing files on all three legs (macOS after one re-run of an
unrelated mutation-runner check), with the Windows suite log `ci-windows-197edd87.log` and the failed macOS attempt's
log `ci-macos-197edd87-attempt1.log` beside it. No seat pairs and no independent check: an ordinary lane.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, against the merge base 385c633f; the seat's
notes commit changes no row): ten rows re-statused, none added, reworded or moved.

```
tree movement 385c633..197edd8: 10 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-315 untested -> implemented
  R-317 untested -> implemented
  R-320 untested -> implemented
  R-349 untested -> implemented
  R-383 untested -> implemented; also applies: FEAT-014
  R-384 untested -> implemented
  R-739 untested -> retired
  R-927 untested -> implemented
  R-932 untested -> implemented
  R-939 untested -> retired
```

The change under review: eight new checks in five `packages/nana-setup/tests` files, each under its `// req:` marker
with the must-meet title: install.test.mjs (R-383: install, its dry run and `project` compared with and without
`--yes` on one re-seeded home; R-315: install with `n` on stdin and no terminal; `freshHome` gains an optional path
it wipes and re-seeds), settings-merge.test.mjs (R-317: a 19-command `commandInvokes` table; R-320: ten refused and
three accepted settings bodies through install), win32-degrade.test.mjs (R-349: forced-win32 `install --desk` and its
dry run), pi-registration.test.mjs (R-384: both directions inside the throwaway-worktree block; R-927: install's and
doctor's pi packages rows end with `registered as <rel>`), relative-agent-dir.test.mjs (R-932: `install --pi-home
explicit-rel` under the ambient relative `PI_CODING_AGENT_DIR`). REQUIREMENTS.md: the eight Evidence cells, the two
retirements with text kept, and open question 14's "R-739's half closed on 2026-10-20." No `lib/`, `bin/`, `claude/`,
extension, code map or tree file change.

Judge whether each of the eight rows now has a check that fails when the code breaks the row, and whether each row is
no wider than its check. Judge whether R-320's ten refused bodies reach every rung of preflight's shape validation and
whether its accepted side would catch a preflight that refused a blank file. Judge whether R-384's direction B really
runs this checkout's install against the worktree's entries, and whether either direction can pass while adding an
entry. Judge whether R-383's re-seed of the same home can hide a difference, or fail on a Windows file handle. Judge
whether the retirements are true duplicates: R-739 of R-302 and R-939 of R-359, with no test marker citing either.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and native Windows; forced
win32 on POSIX; CI temp roots and drives; padded install labels; Windows paths in output). Deliberate forgery of
settings files, pi entries or git folders is out. Lane class: ordinary — tests and REQUIREMENTS.md only; no install,
uninstall or doctor code, no Claude Code hook, no pi extension, no gate policy, no land or review tool (precedent
install-pins, 2026-10-19). The tests sit under `packages/nana-setup`, so the seat runs the macOS install check before
the land.

Check: (1) the must-meet checks are not vacuous: each reds on the wrong code the plan names (the builder's report:
R-932 2/2, R-383 3/3, R-315 1/1, R-320 8/8, R-317 9/9, R-349 4/4, R-384 2/2, R-927 2/2, all on macOS; none ran on
Windows); (2) the eight checks run on every leg with no new skip, and the Windows leg's PASS lines are real; (3) the
tests write only inside the temp folders they own and the throwaway worktree the block already adds and prunes, and
never touch the real home; (4) nothing else changed: existing checks are untouched apart from `freshHome`'s optional
path, and REQUIREMENTS.md changed only the ten rows and question 14; (5) the plan's known limits are recorded as
HANDOFF residuals or in the seat's record, and none hides a bug that stops the feature; (6) HANDOFF and the session
entry are true, including the rewritten win-hook-rows line, the dropped win-claude-skills ledger line, the edited
builder-briefs line and the new mutation-runner line; (7) any MUST.

## Chain note (the seat, after this brief was written)

Since `52980f3a`, the seat merged `54f1271f`, the config-advice-fixes lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `54f1271f` becomes main before this lane lands. Review this lane's own change as `git diff 54f1271f...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 588f3e3f` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 54f1271f`):

```
tree movement 54f1271..588f3e3: 10 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-315 untested -> implemented
  R-317 untested -> implemented
  R-320 untested -> implemented
  R-349 untested -> implemented
  R-383 untested -> implemented; also applies: FEAT-014
  R-384 untested -> implemented
  R-739 untested -> retired
  R-927 untested -> implemented
  R-932 untested -> implemented
  R-939 untested -> retired
```
