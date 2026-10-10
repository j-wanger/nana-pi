# Plan review brief — the land rule, round 3, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + requirements)

Your round 2 (`sol-plan-r2.md`, SEND-BACK 5/10) found five MUSTs and two SHOULDs. The seat took
every one; `sol-plan-r2-response.md` maps each to its change in `CHANGE.md`. This is the plan's
third and last round under the cap. Re-review the whole declaration against the code.

## Attack
1. **Each round-2 finding closed**, at the plan's line, and sound against the code.
2. **New holes** the revisions opened: the R-1008 marker (what it is, who writes it, whether old
   code running from another worktree could write a marked record wrongly or an unmarked one after
   the change); the verdict grammar against real review endings in `docs/reviews/`; the narrowed
   lock promise.
3. **Anything still landable that a reviewer rejected**, beyond the §5 residuals; anything a
   legitimate land now trips on.
4. **Rows**: one `shall` each; subgroup homes; every pinned clause survives.

Rare edge cases that are not central to the rule may be named as residuals rather than MUSTs.

## Output
Answer with the full review as your final message. MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
