Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Build session 5. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

The plan of record is `docs/reviews/knowledge-busy-2026-11-02/plan.md` (revision 2). Review round 2 at ce9d0239 went to LAND with both reviewers. But CI failed on macOS with `FAIL M2: ten stale hook pulls and background builds survive read-write churn noPull=1, noRebuild=0`, and that check had failed once on Linux before (10398568). A new flaky test cannot land in a flake lane.

Sweeps on Windows and macOS (`query-timeout-sweep-win32.txt`, `query-timeout-sweep-darwin.txt`) found 0 misses in 50 runs at every query timeout from 100 to 1000 ms, idle and loaded. So no timeout value is chosen from evidence. The seat's decision is path (b):
- the failure must name its cause;
- the hook retries its database open and query once, inside its budget.

`QUERY_BUSY_TIMEOUT_MS` stays 100. The seat's lead hypothesis, not reproduced: on POSIX, the last connection to close deletes `index.db-wal` and `-shm`, and a hook opening in that instant gets an error the busy handler does not retry.

## Build

1. **Rows first.** Add **R-3595** to the FEAT-013 table in `REQUIREMENTS.md`: "IF the knowledge hook's index open or query fails, THEN the hook shall retry the open and query once after `HOOK_QUERY_RETRY_DELAY_MS`, inside its budget, and its pull record shall name the first failure." Add **R-3596**, a seal: "The hook's query retry delay shall be 50 ms and its retry count 1." Tag each on its check.
2. **The retry, in `packages/nana-knowledge/lib/hook.ts`** (the open at `openDb(paths.db, {})` and the `search` call).
   - On a failure of either, close any handle, wait `HOOK_QUERY_RETRY_DELAY_MS`, and try the open and the query once more, only if `over()` is still false.
   - If the retry succeeds, the hook proceeds as normal. Its `pull.log` record gains a field naming the first failure, for example `retried: "db-open-failed: <error code or message head>"`, with no path and no prompt text.
   - If the retry fails, the hook returns `db-open-failed` or `query-failed` as today, fail-open, with the first and second causes in the record.
   - The two constants are named, with `chosen` provenance, beside `BUDGET_MS`.
   - Add a test seam to `runHook`'s `opts`, in the form of the existing `spawnFn`, that lets a test make the first open or the first query throw.
3. **Checks in `packages/nana-knowledge/tests/build-busy.test.mjs`**, red on main's code first and recorded:
   - R-3595 (a): with the first open made to throw a busy-shaped error, the hook still prints the pull block, and its record names the first failure.
   - R-3595 (b): the same for the first query.
   - R-3595 (c): with both attempts made to throw, the hook returns no pull, inside `BUDGET_MS`, and the record names both causes.
   - R-3596: the seal.
4. **M2's failure detail** (R-3591's check). When any run misses a pull or a rebuild, the detail lists each failing run with its hook time, its `pull.log` reason and any `retried` field, and its rebuild state. That way the next CI failure says why. The pass condition is unchanged: 10 of 10.
5. Do not change R-3592's check. It already makes `BEGIN EXCLUSIVE` block readers by switching to a rollback journal (`build-busy.test.mjs:192-194`).
6. Add one known-bug line to `docs/known-bugs/FEAT-013.md`, naming "(knowledge-busy, review round 2)": M2 missed one pull on macOS CI at ce9d0239 and once on Linux at 10398568; local sweeps on both systems did not reproduce it; the cause is unproven, and the retry and the M2 detail are the response.
7. Update `packages/nana-knowledge/README.md`'s hook-budget sentence to mention the one retry.
8. Add one line for build 5 to this lane's session entry at the top of `docs/sessions/2026-10.md`.

## Constraints

- Edit only:
  - `packages/nana-knowledge/lib/hook.ts`, `packages/nana-knowledge/tests/build-busy.test.mjs`, `packages/nana-knowledge/README.md`;
  - `REQUIREMENTS.md`, `docs/known-bugs/FEAT-013.md`, `docs/sessions/2026-10.md`;
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder.
- Every existing check title and assertion stays.
- The retry never runs once the budget is spent, and never touches recovery or the build path.
- Never read, print or use a stored credential. No GitHub API calls.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/knowledge-busy-2026-11-02/`:
- `build-5-red.txt` and `build-5-green.txt`;
- `build-5-churn.txt`: `build-busy.test.mjs` run 10 times in a row, each result line. Then re-run the seat pairs with `SEAT_MUTATE_SHARDS=2 SEAT_MUTATE_OUT=docs/reviews/knowledge-busy-2026-11-02/seat-mutate-win32.txt node docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs`; every existing pair must stay red.

## Done when

- The new checks pass, M2 passes 10 runs in a row here, and the seat pairs stay red.
- These are green:
  - `node scripts/test.mjs packages/nana-knowledge/tests/build-busy.test.mjs packages/nana-knowledge/tests/hook.test.mjs packages/nana-knowledge/tests/recover.test.mjs packages/nana-setup/tests/hooks-win32-exec.test.mjs`;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `nana-writing` on the new lines;
  - `node scripts/identity-scan.mjs --root .`.
- Commit explicit paths on `feat/knowledge-busy`.
- Push the branch with plain `git push origin feat/knowledge-busy`, then stop. If the push fails, report it and stop.

Report:
- the rows;
- the retry's code path;
- the seam;
- the red and green results;
- the 10 runs;
- the mutation result;
- the push result;
- each departure from the Precedent.

## Precedent

- `packages/nana-knowledge/lib/hook.ts`: `runHook`, `finish`/`appendLog`, the `spawnFn` seam, `over()`, and `BUDGET_MS`.
- `packages/nana-knowledge/tests/build-busy.test.mjs`: M2's churn check and M3's rollback-journal holder.
- `packages/nana-knowledge/tests/hook.test.mjs`: existing `runHook` seam use and `pull.log` assertions.
- `docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs`: the seat pairs.
