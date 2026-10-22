# Review brief — four-digit requirement IDs, confirmation round 4, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + compatibility)

Over the round cap, for one reason: a confirmation round on the final tip after fixes to named
findings. Your round 3 (`sol-build-r3.md`) and astra's (`astra-land-r3.md`) sent the lane back. Since
`d2edd8f`: the seat fixed astra's MUST 3 and SHOULD (`HANDOFF.md` no longer holds HTML pages; the
session entry says the owner requires Windows testing) and added seat-script cases; build round 5
(`build-brief-5.md`, `builder-report-5.md`) made the tree checker build its row prefix from the
rail's re-exported whitespace list, and removed a leading BOM exactly once per file in both rails.

Review `git diff d2edd8f..HEAD` and confirm the whole change `eeeca20..HEAD` holds; your verdict
covers all of it, and this is the final review before the owner's acceptance.

## Attack
1. **Your MUST closed.** U+0085 and U+001F rows: the rail loads them, the tree counts and places
   them, the outline lists them, and outside a feature they are refused.
2. **BOM exactly once.** One and two leading BOMs, in the ledger, the general file and test files,
   through every consumer, in both rails and the tree; same outcome everywhere.
3. **Any remaining disagreement** between the two rails, or between the rail and the tree, on which
   lines are requirement rows.
4. **Acceptance script.** `node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs` must exit 0.

## Output
Answer with the full review as your final message. MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
