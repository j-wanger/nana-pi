## MUST

None.

## SHOULD

### Cutover guidance misses an old completion before the first version-2 record

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:166-182,211-224`; `packages/nana-pack/bin/review-round.mjs:353-368,598-607`

**Evidence:** The version boundary protects the tally only after its first version-2 record exists.

A reviewer can load the old module before deployment. After deployment, that process can complete against an existing version-1 LAND before any version-2 record exists.

Old `complete()` then finds the existing revision, skips the tally append, and writes SEND-BACK only to the audit log. A later new LAND creates the first version-2 record.

The new land helper then sees only version-1 LAND plus version-2 LAND and authorizes the merge. The declared cutover residual covers old land processes, but not old review completions.

This is a transition-only authorization hole, not a steady-state defect.

**Smallest fix:** Require deployment with no old land or review process running. Add a test covering an old completion before the first version-2 record, or install a version fence before reviews resume.

## NOTE

### Round-four snapshot reservation finding is closed

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:76,107-118,124-130,183-189`

The requirement now covers both a named commit and its working-state snapshot. The design parses the reservation head before `+snap:` and checks every item.

The planned dirty-snapshot in-flight test exercises the exact former bypass.

### Round-four markdown stripping finding is closed

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:85-86,138-147,200-209`

The design matches the raw line without deleting characters. Wrapper marks cannot occur inside the verdict token.

The planned underscore, asterisk, and backtick cases reject the manufactured LAND forms.

### Round-four old land-process finding is partly closed

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:219-224`

The plan now declares the old land-process race and requires deployment without one running. The separate old completion race above remains undeclared.

### Round-four punctuation finding is closed

**Location:** `docs/reviews/land-rule-2026-10-10/CHANGE.md:85-86,139-145,203-208`

The requirement names exactly one accepted trailing punctuation character. Tests reject both `LAND!` and `LAND...`.

## Score

**9/10.** All four named fixes are sound. One narrow cutover race needs an explicit residual or fence.

VERDICT: LAND-WITH-FIXES
