# Review brief, round 3 of 3: the edge desk on pi's built-in MCP, plus R-760 (reviewer: gpt-6-astra)

This is the LAST round for this item. Your r1 (`astra-r1.md`, BLOCK 7) and r2 (`astra-r2.md`, BLOCK 8)
are in this folder. The r2 fixes are in commit `42e7432`. The worker's account is the updated
`worker-report.md`. Same scope as `astra-brief.md`.

## Re-derive closure of each r2 item by execution

1. MUST, unreadable-folder remedies (`packages/nana-pack/lib/objective.ts` `lockProblem`/`trustRemedy`,
   new rows R-856/R-857). Re-run your three fixtures against installed pi 1.0.2:
   - a fresh unreadable non-empty folder;
   - a stale unreadable empty folder with an affirmative record;
   - a stale unreadable non-empty folder.
   Plus the acquired-lock probe. For each: is the remedy now true about what this check knows and
   what pi will do? Is the readable-case remedy byte-identical to before? Do the rows' wording match
   what the cited checks pin? Mutate each new branch and see red. Hook vs pi parity over the whole file.
2. SHOULD, pack README lock paragraph: does it match the shipped classification and remedies?
3. MUST, runbook (`worker-report.md` "Machine steps"): does quiescing the desk first close the
   transition window and the pending-writeback window you found? Is anything still unsafe in the order?

Then: any defect the r2 fixes introduced. Do not re-raise items declared in `astra-brief.md`.

## Ruling requested

At the cap, separate (a) defects that must block landing from (b) residuals to record. Give the
smallest fix for each (a), and a one-line residual for each (b).

## Output

Answer with the full review as your final message; do not write it to a file. Give ranked findings
(MUST / SHOULD / NOTE) with file:line, evidence and the smallest fix. End with `VERDICT: LAND` or
`VERDICT: BLOCK` and a score out of 10.
