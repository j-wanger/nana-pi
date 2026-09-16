## 1. Untracked byte accounting

**PASS — `apps/desk/changes.mjs:204-242`, `apps/desk/changes.mjs:293-332`, `apps/desk/changes.mjs:433-457`**

HIGH 1 is closed.

- `plan(st.size)` executes synchronously before the first read.
- Reservations update shared `spent` atomically with respect to other JS workers.
- Insufficient whole-file reservations are refunded before returning `null`; no bytes are read.
- Short/error reads conservatively retain their reservation, preventing reuse and overshoot.
- Reads stop exactly at `n`; there is no probe byte.
- Per-file cap and aggregate budget cannot be exceeded.
- Descriptor closure remains guaranteed by `finally`.
- Short reads are excluded from totals and mark the response partial.
- New-file diffs read at most `cap` and report known oversize files as truncated.

## 2. Reload completion and waiter lifecycle

**PASS — `apps/desk/server.mjs:341-345`, `apps/desk/server.mjs:556-565`, `apps/desk/server.mjs:1977-2011`, `apps/desk/server.mjs:2092-2113`, `apps/desk/public/app.js:91-101`, `apps/desk/public/app.js:919-940`, `apps/desk/public/app.js:1030-1045`, `apps/desk/public/app.js:1235-1239`, `apps/desk/public/app.js:1416-1436`**

HIGH 2 is closed.

- Every detached resolve, rejection, RPC timeout, stdout rejection, and child-exit rejection reaches `settlePrompt()`, which retains and broadcasts the outcome.
- The ring is updated before broadcasting.
- Events and every `desk_hello` populate `settledSeen`.
- `awaitPromptSettled()` checks retained outcomes and exit state synchronously before installing a waiter.
- `desk_exit` resolves existing waiters and prevents later waiter installation.
- `clearStage()` resolves old-stage waiters; a new stage receives fresh state.
- The server’s hello construction and client registration contain no asynchronous gap that could lose a settlement.
- No healthy-client event-before-waiter ordering remains. Only the documented ring-32 eviction case can lose an old outcome.

## 3. Tests

**PASS — boundary, concurrency, early-settlement, ring, and child-exit controls**

A12b/A14–A17 exercise short reads, exact caps, aggregate boundaries, and concurrent reservation behavior. Reload E2E 9 genuinely forces settlement before the POST response. The reduced 1 ms/two-tick timing assertion is reasonable.

**FINDING (MED) — `apps/desk/test/reload.e2e.mjs:470-507`**

E2E 10 does not prove that the settlement was missed by SSE:

- It relies on a fixed 5.8-second sleep before killing SSE against a 7-second answer. Under scheduling delay, the answer may arrive first.
- It never asserts that the page received no live `desk_prompt_settled`.
- The hello assertion only requires a nonempty ring, which may contain outcomes from earlier tests.

Consequently, the test can pass through the live-event path rather than reconnect replay. This should be changed to deterministically hold/release the answer while the relay confirms SSE is down, and to assert no live settlement was delivered.

## 4. README consistency

**PASS — `apps/desk/README.md:156-173`, `apps/desk/README.md:196-215`, `apps/desk/README.md:607-619`**

The README now matches the implementation: no probe byte, pre-read reservation, short-read treatment, darwin/linux-only `O_NOFOLLOW`, win32 races on both surfaces, retained settlement outcomes, and the ring-32 limitation.

# VERDICT: LAND

## BLOCK/HIGH

None.

## MED/LOW

1. **MED:** Make reload E2E 10’s dropped-SSE negative control deterministic and verify that no live settlement event reached the page.
