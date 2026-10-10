VERDICT: PARTIAL

- Commit: `c9299c0` — `REQUIREMENTS.md`, `packages/nana-pack/tests/land.test.mjs`.
- Rows: R-1003 cites the option-refusal test; R-1007 cites the success-output test; R-1009 cites the clone/order test. R-1002’s existing test names uncovered commits and verifies no merge.
- Focused tests: R-1003 checks both exemption placements and an unknown option, but does not inject a runner. R-1009 checks clone refusal before reviewed-SHA resolution or ledger reading. R-1004–R-1006 and R-1011 remain without the requested focused tests.
- Mutation pair: allow the removed option in the parser → option-refusal test red/green.
- Checks: `req:tree`, `map`, `map:check`, `readme:check`, `template:accept` — exit 0. Focused land and review-ledger tests — exit 0. Both seat scripts — exit 0.
- `npm run test:locked`: **133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6690 pass, 0 fail, 5 skip · 593.6s**.
- Seat-output commit: none; the generated output already matched the tracked file. Last two lines:
  `ok   replaced: …and they are ONE round (1 tally line, 10 audit verdicts) → …and they are ONE round (10 v2 verdict records, 10 audit verdicts)`
  `seat-verify-tests: 0 gap(s)`
- Scope from launch HEAD `b489431`: 2 files changed, 39 insertions, 3 deletions.
- Not done: exact restored evidence for R-975, R-976, R-977, R-979 and R-588; remaining focused tests; remaining CHANGE §6 mutation pairs.
- Most likely wrong: the new R-1003 test does not demonstrate the no-git-call condition with an injected runner.
