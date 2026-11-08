Feature: FEAT-013 · Install and connect harness runtimes

# Review brief 4: setup-tail — confirmation round

Review only `git diff be61fd48..HEAD`: a builder's merge of current main, which brought memory-cuts, rules-lessons and small fixes, with 14 conflict hunks in `steps.mjs`, `uninstall.mjs`, `uninstall.test.mjs`, the setup README and the code map. Merge report: `docs/reviews/setup-tail/merge-main/report.md`. Judge that both lanes' behaviour survives: memory-cuts' memory-hook retirement and placeholder, this lane's dangling verifier-link removal with foreign-link safety and dry run, both README corrections, and that nothing from either side was dropped. Bar as in round 1.
