VERDICT: DONE

- Commits: `54c2b26` fixtures, code, README and evidence; `16d5ffb` restored mapped test title; `c5ad660` seat results.
- Files: `REQUIREMENTS.md`, `docs/code-map.md`, `packages/nana-pack/README.md`, `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/tests/land.test.mjs`, seat output.
- Evidence rows: R-975–R-977, R-979, R-588 and R-1002–R-1007, R-1009, R-1011 now cite marked tests. Removed both retired R-978 tests.
- Fixtures now create version-2 LAND reviews by default; tests for uncovered commits and invalid reviews set those conditions explicitly. Fixed suite-failure output.
- Mutation pairs: none; deferred to the next round as directed.
- Checks: `req:tree`, `map`, `map:check`, `readme:check` — exit 0. `template:accept` — exit 0.
- Seat verification scripts — both exit 0; output committed.
- `npm run test:locked`: **133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6687 pass, 0 fail, 5 skip · 593.1s**.
- Scope check from launch HEAD `0faf6f1`: 6 files changed, 62 insertions, 50 deletions. Worktree clean.
- Not done: focused per-row tests and mutation pairs remain for the next round.
