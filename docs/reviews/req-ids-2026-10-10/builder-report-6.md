VERDICT: DONE

- Commits: `9886ee6`, `df6e791`, `9272548`, `263d3fe`.
- Files: rail-owned row recognition and tree integration; malformed-row tests; R-287 evidence; BOM contract test and comments; seat verification output.
- Rows: R-287 evidence now cites the outside-feature refusal and malformed-candidate test.
- Mutation pair: prefix-only tree recognition made the new malformed-row test red; rail-owned recognition restored green.
- Tests: focused tree and trace tests passed (exit 0).
- Commands: `npm run req:tree` (0); `npm run map:check` (0); `npm run test:locked` (0); `npm run template:accept` (final run 0; initial run 1, fixed); seat verification (final run 0; initial run 1, fixed).
- Suite: 133 files; 132 PASS, 0 FAIL, 1 SKIP; 6,688 checks passed, 5 skipped.
- Seat output’s last two lines:
  ```text
  python rail: exercised
  seat-verify-ids: 0 mismatch(es)
  ```
- Not done: nothing; worktree is clean.
