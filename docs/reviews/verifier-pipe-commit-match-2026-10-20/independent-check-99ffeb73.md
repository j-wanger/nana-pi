# Independent check — verifier-pipe-commit-match at 99ffeb73 (2026-10-20)

VERDICT: FINDINGS
I ran everything in a private clone at 99ffeb73, with a temp HOME and made-up names. Main was 9552afb1, extracted to <tmp>/main. The clone is removed, no process is left running, and the lane worktree is unchanged.

Must-meet and seat checks (each test file run on its own with node):
- pipe-guard.test: 163 PASS, exit 0.
- pwsh-oracle: exit 0. It skipped, because pwsh is not on this Mac.
- verifier-pipe.test: 31 PASS. requirements-trace, map --check and readme-check: all exit 0.
- install-check.test: 129 PASS, exit 0, run from a folder whose path contains "verifier-pipe". So the brief-2 item 4 fix holds.
- hooks-win32-exec: FAIL on macOS, as expected. The file says it is skipped on every leg but Windows, so this is not a finding.

Probes (main → tip; "ASK" means the predicate asks, "null" means it stays silent):
1. Predicate, realistic asks: tee &&, `{ P\n} &&`, `if P\nthen`, next-line `if [ $? ...`, a comment line then `$?`, `(( $? ))`, `case $? in`, shebang + `set -e`, `\`+LF and `\`+CRLF before `&&`, `git -C "my repo"`, `git -c k=v`, `sudo /usr/bin/git`, `&>/dev/null &&`. All ASK→ASK. Verdict: holds.
2. Predicate, relief: `git status --short | head -5; git add -A; git commit`, `git diff --stat | tail -1\ngit commit`, `out=$(P); git commit`, and the Claude Code commit message written as `"$(cat <<'EOF' … a | b && c … EOF)"` after `;`. All ASK→null. Verdict: holds.
3. PowerShell: newline `if (-not $?)` ASK→ASK. `$ok = $?` ASK→ASK. `| findstr PASS; if ($LASTEXITCODE…)` ASK→ASK. `| Tee-Object …; $LASTEXITCODE` ASK→null, which is correct because the status is not masked. `| … & git commit` ASK→null, which is correct because PS7 runs it as a job. `& 'C:\Program Files\Git\cmd\git.exe' commit` null→ASK. Verdict: holds.
4. Headless pi gate, temp HOME:
   - `npm test 2>&1 | \⏎ tail -30 && \⏎ git add -A && \⏎ git commit` → BLOCK (verifier-pipe reason).
   - `pnpm vitest run |⏎ tail -20 && /mingw64/bin/git.exe commit` → BLOCK.
   - `git log --oneline | head -3⏎git commit` → run.
   - PS `` | Select-Object `⏎ -Last 5 && git.exe commit `` → BLOCK.
   - PS `| Select-Object -Last 1; git commit` → run.
   Verdict: holds.
5. Repository hook on stdin:
   - `P⏎git add -A && git commit` → exit=0, empty stdout and stderr.
   - `P |⏎ tail -20 && GIT.EXE commit` → one ask line.
   - PS `| findstr PASS⏎if ($LASTEXITCODE…)` → one ask line.
   - PS `| Select-Object -First 3⏎git commit` → empty.
   Verdict: holds.
6. A line break inside a quoted argument of the pipeline (predicate, then gate, hook and bash):
   - `npm test --json | jq '⏎ .numFailedTests⏎' > /dev/null && git commit` main=ASK tip=null.
   - `| sed -e 's/a/b/⏎s/c/d/' -e 's/x/y/' &&`, `| grep -E "FAIL|⏎ERROR" --color=never &&` and PS `| Select-String -Pattern "FAIL⏎ERROR" -Quiet &&` give the same: main=ASK, tip=null.
   - Gate on the jq shape: "pi gate: run". The tip's hook prints empty stdout; main's hook asks.
   - Real bash: `(exit 3) | jq -n '⏎ 1⏎' -e > /dev/null && echo COMMIT-RAN` prints COMMIT-RAN.
   Verdict: FAIL, see M1.
