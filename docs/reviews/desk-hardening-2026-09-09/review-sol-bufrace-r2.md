### A. Line cap fold — PASS

`apps/desk/server.mjs:432-490` reports once per oversized physical line. The complete-line and remainder paths cannot double-report: `droppingLine` consumes the eventual terminator before length checking. CR is stripped before checking, so a cap-length payload arriving as `\r\n` remains legitimate. Both SSE attach sites also correctly return before adding a failed response to `child.clients`.

### B. Tree-kill fold — PASS

`apps/desk/server.mjs:551-556` preserves the previous POSIX signal and grace/escalation behavior while retaining Windows `taskkill /t /f`. `apps/desk/apps.mjs:202-229` uses it for timeout and over-cap termination; the close handler remains guarded by `overCap`.

### C. Generation folds — FINDING

- **SHOULD — `apps/desk/public/app.js:1806-1809, 1820-1853, 2151`**: several stale slash/spawn continuations can still paint a toast. `/model` checks before `set_model`, but not after that second await; command rejection catches are unguarded; and `spawnSession` checks `r.error` before checking `stale(g)`. The dangerous cross-session RPCs are fixed, but the documented “stale answer is dropped, never painted” rule is not. **Minimal fix:** check `stale(g)` immediately after every awaited response and guard the corresponding catches/toasts; in `spawnSession`, perform the stale-success rail refresh before handling response UI.
- The stale spawn success remains server-tracked and appears after `refreshRail()`. Export captures its label before requesting and performs only the deliberately retained download after switching.

### D. Bash adoption fold — FINDING

- **BLOCK — `apps/desk/public/app.js:367-372, 1889-1898`**: `renderSeq` proves only that some history render occurred. If history already contains a finished `!ls` and another `!ls` is still running when an unrelated resync occurs, the second POST adopts the old finished card, drops its own buffered events, and never creates its own row. The comment’s claim that choosing the wrong identical-command row is invisible is false when outputs/statuses differ. **Minimal fix:** record the matching finished-history count when the POST starts, adopt only a newly introduced candidate, and treat overlapping same-command POSTs as ambiguous—defer to a final resync rather than assigning an unverifiable row.
- **SHOULD — `app.js:1890-1898`**: adoption unconditionally deletes buffered events. A buffered failed `desk_bash_result` may contain an error absent from `bashExecution` history, so the visible failure is lost. Preserve/reapply a buffered terminal error when adopting.
- `renderSeq` is bumped by the sole live history renderer, covering initial, reconnect, and settled resyncs; historical views cannot have live bash POSTs.

### E. Explicit-rejection split — PASS

`apps/desk/public/app.js:1935-1963` treats the server’s `{ok:false}` and `{error}` JSON shapes as explicit rejection, including the actual 409 shape from `promptChild`. Tools-not-ready/session-not-running rejections occur before this request can legitimately echo, so restoring and removing a still-pending optimistic bubble is correct. Transport loss after a consumed echo remains a no-op.

### F. Bash clipping fold — FINDING

- **BLOCK — `apps/desk/public/app.js:400-412, 426-445`**: the claimed single 20,000-character budget is still false. `clipBashEvent()` never clips `error`; it also returns after clipping one field, and `bufferBashEvent()` deliberately retains one event even when the combined `output + error` exceeds the cap. `finishBashRow()` then renders the entire error. **Minimal fix:** clip all textual fields against one shared remaining budget and cap error rendering as well.
- **SHOULD — `app.js:378-379, 401-403`**: `slice(-20000)` can begin on a UTF-16 low surrogate, producing broken text. Adjust the cut by one code unit when it splits a surrogate pair. The streamed and finished output windows otherwise agree, and `· truncated` is shown only for server- or client-cut output.

### G. Tests — FINDING

- **SHOULD — `apps/desk/test/session-races.e2e.mjs:149-158`**: `die()` only races server exit against five seconds; on timeout it removes fixtures and exits without force-killing or awaiting the server, so its “awaited teardown” claim is still false and can orphan the desk and children. **Minimal fix:** after the deadline, send `SIGKILL` and await the exit event before cleanup/process exit.
- The seven reported additional pre-fold failures are credible. No new fixed port was introduced; the stage-key test moved away from 4441/4442. Negative assertion waits are marked `SETTLE`. `buffer-caps.test.mjs:279-303` handles signal exits separately, exercises DELETE, awaits/asserts desk exit, and verifies recorded PIDs are gone.

### H. Documentation — FINDING

- **BLOCK — `apps/desk/README.md:305-310`, `docs/review-punchlist-2026-09-08.md:223-225`**: both state that `delta`, output, and error share a real 20,000-character bound, contradicted by the unbounded error path above.
- **SHOULD — `apps/desk/README.md:282-296`**: the generation claim says stale slash/spawn answers never paint, but stale success/error toasts remain possible.
- The four server caps, character/byte distinctions, event name, writable-queue wording, tree-kill behavior, reconnect limit, and byte-identical-steer limitation otherwise match the code.

VERDICT: BLOCK
