# Response to sol plan review r1 (SEND-BACK, 4/10) — seat, 2026-10-10

Every finding was checked against the code and taken. `CHANGE.md` now reads:

| Finding | Change |
|---|---|
| MUST final read racy | R-1005: the second reading runs under the review ledger's lock, held through the R-977 rechecks and the ff-only merge; R-1006 (in flight) applies to that reading; one exported lock call in `review-round.mjs`. The lock section holds no suite run, so it stays inside the 15-second lock wait (`LOCK_WAIT_MS`); a review that starts or completes meanwhile waits. Test: a review starting after the final reading cannot complete before the merge. |
| MUST unverified verdicts | R-1004 counts only VERIFIED completed verdicts; unverified records (R-717) neither authorise nor refuse. Test added. |
| MUST placeholder still LAND | R-969 takes the word after `VERDICT:` on the last such line; new R-1010: more than one word there records no valid verdict (`verdict: null`, which refuses). Tests: the format line alone; the format line before a final SEND-BACK. |
| MUST stale rows | R-731, R-970 and R-992 reworded for one record per completed verdict; R-972 keeps the distinct-revision count. |
| MUST clone bypass | New R-1009: `--tree` and `--main` must share one git common directory, checked before any review record is read. Test: a clone as `--tree` refuses. Removed from the residuals. |
| MUST legacy residual | Stated: a legacy record with no `verdict` field neither authorises nor refuses; a `null` verdict refuses. A revision reviewed only before 2026-10-07 needs a new review. Test: a legacy record beside a verified LAND lands. |
| MUST frontier scope | `HANDOFF.md` and `docs/sessions/2026-10.md` are In; the seat writes them before the final review for the merged state. |
| SHOULD normalised inputs | Each `--reviewed` SHA resolves to its full lowercase commit ID and each item is canonicalised as admission does, before any ledger check. Tests: uppercase SHA, differently cased item. |
| SHOULD over-cap reason | The standard reason now reads "confirmation round on the final tip after fixes to named findings or a merge of current main". |
| NOTE immutable-review | Read, not changed. |
| NOTE independence | The residual stays, and neither the README nor the feature purpose claims the helper proves independence. |

Rows now: FEAT-008 R-976, R-977, R-588 reworded, R-978 retired, R-1002–R-1007 and R-1009 added;
FEAT-007 R-969, R-731, R-970, R-992 reworded, R-1008 and R-1010 added. The product report's rows
start at R-1011.
