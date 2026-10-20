# verifier-pipe-commit-match — build brief 3

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip (the seat committed its build-2 pairs record). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main. The seat's own Claude Code verifier hook is switched off on this machine by the owner's choice; test the repository's hook file, never `~/.claude`.

## Why
The seat's re-check of build 2 (99ffeb73): pairs 52/59 red (`seat-mutate-output-99ffeb73.txt`) and an independent check with verdict FINDINGS (two MUSTs). Main asks on every shape below; 99ffeb73 returns null, the headless pi gate runs it, and real bash runs the commit after a masked failure.

**M1 — a line break inside quotes reads as a separator.** The bash lexer writes a quoted line break into `text` as a real line break (`text += ch === "\n" ? "\n" : " "`, pipe-guard.mjs ~132), and PowerShell's `hidden()` does the same; the status scan then discards the status there. Shapes: `npm test --json | jq '⏎ .numFailedTests⏎' > /dev/null && git commit -m x`; `npm test | sed -e 's/a/b/⏎s/c/d/' -e 's/x/y/' && git commit`; `npm test | grep -E "FAIL|⏎ERROR" --color=never && git commit`; PowerShell `npm test | Select-String -Pattern "FAIL⏎ERROR" -Quiet && git commit`.

**M2 — a line break after a later `|` ends the pipeline.** Build 2 skips a line break only straight after the first `|` (the `start` skip in `statusReadAfterPipeline`, ~473); a `|`⏎ after any later stage hits the plain separator rule (~488). Shapes: `npm test 2>&1 |⏎ grep -v DEBUG |⏎ tail -20 && git commit`; `npm test | grep -v DEBUG |⏎ tail -20 && git commit`; `npm test |&⏎ grep -v x |⏎ tail -5 && git commit`; PowerShell `npm test |⏎ Where-Object { $_ } |⏎ Select-Object -Last 5 && git commit`.

**K3 — build 2's comment rule is wrong.** It treats a backslash-newline inside a bash comment as continuing the comment; bash ends a comment at the line break regardless. So `echo hi # note \⏎npm test | tail -5 && git commit -m x` returns null where main and build 1 ask.

**Readers still lost against main (all realistic, fail closed):** `P & wait %1 && git commit`; `P & pid=$!; wait $pid && git commit` (treat any `wait` after a backgrounded masking pipeline as a reader); errexit set inside `{ … }`, after `then` or after `do` (`{ set -e; P; }; git commit`); a backslash-escaped `\&` in bash (`npm test | sed s/a/\&/ && git commit`) is a literal character, not a background operator.

**Test gaps (pairs survived):** X6 (`${?}` inside double quotes); S24 (a PowerShell pipeline with a cmdlet stage then a native last stage, `npm test | Select-Object -Last 5 | findstr PASS; if ($LASTEXITCODE -eq 0) { git commit }`); K2 (a backslash-newline inside bash double quotes); K5 (a backtick-newline inside a PowerShell double-quoted string); K8 (no no-ask case has a pipe after a continued line: add `git log |⏎ head -3⏎git commit -m x`, which must stay null).

**Speed (known bug, outside the threat model, fix if simple):** a pipe followed by `(` or `{` that never closes makes the closer search rescan to the end each time: `a|(;` repeated to 64 KB takes about 5.4 s (3 ms on main), over Claude Code's 5 s hook timeout. Honest input stays under 16 ms.

## Do, nothing else
1. M1: a line break inside quotes (bash single, double, `$'…'`; PowerShell single, double, here-strings) becomes a space in the scanned text in both dialects, never a separator. Keep R-2350's discard on a real top-level line break.
2. M2: a line break (or comment then line break) directly after ANY `|` or `|&` of a pipeline continues that pipeline, in both dialects, however many stages come before.
3. K3: a backslash before a line break inside a bash comment does not continue the line; the comment ends at the line break.
4. The four lost readers above, failing closed.
5. Add every shape above to R-2351's test as an asking case (both dialects where they apply), plus X6, S24, K2, K5 and the K8 no-ask case; keep every existing case green. Add at least one asking case with three or more stages and line breaks after the second `|`.
6. Speed: make the unclosed-bracket scan linear (for example one pass that records each opener's closer, or stop at the first unmatched opener). If that is not a small change, leave it and say so in the report. Re-measure 64 KB realistic input and the `a|(;` repeat in both dialects.
7. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`, `pipe-guard-pwsh-oracle.test.mjs`, the gate corpus test file, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `install-check.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`.
8. Commit with explicit paths.

**Report** (8 lines or fewer, VERDICT first): commit; each command's result; the M1, M2 and K3 shapes red on 99ffeb73 and green now; the timing before and after.
