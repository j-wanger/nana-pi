## Round-three closure

- **Version-2 tally:** The prior mixed-version completion defect is closed for readers starting after a version-2 record exists.
- **Verdict corpus:** The planned grammar now accepts the established scored LAND forms and rejects prose after LAND.
- **Final authorization read:** R-1005 now includes R-1011.

## Findings

### MUST — Snapshot reservations can escape the in-flight check

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:72-74,105-116,180-192`; `packages/nana-pack/bin/review-round.mjs:501-503,541`

**Evidence:** R-1004 matches completed snapshot records through their `head`, but R-1006 does not define equivalent matching for live reservations. A reservation stores only `revision`, which can be `<commit>+snap:<hash>`.

The land helper permits untracked source files because its cleanliness check covers tracked state only. A snapshot review of commit T can therefore remain in flight while T lands.

If the implementation compares reservation revision directly with T, the final read misses that review. The review can record a version-2 SEND-BACK immediately after the merge lock releases.

**Smallest fix:** Make R-1006 and the design explicitly match a reservation whose revision equals the commit or whose parsed head equals it. Add an in-flight dirty-snapshot test that must refuse the land.

---

### MUST — Blind markdown stripping can manufacture LAND

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:83-84,195-200`

**Evidence:** The design removes every `*`, `_`, and backtick before validating the verdict token. Thus `VERDICT: L_A_N_D` becomes `VERDICT: LAND` and authorizes a merge.

That input does not contain the required capital-and-hyphen verdict word. Intraword underscores are also literal under normal Markdown parsing, not emphasis wrappers.

The same weakness exists for strategically inserted asterisks.

**Smallest fix:** Permit formatting marks only as wrappers around the label, verdict, score, or line. Never delete marks from inside the verdict token. Add rejecting tests for `L_A_N_D`, `L*A*N*D`, and an intratoken backtick form.

---

### SHOULD — An already-running old land process remains a transition race

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:174-179`; `packages/nana-pack/bin/nana-land.mjs:95-110`

**Evidence:** An old helper can read the version-1 tally before the first version-2 record, then run its suite. A new completion can append a version-2 SEND-BACK before that old process merges.

The loaded old process never reads the tally again, so the new marker cannot make it fail closed. The planned old-reader test starts after the version-2 record exists and misses this sequence.

This requires direct execution from an old worktree during cutover, so it is a transition residual rather than a steady-state bypass.

**Smallest fix:** Narrow the mixed-version claim and declare this cutover residual. Require no directly invoked old land process during deployment.

---

### SHOULD — “Trailing punctuation” is broader than the specified parser

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:83-84,197-200`

**Evidence:** The rows say trailing punctuation is ignored. The design accepts only one `.`, `,`, `;`, or `:`. Inputs such as `VERDICT: LAND!` or `VERDICT: LAND...` satisfy the row’s ordinary reading but record an empty verdict.

This fails closed and is outside the observed corpus.

**Smallest fix:** Define the exact accepted punctuation in R-969 and R-1010, matching the implementation and tests.

## Score

**7/10.** The named versioning and corpus defects are substantially closed. Snapshot concurrency and intratoken formatting still open authorization holes.

VERDICT: SEND-BACK
