Feature: FEAT-043 · Measure memory outcomes

# Review brief 3: memory-cuts — confirmation round

Review only `git diff da101073..HEAD`. `memory-cut-checks.test.mjs` M5 (R-3864) re-ran whole-repo checkers with a 20 s limit. The same pattern turned main's Windows suite red today in setup-retire M7. The loop is removed, and R-3864 and the test title are narrowed to what the test still reads from the files. Question: does M5 still prove the removed behaviour's rows and artifact lines are retired, with no repo-checker re-run left in the lane's new tests? Bar as in round 1.
