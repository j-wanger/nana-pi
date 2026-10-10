VERDICT: DONE

- Commit: `8834e32` — `req-tree B: apply placement and lifecycle governance`; worktree clean.
- Read before writing: `tree-b.json:1434–1775, 2047–2057`; `fixed-text-b.md:20–46`; `move.mjs:17–98`; `prove.mjs:18–183`; `requirements-tree.mjs:146–298`; `requirements-tree.test.mjs:22–80, 124–190`; `seat-verify-b.sh:8–111`.
- Files changed: `REQUIREMENTS.md`, tree checker and tests, generated outline and section map, skill paragraph, code map, and review-folder `move.mjs`, `prove.mjs`, `prove-output.txt`.
- Rows R-287–R-294 are implemented. Tagged tests pin row placement, purpose lines, unique IDs, nesting, outline fields/status/shares/index, valid cross-feature shares, lifecycle statuses, and empty proposed/retired features. R-292 mutations cover unknown, duplicate, retired, and same-home IDs; R-293 covers missing/invalid/blank statuses and all legal forms; R-294 covers both statuses holding rows.
- Proof: `node docs/reviews/req-tree-2026-10-09/prove.mjs --approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce --inputs 9e415db252464d47515f83a7b793569163a79a22 REQUIREMENTS.md docs/requirements-sections-2026-10-09.md` — exit 0. Summary: `prove: 1004 BASE rows preserved once; 8 new rows; 125 ledger blocks and 1652 physical lines accounted; 64 old headings mapped`.
- Commands: `npm run req:tree` exit 0; `npm run map` exit 0; `npm run map:check` exit 0; `npm run test:locked` first exit 1 on missing R-287–R-290 test markers, then exit 0 after correction; `seat-verify-b.sh` exit 0.
- Suite summary: `133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6625 pass, 0 fail, 5 skip`.
- Scope check (`git diff --stat 9e415db..HEAD`): 11 files, 716 insertions, 198 deletions. The additional `build-brief-b1.md` is prior lane work, not changed in this commit.
- Difference from CHANGE-B: none found. Not done: no changes outside the declared scope. Most likely wrong claim: the reviewed placements and shares capture every direct dependency.

`seat-verify-b.sh` output, verbatim:

```text
inputs commit: 9e415db252464d47515f83a7b793569163a79a22
proof on the real ledger exit=0 (want 0)
checkTree real ledger problems=0 (want 0)
checkTree r292-own-home problems=1 (want >0)
checkTree r292-retired problems=1 (want >0)
checkTree r292-unknown problems=1 (want >0)
checkTree r292-duplicate problems=1 (want >0)
checkTree r293-missing problems=1 (want >0)
checkTree r293-done problems=1 (want >0)
checkTree r293-frozen-empty problems=1 (want >0)
checkTree r293-retired-empty problems=2 (want >0)
checkTree r293-whitespace problems=1 (want >0)
checkTree r294-proposed problems=1 (want >0)
checkTree r294-retired problems=1 (want >0)
checkTree four legal status forms problems=0 (want 0)
proof proof-old-home exit=1 (want 1)
proof proof-status exit=1 (want 1)
proof proof-also-drop exit=1 (want 1)
proof with a tree-b label changed exit=1 (want 1)
tree test on the real outline exit=0 (want 0)
tree test with one shared-index row deleted exit=1 (want 1)
tree test with one status deleted exit=1 (want 1)
outline restored: yes
```
