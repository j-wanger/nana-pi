# stale-copies-hooks: build brief 1

Feature: FEAT-015 · Diagnose the active environment. Class: install, hook or gate. Follow packages/nana-pack/prompts/builder-preamble.md.
Work in ~/nana-pi-wt/stale-copies-hooks on feat/stale-copies-hooks, based on current main. Run single test files only. Never edit HANDOFF.md or docs/sessions/.
Read first: docs/reviews/stale-copies-hooks-<date>/must-meet.md, then docs/reviews/win-stale-copies-2026-10-19/must-meet.md and its independent-check-e99866d.md.

## Change
1. Rows first, in REQUIREMENTS.md under FEAT-015 after R-1752. Add R-1760 to R-1765 as the must-meet writes them. Retire R-1601 ("superseded by R-1764, 2026-10-19") and R-1602 ("superseded by R-1761, 2026-10-19"). Run `npm run req:tree`.
2. Tests, in packages/nana-setup/tests/stale-copies.test.mjs:
   - Put each `// req:` marker directly above a one-line `check("R-176x: …", …`.
   - Rename the R-1601 check to R-1764. Rename the R-1602 check to R-1761 and widen it to hook link and hook settings rows.
   - Add the four fixture homes. Run each check over the homes the must-meet names.
   - Parse labels from the text before " — tell the user;". Every code span except the last is a path to move.
   - R-1765: hash the path, type, link target and contents of every entry under the home, just before and just after the hook run.
   - Run R-1763 last on each home, inside that platform's withPlatform block. Never move a path outside the fixture home.
3. New packages/nana-setup/lib/hook-health.mjs, with the six-tag header. Move doctor's hook-link loop and settings-row loop into it verbatim, as labelled rows. Doctor maps them to statuses at the same two places.
   - Doctor's rows (label, status, detail, order) stay byte-identical.
   - In doctor.mjs, change only import lines 28-29 and add the new import under them. Do not touch its header or lines 30-36, because win-path-commands edits them.
4. bin/stale-copies.mjs: collect failing labels from hook-health, the rules and the skills, in doctor's order. Only when a skill row fails, call `stepSkills(layout, { dryRun: true })`. A skill whose row there is a problem, and whose doctor row is ✗, adds `path.join(layout.skillsDir, name)` to the paths to move. Update the header.
5. lib/stale-copies.mjs: `staleNotice(labels, movePaths = [])`. With no paths, the output is byte-identical to today's. With paths, the move clause comes before the install command, on the same line. A path codeSpan refuses becomes its skill label. Do not touch nana-rulings.ts.
6. In packages/nana-setup/README.md, update the "Session starts report stale…" sentence and the stale-copies row of the test table. Then run `npm run map`.

## Tests to run (single files)
In packages/nana-setup/tests: stale-copies, win32-degrade, verifier-pipe, doctor-detail, doctor-knowledge, hooks-win32-exec, settings-merge, install, install-check, fresh-machine, retired-artifacts, hook-producers, skills-and-standards, uninstall and restore. Also packages/nana-pack/tests/rulings.test.mjs.
Then run `node scripts/code-map.mjs --check`, `node scripts/readme-check.mjs` and `node scripts/requirements-trace.mjs`.
Before your edits, run skills-and-standards and record its failures on base.

## Wrong code to try (each must turn the named test red, then revert)
- Skip the hook-link rows in the producer → R-1760 (POSIX link-only home) and R-1761.
- Skip the settings rows → R-1760 (win32 hook-only home) and R-1761.
- A producer-local label `settings ${event}` → R-1761.
- Count win32 skipped notes as ✗ → R-1764.
- Put every ✗ skill in the paths to move → R-1762.
- Name the skills folder or the pack source as the path to move → R-1762. R-1763 also fails, and nothing is moved.
- Put the move clause on its own line → R-1762.
- Drop the install command when there are paths to move → R-1760 (occupied homes).
- Call stepSkills without `dryRun` → R-1765.

## Done
- R-1760 to R-1765 pass, and R-1600 and R-1603 to R-1606 pass.
- Every listed file passes, apart from skills-and-standards failures recorded on base.
- The code map, readme and trace checks are clean. No inline tunable and no leaf total are added.
- The installed hook is timed on a current POSIX temp-home install, main against the lane, mean of 5 runs.

## Report (at most 10 lines)
Tip SHA · per-file PASS/FAIL counts · each wrong-code mutation and the test it turned red · hook wall time, main against lane · whether doctor's output diffs on one broken home (main against lane) · deviations from this brief · open questions.