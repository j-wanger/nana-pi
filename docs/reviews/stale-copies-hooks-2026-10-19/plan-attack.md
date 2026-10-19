# stale-copies-hooks — plan attack (one adversary)

Verdict: AMEND

AMEND. The plan is sound: the lane is worth building, the class is right and nothing needs to wait. Five gaps change what gets built. Probes ran on main 22ccd849, in a temp clone with temp homes. The real repo was not changed, and the temp folder has been removed.

Confirmed by probe:
- R-1760 is red today. With the roster-notice link removed and PreToolUse and UserPromptSubmit deleted, the hook printed nothing and doctor showed 3 ✗.
- R-1761 and R-1762 are red today. On the POSIX occupied home the line named three skills and only install. Doctor also failed settings PreToolUse. `install --dry-run` marked spec and py-lint as problems and wrote nothing.
- R-1763 is red today. Following today's line, install exited 1 and the next hook run printed the line again. After moving spec and py-lint, install exited 0 and the line cleared.
- Win32 forced, with the unmarked folder, the `Bash` matcher and UserPromptSubmit deleted: the dry run and the real install agree, and moving the folder then installing clears the line. A regular file or a link at the win32 skill path also gives dry-run problem and real-install exit 1. For the regular file, doctor says "re-run install", so the line's move advice beats doctor there too.
- Install also fixes a regular-file hook copy and a foreign rule link. So R-1763 can hold on every broken home, not only the occupied ones.
- The hook leaves the home unchanged today on both POSIX and forced win32. I compared a listing of type, size, mtime and link target before and after the run.

Gaps fixed:
1. Nothing pinned that the producer's stepSkills call stays a dry run. Dropping `dryRun` would relink or rewrite skills in the owner's home at every session start, and no planned test turned red. I added R-1765 as a guard: the hook leaves every file, folder and link under the home unchanged.
2. R-1763's "move each named path into scratch" breaks under the planned mutation "name the source path". The test would move a folder out of the lane's own checkout. R-1763 now refuses any path outside the fixture home and moves nothing in that case.
3. The POSIX hook-only home mixed link and settings drift. So "skip hook-link rows" did not turn R-1760 red, and the link half of R-1760 was wider than its test. That home is now link-only: roster-notice link removed, verifier-pipe.mjs a regular file. The settings drift moved to the occupied home.
4. Four wrong-code mappings were wrong. "Drop install when paths exist" only turns red if R-1760 also runs on the occupied homes, so it now does. "Move clause on its own line" and "skills folder as the path" turn R-1762 red, not R-1760 or R-1763. Moving the whole skills folder actually clears the line.
5. The stated reason for the new module was wrong. The bin already imports doctor.mjs, so there was no import cycle. The real reasons are one judgement shared by both callers, and leaving doctor's header alone.

Also: R-1763 now runs over every broken home, and the test list adds install-check, fresh-machine and retired-artifacts.

Simpler design rejected: running `diagnose()` in the hook. It spawns node, pi and launchctl. Doctor alone took 0.32 s against 0.11 s for the whole hook.

Conflicts:
- win-path-commands shares doctor.mjs, the nana-setup README, REQUIREMENTS.md, the requirements tree and the code map. I committed a plausible edit to doctor's import line 28, plus one new import line, and to README lines 73 and 453 in the temp clone. Merging feat/win-path-commands into it went through cleanly. The tree and the code map are generated: regenerate them after win-path-commands lands.
- No other lane in flight or in this slate shares a hand-edited file. win-post-edit-utf8, doctor-quiet and win-review-stubs are already on main.

Files the build will touch:
- packages/nana-setup/lib/hook-health.mjs (new)
- packages/nana-setup/lib/doctor.mjs
- packages/nana-setup/bin/stale-copies.mjs
- packages/nana-setup/lib/stale-copies.mjs
- packages/nana-setup/tests/stale-copies.test.mjs
- packages/nana-setup/README.md
- REQUIREMENTS.md
- docs/requirements-tree.md
- docs/code-map.md

Claim most likely wrong: that the whole-home snapshot behind R-1765 stays unchanged across a hook run on native Windows. I probed it only on macOS, native and forced win32. Reading the code, neither producer writes. If anything does write under USERPROFILE there, R-1765 fails on the release-blocking Windows leg for a reason outside this lane. The second candidate is inherited from the plan. A dry run and a real install could disagree for a retired nana-dev-kit copy whose dated backup already exists. I found this by reading the code and did not probe it. It is listed as a known limit.

Note for the seat: on win32, install appends a second verifier group and leaves the old `Bash` group, so the verifier runs twice on Bash commands. Record it as a residual; it is not this lane's work.
