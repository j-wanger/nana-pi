# Brief 2: pwsh-lexer-oracle

Feature: FEAT-010 · Guard risky commands and protected resources. Same worktree and branch as build 1 (tip a8b637cb). Class: install, hook or gate.

## Finding (the seat's independent check on 983da287, verified against pwsh 7.6.7's own tokens)
F1, a fail-open this lane introduces; main does not have it. In `packages/nana-pack/lib/pipe-guard.mjs` (around lines 128-132), a backtick escape that is not a line continuation leaves `tokenStart` unchanged. So a word that starts with an escaped character keeps its token-start state through that character, and a `#` right after it opens a comment. PowerShell keeps that `#` in the word, and so did main.
- Example (realistic: an escaped markdown heading in a one-liner): ``Add-Content CHANGELOG.md `## 1.2.0; npm test | Select-Object -Last 3; git commit -am v1.2.0`` — pwsh: ask; lane: null (the hook stays silent); main: ask.
- Also wrong today: `` `a#c ``, `` `##c ``, `` ‘s’`a#c ``.
- The oracle missed it because the corpus has no atom that starts with a backtick escape.

## Change
1. `pipe-guard.mjs`: after a backtick escape that is not a line continuation, `tokenStart` is false (a line continuation keeps today's behaviour). The independent check's one-line form: `tokenStart = source[i + 1] === "\n" || source[i + 1] === "\r";` in that branch — confirm it against PowerShell's tokens, do not trust it.
2. R-1733's token-start table in the oracle test file: add cases for a backtick escape at a word's start followed by `#`, and by `<#` if PowerShell keeps that in the word too. Read each expected value from PowerShell's tokens (unpack the PowerShell 7.6 release tarball under $TMPDIR as in build 1). Each case must be red on a8b637cb.
3. The oracle generator: add an atom that starts with a backtick escape (followed by `#`, `<#` or a letter), so the oracle covers this class. Keep every command parse-clean in pwsh 7 and Windows PowerShell 5.1. Do not change the seed or size unless the corpus no longer emits the new atom; if you change either, say why in the config's provenance.
4. No other product change. F2 (about 5,000 nested parentheses overflow the scanner's stack) is a contrived input: leave it; the seat records it.

## Wrong code to try
- Today's branch (keep `tokenStart` through the escape) → the new R-1733 cases red.
- Clear `tokenStart` after a line continuation too → an existing case red (name it), or say none catches it.

## Done
- Single files green: both pipe-guard test files (the oracle one with the local pwsh first on PATH and a temp HOME), `packages/nana-setup/tests/verifier-pipe.test.mjs`, `packages/nana-pack/tests/gate-corpus.test.mjs`.
- `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check` green.
- Do NOT run the full suite. Do NOT push; the seat pushes.

## Report (≤10 lines)
VERDICT; commit; the fix; the new cases with red-before evidence from PowerShell's tokens; the corpus atom and how often it occurs in the 1,500 commands; the local oracle result; the wrong-code tries.
