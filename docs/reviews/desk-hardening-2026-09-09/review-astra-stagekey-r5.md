Static review of the diff and `wt-int`; tests were inspected, not executed.

### A. Provenance — FINDING

No never-issued-key acceptance found within the declared trusted-store/child boundary. Deferred inheritance is deleted; seeding exists only inside `lifecycleRpc`.

**BLOCK — the declared prompt race is narrower than the remaining race.**  
`apps/desk/server.mjs:735–752`; `apps/desk/README.md:460–464`

After P→C forks, a prompt-driven switch can move the child to unrelated Z before destination confirmation. Confirmation then seeds P’s keys into Z. Keeping inheritance local eliminates later recovery, but does not authenticate the fork’s destination. The README declares only a prompt landing **before** the fork.

**Minimal fix:** declare that interference anywhere through destination confirmation can attribute inheritance to an unrelated destination. This remains desk-issued-key-only and is eligible for declaration under the closing standard.

### B. Regressions / lifecycle bounds — FINDING

Identity is correctly cleared immediately before dispatch and restored only by observation. No caller reads `child.sessionId` as authority. The app-child queue counts running plus waiting commands, releases slots on either outcome, and introduces no evident ordinary single-action UI regression.

**BLOCK — confirmation is not bounded to approximately one second.**  
`apps/desk/server.mjs:742–758,779`; `apps/desk/README.md:375–377`

Each `childState` retains the ordinary **30-second** timeout. A response arriving after the deadline is still accepted; a failed response just before the deadline permits a sleep and another full RPC after it. The new retry can therefore exceed both the advertised budget and one slow round trip.

**Minimal fix:** bound each confirmation RPC by remaining time and check the deadline before dispatch and acceptance—or accurately declare the actual bound instead.

### C. Failure directions / store — PASS

The pending overlay now retains only additions absent from the disk snapshot. Retry composes those additions with fresh disk contents; the eight-key-cap test targets the previous stale-overlay defect.

Read failures narrow authority; unsuccessful lifecycle commands retain no inheritance or identity; failed confirmation records nothing; failed writes preserve only unsaved additions. No new fail-open catch found.

### D. Tests — FINDING

**SHOULD — queue admission handshake still assumes HTTP arrival order.**  
`apps/desk/test/stage-key-persistence.test.mjs:473–480`

Launching seven fetches before the “over” fetch does not guarantee their server arrival order. If “over” is admitted and another request receives 429, the test awaits the held request before releasing it, eventually exercising a timeout rather than the intended handshake.

**Minimal fix:** launch eight competitors and wait for *any* one to return 429 before releasing the hold.

**SHOULD — identity cleanup is not asserted.**  
`apps/desk/test/stage-key-persistence.test.mjs:498–503`

Reporting an unsuccessful fork and successfully switching afterwards also works on round-4 code. These checks do not detect stale `child.sessionId`.

**Minimal fix:** inspect identity immediately after unsuccessful dispatch, before another observation restores it.

The ledger overlap handshake is sound. The failed-confirmation and pending-overlay assertions meaningfully distinguish round-4 behavior. The complete “six new failures” claim is not established statically, particularly given the queue test’s timeout behavior. Store paths and writes inspected are temporary; `DESK_STAGE_KEYS` is explicitly overridden.

### E. Documentation — FINDING

**BLOCK — remaining statements exceed the implementation.** Besides A/B:

- `apps/desk/README.md:340–345,483–487`: deletion of absent-session records is unconditional in prose; pruning skips empty/failed enumeration and deletion failures.
- `:373–374,377`: “blocks … redacted” needs **copied blocks signed only by inherited keys**; live-key blocks still verify during transitions and after unsuccessful confirmation.
- `:381–384`: the eight-command lifecycle cap applies only to **app children**, not every child.
- `:420–423`: the readable authority path is still the retired `stage-keys.json`, not `stage-keys/<id>.json`.
- `:450–458`: a successfully persisted key overwritten by another desk is not retained **by the store**, but may remain the live child’s key; such blocks need not redact on the next lookup.
- `:465–469`: lifecycle-command timeout is **60 seconds**, not 30; 30 seconds applies to `get_state`.
- `docs/agent-frontend-design-2026-09-04.md:349`: still says overlapping writes cost “at most one key,” contradicting the corrected batch-loss declaration.

**Minimal fix:** qualify these sentences and synchronize the addendum. The batch-addition wording, removal of recovery claims, and explicit timeout-test omission otherwise landed.

These blockers concern unhonoured documentation claims, not a demand to eliminate honestly declared, bounded continuity losses.

VERDICT: BLOCK
