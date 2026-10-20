# win-claude-skills: build brief 1

Feature: FEAT-013 · Install and connect harness runtimes (SUB-015). Class: install/hook/gate. Rows: R-1900 to R-1903, plus pins of R-351, R-938, R-388 and R-359. Work in ~/nana-pi-wt/win-claude-skills on feat/win-claude-skills, branched from current main (27fb9d3c or later). Builder: pi-worker --lane-size larger.
Rules: add exactly the eight checks below and no other new check. Each runs forced (`NANA_SETUP_PLATFORM=win32`) on macOS and Linux, and natively with env {} on win32, as section 4b does. No skips and no new tunable. A missing file must make a check FAIL, never crash it. Run single test files only.

## Change
1. steps.mjs: delete stepSkills' `win() && NEW_CLAUDE_SKILLS` skip, the retired step's win32 skip for the four, and the unused `skip` helper. Rewrite linkSkill's doc comment.
2. doctor.mjs, skillLinkState: on win32, return ✗ for a link before the symlink branch, with "a symlink or junction is there instead of nana-setup's copy of ${source} — move it, then re-run `nana-setup install`". After the posix return, return ✗ for a non-directory, with "a regular file is there instead of …" and the same ending. Delete diagnose's `skipped (win32; pi-only)` branch and the NEW_CLAUDE_SKILLS import.
3. bin/stale-copies.mjs: delete the win32 skip line and drop the NEW_CLAUDE_SKILLS and platform imports.
4. install-check-config.mjs: remove the four "skill …" labels from DOCTOR_NOTES.win32 and fix the comment above it. Update "pin R-1081: the doctor note list" in install-check.test.mjs.
5. skills-and-standards.test.mjs: add a new section after section 6, with one fresh home per fixture. FIVE = ["requirements", "spec", "py-lint", "py-review", "py-test"]; FOUR = FIVE without requirements.
   - R-351: after install, each of FIVE is a real directory, and every file its pack folder ships is byte-equal.
   - R-1900: doctor matches `✓ skill <name>\s+copied from .* \(no symlink on this platform\)` for each of FOUR.
   - Shared fixture: assert each of FIVE holds the marker, then write SKILL.md as "# HAND-WRITTEN <name>" and add owner-notes.md.
     - R-938: doctor matches `✗ skill <name>\s+copy is stale or incomplete \(SKILL\.md\)` for FIVE. Install then exits 0, and each SKILL.md is byte-equal to the pack.
     - R-388: each folder holds exactly one `SKILL.md.bak-*` regular file with the hand-written text, and no skills-folder entry contains `.bak-`.
     - R-359: each owner-notes.md is unchanged, and each marker is still present.
   - R-1903: put a regular file at requirements and at py-test. At spec, put a link to the pack's spec folder: a junction with an absolute target on win32, a dir symlink elsewhere. Doctor reads ✗ "a regular file is there instead of nana-setup's copy" for the files and ✗ "a symlink or junction is there instead of nana-setup's copy" for spec, each ending "— move it, then re-run `nana-setup install`".
6. retired-artifacts.test.mjs:
   - Replace the final forced-win32 block, which holds three skip checks, with R-1901. Put an owner folder with SKILL.md "mine" at each of FOUR. Install and --dry-run must each exit 1, stdout must show `✗ skill <name>` and "a directory is already at … move or remove it", and each folder must be byte-identical afterwards.
   - Add a forced-win32 R-1902 block: copy fixtures/retired/spec to the spec skill path. Install must exit 0, the dated backup must hold skills/spec/SKILL.md, and spec's SKILL.md must be byte-equal to the pack's.
   - Native-Windows branches this change makes false, and only these:
     - Collapse these into the posix check, which now holds on win32: "win32: empty flag moves…", "doctor reads the pi-only spec skip on win32", "win32: rerun succeeds…", "win32: the owner-authored spec directory…", "win32: doctor reports the pi-only spec skip…", "win32: both the edited spec directory…".
     - Give these a win32 variant: "win32: the legacy spec directory is left exactly…" (the pack's spec is a byte-equal SKILL.md copy); "win32: the pi-only foreign skill link…" (exit 1, link intact, "symlink or junction"); "newly managed skill canonical realpath link is accepted" (win32: exit 1, link unchanged, R-352).
     - Leave the alternate-home win32 branch alone; it stays true.
7. Other existing checks this change makes false:
   - install.test.mjs: `skill ${name} is not installed on win32 (pi-only)` becomes a byte-equal mirror check tagged R-351, not R-665.
   - skills-and-standards.test.mjs: delete "win32: requirements backup is a FILE…; new skills stay pi-only"; R-388 replaces it.
   - state-manifest.test.mjs: drop the four from posixOnlyInstallTargets and its comment.
   - stale-copies.test.mjs: breakLegacyWin32 also writes py-lint/SKILL.md, and breakWin32Occupied also replaces spec with an owner folder.
8. REQUIREMENTS.md, as the must-meet says: add R-1900 to R-1903 after R-1426 in SUB-015, and drop R-669's replaced cite. Run `npm run req:tree` and `npm run map`. Update the setup README skills row and its Windows skills paragraph.

## Wrong code to try (restore each one afterwards)
- M1: drop linkSkill's marker write. R-938, R-388 and R-359 go red.
- M2: copy with writeFileSync and no backup. R-388 goes red.
- M3: rmSync the skill folder before mirroring. R-359 goes red.
- M4: drop doctor's two win32 lines. R-1903 goes red.
- M5: keep the retired-step skip. R-1902 goes red.
- M6: make ownSkillCopy return true for the four. R-1901 goes red.
- M7: keep doctor's note branch. R-1900 goes red.
- M8: keep stepSkills' skip. R-351 goes red, along with the rest.
- M9: keep the stale-copies skip. R-1761, R-1762 and R-1763 go red.

## Done
- Each touched test file passes alone with `node scripts/test.mjs <file>`.
- requirements-trace, `node scripts/requirements-tree.mjs --check`, map:check and readme:check all pass.
- The seat, not the builder, runs the full suite, the install check, the mutation runner and the CI legs.

## Report (at most 10 lines)
Give the tip, then PASS and FAIL counts per file. List each wrong version and the checks it turned red. List each edited existing check with its file. Give the trace, tree, map and README results. Name what could not be checked without Windows.