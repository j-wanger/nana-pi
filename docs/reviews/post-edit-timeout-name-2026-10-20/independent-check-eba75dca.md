# Independent check — post-edit-timeout-name at eba75dca (2026-10-20)

VERDICT: HOLDS

Setup: a private clone at <tmp>/post-edit-timeout-name-check.lUbxI0/lane, checked out at eba75dca. Every probe ran under a temp HOME and TMPDIR inside that folder, with PI_CODING_AGENT_DIR unset. The lane's own change is `15703d8d..eba75dca`; the rest of `1b54211c..` is the pi-probe-timeout merge already on main.

Must-meet
1. `node packages/nana-pack/tests/post-edit-default-timeout.test.mjs` printed `PASS ...retuned in a copy` and `PASS seal: POST_EDIT_DEFAULT_TIMEOUT_MS is 30000`, exit 0, in 0.13 s. `node scripts/test.mjs <that file>` printed `1 PASS, 0 FAIL ... checks: 2 pass`. Verdict: holds.

Files at risk, run one at a time
2. Each file ran as `node packages/nana-pack/tests/<f>.test.mjs`. Results: post-edit-status 32/0, post-edit-hardening 22/0, post-edit-utf8 4/0, display-surfaces 181/0, config-handlers-malformed 98/0, post-edit-file-queue 5/0 (pass/fail, every exit 0). Afterwards `git status --short` in the clone was empty, and the tests left nothing in the temp folder. Verdict: holds.

Probes beyond the must-meet tests
3. Compared main and the lane on 8 timeoutMs values using `node probe-timer.mjs <main|lane pack> <timeoutMs>`, recording the timers the extension sets. Both gave the same result on all 8:
   - absent: `{"timers":[30000],"status":"post-edit ✓ 1 check · a.txt"}`
   - 0: `timers [] ✓`
   - 5000: `[5000] ✓`
   - 30000: `[30000] ✓`
   - null, "5000", -1, 1.5: `{"timers":[],"status":""}` (the config loader rejects each one)
   Verdict: no behaviour change except where the default is read from.
4. Retuned the default to 800 in a copy (`sed` on the copy's lib/post-edit-config.mjs), with a hung checker `node -e "setInterval(()=>{},1000)"` and no timeoutMs. Output: `{"timers":[800,2000],"status":"post-edit ⏱ timeout · a.txt","ms":812,"extra":"[nana-post-edit] 1 check(s) failed..."}`. With `timeoutMs:1500` the output was `[1500,2000] ... ms:1508`. `pgrep` found no leftover checker. Verdict: the named default really stops a hung check, and a command's own value still overrides it.
5. Loaded the extension through real pi 1.0.2 (jiti loader) with `pi --mode rpc --no-session -ne -e <lane>/extensions/nana-post-edit.ts`. It returned `{"type":"response","command":"get_commands","success":true,...}`. Control: the same copy with lib/post-edit-config.mjs deleted printed `Error: Failed to load extension ... Cannot find module '../lib/post-edit-c...`. Verdict: pi's own loader resolves the new import, and a missing file fails loudly.
6. Installed the whole lane pack the way the real install does: a temp `settings.json` with `{"packages":["<lane>/packages/nana-pack"]}`, which matches the real install's local-path entry, then `pi --mode rpc`. get_commands came back `success:true` and listed the pack's commands, for example `reload-runtime` from nana-lifecycle.ts. Verdict: the installed pack loads, and the lib/ file is not picked up as an extension.
7. Copied the pack to `"$P/Jo Ünï pack"` with `TMPDIR="$P/tmp spaces ü"`, a Windows-profile-style path. The native import probe printed `{"timers":[30000],...✓ 1 check}`, the must-meet test printed 2 PASS with exit 0, and `pi -e` from that path printed `success:true`. Residue afterwards: `HOME entries=0 TMPDIR entries=0`. Verdict: holds, and nothing is written outside the temp folders.
8. Wrong code in a scratch copy, then the must-meet test. `c.timeoutMs ?? (30_000)` failed with `{"retuned":true,"recorded":[30000]...}`. `c.timeoutMs ?? (0)` failed with `{"retuned":true,"recorded":[]...}`. The seal test passed both times. Verdict: the test catches the literal coming back, and it catches the deadline being dropped.
9. Repo checks:
   - `node scripts/code-map.mjs --check`: `342 modules ... 0 problem(s)`
   - `node scripts/readme-check.mjs`: `719 claims checked; 0 problem(s)`
   - `node scripts/requirements-trace.mjs`: `ears: 0 rows off form`, exit 0
   - `node scripts/requirements-moved.mjs --root . --base 15703d8d`: `FEAT-030 ... R-2150 new (implemented), R-2151 new (implemented)`
   - `requirement-rows.mjs lib/post-edit-config.mjs`: 1 direct test file, rows R-2150 and R-2151
   Verdict: holds.
10. Windows: I could not force win32, so I read the timer code paths instead. On a passing run, `run()` sets one timer, the deadline (line 269). The second timer, the kill-escalation timer (line 210), starts only after the deadline fires. So the test's `recorded.length === 1` check does not depend on the platform. This is from reading the code, not from a Windows run.

Findings. None is MUST, and none harms main.
- Known bug (stale record): HANDOFF.md line 361 still says "the 30-second default time limit is still a literal in the extension". At eba75dca the lane has no HANDOFF or session-log change. The plan's seat step says to remove that line in the reviewed change. Landing this tip as is would leave a residual that is no longer true.
- Known bug (wrong claim in the plan only): must-meet.md says "`timeoutMs: null` takes the default through `??`". Probe 3 shows otherwise: the config loader rejects null as `timeoutMs must be a non-negative integer`, so no check runs at all (`status ""`). Main behaves the same way, and the claim appears nowhere a user reads it.
- Note: the lane worktree has two untracked seat files, `seat-mutate.mjs` and `seat-mutate-output-eba75dca.txt`. I left them alone.

The private copy, the probe scripts and all temp HOMEs are kept at <tmp>/post-edit-timeout-name-check.lUbxI0 (probe script: `probe-timer.mjs`).
