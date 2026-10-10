# Lane req-ids — continuation 2: one line definition in both rails (seat, after build r2)   (2026-10-10 · feat/req-ids)

Your round-2 fix works for CRLF and trailing spaces. The seat then found that the two rails still
disagree about what a LINE is. `seat-verify-ids.mjs` now carries 12 new cases; 10 fail at `5fa1056`'s
successor `153d638`. Change nothing else.

**The bug.**
(a) TypeScript silently DROPS a valid row whose cell holds U+2028, U+2029 or a lone "\r": the
near-miss check calls it a valid row, then `ROW`'s `(.*)` does not match those characters, so the
row is never loaded and the rail reports no problem. That is the silent skip R-1001 exists to stop.
(b) Python splits with `str.splitlines()`, which also breaks lines at U+2028, U+2029, U+0085, form
feed, lone "\r" and others, so the same valid row fails as malformed.
(c) `trimEnd()` and `rstrip()` strip different character sets (JS strips U+FEFF, Python strips
U+0085 and U+001C–U+001F), so the rails disagree on some row endings.

**Fix — one definition in both rails, every reader (ledger, general file, Part G merge, near-miss
check, test-file marker scan):** a line is the text between "\n" characters (Python: `split("\n")`,
never `splitlines()`); strip ONLY spaces, tabs and "\r" from its end (TS `replace(/[ \t\r]+$/, "")`,
Python `rstrip(" \t\r")`), replacing round 2's `trimEnd()`/`rstrip()`; never strip leading
whitespace. `ROW` takes the `s` flag so a cell may hold any character but "|". Then a no-break space
after the closing pipe is a near-miss and fails naming its line in both rails — that is intended.

**Docs.** Both template ledgers' row sentence: add "Spaces, tabs and a carriage return after the
closing pipe are ignored." Rename the pack test whose title claims "trailing spaces/tab" on the
CRLF fixture (it has none) and update its evidence citation.

**Tests.** In both template self-tests and `packages/nana-pack/tests/requirements-trace.test.mjs`
(Python through the skip-gated `uvx pytest` run): U+2028 and U+0085 inside a cell → the row is read
and clean; a no-break space after the closing pipe → fails at its line. Cite them in R-1001's
evidence. Mutation pairs, each red then green: drop the `s` flag; put back `splitlines()`; put back
`trimEnd()`.

Then: `npm run map:check`, `npm run test:locked`, commit, `npm run template:accept`, then
`node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs > docs/reviews/req-ids-2026-10-10/seat-verify-ids-output.txt 2>&1`
(must exit 0), commit that file, and paste its LAST TWO LINES verbatim in the report.

Rules, NOT and allowlist as `build-brief.md`; this brief and the seat script are frozen. Report ≤ 25
lines, first line `VERDICT: …`.
