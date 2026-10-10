## Round-one closure

The revisions close the unverified-verdict, clone, stale-row, frontier, normalization, and over-cap findings.

The final-read design closes the safety race, but its promised waiting behavior conflicts with the current lock timeout.

The parser now rejects echoed alternatives, but it mishandles a real scored LAND ending.

## Findings

### MUST — Historical masked rejections remain landable

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:16-24,31-36,142-147,179-180`

**Evidence:** The declaration identifies six revisions where a first LAND is in the tally and a later rejection exists only in the rotating audit log. The proposed land check still reads only round records. Changing `complete()` affects future reviews but does not move those historical rejections into the tally. Those six revisions therefore remain landable after this change, directly contradicting the stated outcome that a rejection is never masked. The residual covers only records without a verdict field, not records containing an early LAND whose later rejection was lost from the tally.

**Smallest fix:** Require a post-cutover record marker for authorization, forcing one fresh review for every legacy revision. Alternatively, migrate every surviving audit verdict and fail closed for revisions whose complete history cannot be established. Add a test with a legacy tally LAND plus a later audit SEND-BACK and prove it cannot land.

---

### MUST — The land lock can make review admission fail instead of wait

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:98-105,112-113,159-163`; `packages/nana-pack/bin/review-round.mjs:321-350,529-551,580-618`

**Evidence:** The existing lock waits only 15 seconds, then throws when the holder remains alive. Holding that lock through Git operations does not guarantee the critical section stays below 15 seconds. Git hooks, filesystem stalls, or injected runners can exceed that duration. `admit()` then returns a refusal. `complete()` also returns `ok:false` if it cannot acquire the lock. Thus the declaration’s claim that a review “waits rather than failing” is false.

For `review-ledger run`, a failed `complete()` also exits without explicitly releasing its reservation. Process death eventually makes it reclaimable, but the verdict is not recorded.

**Smallest fix:** Either export a land-specific lock operation whose contenders wait without the ordinary 15-second ceiling, or narrow the promise and test to “admission cannot succeed before merge.” If timeout remains possible, declare it and test the timeout and reservation recovery paths. Do not assert that the review waits successfully.

---

### MUST — The null-versus-absent rule exists only in design prose

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:64,74-75,154-158`

**Evidence:** The design distinguishes three states:

- `verdict: "LAND"` authorizes.
- `verdict: null` refuses.
- An absent `verdict` field neither authorizes nor refuses.

R-1004 only says a completed “verdict” that is not LAND refuses. R-1010 says malformed output records no valid verdict. A compliant implementation could therefore treat `null` as no verdict and ignore it, contrary to the design. This distinction determines whether malformed reviewer output blocks a land.

**Smallest fix:** State the field-presence rule in R-1004 or a separate row. Test both records together: explicit `null` must refuse, while an absent legacy field beside a verified LAND must not refuse.

---

### MUST — The verdict grammar rejects a real accepted ending

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:37-40,74-75,119-121,166-169`

**Evidence:** `VERDICT: LAND-WITH-FIXES` is one whitespace-delimited token and will correctly record a non-LAND verdict. However, `VERDICT: LAND (9/10)` contains a second token, so the proposed parser records `null` and blocks an otherwise accepted review. R-1010’s “more than one word” rule also describes hyphenated verdicts ambiguously.

**Smallest fix:** Define an explicit verdict-token grammar. Permit an optional parenthesized score after one recognized verdict token, while rejecting alternatives and prose. Add cases for `LAND-WITH-FIXES`, `LAND (9/10)`, and `LAND | FIX-FIRST | BLOCK`.

---

### MUST — Jake’s tree decision is scheduled after the builder changes the tree

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:4-9,70-86,196-199`; `REQUIREMENTS.md:23-25,34-38,47-51`

**Evidence:** The declaration proposes a new share and a feature-purpose change, both reserved for Jake. Yet its stated order places Jake’s acceptance after build and land review. Requirements-first requires the requirement delta before tests and code, while governance says Jake decides shares and purposes.

The declaration also calls FEAT-007 the home for all affected rows, although a subdivided feature requires subgroup homes. R-1010 belongs with result acceptance, while R-1008 and the storage/report rows belong with record protection and inspection.

**Smallest fix:** Move Jake’s checkpoint before build. Name the exact subgroup home for each new row. Keep the proposed R-1008 share and purpose change out of the builder brief until Jake accepts them.

---

### SHOULD — The repository-order promise is not pinned

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:68,91-99,114-115,159-160,186-191`

**Evidence:** The design correctly places the common-directory check before SHA canonicalization and ledger reading. The planned clone test proves only eventual refusal. It remains green if implementation resolves reviewed SHAs first. The mutation check likewise proves presence, not order.

**Smallest fix:** Strengthen R-1009 to require refusal before resolving reviewed revisions or reading records. Add an injected-runner test proving no reviewed-SHA `cat-file` or revision resolution occurs for mismatched repositories.

---

### SHOULD — R-976’s declaration overstates clause preservation

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:58,108-115`; `REQUIREMENTS.md:467`

**Evidence:** The declaration says R-976 keeps every pinned clause. Its current evidence includes successful landing while printing uncovered commits. That behavior is intentionally replaced with refusal under R-1002. The contract survives only by moving and reversing that clause, not by preserving it in R-976.

**Smallest fix:** Say the print-and-land clause is superseded by R-1002. Retag the exact-commit tests to R-1002 and retain R-976 tags only on ancestor, item, revision, plain-commit, verified-LAND, and unverified cases.

## Notes

- R-1002 through R-1010 each contain one `shall`.
- The proposed lock callback can expose copied round records and filtered live reservations without exposing private helpers.
- Unverified verdicts now correctly neither authorize nor reject.
- Future LAND/SEND-BACK orderings are covered once every completion is appended.
- The remaining landable rejected work is the historical audit-only rejection set described above.
- The declared independence and tamperability residuals remain honest.

## Score

**5/10.** Round two closes most round-one findings, but historical masked rejections still defeat the central rule. Lock behavior and verdict semantics also need contract-level correction.

VERDICT: SEND-BACK
