# Independent check — pwsh-lexer-oracle at c78c6e7 (2026-10-19)

VERDICT: FINDINGS (no MUST; one known bug, a narrow fail-open that main catches, with a one-line fix)

Setup: private clone at 983da287 under $TMPDIR/pwsh-lexer-oracle-check.RG3Ytl. Temp HOME and TMPDIR for every probe. pwsh 7.6.7 (osx-arm64, the version the planner probed) was downloaded into that temp folder. Main's guard was taken from 22ccd849 for side-by-side runs. Expected values come from pwsh 7.6.7's own tokens (`Parser::ParseInput`). None come from reasoning.

Must-meet and existing tests
- `PATH=<tmp pwsh>:$PATH node packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs`. 22 PASS, `SKIP oracle: powershell (powershell is only available on win32)`, exit 0. The live oracle compared all 1,500 corpus commands and found 0 disagreements.
- The same file without pwsh prints `SKIP oracle: pwsh (pwsh is not on PATH)`. The other cases PASS. HOLDS.
- `node packages/nana-pack/tests/pipe-guard.test.mjs` exit 0 (84 PASS). `node packages/nana-setup/tests/verifier-pipe.test.mjs` exit 0. `node packages/nana-pack/tests/gate-corpus.test.mjs` exit 0. HOLDS.
- `npm run map:check` gives "0 problem(s)". `npm run readme:check` gives "709 claims checked; 0 problem(s)". Temp folder empty after the runs. Clone left clean. HOLDS.

Probes (pwsh 7.6.7 vs lane vs main; each command is a PowerShell string through `verifierPipeReason(c,"powershell")`)
1. `npm test | Select-Object -Last 5\r\ngit commit -m "x"` (CRLF): pwsh=ask, lane=ask, main=ask, spans match. HOLDS.
2. `git add -A; git commit -m “fix: a | b”`: all three null. `npm test | Out-Host; git commit -m “fix: ok”`: all three ask. HOLDS (typographic quotes in a message).
3. `npm test 2>&1 | Tee-Object log.txt; git commit -m ‘don’’t’`: all three ask, spans match. HOLDS.
4. `Invoke-WebRequest https://example.com/#frag | Out-Null; git commit -m x`: all three ask. HOLDS.
5. `npm test | Select-Object -Last 1\r\ngit commit -F - @'\r\nfeat: x | y\r\n'@`: all three ask. The `git commit -m @'…a | b # c…'@` form with no pipe before it: all three null. HOLDS.
6. `Write-Output "$(npm test | Select-Object -Last 1)"; git commit -m x`: all three ask. The single-quoted `'$(npm test | x)'` form: all three null. HOLDS.
7. `@“\nx | y\n”@\ngit commit -m x`: pwsh=null, lane=null, main=ask. Spans match. HOLDS: the lane removes a false prompt main gives.
8. Claude Code hook end to end: `{"tool_name":"PowerShell",…"npm test | Select-Object -Last 1; git commit -m “fix”"}` piped to `claude/hooks/verifier-pipe.mjs`. It printed `{"hookSpecificOutput":{…"permissionDecision":"ask"…}}`. The no-pipe `Write-Output a#b; git commit -m x` printed empty stdout, exit 0. HOLDS.
9. Generated comparison (seeded): 6,000 commands over a wider alphabet than the lane's corpus. The alphabet adds backticks, `@(`, `[int]`, `$a.b`, `-m:`, `2>&1` and operators. Of 4,893 parse-clean commands, pwsh asks on 4,777. Missed asks: lane 15, main 24. Main asks and lane does not on 8 (all backtick cases, see F1). Main misses and lane asks on 17. False asks: lane only 9, main 17. Span disagreements: 569, all in the documented gaps (member access, operators, `@(`). Net better, with one regression class.
10. `npm test | Select-Object -Last 1; git commit -m @'\n<1,000,000 x>\n'@`: lane=ask in 65ms, main=ask in 39ms. Speed scales linearly. HOLDS.
11. `"(" * 5000 + "1" + ")" * 5000 + "; npm test | Select-Object -Last 1; git commit -m x"`: lane throws `RangeError`, main=ask. At 1000-deep, lane=ask. See F2.
12. `Add-Content CHANGELOG.md `` `## 1.2.0; npm test | Select-Object -Last 3; git commit -am v1.2.0 ``: pwsh=ask, lane=null, main=ask. Through the hook, stdout is empty, so the hook stays silent. FINDING F1.

Findings
F1. Known bug (SHOULD). It is a fail-open the lane introduces, and the lane's own R-1733 sentence covers it.
- File: `packages/nana-pack/lib/pipe-guard.mjs:128-132`. A backtick escape that is not a line continuation leaves `tokenStart` unchanged. A word that starts with an escaped character keeps its token-start state through that character.
- So in `` `a#c ``, `` `##c `` and `` ‘s’`a#c ``, the `#` right after the escape opens a comment. PowerShell keeps it in the word, and so did main.
- Consequence: the rest of the line is hidden. A pipe before `git commit` on that line goes unflagged. The Claude Code hook stays silent and pi's nana-gate does not prompt.
- Realistic input: probe 12, an escaped markdown heading in a one-liner with a pipe and a commit. It needs an escape at the very start of a word followed by `#`. I rate it an edge case, not a MUST, under the review standard.
- One-line fix: in that branch, set `tokenStart = source[i + 1] === "\n" || source[i + 1] === "\r";` rather than only setting it to true. The 8 regressions in probe 9 all share this cause.
- The oracle corpus has no atom that starts with a backtick escape, which is why the oracle did not catch this.

F2. Known bug (NOTE): contrived input.
- The scanner now recurses on every top-level `(`, not only on `$(` inside strings. About 5,000 nested parentheses overflow the stack.
- The Claude Code hook turns the throw into an abstention, so it fails open with a stderr note. pi's nana-gate blocks on a handler error.
- No honest command nests that deep.

Not a finding: the lane-only false asks (9) ask when no pipe is live, so they err toward asking. Main has 17 such cases.

Files:
- <worktrees>/pwsh-lexer-oracle/packages/nana-pack/lib/pipe-guard.mjs
- <worktrees>/pwsh-lexer-oracle/packages/nana-pack/tests/pwsh-oracle.mjs
- <tmp>/pwsh-lexer-oracle-check.RG3Ytl/fuzz.mjs (probe 9 harness; truth.ps1, probe.mjs, p1.mjs and p2.mjs sit beside it)
