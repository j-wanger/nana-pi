Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 3: agents-trim (confirmation)

Confirmation round. Review only `git diff 9e7e83c1..HEAD` on branch feat/agents-trim. Round 2 said LAND. CI on `9e7e83c1` then failed one check on every platform: `test-packs-core.test.mjs` M6, "moved bytes changed: templates-working.test.mjs". M6's second half was a one-time proof that the ci-packs lane (2026-11-07) moved test cases byte-identically; this lane's honest edits to `templates-working.test.mjs` broke it. Under the owner's 2026-11-09 test-keep rule (keep only tests that pin a recorded failure, a kept feature's main use, or a safety line), the fix deletes that half and narrows R-3855 to the land-pack guard it still checks.

Questions:
- Does the remaining M6 still check every core capability's land guard?
- Did the fix remove anything beyond the one-time move proof?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
