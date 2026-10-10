# Seat response to sol build-b r1 (SEND-BACK, 6.5/10)

| Finding | Owner | Change |
|---|---|---|
| MUST 1 — proof accepts an undeclared heading added to both `tree-b.json` and the ledger (heading-order comparison filters to base keys) | builder (b2) | Compare the complete ordered key arrays; attack added to `seat-verify-b.sh`. |
| MUST 2 — checker is last-write-wins on `Status:`/`Also applies:` lines | builder (b2) | Collect every line; reject duplicates; validate every listed ID; duplicate-line attacks added to the script. |
| MUST 3 — R-291 field check calls `renderOutline` | builder (b2) | Derive expected fields and the index from the parsed ledger, never the renderer. (Same class as increment 1's dropped-ID bug; the builder-rules memory names it.) |
| MUST 4 — governance text gives every heading a status | seat (amendment B-A1) | `fixed-text-b.md`: "every heading with its rows, and every feature with its status and shared rows". |
| SHOULD 1 — "one sharing feature removed" mutation absent | builder (b2) + script | Fixture in the test; attack added to the script. |
| SHOULD 2 — allowlist vs review records | seat (B-A1) | CHANGE-B names review records (briefs, reports, logs, seat outputs, reviews) as seat-written records outside the builder's allowlist; frozen-input wording fixed. |
