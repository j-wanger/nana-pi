Static review of the merged tree; no execution tool was available, so tests were inspected, not rerun. Paths below are relative to `wt-int`.

### A. Provenance soundness — FINDING

No new never-issued-key acceptance found **assuming the store and same-user processes are trusted**. Store contents are authority, not authenticated evidence: inserting an attacker-chosen key into a record permits forgery. This is the declared possession-not-origin boundary.

Record/lookup ids reject traversal strings; generated corrupt-aside and temporary names cannot be requested as session records. Directory symlink resolution works for an existing target. Per-file symlinks or case-insensitive filename aliases can make X’s record readable as Y’s authority; neither gives an attacker without store control a new key.

**SHOULD — prune does not validate record filenames.**  
`apps/desk/stage-keys.mjs:195–198`

Prune unlinks every unknown name ending in `.json`, including `operator.notes.json`, although that cannot be a valid session record. This contradicts the validated-filename claim and is unnecessarily destructive in a pre-existing directory.

**Minimal fix:** require `ID_RE.test(f.slice(0, -5))` before considering deletion. Test preservation of unrelated JSON, temps and corrupt-asides. `readdirSync` names themselves cannot introduce traversal.

### B. Fork seeding — FINDING

The sequential missed-switch case is fixed. Installed pi’s `agent-session-runtime.js:174–220` resolves `entryId` within the **current session**, then opens that session’s file; the argument does not select another source session. Clone forks the current leaf. `noteStageSession` no longer independently inherits keys.

**BLOCK — a concurrent ledger read can permanently defeat fork seeding.**  
`apps/desk/server.mjs:242–253,675–693`; `apps/desk/stage-keys.mjs:116`

Exact interleaving:

1. P has recorded keys `[KA, KB]`; the live child uses KA.
2. Fork’s pre-state confirms P.
3. Fork creates C.
4. An overlapping ledger `get_state` observes C before the lifecycle wrapper’s post-state completes. `noteStageSession` creates C’s record as `[KA]`.
5. Lifecycle post-state confirms C, but `seed(C, …)` refuses because C is no longer blank.
6. C’s inherited KB blocks redact permanently, including after restart.

Concurrent lifecycle requests also remain uncoordinated: a switch can occur between fork’s pre-state and command, making the captured source wrong again.

**Minimal fix:** coordinate lifecycle transactions and ledger observations per child, preventing observations from recording an intermediate destination before inheritance completes. Serialize competing lifecycle transitions within that same mechanism. This requires no filesystem lock. Add deterministic overlap tests.

### C. Failure directions — FINDING

Ordinary filesystem failures preserve in-memory keys or narrow to redaction. Dirty retries make one write attempt per subsequent record; there is no retry loop or lock freeze. No store work runs directly in the stdout event handler.

**SHOULD — unconfirmed command outcomes do not clear identity.**  
`apps/desk/server.mjs:684–687`

A command timeout rejects before clearing `child.sessionId`; an unsuccessful response also returns without clearing it. Either can follow a partially completed transition. The claim that *every* unconfirmed transition clears identity is therefore false.

**Minimal fix:** clear identity when dispatching a transition, retaining the confirmed fork source separately. Restore identity only through successful observation. Current `ledgerKeys` does independently observe state and uses only the live key when observation fails, so this is not presently a stale-key fallback bypass.

**NIT — “no method throws” is not absolute.**  
`apps/desk/stage-keys.mjs:234`

Temporary-name `randomBytes` runs outside the write catch. Move it inside so entropy-source failure follows the dirty fallback.

Synchronous I/O remains unbounded by wall time. Prune performs session enumeration, metadata reads and sorting, plus store enumeration/unlinks. Record reads also have no byte-size ceiling; “small” describes desk-generated records, not arbitrary input.

### D. Regressions/cache coherence — FINDING

**SHOULD — the last-writer residual is substantially broader than declared.**  
`apps/desk/stage-keys.mjs:86–89,97–103,231–232`

No simultaneous writes are needed:

1. A caches X as `[K0]`.
2. B subsequently records K1, K2 and K3 for X.
3. Much later, A records KA and overwrites X with `[KA, K0]`.

Three keys disappear. Before that overwrite, A’s stale cache already redacts B’s blocks while B is still alive. Caching an empty record has the same problem.

This affects continuity, not acceptance of never-issued keys. Per-session files correctly isolate different session ids.

**Minimal fix:** retain the chosen authoritative-cache design, but explicitly declare lifetime-long stale reads and multi-key loss from sequential writers. Add a deterministic test documenting that behavior; do not restore the lock.

### E. Tests as evidence — FINDING

Restart, rename, switch, signature negatives, foreign-key LIVE rejection, mixed-key inheritance, dirty retry, corruption isolation, modes and prune checks remain. The concurrency test was deleted; desk-port read-back resets per run. Fixed app ports 4452/4453 are unchanged from round 2.

The new wrong-predecessor test is meaningful: restoring round-2 server logic seeds from the stale predecessor and misses Z’s key. Its claimed failure mechanism checks out statically. It does not cover B’s overlapping requests.

**SHOULD — inherited environment can escape test isolation.**  
`apps/desk/test/stage-key-persistence.test.mjs:197–201`

The child inherits `DESK_STAGE_KEYS` from `process.env` without overriding it. That variable wins over temporary HOME, so an externally configured store can be written or pruned.

**Minimal fix:** explicitly set `DESK_STAGE_KEYS: STORE` in the spawned server environment.

### F. Documentation — FINDING

The directory layout, eight-key limit, best-effort persistence, possession-not-origin qualification, extra RPCs and removal of lock-era guarantees are substantially reflected.

**SHOULD — remaining continuity claims exceed the implementation.**  
`apps/desk/README.md:248–255,318–323`; `docs/agent-frontend-design-2026-09-04.md:349`; `docs/review-punchlist-2026-09-08.md:204–217`

- Fork inheritance is not reliable under overlapping observations/transitions.
- “Same instant” and “one key” understate the authoritative-cache residual.
- The docs explain unavailable **source** observation, but not that failed **post-fork** observation loses inheritance permanently: a later ledger read only records the child key.

**Minimal fix:** repair B, broaden the cache residual, and explicitly document failed-post-observation continuity loss—or implement its recovery.

VERDICT: BLOCK
