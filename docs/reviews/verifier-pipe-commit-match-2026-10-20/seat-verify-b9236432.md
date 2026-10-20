# Seat checks — verifier-pipe-commit-match builds 1 to 5, tip b9236432 (2026-10-20)

- Builds: five, by a pi gpt-5.6-sol builder through `pi-worker --lane verifier-pipe-commit-match --lane-size larger`
  (the roster's larger-lane builder), each closing the seat's re-check findings on the build before it. The lane
  branched from main 9552afb1 with the plan at 2e2fd08e (`must-meet.md`; `plan-attack.md`: one adversary, AMEND, eight
  amendments; `build-brief-1.md` with the seat's amendments and cross-lane fixes at its end). `build-brief-1.md`'s top
  says "from main 72abe19a or newer"; its seat sections moved the base to 9552afb1 and fixed the builder as pi sol.
  - Build 1 (1d92a68d): `packages/nana-pack/lib/pipe-guard.mjs` builds the must-meet Design. The commit finder takes
    `git` or `git.exe` in any letter case after the text start, whitespace, ``; & | ( ) { } ` ``, `/` or `\`. The
    status reader scans each pipeline once from its first pipe: `&&`, `||`, a following bash `then`/`do`, a `$?` in the
    next command and live bash errexit read the status; a `;`, a line break or a bash background `&` discards it; a
    closer, `fi`, `done` or `esac` after a separator is passed over. Two live-text exposures (`"$?"` in bash; a quoted
    word that is a path ending in git or git.exe) and the reader and closer vocabularies as named constants with
    `// contract: R-2351`. `@purpose` now reads "Detect when a later git commit reads a masking pipeline's exit status."
    Rows R-2350 to R-2357 sit in FEAT-010 after R-984; R-982 is retired (superseded by R-2350 to R-2354); R-1064 is
    reworded and, at the seat's amendment, set `untested` with its three markers `req-candidate`. pipe-guard.test.mjs
    gains the four tables and the R-2357 check, and every case whose pipe must stay live moves from `;` or a newline to
    `&&` there, in pipe-guard-pwsh-oracle.test.mjs, verifier-pipe.test.mjs and hooks-win32-exec.test.mjs. The install
    check's sealed `SAMPLE_INPUTS.verifier.powershellHit` becomes `npm test | Select-Object -Last 5 && git commit -m x`
    and install-check.test.mjs reads it by name. Both README guard lines and the setup README's hooks-table sentence
    state the read-status rule. pipe-guard.test.mjs: 84 PASS on main, 137 on build 1.
  - Build 2 (99ffeb73, `build-brief-2.md`): an escaped line break (bash backslash, PowerShell backtick, either with
    CRLF) is whitespace, and a line break or a comment then a line break straight after an open `|` or `|&` continues
    the pipeline; `${?}`, bash `wait` after a backgrounded masking pipeline, and PowerShell `$LASTEXITCODE` after a
    native last stage read the status; cases close the seven build-1 pairs gaps; install-check.test.mjs picks hook
    calls by the hook script's file name, so it passes from a folder whose path holds `verifier-pipe`. 163 PASS.
  - Build 3 (ad08d901, `build-brief-3.md`): a line break inside bash or PowerShell quotes or here-strings becomes a
    space, never a separator (M1); a line break after any later `|` continues the pipeline (M2); a bash comment ends at
    its line break whatever precedes it (K3); `wait %1`, `wait $pid`, errexit set inside `{ … }` or after `then`/`do`,
    and an escaped `\&` are handled; the unclosed-bracket scan is linear. 189 PASS.
  - Build 4 (c2d0dcb4, `build-brief-4.md`): an unquoted backslash hides only an operator, quote, space or line break
    after it, so `\git` is git; `<<\EOF` and `<<-\EOF` are quoted heredoc delimiters; `(` and `$(` open errexit; the
    two dead quoted-continuation branches are deleted; a `|&` after a later stage is pinned. 194 PASS.
  - Build 5 (e5b0483e, `build-brief-5.md`): `set +e` or `set +o errexit` after `(` or `$(` no longer turns errexit off
    for the outer command; a bash double quote closes after an even run of backslashes. 198 PASS.
  - The seat's commits between builds: the pairs records 3d6b127a, 50d29b7c, fc5cc689, a7c90767 and 9df0fbed, and the
    build briefs 3ab43b6b, 25d9ff50, 5500ff03 and b5faca6f. e45d4656 merges main 7aadbc99 (before CI); the review base
    and the merge base are 7aadbc99. b9236432 moves R-1064 back to `implemented` (below).
- CI run 39508818938 on draft pull request #149 at e45d4656 (build 5, the seat's pairs record and the merge of main
  7aadbc99) reads 0 failing on all three legs:
  - macOS 196 PASS, 0 FAIL, 2 SKIP of 198 files (8,157 checks pass, 36 skip).
  - Ubuntu 195 PASS, 0 FAIL, 3 SKIP of 198 files (8,096 checks pass, 56 skip).
  - Windows `198 files: 180 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 7086 pass, 0 fail, 114 skip`
    (`ci-windows-e45d4656.log`). The lane's files there: pipe-guard `198 pass`, pipe-guard-pwsh-oracle `38 pass`
    (pwsh and Windows PowerShell both ran the span comparison), gate-corpus `227 pass`, verifier-pipe `31 pass`,
    install-check.test `129 pass`, hooks-closed-output `7 pass`, hooks-win32-exec `31 pass`, including R-1064's three
    checks (log lines 5897 to 5901).
  - The install check passes on macOS and Windows.
  - Earlier runs on builds 1 to 4 were cancelled as superseded.
  - Main's own known failures: Ubuntu's path-spelling GP1 and GP2 until linux-path-spelling landed (main ca27d86); a
    pull-request run's R-291 leaf-total failure, a merge artifact of GitHub's merge commit. Windows main reads 0 FAIL
    since 4be0b79 (desk files are declared skips). None showed.
  - b9236432 came after CI. It changes only R-1064's row and three comment lines above its checks; no CI ran on it.
  - Scrub note: the copied log's darwin skip title reads `/tmp → <tmp>` and the project-key titles read `<home>` and
    `<repo>`, as in earlier lanes' copies; every other line is the job's own text.
- R-1064 (the Windows exec-form verifier entry): build 1 moved its three commands from `;` to `&&`, so its Windows
  evidence no longer covered them, and at the seat's amendment the row read `untested` with `req-candidate` markers.
  The Windows leg of run 39508818938 passed all three checks, and b9236432 sets it `implemented` again, with `req:`
  markers and evidence naming the run (job 118924414168, 31 pass) at e45d4656. It is not a residual.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2, merge base
  9552afb1). Every pair puts one product site the lane changed into its wrong form: main's behaviour, an earlier
  build's form or the obvious wrong implementation.
  - Build 1 (1d92a68d; `seat-mutate-output-1d92a68d.txt`, commit 3d6b127a): 34 of 42 red. X5, S10, S14, S15, S17, P2
    and E3 survived as test gaps, and C1 (Windows only).
  - Build 2 (99ffeb73; `seat-mutate-output-99ffeb73.txt`, commit 50d29b7c): 52 of 59 red. Build 2 closed the seven
    build-1 gaps. X6, S24, K2, K5 and K8 survived as test gaps, K3 found a new hole (build 2's comment rule), and C1.
  - Build 3 (ad08d901; `seat-mutate-output-ad08d901.txt`, commit fc5cc689): 61 of 67 red. K1 and K10 survived as test
    gaps, K2 and K5 as dead branches, K8 as equivalent on honest input, and C1. The record also declares a fail-open
    the seat found outside the pairs: a backslash heredoc delimiter (`<<\EOF`) hid its marker.
  - Build 4 (c2d0dcb4; `seat-mutate-output-c2d0dcb4.txt`, commit a7c90767): 65 of 68 red; K1, K8 and C1 survived. K2
    and K5 are gone with the branches build 4 deleted.
  - Build 5 (e5b0483e; `seat-mutate-output-e5b0483e.txt`, commit 9df0fbed; five shards): 67 of 70 red, 63 exactly
    their named titles, 1 with a named title green and 4 with an unnamed red. Baselines: pipe-guard 198 PASS,
    verifier-pipe 31, install-check 129, each 0 FAIL. E8 and Q3 pin build 5's two fixes. Three survivors, each
    declared: K1, a bash backslash and line break outside quotes no longer read as whitespace (build 1's form),
    which only a backslash before a CRLF could catch, and there real bash behaves like the wrong form; K8,
    `pipelineStarts` ending an open pipeline at a line break, which no honest test can tell apart; C1, the install
    check's PowerShell sample kept in main's `;` form, which only the Windows live install check sends.
- Independent checks: four, one per build from 1 to 4, each in a private clone with a temp HOME, comparing the tip with
  main 9552afb1 in the predicate, the repository hook and the headless pi gate. Each file is filed under its build's
  name. Nobody re-ran the check on build 5, which made two small fixes pinned by pairs E8 and Q3 (a HANDOFF residual).
  - Build 1 (`independent-check-1d92a68d.md`): FINDINGS. MUST: a pipeline continued over a line break went unasked
    (bash `|⏎`, backslash-newline, a comment then a line break, `|\r⏎`, `|& \⏎`; PowerShell `|⏎` and
    backtick-newline); real bash ran the commit after a masked failure. Known bugs: `${?}`, `P & wait $!` and
    PowerShell `$LASTEXITCODE` after a native last stage, three status spellings main asked on. Its read-only count over 8 days of local Bash
    commands with a pipe and "commit" (2,078 unique): main asked on 406 and the tip on 121, about 70 percent fewer,
    with 0 new asks.
    Settled: build 2 (99ffeb73) fixed the MUST and the three lost spellings. Its HANDOFF notes (no lane line; the
    pwsh-lexer-oracle line about a commit on the next line) are settled by this notes commit.
  - Build 2 (`independent-check-99ffeb73.md`): FINDINGS. M1: a line break inside quotes read as a separator. M2: a line
    break after a later `|` ended the pipeline. K1: four lost readers (`wait %1`, `wait $pid`, errexit inside `{ … }`,
    after `then` or `do`, and an escaped `\&`). K2: an unclosed bracket after a pipe made the scan quadratic, 5.4 s at
    64 KB and 5.13 s through the hook, over Claude Code's 5 s limit.
    Settled: build 3 (ad08d901) fixed M1, M2, the comment rule (the pairs' K3), the four lost readers and the slow
    scan (16 ms in bash and 12 ms in PowerShell at 64 KB on build 3). The pwsh-lexer-oracle line is reworded here.
  - Build 3 (`independent-check-ad08d901.md`): HOLDS, with two rare fail-opens against main: `\git` (build 3's escape
    rule blanked the backslash and the letter) and `(set -e; …)` (no `(` opener for errexit).
    Settled: build 4 (c2d0dcb4) fixed `\git`, `(set -e; …)` and the backslash heredoc delimiter the seat's pairs
    record declared.
  - Build 4 (`independent-check-c2d0dcb4.md`): FINDINGS, no MUST. It confirmed the three earlier fail-opens closed in
    the predicate, the hook and the gate. Two rare fail-opens against main: `(set +e …)` inside a subshell turned
    errexit off for the outer command (new in build 4), and a double-quoted string ending in an escaped backslash broke
    quote tracking (since build 3). The first appears in none of 110,280 unique local Bash commands, the second in no
    real commit command that reads a status. Its replay of 4,886 unique real commands holding git and commit:
    466 asked on main and pass quietly on builds 3 and 4, each discarding its status on purpose with `;`, a line
    break or a command substitution; 240 ask on every version; 0 new asks.
    Settled: build 5 (e5b0483e) fixed both fail-opens, pinned by pairs E8 and Q3. Its shared gaps (main and the tip
    alike) and its slow input are HANDOFF residuals: a 64 KB double-quoted run of escaped backticks takes about 2.8 s
    through the hook (up to 4.9 s in-process) on every version; `g\it` and `git co\mmit` go unasked; `git\ commit`
    now asks where bash runs no commit (fails closed); the marker of `<<\EOF > file` and `<<\EOF | tee` is not found;
    `$'don\'t'` is misread.
- The plan's known limits, each a HANDOFF residual: commands that still ask although the read cannot change the path
  (`P || true;`, `P && echo ok;`, `echo "exit $?"`, a pipe into a while loop, `for f in $(P)`, `echo "$(P)" &&`,
  errexit a later command turns off); reads not asked (a pipeline ending an `if` branch before `else`, a `$?` after
  another command, PowerShell `if (P)`, `$GIT commit`, `"$(which git)" commit`, a commit inside the pipeline);
  Windows PowerShell 5.1 has no `&&`, so there only the `$?` shapes ask; relief is about 70 percent, not the scout's
  97, and narrowing by the pipe's last program is a separate call for the owner. The plan's `$LASTEXITCODE` limit
  changed in build 2: it now reads the status when a native program ends the pipeline, and stays unmasked after a
  cmdlet. The plan's span-oracle limit is already carried (a machine without PowerShell skips the comparison).
- HANDOFF: one Landed line; the pwsh-lexer-oracle line about a hash sign glued to bare member access now says a piped
  test run, a `&&` and a commit on the next line go unasked; new lane residuals for the plan's limits, the build-4
  check's gaps and slow input, the three pairs survivors and the check not re-run on build 5.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2350 to R-2357 read `implemented` in REQUIREMENTS.md, each naming its check title. R-2351 is wider
  than the must-meet table, as builds 2 to 5 recorded each new reader, and build 4 added the backslash-quoted heredoc
  body to R-2350. R-982 reads
  `retired` and R-1064 `implemented`. At the notes commit (no code or row changed since b9236432): `node
  scripts/requirements-trace.mjs` reads `requirements: 1712 total (1479 implemented · 1 planned · 38 retired · 189
  untested · 5 violated); 1479 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads
  370 modules, 0 problems; `npm run readme:check` reads 736 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, main and merge base 7aadbc99, run at
  b9236432):
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
  CAP-03 moves from 171 to 179 rows and FEAT-010 from 76 to 84.
- Not in this record: a seat-run locked full suite (the land runs it on the reviewed tip) and the local macOS install
  check, which this hook lane runs before nana-land (CI's install check passes on macOS and Windows). No Windows pair
  ran, so C1 stays unrun.
