# Review brief — stage signing keys persisted per session (design B), ROUND 2

You reviewed round 1 of this change and returned VERDICT: BLOCK (your review: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-astra-stagekey-r1.md — read it first; the round-1 brief with the mechanism background is /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-brief-stagekey.md). The worker folded every finding. Verify each fold against the code; look for regressions the folds introduced; do not re-litigate accepted design (any-of-recorded-keys on the ledger path; live path single key; pre-change blocks stay redacted).

## Folds claimed (verify each)

1. BLOCK concurrent desks: one advisory lock `<store>.lock` (`openSync` `wx`, released in `finally`, bounded ~2 s wait with `Atomics.wait` sleeps, takeover when the lock mtime is >30 s old) around the WHOLE read→merge→write. A desk that cannot take it keeps keys in memory, sets `dirty`, retries later. Declared residual: two desks taking over the same stale lock in the same instant can still lose one update. Test: two processes recording 120 sessions concurrently, nothing lost (60 missing before).
2. BLOCK fork inheritance: `noteStageSession` seeds a newly observed session id from the id the SAME child was observed holding immediately before (`stageKeys.seed`, fills only a blank record); no `parentSession` text read. `sendRpc` is now a wrapper over `sendRpcRaw` that, after a successful `new_session`/`switch_session`/`fork`/`clone`, does `get_state` + `noteStageSession` immediately. Tests: fork inherits mixed-key blocks; fork resumed after a restart with no ledger read in between.
3. SHOULD stale authority: `ledgerKeys` on a failed `get_state` returns `[child.stageKey]` (or `[]`), never `child.sessionId`'s recorded keys.
4. SHOULD retry: `dirty` flag; a later `record` (even of a key already held) retries persist.
5. SHOULD dir perms: `#secureDir` chmods the store dir to 0700 ONLY when it contains nothing but the store's own files (`stage-keys.json`, `.tmp`, `.lock`, `.corrupt-*`), never a symlinked dir, never an ancestor. Temp file `wx`.
6. SHOULD ports: desk port dynamic (`DESK_PORT=0`, read back from the startup line); app ports 4452/4453.
7. SHOULD docs: ledger check proves possession of a key this desk minted and recorded for the session the child reports holding, explicitly NOT authenticated session/app/child origin; 512-session limit declared; shared-session example corrected; `#aside` moves the resolved target. Two known limits added: synchronous store I/O incl. up to ~2 s lock wait on the event loop; `/api/entries` issues two RPCs that count toward the per-child RPC cap.

## Read

- Round-2 diff (fdbaace..26b2683): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-stagekey-r2.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/stage-keys.mjs`, `apps/desk/server.mjs` (`sendRpc`, `sendRpcRaw`, `noteStageSession`, `ledgerKeys`, `stageKeyForSpawn`), `apps/desk/apps.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/README.md`, `docs/agent-frontend-design-2026-09-04.md`, `docs/review-punchlist-2026-09-08.md`.

## Dimensions

A. Lock correctness: `wx` + mtime takeover — can two desks both "take over" and both proceed? Is the lock released on every exit path incl. throw inside merge/write? Does a stale lock from a crashed desk ever block forever? `Atomics.wait` on the main thread: does Node permit it here (it throws in some contexts) and what is the worst-case event-loop stall now (declared ~2 s)? Does the lock file itself get created 0600 in the 0700 dir?
B. Seed correctness: `seed` fills only a blank record — can the WRONG previous id be used (child observed holding P, then user switches to an existing session Q with its own record, then forks Q→C: is C seeded from Q, not P)? What if `get_state` after the fork RPC fails — is C seeded on the next ledger read from the right predecessor? Can seeding ever ADD authority that was not previously verifiable for the blocks now in C (i.e. does C inherit exactly the key set that vouched for the copied entries)?
C. `sendRpc` wrapper: every caller still gets the same promise semantics (rejections, timeouts, the 429 cap from the sibling lane)? The extra `get_state` after fork/switch — counted against the pending cap, and can it deadlock when the child is mid-turn?
D. Regressions: anything in round 1 that was PASS and is now weaker? `#secureDir` false negative/positive (a dir with an unrelated file → untouched, declared?); `#aside` on a target whose dir is unwritable; `dirty` retry storms (a persistently failing FS → a write attempt on every record call — bounded?).
E. Tests: does the two-process concurrency test actually interleave (barrier), and would it pass with a no-op lock by luck? Does the fork test prove inheritance via the seed path rather than via the child key alone? Dynamic port read-back robust (startup line format pinned)?
F. Docs: are the new claims exactly what the code proves now? Anything observable from this round undeclared?

## Output

Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