7. A line break after a later `|` of a pipeline with three or more stages:
   - `npm test 2>&1 |⏎ grep -v DEBUG |⏎ tail -20 && git commit` main=ASK tip=null.
   - `P | grep -v DEBUG |⏎ tail -20 &&`, `npm test |&⏎ grep -v x |⏎ tail -5 &&` and PS `|⏎ Where-Object { $_ } |⏎ Select-Object -Last 5 &&` give the same: main=ASK, tip=null.
   - Gate: "pi gate: run". The tip's hook prints empty stdout; main's hook prints an ask line.
   - Real bash: `(exit 1) |⏎ cat |⏎ cat && echo COMMIT-RAN` prints COMMIT-RAN.
   Verdict: FAIL, see M2.
8. Other readers the tip misses:
   - `P & wait %1 && git commit` main=ASK tip=null.
   - `P & pid=$!; wait $pid && git commit` main=ASK tip=null.
   - `{ set -e; P; }; git commit` main=ASK tip=null.
   - `npm test | sed s/a/\&/ && git commit` main=ASK tip=null.
   - Real bash prints COMMIT-RAN for the first three and for the escaped `&`.
   Verdict: known bugs, see K1.
9. Timing at 64 KB:
   - Realistic `P; ` repeated: bash 11→16 ms, PS 9→16 ms. Newline repeated: 5→7 ms.
   - `a|(;`, `a|{⏎` and PS `a|{;` repeated: 3 ms → 5,439 ms.
   - The repository hook end to end on 65,652 bytes ending in `npm test | tail -5 && git commit`: real 5.13 s. The installed timeout is 5 s.
   Verdict: known bug, see K2.
10. Deep nesting: 3,000 nested PS parentheses still throw RangeError. HANDOFF's line about this still holds.

Findings
- **M1 (MUST, fail-open against main, honest quoting in scope).** The bash lexer keeps a line break inside quotes as a real line break: `text += ch === "\n" ? "\n" : " "` at pipe-guard.mjs:132. PowerShell's `hidden()` does the same. The status scan then reads that line break as a separator that discards the status. A multi-line quoted argument followed by more words before `&&` goes unasked. The pi gate lets it run, and bash commits with the masked status.
- **M2 (MUST, fail-open against main; this is the round-1 line-break MUST, only partly closed).**
  - Build 2 continues a pipeline only over a line break after the first `|`: the `start` skip at pipe-guard.mjs:473.
  - A `|`⏎ after any later stage hits the plain separator rule at :488 and returns -1. `pipelineStarts` never opens a new start there.
  - Multi-line pipelines with a trailing `|` on each line are common, and every case in R-2351's test has only two stages.
- **K1 (known bug, rare).** `wait %N`, `wait $var`, errexit set inside `{ … }`, `then` or `do` (only `^` and `;&\r\n` are seen before `set`), and a backslash-escaped `\&` all go unasked where main asks. The `$var` form falls under the plan's "variables out".
- **K2 (known bug, outside the threat model).**
  - The plan says the cost is linear, but it is not. A pipe followed by an `(` or `{` that never closes scans to the end of the text.
  - At 64 KB the hook takes 5.13 s, over Claude Code's 5 s timeout, so Claude Code would drop it and not ask.
  - Honest input stays at 16 ms or less.

HANDOFF on the tip
- It has no line for this lane yet.
- Line 532 (pwsh-lexer-oracle residual) must change. It says "a piped test run and commit on the next line go unasked". By this lane's design a commit on the next line is never asked now, so that residual describes no gap. Drop or reword it.
- Line 118 (the install check's PowerShell turn) still holds with the `&&` sample.
- R-1064 drops from implemented to untested, marked req-candidate, with no HANDOFF line saying so. The seat should name the Windows re-read the plan asks for.
