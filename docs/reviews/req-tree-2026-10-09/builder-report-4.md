VERDICT: DONE

- **Commit:** `54cc87f` — `req-tree: close outline and ledger review findings`; worktree clean.
- **Files:** `scripts/requirements-tree.mjs`, `packages/nana-pack/tests/requirements-tree.test.mjs`, `docs/requirements-tree.md`, `REQUIREMENTS.md`.
- **Outline IDs:** all headings checked against the committed outline; leaf counts total **1,009**. R-291’s evidence now cites the committed-outline test; no status flips.
- **Finding 1 — ID omission:** round-trip property tests cover runs of 1–4, gaps, unsorted IDs, and mixed prefixes; the real-ledger test checks every heading. Removing the two-ID fix made the property test red; restoring it made the test green.
- **Finding 2 — table boundaries:** fixtures cover prose, a blank after a table, a missing delimiter, and a fenced row. Removing table-row tracking made the fixture test red; restoring it made the test green.
- **Finding 3 — SETEXT headings:** fixtures pin R-287, R-288, and R-290 boundaries, fenced ATX opacity, and thematic breaks. Disabling SETEXT recognition made all three boundary tests red; restoring it made them green.
- **Commands:** `npm run req:tree` 0; `npm run map` 0; `npm run map:check` 0; approved proof 0; `npm run test:locked` 0.
- **Proof:** 1,004 base rows preserved; 5 new rows; 125 ledger blocks and 1,554 physical lines accounted; 64 old headings mapped. The ledger’s only change is R-291 evidence.
- **Suite:** 133 files; 132 pass, 0 fail, 1 skip; 6,602 checks pass, 0 fail, 5 skips.
- **Scope:** this commit touched only allowlisted files. The approved-base diff includes prior lane commits; its `git diff --stat` reports 27 files.
- **Residual:** HTML blocks/comments, link reference definitions, and indented code are not modeled; the ledger uses none.
- **Not done:** no review or land acceptance.
- **Claim most likely wrong:** the simplified block scanner matches CommonMark beyond the explicitly excluded cases.
