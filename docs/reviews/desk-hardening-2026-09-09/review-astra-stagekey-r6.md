Static verification only; no execution tool was available.

### A. Provenance — PASS
No never-issued-key acceptance or seed outside the declared boundary found. Live verification uses the child’s key; ledger verification adds the observed session’s recorded keys. The sole seed site uses keys recorded for a confirmed source. The prompt-race declaration is widened in all three documents.

### B. Budget enforcement — FINDING
**BLOCK — `apps/desk/server.mjs:719–734,764–777`.** The timer race bounds ordinary waiting, but does not enforce acceptance against the deadline. A response processed at—or after—the deadline before the timeout callback runs can win, clear the timer, and trigger recording/seeding.

**Minimal fix:** recheck the absolute deadline after awaiting the answer, before accepting its ID; reject when `Date.now() >= deadline`. Prefer passing that deadline into the helper.

After the wrapper has actually returned, late responses are harmless: the correlated handler only resolves the already-lost promise; it does not record or seed. The underlying pending RPC remains until its response or ordinary timeout.

### C. Identity subtraction — PASS
No child-record `sessionId` reader or field remains. `noteStageSession` and `ledgerKeys` use current observations. Failed state reads already fell back to the live key alone before this fold. No behavioral regression found from removing the dead assignments.

### D. Tests — FINDING
**SHOULD — `apps/desk/test/stage-key-persistence.test.mjs:535–546`.** The elapsed-time assertion discriminates against round 5, but the inheritance assertion does not: this fork’s source is `idU`, already asserted to contain only `keyA1`, not `keyZ`. Even incorrectly confirming and seeding it passes `!includes(keyZ)`. Shutdown also precedes the delayed response.

**Minimal fix:** switch back to `fileZ` first; assert the destination remains unrecorded through an acknowledged late response. Add the deadline-boundary case.

The eight-competitor/any-429 handshake is sound. Store environment overrides are explicit; inspected writes are temporary.

### E. Documentation — FINDING
**BLOCK — remaining overstatements:**

- **`apps/desk/README.md:378–379`; `docs/review-punchlist-2026-09-08.md:409–411`:** transition-window reads are not necessarily “live key alone.” `ledgerKeys` still unions existing destination records. Say **live key plus already-recorded keys, without recording this observation**.
- **`apps/desk/README.md:496–498`; `docs/agent-frontend-design-2026-09-04.md:349`:** absent-session pruning remains unconditional here. Carry over the nonempty enumeration and successful-unlink qualifications.
- **`docs/agent-frontend-design-2026-09-04.md:349`:** the lifecycle-cap sentence still lacks **app children** and says eight queued rather than **queued plus running**.
- **`apps/desk/README.md:383–385`:** unconditional late-answer rejection is not yet implemented; fix B.

The corrected authority path, inherited-only block qualification, store-versus-live-key retention, 60-second lifecycle timeout, and addendum batch-loss wording landed.

VERDICT: BLOCK
