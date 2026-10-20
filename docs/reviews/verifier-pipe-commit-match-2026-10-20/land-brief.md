# Review — verifier-pipe-commit-match (the shared verifier-pipe predicate asks only when a masking pipeline's exit status can reach a git commit, and recognises git.exe, letter case and path spellings of git), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff 7aadbc99..HEAD` on `feat/verifier-pipe-commit-match` (main was `7aadbc99` when this brief was written;
`git merge-base HEAD main` is `7aadbc99`; the lane merged main 7aadbc99 at e45d4656). The plan of record is
`docs/reviews/verifier-pipe-commit-match-2026-10-20/must-meet.md`: eight must-meet checks, rows R-2350 to R-2357, with
R-982 retired (superseded by R-2350 to R-2354) and R-1064 reworded. `plan-attack.md` holds the adversary's AMEND;
`build-brief-1.md` to `build-brief-5.md` are the five builds (1d92a68d, 99ffeb73, ad08d901, c2d0dcb4, e5b0483e). The
seat's record is `seat-verify-b9236432.md`. CI run 39508818938 on draft pull request #149 at e45d4656 (build 5, the
seat's pairs record and the merge of main) reads 0 failing on all three legs: macOS 196 PASS, 0 FAIL, 2 SKIP of 198
files (8,157 checks pass, 36 skip); Ubuntu 195 PASS, 0 FAIL, 3 SKIP (8,096 pass, 56 skip); Windows 180 PASS, 0 FAIL, 18
SKIP (7,086 pass, 114 skip), where hooks-win32-exec passes 31, R-1064's three checks among them. The install check
passes on macOS and Windows. The Windows leg's log is `ci-windows-e45d4656.log` in this folder. b9236432, after CI,
changes only R-1064's row and three comment lines above its checks. The land runs the locked suite on the reviewed
tip. The record also holds the macOS wrong-code pairs (`seat-mutate.mjs`; 67 of 70 red on build 5, with K1, K8 and C1
declared) and four independent checks, one per build from 1 to 4 (`independent-check-<build>.md`); the build-4 check
found no MUST, and build 5 fixed its two fail-opens. The final reviewer's brief is `review-brief.md`.

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

The code under review: `packages/nana-pack/lib/pipe-guard.mjs`, the predicate that the Claude Code PreToolUse hook runs
on every Bash or PowerShell call and that pi's nana-gate runs on every bash or powershell tool call. On main it asked
whenever a live pipe came before a git commit. Now it asks only when something reads a masking pipeline's exit status
before the commit, and it stays silent where a `;`, a top-level line break, a command substitution or a bash background
`&` discards that status. It also recognises `git.exe`, any letter case, a path and a quoted word as git. The install
check's sealed PowerShell sample moves from `;` to `&&` in `packages/nana-setup/lib/install-check-config.mjs`.

Judge whether the lane fails open: a shape main asks on, where a reader takes the status before the commit, that the
predicate, the repository hook or the headless pi gate now lets through, in bash or PowerShell (line continuations,
quoted line breaks, escapes, heredoc delimiters, subshell errexit and double-quote tracking are where the builds found
them); a hook that now exits non-zero, throws or overruns Claude Code's 5 s limit on honest input; or a must-meet check
that passes with the change removed (R-2351 and R-2354 are pins, green on main by design, that the pairs turn red).
Judge whether it leaves a harm the review standard lists, such as a broken hook or gate, or a test writing outside the
temp folders it owns. Judge whether anything main does today stopped working: the pipefail exemption, PowerShell
pipefail as inactive, quoted heredoc bodies, the reason text, the gate's precedence, the install check's sample through
the hook, and all three CI legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known limit: commands
that still ask although the read cannot change the path; reads that go unasked by design (a pipeline ending an `if`
branch before `else`, a `$?` after another command, PowerShell `if (P)`, git through a variable or a command
substitution, a commit inside the pipeline); on Windows PowerShell 5.1 the check asks only on the `$?` shapes; relief is about 70
percent, and narrowing by the pipe's last program is the owner's call; a 64 KB double-quoted run of escaped backticks
takes about 2.8 s through the hook on main and every build; `g\it` and `git co\mmit` go unasked on main and the tip;
`git\ commit` now asks where bash runs no commit (fails closed); the marker of `<<\EOF > file` and `<<\EOF | tee` is not
found on main or the tip; `$'don\'t'` is misread on main and the tip; pairs K1, K8 and C1 survive, declared; nobody
re-ran the independent check on build 5, whose two fixes pairs E8 and Q3 pin.

Threat model: honest variation in our tools' output and the OS is in scope: how models and shells spell a command
(separators, line continuations, quoting, escapes, heredocs, CRLF, git spellings and letter case) in bash, PowerShell 7
and Windows PowerShell 5.1, on macOS, Linux and Windows. Deliberate forgery is out: evasion through eval, aliases,
functions, variables or a later call; the sandbox is the boundary. Lane class: install, hook or gate — the shared
predicate behind the Claude Code PreToolUse hook and pi's nana-gate, plus the install check's sealed sample.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

**Seat addition after the notes:** HANDOFF also gains one optional ask for the owner, whether to narrow the check by the pipe's last program (the plan names that as the owner's decision); the seat recommends leaving it as it is.
