VERDICT: DONE

- Commit: `40145d8` — `product-report: add assessment refresh packets and guide`
- [x] A — R-1029 implemented; files: `REQUIREMENTS.md`, `scripts/product-report.mjs`, product-report tests.
- [x] B — Refresh guide and README link/options added; file: `docs/product-report/assess-brief.md`.
- [x] C — Seat acceptance output recorded; file: `docs/reviews/product-report-2026-10-11/seat-verify-report-output.txt`.
- Also updated `docs/code-map.md`; worktree is clean.
- Mutation pairs, red → green: current-feature packet, non-empty refusal, missing stamp, reversed rows, missing shared rows.
- Tagged test: `node packages/nana-pack/tests/product-report.test.mjs` — exit 0.
- Checks: `req:tree`, `map`, `map:check`, `readme:check` — exit 0.
- Full suite: `npm run test:locked` — exit 0; **135 files: 134 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6748 pass, 0 fail, 5 skip · 652.9s**.
- `npm run report` twice and byte comparison — exit 0; seat acceptance — exit 0.
- Not done: no second-model packet review; assessments stayed frozen.
- Claim most likely wrong: packet rows and the HEAD stamp remain coherent when the working-tree ledger differs from HEAD.
- ok   packets: a current feature gets no packet: FEAT-002.json (want FEAT-002.json)
- seat-verify-report: 0 mismatch(es)
