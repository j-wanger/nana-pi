VERDICT: DONE

- [x] **A — R-1021:** Added current/out-of-date/unassessed states and named row, purpose, and status differences. R-1028 remains implemented.
- [x] **B — Migration:** Added all 38 assessments, stamped from the ledger at `c4332ec`; `validateStore()` returns `[]`. Lowered FEAT-011 and FEAT-015 to `mostly solid`; no other `solid` ratings needed lowering.
- [x] **C — Acceptance:** `0 mismatch(es)`; output saved at `docs/reviews/product-report-2026-10-11/seat-verify-report-output.txt`.
- **Commit:** `f9aa0a4` — `product-report: show assessment staleness and migrate store`
- **Files:** `REQUIREMENTS.md`, `docs/product-report/assessments.json`, acceptance output, `packages/nana-pack/tests/product-report.test.mjs`, `scripts/product-report.mjs`.
- **Mutation pairs:** Own/shared mark, purpose, status, and covered-set mutants each failed acceptance; restored code passed.
- **Commands (exit 0):** `npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run report`, seat acceptance; `validateStore()` check.
- **Suite:** `npm run test:locked` — 135 files: 134 PASS, 0 FAIL, 1 SKIP; 6,745 pass, 5 skip.
- **Report counts:** 27 current, 11 out of date, 1 unassessed.
- **Not done:** Independent review and landing were not performed. Worktree is clean.
