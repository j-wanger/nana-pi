# Independent check — install-honest-report at 702b9bc (2026-10-19)

VERDICT: FINDINGS

The feature holds. The tip still cannot land as it stands: one test outside nana-setup fails at cc2c4ed but passes on main.

Work copy: <tmp>/install-honest-report-check.1VuiXs (lane clone at cc2c4ed, main clone at 713d6aa). Every probe used a temp HOME plus `--home`.

PROBES
P0 `HOME=$P/home node packages/nana-setup/tests/<f>.test.mjs` for each affected file
   → settings-merge 217/0, install 103/0, retired-artifacts 48/0, win32-degrade 98/0, uninstall 31/0, state-manifest 20/0. The new tests copied onto main's code gave `FAIL lock: a held lock stops install before its first write` and FAIL on both R-1591 and R-1592; R-1593 passes on main, as the guard is meant to. HOLDS
P1 Set up a home with a first install, then delete one hook link, add an empty `.claude/enforce` and a `skills/nana` dir, and leave a `{"pid":99999}` lock; run `install --home $H`
   → `exit=2`, `SNAPSHOT-EQUAL` (46 entries), stderr "Nothing was written … rm <lock>". HOLDS
P2 `NANA_SETUP_PLATFORM=win32` with a garbage lock under chmod 000 and an empty enforce; then `--dry-run`
   → `exit=2`, `SNAPSHOT-EQUAL`, "written: an unrecorded pid, at an unrecorded time". The dry run gave `exit=0`, `DRYRUN-SNAPSHOT-EQUAL`, 17 "would" rows. HOLDS
P3 Fresh home with no `.claude`, installed twice, main against lane
   → main: `retiredSkillRows2=4 skipped1=2 skipped2=6`. lane: `exit 0/0 lockLeft=0 retiredSkillRows2=0 skipped1=2 skipped2=2`. HOLDS
P4 Compared first-run stdout, main against lane, with paths normalized
   → `FIRST-RUN-IDENTICAL` (46 lines). The second-run diff only drops the 4 `– retired .claude/skills/{spec,py-lint,py-review,py-test}` rows and changes "(6 skipped)" to "(2 skipped)". Row order is unchanged. HOLDS
P5 A foreign absolute link at `skills/spec` and a relative canonical link at `skills/py-lint`
   → lane `exit=1`: `✗ skill spec problem foreign link … left untouched`, `· skill py-lint unchanged`, both links unchanged. Main also printed two `– retired … unrecognized` rows. HOLDS
P6 Links at `nana` and `py-init`, and a dangling link at `py-test`
   → `– retired .claude/skills/py-init skipped unrecognized…`, the same for `nana`, and `✗ skill py-test problem foreign link`. `exit=1`, links unchanged. HOLDS
P7 `.claude/hooks` under chmod 555, so EACCES is thrown inside the locked steps
   → lane `exit=1 lockLeft=0 settings=no`; after chmod 755 the rerun gave `exit=0`. Main behaves the same. The lock is released on a throw. HOLDS
P8 Two installs started together on one fresh home
   → lane, 30 simultaneous pairs: every pair `02`, `20` or `00`, and the loser printed 0 rows. Main, 12 pairs: `01` and `10`, each from an EEXIST symlink crash. Lane, 40 staggered pairs: one `01`, an EEXIST in `stepPath` (the pi-review link) after the lock was released. HOLDS, with the residual in F2
P9 `--claude-home $H/alt-claude` with the lock held in the alternate home, then held only in the default home
   → `alt-locked exit=2 SNAPSHOT-EQUAL`, then `default-home-lock-only exit=0 altLockLeft=0`. The default lock was left as written. HOLDS
P10 `install`, then `uninstall --home $H --yes`
   → `install=0`, `uninstall=0 lockLeft=0 hooksLeft=0`. HOLDS
P11 `TMPDIR=$P/ictmp node packages/nana-setup/bin/install-check.mjs`
   → `exit=0`, 13 PASS. HOLDS
P12 `node scripts/code-map.mjs --check` and `node scripts/readme-check.mjs`
   → "0 problem(s)" and "readme: 698 claims checked; 0 problem(s)". HOLDS
P13 `node packages/nana-pack/tests/requirements-tree.test.mjs`, at cc2c4ed and on main
   → lane `exit=1`, `FAIL R-291: … leaf counts total 1,298 committed IDs differ or leaf total is not 1,298`. Main `exit=0`, 0 FAIL. FINDING
Writes outside temp: none.
- The lane test runs left `$P/home` empty.
- The private clones' `git status` is clean.
- The worktree HEAD is still cc2c4ed.
- `~/.claude/.settings.json.nana-setup.lock` does not exist.

FINDINGS
F1 MUST. The suite is red at the exact tip, so the tip cannot land.
- `packages/nana-pack/tests/requirements-tree.test.mjs` pins the leaf total at 1,298.
- The lane's four new rows, R-1590 to R-1593, make the total 1,302. The test passes on main and fails at cc2c4ed.
- The worktree already has the fix, `1,298 → 1,302`, staged in the index but not committed.
- That fix needs a commit and review coverage of the new tip before land.
F2 Known bug, and the plan's documented known limit. The lock is released after the settings step.
- A second run that starts in the later steps can still crash with EEXIST in `stepPath`. That was 1 of 40 staggered pairs.
- A third run afterwards printed "nothing to do", so nothing was lost.
- Main hits the same kind of crash more often, in the Claude-home steps (2 of 12 pairs). This is not a regression.

The worktree also holds the seat's untracked `seat-mutate.mjs` and `seat-mutate-output-cc2c4ed.txt`. They are not part of the tip and were not touched.