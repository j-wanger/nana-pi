# Review brief — stage signing keys persisted per session, ROUND 6 (verification of the round-5 folds)

Your rounds 1–5: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-astra-stagekey-r{1..5}.md (read r5 first). Same closing standard as round 5: block only on (a) a never-issued-key acceptance / a seed adding keys not recorded for a confirmed source, (b) a doc sentence the code does not honour, or (c) a regression the folds introduced. Honestly declared, bounded continuity residuals are not blockers.

## Round-6 folds claimed (verify each)
1. B-BLOCK: confirmation budget ENFORCED — 1000 ms wall clock; remaining slice computed before each dispatch (none → no dispatch); each answer raced against the remainder (`withinBudget`), a late answer ignored = unconfirmed; inter-attempt wait clipped. Test: stub answers after the budget → unconfirmed, wrapper returns within ~1004 ms (3009 ms + confirmed on round-5 code). README names 1000 ms.
2. D2 (identity assertion) answered by SUBTRACTION, declared as a deviation: `child.sessionId` was written in two places and read in none after deferred inheritance was removed, so it was deleted; every decision now asks the child in the moment. Verify that claim: grep for any remaining reader of `child.sessionId` / `sessionId` on the child record; confirm `ledgerKeys` and `noteStageSession` no longer depend on it and that nothing else regressed.
3. D1: queue handshake — eight competitors launched, hold released only after one has returned 429.
4. A-BLOCK: the prompt-race declaration widened (anywhere between the source check and the destination confirmation) in README, design addendum, punch-list.
5. E-BLOCK: the seven doc sentences corrected (prune conditions; "copied blocks signed only by inherited keys"; app-children-only cap; `stage-keys/<id>.json` path; store-vs-live-key retention; 60 s lifecycle timeout; addendum batch-loss wording).

## Read
- Round-6 diff (048257a..1465f47): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-stagekey-r6.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/server.mjs` (`lifecycleRpc`, `withinBudget`, `noteStageSession`, `ledgerKeys`), `apps/desk/stage-keys.mjs`, `apps/desk/apps.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/README.md`, `docs/agent-frontend-design-2026-09-04.md`, `docs/review-punchlist-2026-09-08.md`.

## Dimensions
A. Provenance on the final code (from scratch, briefly): any acceptance or seed outside the declared boundary?
B. Budget enforcement: correct under a stub that answers exactly at the deadline; a late `get_state` answer that arrives AFTER the wrapper returned — is it discarded harmlessly (no record, no seed) or does the ordinary response handler still route it somewhere that records?
C. `child.sessionId` removal: any reader left; any behaviour that silently changed (e.g. `ledgerKeys` fallback when `get_state` fails now returns only the live key — confirm that was already the case).
D. Tests: the budget test discriminates as claimed; handshake sound; env explicit; temp-only writes.
E. Docs: each sentence in the stage-key contract notes + Known limits honoured exactly by the final code. List any that still overstates.

## Output
Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
