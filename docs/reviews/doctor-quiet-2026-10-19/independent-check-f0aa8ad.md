# Independent check — doctor-quiet at f0aa8ad (2026-10-19)

VERDICT: HOLDS

Doctor now prints no Node warning lines, and its summary line is the last thing it prints. Every other Node warning still prints. I checked stdout and the exit code against the base commit on macOS and on forced win32; neither changed. No probe found a MUST-level harm. I made every probe in a private clone at f0aa8ad under `$TMPDIR/doctor-quiet-check.CnLRRZ`, with temp homes and a stub `pi`. I compared against main's bin (4fe70c5), copied into the same clone as `nana-setup-base.mjs`.

**Probes**

1. `node packages/nana-setup/tests/doctor-quiet.test.mjs` on the lane, then on main's bin.
   - Lane: 3 PASS, `PASS summary: 0 failures`.
   - Main: `FAIL ...without project config` (SQLite ExperimentalWarning), `FAIL ...with project config` (MODULE_TYPELESS_PACKAGE_JSON naming gate-paths.ts, plus SQLite), `PASS ...does not mute`.
   - Verdict: the tests detect the bug and the fix.
2. Doctor with base bin and lane bin, run in a folder with `.pi/nana-pack.json` and in a folder without one, then `cmp` on stdout.
   - `base cwd=proj exit 1 stderr-warning-lines=2`, `base cwd=h1 exit 1 stderr-warning-lines=1`.
   - `lane cwd=proj exit 1 stderr-warning-lines=0`, `lane cwd=h1 ... 0`.
   - `cwd=proj stdout byte-identical (52 lines)`, `cwd=h1 stdout byte-identical (51 lines)`. Lane stderr was 0 bytes.
   - Verdict: holds.
3. A preload that emits a DeprecationWarning, a plain Warning and an ExperimentalWarning during doctor, run with several Node flags.
   - Default: all 3 print.
   - `--trace-warnings`: all 3 print with stacks. Under the same flag, lane shows `SQLite=0 TYPELESS=0` and base shows `SQLite=1 TYPELESS=1`.
   - `--no-warnings`: nothing prints.
   - `--no-deprecation`: only the Warning and the ExperimentalWarning print.
   - `--redirect-warnings=<file>`: the file holds exactly the 3 probe lines and no muted warning.
   - `NODE_OPTIONS=--trace-warnings`: 0 warning lines.
   - Verdict: holds; Node's own warning flags behave as before.
4. Forced win32: `NANA_SETUP_PLATFORM=win32 node <bin> doctor --home <tmp>` in the project folder.
   - `base exit 1 warnings=2 trust-row=1`, `lane exit 1 warnings=0 trust-row=1`, `win32 stdout byte-identical`.
   - Verdict: holds.
5. The other commands, base bin against lane bin.
   - `install --dry-run --home <tmp>`: exit 0, 45 lines on both, stdout identical.
   - `project <dir> --check`: exit 1, `warnings=1 typeless=1` on both, stdout identical. This is the residual the plan records.
   - `state`: exit 0, 62 lines on both, byte-identical.
   - `doctor --bogus`: exit 2 on both.
   - Verdict: nothing that works on main stopped working.
6. A preload that registers a user `process.on("warning")` listener and a `process.once("warning")` listener, then emits PROBE_ONE and PROBE_TWO.
   - Base: `["on:MODULE_TYPELESS_PACKAGE_JSON","once:MODULE_TYPELESS_PACKAGE_JSON","on:ExperimentalWarning","on:PROBE_ONE","on:PROBE_TWO"]`.
   - Lane: `["on:PROBE_ONE","once:PROBE_ONE","on:PROBE_TWO","once:PROBE_TWO"]`.
   - Verdict: the user's listener gets the warnings doctor does not mute. The once-listener fires on each warning; see K1.
7. `HOME=<tmp> node packages/nana-setup/bin/install-check.mjs` in the clone (this probe used the network).
   - `exit 0`, last line `PASS doctor` then `PASS readme checklist`, 0 Node warning lines on stderr, 18.7s.
   - Verdict: install and hooks still work.
8. `node scripts/code-map.mjs --check`, `node scripts/readme-check.mjs`, the requirements-tree test, `doctor-runtime.test.mjs`, `win32-degrade.test.mjs`, and `requirements-moved.mjs --base 4fe70c5`.
   - `0 problem(s)` for the code map and for the readme (706 claims), `all passed`, exit 0, exit 0.
   - `R-1750/R-1751/R-1752 new (implemented)`.
   - Verdict: holds.
9. Whether anything writes outside the temp folders: `git status` on `<repo>` and on the worktree.
   - Main checkout clean. The worktree is still at f0aa8ad.
   - Two untracked files in the worktree, `docs/reviews/doctor-quiet-2026-10-19/seat-mutate.mjs` and `seat-mutate-output-f0aa8ad.txt`, came from the seat's mutation run, not from me.
   - The test writes only under `os.tmpdir()` (`tmpDir`) and removes those folders when it exits.
   - Verdict: holds.

**Findings**

- **K1 (known bug, not MUST).** `muteDoctorWarnings` replays the listeners it saved with `listener(warning)`. `process.listeners()` returns a `once` listener without its once-wrapper, so after the swap that listener fires on every warning that reaches it (probe 6). Doctor and Node register no `once` warning listener, so only a user preload hits this. The same pattern is in `loadSqlite` in `packages/nana-knowledge/lib/db.ts`.
- **K2 (known bug, not MUST).** Saved listeners are called with `this` undefined, not `process`. A user listener that reads `this` would behave differently. Node's own printer does not use `this`, so redirect and trace work (probe 3).
- **Not probed.** Only Node 22.22.2 is on this machine, so the plan's residual about Node 23 and 24 is still untested.
