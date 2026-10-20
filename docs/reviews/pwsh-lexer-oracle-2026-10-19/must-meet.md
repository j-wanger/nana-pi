# pwsh-lexer-oracle: must-meet

Feature: FEAT-010 · Guard risky commands and protected resources
Class: install, hook or gate. `pipe-guard.mjs` is the predicate that both the Claude Code verifier hook and the pi `nana-gate` extension run. The lane gets the land reviewer, the seat's wrong-code pairs, one independent check, a mutation re-run and install-check before nana-land.
Threat model: in scope is honest variation in commands a model writes for pwsh 7 or Windows PowerShell 5.1: CRLF or lone CR line ends, typographic quotes from pasted text, comments glued to tokens, and words with quoted or `$( … )` parts. Out of scope: a command crafted to hide a pipe. The guard is advisory; the sandbox is the boundary.
Sentence: wherever PowerShell runs (on CI, pwsh 7.6 on every leg and Windows PowerShell 5.1 on the Windows leg), a test compares the pipe guard's PowerShell lexer with PowerShell's own tokenizer over a seeded generated corpus. A lexer gap inside that corpus turns CI red instead of failing open in the hook.

## Design
- **One token-start scanner** replaces `startsPowerShellComment`, `matchPowerShellParen` and `liveTextPowerShell`.
  - `#`, `<#`, `@'` and `@"` open a comment or here-string only at a token start. Token starts: input start; after whitespace; at or after `& ( ) , ; { | }` (not the `(` of a word's own `$(`); after a standalone string, here-string or block comment closes; after a variable's `[ … ]` index; after a `)` whose `(` opened at a token start.
  - Inside a bare word these stay literal: `$`, a backtick escape (except backtick-LF), a quoted part, `]`, `${…}` and the word's own `$( … )`.
  - The same scanner, stopped at the closing `)`, finds subexpression bounds, inside strings too.
  - One pass yields the live text and a new named export, `powerShellSpans(command)`, which returns `{kind: "comment"|"string", start, end}` at every depth. Mid-word quoted parts are not reported, because PowerShell reports them inside Generic tokens.
  - The bash path, `verifierPipeReason`'s signature and the ` (…) ` subexpression live-text form are unchanged.
- **Typographic quotes:** ‘ ’ ‚ ‛ act as `'` and “ ” „ act as `"`. Each works interchangeably with its ASCII quote as opener, closer, doubled escape and here-string delimiter. A line comment ends at CR or LF.
- **Config** `lib/pwsh-lexer-config.mjs` (new): quote sets, token enders, oracle shell names, corpus seed and size, and oracle timeout. Provenance: the tokenizer probe of 2026-10-19 (pwsh 7.4.6 and 7.6.7 agree on every case below), or `chosen`.
- **Oracle helper** `tests/pwsh-oracle.mjs`:
  - a seeded grammar generator;
  - a runner with injected spawn and platform: `-NoProfile -NonInteractive -EncodedCommand`, no shell, the corpus in through a UTF-8 temp file, ASCII offset lines out through a temp file, no ConvertTo-Json;
  - a comparison over `Comment` and `StringLiteral|StringExpandable|HereStringLiteral|HereStringExpandable`, recursing into `NestedTokens`.
- **Shells:** `pwsh` wherever it is on PATH. On win32, `powershell` as well, and it is required there. Otherwise the file prints one SKIP line. The deterministic tables run everywhere, because the owner's Mac and the mutation runner have no PowerShell.

## Must-meet
| Row | Requirement | Test (file::title) | Red today |
|---|---|---|---|
| R-1730 | WHERE pwsh is on the test machine's PATH, or the platform is win32 (Windows PowerShell), the pipe guard's PowerShell lexer shall report the same comment and string spans as that PowerShell's own tokenizer for every command of the seeded generated corpus. | `packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs::oracle: ${shell} reports the lexer's comment and string spans for every generated command` | `powerShellSpans` does not exist. Planner probe, pwsh 7.4.6, 1,500 commands (seed 1): today's lexer disagrees on 890 of 1,155 parse-clean ones. A token-start prototype disagreed on 0 of 3,445 (seeds 1–3). |
| R-1731 | WHERE the platform is win32, IF Windows PowerShell does not start, THEN the oracle test shall fail naming it rather than skip. | `…::oracle: on win32 a Windows PowerShell that does not start fails the run instead of skipping` | The helper does not exist. The wrong code "SKIP on win32" must turn this test red. |
| R-1732 | IF PowerShell reports a parse error for a generated command or returns no result for one, THEN the oracle comparison shall fail naming the first such command. | `…::oracle: a parse error or a missing result fails the comparison and names the command` | The helper does not exist. The wrong code "ignore errors or a short list" must turn this test red. |
| R-1733 | WHERE the dialect is `powershell`, the pipe guard shall treat a `#`, `<#`, `@'` or `@"` inside a bare word as part of that word, never as the start of a comment or a here-string. | `…::token start: ${name}` | Null today, ask in PowerShell, for `Write-Output X \| Select-Object -Last 1; git commit -m x` with X = `a'b'#c`, `a]#c`, `$#c`, `a$(1)#c`, `` a` #c ``, `${a}#c`, `a'b'<#c`. Also for `Write-Output a@'\nb'; npm test \| Select-Object -Last 1; git commit -m x` and its `@"`/`b"` twin. Mirrors stay null: X = `$a[0]#c`, `'a'#c`. |
| R-1734 | WHERE the dialect is `powershell`, the pipe guard shall treat ‘ ’ ‚ ‛ as single quotes and “ ” „ as double quotes, interchangeable with the ASCII quote of the same kind, as PowerShell's tokenizer does. | `…::typographic quotes: ${name}` | Null today, ask in PowerShell: `Write-Output ‘a'; npm test \| Select-Object -Last 1; git commit -m x` and `Write-Output "a”; npm test \| Select-Object -Last 1; git commit -m x`. Mirror: `Write-Output “a \| b”; git commit -m x` asks today, but PowerShell has no pipe there. |
| R-1735 | WHERE the dialect is `powershell`, the pipe guard shall end a line comment at a carriage return as well as at a line feed. | `…::line end: a carriage return ends a line comment` | `Write-Output x # note\rnpm test \| Select-Object -Last 1; git commit -m x` is null today, and PowerShell asks. |
| R-1736 | WHERE the dialect is `powershell`, the pipe guard shall start a line comment at a `#` that directly follows the close of a here-string or a block comment. | `…::token start after a close: ${name}` | Null today, ask in PowerShell: `@'\nx\n'@#it's\nnpm test \| Select-Object -Last 1; git commit -m x`, its `@"` twin, and `<#a#>#it's\nnpm test \| Select-Object -Last 1; git commit -m x`. |

Each expected value comes from PowerShell's tokens, never from reasoning. The adversary probe ran every case above on pwsh 7.4.6 and 7.6.7. All cases parse clean, the two versions agree, and today's guard gives the "today" value shown.

## Existing test edit (named)
- The `pipe-guard.test.mjs` case "PS: a comment after a dollar sign hides a ) that would close early (§2.3.3 only)" flips from true to false. It is retitled to say `$#` is one bare word, and its comment is corrected.
- Both pwsh versions tokenize `$#` as one Generic token. So the `)` closes the subexpression, and the pipe stays inside the string.
- The other 76 cases stay green.
- Fourteen other R-1062 "true" cases are PowerShell parse errors, because inside a string PowerShell cuts `$( … )` at the first `)`. They stay true, which errs toward asking, and the generator never emits them.
- The R-1062 row text is unchanged.

## Known limits (record as residuals)
1. Expression mode: a `#` glued to an operator, or to a variable or value that starts a statement (`$a=#c`, `$a#c` at statement start, `1+#c`, `-eq#c`). PowerShell starts a comment there and the scanner does not. This fails open only when that comment holds a quote or `)`.
2. A comment glued to a redirection (`2>&1#c`, `>#c`) or to a parameter colon (`-m:#c`).
3. Member access, with or without an index (`$a.b#c`, `$a.b[0]#c`). PowerShell starts a comment and the scanner keeps a word, so `Write-Output $a.b#it's\nnpm test | …; git commit -m x` stays null (probed). Also `@(` and `@{` literals and type literals.
4. Inside a string's `$( … )`, PowerShell cuts at the first `)` and scans nested strings differently (`"$(echo "a`"b")"`). The scanner keeps the top-level rules.
5. Only the generated alphabet is verified. Windows PowerShell 5.1 is compared only on the Windows leg, and a lone CR only through R-1735's case. On a machine without pwsh, the oracle prints SKIP.
6. Nothing shows how Claude Code itself routes PowerShell. The HANDOFF residual stays.