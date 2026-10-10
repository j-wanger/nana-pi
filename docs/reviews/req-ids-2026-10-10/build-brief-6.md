# Lane req-ids — continuation 5: the tree counts a row only when the rail does (sol confirmation r4 SEND-BACK; astra r4 LAND)   (2026-10-10 · feat/req-ids)

Read `sol-build-r4.md`. Change nothing else.

**MUST — one row test, owned by the rail.** `scripts/requirements-tree.mjs` recognises a row by its
prefix only (`ROW` at :20), so a candidate the rail rejects — missing closing pipe, a non-whitespace
character after it, five cells — is counted by the tree and rendered in the outline. Export ONE
row test from the TypeScript rail (for example `requirementRowId(line)`: the ID when the line, after
the rail's line-end whitespace strip, is a complete requirement row — opening and closing pipe,
exactly four cells trimmed with the shared whitespace, a valid ID — else `null`). Use it in the
rail's own near-miss check and row readers so the rail keeps one copy, re-export it through
`scripts/requirements-trace.mjs`, and make the tree collect rows only through it (drop the tree's own
`ROW`). A malformed candidate is then not counted by the tree, and the rail fails it naming the line.
The seat script has four cases; all fail at `6a74cfd`.

**SHOULD — R-287 evidence.** Add the tree test that refuses a whitespace-variant row outside any
feature (`packages/nana-pack/tests/requirements-tree.test.mjs:164`) to R-287's Evidence cell.

**NOTE — the text contract.** `loadRequirements()` and `shallCounts()` take text whose leading BOM
was already removed by the file reader; say so in their doc comments, and make the test at
`templates/typescript/template/tests/requirements-trace.test.ts.jinja:182` assert what its title
claims (or retitle it).

**Tests.** `packages/nana-pack/tests/requirements-tree.test.mjs`: a candidate missing its closing
pipe, one with a letter after it, and one with five cells, inside a feature → not counted and absent
from the outline. Cite them in R-287's evidence. Mutation pair: put the prefix-only `ROW` back in the
tree → red; restore → green.

Then: `npm run req:tree`, `npm run map:check`, `npm run test:locked`, commit,
`npm run template:accept`, then
`node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs > docs/reviews/req-ids-2026-10-10/seat-verify-ids-output.txt 2>&1`
(must exit 0), commit that file, and paste its LAST TWO LINES verbatim.

Rules, NOT and allowlist as `build-brief-5.md`; this brief, `CHANGE.md`, `HANDOFF.md`,
`docs/sessions/2026-10.md` and the seat script are frozen. Report ≤ 25 lines, first line `VERDICT: …`.
