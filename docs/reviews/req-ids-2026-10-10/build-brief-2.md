# Lane req-ids — continuation 1: valid row endings (sol and astra build r1, both SEND-BACK)   (2026-10-10 · feat/req-ids)

Read `sol-build-r1.md` and `astra-land-r1.md`. Both found the same blocking regression; nothing else
blocks. Change nothing else.

**The bug.** The new row validator rejects VALID rows: (a) the TypeScript rail rejects every row in a
CRLF ledger (lines split on "\n" keep "\r", so the closing-pipe test fails); (b) both rails reject a
row whose closing pipe is followed by spaces or a tab. Before this lane both were accepted. This
breaks Windows, the owner's stated priority.

**Fix.** In both rails, strip trailing whitespace (including "\r") from each line before validating
and before parsing a row — never leading whitespace (the column-zero rule stays). Apply it to
`REQUIREMENTS.md`, `REQUIREMENTS-general.md` and the test-file marker readers alike. A row truly
missing its closing pipe still fails, CRLF or not, naming its line.

**Tests.** In both template self-tests and in `packages/nana-pack/tests/requirements-trace.test.mjs`
(TypeScript through the shim, Python through the skip-gated `uvx pytest` run): a CRLF ledger and a
CRLF general file with three- and four-digit rows → read and clean; spaces and a tab after the
closing pipe → read and clean; a CRLF row missing its closing pipe → fails at its line; a CRLF test
file whose four-digit marker traces its row. Mutation pair: remove the trailing-whitespace strip →
these fixtures go red; restore → green. Cite the new tests in R-1001's evidence (the row-definition
clause) where they pin it.

Then: `npm run map:check`, `npm run test:locked`, commit, `npm run template:accept`, and
`node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs` (it now carries these cases; must exit 0
with `0 mismatch(es)`), pasted VERBATIM.

Rules, NOT and allowlist as `build-brief.md`; this brief and the script are frozen. Report ≤ 25
lines, first line `VERDICT: …`.
