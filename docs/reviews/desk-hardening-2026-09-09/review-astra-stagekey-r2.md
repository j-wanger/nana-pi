Static review; no execution tool was available. Paths below are relative to the post-fold tree.

### A. Lock correctness — FINDING

Ordinary contention is fixed: exclusive creation covers read→merge→write, `finally` releases after exceptions, and the lock is created with mode `0600`. Node permits this `Atomics.wait` usage.

**BLOCK — retry branches bypass the deadline.**  
`apps/desk/stage-keys.mjs:279–297`

If an old lock cannot be unlinked—for example, in a shared directory that is no longer writable—the stale branch loops forever without sleeping or checking the deadline. Persistent `statSync` errors do likewise. This freezes the entire desk, not merely persistence.

**Minimal fix:** check a monotonic deadline on every iteration; retry only disappearance/race errors and propagate persistent filesystem errors into the dirty fallback. Test failed stale-lock unlink.

The declared simultaneous-takeover race remains real: two contenders can stat the old lock, then one unlinks the other’s replacement. Additionally, an owner paused beyond 30 seconds can resume after takeover, write without exclusivity, and unlink its successor’s lock (`:306–309`). Thus the residual is broader than two simultaneous stale-lock contenders.

### B. Seed correctness — FINDING

The ordinary P→recorded Q→C sequence works when observations succeed. A failed post-fork state lookup also recovers on the next ledger read **if no intervening transition occurred**.

**BLOCK — a missed intermediate observation permanently seeds the wrong predecessor.**  
`apps/desk/server.mjs:218–234,643–654`

Exact sequence:

1. Child is observed holding P.
2. `switch_session(Q)` succeeds, but its follow-up `get_state` fails.
3. Fork Q→C succeeds; its state lookup returns C.
4. C receives P’s recorded keys, not Q’s.
5. Q’s foreign-key copied blocks redact; blank-only seeding prevents subsequent repair.

This also adds P’s authority to C despite those keys not necessarily having verified Q’s entries. No never-issued key is admitted, but inheritance is not the claimed source set.

**Minimal fix:** serialize lifecycle transitions with their observations, establish/capture the actual source before fork/clone, and reconcile an unresolved transition before allowing another. Add the failed-switch→fork negative case.

### C. RPC wrapper — PASS, with timing qualification

`apps/desk/server.mjs:643–685`

Original-command rejections, timeouts and admission-cap 429s propagate. The additional `get_state` uses the same capped primitive; its failure does not change a successful command result. No intrinsic promise deadlock is introduced.

Completion timing does change: a successful lifecycle RPC can now wait another **30 seconds** for observation, plus synchronous store work. The failed-state ledger fallback correctly excludes stale recorded authority (`:248–258`).

### D. Filesystem and retry regressions — FINDING

The dirty retry fold works, including recording an already-held key. Temporary creation uses `wx`. Persistent failures retry on every record without backoff; there is no autonomous retry loop, but repeated requests can repeatedly stall the desk.

**SHOULD — corrupt-aside still ultimately replaces the symlink.**  
`apps/desk/stage-keys.mjs:183–204,236–246`

For `store → target`, corruption moves `target` aside. The link becomes dangling. The next `#target()` fails `realpathSync`, returns the literal store path, and persistence renames over the link.

**Minimal fix:** preserve the resolved destination across aside/recreation, including across restart through dangling-link resolution. Test corruption→aside→record with a symlink. An unwritable target directory otherwise fails closed into in-memory operation.

**SHOULD — directory ownership detection exceeds the claimed rule.**  
`apps/desk/stage-keys.mjs:239–241,321–327`

- `stage-keys.json.notes` is treated as store-owned by the broad prefix match.
- Resolving the store first erases a symlinked parent directory; `lstatSync` then inspects the real directory and can chmod it.

**Minimal fix:** match only actual lock/temp/corrupt filenames, and preserve original-path symlink information before deciding whether chmod is allowed. Ordinary unrelated filenames correctly leave directories untouched.

### E. Tests — FINDING

The mixed-key fork test genuinely exercises seeding, not merely the child key. The restart-without-ledger-read test also exercises the lifecycle wrapper. Existing signature and LIVE negatives remain meaningful.

**SHOULD — concurrency evidence is scheduling-dependent.**  
`apps/desk/test/stage-key-persistence.test.mjs:428–448`

The release file is a start gate, but the parent sleeps 400 ms rather than waiting for both workers to report readiness. Even with both ready, no critical-section overlap is forced. A no-op lock can pass if one worker runs its writes first.

**Minimal fix:** readiness acknowledgments plus controlled transaction contention; assert worker exit status and bound test completion.

**NIT — startup can reuse the preceding run’s port.**  
`apps/desk/test/stage-key-persistence.test.mjs:178–196`

`DESK` is not reset between runs, so readiness can succeed before parsing the new startup line.

**Minimal fix:** reset it to zero and require this run’s match. The regex matches `server.mjs:2187`; desk port allocation is genuinely dynamic. App ports moved to 4452/4453 as claimed.

### F. Documentation — FINDING

The folds correctly document both eviction limits, shared-session manifests, unauthenticated origin, synchronous I/O and ledger RPC-cap consumption.

**SHOULD — remaining claims exceed implementation.**  
`apps/desk/README.md:301–303,312–314,378–384`; `docs/agent-frontend-design-2026-09-04.md:349`

- “Concurrent desks are safe” omits the takeover exceptions.
- “Wrote into its own store” excludes accepted live/in-memory keys after persistence failure.
- “Never on the link” is contradicted by corrupt-aside recovery.
- The approximately two-second ceiling is false on A’s retry branches.

**Minimal fix:** repair A/D, qualify takeover safety, and describe verification as the live key union the session’s in-memory issuance record, persisted best-effort. Update the punch-list’s closure claim after the missing failure tests pass.

VERDICT: BLOCK
