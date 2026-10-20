# Independent check — win-hook-rows at 5fa19acd (2026-10-19)

VERDICT: HOLDS

Setup: a private clone of the worktree at 5fa19acd and a baseline clone at f0d6da24, both under $TMPDIR/win-hook-rows-check.zwfm6P. HOME and every --home pointed inside that folder. I ran single test files only and removed the folder afterwards. Nothing was edited in the worktree, ~/nana-pi, ~/.pi or ~/.claude.

Must-meet tests and existing guards:
- `node packages/nana-setup/tests/win32-degrade.test.mjs` exited 0 with 87 PASS. It printed "PASS win32 install prints no row labelled with a Claude Code hook script" and "PASS win32 doctor prints no row labelled with a Claude Code hook script". Verdict: holds.
- `stale-copies.test.mjs` printed "SUMMARY PASS=13 FAIL=0". `install-check.test.mjs` exited 0 with "PASS pin R-1081: the doctor note list". Verdict: holds.

Probes:
1. Forced win32 install, fresh home, lane against main (`NANA_SETUP_PLATFORM=win32 nana-setup install --home h1`, output diffed with main's): the only differences are the five removed `– hook <script>  skipped  skipped (win32)` rows and the summary going from "11 skipped" to "6 skipped". Both exit 0. Six `+ settings …  created` rows are printed and no .claude/hooks folder is created. Verdict: holds.
2. Forced win32 doctor, same home, lane against main: the only difference is the five removed `· hook <script>  skipped (win32)` rows. All six `✓ settings …` rows remain, and the probe counts 0 rows whose label holds a hook script name. Doctor exits 1 on both main and the lane, because the probe home has no pi-subagents (`✗ pi pi-subagents not installed`). The lane did not cause that. Verdict: holds.
3. macOS native install and doctor, lane against main: both diffs are empty ("identical"). `+ hook nana-objective.mjs created` and `✓ hook nana-objective.mjs -> …/claude/hooks/nana-objective.mjs` still print, and the five symlinks exist in .claude/hooks. Verdict: holds, POSIX unchanged.
4. macOS stale-copies (`HOME=m1 node bin/stale-copies.mjs`): a healthy home is silent with exit 0. After deleting `.claude/hooks/verifier-pipe.mjs`, both lane and main print `[nana:install] INSTALL STALE: hook verifier-pipe.mjs — tell the user…`; the outputs differ only in the checkout path. Doctor shows `✗ hook verifier-pipe.mjs`. Verdict: holds; removing the `!row.skipped` filter changed nothing on POSIX.
5. Forced win32 stale-copies: a healthy home is silent with exit 0. I then pointed the objective entry's args at a missing file and added a leftover `.claude/hooks/nana-adoption.mjs` link to /nonexistent. Lane and main both print exactly `INSTALL STALE: settings SessionStart objective …` and nothing about the leftover link. Doctor shows `✗ settings SessionStart objective  nana-objective.mjs — target is missing…`. Verdict: holds; the settings row still reads ✗.
6. Forced win32 re-install and `install --dry-run`: re-install exits 0 with "nothing to do — everything was already in place (6 skipped)". Dry-run exits 0 with "26 would change, 2 already in place, 5 skipped", shows 6 settings rows and 0 hook-script labels, and writes nothing into its home. Verdict: holds.
7. `code-map.mjs --check` reported "0 problem(s)". `readme-check.mjs` reported "710 claims checked; 0 problem(s)". `requirements-trace.mjs` exited 0 with "ears: 0 rows off form". `requirements-moved.mjs --base f0d6da24` reported "R-349 text changed, R-1860 new (implemented), R-1861 new (implemented)". Verdict: holds.
8. Neighbouring test files, run one at a time:

   | File | Exit | PASS | FAIL |
   |---|---|---|---|
   | install | 0 | 104 | 0 |
   | doctor-detail | 0 | 68 | 0 |
   | hook-producers | 0 | 10 | 0 |
   | retired-artifacts | 0 | 48 | 0 |
   | settings-merge | 0 | 217 | 0 |
   | doctor-quiet | 0 | 4 | 0 |

   Verdict: holds.
9. Wrong-code mutations, each reverted with git checkout:
   - M1 restored the old stepHooks skip rows. Only "FAIL win32 install prints no row labelled with a Claude Code hook script" failed.
   - M3 had hookLinkRows return five ok:true `hook <script>` rows on win32. Only "FAIL win32 doctor prints no row labelled…" failed.
   - M2 relabelled the install rows without file names ("hook objective"). That gave 0 FAIL, which matches the plan's stated known limit.

   Verdict: both tests catch the change they pin.
10. Off-list note rows against `DOCTOR_NOTES.win32`: the forced-win32 doctor output has 0 hook-file note rows. That matches the pruned list, so a returning hook-file note row would fail the Windows install-check leg. The probe also listed other off-list rows (pi executable, this project's shared link, PATH resolves pi-review, pi packages). Those come from my probe's setup: no pi stub, and the working folder is not a project. They do not contain "hook" and come from code this lane did not touch. Verdict: holds.

Findings:
- Known bug (not MUST): line 124 of the lane's handoff file still says "Doctor's four hook-file rows read "skipped (win32)" just above the five ✓ settings rows". This is now false. The plan already lists removing that sentence as a seat duty before the final round, and it is still there at 5fa19acd.
- Known bug (not MUST): a few code comments still describe the old behaviour. One is at lib/settings.mjs:180 ("stepHooks skips it"); others are at tests/install.test.mjs:103, 329 and 374 ("stepHooks SKIPs every entry"). The behaviour they describe (no hook file written on win32) is still true. Only the word "skips" is out of date. No user sees these comments.
- Residual already in the plan, not new: a win32 row relabelled without its file name passes both new tests (probe 9, M2). The plan names this, and only the Windows install-check note list would catch it.

No harm found. No data is lost, no test writes outside its temp folder, and install and hooks still work on macOS and forced win32. The stale-copy notice did not fail open, and the macOS output is byte-identical to main.
