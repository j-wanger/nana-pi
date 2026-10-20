# Independent check — verifier-pipe-commit-match at 1d92a68d (2026-10-20)

VERDICT: FINDINGS

Setup: I cloned tip 1d92a68d into <tmp>, used a temp HOME and ran single test files only. I compared the tip predicate with main's 9552afb1 side by side.

Must-meet tests
- `node packages/nana-pack/tests/pipe-guard.test.mjs` printed 137 PASS, 0 FAIL, exit 0. HOLDS.
- `node packages/nana-setup/tests/verifier-pipe.test.mjs` printed 31 PASS, 0 FAIL. HOLDS.
- `node packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs` printed 38 PASS and 2 SKIP (no pwsh on this Mac). HOLDS, unverified here.
- `hooks-win32-exec.test.mjs` and `install-check.test.mjs` each give the same FAIL lines on main and on tip in my temp environment (15 and 3). Both fail the same way on main, so the lane did not cause them.

Probes (main vs tip; ASK means the guard prompts, null means it stays silent)
1. `npm test 2>&1 |⏎  tail -20 && git commit -m x` (bash): main=ASK, tip=null. FINDING.
2. `npm test 2>&1 | \⏎  tail -30 && \⏎  git add -A && \⏎  git commit -m x`: main=ASK, tip=null. FINDING.
3. Other line breaks inside the pipeline, all main=ASK, tip=null. FINDING.
   - `| tail -n \⏎ 20 &&`
   - `| # comment⏎ tail -20 &&`
   - `|\r⏎ tail -20 &&`
   - `|& \⏎ tail -5 &&`
4. PowerShell `npm test |⏎ Select-Object -Last 5 && git commit` and the backtick form `` | Select-Object `⏎ -Last 5 && ``: main=ASK, tip=null. FINDING.
5. Real bash: `bash -c $'(exit 1) | tail -n \\\n 1 && echo COMMIT-RAN'` printed `COMMIT-RAN`. So `&&` reads the masked status across the line break, and the commit runs after a failed test.
6. Claude Code hook, driven by stdin JSON:
   - Probe 2's command gave 0 bytes on stdout, exit 0: a silent miss from start to end.
   - `npm test | tail -5 && git.exe commit` gave `"permissionDecision":"ask"`.
   - `git status | wc -l; git commit` gave 0 bytes.
   - Malformed JSON gave one stderr line, exit 0.
   - Verdict: holds, apart from the miss above.
7. pi nana-gate, headless:
   - Probe 1's command was `allowed` in both bash and powershell.
   - The one-line `npm test 2>&1 | tail -20 && git commit` gave `BLOCK true verifier-pipe`.
   - Verdict: the miss reaches the gate.
8. Wider sweep, all HOLD:
   - Both dialects ask on: `(P) &&`, `{ P; } ||`, `if ! P; then`, `test "$?"`, `cd x && set -e && P;`, `&>/dev/null &&`, `|&`, `/usr/bin/git -C`, `\git`, `command git`, PowerShell `if (-not $?)`.
   - CRLF `$?` on the next line asks.
   - `git status | head -3; git add -A; git commit` is now silent, as designed.
9. Speed, main vs tip: 2,000 `;`-separated pipelines took 3 ms vs 5 ms. A 200 KB script took 13 ms vs 15 ms. Option backtracking took 1 ms. HOLDS.
10. Install-check samples through the hook: bashHit asks, bashMiss abstains, the new `&&` powershellHit asks. HOLDS.
11. Read-only count over 8 days of local transcripts, 2,078 unique Bash commands with a pipe and "commit":
    - main asks on 406 and the tip on 121.
    - The tip newly asks on 0.
    - 0 of the 285 lost asks are lost only because of a line break after a pipe.

Findings
- MUST. The guard misses a pipeline status read when the pipeline continues over a line break.
  - The cause: `statusReadAfterPipeline` treats any LF or CR after the pipe as a status-discarding separator.
  - That is wrong in two places, in both dialects. A backslash before LF (bash) or a backtick before it (PowerShell) continues the command. A line break directly after `|` or `|&` continues the pipeline.
  - The scan then reaches the next segment's `&&`, `nextCommandReadsStatus` returns false, and the predicate returns null.
  - Effect: the Claude Code hook stays silent and the headless pi gate lets the command run (probes 1–7). Main asks or blocks on all of them.
  - This is honest separator variation, which the plan puts in scope. So it is a fail-open against main.
  - Frequency: 0 hits in 8 days of local transcripts, so it is rare.
  - Fix: treat an escaped line break as whitespace, and an LF after an open pipe as part of the pipeline. Add these shapes to the R-2351 test.
- Known bug. `npm test | findstr PASS; if ($LASTEXITCODE -eq 0) { git commit }` asks on main and not on the tip.
  - The plan calls `$LASTEXITCODE` "not masked". That holds after a cmdlet such as Select-Object.
  - It probably does not hold when two native programs are piped, where the last native program sets it. This is inferred; I could not run pwsh here.
  - The residual text should say so.
- Known bug. Two bash spellings that read the status no longer ask:
  - `P & wait $! && git commit`, where `wait` reads the masked status;
  - `P; [ ${?} -eq 0 ] && git commit`, the `${?}` spelling.
  - Both are rare.

HANDOFF on the tip
- The tip has no HANDOFF entry for this lane: no dated line, no residuals and no open items. The seat must add them before the final round, including the about 70% relief figure the plan wants the owner to hear.
- The PowerShell pipe-check residual about a hash sign glued to bare member access says "a piped test run and commit on the next line go unasked". Under this lane a newline-separated commit is silent anyway. That line should say a status-reading `&&` on that line goes unasked.
- No other line becomes untrue.

Cleanup: I removed the private copy. The worktree and the main checkout are unchanged (status clean, tip 1d92a68d), and no probe process is left running.
