VERDICT: DONE
Commit `441fa3b`; files: `REQUIREMENTS.md`, `move.mjs`, `prove.mjs`, `requirements-tree.test.mjs`, `requirements-tree.mjs`.
Rows: none newly flipped. R-291 field tests pin outline fields and index; R-292 tests reject duplicate lines and validate every share; R-293 tests reject duplicate statuses.
Mutation pairs: undeclared heading in tree and ledger rejected; duplicate metadata rejected; dropped index lister rejected; broken-renderer status drop rejected. Proof exit 0; `req:tree`, `map`, `map:check`, locked suite exit 0.
Proof: 1,004 BASE rows preserved; 8 new rows; 125 blocks and 1,652 physical lines accounted; 64 old headings mapped. Scope diff from `9e415db`: 22 files, including prior lane work. Worktree clean.
Suite: 133 files, 132 PASS, 0 FAIL, 1 SKIP; 6,630 checks passed, 5 skipped. Not done: nothing in this continuation. Most likely wrong: assuming tree traversal order is the intended complete heading order.
inputs commit: 8c2ec5274662850a6e8173b5ef048aaf5b191548
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
checkTree dup-status problems=3 (want >0)
checkTree dup-also problems=3 (want >0)
checkTree four legal status forms problems=0 (want 0)
proof proof-old-home exit=1 (want 1)
proof proof-status exit=1 (want 1)
proof proof-also-drop exit=1 (want 1)
proof with an undeclared heading in both tree-b and ledger exit=1 (want 1)
proof with a tree-b label changed exit=1 (want 1)
tree test on the real outline exit=0 (want 0)
tree test with one shared-index row deleted exit=1 (want 1)
tree test with one status deleted exit=1 (want 1)
tree test with one sharing feature removed from an index row exit=1 (want 1)
outline restored: yes
