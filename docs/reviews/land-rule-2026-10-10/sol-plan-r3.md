## Round-two closure

Five MUSTs and two SHOULDs from round two are closed in the declaration:

- Legacy records cannot authorize under the proposed marker rule.
- The lock promise now includes the existing 15-second timeout.
- Explicit empty verdicts refuse, while absent legacy fields do not.
- Parenthesized scores and hyphenated verdicts have planned tests.
- Jake’s tree checkpoint precedes the build, with subgroup homes named.
- Repository identity is checked before reviewed-revision resolution.
- The replaced print-and-land clause moves from R-976 to R-1002.

Two new central defects remain.

## Findings

### MUST — An old completion can still hide a rejection after a marked LAND

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:83,109-114,157-162,169-176`; `packages/nana-pack/bin/review-round.mjs:353-368,598-607`

**Evidence:** The marker protects new `nana-land` from old records, but it does not stop an old `complete()` from writing after cutover.

The failing sequence is:

1. New code records a marked LAND.
2. A reviewer launched from an older worktree completes a SEND-BACK on the same revision.
3. Old `complete()` finds the existing revision and skips the tally append.
4. It writes SEND-BACK only to the rotating audit log.
5. New `nana-land` sees the marked LAND and no tally rejection, so it authorizes the merge.

The declaration calls mixed versions safe. The current old writer instead recreates the exact masked-rejection defect after cutover.

An old `nana-land` is also unsafe once new code appends every verdict. Its current `.some(LAND)` check accepts LAND plus SEND-BACK records.

**Smallest fix:** Make the marker an explicit incompatible tally schema version, such as `v:2`. New readers should accept legacy `v:1` and new `v:2`, while new completions write `v:2`.

Once the first `v:2` record exists, old readers fail closed on it instead of writing or landing. Add tests proving an old completion cannot suppress a later rejection and an old land reader cannot authorize a mixed-verdict tally.

---

### MUST — The verdict grammar rejects established LAND endings and leaves “score” undefined

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:42-46,81-82,132-136,187-191`; `docs/reviews/pi-1.0-2026-10-04/astra-r3.md:100`; `docs/reviews/audit-2026-10-05/sol-r3.md:37`

**Evidence:** Real accepted reviews end with forms such as:

- `**VERDICT: LAND — 9/10.**`
- `VERDICT: LAND — 9/10`

The proposed grammar accepts only a parenthesized score. It records these established LAND endings as empty verdicts, permanently refusing an otherwise legitimate land.

The grammar also names `(<score>)` without defining score syntax. An implementation permitting arbitrary parenthesized text could authorize `VERDICT: LAND (fix these first)`.

Trailing whitespace is also absent from the described regex, although existing markdown verdict lines use hard-break spaces.

**Smallest fix:** Define score syntax explicitly and accept both corpus forms, for example `(\d+/\d+)` or `— \d+/\d+`, followed only by permitted punctuation, markdown closers, and whitespace. Add corpus-derived tests for both LAND examples, markdown hard-break spaces, and a rejecting case such as `LAND (fixes pending)`.

---

### SHOULD — The final-read row omits the authorization-marker rule

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:71,75,177-180`

**Evidence:** R-1005 expressly applies R-976, R-1004, and R-1006 to the final locked reading, but omits R-1011. R-1011 is what prevents an unmarked LAND from authorizing.

The design likely intends the shared authorization predicate to enforce R-1011 at both readings, but the row does not require that timing.

**Smallest fix:** Add R-1011 to R-1005’s final-reading list and test that the final locked reading cannot authorize an unmarked LAND.

## Notes

- The narrowed lock promise now matches the current timeout behavior.
- LAND plus LAND remains landable.
- Verified non-LAND records under another item or a commit snapshot correctly refuse.
- Unverified records correctly neither authorize nor refuse.
- Every changed row contains one `shall`.
- New and reworded FEAT-007 rows have coherent subgroup homes.
- R-976’s retained ancestor, item, revision, plain-commit, verified-LAND, and unverified clauses are represented in the test plan.
- The marker defect is not a rare bypass. Other worktrees can execute old review code against the shared user ledger.

## Score

**6/10.** Round two’s findings are addressed, but the mixed-version writer can recreate the central masked-rejection failure. The verdict grammar also rejects real accepted review endings.

VERDICT: SEND-BACK
