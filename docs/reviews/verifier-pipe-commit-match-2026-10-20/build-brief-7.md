# verifier-pipe-commit-match — build brief 7 (tests only)

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip (the seat committed its pairs record on build 6, 9f155fd2). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main. Change only `packages/nana-pack/tests/pipe-guard.test.mjs`; no product code.

## Why
The seat's pairs on 9f155fd2 read 69 of 76 red (`seat-mutate-output-9f155fd2.txt`). Two survivors are build 6 sites that the rows claim but no check pins:
- **E9:** with the new unquoted backtick block in `liveText` turned off, every check stays green. R-2351 says `set +e` inside a backtick substitution leaves outer errexit on; no case has a backtick or a process substitution.
- **X23:** with the new backtick escape in a double-quoted here-string turned off, every check stays green. R-2350 says `$?` behind a backtick escape stays literal; only a plain double-quoted string is tested.

## Do, nothing else
1. Add to R-2351's consumed cases (bash): ``set -e; `set +e`; npm test | tail -5; git commit -m x`` and `set -e; cat <(set +e; true); npm test | tail -5; git commit -m x`.
2. Add to R-2350's discarded cases (PowerShell): a `@"` here-string whose body holds `` `$? `` on its own line, closed by `"@`, then `npm test | Select-Object -Last 5`, a newline, and `git commit -m x`. Put the here-string before the pipeline, so only its escaped `$?` could read the status.
3. If any new case fails on 9f155fd2, stop and report it; do not change product code.
4. Show each new case red with its build-6 site turned off: the backtick block in `liveText` (`if (ch === "`") {` → `if (false) {`), the here-string backtick branch (`if (kind === "double" && ch === "`" && …` → `if (false) {`), and the scope restore (`active = scopes.pop().active;` → `scopes.pop();`) for the process substitution case.
5. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map:check`, `npm run -s readme:check`.
6. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; each new case green on the tip and red with its site turned off.
