VERDICT: DONE
- Commits: `f0680aa` (implementation); `3a538ca` (seat verification output).
- Files: `REQUIREMENTS.md`; both template ledgers, rails, and self-tests; `packages/nana-pack/tests/requirements-trace.test.mjs`; seat output.
- R-1000 remains implemented: tests pin ID grammar and marker parsing, including BOM, comma, and U+2028 cases in both rails.
- R-1001 remains implemented: tests pin whitespace handling, first-row BOM handling, and line-specific rejection of U+200B.
- Mutations, code only: TS `.trim()` red (exit 1), restored green (0); Python `.strip()` red (1), restored green (0).
- BOM-removal mutation red (1), restored green (0); Python marker `.split()` mutation red (1), restored green (0).
- `npm run req:tree` (0); `npm run map:check` (0); `npm run test:locked` (0); `npm run template:accept` (0).
- Suite: `133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6682 pass, 0 fail, 5 skip · 575.6s`
- Scope: `54fa67c..HEAD`, 9 files changed; worktree clean.
- Seat verifier output, last two lines:
  `python rail: exercised`
  `seat-verify-ids: 0 mismatch(es)`
- Not done: Windows-specific execution or landing/review approval.
- Claim most likely wrong: local Python parity results may not predict behavior on a separate Windows runtime.
