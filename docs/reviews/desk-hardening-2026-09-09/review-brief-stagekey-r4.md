# Review brief — stage signing keys persisted per session, ROUND 4

Your rounds 1–3 are at /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-astra-stagekey-r{1,2,3}.md; the round-3 brief (with the per-session-file design) is review-brief-stagekey-r3.md next to them. Read r3 review + r3 brief first. Verify the round-4 folds; hunt for regressions; do not re-litigate accepted design (per-session files, no lock; any-of-recorded-keys on the ledger path; live path single key; possession-not-origin).

## Round-4 folds claimed (verify each)
1. BLOCK (B): `seed` is a UNION (adds the confirmed source's recorded keys to the destination record, existing keys kept in front, cap 8). Per-child ordering: lifecycle RPCs (`fork`/`clone`/`switch_session`/`new_session`) run through a per-child promise chain (`child.lifecycle`, rejection-absorbing); while `child.transition` is set, `noteStageSession` from a ledger read returns the observed id (that read verifies against it) but records nothing. Tests: ledger read landing mid-fork no longer strands inheritance; second lifecycle RPC sends nothing until the first completes (both fail on round-3 code).
2. SHOULD (C): `child.sessionId` and `child.inheritFrom` cleared at DISPATCH; confirmed fork source held in a local, re-armed after success; identity restored only by a successful observation. Deviation stated: the wall-clock RPC-timeout path is not tested (no test knob on RPC_TIMEOUTS); rejection and unsuccessful-response share the same `finally`.
3. NIT: `randomBytes` inside the write catch.
4. SHOULD (A): prune considers only stems passing ID_RE; test that `operator.notes.json`, temps and `.corrupt-*` survive.
5. SHOULD (D): NO cache — `keysFor` reads the record file every call; `record` = read→union→write; the in-memory map holds only keys whose own write failed, overlaid on read. Residual = two desks writing one session's record in the same instant (one new key lost), declared. Tests: two instances, sequential interleaved records keep every key; either reads the other's.
6. SHOULD (E): every spawned test server sets `DESK_STAGE_KEYS: STORE` explicitly.
7. SHOULD (F): recovery implemented — `child.inheritFrom` keeps the confirmed source until a destination is observed and seeded once, so a failed post-fork confirmation is completed by the next confirmed observation; a later transition clears it. Test: fork whose confirmation failed still inherits at the next confirmed observation. New declared limit: a ledger read landing mid-transition sees that session's blocks redacted for that one read.

## Read
- Round-4 diff (874bb97..aee2ded): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-stagekey-r4.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/stage-keys.mjs`, `apps/desk/server.mjs` (`lifecycleRpc`, `child.lifecycle`, `child.transition`, `child.inheritFrom`, `noteStageSession`, `ledgerKeys`), `apps/desk/apps.mjs`, `apps/desk/test/stage-key-persistence.test.mjs`, `apps/desk/README.md`, `docs/agent-frontend-design-2026-09-04.md`, `docs/review-punchlist-2026-09-08.md`.

## Dimensions
A. Union seed: can it ever add a key NOT recorded for a source the desk confirmed the child held immediately before the transition? `inheritFrom` surviving until "observed and seeded once": can a stale `inheritFrom` (from a fork whose result was never observed) seed a LATER, unrelated session the child ends up in (e.g. the user switches by a path that is not a lifecycle RPC — a slash command typed as a prompt, a pi-side auto-switch)? Enumerate every way a child's session id can change and whether each passes through the wrapper.
B. Ordering: is the chain applied to every lifecycle entry point (the `/rpc` allowlist, desk fork/clone buttons, any internal caller)? A rejected/timeout transition: is `child.transition` cleared on every path so ledger reads resume recording? Can `noteStageSession` returning-but-not-recording during a transition leave a session unrecorded forever if no later read occurs (the declared one-read limit vs permanent)?
C. No-cache store: read on every `keysFor` — exception paths (ENOENT, EACCES, corrupt) each fall to redact/overlay-only? read→union→write: the union bounded at 8 with the right ordering (child key first)? Overlay of failed-write keys: cleared when a later write succeeds?
D. Regressions vs round 3: anything weaker? Any path where the per-child chain deadlocks (a lifecycle RPC awaiting the chain while holding something the chain needs; ledger read awaiting a transition)?
E. Tests: do the eight new checks fail on round-3 code for the stated reasons? Is the "second lifecycle RPC waits" test deterministic (the interleaving output in the report suggests a held response, confirm)? Any remaining write outside temp dirs; env set explicitly everywhere?
F. Docs exact vs code; the untested timeout path stated?

## Output
Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
