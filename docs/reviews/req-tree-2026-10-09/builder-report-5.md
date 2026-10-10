VERDICT: DONE

Commit: `7a078f7` — `req-tree: close r3 equality and row-byte proof holes`.
Files: `packages/nana-pack/tests/requirements-tree.test.mjs`; `docs/reviews/req-tree-2026-10-09/prove.mjs`.
Rows: R-291 equality check restored; proof now enforces canonical R-287–R-291 rows.
Mutations: extra outline line—red; renderer purpose mutation—red; restore—green.
Proof mutations: trailing bytes, fifth cell, `untested`, empty evidence—all exit 1; real ledger exits 0.
Commands: `npm run req:tree` exit 0, no diff; `npm run map:check` exit 0; proof exit 0; `npm run test:locked` exit 0.
Suite: 132 PASS, 0 FAIL, 1 SKIP; 6,603 checks passed, 5 skipped.
Worktree is clean. Nothing else was changed.
Most likely wrong: evidence citation text alone does not prove the cited check exists or carries the R-291 marker.
