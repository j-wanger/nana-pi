# Review round 2 — pwsh-lexer-oracle, 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources. Class: install, hook or gate (pipe-guard.mjs is the shared predicate behind the Claude Code verifier hook and pi's nana-gate). Threat model as round 1: honest variation in the commands a model writes for pwsh 7 or Windows PowerShell 5.1 in scope; deliberate forgery out.

Round 1 on `b92f3185`: Opus SEND-BACK (M1: a here-string glued to an assignment, `$msg=@'`, hid a later pipe that main and PowerShell flag; S1: a nested index glued to a comment); Fable LAND 8/10 (F1 SHOULD: a `#` glued to a second index, `@( … )` or a method call with arguments, before an odd quote, hid a pipe main flags; F2: stack depth is machine-dependent; F3: R-1730's evidence named build 1's run). This round reviews `git diff b92f3185..HEAD` on `feat/pwsh-lexer-oracle`:

- `d36aabcd` build brief 3; `3327c1cd` build 3 (a pi gpt-5.6-sol builder): a line-final here-string opener glued to a whitespace-free variable assignment (`=`, `+=`) opens a here-string, while command-mode `a=@'` stays a word as PowerShell has it; a second or nested index's `]` and any closed `( … )` end the token, so a glued `#` starts a comment. New rows R-1737 to R-1739; every new case red on b92f3185, expected values from pwsh 7.6.7's tokens; the corpus gained one command per class; the local oracle passed.
- `37d2e671` merges main `f0d6da24` (knowledge-pull-fail-open-pin: nana-knowledge tests only).
- `f9959fa8` the seat's macOS pairs on 37d2e67: 25/25 red, 0 survived; new pairs M23 to M25 put back build 2's rules and each turns its new cases red. The seat checked one more shape against pwsh 7.6.7: in `Write-Output a(b)#c | x` PowerShell reads `RParen` then `Comment`, so treating any closed `( … )` as a token end matches PowerShell.
- `c16ca541` and `916953cb`: the seat record, HANDOFF (member-access residual narrowed; stack depth reworded), R-1730's evidence now names run 39345087464.
- CI run 39345087464 on 37d2e671: macOS, Ubuntu and Windows 0 failing of 168 files; the oracle PASS for pwsh on every leg and for Windows PowerShell 5.1 on Windows; both install checks success.

Check: (1) M1 and F1 are closed: rerun your round-1 probes and the reviewer's tables on the tip; (2) build 3 opens no new fail-open against main (probe glued assignments in command mode, closed parens mid-word, `$a.b()#`, nested strings inside `$( … )`); (3) the new rows are no wider than their checks; (4) HANDOFF and the session entry match the tip; (5) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
