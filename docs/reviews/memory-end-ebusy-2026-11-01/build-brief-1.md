Feature: FEAT-040 · Make and keep memory

Lane memory-end-ebusy. Class: ordinary (tests only). Builder: pi-worker (small lane). Urgent fix, shipped alone. Main is red on the Windows suite leg since making-session-end landed (d7af5876), on two files in two attempts of run 41350694982:
- attempt 1: `packages/nana-pack/tests/profile-sync.test.mjs` "two machines converge without a merge": `EBUSY: rmdir …\profile-fixture-…\remote.git` from `profile-fixture.mjs:49` (`close`).
- attempt 2: `packages/nana-setup/tests/memory-end-hook.test.mjs` exits 1 after 7 PASS: `EBUSY rmdir …\memory-end-…` at line 86, the `finally` cleanup, despite its retries.
Every check passed in both; only temp cleanup fails, because a process the test started (the detached memory run fixture, or a git child) still holds the folder on Windows. Issue #306.

Threat model: honest variation in timing on hosted Windows runners is in scope; deliberate forgery is out.

## Precedent

- `packages/nana-setup/tests/memory-end-hook.test.mjs` (its detached-fixture marker wait and the `finally` cleanup)
- `packages/nana-pack/tests/profile-fixture.mjs` (`close`)
- `packages/nana-pack/tests/tmp-dir.mjs`
- `packages/nana-pack/lib/fsops.mjs` or wherever R-2659's shared rename/remove retry lives (find it with `npm run map:search -- "retry EBUSY"`)

Report each departure.

## Build

1. `memory-end-hook.test.mjs`: before removing the temp folder, wait (bounded, a few seconds) until every process the test started has exited, the detached fixture included (it records its pid; poll until it is gone), then remove with the existing retries. Never kill a process the test did not start.
2. `profile-fixture.mjs` `close`: remove with the same retry options as the hook test (`maxRetries` and `retryDelay` from their existing named config), so a git child releasing its handle late does not fail the case.
3. Use existing named retry constants; add no inline literal. No new requirement row: this pins existing rows' tests. Change no product code.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Both test files pass locally, `npm run map:check`, `npm run readme:check`, the requirements trace and `node scripts/identity-scan.mjs --root .` exit 0. Push the branch, open a draft PR against main, and stop; the Windows CI leg is the real check.
