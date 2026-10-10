VERDICT: DONE

Commit: `d0d64fe` — fix governed-row positions in proof.
Files changed: `docs/reviews/req-tree-2026-10-09/prove.mjs`. Proof output saved; unchanged.
Rows flipped: none. Existing R-291 evidence covers the approved ledger comparison.
Mutation pair: swapped R-292/R-293 rejected (exit 1); real ledger accepted (exit 0).
Commands: proof 0; `npm run map:check` 0; `npm run test:locked` 0; seat script 0.
Suite: 133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6630 pass, 0 fail, 5 skip · 566.7s
Scope: `git diff --stat 9e415db..HEAD` spans 28 files from the prior lane work; this commit changes only `prove.mjs`.
Claim most likely wrong: R-291’s existing test evidence adequately covers this proof-order constraint.

Verbatim `seat-verify-b.sh` output:
```text
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
proof proof-new-rows-swapped exit=1 (want 1)
proof with an undeclared heading in both tree-b and ledger exit=1 (want 1)
proof with a tree-b label changed exit=1 (want 1)
tree test on the real outline exit=0 (want 0)
tree test with one shared-index row deleted exit=1 (want 1)
tree test with one status deleted exit=1 (want 1)
tree test with one sharing feature removed from an index row exit=1 (want 1)
outline restored: yes
```
