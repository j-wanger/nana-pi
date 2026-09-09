### A. Abandoned-id path — FINDING

- **BLOCK — `apps/desk/public/app.js:979-982`**: an abandoned terminal failure correctly toasts and requests a read, but the toast is `bash: <error>`, contradicting the documented `bash: <command> — <error>`. **Minimal fix:** retain the command with the abandoned id, e.g. a bounded `Map<id, command>`, and format the toast consistently.
- **BLOCK — `apps/desk/public/app.js:1956-1957`**: only eight abandoned ids are remembered. If nine commands are abandoned, the oldest terminal event is buffered as unknown and triggers no read, despite README’s unconditional recovery claim. **Minimal fix:** document this limit explicitly, or size tracking to the server’s maximum concurrent bash requests.

Otherwise, terminal events delete the id before requesting one read, updates are dropped while the id remains abandoned, and `clearStage()` resets the set through replacement of `L`.

### B. `resync()` single door — PASS

`get_messages` has one caller, `resync()`. Reconnect, settle, compaction, `/new`, fork, initial open, and bash repair all route through it. Reentry sets `resyncAgain`; completion or rejection clears `resyncRunning` and permits exactly one follow-up. Generation checks still prevent stale painting.

### C. Tests — PASS

Cases 7, 10, and 11 now match the implementation. Cases 16 and 17 provide the stated failure-first discrimination: three reads versus two before coalescing, and no recovered card/output before abandoned-terminal repair. Positive outcomes are condition-polled, negative claims receive settle windows, and page teardown removes routes cleanly.

### D. Documentation — FINDING

- **BLOCK — `apps/desk/README.md:325-330,515-518`**: rule five promises every abandoned terminal event restores the card and promises a command-bearing failure toast. The eight-id eviction can prevent restoration, and the late-failure path no longer knows the command. The punch-list repeats the unconditional recovery claim. **Minimal fix:** align the implementation as above or explicitly declare both limitations.

Rule six accurately describes the implemented single-door coalescing.

### E. Regressions — PASS

No new stale-generation path or wrong-session action was introduced; the new state is stage-local and discarded by `clearStage()`.

VERDICT: BLOCK
