VERDICT: DONE

Commit: `32100cb` — `req-tree: reject invalid new-row proof lines`.
Files: `docs/reviews/req-tree-2026-10-09/prove.mjs`; `prove-output.txt` regenerated with the proof result.
Rows: R-287–R-291; no requirement rows changed.
Mutation pairs: each placeholder exits 1; the real ledger exits 0. The different line-11 edit exits 1.
Proof, `npm run map:check`, and `npm run test:locked`: exit 0.

Seat verification output, verbatim:
```text
amendment commit: 48c92146f5c57be7d666cc9d90034b7196b39377
real ledger proof exit=0 (want 0)
placeholder 'R-287 | untested | —' proof exit=1 (want 1)
placeholder 'R-288 | untested | —' proof exit=1 (want 1)
placeholder 'R-289 | untested | —' proof exit=1 (want 1)
placeholder 'R-290 | untested | —' proof exit=1 (want 1)
placeholder 'R-291 | untested | —' proof exit=1 (want 1)
different line-11 edit proof exit=1 (want 1)
amendment text present in ledger: 1
late purpose: checkTree problems=1 (want >0)
real ledger: checkTree problems=0 (want 0)
test asserts empty problems at: 27:check("R-288: real ledger has no structural problems", actual.problems.length === 0, actual.problems.join("; "));
tree test exit=0 (want 0)
```

Suite summary: 133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6604 pass, 0 fail, 5 skip · 560.9s

Not done: no other files or tests changed.
