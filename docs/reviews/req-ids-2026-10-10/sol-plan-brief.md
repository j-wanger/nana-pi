# Review brief — four-digit requirement IDs, plan, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + compatibility)

**Round 3 — the last allowed for this item.** Your reviews: `sol-plan-r1.md` (SEND-BACK 6), `sol-plan-r2.md` (SEND-BACK 7). Responses: `sol-plan-r1-response.md`, `sol-plan-r2-response.md` (r2 MUST 3 declined with the owner's land rule as the reason; argue it only if the reason fails). Verify each fix in `CHANGE.md` and in `seat-verify-ids.mjs` (it now exits 1 on any mismatch; on today's code it must fail). Then review the plan as a whole.

You review a PLAN. The owner asked: "ok lets first update the requirements id range to be 4 digits." Do
not re-argue whether. Read `docs/reviews/req-ids-2026-10-10/CHANGE.md` (the plan) and
`fable-consult.md` beside it (the seat's adversarial consult and what changed). This worktree is
stacked on the unmerged requirements-tree branch (`feat/req-tree`); the tree lane lands first.

## Attack
1. **Grammar and consumers.** Is `^[RG]-(?:\d{3}|[1-9]\d{3})$` right? Grep the WHOLE repo for
   anything that parses, matches, sorts or prints requirement IDs (scripts, packages, apps, templates
   including code-map and readme-check, nana-setup, skills, tests). List every consumer the plan
   misses that would still read three digits, silently weaken, or mis-sort.
2. **The near-miss rule.** Could it fire on legitimate content in nana-pi's ledger, the rendered
   template ledgers, or a project's ledger (prose, fenced examples, other tables)? Is its definition
   precise and testable? Does it change the Python rail's behaviour for a missing closing pipe in a
   way an existing project would trip over at its next update?
3. **Rows.** Are R-1000–R-1002 atomic, testable as worded, and in the right home (FEAT-028, nana-pi R
   rows) rather than Part G? Is anything pinned that no row states, or stated and not pinned?
4. **Template release.** The rail is template-owned. Does the plan's doneWhen (suite,
   `template:accept`) prove both rendered languages accept four-digit IDs and fail near-misses? What
   happens to `work-desk` and `basketball-geek`?
5. **Scope and stacking.** Allowlist sufficient and disjoint from NOT? Any risk from stacking on the
   unmerged tree branch?
6. **Facts.** Check every factual claim in the plan against the code (cite file:line).

## Output
Answer with the full review as your final message; do not write it to a file. MUST / SHOULD / NOTE
with file:line, evidence and the smallest fix. Score out of 10, then the last line exactly one of
`VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`, `VERDICT: SEND-BACK`.
