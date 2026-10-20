# Must-meet · win-hook-rows

Feature: FEAT-013 · Install and connect harness runtimes
Lane class: install, hook or gate. It changes install and doctor output and bin/stale-copies.mjs, which the adoption hook runs.
Threat model: honest variation in our tools' output, platforms and configs is in scope. That covers native win32, forced win32 on POSIX, the Windows CI legs, and homes with or without a Claude hooks folder. Deliberate forgery is out of scope.

## The feature
On win32, install and doctor print no row whose label contains one of the five Claude Code hook script file names. Each hook appears only as its settings row, and doctor judges that row ✓ or ✗ (R-1055).
Why: on Windows the hooks run in exec form from the checkout. Today both commands print five "hook <script> … skipped (win32)" rows directly above the six settings rows that wire those same scripts. A Windows reader is told the hooks are skipped while they are active.

## Today (probe: temp clone of main c827fcf8, temp HOME, forced win32)
- install printed `– hook <script>  skipped  skipped (win32)` for all five scripts. Its summary read "11 skipped".
- doctor printed `· hook <script>  skipped (win32)` for all five, then six ✓ settings rows.
- The two checks below, run as a probe script, gave 5 hits in install and 5 in doctor, so both are red. A prototype dropped the rows in stepHooks and hookLinkRows and removed the `skipped` field. On it both checks are green with 0 hits, and the guard holds.
- On the prototype, win32-degrade fails only its 8 old skip-row checks. stale-copies, install, doctor-quiet, retired-artifacts, hook-producers, doctor-detail, doctor-runtime and rulings-install exit 0. hooks-win32-exec and skills-and-standards fail the same way on main and the prototype in the probe sandbox, so they are not evidence either way.

## Design: drop the rows, do not reword them
A reworded row would repeat the settings row below it and could never read ✗.
1. lib/steps.mjs stepHooks returns [] on win32.
2. lib/hook-health.mjs hookLinkRows returns [] on win32. Drop the `skipped` field from both row builders, and update @outputs.
3. lib/doctor.mjs and bin/stale-copies.mjs read `ok` only.
4. lib/install-check-config.mjs: drop the five `hook <script>` labels from DOCTOR_NOTES.win32, and make the R-1081 pin match. With the prune, the Windows install-check leg fails any returning hook-file note row as off-list, including a relabelled one. That makes it a native guard.
5. REQUIREMENTS.md:
   - Put R-1860 and R-1861 in SUB-015 after R-1051. R-1615, a win32 doctor row, already sits there as precedent.
   - Narrow untested R-349 so it no longer contradicts R-1860. New text: "WHERE the platform is win32, every posix-only step shall create nothing and, except the Claude Code hook-file link step, report skipped (win32)."
   - Remove the per-hook "reads skipped (win32)" title from R-937's evidence. R-937's text stays as it is.
6. packages/nana-setup/README.md:
   - Add one sentence to the native Windows paragraph.
   - Update the win32-degrade cell in the test table.

## Must-meet
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-1860 | WHERE the platform is win32, install shall print no result row whose label contains the file name of the objective, adoption, shared-memory, roster notice or verifier-pipe hook script. | packages/nana-setup/tests/win32-degrade.test.mjs::win32 install prints no row labelled with a Claude Code hook script | yes: the probe found 5 such labels in install output |
| R-1861 | WHERE the platform is win32, doctor shall print no row whose label contains the file name of the objective, adoption, shared-memory, roster notice or verifier-pipe hook script. | packages/nana-setup/tests/win32-degrade.test.mjs::win32 doctor prints no row labelled with a Claude Code hook script | yes: the probe found 5 such labels in doctor output |

How the tests work:
- Label: `/^\s*\S\s(.+?)\s{2,}/`. That is the text after the one-character mark and its space, up to the first run of two or more spaces. Both printers in bin/nana-setup.mjs pad the label and then add two spaces.
- Script names: the `win32Wanted` entries whose `spec.script` exists as a file in packages/nana-setup/claude/hooks. Each check requires exactly 5, so it cannot pass on an empty list.
- Guard: the same parse must also find all six `settings <label>` labels in that output. A format change therefore cannot make a check pass with no labels.
- No skip: the file forces win32 on every host, and it runs natively on the Windows leg.

## Existing guards that must stay green (no new rows)
- win32-degrade: R-937 "win32 doctor exits 0" and "prints no ✗". R-1055: all six settings rows ✓.
- stale-copies: R-1760, R-1761, R-1763 and R-1764, posix and win32 fixtures.
- install.test: R-301 hook symlinks, and R-341 "doctor marks the missing piece with ✗".
- install-check.test: the R-1081 pin, updated to the pruned list.

## Known limits
- Both tests key on script file names. A win32 row relabelled without its file name, such as "hook objective", would pass both tests. Only the Windows install-check leg's note list would catch such a doctor row.
- `install --dry-run` runs the same stepHooks, but only a real install is checked.
- The proof here is forced win32 on macOS. The Windows suite leg and the Windows install-check leg carry the native proof.
- R-349 stays untested. Any pin of it, including one from install-pins, must not assert hook-file rows.
- The desk service's "skipped (win32)" row does not change.
- docs/reviews/win-hook-rows-2026-10-19/test-title-map.json maps the removed titles to their replacements.
- Seat duties:
  - Before the final round, remove HANDOFF's sentence about the hook-file rows reading "skipped (win32)".
  - Run the lane's mutation runner.
  - Run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carry its output in the final review and the land.
  - Run the macOS install check before nana-land.