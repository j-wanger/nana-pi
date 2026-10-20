# verifier-pipe-commit-match — build brief 8 (tests only)

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip 71f3904d (build 7). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main. Change only `packages/nana-pack/tests/pipe-guard.test.mjs`; no product code.

## Why
Build 7 reported PARTIAL, correctly: two of the seat's brief-7 cases could not prove their site. The seat's cases were wrong, not the build.
- ``set -e; `set +e`; …``: with the backtick block off, `set` right after a backtick is not an errexit change at all, so outer errexit stays on either way. The site matters when `set +e` follows a `;` inside the backticks.
- The here-string case put the here-string before the pipeline, so nothing it holds can read the pipeline's status.

The seat checked both corrected cases on a scratch copy of 71f3904d: each is right on the tip and wrong with its site off.

## Do, nothing else
1. In R-2351's consumed cases, add (keep build 7's three): ``set -e; `echo a; set +e`; npm test | tail -5; git commit -m x``.
2. In R-2350's discarded cases, replace build 7's here-string case with: `npm test | Select-Object -Last 5`, a newline, a `@"` here-string whose body holds `` `$? `` on its own line, closed by `"@`, a newline, `git commit -m x` (PowerShell). Name it for what it pins: a backtick-escaped `$?` in an expandable here-string after the pipeline stays literal.
3. Show each red with its site off: the `liveText` backtick block (`if (ch === "`") {` → `if (false) {`) for item 1; the here-string backtick branch (`if (kind === "double" && ch === "`" && i + 1 < source.length) {` → `if (false) {`) for item 2.
4. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map:check`, `npm run -s readme:check`.
5. Commit with explicit paths.

**Report** (4 lines or fewer, VERDICT first): commit; each command's result; each case green on the tip and red with its site off.
