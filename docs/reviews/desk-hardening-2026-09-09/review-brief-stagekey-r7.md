# Review brief — stage signing keys persisted per session, ROUND 7 (verification of the round-6 folds)

Your rounds 1–6: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-astra-stagekey-r{1..6}.md (read r6 first). Round 6 verdict: provenance PASS, identity subtraction PASS; three items left. Same closing standard: block only on a never-issued-key acceptance / out-of-boundary seed, a doc sentence the code does not honour, or a regression.

## Round-7 folds claimed (verify each)
1. B-BLOCK: `withinBudget` takes the ABSOLUTE deadline and rechecks `Date.now() >= deadline` after the await, before the id is accepted; past it, the answer is treated as no answer; the before-dispatch check uses the same absolute deadline.
2. D-SHOULD: the budget test switches back to `fileZ` first (a wrongly confirmed seed WOULD add keyZ), the stub acknowledges its late answer via a file, the test waits for that ack, and asserts the destination is not recorded at all (`recordOf(idSlow) === null`). New boundary case answers exactly on the deadline. The worker states honestly that the boundary case is NOT a reliable failure-first discriminator on pre-fix code (1 in 3 runs) — the elapsed-time check remains the discriminator.
3. E-BLOCK: (1) mid-transition read = live key plus already-recorded keys, observation not filed (README + punch-list); (2) prune qualifications carried into Known limits and the design addendum; (3) addendum: app children only, queued plus running.

## Read
- Round-7 diff (1465f47..984c687): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-stagekey-r7.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/server.mjs` (`lifecycleRpc`, `withinBudget`), `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/README.md`, `docs/agent-frontend-design-2026-09-04.md`, `docs/review-punchlist-2026-09-08.md`.

## Dimensions
A. Deadline recheck: correct on the boundary; no path accepts after the deadline; a late answer leaves no record and no seed.
B. Test: does the reworked assertion now discriminate (would a wrongly confirmed seed be caught)? Is the acknowledgement handshake sound? Any write outside temp dirs?
C. Docs: every sentence in the stage-key contract notes + Known limits + addendum honoured by the final code. List any that still overstates.
D. Regressions from round 7.

## Output
Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
