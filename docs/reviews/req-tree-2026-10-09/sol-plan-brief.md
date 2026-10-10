# Review brief — req-tree change declaration, 2026-10-09 (reviewer: gpt-5.6-sol)

**Round 3 — the last under the cap.** Your reviews are `sol-plan-r1.md` and `sol-plan-r2.md`;
the seat's responses are `sol-plan-r1-response.md` and `sol-plan-r2-response.md`; a second opinion
on your recurring MUST (pinning the tree) is `fable-consult-2.md`. Verify each r2 fix against the
revised `CHANGE.md`, `tree.json` and `fixed-text.md`. Your pinning MUST is now a stated choice for
the owner (CHANGE §7 decision 4, your option included) with a visibility lock (R-291) in place: if
you still hold it, argue it as a governance recommendation to the owner, and say whether anything
ELSE would make the plan unsafe to build if he chooses "visible, not pinned". Then review the plan
as a whole; new findings are welcome.

You review a PLAN, not code. Nothing is built yet. Jake (the owner) decided to reorganize
`REQUIREMENTS.md` (1,004 EARS rows) into a capability → feature → subgroup tree drafted by another
model (astra). He asked the seat to apply a new feature-based process: why first, then the plan,
then your independent review, then his agreement, then the build. Do NOT re-argue whether the tree
should exist. Judge whether this declaration is a sound, bounded, verifiable plan for it.

Read, in this worktree (`git show HEAD --stat` lists the commit):
- `docs/reviews/req-tree-2026-10-09/CHANGE.md` — the declaration under review.
- `docs/reviews/req-tree-2026-10-09/tree.json` — the tree the move reads; `mapping-astra.json` is astra's unedited draft (the diff is the declared deviations); `outline.md` — what Jake reads at checkpoint 1.
- `docs/reviews/req-tree-2026-10-09/fable-consult.md` — the seat's adversarial consult and what
  the seat changed in response.
- `docs/reviews/requirements-proposal-2026-10-09/README.md` — the seat's earlier verification of
  astra's proposal (read the correction block at its top).
- The repo itself: `REQUIREMENTS.md`, `scripts/requirement-rows.mjs`,
  `templates/typescript/template/tests/requirements-trace.ts` (the trace rail),
  `scripts/requirements-trace.mjs`, `packages/nana-pack/tests/requirements-trace.test.mjs`,
  `packages/nana-pack/tests/templates-render.test.mjs` (R-756), `packages/nana-pack/skills/requirements/SKILL.md`,
  `code-map.config.json`, `AGENTS.md`.

## Attack (roles: scope + adversarial + compatibility)

1. **Bytes.** Can the move as specified lose or alter a row, a prose line, or an Open-questions
   line while `prove.mjs` as specified still exits 0? Name the case. Run the rail's own row and
   ID regexes against edge cases if useful (read-only; scratch files outside the worktree only).
2. **Consumers.** Does anything that reads `REQUIREMENTS.md` (rail, `req:rows`, R-756 check, skill
   claims, README check, code map, startup instructions) break or silently weaken under the new
   layout? Verify by reading the code, cite file:line.
3. **The new rows and test.** Are the drafted rows atomic and testable as worded? Is there a hole
   that lets the tree decay while the suite stays green? Is anything pinned that no row states?
4. **Scope.** Is the allowlist sufficient for the doneWhen, and disjoint from the NOT list? Is any
   in-scope item unnecessary (subtraction test)? Is any needed item missing?
5. **Deviations.** Are the declared departures from astra's mapping justified and complete? Is any
   other departure implied but undeclared?
6. **Process.** Does the declaration give the owner what he needs to agree now and to accept later
   in about 15 minutes? Is any part ceremony that changes no outcome?
7. **Facts.** Check the declaration's factual claims against the repo (counts, IDs, placements,
   paths). The base is commit 5b68a91.

## Output

Answer with the full review as your final message; do not write it to a file. Rank findings
MUST / SHOULD / NOTE, each with file:line, evidence (what you read or executed) and the smallest
fix. A MUST is something that would let a row or byte be lost, break a consumer, leave the tree
able to decay unseen, or contradict the owner's decision. The last line must be exactly one of:
`VERDICT: LAND` (plan ready for the owner), `VERDICT: LAND-WITH-FIXES` (ready once the listed
fixes are made), `VERDICT: SEND-BACK` (needs another round). Add a score out of 10 before it.
