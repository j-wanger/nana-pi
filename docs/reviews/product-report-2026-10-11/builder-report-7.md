VERDICT: DONE
- [x] A–E: assessment order and labels, status bars/pills, feature links, compact rows, and frozen acceptance cases.
- Commit: `c88aa72` — `product-report: polish routed report views`.
- Files: `REQUIREMENTS.md`, product-report renderer/template/tests, seat acceptance output.
- Rows: R-1014–R-1016 updated; rendered-view tests cover the changes.
- Mutation pairs: assessment after rows → mismatch (exit 1); raw key → mismatch (exit 1); plain-text feature IDs → mismatch (exit 1). Restored code passes.
- Commands: `req:tree`, `map`, `map:check`, `readme:check` all exit 0; report twice and byte comparison exit 0.
- Seat acceptance and title check exit 0; `0 mismatch(es)` and `0 gap(s)`.
- `npm run test:locked`: exit 0.
- Suite summary: 135 files; 134 PASS, 0 FAIL, 1 SKIP; 6,759 checks pass, 0 fail, 5 skip.
- Not done: browser visual check; prototype file was unavailable in this worktree.
- Most likely wrong claim: the chosen status hues match the prototype.

```text
ok   packets: refused while REQUIREMENTS.md differs from HEAD: true/0 (want true/0)
seat-verify-report: 0 mismatch(es)
```
```text
ok   replaced: R-291: every real heading's committed IDs survive expansion and leaf counts total 1,024 → R-291: every real heading's committed IDs survive expansion and leaf counts total 1,043
seat-verify-tests: 0 gap(s)
```
