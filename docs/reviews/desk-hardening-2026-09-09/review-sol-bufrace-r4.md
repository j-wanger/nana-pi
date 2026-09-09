### A. New rule — FINDING

- **BLOCK — `apps/desk/public/app.js:967-976, 1918-1944`**: `renderSeq` is correctly captured before sending the POST, and no rebuild branch creates or claims a row. However, if the repair read occurs while the command is still running, pi history has no `bashExecution` yet. After that read, the eventual terminal event is buffered with no remaining POST continuation to flush it or request another read. The finished card can remain absent indefinitely. Pi records the complete output only in `recordBashResult()` after execution finishes. **Minimal fix:** schedule a history read when an unknown-id terminal result arrives, or honestly declare this bounded residual under Known limits.

### B. Toast — PASS

`apps/desk/public/app.js:1936-1944` emits exactly one toast only from a failed result found in the dropped buffer. The buffer is deleted first, no card is claimed, and results reaching an existing row continue through `finishBashRow()` without a toast.

### C. Coalescing — FINDING

- **BLOCK — `apps/desk/public/app.js:364-369, 640-652, 852, 890, 902, 994`**: `scheduleResync()` coalesces correctly around one active read, including rejection cleanup and stale-generation isolation. But `resync()` itself remains directly reentrant: reconnect, settle, compaction, and other callers can start overlapping reads, each clearing the shared boolean flags. A completion can set `resyncRunning = false` while another read remains active, allowing later repairs to start extra reads and violating README’s exact coalescing claim. **Minimal fix:** make `resync()` itself coalesce/reject reentry, and route direct callers through that single entry point.

### D. Regressions/deletions — PASS

Removed adoption maps, marks, counters, and bookkeeping have no remaining references. `bashRow()` matches its pre-adoption form, and the generation gates remain intact. Stale reads cannot paint another session; replacing the stage discards the old state object.

### E. Tests — FINDING

- **BLOCK — `apps/desk/test/session-races.e2e.mjs:35-50`**: header cases 7, 10, and 11 still describe adopting history rows and reapplying failure to an adopted card, directly contradicting the removed behavior and the assertions below. **Minimal fix:** update those three header entries to history-wins/no-claim/toast behavior.
- The four new pre-fold failures are otherwise credible: one missing repair, two failure-toast/card assertions, and one 3-versus-2 read count. Positive assertions are condition-driven, and all 18 `SETTLE` uses precede negative/quiescence claims. Teardown covers the new parked paths.

### F. Documentation — FINDING

- **BLOCK — `apps/desk/README.md:317-326`**: “brings back pi’s own record of what ran” and the implied eventual recovery are not guaranteed when the repair read precedes command completion; no later read is triggered. The exact coalescing statement is also stronger than the directly reentrant implementation.
- `docs/review-punchlist-2026-09-08.md:247-282` accurately records adoption’s removal, but repeats those two overclaims. **Minimal fix:** repair the terminal-result/read and resync-entry behavior, or document both bounded residuals honestly.

VERDICT: BLOCK
