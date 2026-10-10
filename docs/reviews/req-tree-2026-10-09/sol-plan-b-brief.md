# Review brief — req-tree increment B plan, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + compatibility)

You review a PLAN, not code. You reviewed increment 1's plan (`sol-plan-r1..r3.md`) and build
(`sol-build-r1..r3.md`); astra ruled it LAND (`astra-land-r5.md`). Before accepting, Jake asked for
three more changes: a review of all 1,009 placements, requirements shared by several features
(flagged high blast radius), and lifecycle governance for features and requirements. Do NOT re-argue
whether. Judge whether this plan is sound, bounded and verifiable.

Read in this worktree: `docs/reviews/req-tree-2026-10-09/CHANGE-B.md` (the plan), `tree-b.json`
(the frozen input: moves, statuses, also_applies, new_rows, intro_edits), `fixed-text-b.md` (the
governance text that enters the ledger), `placement-review.md` (how the moves and shares were
decided), `fable-consult-b.md` (the seat's adversarial consult and what changed). The built
increment 1 is the base: `REQUIREMENTS.md`, `scripts/requirements-tree.mjs`,
`packages/nana-pack/tests/requirements-tree.test.mjs`, `docs/reviews/req-tree-2026-10-09/prove.mjs`
and `move.mjs`, `docs/requirements-tree.md`.

## Attack
1. **Bytes and proof.** Can the extended proof (original base 6b9202a + `tree-b.json` at the
   increment-B approved commit) pass while a row is lost, altered, left in its old home, or a
   `Status:`/`Also applies:` line differs from `tree-b.json`? Does retiring `--amendment` lose any
   guarantee?
2. **The input.** Check `tree-b.json` mechanically: every base row placed once; the 17 moves match
   `placement-review.md`; every `also_applies` ID exists, is not retired, and is homed in another
   feature; statuses are well-formed; the four new rows are atomic and testable as worded.
3. **The rules.** Are R-292–R-295 enough to keep shares and statuses from rotting unseen? Is the
   governance text honest about which rules a test enforces and which only review does?
4. **Compatibility.** What reads the ledger or the outline (trace rail, `req:rows`, R-756, README
   check, code map, the tree checker itself)? Does a `Status:` or `Also applies:` line break or
   weaken any of them (e.g. an R-/G- ID at the start of a line, a table, a heading)?
5. **Scope.** Allowlist sufficient and disjoint from NOT? Any needed item missing, any item not
   needed (subtraction test)?
6. **Facts.** Counts, IDs, paths, statuses vs the repo and Jake's D4 ruling (`HANDOFF.md`,
   `docs/hardening-plan-2026-10-06.md`).

## Output
Answer with the full review as your final message; do not write it to a file. MUST / SHOULD /
NOTE with file:line, evidence (what you read or executed) and the smallest fix. Score out of 10,
then the last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`, `VERDICT: SEND-BACK`.
