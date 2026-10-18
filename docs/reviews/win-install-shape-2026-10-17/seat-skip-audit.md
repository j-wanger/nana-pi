# Seat skip audit — win-install-shape at 41b0196 (2026-10-18)

Five read-only checkers (one per test file) and one completeness critic, run by the seat before the final review, against the bar
that sent the handoff lane back: every Windows skip names a case that cannot exist on Windows, and every skip prints its reason.

## Critic

MUST: 7

The bar is applied as the file checkers applied it: a false skip reason, a silent drop of whole checks, or a lane check that passes with its behaviour removed. Three of the seven come from this lane. Four are older guards in files the lane owns.

MUST
1. packages/nana-setup/tests/install.test.mjs:121 and :183 (from checker SHOULD to MUST). Must-meet IS1 says that on Windows this file "asserts … exec-form hook entries". It does not.
   - The check at :183 uses `entryInvokes(h, spec, platform())`. On win32 with no `args`, that falls back to `commandInvokes` (settings.mjs:152-157).
   - Doctor on win32 reads hooks the same way, through `hasHook`/`hookTargets` (doctor.mjs:387-401).
   - So a shell-form entry anchored in the checkout keeps every Windows check in this file green.
   - The product is still protected: hooks-win32-exec.test.mjs:100 pins exec form on Windows (30 pass in run 2).
   - IS1's claim about this file is false. The SKIP text "checked below through entryInvokes" overclaims.
   - Fix: one win32 check that `command === "node"` and `args` is an array.
2. packages/nana-setup/tests/retired-artifacts.test.mjs:294-299. Confirmed false. The win32 replacement for R-663's alternate-Claude-home scoping passes with the scoping removed.
   - Both homes hold only `spec`, and win32 drops it at steps.mjs:263, before `artifactHome` is chosen at :265.
   - Probe on this Mac: an install forced to win32 with `--claude-home alt`, an empty `enforce` in both homes. It exited 0, moved alt/enforce to alt/backups/2026-10-18-retired/enforce, and left the default home's .claude/enforce in place.
   - So the case exists on Windows, and the suggested fixture works.
3. packages/nana-setup/tests/state-manifest.test.mjs:147. Confirmed false.
   - The product check at nana-setup.mjs:278, `/[\u0000-\u001f\u007f]/`, has no platform guard.
   - Win32 names forbid only codes 1-31 and <>:"/\|?*, so a DEL in a name is legal. That rests on the Win32 naming rules and was not run on Windows.
   - A `bad\u007fname.md` stand-in keeps the check on Windows.
4. packages/nana-setup/tests/install.test.mjs:411 (existed before the lane). A silent guard drops 6 checks on Windows. Run 2 shows only "space in home: install exits 0" and "doctor exits 0" (log 5632-5633). The reason is true (R-319 does not apply on win32; hooks-win32-exec.test.mjs:141 covers Windows). The guard just needs a printed SKIP line.
5. packages/nana-setup/tests/skills-and-standards.test.mjs:365, section 7d (existed before the lane). A silent guard drops 3 checks. The log goes from the 7c lines straight to SUMMARY (around 6345-6346). The reason is true, so the fix is a printed SKIP line.
6. packages/nana-setup/tests/skills-and-standards.test.mjs:278, section 7a (existed before the lane). Confirmed false.
   - "Forcing the branch is only meaningful off win32" is a reason not to force the platform, not a reason to skip on Windows.
   - The R-352 guard (`mirrorDirsProblem`, reached only under `win()` at steps.mjs:220) has never run on Windows.
   - The runner can make links: 7c makes rule symlinks there and passes (log 6340-6345). The cases at :302-307 need no link at all.
   - Not run on Windows here: a junction reading as a link through lstat, and readlink equality.
7. packages/nana-setup/tests/skills-and-standards.test.mjs:222, section 6 (existed before the lane). Confirmed false: the forced env changes nothing on Windows.
   - Not run anywhere on Windows: doctor's stale-copy ✗ (doctor.mjs:101-110, win32-only; grep finds "stale or incomplete" only at :242) and install's "N files copied" detail (:234).
   - Windows covers the rest: section 4's win32 branch, plus install.test.mjs:165 for the single skills-root entry.

