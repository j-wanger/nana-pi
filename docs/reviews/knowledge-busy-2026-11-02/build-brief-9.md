Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Build session 9, on the branch tip after the diagnostics build. The diagnostics caught the macOS CI miss (re-run 6 of run 41470+ on this branch's tip): `run=4 ms=841 reason=query-failed retried="query-failed: ERR_SQLITE_ERROR (5)" failure="query-failed: ERR_SQLITE_ERROR (5)" code=0 rebuild=true`. SQLite error 5 is SQLITE_BUSY: the background build held the lock through the first query (busy timeout `QUERY_BUSY_TIMEOUT_MS` 100 ms), the 50 ms pause and the one retry, so the pull gave up at 841 ms of its 1500 ms `BUDGET_MS`.

## Precedent

- `packages/nana-knowledge/lib/hook.ts` (the retry loop around line 187, `HOOK_QUERY_RETRY_COUNT`, `HOOK_QUERY_RETRY_DELAY_MS`, `over()`)
- `packages/nana-knowledge/lib/db.ts` (`QUERY_BUSY_TIMEOUT_MS`)
- `packages/nana-knowledge/tests/build-busy.test.mjs` (M2 and its seal checks)

Report each departure.

## Build

1. Replace the fixed single retry with retries bounded by the pull's own budget: after a failed open or query, pause `HOOK_QUERY_RETRY_DELAY_MS` and try again while the remaining budget still holds one more query's busy timeout plus a reserve for the rest of the pull (round 3 review note 1: today the budget check reserves no time for the synchronous query). Name the reserve as a tunable beside the existing ones with its provenance, and keep a hard attempt ceiling as a tunable too. The pull must never run past `BUDGET_MS`.
2. Record the attempt count in the pull record next to `retried` and `failure`, as a structured number.
3. Tests: one check with an injected `openDbFn`/`searchFn` that throws a BUSY-coded error N times then succeeds, returning hits while the budget allows; one where it never succeeds, returning `query-failed` with total time under `BUDGET_MS`; update the seal checks for the changed and new tunables; M2 unchanged.
4. Merge `origin/main` into the branch in this build, keeping every file this lane did not set out to change identical to `origin/main`; regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators.

Change nothing else. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node packages/nana-knowledge/tests/build-busy.test.mjs` (three times), every knowledge test file this lane touched, `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, and `node scripts/identity-scan.mjs --root .` after `git add`. Record one wrong-code pair: the old single-retry loop fails the new N-times check. Do not run the locked full suite; CI is the suite. Push and stop.
