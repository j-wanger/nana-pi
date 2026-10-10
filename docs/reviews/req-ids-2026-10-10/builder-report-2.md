VERDICT: DONE
Commits: `bcdfc0a`, `cd9f916`, `153d638` on `feat/req-ids`.
Files: both template rails and self-tests; `packages/nana-pack/tests/requirements-trace.test.mjs`; `REQUIREMENTS.md`.
Rows: R-1001 evidence now pins valid row endings and line-specific CRLF rejection; R-1000 unchanged.
Mutation pair: removed trailing-whitespace stripping from both rails → tests red (exit 1); restored → green (exit 0).
Commands: `npm run req:tree` 0; `npm run map` 0; `npm run map:check` 0; final `npm run test:locked` 0.
`npm run template:accept` 0; seat verifier 0: `seat-verify-ids: 0 mismatch(es)`.
Suite: 132 PASS, 0 FAIL, 1 SKIP; 6,664 checks passed, 5 skipped.
Scope: 6 files, 139 insertions, 17 deletions from launch HEAD; worktree clean.
Not done: native Windows execution.
Note: an earlier locked run caught fixture formatting issues; fixed before the passing rerun.
