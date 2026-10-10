## Findings

### MUST — The final ledger read is still racy

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:59-60,130-131`  
**Evidence:** The design reads records, checks reservations, then separately rechecks Git and merges. `review-round.mjs:583` takes the ledger lock only for individual ledger operations. A review can start or complete after the final read but before `merge --ff-only`. Its rejection can therefore arrive before the merge and remain unseen.

**Smallest fix:** Hold the ledger lock from the final record-and-reservation check through the merge, or introduce an equivalent land reservation that blocks admission and completion. Strengthen R-1005 to require atomic exclusion, and test a review starting after the final read.

---

### MUST — Invalid unverified verdicts would wrongly block a revision

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:58,127-129`  
**Evidence:** R-717 says a verdict from a changed tree is not valid. The proposed check excludes only unverified LAND from authorization. An unverified SEND-BACK would still trigger R-1004, contradicting R-717 and permanently blocking an otherwise accepted revision.

**Smallest fix:** Make R-1004 apply only to verified completed verdicts. Add tests showing that no unverified verdict authorizes or rejects a land.

---

### MUST — The proposed verdict parser still accepts the echoed placeholder as LAND

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:36-38,67,134-136`  
**Evidence:** For `VERDICT: LAND | FIX-FIRST | BLOCK`, the design removes formatting and takes the next token. That token remains `LAND`. If this is the last verdict line, the exact masking case in outcome 4 remains.

**Smallest fix:** Require the selected line to contain one verdict token followed only by permitted markdown or punctuation. Record no valid verdict when alternatives or other text remain. Add the placeholder-only case and placeholder-before-final-SEND-BACK case.

---

### MUST — Existing requirement rows would become false

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:63-69,86-99`  
**Evidence:** The tally will grow one line per completed verdict, but R-731 still says one line per round. The report will show several lines for one round, but R-970 still promises one line per round. R-992 still describes the returned values as rounds. Their cited tests also change meaning.

**Smallest fix:** Include R-731 and R-970 in the requirement delta. Clarify R-992 as returning verdict-bearing round records. Update affected evidence and comments while preserving R-972’s distinct-revision round count.

---

### MUST — The separate-clone bypass is cheap to close and central to this rule

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:111-113,145-146`  
**Evidence:** `nana-land.mjs:93-96` derives the ledger repository solely from the source tree. It never verifies that source and main share one Git common directory. A clone therefore gets a fresh ledger identity and can hide prior rejections while still fast-forwarding the main checkout.

**Smallest fix:** Require the real Git common directories of `--tree` and `--main` to match before reading reviews. Add a two-clone refusal test and a requirement row or clause.

---

### MUST — The legacy-record residual gives unusable instructions

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:147`  
**Evidence:** A legacy row without `verdict` cannot satisfy R-976. Under R-1004 it also becomes a non-LAND record and blocks a later LAND on the same revision. Passing lowercase SHA and the stored item does not solve either condition.

**Smallest fix:** State the intended rule explicitly. If legacy unknown verdicts fail closed, say they cannot authorize that revision and require a new commit plus review. Test that behavior. If they should be ignored as non-verdicts, reword R-1004 and test a legacy row beside a verified LAND.

---

### MUST — The declared file scope omits required frontier updates

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:77-109`  
**Evidence:** `HANDOFF.md:33` says only the first verdict is retained. `HANDOFF.md:48` still queues this lane. Both become stale when the change lands. The plan also says session notes enter the reviewed change but does not list the session archive.

**Smallest fix:** Add `HANDOFF.md` and the current session archive to In. Remove or rewrite both stale frontier entries before the final review.

---

### SHOULD — Legitimate normalized inputs remain wrongly refused

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:111-113`; `packages/nana-pack/bin/nana-land.mjs:62-66,88,95-96`  
**Evidence:** The SHA validator accepts uppercase hexadecimal, but ledger comparison is case-sensitive. Review item admission canonicalizes item names, while `nana-land` compares the raw item. An uppercase SHA or differently cased valid item can therefore be refused despite matching the recorded review.

**Smallest fix:** Resolve each SHA to its canonical full object ID and canonicalize each item before all ledger checks. Add both acceptance cases.

---

### SHOULD — The standard over-cap reason omits the common main-advance case

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:43-44,106-108`  
**Evidence:** A concurrent land forces a merge or rebase and therefore a new final tip. The proposed standard reason covers only fixes to named findings, not confirmation after incorporating a newer main.

**Smallest fix:** Include confirmation after incorporating current main, or provide a second standard reason.

---

### NOTE — `immutable-review.test.mjs` does not need modification

**Location:** `packages/nana-pack/tests/immutable-review.test.mjs`  
**Evidence:** Its items receive at most one completed verdict, so appending every verdict does not alter its assertions. Reading it is necessary; adding it to the edit list is not.

---

### NOTE — The independence limitation remains fundamental

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:140-141`  
**Evidence:** `review-ledger run` can record a LAND from an arbitrary command, and ledger metadata is spoofable. The helper will enforce unanimous recorded LAND verdicts, not reviewer independence.

The residual is honest. The README and feature purpose must avoid claiming that the helper itself proves independence.

## Scope assessment

The main implementation and test files are otherwise correctly identified. The shared marker source and `AGENTS.md` mirror are both included, and the byte-identity test need not change if the files remain identical. Historical hardening documents need not be rewritten.

## Score

**4/10.** Coverage and unanimous-verdict direction are sound. The final-read race and parser defect still permit rejected work to land. Several requirement and residual issues would also reject legitimate lands or leave the contract contradictory.

VERDICT: SEND-BACK
