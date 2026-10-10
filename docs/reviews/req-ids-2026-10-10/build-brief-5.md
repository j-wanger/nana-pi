# Lane req-ids — continuation 4: one BOM removal, and the tree checker on the rail's whitespace (sol and astra build r3, both SEND-BACK)   (2026-10-10 · feat/req-ids)

Read `sol-build-r3.md` and `astra-land-r3.md`. The seat already fixed astra's MUST 3 and SHOULD
(`HANDOFF.md`, the session entry). Change nothing else.

**MUST A — remove a leading BOM exactly once (astra MUST 1).** Python strips a U+FEFF when reading
a file and again in the near-miss check; TypeScript strips at read and again in the row loader. Two
BOMs before a first-line row then give different results in the two rails. Rule: each file's text
loses ONE leading U+FEFF, ONCE, whatever path reads it, and every consumer of that file (near-miss
check, row load, shall counts, row cells, Part G merge, marker scan) sees the same text. Pick one
place per path and remove the others; an exported function that takes text must not strip a second
time after its caller did.

**MUST B — the tree checker uses the rail's whitespace (sol MUST 1, astra MUST 2).**
`scripts/requirements-tree.mjs:19` builds its row prefix with JavaScript `\s`, so a row the rail
loads (`|<U+0085>R-1000 | … |`, also U+001F) is silently dropped: zero rows, zero problems, missing
from the outline. Re-export the rail's whitespace definition through `scripts/requirements-trace.mjs`
(no copy) and build the tree's row recognition from it. The tree also removes one leading U+FEFF from
the ledger text, once. Not in scope: the tree's CRLF handling (the Windows lane).

**Tests.** `packages/nana-pack/tests/requirements-tree.test.mjs`: U+0085 and U+001F around an ID
inside a feature → counted, no problems, in the outline; the same row outside any feature →
refused (R-287); a BOM before the first heading → read. The rails: two BOMs before a first-line row
→ the same outcome in both (`packages/nana-pack/tests/requirements-trace.test.mjs` and both template
self-tests). Cite them in R-287's and R-1001's evidence. Mutation pairs, red then green: put `\s`
back in the tree's row prefix; add a second BOM removal back in each rail.

Then: `npm run req:tree`, `npm run map:check`, `npm run test:locked`, commit,
`npm run template:accept`, then
`node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs > docs/reviews/req-ids-2026-10-10/seat-verify-ids-output.txt 2>&1`
(must exit 0; 8 cases fail before the fix), commit that file, and paste its LAST TWO LINES verbatim.

Rules, NOT and allowlist as `build-brief.md`, plus `scripts/requirements-tree.mjs` and
`packages/nana-pack/tests/requirements-tree.test.mjs`; this brief, `CHANGE.md`, `HANDOFF.md`,
`docs/sessions/2026-10.md` and the seat script are frozen. Report ≤ 25 lines, first line `VERDICT: …`.
