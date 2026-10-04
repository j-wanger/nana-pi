# Review brief — EARS split batch A2 (reviewer: gpt-6-astra, ONE round)

Roles: Sonnet built it; you review once; the seat lands (batch0-land-ruling.md §5). Worktree `~/nana-pi-wt/ears-a2`, branch `feat/ears-a2`, base `main` `6a2e372`, commit `6565cfe`.
Contract: `design-ruling.md` §2 and `batch0-land-ruling.md` §5. In the worktree's `docs/reviews/ears-form-2026-10-04/`: the mapping `batch-a2.json` (it records each mutation the worker ran), the verifier `apply-batch.mjs`, the report `batch-a2-worker-report.md`. A1's two review rounds sit beside them. A1's defect classes are your checklist: a cite that exercises a narrower case or a neighbouring field; an untested row that an existing assertion pins.
A2 covers REQUIREMENTS.md §5–9: 33 origins, 31 implemented and 2 untested split rows, `merged` R-142 and R-193. Off form 157 → 124. The worker resolved 9 splits by reading the code rather than by mutation; they are named in the report.

Do exactly this:
1. Run `node docs/reviews/ears-form-2026-10-04/apply-batch.mjs docs/reviews/ears-form-2026-10-04/batch-a2.json --base main`. It must be all green and change nothing.
2. Read EVERY origin as it was on main against its clauses on the branch. Report any lost or hidden promise. Rule on the two merges.
3. Mutate the 9 code-read splits FIRST. Then mutate a 20-row sample of the remaining `implemented` split rows, drawn with seed `6565cfe`: sort the IDs, take indexes `(n * 7 + 3) mod count` for n = 0..19, unique, filling forward. Report PINS or PARTIAL per row, with the mutation.
4. Check the `untested` rows and R-166 for an existing assertion that pins them.
Verdict: MUST (a lost or hidden promise, or PARTIAL above 2 of 20 in the sample) / SHOULD / NOTE with evidence; the PINS/PARTIAL tables (the code-read set and the sample, separately); then `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
