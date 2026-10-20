# Brief 3: pwsh-lexer-oracle

Feature: FEAT-010 · Guard risky commands and protected resources. Same worktree and branch (tip b92f3185, which merges win-path-commands' land tip c827fcf8 = main). Class: install, hook or gate. Round 1: Opus SEND-BACK (one MUST), Fable LAND 8/10 with one SHOULD. Fix all of the below in one build; every expected value comes from PowerShell's own tokens (unpack the PowerShell 7.6 tarball under $TMPDIR as before), never from reasoning.

## MUST (Opus M1): a here-string glued to an assignment hides a later pipe; main asks
`pipe-guard.mjs` opens a here-string only at a token start, and `=` is not a token ender (`pwsh-lexer-config.mjs`). So in `$msg=@'` the `@` is not at a token start; the `'` reads as an ordinary string that closes at the first apostrophe in the body, and the closing `'@` opens a string that runs to the end, hiding the pipe. pwsh 7.6.7 tokens: `Variable, Equals, HereStringLiteral, NewLine, …, Pipe, …`, 0 parse errors. Reviewer's table (lane / main): the command below null / ask; its CRLF form null / ask; a pipe before the here-string then `git commit -m $msg` null / ask; `$m+=@'…'@` null / ask; `$msg=@"…5" pipe…"@` (odd count of `"`) null / ask; the spaced `$msg = @'…'@` ask / ask.
```
$msg=@'
fix: don't drop rows
'@
npm test 2>&1 | Select-Object -Last 20; git commit -m $msg
```
Suggested fix (verify first): a line-final `@'` or `@"` opens a here-string when the character before it is `=` (covers `=`, `+=`, `$env:X=`). Check the command-mode twin `Write-Output a=@'` + newline + `b` + newline + `'@` against pwsh before choosing the condition, and follow pwsh.

## SHOULD (Fable F1, Opus S1): a comment glued to these closers hides a pipe; main asks
Each needs a `#` glued with no space and an odd quote in the comment; then the apostrophe opens a mid-word quoted part that runs to the end, so `npm test | Select-Object -Last 1; git commit -m x` on the next line goes unasked (lane silent, main asks, pwsh asks):
1. a second index after a variable's index: `$a[0][1]#it's`, `$a[0]['k']#it's`, `$a[$b[0]]#it's`, `$a[0]['k'][1]#it's` (after the first `]` the scanner opens a new word; the second `[` fails the variable regex, so its `]` ends no token);
2. an array subexpression: `@(1)#it's`, `@()#it's` (the `(` is not at a token start, so its `)` ends no token);
3. a member call with arguments: `$a.b($c)#it's` (same cause). `$a.b()#it's` and `$a.b#it's` are misses main shares: fix them only if the same change covers them; otherwise leave them in the recorded member-access residual.
Fix shapes 1 to 3 if PowerShell's tokens show a token end there; do not fork the lexer per PowerShell version.

## Tests
- Add deterministic cases (R-1733's token-start table or a new row in this lane's block, R-1737 to R-1739 — a here-string after an assignment is not "inside a bare word", so it likely needs its own row): each MUST command above, and one case per SHOULD shape. Each red on b92f3185.
- Add corpus words so the oracle covers each class: an assignment glued to a here-string whose body holds an apostrophe; a second index; `@( … )` and a member call with arguments, each glued to a comment with a quote. Keep every command parse-clean in pwsh 7 and Windows PowerShell 5.1. Report how often each occurs in the 1,500 commands.

## Done
- Single files green: both pipe-guard test files (the oracle one with the local pwsh first on PATH and a temp HOME — the live oracle must PASS), `packages/nana-setup/tests/verifier-pipe.test.mjs`, `packages/nana-pack/tests/gate-corpus.test.mjs`.
- Trace, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check` green. Single files only; do NOT run the full suite; do NOT push; do not edit HANDOFF.md or docs/sessions/.

## Report (≤10 lines)
VERDICT; commit; each fix; the new cases with red-before evidence from PowerShell's tokens; corpus counts; the local oracle result; wrong-code tries.
