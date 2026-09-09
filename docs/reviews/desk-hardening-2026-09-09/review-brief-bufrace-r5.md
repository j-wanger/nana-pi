# Review brief — client-side races, ROUND 5 (verification of the round-4 folds)

Your rounds 1–4: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-sol-bufrace-r{1..4}.md (read r4 first). Round 4: B, D PASS; A, C, E, F blocked. Same closing standard: block only on a stale continuation that paints or acts on the wrong session, a doc claim the code does not honour, or a regression.

## Round-5 folds claimed (verify each)
A. The rebuild branch records the abandoned id (`L.bashAbandoned`, bounded 8, oldest evicted, only when the run had not already failed at the desk). A terminal `desk_bash_result` for such an id triggers exactly one more read; stray `bash_execution_update`s for an abandoned id are dropped. Test: still-running rebuild → finished card appears after the terminal event, with the run's output (pre-fold 0 / null).
C. The coalescing guard moved INTO `resync()`; it is the single entry for every re-read (reconnect hello, `agent_settled`, `compaction_end`, `/new`, fork, repair); `scheduleResync` deleted. Test: parked read + two settled turns → exactly one follow-up (pre-fold 3, post 2).
E. Test header cases 7, 10, 11 rewritten; 16, 17 added.
F. README rule five restated (rebuild drops the buffer; the card comes from pi's record, which exists only once the command finished; a terminal event after a rebuild triggers one more read; a never-terminating command leaves no card — also a Known limit); rule six states single-door coalescing.

## Read
- Round-5 diff (bced2ea..52a6fda): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-races-r5.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/public/app.js` (`bashAbandoned`, `resync`, `resyncAgain`, `bufferBashEvent`), `apps/desk/test/session-races.e2e.mjs`, `apps/desk/README.md` (page races rules 5–6; Known limits), `docs/review-punchlist-2026-09-08.md`.

## Dimensions
A. Abandoned-id path: the extra read fires once per terminal event, never per update; `bashAbandoned` reset by `clearStage`; a terminal FAILURE for an abandoned id → toast only (no read? or read too — whichever the docs say, the code must match).
B. `resync()` single door: every caller listed actually goes through it (grep for `get_messages` callers); reentry while running sets `resyncAgain` and returns; one follow-up; flags cleared on throw; stale-generation isolation intact.
C. Tests: the three new checks fail on pre-fold code for the stated reasons; positive assertions condition-based; header true; teardown clean.
D. Docs: rules five and six and the Known limits honoured exactly by the code.
E. Regressions from round 5.

## Output
Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
