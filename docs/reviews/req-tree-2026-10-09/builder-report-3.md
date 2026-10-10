VERDICT: DONE

- Commit: `1f8ec87` — `scripts/requirements-tree.mjs`, `packages/nana-pack/tests/requirements-tree.test.mjs`, `docs/requirements-tree.md`.
- Rows: R-287–R-291 remain `implemented`; tests pin heading boundaries, purpose placement, unique IDs, valid ancestry, and outline fields.
- R-287: ordinary-heading row fixture; mutant red (exit 1), restored green (exit 0).
- R-288: intervening level-4 heading fixture; mutant red (1), restored green (0).
- R-290: unrelated level-1 heading fixture; mutant red (1), restored green (0).
- R-291: mixed-prefix fixture/FEAT-033 assertion and aggregate-count check; mutants red (1), restored green (0).
- `npm run req:tree` 0; `npm run map` 0; `npm run map:check` 0.
- Proof 0: 1,004 base rows preserved; 5 new rows; 125 blocks and 1,554 lines accounted; 64 old headings mapped.
- `npm run test:locked` 0 — 132 PASS, 0 FAIL, 1 SKIP; 6,587 checks passed, 5 skipped.
- Scope: clean worktree; no changes outside the allowlist. `git diff --stat 6b9202a..HEAD`: 22 files, 2,386 insertions, 964 deletions.
- Not done: no rows were flipped in this continuation; no other work remains.
- Claim most likely wrong: the ATX heading recognizer covers every valid Markdown heading edge case.
