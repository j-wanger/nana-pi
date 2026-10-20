# Independent check — verifier-pipe-commit-match at ad08d901 (2026-10-20)

VERDICT: HOLDS

I tested tip ad08d901 in a private clone at <tmp>, with a temp HOME and single test files only. I made no edits to <worktrees> or any repository. The private copy is removed and no process is left running.

Must-meet tests (node <file>, macOS):
- pipe-guard.test.mjs: 0 FAIL. Discarded status 17 PASS, consumed status 62, git spelling 14, not a commit 8, predicate table 80, pi headless gate 2.
- verifier-pipe.test.mjs: 0 FAIL. The R-2355 hook check and both README checks (R-2356, R-2354) pass.
- install-check.test.mjs: 0 FAIL (129 PASS). pipe-guard-pwsh-oracle.test.mjs: 0 FAIL, but the pwsh comparison is skipped because pwsh is not on PATH.
- hooks-win32-exec.test.mjs fails on macOS by design. scripts/test.mjs skips it off win32.
- map:check, readme:check (727 claims) and the requirements trace all report 0 problems.

Probes. My harness compares main 9552afb1 with the tip on the same text. The ASK/null pairs below are main → tip:
1. bash `npm test 2>&1 | tail -20\ngit add -A && git commit -m x`: ASK → null. Holds: a newline discards the status.
2. bash `npm test | tail -5\nif [ "$?" -ne 0 ]; then exit 1; fi\ngit commit`: ASK → ASK. Holds.
3. bash `(\n npm test | tail -5\n) && git commit`, `npm test | tail -5 \\\n  && git commit` and `npm test | tail -5 &> /dev/null && git commit`: all ASK → ASK. Holds.
4. bash `npm test | tee out.log; test ${PIPESTATUS[0]} -eq 0 && git commit`: ASK → null. Holds, because PIPESTATUS is not masked.
5. bash, the usual Claude Code heredoc commit `npm test 2>&1 | tail -20 && git add -A && git commit -m "$(cat <<'EOF2' … a | b; c … EOF2)"`: ASK → ASK. The same shape after `git status --short | head -5\n` gives ASK → null. Holds.
6. bash `npm test | tail -5 && /c/Program\ Files/Git/cmd/git.exe commit`: null → ASK. PowerShell `& 'C:\Program Files\Git\cmd\git.exe' commit` and `git.exe -C C:\repo commit`: null → ASK. Holds.
7. PowerShell `npm test | Select-Object -Last 5; git commit`: ASK → null. With CRLF then `if ($?) {…}`: ASK → ASK. A leading-pipe `npm test\n  | Select-Object -Last 5\nif ($?)`: ASK → ASK. Holds.
8. PowerShell `$LASTEXITCODE` read after `; if (…) { exit 1 }; git commit`:
   - `npm test | Tee-Object …` and `npm test 2>&1 | Out-String | Write-Host`: ASK → null.
   - `npm test | findstr FAIL` and `npm test | select -Last 5`: ASK → ASK.
   - Holds as designed: a cmdlet at the end leaves npm's code unmasked; a native program or an alias at the end asks.
9. The repository hook script, fed Claude Code event JSON with a temp HOME:
   - `npm test | tail -5; git commit -m x`: exit 0, stdout empty, stderr empty.
   - `npm test | tail -5 && git.exe commit -m x`: exit 0, one ask line.
   - The PowerShell event `npm test | Select-Object -Last 5 && git commit -m x`: one ask line.
   - Holds.
10. Install check's sealed samples: `bashHit`, the new `&&` `powershellHit`, and the hooks-win32-exec PowerShell command with a `set -o pipefail;` prefix all give ASK on the tip. The live pi turn's gate block still fires, so HANDOFF line 547 stays true. Holds.
11. Timing on 64 KB inputs (main → tip):
    - honest chains: 7 → 10 ms in bash, 10 → 10 ms in PowerShell;
    - `; ` separators: 1 → 11 ms;
    - `; }` closers: 2 → 11 ms;
    - unclosed `a|(;`: 16 ms in bash and 12 ms in PowerShell on the tip.
    - Holds: everything is well under the hook's 5 s limit.
12. bash `npm test | tail -5 && \git commit -m x` (the backslash spelling that skips an alias): ASK → null. The hook abstains. This is finding 1.
13. bash `(set -e; npm test | tail -5; git commit -m x)`: ASK → null. Real bash `(set -e; (exit 3) | tail -1; echo …)` printed "commit ran after masked failure under set -e". This is finding 2.

Findings:
1. Known bug, a gate fail-open against main for a rare spelling. Build 3's new unquoted-escape rule blanks the backslash and the character after it, so `\git` becomes `  it` and no commit is found. I found no organic `\git commit` in 30 days of local Bash transcripts, only test strings. Suggested fix: hide only an escaped operator, quote or space, and keep an escaped letter visible. Main asked here because it kept the backslash and `\bgit` still matched.
2. Known bug, a gate fail-open against main. The errexit detector (BASH_ERREXIT_CHANGES) does not accept `(` before `set`. So `set -e` opening a subshell is missed, and the `;` then discards the status. Build brief 3 named `{`, `then` and `do`, not `(`. I found no organic use; the only two matches were this session's own probe strings.
3. Note, not a bug: the lane drops R-1064 from implemented to untested and marks its three Windows-only checks req-candidate. The row stays untested until someone reads the Windows CI leg and restores its evidence.

HANDOFF on the tip: the lane makes no existing line untrue. I checked the lines on the PowerShell pipe check, the install-check turn's gate sample and the deep-nesting stack overflow. The seat still has to add:
- the lane's landed line, with the relief figure: about 70%, since 118 of 402 commands still ask;
- the must-meet known limits as residuals;
- findings 1 and 2 as residuals;
- R-1064 as untested until Windows CI reads it.
