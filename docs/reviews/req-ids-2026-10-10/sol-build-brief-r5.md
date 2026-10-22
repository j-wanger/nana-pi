# Review brief — four-digit requirement IDs, confirmation round 5, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + compatibility)

Over the round cap, for one reason: a confirmation round on the final tip after fixes to named
findings. Your round 4 (`sol-build-r4.md`) sent the lane back: the tree counted malformed candidates
by prefix. astra's round 4 (`astra-land-r4.md`) was LAND. Build round 6 (`build-brief-6.md`,
`builder-report-6.md`) exported ONE row test from the TypeScript rail (`requirementRowId`), used it
in the rail's own readers and near-miss check, and made the tree collect rows only through it. It
also closed your SHOULD (R-287 evidence) and NOTE (the normalized-text contract). The seat updated
the session entry's build count.

Review `git diff 6a74cfd..HEAD` and confirm the whole change `eeeca20..HEAD` holds; your verdict
covers all of it, and it is the final review before the owner's acceptance.

## Attack
1. **Your MUST closed.** Missing closing pipe, a non-whitespace suffix, five cells, whitespace
   variants: the tree never counts or renders a line the rail does not accept as a row, inside or
   outside a feature, and the rail fails each, naming the line.
2. **Nothing regressed** in the tree's table and heading detection now that a malformed pipe line
   inside a table is skipped rather than ending it; the real ledger's outline is unchanged.
3. **Acceptance script.** `node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs` must exit 0.

Declared residuals stay accepted (`astra-land-r4.md` "Accepted residuals"). A new finding should
name a case where a requirement row is counted, dropped or failed differently by two of the three
readers.

## Output
Answer with the full review as your final message. MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
