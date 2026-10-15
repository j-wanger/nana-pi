## Findings

1. **MUST — `--verify` can approve a byte-corrupted requirement row.**  
   `scripts/requirements-lift.mjs:1014` decodes the HEAD blob as UTF-8, then line 1053 compares decoded strings. Invalid ANSI bytes become U+FFFD. I reproduced a base row containing valid U+FFFD, replaced those UTF-8 bytes in the lifted HEAD row with byte `0xE9`, and committed it. `--verify <base>` exited 0 despite different bytes. This permits reviewers to approve a corrupted contract under the stated ANSI threat model. Read HEAD with `gitBuf`, validate its encoding, and compare raw output bytes.

2. **MUST — `--write` does not check the supplied grouping in every worktree.**  
   `scripts/requirements-lift.mjs:957-963` checks the mapping only in the current worktree, then scans every worktree only for the ledger. A realistic second worktree can hold uncommitted owner edits to the same grouping while `--write` exits 0 elsewhere and applies the stale committed grouping. This bypasses the brief’s write boundary and makes the HANDOFF/session claim untrue.

3. **SHOULD — A malformed cross-prefix range crashes instead of producing a named refusal.**  
   `shapeProblems` accepts a range such as `R-001–G-002`; `expandRowIds` then throws uncaught because its prefixes differ. This fails the “refusals never crash” goal, though it fails closed without writing.

Focused evidence: `requirements-lift.test.mjs` passes, but it does not cover the two blocking cases above.

VERDICT: SEND-BACK
