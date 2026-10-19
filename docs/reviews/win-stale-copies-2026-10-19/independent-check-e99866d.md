# Independent check — win-stale-copies, filed at e99866d, run on defdeda (2026-10-19)

VERDICT: HOLDS

Lane win-stale-copies, tip defdeda, checked against base 713d6aa. All probes ran in private clones under $TMPDIR with temp homes, on node 22.22.2 and pi 1.0.2. I edited no repository and removed the clones afterwards. The worktree's two untracked seat-mutate files were already there; I did not write them.

P0 `node packages/nana-setup/tests/stale-copies.test.mjs`
  → `PASS seal … R-1600 … R-1601 … R-1602 … R-1603 … R-1604 … R-1605` / `SUMMARY PASS=7 FAIL=0 SKIP=0` (2.1 s). Verdict: the must-meet tests pass.

P1 Healthy POSIX install from main and from the lane. I ran each installed `~/.claude/hooks/nana-adoption.mjs` with HOME set to its temp home and diffed the outputs.
  → `IDENTICAL`, `[exit=0]`. Mean wall time over 5 runs: `base mean real 0.102` against `lane mean real 0.206`. The hook timeout is 5 s. Verdict: no change when the install is current; the added time is about 100 ms.

P2 POSIX install with a rule and a skill missing, as if they shipped after the last install (removed `rules/nana-seat.md` and `skills/spec`). Ran the hook, then doctor.
  → `[nana:install] INSTALL STALE: rule nana-seat.md, skill spec — tell the user; they fix it with \`node "…/lane/packages/nana-setup/bin/nana-setup.mjs" install\``, `[exit=0]`. Doctor marks the same two rows ✗.
  I then ran the printed command exactly as written, with HOME set to the temp home: `+ rule nana-seat.md created`, `+ skill spec created`. The hook was silent afterwards. The real `~/.pi` and `~/.claude` settings were not touched: their mtimes are Oct 4 and Oct 17, and they contain 0 references to the temp folder. Verdict: holds, including the fix path.

P3 Install forced to win32 (NANA_SETUP_PLATFORM=win32), then the checkout's sources edited the way a `git pull` would change them.
  → Before the edit: no output. After: `INSTALL STALE: rule nana-standards.md, rule nana-rulings.md, skill requirements — …install\``, `[exit=0]`. Verdict: holds.

P4 Loaded `nana-rulings.ts` through pi's own `jiti-loader.js` (`moduleCache:false`) and ran its `session_start` and `before_agent_start` handlers.
  → Stale win32 copy: `{"keys":["nana-rulings","nana-install-stale"],"stale":"[nana:install] INSTALL STALE: pi nana-rulings.md — …"}`
  → Same copy after the source was restored: `{"keys":["nana-rulings"],"stale":null}`. A healthy POSIX install gives the same result.
  → Missing rulings file: `rulingsHead":"RULINGS UNAVAILABLE: missing at …"`, `stale:null`.
  Verdict: holds under the real loader. `import.meta.url` resolves, and the rulings block is never lost.

P5 Failure isolation inside the hook, run on an install with one rule missing.
  → I injected a `throw` into the stale-copies CLI: the hook printed only `[nana:install] STALE-COPY CHECK UNAVAILABLE: checker failed (…/bin/stale-copies.mjs).` and exited 0.
  → I injected `process.exit(3)` into the adoption reader: the hook printed `[nana:adoption]` / `ADOPTION UNAVAILABLE: reader failed (…)` / `[nana:install] INSTALL STALE: rule nana-soul.md — …` and exited 0.
  Verdict: each producer fails without affecting the other.

P6 Doctor's behaviour, main against the lane, on identically broken homes (seat rule removed, writing rule replaced by a byte-equal file).
  → After normalising paths, the only diff is the PID in node's SQLite ExperimentalWarning. Both report `✗ rule nana-writing.md`, `✗ rule nana-seat.md`. Verdict: moving `linkOk` changed nothing in doctor.

P7 A checkout path containing a space (`…/with space/lane`), with the requirements skill removed.
  → The line reads `…they fix it with \`node "…/with space/lane/packages/nana-setup/bin/nana-setup.mjs" install\``. Pasted into `sh -c`, it printed `+ skill requirements created`, and the hook then printed `[]`. Verdict: the quoting holds.

P8 The user's own regular folder at `~/.claude/skills/requirements` on POSIX.
  → The hook printed `INSTALL STALE: skill requirements — …`. The printed install command refused: `✗ skill requirements problem a directory is already at …`. The user's file was kept (`my own`). The hook printed the line again afterwards. Verdict: no data lost, but the command the line names does not fix this case (K1).

P9 Read-only check of this machine. I compared the real `~/.claude` and `~/.pi/agent` against `~/nana-pi` sources using the lane's `linkOk` and `skillLinkState`.
  → `stale = ["rule nana-rulings.md","pi nana-rulings.md"]`. Neither nana-rulings.md file exists on this machine, and PI_CODING_AGENT_DIR is unset. Verdict: after the land, every Claude Code session here will carry one true-positive line until the owner runs install. pi will keep its existing `RULINGS UNAVAILABLE: missing` marker, not the stale line, as designed.

P10 Adjacent single test files.
  → `hook-producers`, `adoption-producer`, `install-check`, `win32-degrade` and `rulings` all exit 0.
  → `skills-and-standards` shows `PASS=76 FAIL=5`. The same 5 fail on 713d6aa in an identical clone location, so they come from the environment, not from the lane.
  Verdict: no regression.

P11 `node scripts/code-map.mjs --check` → `303 modules … 0 problem(s)`, exit 0. `node scripts/readme-check.mjs` → `699 claims checked; 0 problem(s)`. Verdict: both land checks pass.

Also checked: pi loads the pack from `../../nana-pi/packages/nana-pack` in user settings, and pi-worker and pi-review set no separate agent dir. So builders in worktrees do not get a false stale line.

Findings (no MUST):
K1 (known bug) `packages/nana-setup/lib/stale-copies.mjs` staleNotice and `bin/stale-copies.mjs`: when a folder or file nana-setup did not make sits at a skill path, the line names `install` as the fix. Install refuses that case, so the line repeats every session. Doctor's own detail says "move it, then re-run". Nothing is lost or overwritten, so it is a misleading message, not a harm.
K2 (note, not a defect) This machine is missing `~/.claude/rules/nana-rulings.md` and `~/.pi/agent/nana-rulings.md` (P9). The first session after the land will show the stale line. That is the feature working; running `nana-setup install` clears it.