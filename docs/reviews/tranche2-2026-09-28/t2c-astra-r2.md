1. **MUST 1 — FIXED:** `packages/nana-pack/lib/objective.ts:484–489` pins the active store; `tests/objective-golden.test.mjs:900–937` covers the wrong-store → correct-store transition.
2. **MUST 2 — PARTIAL:** `packages/nana-pack/lib/objective.ts:303–316,359–360` rejects files, links and non-empty directories, but accepts every empty lock directory.
3. **MUST 3 — FIXED:** `packages/nana-pack/lib/objective.ts:334–337` detects and names dangling agent-directory links; T18 covers both path positions.
4. **MUST 4 — FIXED:** `AGENTS.md:17–20` names the active umbrella location; `packages/nana-pack/README.md:564–576` declares resource loading, removal consequences and conditional clearing. The empty-lock overclaim remains under MUST 2.

**Empty-lock ruling: BLOCKER, not an accepted transient residual.**
`objective.ts:312` equates empty with usable; pi’s `proper-lockfile/lib/lockfile.js:65–85` requires staleness before takeover.
A fresh empty directory can outlast pi’s approximately 180 ms retry window; a future timestamp prolongs failure until that timestamp plus the stale interval—not literally forever, but without a useful bound.
With recorded `true`, nana suppresses the label while pi’s lookup throws. A startup-only verdict also means a transient obstruction can produce a session-long misclassification.
Conservatively retain the label for an occupied lock unless usability is established; advise waiting/rechecking, not moving a potentially live lock.
Add fresh/future/stale empty-directory tests against pi’s `get()`/`set()` and both runtime outputs. T17 currently covers only the stale-empty success case.

**NEW:** No independent blocker established beyond this remaining MUST-2 case.
**Process:** Credit the structural trace rule and checkpoint stop; neither waives a demonstrated contract failure.
**CARRY:** Broken `trust.json` symlink diagnosis/remediation; writability checks remain pre-checks, not proof; Claude-hook relative-override resolution against its own cwd.
The landed `packages/nana-pack/lib/config.ts:276` deny-policy inconsistency remains a **separate urgent item**, not an additional T2c blocker.
The seat-reported 4,377 passing checks do not cover the decisive empty-lock failures; I did not rerun them.

SCORE: 7/10
MUST: Close empty-lock false affirmation; correct corresponding documentation and add regression coverage.
CARRY: Store-symlink remedy; writability pre-check limits; hook-cwd parity; urgent separate deny-policy fix.
VERDICT: BLOCK
