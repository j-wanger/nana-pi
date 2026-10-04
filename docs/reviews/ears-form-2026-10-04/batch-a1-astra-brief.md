# Review brief — EARS split batch A1 (reviewer: gpt-6-astra, ONE round)

Roles: Sonnet built it; you review once; the seat lands (batch0-land-ruling.md §5). Worktree `~/nana-pi-wt/ears-a1`, branch `feat/ears-a1`, base `main` `3d7072b`, commit `404644f`.
Contract: `docs/reviews/ears-form-2026-10-04/design-ruling.md` §2 (the split rule) and `batch0-land-ruling.md` §5 (this review's shape). The mapping is `batch-a1.json`, the verifier is `apply-batch.mjs`, and the report is `batch-a1-worker-report.md`, all in that folder of the worktree.
A1 covers REQUIREMENTS.md §1–4: 37 origins, 37 new rows R-758 to R-794 (32 implemented, 5 untested), one `merged` (R-050). Off form 194 → 157.

Do exactly this:
1. Run the verifier yourself (`node docs/reviews/ears-form-2026-10-04/apply-batch.mjs docs/reviews/ears-form-2026-10-04/batch-a1.json`). It must print all green and change nothing. Confirm with `git diff main..HEAD -- '*.test.*' '*test*'` that only `// req:` comment lines changed under test roots, and no assertion moved.
2. Read EVERY origin row as it was on main against its clauses on the branch. Report any promise that was lost, or merged so that it hides. Rule on the `merged` R-050: is it really one promise?
3. Mutate R-050's clause. Then draw a 20-row sample of the `implemented` split rows with seed `404644f`: sort the implemented split IDs, and take indexes `(n * 7 + 3) mod count` for n = 0..19, unique, filling forward. For each sampled row, break exactly the behaviour its clause states, in a disposable copy, and run the cited test. Report PINS (the cited test turns red) or PARTIAL (it stays green), with the mutation you made.
4. Check the 5 `untested` rows: does each carry the standard evidence sentence, and is untested honest? Find whether an existing assertion already pins it.
Verdict: findings ranked MUST (a lost or hidden promise, or PARTIAL above 2 of 20) / SHOULD / NOTE, with evidence; the PINS/PARTIAL table; then `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
