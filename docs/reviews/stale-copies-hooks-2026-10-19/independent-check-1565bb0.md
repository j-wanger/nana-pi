# Independent check — stale-copies-hooks at 1565bb0 (2026-10-19)

VERDICT: HOLDS

I worked in a private clone at f089623a on macOS. Every probe used a temp HOME and TMPDIR. I removed the clone at the end. The worktree is still clean at f089623a. In the lines below, $P is the clone folder and `<install>` is the checkout's install command.

Baseline: `node packages/nana-setup/tests/stale-copies.test.mjs` gave `SUMMARY PASS=12 FAIL=0 SKIP=0` in 4.0 s. Every R-1760 to R-1765 test passed, along with R-1600 and R-1603 to R-1606.

Probes:
1. Fresh POSIX install, then the installed adoption hook under `/usr/bin/time -p`.
   Output: no stdout, `real 0.11`. HOLDS (R-1764 at today's speed).
2. Replaced the `nana-shared-memory.mjs` hook link with a byte-identical regular copy, then ran hook, doctor, install, hook.
   Output: `INSTALL STALE: hook nana-shared-memory.mjs — tell the user; they fix it with <install>`. Doctor showed `fail hook nana-shared-memory.mjs`. Install exited 0 and wrote `.bak-20261019`. The next hook run printed nothing. HOLDS.
3. Deleted `~/.claude/skills`, ran the hook, then followed the line.
   Output: `INSTALL STALE: skill requirements, skill spec, skill py-lint, skill py-review, skill py-test — … fix it with <install>`. It named no move paths, because the dry run said "would link". Install exited 0 and the line cleared. HOLDS.
4. Hand-broke `settings.json` (trailing `,}`) and removed the roster-notice link.
   Output: the hook printed nothing and exited 0. Doctor showed 7 ✗. HOLDS. Main behaves the same: with no readable install record the hook stays silent, and Claude Code would not load that settings file anyway.
5. Set `hooks.PreToolUse` to `"disabled"`.
   Output: `INSTALL STALE: settings PreToolUse verifier pipe — … <install>`, the same label doctor shows. Install exited 2 and refused the shape. HOLDS; the plan lists this as a known limit (the line repeats).
6. Forced win32 (`NANA_SETUP_PLATFORM=win32`) and appended a line to the installed `requirements/SKILL.md` copy, which carries its marker.
   Output: `INSTALL STALE: skill requirements — … <install>`, with no move path. Install exited 0 and backed up `SKILL.md.bak-20261019`. The line cleared. HOLDS.
7. Compared main 22ccd849 with the lane on the same broken homes, POSIX and forced win32. Each home had the roster link removed, UserPromptSubmit deleted, the PreToolUse matcher set to `Bash`, and an owner folder at `requirements`. I dumped every `diagnose()` row.
   Output: `posix rows main=47 lane=47 … doctor rows identical` and `win32 rows main=47 lane=47 … doctor rows identical`. HOLDS: doctor did not change.
   On the same homes the lane hook printed:
   - POSIX: `INSTALL STALE: hook nana-roster-notice.mjs, skill requirements, settings UserPromptSubmit knowledge pull — tell the user; they move $P/cmp-posix/.claude/skills/requirements out of the way, then fix it with <install>`
   - win32: `… skill requirements, settings PreToolUse verifier pipe, settings UserPromptSubmit knowledge pull — … move …/skills/requirements …`
   Both lines match doctor's ✗ set minus the pi row. Both ran in `real 0.11`. HOLDS.
8. Made `~/.claude` a symlink to a real folder (a dotfiles layout), then installed.
   Output: `install-exit=1`, with "unsafe source ancestor" for every skill. The hook printed `… they move $P/p8/.claude/skills/requirements, …/spec, …/py-lint, …/py-review, …/py-test out of the way …`. None of those paths exist. Known bug, below.
9. Hook on a home with no skills folder: a stat/find snapshot before and after.
   Output: `before=e7e49c6d4673346c after=e7e49c6d4673346c` and `skills dir still absent`. HOLDS (R-1765; the dry run creates nothing).
10. Linked `skills/py-test` to the same skill in another checkout, moved the link as the line said, then installed.
    Output: `INSTALL STALE: skill py-test — … move $P/p10/.claude/skills/py-test out of the way …`. Doctor showed `fail skill py-test`. Install exited 0, the hook printed nothing, and the skill now links to this checkout. The other checkout's files were untouched. HOLDS.
11. Mutation: `dryRun: true` changed to `false` in the hook's checker, then the test file.
    Output: `FAIL R-1765 … SUMMARY PASS=11 FAIL=1`. HOLDS: the guard bites.
12. Mutation: the checker's settings-row loop emptied.
    Output: `FAIL R-1760, R-1761, R-1762, R-1763 … PASS=8 FAIL=4`. HOLDS.
13. `nana-setup doctor --home` from the command line on the repaired home from probe 10.
    Output: all hook and settings rows ✓. The only ✗ was `pi pi-subagents`, expected in a temp home. Exit 1 for that row. HOLDS: doctor runs end to end.
14. Repository checks: `code-map.mjs --check`, `readme-check.mjs`, `requirements-trace.mjs`.
    Output: `0 problem(s)`, `709 claims checked; 0 problem(s)`, and trace exit 0 (`1116 traced`, `ears: 0 rows off form`). No test still carries a marker for the retired R-1601 or R-1602. HOLDS.

Findings:
- Known bug (not MUST), in `packages/nana-setup/bin/stale-copies.mjs`: the line tells the user to move skill paths that do not exist when `~/.claude` is itself a symlink. Install's skill step refuses every skill when any folder above the skills folder is a link. The checker then turns every failed skill into a path to move. Following the line cannot clear it, so R-1763 does not hold for this home. The plan's known limit names only the case where the skills folder itself is a link; this is the wider form of it. There is no harm: the hook changes nothing, the advice says move rather than delete, and install already refuses on main. A fix could skip paths that do not exist, or skip all paths when the skill step reports "unsafe source ancestor".

No MUST findings. I found no data loss, no writes outside the temp folders, no broken install or hook, no fail-open, and no main use that stopped working.
