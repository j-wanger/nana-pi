# Review — pwsh-lexer-oracle (the pipe check reads PowerShell comments and quotes as PowerShell's own tokenizer does, and a test compares them), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff f497c5ad..HEAD` on `feat/pwsh-lexer-oracle` (`git merge-base HEAD main` is `f497c5ad`, which was
main when CI ran; main has since moved to `9d09376e`, the pi-settings-bom and post-edit-win-survivors lands, and this
lane has not merged it). The plan of record is `docs/reviews/pwsh-lexer-oracle-2026-10-19/must-meet.md`: seven
must-meet checks, rows R-1730 to R-1736, and one named edit to an existing case (`$#` is one bare word).
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two builds. The seat's
record is `seat-verify-c78c6e7.md`: CI run 39338404113 on all three legs (the Windows log `ci-windows-run-3.log` beside
it), the macOS wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-983da287.txt`: 21 of 21 red;
`seat-mutate-output-c78c6e7.txt`: 22 of 22 red, 0 survived), the oracle-only pairs run on CI (`seat-mutate-ci.mjs`
through `win-pairs.mjs`; `seat-mutate-ci-output-c78c6e7.txt`: 3 of 3 red on Ubuntu pwsh and on Windows pwsh and
Windows PowerShell 5.1) and the independent check (`independent-check-c78c6e7.md`: FINDINGS, no MUST). The independent
check ran on build 1 (983da287), not on c78c6e7. Its F1, a fail-open the lane introduced, is fixed in build 2
(7ca1eafb); its F2, a stack overflow at about 5,000 nested parentheses, is a HANDOFF residual. No code or test changed
after 7ca1eafb except through the merge of main f497c5ad (c78c6e79); a0ae01aa and d23be1ea add only seat files.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement f497c5a..d23be1e: 7 rows in 1 features
FEAT-010 · Guard risky commands and protected resources
  R-1730 new (implemented)
  R-1731 new (implemented)
  R-1732 new (implemented)
  R-1733 new (implemented)
  R-1734 new (implemented)
  R-1735 new (implemented)
  R-1736 new (implemented)
```

The code under review: `packages/nana-pack/lib/pipe-guard.mjs` (one token-start scanner replaces the three PowerShell
functions; the new export `powerShellSpans`; the bash path, `verifierPipeReason`'s signature and the ` (…) ` live-text
form unchanged), `lib/pwsh-lexer-config.mjs` (new), the oracle helper `tests/pwsh-oracle.mjs` (new), the test
`tests/pipe-guard-pwsh-oracle.test.mjs` (new), the one edited case in `tests/pipe-guard.test.mjs`, one README
paragraph, REQUIREMENTS.md, and the regenerated tree and code map.

Judge whether the pipe guard's PowerShell lexer reports the comment and string spans PowerShell's own tokenizer does
over the seeded corpus (R-1730); whether a Windows PowerShell that does not start fails the run on win32 rather than
skipping (R-1731); whether a parse error or a missing result fails the comparison naming the command (R-1732); whether
`#`, `<#`, `@'` and `@"` inside a bare word stay in the word, a leading backtick escape included (R-1733); whether
typographic quotes act as their ASCII kind (R-1734); whether a lone CR ends a line comment (R-1735); and whether a `#`
right after a here-string or block-comment close opens one (R-1736). Judge too whether each check would fail with its
behaviour removed: the seat's 22 macOS pairs cover R-1731 to R-1736 and R-1062's table; this Mac has no PowerShell,
so the 3 oracle-only pairs ran on CI. Judge whether the lane asks less than main anywhere PowerShell's tokens say ask
(a fail-open), beyond F1, which build 2 fixed, and the plan's known limits.

Threat model: honest variation in our tools' output and the OS is in scope (commands a model writes for pwsh 7 or
Windows PowerShell 5.1: CRLF or lone CR line ends, typographic quotes from pasted text, comments glued to tokens, and
words with quoted or `$( … )` parts; macOS, Linux and Windows, pwsh 7.6 and Windows PowerShell 5.1); deliberate forgery
is out (a command crafted to hide a pipe; the guard is advisory and the sandbox is the boundary). Lane class: install,
hook or gate — `pipe-guard.mjs` is the shared predicate behind the Claude Code verifier hook and pi's nana-gate.

Check: (1) the must-meet checks are not vacuous: each named pair turns its check red, and the oracle compares
PowerShell's real tokens, not a copy of the scanner; (2) no fail-open against main on honest PowerShell input beyond
the plan's known limits; (3) the bash dialect, the hook's ask and abstain output and the gate's handling are unchanged;
(4) the oracle test spawns PowerShell with no shell, writes only inside its temp folders, and skips only where the plan
allows; (5) the one edited existing case is the one must-meet names; (6) the README sentence matches the code and the
known limits; (7) HANDOFF and the session entry are true; (8) any MUST.
