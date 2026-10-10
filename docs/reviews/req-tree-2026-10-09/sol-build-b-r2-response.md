# Seat response to sol build-b r2 (SEND-BACK, 8/10)

| Finding | Owner | Change |
|---|---|---|
| MUST 1 — the proof accepts reordered new rows (R-292/R-293 swapped passes; the outline's ranges hide the order) | builder (b3) + seat (B-A2) | `prove.mjs`: at each expected position a new row must carry the expected ID and Requirement; only its Status and Evidence cells may differ, and those are validated. Attack added to `seat-verify-b.sh`. |
