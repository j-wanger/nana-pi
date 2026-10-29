VERDICT: DONE

- **Commit:** `005092b2` — `feat: add gains and misses to planner asks`.
- **R-3070** — Implemented; evidence: `packages/nana-pack/tests/planner-prompt.test.mjs::R-3070: planner prompt specifies the five-line owner-question form, ranking and overflow`.
- **R-3071** — Implemented; evidence: `packages/nana-pack/tests/ask-shape.test.mjs::R-3071: ask parser reads gains label forms and leaves absent or empty values null`.
- **R-3072** — Implemented; evidence: `packages/nana-pack/tests/product-report.test.mjs::R-3072: Decisions cards place present gains between recommendation and cost and omit absent gains`.
- **R-3073** — Implemented; evidence: `packages/nana-pack/tests/product-overview.test.mjs::R-3073: Needs you places first-group gains after recommendation and before cost`.
- **R-3074** — Implemented; evidence: `packages/nana-pack/tests/ask-shape.test.mjs::R-3074: recommendation prefers inline Recommendation, then a full group default, then body Default`.

- **Wrong-code pairs:** Four-line prompt → R-3070 failed; parser without gains → R-3071 failed; prior recommendation priority/truncation → R-3074 failed; renderer without gains → R-3072 and R-3073 failed. These tests ran red before implementation.
- **Commands:** Targeted tests passed (exit 0): `planner-prompt.test.mjs`, `ask-shape.test.mjs`, `product-overview.test.mjs`, `product-report.test.mjs`. Initial wrong-code run failed as expected (exit 1 for each). Final `npm run test:locked` passed (exit 0). Map, README, requirements trace, tree, known-bugs and identity checks passed (exit 0).
- **Suite:** 235 files: 233 PASS, 0 FAIL, 2 SKIP; 8,689 checks passed, 44 skipped.

**Needs you:** Issue 255 now shows its full default recommendation, “yes. What it does first, then Needs you, then a closed Records section holding Broken, Gaps and Stale”; no gains line. Issue 256 shows its full default recommendation, “After build 1, right after first-look, only on a lane that changes the product page. It reads that lane's diff as its focus and the lane's after page as context”; no gains line. Issue 259 shows its question, the default recommendation beginning “yes. It names the default's trade against the main alternative,” its gains-and-misses line, and its easy-to-undo cost.

**Precedent departures:** None. R-2920 was already retired as specified. Existing tests changed: the planner prompt test now pins R-3070; ask-shape expectations now include `gains: null` and reflect full group-default recommendations. Other changed tests add new cases.

**Not done:** No issue was edited and no live-page deployment was performed.
