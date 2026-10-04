# Review brief — EARS form lane, batch 0: the check (reviewer: gpt-6-astra)

Roles: Sonnet built it; you review; Fable rules on landing. Worktree `~/nana-pi-wt/ears`, branch `feat/ears-form`, base `main` `ed90650`, commit `6f21ea9`.
The contract is `docs/reviews/ears-form-2026-10-04/design-ruling.md` (Fable). The worker report is `batch0-worker-report.md` beside it. Review `git diff main..HEAD` in full.

What batch 0 claims: a one-`shall` form check with a ratchet allowance (194 after this batch) in both template rails (TypeScript, consumed by nana-pi's shim; Python), the self-tests, rows G-013 to G-022 and R-756, the declared ID-block continuations, and the Part G split (six origins). Rendered TS and Python projects catch an injected two-`shall` row.

Attack, with executed evidence:
- The check's precision: a `shall` inside a code span, a quoted name, a row's evidence column, a retired row, a table cell holding an escaped pipe, the word "shall" as part of another word, or a "Shall" at the start of a sentence. Does it count only the requirement cell?
- The ratchet: does the allowance fail the suite when the count rises AND name the rows? What happens when the count FALLS below the allowance (is the stale allowance caught, or silently loose)? Is the sealed value pinned by exactly one test?
- Both languages agree: run the TS and the Python checks on the same input set, and show their results match.
- The Part G split: is each split clause `implemented` only when a cited test pins that clause, and `untested` otherwise? Rule on the worker's placement choice (G-016 to G-022 grouped in a new section rather than after each origin) against the ruling's §2 placement rule and R-737's sequential check.
- The rendered templates: render both, run each project's own suite, and confirm a fresh project starts at allowance 0.
- Rows: EARS, one `shall` each, and each cited test pins its clause.

Verdict format: ranked findings (MUST / SHOULD / NOTE), each with file:line, evidence and the smallest fix; then `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
