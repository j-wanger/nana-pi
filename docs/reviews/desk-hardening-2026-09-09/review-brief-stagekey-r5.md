# Review brief — stage signing keys persisted per session, ROUND 5 (closing round)

Your rounds 1–4: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-astra-stagekey-r{1,2,3,4}.md (read r4 first; the r3 brief carries the per-session-file design). The seat's closing standard for this lane: every remaining item is either FIXED or DECLARED in one sentence in `apps/desk/README.md`. Judge against that standard: a residual that is real, bounded, honestly declared, and not a never-issued-key acceptance is NOT a blocker. A BLOCK now requires either (a) a path by which a block not minted inside a desk-spawned app child becomes visible, or (b) a claim in the docs that the code does not honour, or (c) a regression the folds introduced.

## Round-5 folds claimed (verify each)
1. BLOCK (A): `child.inheritFrom` and all recovery paths DELETED. Inheritance only inside `lifecycleRpc`: confirm source → clear identity → command → confirm destination (get_state retried ≤3 times within ~1 s, bounded by count and wall clock) → union seed; otherwise inherit nothing. Declared: unconfirmed fork keeps only the live key; a prompt-driven slash command landing between the source check and the fork attributes inheritance to the previous session (not fixed; desk-issued keys only). Tests fail on round-4 code.
2. SHOULD (B): source held in a local; `child.sessionId = null` immediately before send; restored only by a confirmed destination. Tests: unsuccessful fork reported; a later lifecycle RPC still works. Declared: unrecorded destination needs a later observation; a child exiting first leaves it unrecorded.
3. SHOULD (C): `pending` holds only the additions a failed write did not save; retry = fresh disk ∪ pending. Tests with the 8-key cap in play.
4. SHOULD (D): queued+running lifecycle RPCs capped at 8/child, `429` beyond, every outcome frees a slot. Tests.
5. SHOULD (E): handshake-based overlap tests (stub writes `holding`, waits for `release`; admission proven via the 429 cap; arrival trace asserted). Unsuccessful-command case exercised.
6. SHOULD (F): docs — "whatever that write was adding" (not "one key"); a successfully written key lost to another desk is retained nowhere; inheritance qualified; 429 declared; the untested RPC wall-clock-timeout path named in Known limits.

## Read
- Round-5 diff (aee2ded..048257a): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-stagekey-r5.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/stage-keys.mjs`, `apps/desk/server.mjs` (`lifecycleRpc`, `sendRpc`, `noteStageSession`, `ledgerKeys`, `stageKeyForSpawn`), `apps/desk/apps.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/README.md` (Contract notes — stage signing keys; Known limits), `docs/agent-frontend-design-2026-09-04.md` addendum, `docs/review-punchlist-2026-09-08.md`.

## Dimensions
A. Provenance from scratch on the final code: any never-issued-key acceptance, any seed that adds keys not recorded for a source the desk confirmed the child held immediately before the transition (the declared prompt-race excepted).
B. Regressions the round-5 folds introduced (identity cleared before send: any caller that reads `child.sessionId` during a transition and misbehaves? the bounded retry: can it exceed its wall-clock budget? the 429 cap: any legitimate desk flow that hits 8 queued lifecycle RPCs?).
C. Failure directions on the final code — every catch narrows to redact / no-inherit / no-record.
D. Tests — do the six new checks fail on round-4 code for the stated reasons; are the handshakes deterministic; any write outside temp dirs; env explicit.
E. Docs — for EACH sentence in the README stage-key contract notes and Known limits, does the code honour it exactly? List any sentence that overstates.

## Output
Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`. Apply the closing standard above when choosing the verdict.
