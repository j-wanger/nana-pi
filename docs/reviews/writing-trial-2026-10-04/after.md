# Treated after corpus, 2026-10-04 through 2026-10-07

The extractor selects only seat sessions whose instructions attachment contains the canonical writing rule, then includes each report-sized assistant main-thread message after that attachment and within the requested EDT window. A sampled 2026-10-05 session (eddb9d32-a04d-4940-bf4f-7aa79f40ad8f) has the canonical attachment before its report at 2026-10-05T14:02:53.538Z; this is the observable treatment signal, not a file modification date or transcript mention.

| EDT day | Report-sized messages | Strict passes | Lenient passes |
|---|---:|---:|---:|
| 2026-10-04 | 3 | 2 | 2 |
| 2026-10-05 | 14 | 9 | 10 |
| 2026-10-06 | 7 | 4 | 4 |
| 2026-10-07 | 1 | 0 | 0 |
| **Total** | **25** | **15** | **16** |

The transcript scan found 21 checker tool calls across these seven treated sessions, by EDT day: 2026-10-04 1, 2026-10-05 13, and 2026-10-06 7. Counts include only Bash tool calls after the rule attachment and are separate from the 25 extracted report-sized messages.

Strict uses the committed R-747 uppercase verdict-first check. Lenient reproduces the former case-insensitive regex against only the first prose sentence. Both baseline and after were measured by the same two checks; only strict-to-strict or lenient-to-lenient comparisons are like-for-like. The after-corpus shares are 15/25 strict and 16/25 lenient; the baseline shares are 0/32 strict and 3/32 lenient. The October 5 row reproduces the audited 10/14 former-check result.

Recompute with `node docs/reviews/writing-trial-2026-10-04/extract.mjs --from 2026-10-04 --to 2026-10-07 --mode after` against the seat projects under `~/.claude/projects/`.
