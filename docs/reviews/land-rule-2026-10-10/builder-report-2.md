VERDICT: PARTIAL

Commits: `dd5ac7a` — restored the land tests, removed the acceptance-script test, and added the title map and seat output.
Files: `packages/nana-pack/tests/land.test.mjs`, deleted `packages/nana-pack/tests/land-rule.test.mjs`, `docs/reviews/land-rule-2026-10-10/test-title-map.json`, `docs/reviews/land-rule-2026-10-10/seat-verify-land-output.txt`, `docs/code-map.md`.
Rows: title mappings cover the renamed tests; requirement evidence retagging and focused tests for the new rows remain undone.
Mutation pairs: none run.
Commands: `req:tree` 0; `map` 0; `map:check` 0; `readme:check` 0; `template:accept` 0; seat land verifier 0; seat test verifier 0.
Suite: `npm run test:locked` failed — 129 PASS, 3 FAIL, 1 SKIP; 6,665 checks passed, 24 failed, 5 skipped. The restored land tests still include obsolete expectations.
Coverage threshold: not established; baseline was 6,783 checks, and the retired-test check deduction was not measured.
Seat output, last two lines:
`ok   the pre-change ledger code refuses a tally holding version-2 records: refused (want refused)`
`seat-verify-land: 0 mismatch(es)`
`ok   replaced: …and they are ONE round (1 tally line, 10 audit verdicts) → …and they are ONE round (10 v2 verdict records, 10 audit verdicts)`
`seat-verify-tests: 0 gap(s)`
Not done: update land fixtures and obsolete assertions, pin and retag every required row, run all CHANGE §6 mutation pairs, and pass the full suite.
