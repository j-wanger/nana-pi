# Review brief — client-side races, ROUND 4 (closing round; adoption subtracted)

Your rounds 1–3: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-sol-bufrace-r{1,2,3}.md (read r3 first). The seat accepted your round-3 verdict that count-based attribution cannot prove provenance and had the adoption heuristic REMOVED rather than patched. Closing standard: a residual that is real, bounded, honestly declared in `apps/desk/README.md`, and not a cross-session data leak is not a blocker. Block only on (a) a stale continuation that still paints or acts on the wrong session, (b) a doc claim the code does not honour, or (c) a regression the folds introduced.

## Round-4 claims (verify each)
1. Deleted: `adoptHistoryBashRow`, `finishedBashCards`/`unclaimedBashCards`, per-command `bashInFlight`, `finishedBefore`, the `finally` bookkeeping, the `data-bcmd`/`data-bash-id` marks; `bashRow()` back to its pre-adoption form. Rule at POST return: `L.renderSeq` changed → build nothing, claim nothing, drop the buffer for that id, one repair resync; unchanged → create the row and flush the buffer as before.
2. A buffered FAILED `desk_bash_result` in the dropped buffer → toast `bash: <command> — <error>`, pinned to no card. Tests: one toast, no card marked failed, no duplicate row (fail on pre-fold code).
3. Coalescing: `scheduleResync()` sets `resyncAgain` when a read is in flight; `resync()` clears `resyncAgain` at its START and runs exactly one follow-up at its end. Test: running resync + N ambiguous POSTs → exactly one follow-up (pre-fold 3, post 2).
4. Every positive assertion waits for its own DOM/counter condition; `SETTLE` only before negative claims, all 18 annotated; file header now true.
5. README rule five restated (history wins; no card claimed or built; buffer dropped; failure → toast; repair reads coalesce). "Provably ours" / "never" gone. Punch-list per-finding verdicts including that the fix was a removal.

## Read
- Round-4 diff (ab22313..bced2ea): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-races-r4.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/public/app.js` (search `renderSeq`, `scheduleResync`, `resyncAgain`, `bufferBashEvent`, `flushBashEvents`, `bashRow`), `apps/desk/test/session-races.e2e.mjs`, `apps/desk/README.md` (Contract notes — page races; Known limits), `docs/review-punchlist-2026-09-08.md`.

## Dimensions
A. The new rule: is `renderSeq` compared against the value captured at POST send (not at some later point)? When the buffer is dropped and history is asked again, can the run's output be lost for good (history has it: verify what pi's `bashExecution` record carries; a still-running command at reconnect — does history carry a finished card later)? Any path that still creates a row from the buffer after a rebuild?
B. Toast: shown only for a failed result in a DROPPED buffer; never for a result that reached its row; the same failure not also painted anywhere else.
C. Coalescing: with a resync running, three ambiguous POSTs → exactly one follow-up; a resync that throws — flags cleared, no stuck `resyncQueued`; stale-generation interplay (a repair scheduled for a session you then leave → no paint, flags reset by `clearStage`).
D. Regressions: the deletions — anything else that used the removed marks or maps? `bashRow` identical to pre-adoption? Generation gates from rounds 2–3 intact?
E. Tests: do the four new checks fail on pre-fold code for the stated reasons; positive assertions condition-based; header claim true; no orphan processes on the new paths.
F. Docs: each sentence of rule five and the Known-limits residuals honoured by the code exactly.

## Output
Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`. Apply the closing standard when choosing.
