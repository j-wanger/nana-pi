# Review — pwsh-lexer-oracle (the pipe check reads PowerShell comments and quotes as PowerShell's own tokenizer does, and a test compares them), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff f497c5ad..HEAD` on `feat/pwsh-lexer-oracle` (`git merge-base HEAD main` is `f497c5ad`, which was
main when CI ran; main has since moved to `9d09376e`, the pi-settings-bom and post-edit-win-survivors lands, and this
lane has not merged it). The plan of record is `docs/reviews/pwsh-lexer-oracle-2026-10-19/must-meet.md`: seven
must-meet checks, rows R-1730 to R-1736, and one named edit to an existing case. `plan-attack.md` holds the adversary's
AMEND; `build-brief-1.md` and `build-brief-2.md` are the two builds. The seat's record is `seat-verify-c78c6e7.md`: CI
run 39338404113 on macOS, Ubuntu and Windows (`ci-windows-run-3.log` beside it), the macOS wrong-code pairs
(`seat-mutate.mjs`; `seat-mutate-output-983da287.txt`: 21 of 21 red; `seat-mutate-output-c78c6e7.txt`: 22 of 22 red, 0
survived), the oracle-only pairs on CI (`seat-mutate-ci.mjs`, `seat-mutate-ci-output-c78c6e7.txt`: 3 of 3 red on
Ubuntu and Windows) and the independent check (`independent-check-c78c6e7.md`: FINDINGS, no MUST, run on build 1
983da287, not on c78c6e7; F1 fixed in build 2 7ca1eafb; F2 a HANDOFF residual). The final reviewer's brief is
`review-brief.md`.

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

The code under review: `packages/nana-pack/lib/pipe-guard.mjs`, the predicate the Claude Code verifier hook and pi's
nana-gate run on every PowerShell command. One token-start scanner replaces `startsPowerShellComment`,
`matchPowerShellParen` and `liveTextPowerShell`; one pass gives the live text and the new export `powerShellSpans`.
It now recurses on every top-level `(`. Its quote sets and token enders come from the new `lib/pwsh-lexer-config.mjs`.
The comparison with PowerShell's tokenizer sits in `tests/pwsh-oracle.mjs` and
`tests/pipe-guard-pwsh-oracle.test.mjs`; one case in `tests/pipe-guard.test.mjs` flips, as must-meet names. The pack
README's verifier-pipe paragraph gains two sentences.

Judge whether the lane fails open: an honest PowerShell command that pipes output before `git commit`, that main
prompts for and PowerShell's tokens say should prompt, which the lane lets through (F1 was one, a backtick escape at a
word's start; build 2 fixed it, and nobody re-ran the independent check's wider comparison on c78c6e7); a throw in the
new scanner that the Claude Code hook turns into silence (F2 needs about 5,000 nested parentheses; any shallower honest
input that throws is a fail-open). Judge whether it leaves a harm the review standard lists: a broken hook or gate (a
crash, a slow judgment — the independent check measured 65 ms on the lane against 39 ms on main for a
1,000,000-character here-string — or pi's gate blocking honest commands on a handler error); or a test that writes
outside its temp folders, runs PowerShell through a shell, or leaves a PowerShell process behind. Judge whether
anything main does today stopped working: the bash dialect, the hook's ask and abstain output, the gate's PowerShell
prompts, R-1062's predicate table (one named case flipped), the gate corpus, and the suite on a machine without
PowerShell. The plan's known limits that HANDOFF records (a comment glued to an operator, a statement-start value, a
redirection, a parameter colon or a member access; nested strings inside a string's `$( … )`; a comparison bounded by
its alphabet; the wrong forms no check catches) are known limits unless the review standard lists them as harms.

Threat model: honest variation in our tools' output and the OS is in scope (commands a model writes for pwsh 7 or
Windows PowerShell 5.1: CRLF or lone CR line ends, typographic quotes from pasted text, comments glued to tokens, and
words with quoted or `$( … )` parts; macOS, Linux and Windows); deliberate forgery is out (a command crafted to hide a
pipe; the guard is advisory and the sandbox is the boundary). Lane class: install, hook or gate — the shared predicate
behind the Claude Code verifier hook and pi's nana-gate.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
