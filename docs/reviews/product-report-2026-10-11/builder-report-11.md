VERDICT: PARTIAL

- Commits: `4b3846e` (README, requirements tree, refresh guide, renderer, tests); `a8da5c1` (assessment, trace tests, acceptance evidence).
- [x] A feature filtering; [x] B refresh guide and recipe test; [x] C Issues pills; [x] D rendered-clause coverage; [x] E installation assessment refreshed; [x] F README history wording.
- Rows implemented: R-1013–R-1015, R-1017–R-1021, R-1027, R-1029–R-1030, R-1040–R-1042. R-1016 implemented; phone-width wrapping split to R-1043, `untested`.
- Files: `scripts/product-report.mjs`, `packages/nana-pack/tests/product-report.test.mjs`, `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/product-report/assess-brief.md`, `docs/product-report/assessments.json`, `README.md`, review output and title-map files.
- Mutation pairs: `21/21 red`; worktree clean afterward.
- Commands: `req:tree`, `map:check`, `readme:check`, `test:locked`, report twice byte-identical, title check: exit 0. Frozen seat report: exit 1.
- `test:locked`: `135 files: 134 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6776 pass, 0 fail, 5 skip · 709.1s`
- Seat report output, last two lines:
  `ok   packets: refused while REQUIREMENTS.md differs from HEAD: true/0 (want true/0)`
  `seat-verify-report: 1 mismatch(es)`
- Seat title output, last two lines:
  `ok   replaced: R-291: every real heading's committed IDs survive expansion and leaf counts total 1,024 → R-291: every real heading's committed IDs survive expansion and leaf counts total 1,047`
  `seat-verify-tests: 0 gap(s)`
- Mutation output, last two lines:
  `worktree clean`
  `mutations: 21/21 red`
- Not done: independent review. The frozen seat verifier expects all migrated assessments to retain the old stamp, conflicting with the required refreshed assessment’s packet stamp; I left the verifier unchanged.
