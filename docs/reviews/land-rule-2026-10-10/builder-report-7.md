VERDICT: DONE
- [x] Rewrote all four tests as boolean checks; function arguments now record a titled FAIL.
- [x] Mutation runner: 15/15 red; worktree clean. Baseline review-ledger test passed.
- [x] Both seat acceptance scripts passed; 0 mismatches and 0 gaps.
- Commits: `d5fa5b3`, `d4c5551`, `b6d5409`.
- Files: `packages/nana-pack/tests/review-ledger.test.mjs`; `docs/reviews/land-rule-2026-10-10/seat-mutate-output.txt`.
- Rows: R-969, R-1010, R-1008, R-970; each retains its requirement marker and named assertion.
- Commands: `req:tree` (0), `map:check` (0), focused tests (0), mutation runner (0), both acceptance scripts (0), `test:locked` (0).
- Suite: **133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6705 pass, 0 fail, 5 skip · 606.1s**.
- Scope: 2 files, 53 insertions, 21 deletions from launch HEAD; final worktree clean. Nothing else was changed.
- Mutation output, last two lines:
worktree clean
mutations: 15/15 red
