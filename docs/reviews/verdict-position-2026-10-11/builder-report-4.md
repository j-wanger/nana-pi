VERDICT: DONE
Commit: `d481a53` — verdict-position: cover post-NFKC folds and final bare score.
Files: `REQUIREMENTS.md`, `review-ledger.test.mjs`, and both seat output files; rows R-969/R-1010. `seat-mutate.py` was unchanged.
Mutation pairs: Removing the post-NFKC fold made both new refusal cases fail; removing the final-line bare-score grammar made the new acceptance case fail. Restored focused test passed.
Commands: focused test 1 (each mutation), 0 (restored); mutation runner 0; `npm run test:locked` 0; acceptance 0. Not done: no code change or title check.
Suite: `133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6711 pass, 0 fail, 5 skip · 666.5s`
worktree clean
mutations: 17/17 red
corpus: 338 files, {"word":330,"empty":8}, 0 mismatch(es) with the prototype
seat-verify-verdict: 0 mismatch(es)
