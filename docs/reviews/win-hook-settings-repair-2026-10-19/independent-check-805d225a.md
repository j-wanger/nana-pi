# Independent check — win-hook-settings-repair at 805d225a (2026-10-19)

VERDICT: HOLDS

Every run used a private clone at 805d225a, with main d4423eff cloned beside it, in <tmp>/win-hook-settings-repair-check.NRqxye. Each probe ran in a temp home through $P/probe.mjs: install, with `SECOND=1` adding a second install and `DOCTOR=1` adding a doctor run. I did not edit any repository. The private clone's worktree is still clean.

Must-meet and nearby tests, each run as a single file:
- `node packages/nana-setup/tests/win32-hook-repair.test.mjs` printed `SUMMARY PASS=8 FAIL=0 SKIP=0`. HOLDS.
- settings-merge, win32-degrade, stale-copies, install and uninstall all exited 0 with 0 FAIL lines. `code-map.mjs --check` reported 0 problems. `readme-check.mjs` reported 711 claims checked and 0 problems. HOLDS.

P1. A copy of the owner's real Mac hooks block, on forced win32. It holds 3 SessionStart entries, the `Bash` verifier and the unquoted knowledge entry.
`SECOND=1 DOCTOR=1 node probe.mjs $P/lane fx-real.json win32`
- Install marked all six rows `created added`. All entries became exec form naming the checkout. One verifier sits under `Bash|PowerShell`, and the emptied `Bash` group was dropped.
- The second install changed no bytes and reported every row `already wired`. Doctor marked all six rows ✓.
- HOLDS.

P2. The same copy on macOS, with no platform forced, run on main and on the lane.
`node probe.mjs $P/{main,lane} fx-real.json posix`, then a diff of the output and the settings.
- Output and settings bytes were identical, apart from the home and checkout paths. Both runs added only the roster notice.
- HOLDS: POSIX behaves as before.

P3. The upgrade path: main's win32 install first, then the lane's install over its output.
- Main left a `Bash` verifier in shell form plus an exec verifier under `Bash|PowerShell`.
- The lane install left one exec verifier under `Bash|PowerShell`. Doctor marked all six rows ✓, and the second install changed no bytes.
- HOLDS.

P4. Mixed homes on forced win32 (`fx-linux.json`):
- Inputs: `/home/some one/` with a space, `C:/Users/me/` with forward slashes, and `C:\Users\me\` with backslashes.
- Two `Bash` groups each hold a verifier, and the second also holds an owner `echo`. A `Bash|PowerShell` group holds an owner verifier with timeout 10. A foreign `Edit` group is also present.
- Output: the space path and the `C:/` path were repaired in place. The backslash entry was kept, with an exec twin added; that is the documented residual.
- Both `Bash` verifiers were removed. One exec verifier was appended after the owner verifier. The `Edit` group and the `Bash` group with `echo bash-owner` were kept byte-identical. The second install changed no bytes.
- Doctor marked the verifier row ✗. The cause is the owner's `C:/owner/verifier-pipe.mjs` target, which lies outside the checkout. Main's doctor uses the same rule.
- HOLDS.

P5. `node probe.mjs $P/lane fx-real.json win32 --dry-run`
- It exited 0 and reported the repairs. `bytes changed by install1: false`. The `Bash` shell-form verifier was still on disk.
- HOLDS.

P6. A canary HOME for the new test file. I ran the test with HOME and USERPROFILE set to an empty temp folder, then ran find on it.
- find returned nothing besides the stamp. `git status --porcelain` on the clone was empty.
- HOLDS: the test writes nothing outside its temp homes or the worktree.

P7. Documented residual shapes (`fx-res.json`): an exec verifier under `Bash`, and a shell-form verifier under `Bash` that names the checkout's own hooks folder.
- The exec verifier moved to `Bash|PowerShell`. The shell-form verifier stayed under `Bash`, next to its exec twin. The second install changed no bytes.
- HOLDS: this matches the must-meet residual list.

P8. An empty `Bash` group the owner already had, on forced win32 (`fx-empty-a.json` and `fx-empty-b.json`).
- Case A, a healthy exec home plus `{matcher:"Bash",hooks:[]}`: `bytes changed by install1: false`, and the group stayed.
- Case B, the same but with the roster notice missing: install added the roster notice, and the empty `Bash` group was gone from the written file. Main keeps the group in case B.
- FINDING, below.

Findings:

F1, known bug, not MUST. File packages/nana-setup/lib/settings.mjs, line 480: `if (group.hooks.length === 0) groups.splice(gi, 1);`
- This runs on every `Bash` group on win32, not only on a group the verifier move emptied. A `Bash` group with `hooks: []` that the owner already had is deleted whenever install writes for any other reason.
- That goes against design §4 ("Drop a group the splice empties") and R-316 ("matcher-scoped groups are left alone").
- Harm is nil in practice: an empty group runs nothing, and an install that writes nothing leaves the file alone. The fix is to drop the group only when this pass spliced an entry out of it.

No MUST findings. I found no lost data with any effect, no write outside the temp folders, no POSIX change, and no install or doctor regression. A real Windows host, rather than forced win32 on macOS, was not exercised.
