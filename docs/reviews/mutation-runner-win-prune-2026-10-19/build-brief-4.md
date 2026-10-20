# Brief 4: mutation-runner-win-prune

Feature: FEAT-031 (the seat mutation runner). Same worktree and branch (tip d9955553). Class: ordinary. Opus round 2 sent the lane back. Round 3 is the last allowed round, so this build must be right on Windows; the seat runs CI's Windows leg before round 3.

## MUST (M3): the lock throws EPERM on Windows under contention — CI's Windows leg is red on d9955553
CI run 39342973804 on d9955553: macOS and Ubuntu green; Windows 167 files, 149 PASS, 1 FAIL — R-1776's "contending child processes observe complete lock ownership…". 7 of 8 workers exited 1 with `EPERM: operation not permitted, open '…\operation.lock'` from `readFileSync` in `withWorktreeOperationLock` (`mutation-runner.mjs:258`); only 674 of 2,400 acquisitions completed; the observer died the same way. Cause: on Windows a file being deleted can still be visible but refuses to open (EPERM, not ENOENT). The code tolerates only ENOENT at the waiter's read (:258), the `statSync` (:266) and the release read (`removeWorktreeLockIfOwned`). `linkSync` onto a name still being deleted can plausibly fail the same way (inferred).
Consequences: a shard's add-site throw exits the shard 1 and the parent refuses the run; a throw in the `finally` release leaves the lock on disk naming a live pid, so that shard's `finish()` and every other shard wait forever; landing this tip turns main's Windows leg (which blocks release) red.
Fix: on every platform, treat EPERM, EACCES and EBUSY from the lock's read, stat and link as "held: retry after the wait" (bounded, see S5). At release, retry the same codes, then record a line naming the lock — never leave it silently. Keep ENOENT handling as is. Do not weaken R-1776: it must still assert zero overlap and complete ownership, and it must still be red on the non-atomic and unconditional-removal wrong code.

## SHOULD (S5): a parsable lock naming a pid that never dies is held forever
Inputs: the holder's pid is reused after it dies (Windows reuses pids quickly), or the holder's release fails (M3 made this reachable). The 30,000 ms limit covers only unreadable content. Add a bounded wait for ANY lock: after a sealed limit (provenance `chosen`, pinned by one test naming its row), the waiter gives up with one recorded line naming the lock and its holder pid (fail loudly; do not steal a lock whose holder may be alive). Name the row: extend R-1777 or add one in this lane's block (R-1778, R-1779).

## NOTE fixes (cheap; do them)
- N2: a hand-run shard with no `SEAT_MUTATE_WORKTREE_LOCK` throws `path.dirname(undefined)` — fail with one line naming the missing variable instead.

## Tests
- Make the EPERM path testable on macOS too: inject the read/stat/link functions (or a fault hook the lock helper takes) so a check can make the read throw EPERM once, then succeed, and assert the waiter retries instead of throwing; and make the release throw EPERM, assert it retries then records. Red on d9955553.
- S5's bounded wait: a lock naming a live pid that never releases → the waiter gives up after the sealed limit (use a short injected limit in the test) with the recorded line.

## Done
- `node packages/nana-pack/tests/mutation-runner.test.mjs` green three runs in a row on macOS; show each MUST/SHOULD wrong code red.
- Trace, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check` green. Single files only; do NOT run the full suite; do NOT push (the seat pushes and reads the Windows leg); do not edit HANDOFF.md or docs/sessions/.

## Report (≤10 lines)
VERDICT; commit; the error-code handling; the bounded wait and its sealed value; new or changed checks with red-before evidence; wrong-code tries.
