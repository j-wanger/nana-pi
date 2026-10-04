# Review brief — EARS split batch A3 (reviewer: gpt-6-astra, ONE round)

Roles: Sonnet built it; you review once; the seat lands. Worktree `~/nana-pi-wt/ears-a3`, branch `feat/ears-a3`, base `main` `ef9d774`, commit `16792b5`.
Contract: `design-ruling.md` §2 and `batch0-land-ruling.md` §5. Since A2, a split row is `implemented` only with an executed, recorded red mutation (`batch-a3.json`, `"mutationRecords": true`, enforced by `apply-batch.mjs`). Your A1 and A2 reviews sit beside the mapping; their defect classes are your checklist.
A3 covers §10–13: 24 origins, 20 implemented and 3 untested new rows, and 3 merges (R-711, R-718, R-727). Off form 124 → 100. Three mutations (R-723, R-837, R-721) were verified through isolated reproductions, because the mutation hangs the full test file. The sibling-cite list is R-831, R-911 and R-914.

Do exactly this:
1. Run the verifier with `--base main` and `refusal-test.mjs`. Both must be green, and nothing may change.
2. Read every origin against its clauses. Report lost or hidden promises and dropped conditions.
3. The MERGES, first. The worker's argument was "one mutation broke all cited tests at once". That is the argument you rejected in A2: the rule is whether the promises can be broken SEPARATELY. For each merge, try to break one promise while keeping the other, and rule.
4. Check the three isolated reproductions: is each byte-faithful to its cited check? Replay at least one.
5. Mutate the sibling-cite rows. Then mutate a 20-row sample of the `implemented` split rows with seed `16792b5`: sort the IDs, take `(n * 7 + 3) mod count`, unique, filling forward (fewer if the count is under 20). Also replay one recorded mutation in five.
6. Check the 3 `untested` rows for existing assertions that pin them.
Verdict: MUST (a lost or hidden promise, a wrongly merged promise, or PARTIAL above 2 of 20) / SHOULD / NOTE with evidence; the tables; `VERDICT: LAND` or `VERDICT: BLOCK`, with a score out of 10.
