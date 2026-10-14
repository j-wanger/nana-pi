## Findings

- **MUST — `scripts/requirements-tree.mjs:409,441`: fenced requirement rows are excluded from the flat-ledger count.** The trace rail counts these rows, and main’s checker reports them as misplaced. An honest flat ledger containing a fenced row now reports a smaller inventory and suppresses the misplaced-row problem. For example, one normal row plus one fenced row reports `1 requirement rows`. A user can act on that false count during the documented lift. Count every row recognized by `requirementRowId`, then separately report fenced rows as structurally invalid.

Targeted tree, report, template, trace, map, and README checks passed.

VERDICT: SEND-BACK
