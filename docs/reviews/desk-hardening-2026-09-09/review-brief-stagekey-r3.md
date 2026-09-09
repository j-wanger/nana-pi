# Review brief — stage signing keys persisted per session, ROUND 3 (store subtracted)

Your round-1 and round-2 reviews are at /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-astra-stagekey-r1.md and review-astra-stagekey-r2.md; the mechanism background is in review-brief-stagekey.md next to them. Read all three first.

Seat decision after round 2: the single-file store + advisory lock had grown a failure class (whole-desk freeze on a retry branch, takeover races, dangling-link recovery, ownership heuristics) whose worst case was worse than the defect being fixed. It was SUBTRACTED. Verify the replacement; do not ask for the lock back.

## What round 3 claims (verify each)

1. **Store = one file per session, no lock, no merge.** Directory `~/.pi/agent/nana-desk/stage-keys/` (0700 only when the desk creates it; a pre-existing dir is never chmodded, one warning if looser than 0700), file `<pi session id>.json` (0600) `{"v":1,"keys":[…],"updatedAt":…}`, ≤8 most-recent-first. Write = temp (`wx`, 0600) + rename inside the directory. Read on demand, cached per id in memory (authoritative for the process); a record of an already-held key is a no-op; per-id `dirty` retry. Corrupt record → `<id>.json.corrupt-<ts>`, that session blank only. Prune (lazy, first app spawn, never on an empty enumeration) unlinks `<id>.json` for ids with no session file; `.corrupt-*` and temps untouched. Session ids validated `^[A-Za-z0-9_-]{1,128}$` before record or lookup (they are filenames). Store dir symlink resolved once at first use. `DESK_STAGE_KEYS` env = the directory (tests). Declared residual: two desks recording DIFFERENT new keys for the SAME session in the same instant keep the last writer's.
2. **Fork/clone source captured BEFORE the RPC.** `noteStageSession` no longer seeds. `server.mjs lifecycleRpc`: for `fork`/`clone` runs `get_state` FIRST for the source id (unconfirmed → no inheritance and `child.sessionId = null`), then the command, then `get_state` for the new id and seeds from the confirmed source; any unconfirmed transition clears `child.sessionId`; `switch_session`/`new_session` inherit nothing. Negative test: fork after an UNOBSERVED switch inherits from what the child actually holds, not the stale predecessor (fails on round-2 code).
3. Concurrency test deleted with the lock; port read-back reset per run.
4. Docs: per-session directory, 8-key limit, prune; verification = live child key ∪ the session's recorded keys, persisted best effort; possession-not-origin kept; lock-era claims removed; known limits: sync small I/O + one-time prune, the same-session last-writer residual, ledger reads and lifecycle RPCs cost extra round trips.

## Read
- Round-3 diff (26b2683..874bb97): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-stagekey-r3.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/stage-keys.mjs`, `apps/desk/server.mjs` (`lifecycleRpc`, `sendRpc`, `noteStageSession`, `ledgerKeys`, `stageKeyForSpawn`), `apps/desk/apps.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/README.md`, `docs/agent-frontend-design-2026-09-04.md`, `docs/review-punchlist-2026-09-08.md`.

## Dimensions
A. **Provenance soundness, again from scratch on the new store.** Any input (session file, `get_state` answer, a store file, a filename) under which a block not minted inside a desk-spawned app child becomes visible? Filename injection via session id (validated before EVERY filesystem use, including prune and aside?). A `.corrupt-*` or temp file that parses as a record — ever read back? A store file for id X readable as authority for id Y?
B. **Fork seeding.** Is the pre-RPC `get_state` source id the same identity pi copies entries from (what does pi's fork/clone actually do with the CURRENT session vs an argument)? If `fork` takes a target/entry argument, can the source differ from the session the child currently holds? Does the seed copy exactly the recorded key set of the source and nothing more? Unconfirmed-transition handling: is `child.sessionId = null` honoured by `ledgerKeys` (returns child key only) until the next confirmed observation?
C. **Failure directions.** Every catch in the new module and in `lifecycleRpc`: does the direction stay redact / no-inherit? Any throw that can escape into a request or the stdout handler? Worst-case event-loop stall now (per-session reads + the one-time prune over N session files)?
D. **Regressions vs round 2.** Anything that PASSED in round 2 and is now weaker? Dirty retry per id: bounded? Cache coherence: another desk writes id X's file after this desk cached X — is this desk's stale cache a correctness problem or only the declared residual?
E. **Tests as evidence.** Does the negative fork test fail on round-2 code for the stated reason? Are the restart / rename / switch / corrupt / prune / modes cases still present after the rewrite? Any new fixed port? Does any test write outside its temp dirs?
F. **Docs.** Exactly what the code proves now, nothing more; anything observable from round 3 undeclared?

## Output
Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
