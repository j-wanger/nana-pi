VERDICT: DONE
Commit: `0864b17` (`fix verdict line-position comparison`).
Files: `REQUIREMENTS.md`, `review-round.mjs`, `review-ledger.test.mjs`, and acceptance/suite outputs; row R-1010.
Mutation pairs: four identical marked forms now record empty; identical plain verdict and a single marked final verdict still record LAND.
Commands: tagged test, mutation run, acceptance, title check, locked suite all passed (exit 0).
Suite: 133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6711 pass, 0 fail, 5 skip · 661.9s
Mutation output: `worktree clean` · `mutations: 17/17 red`; acceptance: `corpus: 435 files, {"word":421,"empty":14}, 0 mismatch(es) with the prototype` · `seat-verify-verdict: 0 mismatch(es)`
Title check: `seat-verify-tests: 0 gap(s)`; not done: nothing.
