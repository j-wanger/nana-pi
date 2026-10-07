# Treated after corpus, 2026-10-04 through 2026-10-07

The extractor selects only seat sessions whose instructions attachment contains the canonical writing rule, then includes each report-sized assistant main-thread message after that attachment. A sampled 2026-10-05 session (eddb9d32-a04d-4940-bf4f-7aa79f40ad8f) has the canonical attachment before its report at 2026-10-05T14:02:53.538Z; this is the observable treatment signal, not a file modification date or transcript mention.

| EDT day | Report-sized messages | Strict passes | Lenient passes |
|---|---:|---:|---:|
| 2026-10-04 | 3 | 2 | 3 |
| 2026-10-05 | 14 | 9 | 11 |
| 2026-10-06 | 7 | 4 | 5 |
| 2026-10-07 | 1 | 0 | 1 |
| **Total** | **25** | **15** | **20** |

The transcript scan found 22 checker invocations across these seven treated sessions; this invocation count is separate from the 25 extracted report-sized messages.

Strict uses the committed R-747 uppercase verdict-first check. Lenient uses the committed prior case-insensitive anywhere-word check. Both baseline and after were measured by these same two checks; only the strict-to-strict or lenient-to-lenient comparison is like-for-like. The after-corpus shares are 15/25 strict and 20/25 lenient; the baseline shares are 0/32 strict and 21/32 lenient.

Recompute with `node docs/reviews/writing-trial-2026-10-04/extract.mjs --from 2026-10-04 --to 2026-10-07 --mode after` against the seat projects under `~/.claude/projects/`.
