# Lane req-tree — increment B, continuation 3: R-293 "before any table" (sol build-b r3, LAND-WITH-FIXES 8.5/10)   (2026-10-10 · feat/req-tree)

Read `sol-build-b-r3.md`. One MUST; change nothing else.

**R-293 accepts a `Status:` line after a non-requirement Markdown table** (`scripts/requirements-tree.mjs`
~167–170): the checker compares the status position only with the first recognized REQUIREMENTS
table. Fix: record the first Markdown pipe table of ANY kind after each feature heading (a header
line plus a delimiter line, as the parser already models tables), and reject a `Status:` line at or
after it, naming the line. Add sol's exact fixture to the R-293 tests: a two-column table between a
feature heading and its `Status: active` → a problem. Mutation: disable the new comparison → the
fixture's test goes red; restore → green.

Then: the proof `--approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce --inputs 8c2ec5274662850a6e8173b5ef048aaf5b191548`,
`npm run map:check`, `npm run test:locked`, `bash docs/reviews/req-tree-2026-10-09/seat-verify-b.sh`
(paste VERBATIM). Rules, NOT and allowlist as `build-brief-b1.md`; do not touch `HANDOFF.md`.
Report ≤ 20 lines, first line `VERDICT: …`.
