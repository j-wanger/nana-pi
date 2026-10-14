## Findings

- **MUST — the UTF-16 report fix remains contradicted by scope.** Section 3.3 requires changing `scripts/product-report.mjs`, but section 3.5 explicitly says to leave it unchanged, and section 4 omits it from code scope. A builder following those boundaries leaves PowerShell 5.1 UTF-16 ledgers producing successful empty reports. Remove the contradictory exclusion and add the report script to scope.

- **NOTE — the near-miss heading finding is closed.** R-1161, T15, and mutation 11c cover the hand-typed `-` case and suppress the flat-ledger guidance. Residual 8 still describes this as carried and should be removed.

VERDICT: SEND-BACK