The lane itself introduced MUSTs 1-3 (the lane's own must-meet IS1 and its own added checks). MUSTs 4-7 are older guards that count only under the bar's skip-honesty rule. The seat may record them as residuals instead.

Re-checks of the other "false" and "unclear" verdicts
- packages/nana-setup/tests/uninstall.test.mjs:44. I agree the reason is false, but I rate it SHOULD, not MUST.
  - On win32 a run with no flag exits 2 with the home unchanged even if the mode check at bin:130 is removed, because the platform guard at :131 also exits 2. So the check cannot catch a missing mode check on Windows.
  - :421 already pins R-900's win32 refusal on Windows, for both `--yes` and `--dry-run --yes`.
  - It does depart from the plan: rows.json:600 said to gate from :40 onward, and this check passed on Windows before the lane.
  - Fix: move lines 36-45 above the gate.
- packages/nana-setup/tests/uninstall.test.mjs:88 (and :93, :105). The reason is false, and I rate it NOTE. These are pure string-logic checks with no platform branch and no file access, so a Windows run adds nothing the Mac run lacks.
- packages/nana-setup/tests/retired-artifacts.test.mjs:325. Honest for `spec`. The "is reported" half of the check has no Windows check anywhere (SHOULD below).

SHOULD
- packages/nana-setup/tests/retired-artifacts.test.mjs:362. The win32 branch does not assert "unrecognized kind or provenance" in stdout, though dev-check reaches steps.mjs:271-273 on win32.
- packages/nana-setup/tests/retired-artifacts.test.mjs:394. "newly managed skill canonical realpath link is accepted" passes without testing anything on win32, because spec is never examined there (log 6004 shows PASS under R-665). It should print a SKIP instead.
- packages/nana-setup/tests/state-manifest.test.mjs:75. 13 existence sub-assertions drop silently on win32. No whole check is lost, and install.test.mjs pins their absence.

NOTE
- packages/nana-setup/tests/skills-and-standards.test.mjs:336 (missed by the checker). On Windows, 7c runs one iteration where the Mac runs two, so 6 checks drop with no SKIP line. This is a substitution, not lost coverage: the posix relink cannot happen on win32, and the win32 shape still runs. It only breaks the count arithmetic.
- At HEAD 41b0196, HANDOFF.md and docs/sessions carry neither the occupied-folder known bug nor the quoted-context gap. seat-verify-bd33b92.md says HANDOFF has the occupied-folder entry. Meanwhile, skills-and-standards.test.mjs:626 asserts that bug's exit 0 as passing. Both entries must be in the reviewed change before the final round.
- packages/nana-setup/tests/skills-and-standards.test.mjs:203 and :316. These two SKIP lines do not increment `skips`, so the file reports SKIP=2 while the runner reports 4.
- packages/nana-setup/tests/install.test.mjs:303 merges two checks into one with no SKIP line.
- Several comments are wrong: install.test.mjs:137 ("needs a privilege"; the runner makes symlinks), :330 ("POSIX-only by construction"), :33 (the CRLF cause; .gitattributes forces LF); skills-and-standards.test.mjs:108, :156, :178 and the @purpose at :3; uninstall.test.mjs:424 (the guard order is backwards).
- Several req tags sit on checks that assert the opposite or something else: R-301, R-311, R-964, R-980 and R-302 on win32 absence checks, and R-937 on the mirror check.
- The guards test `process.platform`, but the product reads `NANA_SETUP_PLATFORM`.
- packages/nana-setup/tests/state-manifest.test.mjs:85. On NTFS, chmod 0 only sets the read-only attribute, so the mode-zero check's precondition does not hold there (existed before the lane).
- No other platform guard is in the lane diff or the five files beyond those the checkers listed. The diff changes only these five test files and review docs. No new writes go outside the OS temp folder.

Counts against Windows run 2 (the test files have not changed since bd33b92)
- install: 101 − 85 = 16 checks dropped. 9 sit under the 5 SKIP lines (hook −1, PATH −5, collision −3; rules and the skill are 1:1). 7 drop with no SKIP line: 6 at :411 and 1 at :303. The total adds up, but 7 drops are unprinted.
- skills-and-standards: 74 − 33 = 41. 29 sit under 4 SKIP lines (sections 5: 4, 6: 13, 7a: 9, 7b: 3). 12 drop with no SKIP line: section 4 (9→6, −3), 7c (−6) and 7d (−3). The file's own SUMMARY says SKIP=2.
- retired-artifacts: 47 = 47 pass. The one SKIP line drops no check (:201 is replaced 1:1 at :205), so "macOS count minus skips" (47 − 1) does not match.
- state-manifest: 20 − 1 = 19. Adds up.
- uninstall: 31 − 30 = 1. The 22 checks at :34-409 (including :44 and :88) and 8 at :427-535 sit under the two SKIP lines, and :421 runs. Adds up.

