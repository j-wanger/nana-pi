# verifier-pipe-commit-match — build brief 4

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip (the seat committed its build-3 pairs record). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main. Test the repository's hook file, never `~/.claude`.

## Why
The seat's re-check of build 3 (ad08d901): the independent check HOLDS (`verifier-pipe-commit-match-b3`), pairs 61/67 red (`seat-mutate-output-ad08d901.txt`). Three rare spellings are fail-opens against main (main asks, the tip returns null), all from build 3's new escape rule or a missing errexit opener:

1. **`\git`:** build 3's unquoted-escape rule blanks the backslash and the next character, so `\git` becomes `  it` and no commit is found. `npm test | tail -5 && \git commit -m x` asks on main, null on the tip.
2. **`(set -e; …)`:** the errexit detector does not accept `(` before `set`. `(set -e; npm test | tail -5; git commit -m x)` asks on main, null on the tip; real bash runs the commit after a masked failure.
3. **`<<\EOF`:** the escape rule blanks `\E` in a backslash-quoted heredoc delimiter, so the marker is not found and the quoted body is scanned as live text. `cat <<\EOF⏎don't⏎EOF⏎npm test | tail -5 && git commit -m x` asks on main, null on the tip (the body's `'` opens a quote that hides the rest). The reverse also happens: `cat <<\EOF⏎npm test | tail && git commit⏎EOF⏎git commit -m x` is null on main but asks on the tip.

Pairs: K10 is a test gap (no case has `|&` after a later stage: `npm test | grep x |& tail -5 && git commit -m x` must ask). K2 and K5 survive because build 3 made the quoted backslash-newline (bash) and backtick-newline (PowerShell) branches write exactly what the plain path writes; delete those dead branches. K1 (backslash-CRLF outside quotes) is the real bash behaviour either way; leave it.

## Do, nothing else
1. Escapes: an unquoted backslash hides only the character after it when that character is an operator, a quote, a space or a line break; an escaped letter or digit stays visible (so `\git` is git), in the live text and wherever the git finder reads.
2. A heredoc delimiter written with a backslash (`<<\EOF`, `<<-\EOF`) is a quoted delimiter: find its marker and hide the body, as for `<<'EOF'`.
3. errexit: accept `(` (and `$(`) before `set -e` / `set -o errexit` as an opener, as `{`, `then` and `do` already are.
4. Delete the two dead quoted-continuation branches (bash backslash-newline inside double quotes; PowerShell backtick-newline inside a double-quoted string) if the full pipe-guard test stays green without them.
5. Add the four shapes above (the two heredoc shapes with their main outcomes: the first asks, the second stays null) and the K10 shape to R-2351's test (and R-2350's for the null case); keep every existing case green.
6. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`, `pipe-guard-pwsh-oracle.test.mjs`, the gate corpus test file, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `install-check.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`. Re-measure 64 KB honest and `a|(;` timing in both dialects.
7. Commit with explicit paths.

**Report** (6 lines or fewer, VERDICT first): commit; each command's result; the three shapes red on ad08d901 and green now; the timing.
