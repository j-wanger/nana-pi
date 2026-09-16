## 1. Untracked byte accounting

**FINDING (HIGH) — `apps/desk/changes.mjs:204`, `apps/desk/changes.mjs:283-289`, `apps/desk/changes.mjs:404`**

HIGH 1 is not fully closed.

- `readBounded()` deliberately reads `limit + 1`. A file initially exactly 1 MiB that grows can therefore read 1 MiB + 1 byte, exceeding the per-file cap.
- The same probe can exceed the aggregate budget. For example, one file allocated the entire remaining budget can read one byte beyond it.
- Concurrent workers calculate `budget - spent` without reserving bytes for other in-flight reads, so multiple probes can overshoot before `spent` is updated.
- The new A12 test uses a 64-byte budget but only allocates 10 stale bytes, so it does not exercise the boundary and misses this defect.

Descriptor closing is correct, regular-file validation is correct, and raced files are excluded from totals with `partial: true`. The win32 fallback behaves as documented in the Known Limits section, though it remains raceable by design.

## 2. Reload completion and waiter lifecycle

**FINDING (HIGH) — `apps/desk/server.mjs:1980-1988`, `apps/desk/public/app.js:1006-1008`, `apps/desk/public/app.js:1057-1058`, `apps/desk/public/app.js:1385-1392`**

The authoritative completion event removes the old polling/ceiling collision, but there is an event-before-waiter race:

1. The server decides the request is detached and returns the pending response.
2. The RPC settles and `desk_prompt_settled` is broadcast.
3. On a separate connection, the browser can process that SSE event before the prompt fetch response.
4. No waiter exists yet, so `handleEvent()` drops the event.
5. After the fetch resolves, `awaitPromptSettled()` installs a waiter that can never settle.

The same ordering can affect `desk_exit`. Consequently, a normal connected client can remain stuck indefinitely; this is broader than the documented SSE-drop limitation.

Other aspects pass:

- `promptId` is monotonic for the child’s lifetime and survives in-child resume/fork transitions.
- Resolve, reject, RPC timeout, stdout rejection, and ordinary child exit settle the detached promise and produce one settled event.
- `clearStage()` and a received `desk_exit` clear waiters.
- `send()` does not release early while its own reload remains unfinished.
- The documented two-tab exception remains as stated.

The pure SSE-drop limitation would be acceptable for this local UI because it fails safe—text remains unsent—and is clearly documented. The healthy-connection ordering race is not acceptable; settlement must be retained/replayed or atomically reconciled, such as through settled IDs/state in `desk_hello`.

## 3. Tests

**PASS — negative controls and detached hold**

- `changes-endpoint.test.mjs` A12 and A13 are real regressions against the old stale-size and symlink-following implementations.
- `prompt-detach.test.mjs` uses a real **6500 ms `HOLD_MS`**, exceeding the fixed 5-second detach threshold; there is no shortened detach knob.
- Reload E2E coverage now includes held prompts, late failure, and unchanged command lists.
- Deleting the vacuous activity assertion is appropriate.

**FINDING (MED) — `apps/desk/test/changes-endpoint.test.mjs:282-285`**

The timing test is no longer vacuous, but requiring at least five ticks can fail on a machine where the 8 MiB collection legitimately completes in under roughly 25 ms. The relative threshold also cannot compensate for load beginning only after the idle baseline.

**FINDING (MED) — test coverage**

No test forces:

- settlement before waiter registration,
- detached child exit,
- RPC timeout,
- SSE reconnect/second `desk_hello`,
- the exact aggregate/per-file byte boundary.

## 4. README consistency

**FINDING (MED) — `apps/desk/README.md:158-164`, `apps/desk/README.md:597-604`**

The README overstates the implementation:

- Reads do not always stop at the cap/budget; they can consume the `limit + 1` probe byte.
- “Every one” uses `O_NOFOLLOW` is false on win32.
- The win32 race applies to both list counting and the diff window, while Known Limits describes only the diff window.
- The reload section documents SSE event loss, but not the healthy-connection event-before-waiter race.

# VERDICT: BLOCK

## BLOCK/HIGH — must fix

1. `changes.mjs`: enforce both aggregate and per-file caps against all bytes actually read, including probe bytes and concurrent in-flight reads.
2. `server.mjs` / `app.js`: eliminate the settlement-before-waiter race through retained/replayed settlement state or equivalent atomic reconciliation.

## MED/LOW — may land after the HIGHs

1. Timing test can fail when collection completes too quickly or load changes after its baseline.
2. Add boundary, child-exit, timeout, ordering, and reconnect coverage.
3. Correct README claims concerning probe bytes, win32 `O_NOFOLLOW`, and the list-view symlink race.
