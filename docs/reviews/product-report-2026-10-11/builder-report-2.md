VERDICT: DONE

- Commit: `e396237` — Build deterministic product ledger report command.
- [x] A — Froze the current HANDOFF fixture; frontier golden tests pass.
- [x] B — Added the report command, template, tests, and README guidance.
- [x] C — Added `npm run report` and ignored its output folder.
- **Files:** `scripts/product-report.mjs`, `scripts/product-report/template.html`, `packages/nana-pack/tests/product-report.test.mjs`, frozen frontier fixture/test, `REQUIREMENTS.md`, `README.md`, `package.json`, `.gitignore`, `docs/code-map.md`.
- **Rows implemented:** R-1012–R-1019, R-1025, R-1028, R-1030.
- **Mutation pairs:** Skip normalization → CRLF test failed; omit JSON escaping → hostile-text test failed; hardcode commit or clean flag → temporary-repository tests failed; skip tree or malformed-ask refusal → respective tests failed. Restored code passed.
- **Commands:** `npm run req:tree` (0); `npm run map` (0); `npm run map:check` (0); `npm run readme:check` (0); `npm run report` twice with temporary outputs and `cmp` (0).
- **Suite:** `npm run test:locked` — 135 files: 134 PASS, 0 FAIL, 1 SKIP; 6,731 checks passed, 5 skipped.
- **Not done:** Assessment storage and packets are next round; R-1026 remains planned. Worktree clean.
