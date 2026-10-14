## Findings

- **MUST — UTF-16 and empty ledgers still fail open through the product report.** The plan puts NUL and no-row checks only in the checker CLI. `buildReport()` calls `checkTree()` directly, so a PowerShell 5.1 UTF-16 ledger can produce an empty, successful report. This is a realistic Windows input and an authoritative wrong output. Move unreadable/no-row validation into the shared checker path and add report tests for UTF-16 and no-row ledgers.

- **MUST — hand-typed tree headings can be misclassified as a flat ledger.** With `-` instead of `·` in every CAP/FEAT heading, the parser recognizes rows but no structural headings. R-1159 then reports “no requirements tree yet” and directs the user toward lift/regroup rather than correcting the headings. This input is explicitly in scope and gives actionable wrong guidance. Detect near-miss tree headings before applying the flat-ledger summary, with a named test.

VERDICT: SEND-BACK
