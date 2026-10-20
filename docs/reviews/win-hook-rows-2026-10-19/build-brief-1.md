# Build brief · win-hook-rows (builder: Claude Sonnet subagent, simple lane)

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate.
Follow packages/nana-pack/prompts/builder-preamble.md. Work in ~/nana-pi-wt/win-hook-rows on feat/win-hook-rows, branched from main. Use rows R-1860 and R-1861 only. Read must-meet.md in this folder first.

## Change
1. REQUIREMENTS.md, rows first:
   - Add R-1860 and then R-1861 to SUB-015's table after R-1051, worded as in must-meet.md, status `planned`.
   - Replace R-349's text with the narrowed text from must-meet.md. Keep it `untested`.
   - In R-937's evidence, delete the `win32 doctor: ${label} reads skipped (win32)` title and its parenthetical.
2. Tests first, in packages/nana-setup/tests/win32-degrade.test.mjs:
   - Delete the untagged `win32: ${label} reports skipped (win32)` loop over the first install.
   - After `win32Wanted` is defined, add the R-1860 check over the first install's `r.stdout`.
   - Replace the R-937 `win32 doctor: ${label} reads skipped (win32)` loop and its comment with the R-1861 check over `doc.stdout`.
   - Script names: the `win32Wanted` entries whose `spec.script` exists in packages/nana-setup/claude/hooks (use fs.existsSync, not a path-prefix compare). Require exactly 5.
   - Label: `/^\s*\S\s(.+?)\s{2,}/`. Each check also requires all six `settings ${w.label}` labels in the same output.
   - Drop the now-unused `HOOKS` import. Put each `// req:` line directly above its `check("title", …` line.
   - Run the file and see both checks red before changing code.
3. lib/steps.mjs stepHooks: return [] on win32. Keep `skip`, because the skill step uses it.
4. lib/hook-health.mjs:
   - hookLinkRows returns [] on win32.
   - Drop `skipped` from every row in both functions.
   - The @outputs line should read "ok and detail fields".
5. lib/doctor.mjs: the hook link row becomes `row.ok ? OK : FAIL`. In bin/stale-copies.mjs, both loops test `!row.ok` only.
6. Install-check files. pi-seat-live-turn is building in these, so change only these lines:
   - lib/install-check-config.mjs: drop the five `hook <script>` labels from DOCTOR_NOTES.win32. In the comment above, replace the hooks-lane clause with "win32 hook-file rows removed by R-1861, 2026-10-19".
   - tests/install-check.test.mjs: make the R-1081 pin's win32 line match.
7. packages/nana-setup/README.md, with no owner name and no machine path:
   - Native Windows paragraph: add one sentence saying Windows gets no hook file copy, so install and doctor list each hook only by its settings row.
   - Test-table win32-degrade cell: add "install and doctor printing no hook-file row".
8. docs/reviews/win-hook-rows-2026-10-19/test-title-map.json: map the two removed titles to the two new ones, each with a one-line `why`. Follow the format of docs/reviews/cc-hooks-windows-2026-10-12/test-title-map.json.
9. Flip R-1860 and R-1861 to `implemented` with their evidence. Run `npm run map` and `npm run req:tree`. Then `npm run map:check` and `npm run readme:check` must exit 0.

## Wrong code to try (each must turn the named test red, then revert)
- Filter in doctor only and leave stepHooks: R-1860.
- Return [] from stepHooks only: R-1861.
- Delete hookLinkRows' win32 branch: R-937 "win32 doctor prints no ✗", stale-copies R-1764 and R-1861.
- hookLinkRows returns [] on every platform: install.test "doctor marks the missing piece with ✗" (R-341) and stale-copies R-1761.
- stepHooks returns [] on every platform: install.test "hook ${h} is a symlink into the repo" (R-301).
- Keep the win32 rows with a new detail such as "runs from the checkout": R-1860 and R-1861.

## Run
Run single files only, each with `node <file>`: win32-degrade, stale-copies, install, install-check, doctor-quiet and retired-artifacts under packages/nana-setup/tests. Do not push. The seat runs `npm run test:locked`, the mutation runner, the macOS install check and the Windows CI legs.

## Done
- Both must-meet checks were seen red before the code change and pass after it.
- Every named file exits 0, and each wrong-code pair was seen red.
- map:check and readme:check exit 0.
- HANDOFF.md and docs/sessions are untouched.

## Report (10 lines or fewer)
VERDICT; commits; rows flipped; per new test, its title and the wrong code seen red; edits to existing tests; each single-file command with its exit code; map:check and readme:check exit codes; what was not done.