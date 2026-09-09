Static review only; no execution tool was available. Paths refer to the post-fold `wt-int` tree.

### A. Union seed / source attribution — FINDING

**BLOCK — unfinished inheritance can seed an unrelated session.**  
`apps/desk/server.mjs:240–244,677,721`

After P→C forks successfully but confirmation fails, `inheritFrom=P` survives. A subsequent extension slash command can switch the child to unrelated Z without entering `lifecycleRpc`. The next ledger observation then unions P’s keys into Z.

This is an actual supported bypass path: installed pi’s `agent-session.js:828–829` executes extension commands from prompts; `modes/rpc/rpc-mode.js:235–250` binds their `newSession`, `fork`, and `switchSession` directly to the runtime.

Session-change paths:
- Explicit `new_session`, `switch_session`, `fork`, `clone`: wrapped.
- Desk fork/clone buttons and internal `sendRpc` callers: wrapped.
- Extension-command session replacement through `prompt`: **not wrapped**; can also interleave between the wrapper’s source observation and fork.
- Initial spawn/resume: separate observation path, appropriately without inheritance.
- Tree navigation, compaction and rename do not themselves change the session header id. No separate automatic-switch mechanism was established.

**Minimal fix:** coordinate extension-driven transitions too, or invalidate pending inheritance before dispatching potentially session-changing prompts and prevent their overlap with lifecycle transactions. Do not recover into an arbitrary later id without destination attribution. Add both stale-recovery and overlapping-slash-command tests.

Union seeding itself correctly preserves existing keys first and caps at eight.

### B. Ordering / failure cleanup — FINDING

Explicit lifecycle RPCs use a rejection-absorbing chain; `finally` clears `transition`, and ledger reads do not await that chain.

**SHOULD — identity is restored before command dispatch and remains stale on failure.**  
`apps/desk/server.mjs:710–716,725–731`

The initial clearing is undone by the fork’s pre-state `recordStageSession`. A rejected/unsuccessful fork, or successful fork with failed post-state, leaves `child.sessionId` naming the source. Thus fold C is incomplete.

**Minimal fix:** retain the confirmed source locally, then clear `child.sessionId` immediately before sending the lifecycle command. Restore it only from a subsequent successful observation.

Suppressing mid-transition recording is not unconditionally a “one-read” loss: if the post-state fails and the child exits before another observation, the observed destination remains unrecorded permanently. Document that recovery requires a later observation.

### C. No-cache store / failures — FINDING

Read exceptions narrow to an empty record plus pending overlay. Corruption remains isolated. Successful writes clear pending state. `randomBytes` is now inside the catch boundary, and prune correctly validates stems.

**SHOULD — failed-write overlay retains a stale full record, not merely unsaved keys.**  
`apps/desk/stage-keys.mjs:100,282`

Example: A’s failed write retains eight keys, seven already persisted. B subsequently records KB successfully. A’s full pending list occupies all eight overlay slots, hiding KB; A’s retry then overwrites KB despite strictly sequential operations.

This recreates the stale-read/sequential-overwrite problem on the failure path.

**Minimal fix:** retain only genuinely unsaved additions in `pending`, merge those with fresh disk contents on retry, and test a failed write followed by another instance’s successful addition.

### D. Regressions / deadlock — FINDING

No chain self-deadlock found: lifecycle internals use `sendRpcRaw`, and ledger reads remain independent.

**SHOULD — the chain bypasses the existing pending-request bound.**  
`apps/desk/server.mjs:683–688,746`

Lifecycle requests now accumulate promises and waiting HTTP requests before reaching `MAX_PENDING_RPC`. A stalled child permits an unbounded queue; queued requests have no timeout until dispatched.

**Minimal fix:** bound queued-plus-running lifecycle requests per child and reject excess requests with 429. Release admission slots on every completion/rejection; test a held first transition and excess submissions.

### E. Tests as evidence — FINDING

The union, two-instance coherence, prune and failed-confirmation checks meaningfully target round-3 defects. The persistence test’s sole server-spawn helper explicitly sets `DESK_STAGE_KEYS: STORE`; its writes remain under temporary directories.

**SHOULD — overlap tests are timed, not deterministic handshakes.**  
`apps/desk/test/stage-key-persistence.test.mjs:405–430`

The ledger test assumes a 250-ms sleep lands inside a 900-ms hold. The ordering test genuinely holds the first fork response, but does not prove the second HTTP request reached the server before release. Scheduling delays can let broken serialization pass.

**Minimal fix:** acknowledge the held operation, acknowledge admission of the competing request, then explicitly release the response.

The comment claiming an unsuccessful-command check precedes an ordinary successful switch (`:435–437`); no rejected lifecycle command is exercised there. Add unsuccessful-response and rejection tests that inspect identity cleanup and subsequent progress. The claimed eight mutation failures were not rerun here.

### F. Documentation accuracy — FINDING

**SHOULD — residual guarantees still exceed the implementation.**  
`apps/desk/README.md:361–364,430–438`;  
`docs/agent-frontend-design-2026-09-04.md:349`;  
`docs/review-punchlist-2026-09-08.md:316–327`

- Recovery and one-read claims need the qualifications in A/B.
- “At most one key” is false for overlapping `seed` operations or pending retries, which can add multiple keys.
- A successfully written key later overwritten by another desk is **not** retained by this store’s memory; only failed writes populate `pending`. Foreign inherited keys can therefore redact on the next lookup, before process exit.
- The wall-clock timeout-test omission is stated in the review brief, but not these shipped docs.

**Minimal fix:** document batch-key loss and immediate disk-authority visibility accurately, qualify recovery, and explicitly identify the untested timeout path.

VERDICT: BLOCK
