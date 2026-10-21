# knowledge-index-recover — build brief 5 (test seam only)

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/knowledge-index-recover`, on top of the current tip (build 4, 5f3567ef, plus a merge of main 954b8726 and the seat's records). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
The seat's pairs on 5f3567ef read 28 of 31 red (`seat-mutate-output-5f3567ef.txt`). B17 survived: with build 3's order put back off Windows (`if (process.platform === "win32" || !began) {` → `if (true) {`), R-2403's new late-writer check stays green. `onRecoveryLocked` runs right after the lock is taken, before build 3's order would roll back and close, so the writer in the hook is busy under both orders. The check cannot see the gap it exists for.

## Do, nothing else
1. Call `onRecoveryLocked` immediately before the delete, wherever the delete runs: off Windows while the lock is still held, as now; in the Windows order after the rollback and close, right before `deleteIndexFiles()`. Change nothing else in the recovery.
2. Keep R-2403's late-writer check as it is (skipped on Windows by design). Off Windows it must still pass on your code.
3. Show it red with B17's edit applied: the writer's commit succeeds in the hook and the delete then removes its row.
4. Run alone: `npm test -- packages/nana-knowledge/tests/recover.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map:check`, `npm run -s readme:check`.
5. Commit with explicit paths.

**Report** (4 lines or fewer, VERDICT first): commit; each command's result; the late-writer check green on your code and red with B17's edit.
