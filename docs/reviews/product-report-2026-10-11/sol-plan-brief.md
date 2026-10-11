# Plan review brief — the product report as a feature, 2026-10-11 (reviewer: gpt-5.6-sol; roles: scope + adversarial + requirements)

Review the change declaration `docs/reviews/product-report-2026-10-11/CHANGE.md` before anything is
built. Jake, 2026-10-10: "we need to make that product report a feature, and not a one time assembly
thing." Fable challenged the first draft (`fable-consult.md`); a seat workflow of four read-only
checkers and a critic fact-checked the second against the code (`factcheck.md`, critic section last),
and the plan was rewritten from its confirmed items. `prototype/` holds the hand-built page it
replaces. Read the code yourself; trust neither record.

## Attack
1. **The rows (§2).** One `shall` each (G-013), testable, non-overlapping with existing rows (trace
   rail, tree checker, writing checker, frontier); each pinnable by a test that cannot pass for the
   wrong reason.
2. **Determinism (R-1012, R-1013).** Anything that could make two runs differ — git output, sort
   order, locale, environment, the clean flag, Node versions, the template.
3. **Staleness (R-1020–R-1022).** Can an assessment stay "current" after a change that matters
   (a share added or removed, a row moved home, a purpose or status change, a row text or status
   change)? Can a CRLF or whitespace-only change mark it stale?
4. **Suite checks (R-1023–R-1025).** Do they check stamps, never the live ledger, so no other lane
   is coupled? Can a bad store pass?
5. **Reuse and layers.** The new row reader in the tree module (FEAT-028) and the ask lib in the pack
   (FEAT-002 SUB-005): right homes under the layer rules and the tree governance text; nothing
   duplicated; `nana-frontier` behaviour unchanged.
6. **Scope (subtraction test).** Is anything in §3 not needed for the outcome? Is anything needed
   missing (README contract, code map, G rules, tests' working directory)?

## Output
Answer with the full review as your final message: MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
