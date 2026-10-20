# verifier-pipe-commit-match — build brief 2

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip (the seat committed its pairs record after build 1). Rules: the builder preamble, but single test files only, never the full suite (other builders share this machine). No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main. The seat's own Claude Code verifier hook is switched off on this machine by the owner's choice; test the repository's hook file, never `~/.claude`.

## Why
The independent check on 1d92a68d (verdict FINDINGS) found one MUST and two known bugs; the seat's pairs (`seat-mutate-output-1d92a68d.txt`, 34/42 red) found seven test gaps.

**MUST — a pipeline that continues over a line break goes unasked.** `statusReadAfterPipeline` treats any LF or CR after the pipe as a status-discarding separator. Main asks on every one of these; the tip returns null in the hook and lets the headless pi gate run them:
- bash `npm test 2>&1 |⏎  tail -20 && git commit -m x` (a line break straight after `|` or `|&` continues the pipeline);
- bash `npm test 2>&1 | \⏎  tail -30 && \⏎  git add -A && \⏎  git commit -m x` (backslash-newline is a line continuation), also `| tail -n \⏎ 20 &&`, `| # comment⏎ tail -20 &&`, `|\r⏎ tail -20 &&`, `|& \⏎ tail -5 &&`;
- PowerShell `npm test |⏎ Select-Object -Last 5 && git commit` and `` npm test | Select-Object `⏎ -Last 5 && git commit `` (backtick-newline continues).
Real bash confirms the masked status crosses the break: `bash -c $'(exit 1) | tail -n \\\n 1 && echo COMMIT-RAN'` prints COMMIT-RAN.

**Known bugs that are fail-opens against main** (main asks, the tip does not):
- `P; [ ${?} -eq 0 ] && git commit` — the `${?}` spelling of the status.
- `P & wait $! && git commit` — bash `wait` returns the background pipeline's status.
- PowerShell `npm test | findstr PASS; if ($LASTEXITCODE -eq 0) { git commit }` — the plan said `$LASTEXITCODE` is not masked; that holds after a cmdlet such as Select-Object, which does not set it, but not when a native program ends the pipeline, because that program sets it.

**Pairs that survived (test gaps):** X5 (no case puts a quoted git path right after other text, `x"/usr/bin/git" commit`); S10 (no `case … esac` case: `case x in a) P;; esac && git commit`); S14 (no bash background case with a reader after `&`: `P & echo started && git commit`); S15 (no PowerShell case with `&` between the pipe and its reader: `P | & tail -5 && git commit`); S17 (no case reading a status after the last commit: `git commit -m x && P && echo ok`); P2 (the "logical OR is not a pipeline" negative still uses `;`; its `&&` form `npm test || true && git commit -m ok` pins it); E3 (no case sets errexit after the pipe, `P; set -e; git commit`, or turns it off with `set +e` before the pipe). P1: no case has two live pipelines. C1 (the install check's PowerShell sample) can turn red only on the Windows live install check; the seat declares it.

**A test that fails from this lane's own folder:** `packages/nana-setup/tests/install-check.test.mjs` (lines ~365, ~442, ~634, unchanged from main) decides which fixture calls are hooks with `/nana-(objective|adoption|shared-memory|roster-notice|knowledge)|verifier-pipe/` over the whole command line. This worktree's path contains `verifier-pipe`, so every call naming the checkout counts as a hook and three checks fail here ("environment: every child gets the base environment…", "platform: NANA_SETUP_PLATFORM in the caller changes nothing", "dispatch: each hook runs in the fixture project…"). The product is right. nana-land runs the suite from this worktree, so it would fail.

## Do, nothing else
1. Fix the MUST in both dialects: an escaped line break (bash backslash-newline, PowerShell backtick-newline, either with CRLF) is whitespace, and a line break (or a comment then a line break) directly after an open `|` or `|&` continues the pipeline. A plain line break after a complete pipeline still discards its status (R-2350 unchanged). Add the shapes above to R-2351's test as asking cases, and keep R-2350's newline-discard cases green.
2. Fix the three known bugs, failing closed: `${?}` reads the status like `$?`; bash `wait` reads the status of a backgrounded masking pipeline; PowerShell `$LASTEXITCODE` reads the masked status unless the pipeline's last command is a Verb-Noun cmdlet name (case-insensitive, such as Select-Object or Where-Object; an alias such as `select` counts as native and asks). Update R-2351's wording only as far as these readers need, and the must-meet record's "$LASTEXITCODE is not masked" stays as the plan's record (the seat notes the change).
3. Add the test cases that close X5, S10, S14, S15, S17, P2 (change that negative to its `&&` form, keep a `;` form too) and E3 (both `set -e` after the pipe and `set +e` before it), plus one case with two live pipelines (P1).
4. Make install-check.test.mjs decide hook calls by the hook script's file name, not by any text in the command line, at all three places, so the file passes from a folder whose path contains `verifier-pipe` or another hook name. Show it: copy nothing; run the file from this worktree (3 failures before, 0 after).
5. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`, `pipe-guard-pwsh-oracle.test.mjs`, `gate-corpus.test.mjs` (or the gate corpus file this repo has), `packages/nana-setup/tests/verifier-pipe.test.mjs`, `install-check.test.mjs`, `hooks-win32-exec.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`. Re-measure the 64 KB timing in both dialects.
6. Commit with explicit paths.

**Report** (8 lines or fewer, VERDICT first): commit; each command's result; the MUST shapes red on 1d92a68d and green now; the timing.
