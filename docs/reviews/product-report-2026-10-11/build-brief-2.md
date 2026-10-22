# Lane product-report — build round 2: the report command (2026-10-11 · feat/product-report)

Round 1 (`builder-report-1.md`) built the foundations; the seat verified the frontier golden against
the pre-change code (all six byte-identical). Three items this round; do all three before you report.

- [ ] **A. Freeze the "current" golden input.** `frontier.test.mjs` reads the LIVE `HANDOFF.md` as the
  `current` fixture, so any HANDOFF edit breaks the golden. Copy today's HANDOFF into a fixture file
  next to `frontier-baseline.json` and read that instead (the golden bytes stay valid: same content).
- [ ] **B. The report command** `scripts/product-report.mjs` (mapped module, six-tag header) and its
  template `scripts/product-report/template.html`, per CHANGE §3–§4, WITHOUT stamps, assessments or
  packets (next round): options `--root <dir>` (default: the repo root), `--out <file>` (default
  `docs/product-report/out/nana-pi-product-ledger.html`), and an injectable git runner for tests;
  normalise the ledger text before parsing; refuse on tree-checker problems (R-1026) or a malformed
  "Open for the owner" entry (R-1030), naming them and writing nothing; capabilities (R-1014), features
  (R-1015), rows (R-1016), violated rows (R-1017), asks with body (R-1018); text inserted only as text
  nodes (R-1019, both halves pinned as CHANGE §4 says); commit hash, `%cI` date and clean flag
  (R-1013, pinned with temporary repositories and an injected failing runner); byte-identical runs
  (R-1012). Show each feature's assessment slot as "unassessed" for now (R-1028 comes with the store).
  `package.json` `report`; `.gitignore` the output folder. Tests in
  `packages/nana-pack/tests/product-report.test.mjs`; flip R-1012–R-1019, R-1026 and R-1030 to
  `implemented` with `// req:` markers and exact evidence — only rows whose clauses the tests pin.
- [ ] **C. README.** Root `README.md`: what the report is, `npm run report`, the script, how each seat
  publishes (Claude Code: republish to the same link; pi: open the file); keep `readme:check` green
  (a backticked output path needs `readme-check.config.json`'s `externalPaths`, or write it without
  backticks).

Mutation pairs, red then green: parse without normalising → the CRLF case; insert text as HTML → the
hostile-text test; hardcode the commit or the clean flag → the temporary-repository tests; skip the
tree-checker refusal → its test; skip a malformed ask instead of refusing → its test.

Then: `npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked` (must pass; report the summary line), `npm run report` twice with `cmp` on the
two outputs, commit with explicit paths. Rules as round 1. Frozen: `CHANGE.md`, `HANDOFF.md`,
`docs/sessions/`, `prototype/`. Report ≤ 25 lines, first line `VERDICT: …`, checklist ticked.
