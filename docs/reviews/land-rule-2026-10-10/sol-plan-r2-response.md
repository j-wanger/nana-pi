# Response to sol plan review r2 (SEND-BACK, 5/10) — seat, 2026-10-10

Every finding was checked against the code and taken. `CHANGE.md` now reads:

| Finding | Change |
|---|---|
| MUST historical masked rejections | New R-1011: only a verified LAND record carrying the R-1008 marker authorises. Records written before the change carry none, so every earlier revision needs a fresh review; the six historical masked revisions cannot land on their old LAND. Test: an unmarked LAND whose later SEND-BACK is only in the audit log cannot land. Declared in §5 and at checkpoint 2. |
| MUST lock wait | The promise is narrowed to what holds. A review of a named revision cannot be completing during the locked section (it would have been in flight at the final reading, and the land refuses). A review of another revision waits up to the existing 15-second lock limit, then fails as it does today with any holder (admission refused with nothing recorded, or completion unrecorded with output kept; re-run). Declared in §5, with `review-ledger run`'s reservation reclaimed on process death. Test: during the locked section an admission is never granted before the merge. |
| MUST null versus absent | In the rows now. R-1004 refuses on any verified record that carries a verdict field whose value is not LAND, an empty value included. R-1010 records an empty verdict for a malformed line. Records without the field neither authorise nor refuse. Tests cover both together. |
| MUST verdict grammar | R-969 and R-1010 define the verdict word as capital letters and hyphens, allow one parenthesised score, markdown emphasis, code marks and trailing punctuation, and record an empty verdict for anything else. Cases: `LAND-WITH-FIXES`, `LAND (9/10)`, the echoed format line, `LAND, with fixes`. |
| MUST Jake's tree decisions after build | Checkpoint 1 now sits before the build; the brief carries the R-1008 share and FEAT-008's purpose only once Jake accepts. Every new or reworded row names its subgroup home (FEAT-008 has none; FEAT-007's SUB-009 and SUB-010). |
| SHOULD R-1009 order | R-1009 refuses before resolving any reviewed revision or reading any record; an injected-runner test shows no reviewed-SHA `cat-file` or `rev-parse` on a mismatch; a mutation pair pins the order. |
| SHOULD R-976 clauses | Stated: the print-and-land clause is superseded by R-1002, whose tests take the exact-commit cases; R-976 keeps the ancestor, item, revision, plain-commit, verified-LAND and unverified cases. |

Rows now: FEAT-008 R-976, R-977, R-588 reworded, R-978 retired, R-1002–R-1007, R-1009 and R-1011
added; FEAT-007 R-969 (SUB-009), R-731, R-970, R-992 (SUB-010) reworded, R-1010 (SUB-009) and R-1008
(SUB-010) added. The product report starts at R-1012.
