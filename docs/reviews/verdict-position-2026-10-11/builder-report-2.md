VERDICT: DONE
Commit: `3668886ef5de1464882f92979b81b195518b8a2f` — test compatibility-form verdict refusals.
Files: `packages/nana-pack/tests/review-ledger.test.mjs`; `docs/reviews/verdict-position-2026-10-11/seat-mutate-output.txt`; seat mutation script included unchanged.
Row: R-1010. Added full-width and mathematical-bold verdict cases through the real launch path.
Mutation pair: remove NFKC normalization → tagged refusal check fails; restored. Mutation runner: 14/14 red; exit 0.
Commands: tagged test exit 0; `npm run test:locked` exit 0; both seat scripts exit 0.
Suite: `133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6708 pass, 0 fail, 5 skip · 642.0s`
Seat title output: `seat-verify-tests: 0 gap(s)`
Seat acceptance output:
```text
corpus: 414 files, {"word":404,"empty":10}, 0 mismatch(es) with the prototype
seat-verify-verdict: 0 mismatch(es)
```
Mutation output:
```text
worktree clean
mutations: 14/14 red
```
Not done: nothing else; worktree clean.
