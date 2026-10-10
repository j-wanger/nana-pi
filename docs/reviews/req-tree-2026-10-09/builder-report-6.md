VERDICT: DONE

Commit: `a1c050d7d69ddcbe7aa831391f15a12443975fed` — `req-tree: close astra land r4 verification gaps`
- Files: `REQUIREMENTS.md`, `docs/reviews/req-tree-2026-10-09/prove.mjs`, `packages/nana-pack/tests/requirements-tree.test.mjs`; rows R-287–R-291.
- Placeholder mutations: each new row changed to `untested | —` → proof exit 1; real ledger → exit 0.
- FEAT-001 purpose moved below its table in a scratch ledger → R-288 check failed, exit 1; restored scratch ledger → exit 0.
- Unauthorized line-11 edit → proof exit 1; A1-approved edit → proof exit 0.
- Commands: `npm run req:tree` 0; `npm run map:check` 0.
- Proof: `node docs/reviews/req-tree-2026-10-09/prove.mjs --approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce --amendment 48c92146f5c57be7d666cc9d90034b7196b39377 REQUIREMENTS.md docs/requirements-sections-2026-10-09.md` — exit 0.
- Proof summary: 1,004 base rows preserved once; 5 new rows; 125 ledger blocks and 1,554 physical lines accounted; 64 old headings mapped.
- `npm run test:locked` — exit 0. Suite: 133 files; 132 PASS, 0 FAIL, 1 SKIP; 6,604 checks pass, 0 fail, 5 skip.
- Not done: nothing in scope.
- Claim most likely wrong: the FEAT-001 mutation covers every R-288 purpose-placement failure mode.
