# Review — verifier-pipe-commit-match (the shared verifier-pipe predicate asks only when a masking pipeline's exit status can reach a git commit, and recognises git.exe, letter case and path spellings of git), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff 7aadbc99..HEAD` on `feat/verifier-pipe-commit-match` (main was `7aadbc99` when this brief was written;
`git merge-base HEAD main` is `7aadbc99`; the lane merged main 7aadbc99 at e45d4656). The plan of record is
`docs/reviews/verifier-pipe-commit-match-2026-10-20/must-meet.md`: eight must-meet checks, rows R-2350 to R-2357, with
R-982 retired (superseded by R-2350 to R-2354) and R-1064 reworded. `plan-attack.md` holds the adversary's AMEND (eight
amendments); `build-brief-1.md` is build 1 (1d92a68d), with the seat's amendments at its end; `build-brief-2.md` to
`build-brief-5.md` are builds 2 to 5 (99ffeb73, ad08d901, c2d0dcb4, e5b0483e), each closing the seat's re-check
findings on the build before it. The seat's record is `seat-verify-b9236432.md`. CI run 39508818938 on draft pull
request #149 at e45d4656 (build 5, the seat's pairs record and the merge of main) reads 0 failing on all three legs:
macOS 196 PASS, 0 FAIL, 2 SKIP of 198 files (8,157 checks pass, 36 skip); Ubuntu 195 PASS, 0 FAIL, 3 SKIP (8,096 pass,
56 skip); Windows 180 PASS, 0 FAIL, 18 SKIP (7,086 pass, 114 skip), where hooks-win32-exec passes 31, R-1064's three
checks among them, and the span oracle ran pwsh and Windows PowerShell. The install check passes on macOS and Windows.
The Windows leg's log is `ci-windows-e45d4656.log` in this folder. b9236432, after CI, changes only R-1064's row and
three comment lines above its checks. The land runs the locked suite on the reviewed tip. The record also holds the
macOS wrong-code pairs (`seat-mutate.mjs`; five records, 34 of 42 red on build 1 up to 67 of 70 on build 5, with K1, K8
and C1 declared survivors) and four independent checks, one per build from 1 to 4 (`independent-check-1d92a68d.md`,
`-99ffeb73.md`, `-ad08d901.md`, `-c2d0dcb4.md`): FINDINGS with a MUST, FINDINGS with two MUSTs, HOLDS, and FINDINGS with
no MUST. Each finding is settled in a named build; nobody re-ran the check on build 5, a HANDOFF residual.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
b9236432, before the seat's notes commit):

```
tree movement 7aadbc9..b923643: 10 rows in 2 features
FEAT-010 · Guard risky commands and protected resources
  R-982 implemented -> retired
  R-2350 new (implemented)
  R-2351 new (implemented)
  R-2352 new (implemented)
  R-2353 new (implemented)
  R-2354 new (implemented)
  R-2355 new (implemented)
  R-2356 new (implemented)
  R-2357 new (implemented)
FEAT-013 · Install and connect harness runtimes
  R-1064 text changed
```

CAP-03 moves from 171 to 179 rows and FEAT-010 from 76 to 84. R-1064's status reads `implemented` at both ends; it read
`untested` during the lane, between build 1 and b9236432.

The code under review: `packages/nana-pack/lib/pipe-guard.mjs` (the commit finder, the status reader, the live-text
exposures, the escape, heredoc, quote and errexit rules), which the Claude Code PreToolUse hook and pi's nana-gate both
call unchanged; the sealed `SAMPLE_INPUTS.verifier.powershellHit` in `packages/nana-setup/lib/install-check-config.mjs`;
and both README guard lines plus the setup README's hooks-table sentence. Tests: four new tables, the R-2357 gate check
and moved cases in `packages/nana-pack/tests/pipe-guard.test.mjs`; moved cases in `pipe-guard-pwsh-oracle.test.mjs`,
`packages/nana-setup/tests/verifier-pipe.test.mjs` (with the R-2355 and R-2356 checks) and `hooks-win32-exec.test.mjs`;
`install-check.test.mjs` reads the sample by name and picks hook calls by the hook script's file name. The rest of the
diff is the plan, the seat's records, the generated code map and tree, HANDOFF and the session entry.

Judge whether the predicate now asks exactly when something reads a masking pipeline's exit status before a later git
commit (`&&`, `||`, a following `then` or `do`, `$?` or `${?}` in the next command, `wait` after a backgrounded pipeline,
PowerShell `$?` or native-stage `$LASTEXITCODE`, live bash errexit), directly or through the group or loop it ends,
over line continuations and quoted line breaks, in bash and PowerShell; whether it stays silent only where a `;`, a
top-level line break, a command substitution or a bash background `&` discards the status; whether it recognises git as
the plan lists and rejects `legit`, `my-git` and `git-lfs`; whether the leading pipefail exemption, PowerShell pipefail
as inactive, quoted heredoc bodies, the reason text and the gate's precedence are unchanged; whether the cost stays
linear; and whether the tests write only inside the temp folders they own.

Threat model: honest variation in our tools' output and the OS is in scope: how models and shells spell a command
(separators, line continuations, quoting, escapes, heredocs, CRLF, git spellings and letter case) in bash, PowerShell 7
and Windows PowerShell 5.1, on macOS, Linux and Windows. Deliberate forgery is out: evasion through eval, aliases,
functions, variables or a later call, as R-982 declared; the sandbox is the boundary. Lane class: install, hook or gate —
the shared predicate behind the Claude Code PreToolUse hook and pi's nana-gate, plus the install check's sealed sample.

Check: (1) the must-meet checks are not vacuous: R-2350, R-2352, R-2355, R-2356 and R-2357 fail on main's code, R-2353
partly, and R-2351 and R-2354 are pins green on main by design that the pairs turn red; 67 of the 70 pairs on build 5
turn their named checks red — judge whether K1, K8 and C1 leave any must-meet check unproven; (2) no shape main asks on,
where a reader takes the status before the commit, now goes silent in the predicate, the repository hook or the
headless pi gate, in either dialect — the four independent checks and the five builds closed every such shape they
found; judge whether one remains; (3) nothing main does today stopped working: the pipefail exemption, PowerShell
pipefail as inactive, quoted heredoc bodies, the reason text, gate precedence, the install check's sample through the
hook, timing on 64 KB input, and all three CI legs; (4) R-1064 reads implemented on the Windows run's evidence, and
every README sentence the lane changed is true; (5) HANDOFF and the session entry are true, including the Landed line
with its relief figures, the reworded pwsh-lexer-oracle line and the eleven new lane residuals; (6) any MUST.

**Seat addition after the notes:** HANDOFF also gains one optional ask for the owner, whether to narrow the check by the pipe's last program (the plan names that as the owner's decision); the seat recommends leaving it as it is.
