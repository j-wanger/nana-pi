VERDICT: DONE

- Commits: `5a4b6a5` BOM/whitespace fix; `7a12a35` seat-verifier output.
- Files: 10 total; trace rails and tests, tree checker and tests, `REQUIREMENTS.md`, verifier output.
- Rows: R-287, R-1000 and R-1001 evidence updated; no status flips.
- Mutations: tree `\s` restored → 2 tests red; fixed → green. Extra BOM removal in TS and Python → tests red; fixed → green.
- Commands: `req:tree` 0; `map:check` 0; `test:locked` first run 1 (template formatting), rerun 0; `template:accept` 0; seat verifier 0.
- Suite: 133 files; 132 PASS, 0 FAIL, 1 SKIP; 6,687 checks pass.
- Scope: 10 files changed, 62 insertions, 17 deletions from launch commit; working tree clean.
- Seat verification, last two lines:
  `python rail: exercised`
  `seat-verify-ids: 0 mismatch(es)`
- Not done: native Windows testing and the out-of-scope tree CRLF follow-up.
