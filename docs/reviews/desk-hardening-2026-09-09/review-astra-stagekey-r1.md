Review is static: this harness provides no command-execution tool, so I could not rerun the tests. Paths below refer to the post-change tree unless marked “installed pi.”

### A. Provenance soundness — PASS, with scope qualifications

- I found no new path accepting a never-issued-key block, assuming the key store and same-user processes are trusted. Ledger acceptance still requires an HMAC match; LIVE still checks the child key and event tool/call identity.
- `server.mjs:215–239`: a lying app child can register its key under Y and make its signed blocks acceptable on Y’s ledger. That breaks a stronger session-origin claim, **not** the stated “minted inside a desk-spawned app child” boundary. Session identity is not cryptographically bound.
- Non-app children cannot reach the app listener’s ledger route (`apps.mjs:225–230,377–399`). Their `sessionId` also remains unset because `noteStageSession` returns before assigning it when `stageKey` is null. No reachable non-app recorded-key bypass found.
- Pruning is not revocation: `stage-keys.mjs:99` clears the tombstone when the same id is recorded again; `:180–184` then merges its old disk keys back. Another desk’s stale memory can likewise restore previously pruned records. These remain issued keys, not forged authority. Corrupt-aside bytes themselves are not reimported.

### B. Continuity correctness — FINDING

**BLOCK — concurrent desks can lose issuance records.**  
`apps/desk/stage-keys.mjs:162–165,215`

Exact interleaving: A reads disk D; B reads D; A merges and renames D+A; B merges its earlier D and renames D+B. A’s issuance disappears. Atomic rename prevents partial JSON, **not lost updates**. After both desks exit, A’s historical blocks redact.

**Minimal fix:** serialize the complete read–merge–write transaction across processes, with crash-safe lock handling, or use independently persisted issuance records. Add a barrier-controlled two-process test.

**BLOCK — forks lose inherited blocks signed by another recorded key.**  
`apps/desk/server.mjs:215–239`; installed pi `dist/core/session-manager.js:1080–1136`

Exact sequence: A signs with KA; B signs with KB; A’s child switches to B, then forks B into C. Pi copies custom entries unchanged into C, with a new session header id. The desk records only KA under C. B’s inherited KB blocks redact immediately—even though they verified immediately before the fork.

**Minimal fix:** capture and persist the source session’s verified key set into the newly created fork/clone record at the lifecycle transition. Do not trust arbitrary `parentSession` text as authority. Test mixed-key inheritance and restart before the first ledger read.

The ordinary restart/rename case is otherwise supported: `readSessionMeta` reads the header id; installed pi’s v1/v2 migration preserves that header id.

### C. Failure directions — FINDING

**SHOULD — failed state lookup uses stale session authority.**  
`apps/desk/server.mjs:230–239`

After switching A→B, make `get_state` fail while `get_entries` succeeds. Verification uses A’s cached recorded keys, contrary to the claim that failure only narrows toward redaction.

**Minimal fix:** on unresolved state, return only the live child key—or an empty set—not the previous session’s recorded keys. For exact session attribution, obtain identity and entries from one snapshot.

**SHOULD — transient persistence failure is never retried.**  
`apps/desk/stage-keys.mjs:98,163–173`

A rename failure leaves the new key in memory. Subsequent `record(id,key)` calls return early forever. Even after filesystem recovery, a restart loses continuity.

**Minimal fix:** retain a dirty flag and retry persistence independently of whether the key is already present.

Store reads, enumeration and writes are synchronous; a hung filesystem blocks the entire desk event loop. Offload persistence/enumeration if bounded responsiveness is required. No new store call occurs inside `handleChildEvent`.

The RPC cap remains bounded, but 32 unanswered ledger reads consume all 64 slots and reject prompts until responses/timeouts free them. This is temporary starvation, not an intrinsic permanent wedge.

### D. File hygiene — FINDING

**SHOULD — existing directories are not secured.**  
`apps/desk/stage-keys.mjs:209–215`

`mkdirSync(..., mode:0700)` does not change an existing directory’s permissions. An existing `0777` store directory remains writable by others, permitting replacement of the issuance record.

**Minimal fix:** validate ownership and enforce `0700` on the dedicated store directory; explicitly handle symlink-target directories without chmodding arbitrary shared directories.

New directories and replacement files get the claimed restrictive modes under a permissive umask. PID plus randomness separates simultaneous desks’ temporary names; exclusive creation (`wx`) would strengthen this.

Swapping only the final store symlink after `realpath` does not redirect the resolved write. Swapping ancestor directories can; that is the existing local-filesystem TOCTOU class, though secret-key placement has greater consequences. Corrupt-aside handling also renames the literal symlink, not its target (`:130–133`), contradicting “never replacing the link.”

### E. Tests as evidence — FINDING

**SHOULD — fixed-port collision.**  
`apps/desk/test/stage-key-persistence.test.mjs:35–36`

Port **4441** collides with `session-races.e2e.mjs:48`; app ports 4442/4443 are also fixed. Use dynamically allocated ports with reliable listener readiness.

The restart test genuinely launches a new server process and resumes the same file/header id. Forged-signature and never-issued-key ledger negatives run alongside the positive; accepting everything would fail them. The foreign-recorded-key LIVE negative is present.

Coverage does **not** establish concurrent merging, fork/clone inheritance, existing-directory permissions, or actual crash durability. Rename-exception injection establishes old-file preservation, not power-loss durability. The two existing e2e tests correctly isolate `DESK_STAGE_KEYS`.

### F. Contract/docs — FINDING

**SHOULD — claims exceed the implemented scope.**  
`apps/desk/README.md:319–324,361–366`; `docs/agent-frontend-design-2026-09-04.md:349`

- Shared-session manifests can reuse one key directly; `switch_session` is not the only route.
- “Holding this session” is not proved: replay, reused child keys and self-reported ids defeat that narrowing.
- The 512-session eviction limit is omitted from the declared continuity limits.
- Concurrent-store safety and fork continuity need the fixes above before being claimed.

**Minimal fix:** state that verification proves possession of a trusted-store-issued app key, not authenticated session/app origin; document all eviction limits and correct the shared-session example.

VERDICT: BLOCK
