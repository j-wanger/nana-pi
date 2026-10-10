VERDICT: DONE

- Commits: `4d0e320` line handling; `df01347` raw Python boundaries; `5a5acbb` seat output.
- Files: `REQUIREMENTS.md`; pack trace tests; both template ledgers, rails, and self-tests; seat verification output.
- Rows: R-1001 evidence now covers Unicode cell content and near-miss endings; both rows remain implemented.
- Mutation pairs (red → green): dropped TS `s` flag (U+2028) 1 → 0; Python `splitlines()` (U+2028/U+0085) 2 → 0; TS `trimEnd()` (NBSP/BOM near-misses) 4 → 0.
- `npm run map:check` — exit 0.
- `npm run test:locked` — exit 0; `133 files: 132 PASS, 0 FAIL, 1 SKIP`; 6,678 checks passed.
- `npm run template:accept` — exit 0.
- Seat verifier — exit 0.
- Suite summary: 133 files, 132 passed, 1 skipped; no failures.
- Not done: none.
- Final two seat-output lines, verbatim:
  ```
  python rail: exercised
  seat-verify-ids: 0 mismatch(es)
  ```
